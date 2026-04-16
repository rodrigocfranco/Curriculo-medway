-- Story 1.10: testes pgTAP para curriculum_fields + user_curriculum + user_scores + RLS + seed 29 fields
begin;
create extension if not exists pgtap;
select plan(28);
-- 26 asserções estruturais + RLS + 2 positivo admin em curriculum_fields = 28

-- -----------------------------------------------------------------------------
-- AC1: Schema das 3 tabelas
-- -----------------------------------------------------------------------------
select has_table('public','curriculum_fields','curriculum_fields table exists');
select has_table('public','user_curriculum','user_curriculum table exists');
select has_table('public','user_scores','user_scores table exists');

select col_has_check('public','curriculum_fields','field_type','field_type has CHECK constraint');
select col_is_unique('public','curriculum_fields',array['field_key'],'curriculum_fields.field_key is unique');

-- PK composta user_scores
select has_pk('public','user_scores','user_scores has primary key');
select col_is_pk(
  'public','user_scores',
  array['user_id','institution_id','specialty_id'],
  'user_scores PK is (user_id, institution_id, specialty_id)'
);

-- Índices esperados
select has_index('public','curriculum_fields','idx_curriculum_fields_display_order','display_order index');
select has_index('public','user_scores','idx_user_scores_user_id','user_scores.user_id index');
select has_index('public','user_scores','idx_user_scores_institution','user_scores institution+specialty index');

-- Trigger updated_at reutilizando set_updated_at()
select has_trigger('public','user_curriculum','trg_user_curriculum_set_updated_at','updated_at trigger on user_curriculum');

-- -----------------------------------------------------------------------------
-- AC2: RLS habilitada + forçada nas 3 tabelas
-- -----------------------------------------------------------------------------
select is(
  (select relforcerowsecurity from pg_class where relname='curriculum_fields' and relnamespace='public'::regnamespace),
  true,
  'curriculum_fields has force rls'
);
select is(
  (select relforcerowsecurity from pg_class where relname='user_curriculum' and relnamespace='public'::regnamespace),
  true,
  'user_curriculum has force rls'
);
select is(
  (select relforcerowsecurity from pg_class where relname='user_scores' and relnamespace='public'::regnamespace),
  true,
  'user_scores has force rls'
);

-- -----------------------------------------------------------------------------
-- AC3: seed carregou exatamente 29 fields distribuídos nas 5 categorias
-- -----------------------------------------------------------------------------
select is(
  (select count(*) from public.curriculum_fields),
  29::bigint,
  'seed has 29 curriculum fields'
);
select is(
  (select count(distinct category) from public.curriculum_fields),
  5::bigint,
  'seed has 5 distinct categories'
);
select is(
  (select count(*) from public.curriculum_fields where field_type = 'boolean'),
  6::bigint,
  '6 boolean fields (rondon, internato, ingles, ruf, mestrado, doutorado)'
);
select is(
  (select count(*) from public.curriculum_fields where field_type = 'select'),
  1::bigint,
  '1 select field (conceito_historico)'
);
select is(
  (select options from public.curriculum_fields where field_key = 'conceito_historico'),
  '["A","B","C"]'::jsonb,
  'conceito_historico options is ["A","B","C"]'
);

-- -----------------------------------------------------------------------------
-- AC2 funcional: isolamento entre alunos em user_curriculum
-- -----------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000a01'::uuid,'aluno-a@test.com',jsonb_build_object('name','Aluno A')),
  ('00000000-0000-0000-0000-000000000a02'::uuid,'aluno-b@test.com',jsonb_build_object('name','Aluno B'));

-- Aluno A insere currículo próprio (via JWT sub = A)
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated"}';

insert into public.user_curriculum (user_id, data)
  values ('00000000-0000-0000-0000-000000000a01'::uuid, '{"media_geral":9.5}'::jsonb);

select is(
  (select count(*) from public.user_curriculum),
  1::bigint,
  'aluno A sees own curriculum only'
);

-- WITH CHECK impede aluno A de inserir para aluno B
select throws_ok(
  $$insert into public.user_curriculum (user_id, data) values ('00000000-0000-0000-0000-000000000a02'::uuid, '{}'::jsonb)$$,
  '42501',
  null,
  'aluno A cannot insert curriculum for aluno B (WITH CHECK blocks)'
);

reset role;
set local "request.jwt.claims" to '';

-- Aluno B consulta: vê zero linhas (a de A está isolada)
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000a02","role":"authenticated"}';
select is(
  (select count(*) from public.user_curriculum),
  0::bigint,
  'aluno B sees zero rows (isolation enforced)'
);
reset role;
set local "request.jwt.claims" to '';

-- -----------------------------------------------------------------------------
-- AC2: curriculum_fields escrita bloqueada para não-admin
-- -----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000a01","role":"authenticated"}';
select throws_ok(
  $$insert into public.curriculum_fields (category, field_key, label, field_type) values ('X','hacker','Hack','number')$$,
  '42501',
  null,
  'student cannot insert curriculum_fields (is_admin required)'
);
reset role;
set local "request.jwt.claims" to '';

-- AC2: curriculum_fields leitura anônima OK
set local role anon;
select is(
  (select count(*) from public.curriculum_fields),
  29::bigint,
  'anon reads 29 curriculum_fields (public catalog)'
);
reset role;

-- AC2: admin (profile.role='admin') consegue INSERT em curriculum_fields (caminho positivo)
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000ad'::uuid,'admin@test.com',jsonb_build_object('name','Admin'));
update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000ad'::uuid;

set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000ad","role":"authenticated"}';
select lives_ok(
  $$insert into public.curriculum_fields (category, field_key, label, field_type, display_order) values ('Extra','admin_inserted_field','Campo inserido por admin','number',999)$$,
  'admin can insert curriculum_fields (positive path)'
);
select is(
  (select count(*) from public.curriculum_fields where field_key='admin_inserted_field'),
  1::bigint,
  'admin-inserted field is persisted'
);
reset role;
set local "request.jwt.claims" to '';

-- -----------------------------------------------------------------------------
-- AC3: idempotência do seed — reaplicar não duplica
-- -----------------------------------------------------------------------------
insert into public.curriculum_fields (category, field_key, label, field_type, display_order) values
  ('Perfil','doutorado','Doutorado (label atualizado)','boolean',99)
on conflict (field_key) do update set
  label = excluded.label,
  display_order = excluded.display_order;

select is(
  (select count(*) from public.curriculum_fields where field_key = 'doutorado'),
  1::bigint,
  'seed upsert remains idempotent'
);
select is(
  (select label from public.curriculum_fields where field_key = 'doutorado'),
  'Doutorado (label atualizado)',
  'ON CONFLICT updates label'
);

select finish();
rollback;
