-- 0007_calculate_scores.sql
-- Story 2.2: Motor de cálculo — calculate_scores DB Function + trigger + RLS tightening
-- Depends on: 0002_rules_engine.sql (institutions, specialties, scoring_rules),
--             0003_curriculum_scores.sql (user_scores, user_curriculum)

-- =============================================================================
-- 1. PK fix: sentinel specialty UUID para upsert em user_scores
-- =============================================================================
-- Postgres trata NULL como distinto em PK composta, quebrando ON CONFLICT.
-- Solução: sentinel UUID '00000000-0000-0000-0000-000000000000' no lugar de NULL.

-- 1a. Inserir sentinel na tabela specialties para satisfazer FK
insert into public.specialties (id, name)
values ('00000000-0000-0000-0000-000000000000'::uuid, '__default__')
on conflict (id) do nothing;

-- 1b. Converter NULLs existentes para sentinel
update public.user_scores
  set specialty_id = '00000000-0000-0000-0000-000000000000'::uuid
  where specialty_id is null;

-- 1c. Alterar coluna: NOT NULL + DEFAULT sentinel
alter table public.user_scores
  alter column specialty_id set default '00000000-0000-0000-0000-000000000000'::uuid,
  alter column specialty_id set not null;

-- 1d. Recriar PK (drop old, create new — agora funciona com NOT NULL)
alter table public.user_scores drop constraint user_scores_pkey;
alter table public.user_scores
  add primary key (user_id, institution_id, specialty_id);

-- =============================================================================
-- 2. RLS tightening: remover policies de escrita student em user_scores
-- =============================================================================
-- Escrita passa a ser exclusiva via calculate_scores SECURITY DEFINER.

drop policy if exists "user_scores_insert_own" on public.user_scores;
drop policy if exists "user_scores_update_own" on public.user_scores;
drop policy if exists "user_scores_delete_own" on public.user_scores;

-- Manter: user_scores_select_own (leitura própria)
-- Manter: user_scores_select_admin (leitura admin, migration 0005)

-- =============================================================================
-- 3. Custom sub-function: fmabc_monitoria
-- =============================================================================
-- floor(sem/2)*1.0 + (sem%2)*0.5, cap 1.5

create or replace function public.fmabc_monitoria(p_semestres numeric)
returns numeric
language plpgsql
immutable
as $$
declare
  v_result numeric;
begin
  v_result := floor(p_semestres / 2) * 1.0 + (p_semestres::int % 2) * 0.5;
  return least(v_result, 1.5);
end;
$$;

-- =============================================================================
-- 4. Generic formula interpreter: evaluate_formula(formula jsonb, data jsonb)
-- =============================================================================
-- Despacha por formula->>'op' e retorna score parcial (numeric).
-- Suporta recursão (composite chama evaluate_formula para cada group).

create or replace function public.evaluate_formula(p_formula jsonb, p_data jsonb)
returns numeric
language plpgsql
immutable
as $$
declare
  v_op text;
  v_result numeric := 0;
  v_field text;
  v_value numeric;
  v_bool_value boolean;
  v_cap numeric;
  -- sum
  v_term jsonb;
  v_term_score numeric;
  v_override_field text;
  -- threshold/tiered
  v_brackets jsonb;
  v_bracket jsonb;
  v_aggregate jsonb;
  v_agg_fields jsonb;
  v_agg_field text;
  -- composite
  v_group jsonb;
  v_group_score numeric;
  -- any_positive / any_true_or_positive
  v_fields jsonb;
  v_field_item text;
  v_found boolean;
begin
  v_op := p_formula->>'op';

  case v_op

  -- =========================================================================
  -- SUM: soma de termos com cap total
  -- =========================================================================
  when 'sum' then
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);

    for v_term in select * from jsonb_array_elements(p_formula->'terms')
    loop
      v_field := v_term->>'field';
      v_term_score := 0;

      -- override_by: se campo referenciado é truthy, ignora este termo
      v_override_field := v_term->>'override_by';
      if v_override_field is not null then
        if coalesce((p_data->>v_override_field)::boolean, false) then
          continue;
        end if;
      end if;

      if v_term ? 'mult' then
        -- numeric field * mult
        v_value := coalesce((p_data->>v_field)::numeric, 0);
        v_term_score := v_value * (v_term->>'mult')::numeric;

      elsif v_term ? 'when_true' then
        -- boolean field → pts if true
        v_bool_value := coalesce((p_data->>v_field)::boolean, false);
        if v_bool_value then
          v_term_score := (v_term->>'when_true')::numeric;
        end if;

      elsif v_term ? 'when_gt0' then
        -- numeric field → pts if > 0
        v_value := coalesce((p_data->>v_field)::numeric, 0);
        if v_value > 0 then
          v_term_score := (v_term->>'when_gt0')::numeric;
        end if;
      end if;

      v_result := v_result + v_term_score;
    end loop;

    v_result := least(v_result, v_cap);

  -- =========================================================================
  -- THRESHOLD / TIERED: faixas exclusivas (primeira match ganha)
  -- =========================================================================
  when 'threshold', 'tiered' then
    v_field := p_formula->>'field';

    -- aggregate pre-processing: campo sintético como soma de outros
    v_aggregate := p_formula->'aggregate';
    if v_aggregate is not null and v_aggregate ? 'sum_of' then
      v_value := 0;
      for v_agg_field in select jsonb_array_elements_text(v_aggregate->'sum_of')
      loop
        v_value := v_value + coalesce((p_data->>v_agg_field)::numeric, 0);
      end loop;
    else
      -- null_policy:"zero" — tratar NULL como 0
      v_value := coalesce((p_data->>v_field)::numeric, 0);
    end if;

    -- Avaliar brackets/tiers (primeira match ganha)
    v_brackets := coalesce(p_formula->'brackets', p_formula->'tiers');
    if v_brackets is not null then
      for v_bracket in select * from jsonb_array_elements(v_brackets)
      loop
        if v_bracket ? 'gte' then
          if v_value >= (v_bracket->>'gte')::numeric then
            v_result := (v_bracket->>'pts')::numeric;
            return v_result;  -- primeira match ganha
          end if;
        elsif v_bracket ? 'gt' then
          if v_value > (v_bracket->>'gt')::numeric then
            v_result := (v_bracket->>'pts')::numeric;
            return v_result;
          end if;
        end if;
      end loop;
    end if;
    -- nenhuma match → 0

  -- =========================================================================
  -- BOOL: flag booleana {field, pts_true}
  -- =========================================================================
  when 'bool' then
    v_field := p_formula->>'field';
    v_bool_value := coalesce((p_data->>v_field)::boolean, false);
    if v_bool_value then
      v_result := (p_formula->>'pts_true')::numeric;
    end if;

  -- =========================================================================
  -- COMPOSITE: groups[] independentes com cap total externo
  -- =========================================================================
  when 'composite' then
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);

    for v_group in select * from jsonb_array_elements(p_formula->'groups')
    loop
      v_group_score := public.evaluate_formula(v_group, p_data);
      v_result := v_result + v_group_score;
    end loop;

    v_result := least(v_result, v_cap);

  -- =========================================================================
  -- CUSTOM: despacho para sub-função PL/pgSQL nomeada
  -- =========================================================================
  when 'custom' then
    v_field := p_formula->>'field';
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    v_value := coalesce((p_data->>v_field)::numeric, 0);

    case p_formula->>'fn'
      when 'fmabc_monitoria' then
        v_result := public.fmabc_monitoria(v_value);
      else
        raise warning 'Unknown custom function: %', p_formula->>'fn';
        v_result := 0;
    end case;

    v_result := least(v_result, v_cap);

  -- =========================================================================
  -- RUF_BRANCH: tri-state {field, pts_true, pts_false, pts_null}
  -- =========================================================================
  when 'ruf_branch' then
    v_field := p_formula->>'field';

    if p_data ? v_field and p_data->>v_field is not null then
      v_bool_value := (p_data->>v_field)::boolean;
      if v_bool_value then
        v_result := coalesce((p_formula->>'pts_true')::numeric, 0);
      else
        v_result := coalesce((p_formula->>'pts_false')::numeric, 0);
      end if;
    else
      v_result := coalesce((p_formula->>'pts_null')::numeric, 0);
    end if;

  -- =========================================================================
  -- FLOOR_DIV: {field, divisor, mult} → floor(field/divisor) * mult
  -- =========================================================================
  when 'floor_div' then
    v_field := p_formula->>'field';
    v_value := coalesce((p_data->>v_field)::numeric, 0);
    -- Guard: divisor ausente ou zero retorna 0 (evita division by zero)
    if coalesce((p_formula->>'divisor')::numeric, 0) = 0 then
      v_result := 0;
    else
      v_result := floor(v_value / (p_formula->>'divisor')::numeric) * (p_formula->>'mult')::numeric;
    end if;

  -- =========================================================================
  -- ANY_POSITIVE: retorna pts se qualquer fields[] > 0
  -- =========================================================================
  when 'any_positive' then
    v_fields := p_formula->'fields';
    v_found := false;

    for v_field_item in select jsonb_array_elements_text(v_fields)
    loop
      if coalesce((p_data->>v_field_item)::numeric, 0) > 0 then
        v_found := true;
        exit;
      end if;
    end loop;

    if v_found then
      v_result := (p_formula->>'pts')::numeric;
    end if;

  -- =========================================================================
  -- ANY_TRUE_OR_POSITIVE: pts se qualquer fields_true[] true OU fields_positive[] > 0
  -- =========================================================================
  when 'any_true_or_positive' then
    v_found := false;

    -- Check boolean fields
    v_fields := p_formula->'fields_true';
    if v_fields is not null then
      for v_field_item in select jsonb_array_elements_text(v_fields)
      loop
        if coalesce((p_data->>v_field_item)::boolean, false) then
          v_found := true;
          exit;
        end if;
      end loop;
    end if;

    -- Check positive numeric fields
    if not v_found then
      v_fields := p_formula->'fields_positive';
      if v_fields is not null then
        for v_field_item in select jsonb_array_elements_text(v_fields)
        loop
          if coalesce((p_data->>v_field_item)::numeric, 0) > 0 then
            v_found := true;
            exit;
          end if;
        end loop;
      end if;
    end if;

    if v_found then
      v_result := (p_formula->>'pts')::numeric;
    end if;

  else
    raise warning 'Unknown formula operator: %', v_op;
    v_result := 0;
  end case;

  return v_result;
end;
$$;

-- =============================================================================
-- 5. Main function: calculate_scores(p_user_id, p_specialty_id)
-- =============================================================================
-- SECURITY DEFINER: executa com owner privileges (bypassa RLS para escrita).
-- RLS interna: valida auth.uid() = p_user_id.

create or replace function public.calculate_scores(
  p_user_id uuid,
  p_specialty_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_data jsonb;
  v_rule record;
  v_score numeric;
  v_total_score numeric;
  v_total_max numeric;
  v_breakdown jsonb;
  v_current_inst uuid;
  v_effective_specialty uuid;
  v_sentinel uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  -- RLS interna: apenas o próprio usuário pode calcular seus scores
  if auth.uid() != p_user_id then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  -- Ler dados do currículo
  select data into v_data
    from public.user_curriculum
    where user_id = p_user_id;

  -- Se não tem currículo, usar objeto vazio
  v_data := coalesce(v_data, '{}'::jsonb);

  -- Specialty efetiva para user_scores (sentinel se NULL)
  v_effective_specialty := coalesce(p_specialty_id, v_sentinel);

  -- Iterar por instituição
  -- ORDER BY garante ordem determinística (previne deadlock em chamadas concorrentes)
  for v_current_inst in
    select distinct institution_id from public.scoring_rules order by institution_id
  loop
    v_total_score := 0;
    v_total_max := 0;
    v_breakdown := '{}'::jsonb;

    -- Buscar regras aplicáveis: specialty-specific com fallback para default (NULL)
    -- DISTINCT ON (field_key) com ORDER BY specialty_id NULLS LAST prioriza specialty-specific
    for v_rule in
      select distinct on (field_key)
        id, field_key, max_points, description, formula, specialty_id
      from public.scoring_rules
      where institution_id = v_current_inst
        and (specialty_id = p_specialty_id or specialty_id is null)
      order by field_key, specialty_id nulls last
    loop
      v_score := public.evaluate_formula(v_rule.formula, v_data);
      -- Cap score individual por max_points da regra
      v_score := least(v_score, v_rule.max_points);
      -- Garantir não-negativo
      v_score := greatest(v_score, 0);

      v_total_score := v_total_score + v_score;
      v_total_max := v_total_max + v_rule.max_points;

      -- Adicionar ao breakdown
      v_breakdown := v_breakdown || jsonb_build_object(
        v_rule.field_key,
        jsonb_build_object(
          'score', v_score,
          'max', v_rule.max_points,
          'description', coalesce(v_rule.description, '')
        )
      );
    end loop;

    -- Cap total: score não pode exceder max_score da instituição
    v_total_score := least(v_total_score, v_total_max);

    -- Upsert em user_scores
    insert into public.user_scores (
      user_id, institution_id, specialty_id,
      score, max_score, breakdown, stale, calculated_at
    ) values (
      p_user_id, v_current_inst, v_effective_specialty,
      v_total_score, v_total_max, v_breakdown, false, now()
    )
    on conflict (user_id, institution_id, specialty_id)
    do update set
      score = excluded.score,
      max_score = excluded.max_score,
      breakdown = excluded.breakdown,
      stale = false,
      calculated_at = now();
  end loop;
end;
$$;

-- Restringir EXECUTE: apenas authenticated
revoke execute on function public.calculate_scores(uuid, uuid) from public;
grant execute on function public.calculate_scores(uuid, uuid) to authenticated;

-- =============================================================================
-- 6. Trigger: mark_scores_stale on scoring_rules change
-- =============================================================================

create or replace function public.mark_scores_stale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_institution_id uuid;
  v_specialty_id uuid;
  v_sentinel uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  -- Determinar institution_id e specialty_id afetadas (cobrir DELETE com OLD)
  if tg_op = 'DELETE' then
    v_institution_id := OLD.institution_id;
    v_specialty_id := OLD.specialty_id;
  else
    v_institution_id := NEW.institution_id;
    v_specialty_id := NEW.specialty_id;
  end if;

  if v_specialty_id is not null then
    -- Regra com specialty específica: marcar stale apenas scores daquela specialty
    update public.user_scores
      set stale = true
      where institution_id = v_institution_id
        and specialty_id = coalesce(v_specialty_id, v_sentinel);
  else
    -- Regra default (specialty IS NULL): marcar stale TODOS os scores da institution
    update public.user_scores
      set stale = true
      where institution_id = v_institution_id;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

create trigger on_scoring_rule_changed
  after insert or update or delete on public.scoring_rules
  for each row execute function public.mark_scores_stale();
