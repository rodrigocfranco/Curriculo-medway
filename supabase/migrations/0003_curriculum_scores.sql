-- 0003_curriculum_scores.sql
-- Story 1.10: curriculum_fields + user_curriculum + user_scores + RLS
-- Depends on: 0001_profiles.sql (profiles + set_updated_at + is_admin + pgcrypto),
--             0002_rules_engine.sql (institutions + specialties)

-- =============================================================================
-- Schema: public.curriculum_fields (catálogo de campos; leitura pública, escrita admin)
-- =============================================================================

create table public.curriculum_fields (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  field_key text not null unique,
  label text not null,
  field_type text not null check (field_type in ('number','boolean','select','text')),
  options jsonb,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint curriculum_fields_options_consistency check (
    (field_type = 'select' and options is not null)
    or (field_type <> 'select' and options is null)
  )
);

create index idx_curriculum_fields_display_order
  on public.curriculum_fields (category, display_order);

-- =============================================================================
-- Schema: public.user_curriculum (1 linha por user; jsonb evoluível)
-- =============================================================================

create table public.user_curriculum (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger trg_user_curriculum_set_updated_at
  before update on public.user_curriculum
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Schema: public.user_scores (cache; PK composta, specialty_id NULL = default institucional)
-- =============================================================================

create table public.user_scores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  specialty_id uuid null references public.specialties(id) on delete cascade,
  score numeric not null default 0,
  max_score numeric not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  stale boolean not null default true,
  calculated_at timestamptz null,
  primary key (user_id, institution_id, specialty_id),
  constraint user_scores_non_negative check (score >= 0 and max_score >= 0),
  constraint user_scores_calc_consistency check (stale = true or calculated_at is not null)
);

create index idx_user_scores_user_id
  on public.user_scores (user_id);

create index idx_user_scores_institution
  on public.user_scores (institution_id, specialty_id);

-- =============================================================================
-- RLS: enable + force
-- =============================================================================

alter table public.curriculum_fields enable row level security;
alter table public.curriculum_fields force row level security;

alter table public.user_curriculum enable row level security;
alter table public.user_curriculum force row level security;

alter table public.user_scores enable row level security;
alter table public.user_scores force row level security;

-- =============================================================================
-- Policies: curriculum_fields (leitura pública anon+authenticated, escrita admin)
-- =============================================================================

create policy "curriculum_fields_select_all"
  on public.curriculum_fields for select
  to anon, authenticated
  using (true);

create policy "curriculum_fields_admin_write_insert"
  on public.curriculum_fields for insert to authenticated
  with check (public.is_admin(auth.uid()));

create policy "curriculum_fields_admin_write_update"
  on public.curriculum_fields for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "curriculum_fields_admin_write_delete"
  on public.curriculum_fields for delete to authenticated
  using (public.is_admin(auth.uid()));

-- =============================================================================
-- Policies: user_curriculum (CRUD isolado ao dono via auth.uid() = user_id)
-- =============================================================================

create policy "user_curriculum_select_own"
  on public.user_curriculum for select to authenticated
  using (auth.uid() = user_id);

create policy "user_curriculum_insert_own"
  on public.user_curriculum for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_curriculum_update_own"
  on public.user_curriculum for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_curriculum_delete_own"
  on public.user_curriculum for delete to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- Policies: user_scores (idem user_curriculum — defesa em profundidade; escrita
-- real virá de calculate_scores SECURITY DEFINER na Story 2.5)
-- =============================================================================

create policy "user_scores_select_own"
  on public.user_scores for select to authenticated
  using (auth.uid() = user_id);

create policy "user_scores_insert_own"
  on public.user_scores for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_scores_update_own"
  on public.user_scores for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_scores_delete_own"
  on public.user_scores for delete to authenticated
  using (auth.uid() = user_id);
