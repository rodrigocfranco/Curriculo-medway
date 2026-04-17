-- Story 1.9: testes pgTAP para schema rules engine + RLS + seed 11 instituições
begin;
create extension if not exists pgtap;
select plan(28);

-- -----------------------------------------------------------------------------
-- AC1: Schema das 3 tabelas + colunas críticas
-- -----------------------------------------------------------------------------
select has_table('public','institutions','institutions table exists');
select has_table('public','specialties','specialties table exists');
select has_table('public','scoring_rules','scoring_rules table exists');

select col_is_unique('public','institutions',array['name'],'institutions.name is unique');
select has_column('public','scoring_rules','formula','scoring_rules.formula exists');
select col_is_fk('public','scoring_rules','institution_id','institution_id is FK');
select col_has_check('public','scoring_rules',array['weight','max_points'],'weight/max_points CHECK present');

-- Valida identidade exata da constraint (evita falso-verde se trocada)
select is(
  (select count(*)::int from pg_constraint
     where conrelid='public.scoring_rules'::regclass
       and conname='scoring_rules_weight_bounds_chk'
       and contype='c'),
  1,
  'scoring_rules_weight_bounds_chk constraint exists by name'
);

-- -----------------------------------------------------------------------------
-- AC1: índices esperados
-- -----------------------------------------------------------------------------
select has_index('public','scoring_rules','idx_scoring_rules_institution_id','institution_id index');
select has_index('public','scoring_rules','idx_scoring_rules_specialty_id','specialty_id index');
select has_index('public','scoring_rules','idx_scoring_rules_default_unique','partial unique index for specialty_id IS NULL upserts');

-- -----------------------------------------------------------------------------
-- AC2: RLS habilitada + forçada nas 3 tabelas
-- -----------------------------------------------------------------------------
select is(
  (select relforcerowsecurity from pg_class where relname='institutions' and relnamespace='public'::regnamespace),
  true,
  'institutions has force rls'
);
select is(
  (select relforcerowsecurity from pg_class where relname='specialties' and relnamespace='public'::regnamespace),
  true,
  'specialties has force rls'
);
select is(
  (select relforcerowsecurity from pg_class where relname='scoring_rules' and relnamespace='public'::regnamespace),
  true,
  'scoring_rules has force rls'
);

-- -----------------------------------------------------------------------------
-- AC2: SELECT anônimo lê institutions (seed já aplicado pelo db reset)
-- -----------------------------------------------------------------------------
set local role anon;
select is(
  (select count(*) from public.institutions),
  11::bigint,
  'anon reads all 11 institutions'
);

-- AC2: anon INSERT em institutions falha por RLS
select throws_ok(
  $$insert into public.institutions (name) values ('hacker')$$,
  '42501',
  null,
  'anon cannot insert institutions'
);

-- AC2: anon UPDATE/DELETE em institutions afeta 0 linhas (RLS filtra silenciosamente;
-- sem policy for update/delete to anon, o USING retorna false para todas as linhas).
do $$
declare
  affected int;
begin
  update public.institutions set short_name = 'pwned';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'anon UPDATE should affect 0 rows, got %', affected;
  end if;
end $$;
select pass('anon UPDATE on institutions silently affects 0 rows');

do $$
declare
  affected int;
begin
  delete from public.institutions;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'anon DELETE should affect 0 rows, got %', affected;
  end if;
end $$;
select pass('anon DELETE on institutions silently affects 0 rows');

reset role;

-- -----------------------------------------------------------------------------
-- AC2: authenticated student também não pode escrever (INSERT testa WITH CHECK;
-- UPDATE sob RLS filtra linhas silenciosamente e não lançaria exceção)
-- -----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000099"}';
select throws_ok(
  $$insert into public.institutions (name) values ('hacker-authed')$$,
  '42501',
  null,
  'student cannot insert institutions (WITH CHECK denies)'
);
reset role;

-- -----------------------------------------------------------------------------
-- AC3: seed das 11 instituições exatas
-- -----------------------------------------------------------------------------
select is(
  (select count(*) from public.institutions where name in
    ('UNICAMP','USP-SP','PSU-MG','FMABC','EINSTEIN','SCMSP','SES-PE','SES-DF','SCM-BH','USP-RP','UFPA')),
  11::bigint,
  'exact 11 institution names from calculations.ts'
);

-- AC3: todas as scoring_rules têm specialty_id IS NULL (MVP)
select is(
  (select count(*) from public.scoring_rules where specialty_id is not null),
  0::bigint,
  'no specialty-specific rules in MVP seed'
);

-- AC3: specialties tem sentinel __default__ + especialidades reais
select ok(
  (select count(*) from public.specialties where name = '__default__') = 1,
  '__default__ sentinel specialty exists'
);

-- AC3: formula é JSONB objeto em 100% das regras
select is(
  (select count(*) from public.scoring_rules where jsonb_typeof(formula) <> 'object'),
  0::bigint,
  'every formula is a jsonb object'
);

-- AC3: cada instituição tem >= 1 regra
select is(
  (select count(*) from public.institutions i
     where not exists (select 1 from public.scoring_rules sr where sr.institution_id = i.id)),
  0::bigint,
  'every institution has at least one scoring rule'
);

-- AC3: total de regras corresponde à extração de calculations.ts (75)
select is(
  (select count(*) from public.scoring_rules),
  75::bigint,
  'exactly 75 scoring rules seeded (extracted from calculations.ts)'
);

-- AC3: CHECK weight <= max_points respeitado em 100%
select is(
  (select count(*) from public.scoring_rules where weight > max_points),
  0::bigint,
  'all seeded weights respect max_points'
);

-- -----------------------------------------------------------------------------
-- AC4: idempotência — re-upsert não duplica
-- -----------------------------------------------------------------------------
insert into public.institutions (name, short_name, state) values ('UNICAMP','UNICAMP','SP')
  on conflict (name) do update set short_name = excluded.short_name;
select is(
  (select count(*) from public.institutions where name='UNICAMP'),
  1::bigint,
  'institutions upsert remains idempotent'
);

-- AC4: idempotência em scoring_rules via índice parcial (specialty_id IS NULL)
with inst as (select id from public.institutions where name = 'UNICAMP')
insert into public.scoring_rules (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values ((select id from inst), null, 'Pesquisa', 'ic', 20, 20, 'dup', '{"op":"sum"}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update set description = excluded.description;
select is(
  (select count(*) from public.scoring_rules sr
     join public.institutions i on sr.institution_id = i.id
     where i.name = 'UNICAMP' and sr.field_key = 'ic' and sr.specialty_id is null),
  1::bigint,
  'scoring_rules upsert remains idempotent'
);

select finish();
rollback;
