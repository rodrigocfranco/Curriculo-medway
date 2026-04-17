-- Story 2.2: testes pgTAP para calculate_scores + trigger + RLS tightening
begin;
create extension if not exists pgtap;
select plan(27);

-- =============================================================================
-- Setup: criar usuário de teste + currículo
-- =============================================================================

-- Inserir auth user
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role, instance_id, created_at, updated_at, confirmation_token, email_confirmed_at)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pgtap@test.com',
  '{"provider":"email","providers":["email"]}', '{"name":"pgTAP User"}',
  'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000',
  now(), now(), '', now())
on conflict (id) do nothing;

insert into public.profiles (id, name, email)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pgTAP User', 'pgtap@test.com')
on conflict (id) do nothing;

-- =============================================================================
-- Test 1: currículo vazio → score = 0 para todas as instituições
-- =============================================================================

insert into public.user_curriculum (user_id, data)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}'::jsonb)
on conflict (user_id) do update set data = '{}'::jsonb;

-- Simular auth.uid()
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select public.calculate_scores('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, null);

select is(
  (select count(*) from public.user_scores where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  11::bigint,
  'Test 1a: currículo vazio gera scores para 11 instituições'
);

select is(
  (select sum(score) from public.user_scores where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0::numeric,
  'Test 1b: currículo vazio → score total = 0'
);

select ok(
  (select bool_and(stale = false) from public.user_scores where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Test 1c: todos os scores marcados stale=false após cálculo'
);

select ok(
  (select bool_and(calculated_at is not null) from public.user_scores where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Test 1d: todos os scores têm calculated_at'
);

-- =============================================================================
-- Test 2: currículo preenchido → validar score exato UNICAMP e PSU-MG
-- =============================================================================

update public.user_curriculum set data = '{
  "ic_com_bolsa": 2, "ic_sem_bolsa": 1,
  "artigos_high_impact": 3, "artigos_mid_impact": 1, "artigos_nacionais": 2,
  "artigos_low_impact": 1,
  "apresentacao_congresso": 4, "voluntariado_horas": 100, "diretoria_ligas": 1,
  "membro_liga_anos": 2, "monitoria_semestres": 3, "cursos_suporte": 2,
  "ingles_fluente": true, "internato_hospital_ensino": true, "mestrado": true,
  "doutorado": false, "extensao_semestres": 2, "ranking_ruf_top35": true,
  "media_geral": 85, "projeto_rondon": true, "representante_turma_anos": 1,
  "estagio_extracurricular_horas": 200, "trabalho_sus_meses": 12,
  "ic_horas_totais": 300, "ouvinte_congresso": 5, "teste_progresso": 4,
  "organizador_evento": 2
}'::jsonb
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select public.calculate_scores('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, null);

-- UNICAMP cálculo manual:
-- ic: min(2*20+1*10, 20) = 20
-- publicacoes: min(3*10+1*5+2*2, 15) = 15
-- apresentacao_congresso: min(4*2.5, 10) = 10
-- voluntariado: 100 >= 96 → 5
-- ligas: min(1*5+2*2, 5) = 5
-- monitoria: 3 > 2 → 5
-- cursos_suporte: min(2*2.5, 5) = 5
-- ingles_fluente: true → 10
-- formacao: internato(10) + mestrado(10, override doutorado=false → ok) + doutorado(false → 0) = min(20, 25) = 20
-- Total: 20+15+10+5+5+5+5+10+20 = 95 / max 100
select is(
  (select us.score from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and i.name = 'UNICAMP'
      and us.specialty_id = '00000000-0000-0000-0000-000000000000'),
  95.0::numeric,
  'Test 2a: UNICAMP score = 95 (base 100)'
);

select is(
  (select us.max_score from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and i.name = 'UNICAMP'
      and us.specialty_id = '00000000-0000-0000-0000-000000000000'),
  100::numeric,
  'Test 2b: UNICAMP max_score = 100'
);

-- PSU-MG cálculo manual:
-- historico: 85 >= 85 → 1.5
-- ic: min(2*0.5+1*0.3, 2.0) = 1.3
-- publicacoes: min(3*0.7+1*0.7+1*0.7+2*0.7, 2.0) = min(4.9, 2.0) = 2.0
-- monitoria: 3 >= 1 → 1.0
-- ligas_ext: min(2*0.8+1*0.3+2*0.7, 4.0) = min(3.3, 4.0) = 3.3
-- estagio: 200 >= 180 → 1.0
-- idiomas: min(ingles(1.5)+cursos(2*0.7), 2.5) = min(2.9, 2.5) = 2.5
-- Total: 1.5+1.3+2.0+1.0+3.3+1.0+2.5 = 12.6 / max 14.0
select is(
  (select us.score from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and i.name = 'PSU-MG'
      and us.specialty_id = '00000000-0000-0000-0000-000000000000'),
  12.6::numeric,
  'Test 2c: PSU-MG score = 12.6 (base 10)'
);

select is(
  (select us.max_score from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and i.name = 'PSU-MG'
      and us.specialty_id = '00000000-0000-0000-0000-000000000000'),
  14.0::numeric,
  'Test 2d: PSU-MG max_score = 14.0'
);

-- Validar breakdown JSONB não vazio para UNICAMP
select ok(
  (select us.breakdown != '{}'::jsonb from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and i.name = 'UNICAMP'
      and us.specialty_id = '00000000-0000-0000-0000-000000000000'),
  'Test 2e: UNICAMP breakdown JSONB não vazio'
);

-- Validar breakdown contém field_key esperadas
select ok(
  (select us.breakdown ? 'ic' and us.breakdown ? 'publicacoes' and us.breakdown ? 'formacao'
    from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and i.name = 'UNICAMP'
      and us.specialty_id = '00000000-0000-0000-0000-000000000000'),
  'Test 2f: UNICAMP breakdown contém ic, publicacoes, formacao'
);

-- =============================================================================
-- Test 3: specialty-specific rule override
-- =============================================================================

-- Criar specialty de teste
insert into public.specialties (id, name)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cirurgia Geral')
on conflict (name) do update set id = excluded.id;

-- Criar regra specialty-specific para UNICAMP ic: override com 30 max_points
insert into public.scoring_rules (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values (
  (select id from public.institutions where name = 'UNICAMP'),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Pesquisa', 'ic', 30, 30,
  'Specialty override: 30 max',
  '{"op":"sum","caps":{"total":30},"terms":[{"field":"ic_com_bolsa","mult":25},{"field":"ic_sem_bolsa","mult":15}]}'::jsonb
) on conflict (institution_id, specialty_id, field_key) do update
  set max_points = excluded.max_points,
      formula = excluded.formula;

-- Calcular com specialty
select public.calculate_scores('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

-- ic com specialty: min(2*25+1*15, 30) = min(65, 30) = 30 (em vez de 20)
-- Demais regras caem para default (specialty IS NULL)
-- Total UNICAMP c/ specialty: 30+15+10+5+5+5+5+10+20 = 105 → capped by max(30+15+10+5+5+5+5+10+25) = 110
select ok(
  (select us.score > 95 from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and i.name = 'UNICAMP'
      and us.specialty_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'Test 3a: specialty-specific rule override gera score maior que default'
);

-- Score com specialty deve ter ic com max 30 (não 20)
select is(
  (select (us.breakdown->'ic'->>'max')::numeric from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and i.name = 'UNICAMP'
      and us.specialty_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  30::numeric,
  'Test 3b: breakdown.ic.max = 30 com specialty override'
);

-- =============================================================================
-- Test 4: trigger mark_scores_stale
-- =============================================================================

-- Recalcular para limpar stale
select public.calculate_scores('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, null);

-- Verificar que UNICAMP default não está stale
select ok(
  (select not us.stale from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and i.name = 'UNICAMP'
      and us.specialty_id = '00000000-0000-0000-0000-000000000000'),
  'Test 4a: UNICAMP score stale=false antes de trigger'
);

-- Alterar regra de UNICAMP (default rule)
update public.scoring_rules
set max_points = 25
where institution_id = (select id from institutions where name = 'UNICAMP')
  and field_key = 'ic'
  and specialty_id is null;

-- Verificar que TODOS os scores da UNICAMP ficaram stale (regra default afeta todos)
select ok(
  (select us.stale from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and i.name = 'UNICAMP'
      and us.specialty_id = '00000000-0000-0000-0000-000000000000'),
  'Test 4b: UNICAMP score stale=true após alterar regra default'
);

-- Verificar que scores de outra instituição NÃO ficaram stale
select ok(
  (select not us.stale from public.user_scores us
    join public.institutions i on i.id = us.institution_id
    where us.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and i.name = 'PSU-MG'
      and us.specialty_id = '00000000-0000-0000-0000-000000000000'),
  'Test 4c: PSU-MG score permanece stale=false'
);

-- Restaurar valor original
update public.scoring_rules
set max_points = 20
where institution_id = (select id from institutions where name = 'UNICAMP')
  and field_key = 'ic'
  and specialty_id is null;

-- =============================================================================
-- Test 5: fmabc_monitoria custom function
-- =============================================================================

select is(public.fmabc_monitoria(0), 0.0::numeric, 'Test 5a: fmabc_monitoria(0) = 0.0');
select is(public.fmabc_monitoria(1), 0.5::numeric, 'Test 5b: fmabc_monitoria(1) = 0.5');
select is(public.fmabc_monitoria(2), 1.0::numeric, 'Test 5c: fmabc_monitoria(2) = 1.0');
select is(public.fmabc_monitoria(3), 1.5::numeric, 'Test 5d: fmabc_monitoria(3) = 1.5');
select is(public.fmabc_monitoria(4), 1.5::numeric, 'Test 5e: fmabc_monitoria(4) = 1.5 (cap)');

-- =============================================================================
-- Test 6: NFR3 — performance < 1s para 11 instituições × 1 aluno
-- =============================================================================

select ok(
  (select (t2 - t1) < interval '1 second'
    from (
      select clock_timestamp() as t1
    ) a,
    lateral (
      select public.calculate_scores('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, null)
    ) b,
    lateral (
      select clock_timestamp() as t2
    ) c
  ),
  'Test 6: calculate_scores < 1s para 11 instituições × 1 aluno (NFR3)'
);

-- =============================================================================
-- Test 7: RLS — aluno não pode calcular scores de outro user (AC2)
-- =============================================================================

-- Criar segundo user
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role, instance_id, created_at, updated_at, confirmation_token, email_confirmed_at)
values ('bbbbbbbb-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'other@test.com',
  '{"provider":"email","providers":["email"]}', '{"name":"Other User"}',
  'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000',
  now(), now(), '', now())
on conflict (id) do nothing;

-- JWT continua sendo do user original (aaaaaaaa-...)
-- Tentar calcular scores do outro user deve lançar exception
select throws_ok(
  $$select public.calculate_scores('bbbbbbbb-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, null)$$,
  '42501',
  'unauthorized',
  'Test 7: aluno não pode calcular scores de outro user (AC2 RLS)'
);

-- =============================================================================
-- Structural tests: functions and policies
-- =============================================================================

select has_function('public', 'calculate_scores', array['uuid','uuid'], 'calculate_scores function exists');
select has_function('public', 'evaluate_formula', array['jsonb','jsonb'], 'evaluate_formula function exists');
select has_function('public', 'fmabc_monitoria', array['numeric'], 'fmabc_monitoria function exists');
select has_function('public', 'mark_scores_stale', 'mark_scores_stale trigger function exists');
select has_trigger('public', 'scoring_rules', 'on_scoring_rule_changed', 'trigger on_scoring_rule_changed exists');

select * from finish();
rollback;
