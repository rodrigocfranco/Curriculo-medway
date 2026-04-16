-- 0002_rules_engine.sql
-- Story 1.9: institutions + specialties + scoring_rules + RLS
-- Depends on: 0001_profiles.sql (is_admin, set_updated_at, pgcrypto)

-- =============================================================================
-- Schema: public.institutions
-- =============================================================================

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text,
  state text,
  edital_url text,
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- Schema: public.specialties
-- =============================================================================

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Schema: public.scoring_rules
-- =============================================================================
-- Hybrid relational + JSONB. Metadados tipados em colunas; fórmula parametrizável
-- fica em `formula jsonb` (interpretada por calculate_scores — Story 2.5).

create table public.scoring_rules (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  specialty_id uuid null references public.specialties(id) on delete restrict,
  category text not null,
  field_key text not null,
  weight numeric not null,
  max_points numeric not null,
  description text,
  formula jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scoring_rules_weight_bounds_chk check (weight >= 0 and weight <= max_points),
  constraint scoring_rules_unique_rule unique (institution_id, specialty_id, field_key)
);

-- Lookup by institution (usado em Story 2.5 calculate_scores por aluno)
create index idx_scoring_rules_institution_id on public.scoring_rules (institution_id);

-- Lookup por especialidade (Story 2.8 specialty selector)
create index idx_scoring_rules_specialty_id on public.scoring_rules (specialty_id);

-- Índice parcial UNIQUE para upsert quando specialty_id IS NULL (default rule).
-- Postgres trata NULL como distinto no UNIQUE padrão, então sem este índice o
-- `on conflict` do seed não funcionaria para as regras default do MVP.
create unique index idx_scoring_rules_default_unique
  on public.scoring_rules (institution_id, field_key)
  where specialty_id is null;

-- =============================================================================
-- Triggers updated_at (reutilizam public.set_updated_at() da 0001)
-- =============================================================================

create trigger trg_institutions_set_updated_at
  before update on public.institutions
  for each row execute function public.set_updated_at();

create trigger trg_scoring_rules_set_updated_at
  before update on public.scoring_rules
  for each row execute function public.set_updated_at();

-- specialties só tem created_at (imutável pós-insert) — sem trigger.

-- =============================================================================
-- RLS: enable + force nas 3 tabelas
-- =============================================================================

alter table public.institutions enable row level security;
alter table public.institutions force row level security;
alter table public.specialties enable row level security;
alter table public.specialties force row level security;
alter table public.scoring_rules enable row level security;
alter table public.scoring_rules force row level security;

-- SELECT: leitura pública (anon + authenticated).
-- Justificativa: landing SSG (Story 1.4) e pré-login podem renderizar regras
-- como hook; dados são editais públicos, não-sensíveis.
create policy "institutions_select_public"
  on public.institutions for select
  to anon, authenticated
  using (true);

create policy "specialties_select_public"
  on public.specialties for select
  to anon, authenticated
  using (true);

create policy "scoring_rules_select_public"
  on public.scoring_rules for select
  to anon, authenticated
  using (true);

-- WRITE: apenas admin (reutiliza is_admin da 0001)
create policy "institutions_write_admin"
  on public.institutions for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "specialties_write_admin"
  on public.specialties for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "scoring_rules_write_admin"
  on public.scoring_rules for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
