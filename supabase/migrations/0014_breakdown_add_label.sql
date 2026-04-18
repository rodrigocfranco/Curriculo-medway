-- 0014_breakdown_add_label.sql
-- Incluir label do curriculum_fields no breakdown para nome bonito consistente
-- Antes:  { field_key: { score, max, description, category } }
-- Depois: { field_key: { score, max, description, category, label } }

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
  for v_current_inst in
    select distinct institution_id from public.scoring_rules order by institution_id
  loop
    v_total_score := 0;
    v_total_max := 0;
    v_breakdown := '{}'::jsonb;

    -- JOIN com curriculum_fields para trazer o label (nome bonito)
    -- Se curriculum_fields não tem o field_key, label fica NULL (fallback no jsonb)
    for v_rule in
      select distinct on (sr.field_key)
        sr.id,
        sr.field_key,
        sr.category,
        sr.max_points,
        sr.description,
        sr.formula,
        sr.specialty_id,
        cf.label as field_label
      from public.scoring_rules sr
      left join public.curriculum_fields cf on cf.field_key = sr.field_key
      where sr.institution_id = v_current_inst
        and (sr.specialty_id = p_specialty_id or sr.specialty_id is null)
      order by sr.field_key, sr.specialty_id nulls last
    loop
      v_score := public.evaluate_formula(v_rule.formula, v_data);
      v_score := least(v_score, v_rule.max_points);
      v_score := greatest(v_score, 0);

      v_total_score := v_total_score + v_score;
      v_total_max := v_total_max + v_rule.max_points;

      v_breakdown := v_breakdown || jsonb_build_object(
        v_rule.field_key,
        jsonb_build_object(
          'score', v_score,
          'max', v_rule.max_points,
          'description', coalesce(v_rule.description, ''),
          'category', coalesce(v_rule.category, ''),
          'label', coalesce(v_rule.field_label, v_rule.field_key)
        )
      );
    end loop;

    v_total_score := least(v_total_score, v_total_max);

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

-- Forçar recálculo para popular label no breakdown
update public.user_scores set stale = true;
