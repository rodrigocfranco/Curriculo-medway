-- Story 1.10: testes pgTAP para bucket `editais` + policies storage.objects
begin;
create extension if not exists pgtap;
select plan(10);

-- -----------------------------------------------------------------------------
-- AC4: bucket existe com config correta
-- -----------------------------------------------------------------------------
select is(
  (select count(*) from storage.buckets where id = 'editais'),
  1::bigint,
  'editais bucket exists'
);

select is(
  (select file_size_limit from storage.buckets where id = 'editais'),
  10485760::bigint,
  'file_size_limit = 10 MiB (10485760 bytes)'
);

select is(
  (select allowed_mime_types from storage.buckets where id = 'editais'),
  array['application/pdf']::text[],
  'allowed_mime_types = [application/pdf]'
);

select is(
  (select public from storage.buckets where id = 'editais'),
  false,
  'bucket is private (public = false)'
);

-- -----------------------------------------------------------------------------
-- AC4: 4 policies criadas em storage.objects para o bucket
-- -----------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname in (
         'editais_authenticated_read',
         'editais_admin_write_insert',
         'editais_admin_write_update',
         'editais_admin_write_delete'
       )),
  4,
  'four editais policies exist on storage.objects'
);

-- -----------------------------------------------------------------------------
-- AC4: idempotência do INSERT do bucket
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('editais', 'editais', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

select is(
  (select count(*) from storage.buckets where id = 'editais'),
  1::bigint,
  'bucket upsert remains idempotent'
);

-- AC4: policies com nomes consistentes (drop/recreate pattern)
select is(
  (select count(*)::int from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname like 'editais_%'),
  4,
  'only 4 editais_ policies (no duplicates from re-apply)'
);

-- -----------------------------------------------------------------------------
-- AC4 funcional: RLS bloqueia student e anon; libera admin
-- -----------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000b1'::uuid,'student-storage@test.com',jsonb_build_object('name','Student')),
  ('00000000-0000-0000-0000-0000000000b2'::uuid,'admin-storage@test.com',jsonb_build_object('name','Admin Storage'));
update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000b2'::uuid;

-- Student autenticado: INSERT em storage.objects bloqueado (não é admin)
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner) values ('editais','usp-sp-2026.pdf','00000000-0000-0000-0000-0000000000b1'::uuid)$$,
  '42501',
  null,
  'student cannot INSERT into editais bucket (admin-only write)'
);
reset role;
set local "request.jwt.claims" to '';

-- Anon: SELECT retorna zero linhas (to authenticated bloqueia)
set local role anon;
select is(
  (select count(*) from storage.objects where bucket_id = 'editais'),
  0::bigint,
  'anon sees zero rows in editais bucket (to authenticated blocks anon)'
);
reset role;

-- Admin: INSERT funciona (caminho positivo)
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner) values ('editais','usp-sp-2026.pdf','00000000-0000-0000-0000-0000000000b2'::uuid)$$,
  'admin can INSERT into editais bucket (positive path)'
);
reset role;
set local "request.jwt.claims" to '';

select finish();
rollback;
