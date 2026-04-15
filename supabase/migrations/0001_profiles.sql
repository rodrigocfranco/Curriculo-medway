-- 0001_profiles.sql
-- Story 1.3: profiles + handle_new_user + RLS
-- Depends on: auth.users (provisionado pelo Supabase)

create extension if not exists "pgcrypto";

-- =============================================================================
-- Schema: public.profiles
-- =============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  state text,
  university text,
  graduation_year int,
  specialty_interest text,
  role text not null check (role in ('student','admin')) default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- UNIQUE em email já cria índice implícito. Index em role serve queries do Epic 4 (leads).
create index idx_profiles_role on public.profiles (role);

-- =============================================================================
-- updated_at auto-trigger (genérico; reutilizado por user_curriculum, user_scores, etc.)
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- handle_new_user: sync auth.users -> public.profiles no signup
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  grad_year_raw text := new.raw_user_meta_data->>'graduation_year';
begin
  insert into public.profiles (
    id, email, name, phone, state, university, graduation_year, specialty_interest
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'university',
    -- safe cast: só numérico puro é convertido; qualquer outra coisa vira null em vez de abortar signup
    case when grad_year_raw ~ '^\d{1,9}$' then grad_year_raw::int else null end,
    new.raw_user_meta_data->>'specialty_interest'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- handle_user_email_update: sincroniza auth.users.email -> profiles.email
-- Previne drift quando usuário muda email via Supabase Auth.
-- =============================================================================

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- =============================================================================
-- is_admin helper (SECURITY DEFINER evita recursão de RLS nas policies admin)
-- =============================================================================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

-- SECURITY DEFINER + PostgREST expõe RPC — restringe EXECUTE para evitar
-- enumeração de admins via rpc('is_admin', {uid: '<qualquer>'}).
revoke execute on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- =============================================================================
-- prevent_role_self_escalation: trigger BEFORE UPDATE em profiles.role
-- Bloqueia qualquer UPDATE que mude `role` vindo de sessão não-admin.
-- Padrão mais robusto que WITH CHECK com subquery (evita race e ambiguidade
-- de snapshot do planner durante avaliação da policy).
-- =============================================================================

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() IS NULL = contexto confiável (superuser, service_role via Edge
  -- Function, migrations). Apenas sessões autenticadas via PostgREST passam
  -- pelo guard de role escalation.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin(auth.uid()) then
    raise exception 'permission denied: cannot change role' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update of role on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- =============================================================================
-- RLS: enable + force (force garante que dono da tabela também respeita policies)
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- SELECT: student vê só a si; admin vê todos
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

-- UPDATE (student): atualiza própria linha. Proteção contra role escalation é
-- feita pelo trigger `trg_prevent_role_escalation` (BEFORE UPDATE OF role),
-- não pela policy — evita a ambiguidade de subquery em WITH CHECK.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- UPDATE (admin): atualiza qualquer linha, incluindo role.
create policy "profiles_update_admin_all"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- INSERT: sem policy -> default deny sob RLS forçada.
-- Client nunca insere em profiles; trigger handle_new_user (SECURITY DEFINER) bypassa.

-- DELETE: apenas admin. Auto-exclusão de aluno ocorrerá via Edge Function
-- `delete-account` (Epic 5) com service_role — cascade em auth.users + profiles.
create policy "profiles_delete_admin_only"
  on public.profiles for delete
  using (public.is_admin(auth.uid()));
