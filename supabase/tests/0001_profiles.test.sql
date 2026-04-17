-- Story 1.3: testes pgTAP para schema profiles + trigger handle_new_user + RLS
begin;
create extension if not exists pgtap;
select plan(15);

-- -----------------------------------------------------------------------------
-- AC1: Schema
-- -----------------------------------------------------------------------------
select has_table('public','profiles','profiles table exists');
select has_column('public','profiles','role','profiles.role exists');
select col_has_check('public','profiles','role','role has CHECK constraint');
select col_not_null('public','profiles','name','name is NOT NULL');
select col_not_null('public','profiles','email','email is NOT NULL');

-- -----------------------------------------------------------------------------
-- AC1: trigger handle_new_user popula profiles a partir de raw_user_meta_data
-- -----------------------------------------------------------------------------
select has_trigger('auth','users','on_auth_user_created','trigger on_auth_user_created exists on auth.users');

insert into auth.users (id, email, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'aluno1@test.com',
  jsonb_build_object(
    'name','Aluno Um','phone','(11) 90000-0001','state','SP',
    'university','USP','graduation_year','2027','specialty_interest','Clínica'
  )
);

select is(
  (select name from public.profiles where id='00000000-0000-0000-0000-000000000001'),
  'Aluno Um',
  'handle_new_user copied name from raw_user_meta_data'
);

select is(
  (select graduation_year from public.profiles where id='00000000-0000-0000-0000-000000000001'),
  2027,
  'handle_new_user cast graduation_year string to int'
);

-- Segundo usuário (usaremos como admin depois)
insert into auth.users (id, email, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'admin1@test.com',
  jsonb_build_object('name','Admin Um')
);

-- -----------------------------------------------------------------------------
-- AC2: RLS habilitada + forçada
-- -----------------------------------------------------------------------------
select is(
  (select relrowsecurity from pg_class where relname='profiles' and relnamespace='public'::regnamespace),
  true,
  'RLS habilitada em public.profiles'
);
select is(
  (select relforcerowsecurity from pg_class where relname='profiles' and relnamespace='public'::regnamespace),
  true,
  'RLS forçada em public.profiles'
);

-- -----------------------------------------------------------------------------
-- AC2/AC3: 4 policies (select, update student preserve role, update admin, delete)
-- -----------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_policies where schemaname='public' and tablename='profiles'),
  4,
  'four RLS policies defined on profiles'
);

-- -----------------------------------------------------------------------------
-- AC2: student autenticado só enxerga a própria linha
-- -----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';

-- Sanity check: sem auth.uid() resolvendo, asserções RLS abaixo dariam falso verde.
select is(
  auth.uid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'auth.uid() resolves from request.jwt.claims.sub'
);

select is(
  (select count(*)::int from public.profiles),
  1,
  'student (authenticated) sees only own row under RLS'
);

-- -----------------------------------------------------------------------------
-- AC2: student não consegue escalonar role para admin
-- -----------------------------------------------------------------------------
select throws_ok(
  $$update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'student cannot escalate own role (WITH CHECK blocks)'
);

reset role;
-- Limpa JWT antes da promoção admin de setup; sem isso, auth.uid() ainda
-- apontaria para o student-1 e o trigger trg_prevent_role_escalation abortaria.
set local "request.jwt.claims" to '';

-- -----------------------------------------------------------------------------
-- AC3: admin (via role='admin' no profile) enxerga todos os registros
-- -----------------------------------------------------------------------------
update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000002';

set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';

-- Admin vê pelo menos as 2 rows criadas neste teste (pode haver mais de seeds/outras stories)
select ok(
  (select count(*)::int from public.profiles) >= 2,
  'admin sees all rows under RLS (at least the 2 test-created profiles)'
);

reset role;

select * from finish();
rollback;
