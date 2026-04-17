-- 0006_benchmarks_account_deletions.sql
-- Story 5.2: account_deletions + benchmark materialized views + refresh function
-- Depends on: 0001_profiles.sql (is_admin, profiles),
--             0002_rules_engine.sql (institutions, specialties),
--             0003_curriculum_scores.sql (user_scores, user_curriculum, curriculum_fields)

-- =============================================================================
-- Schema: public.account_deletions (sem PII — apenas metadados demográficos)
-- =============================================================================

create table public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  deleted_at timestamptz not null default now(),
  state text,
  graduation_year int
);

-- RLS: admin SELECT only; Edge Function INSERT via service_role (bypassa RLS)
alter table public.account_deletions enable row level security;
alter table public.account_deletions force row level security;

create policy "account_deletions_select_admin"
  on public.account_deletions for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- =============================================================================
-- Materialized View: benchmark_scores_by_institution
-- Scores agregados por instituição/especialidade (sem user_id)
-- =============================================================================

create materialized view public.benchmark_scores_by_institution as
select
  institution_id,
  specialty_id,
  count(*)::int as user_count,
  avg(score)::numeric(10,2) as avg_score,
  percentile_cont(0.50) within group (order by score)::numeric(10,2) as p50,
  percentile_cont(0.75) within group (order by score)::numeric(10,2) as p75,
  percentile_cont(0.90) within group (order by score)::numeric(10,2) as p90
from public.user_scores
where stale = false
group by institution_id, specialty_id;

-- =============================================================================
-- Materialized View: benchmark_curriculum_completeness
-- Completude de currículo por categoria (sem user_id)
-- =============================================================================

create materialized view public.benchmark_curriculum_completeness as
select
  cf.category,
  avg(
    case when uc.data ? cf.field_key then 1.0 else 0.0 end
  )::numeric(5,4) as avg_fill_rate
from public.curriculum_fields cf
cross join public.user_curriculum uc
group by cf.category;

-- =============================================================================
-- Unique indexes para REFRESH CONCURRENTLY (requer unique index)
-- =============================================================================

create unique index idx_benchmark_scores_pk
  on public.benchmark_scores_by_institution (institution_id, coalesce(specialty_id, '00000000-0000-0000-0000-000000000000'::uuid));

create unique index idx_benchmark_curriculum_pk
  on public.benchmark_curriculum_completeness (category);

-- =============================================================================
-- Function: refresh_benchmarks() — refresh manual/cron das views
-- SECURITY DEFINER para que Edge Function (service_role) possa invocar
-- =============================================================================

create or replace function public.refresh_benchmarks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Guard: apenas admin ou service_role podem executar
  if current_setting('role') != 'service_role' and not public.is_admin(auth.uid()) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  refresh materialized view concurrently public.benchmark_scores_by_institution;
  refresh materialized view concurrently public.benchmark_curriculum_completeness;
end;
$$;

-- Restringir EXECUTE: apenas authenticated (admin via wrapper) e service_role
revoke execute on function public.refresh_benchmarks() from public;
grant execute on function public.refresh_benchmarks() to authenticated;

-- =============================================================================
-- Wrapper functions SECURITY DEFINER para acesso admin às materialized views
-- (Postgres não suporta RLS nativo em materialized views)
-- =============================================================================

create or replace function public.get_benchmark_scores()
returns table (
  institution_id uuid,
  specialty_id uuid,
  user_count int,
  avg_score numeric,
  p50 numeric,
  p75 numeric,
  p90 numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  return query select * from public.benchmark_scores_by_institution;
end;
$$;

create or replace function public.get_benchmark_curriculum()
returns table (
  category text,
  avg_fill_rate numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  return query select * from public.benchmark_curriculum_completeness;
end;
$$;

-- Restringir EXECUTE das wrappers
revoke execute on function public.get_benchmark_scores() from public;
grant execute on function public.get_benchmark_scores() to authenticated;

revoke execute on function public.get_benchmark_curriculum() from public;
grant execute on function public.get_benchmark_curriculum() to authenticated;
