-- 0004_storage_editais.sql
-- Story 1.10: bucket `editais` (PDFs, 10 MiB max, leitura autenticada, escrita admin)
-- Depends on: 0001_profiles.sql (is_admin helper)

-- =============================================================================
-- Bucket: storage.buckets.editais (private; mime=pdf; 10 MiB = 10 * 1024 * 1024)
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('editais', 'editais', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =============================================================================
-- Policies: storage.objects (globais — filtro `bucket_id = 'editais'` é obrigatório)
-- DROP IF EXISTS antes de CREATE para re-aplicação em ambientes onde db reset
-- não dropa schema de storage (staging/prod).
-- =============================================================================

drop policy if exists "editais_authenticated_read" on storage.objects;
drop policy if exists "editais_admin_write_insert" on storage.objects;
drop policy if exists "editais_admin_write_update" on storage.objects;
drop policy if exists "editais_admin_write_delete" on storage.objects;

create policy "editais_authenticated_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'editais');

create policy "editais_admin_write_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'editais' and public.is_admin(auth.uid()));

create policy "editais_admin_write_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'editais' and public.is_admin(auth.uid()))
  with check (bucket_id = 'editais' and public.is_admin(auth.uid()));

create policy "editais_admin_write_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'editais' and public.is_admin(auth.uid()));
