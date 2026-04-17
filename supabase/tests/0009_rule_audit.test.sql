-- Story 3.3: testes pgTAP para scoring_rules_audit — tabela, trigger, RLS
begin;
create extension if not exists pgtap;
select plan(14);

-- ---------------------------------------------------------------------------
-- AC1: tabela existe + colunas críticas
-- ---------------------------------------------------------------------------
select has_table('public','scoring_rules_audit','scoring_rules_audit table exists');
select has_column('public','scoring_rules_audit','id','id column exists');
select has_column('public','scoring_rules_audit','rule_id','rule_id column exists');
select has_column('public','scoring_rules_audit','changed_by','changed_by column exists');
select has_column('public','scoring_rules_audit','change_type','change_type column exists');
select has_column('public','scoring_rules_audit','old_values','old_values column exists');
select has_column('public','scoring_rules_audit','new_values','new_values column exists');
select has_column('public','scoring_rules_audit','changed_at','changed_at column exists');

-- AC1: índices
select has_index('public','scoring_rules_audit','idx_scoring_rules_audit_rule_id','rule_id index exists');
select has_index('public','scoring_rules_audit','idx_scoring_rules_audit_changed_at','changed_at index exists');

-- AC1: trigger existe
select has_trigger('public','scoring_rules','trg_audit_scoring_rules','audit trigger exists on scoring_rules');

-- ---------------------------------------------------------------------------
-- AC2: RLS habilitada + forçada
-- ---------------------------------------------------------------------------
select is(
  (select relforcerowsecurity from pg_class where relname='scoring_rules_audit' and relnamespace='public'::regnamespace),
  true,
  'scoring_rules_audit has force rls'
);

-- AC2: anon não pode SELECT audit
set local role anon;
select is(
  (select count(*) from public.scoring_rules_audit),
  0::bigint,
  'anon sees zero audit rows (RLS blocks)'
);
reset role;

-- AC2: student não pode SELECT audit
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000099"}';
select is(
  (select count(*) from public.scoring_rules_audit),
  0::bigint,
  'non-admin student sees zero audit rows (RLS blocks)'
);
reset role;

-- ---------------------------------------------------------------------------
-- Nota: testes de INSERT/UPDATE/DELETE trigger e admin SELECT requerem
-- db reset com seeds aplicados e um admin user real. Cobertos em integração.
-- ---------------------------------------------------------------------------

select finish();
rollback;
