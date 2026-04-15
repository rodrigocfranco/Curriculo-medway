# Story 1.3: Schema `profiles` + trigger `handle_new_user` + RLS

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **desenvolvedor (Rcfranco, solo) do curriculo-medway**,
I want **criar a migration `0001_profiles.sql` com a tabela `profiles` (espelhada em `auth.users`), função+trigger `handle_new_user` que popula a linha após signup com metadados, RLS com policies student/admin, e regenerar `src/lib/database.types.ts`**,
so that **as Stories 1.5 (signup), 1.6 (login/AuthContext), 1.7 (recover), 1.8 (ProtectedRoute/role guard) e todo Epic 4 (leads) tenham a fonte única de perfis — com isolamento de dados por RLS — para consumir via PostgREST + tipos tipados**.

## Acceptance Criteria

Copiados verbatim de [epics.md#Story 1.3 (_bmad-output/planning-artifacts/epics.md:384-405)](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Migration `0001_profiles.sql` cria `profiles` com schema correto + trigger de sync**
   **Given** um projeto Supabase inicializado (Story 1.1, `supabase/config.toml` presente, `supabase/migrations/` vazio)
   **When** aplico a migration `supabase/migrations/0001_profiles.sql` (via `supabase db reset` local)
   **Then** a tabela `profiles` existe com:
   - `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `name text` (NOT NULL)
   - `email text UNIQUE NOT NULL`
   - `phone text`
   - `state text` (UF, 2 chars)
   - `university text`
   - `graduation_year int`
   - `specialty_interest text`
   - `role text NOT NULL CHECK (role IN ('student','admin')) DEFAULT 'student'`
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - `updated_at timestamptz NOT NULL DEFAULT now()`
   **And** função `public.handle_new_user()` (SECURITY DEFINER, `search_path = public`) + trigger `on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW` popula `profiles` automaticamente lendo `NEW.email` + `NEW.raw_user_meta_data` (chaves: `name`, `phone`, `state`, `university`, `graduation_year`, `specialty_interest`)

2. **AC2 — RLS isola student ao próprio registro e bloqueia escalonamento de `role`**
   **Given** RLS habilitada em `profiles` (`ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`)
   **When** user autenticado com `role='student'` consulta `SELECT * FROM profiles`
   **Then** só enxerga a linha onde `auth.uid() = id` (SELECT policy)
   **And** só pode executar `UPDATE` na própria linha (UPDATE policy com `USING (auth.uid() = id)`)
   **And** nunca pode alterar o próprio `role` — tentativa de `UPDATE profiles SET role='admin' WHERE id=auth.uid()` retorna erro ou é silenciosamente no-op (via `WITH CHECK` na UPDATE policy OU trigger `prevent_role_self_escalation`)
   **And** `INSERT` direto de aluno em `profiles` é negado (perfis só via trigger `handle_new_user`)

3. **AC3 — Admin enxerga todos os perfis + types regenerados e commitados**
   **Given** admin consulta `profiles`
   **When** usa client anon com sessão cujo `profiles.role='admin'`
   **Then** enxerga todos os registros (SELECT policy admin usa helper `public.is_admin(auth.uid())` SECURITY DEFINER para evitar recursão de RLS)
   **And** `src/lib/database.types.ts` é **regenerado** via `supabase gen types typescript --local > src/lib/database.types.ts` substituindo o stub `export type Database = any;` por tipos reais que incluem `public.profiles.Row/Insert/Update`
   **And** o arquivo regenerado é commitado com comentário-marca preservado (`// GERADO — não editar manualmente`)

## Tasks / Subtasks

- [x] **Task 1 — Criar migration `0001_profiles.sql` com schema + trigger + RLS** (AC: #1, #2, #3)
  - [x] 1.1 Gerar arquivo via CLI: `supabase migration new profiles` — cria `supabase/migrations/<timestamp>_profiles.sql`. **Renomear** o arquivo para `0001_profiles.sql` (prefixo numérico sequencial — ver [architecture.md#Implementation Handoff — Migration 1 (linhas 761-767)](../planning-artifacts/architecture.md) e convenção do PRD "Migration 1: schema base"). Supabase aceita ambos padrões; optar pelo numérico sequencial para legibilidade manual.
  - [x] 1.2 Seção **schema** no topo da migration (ordem importa — extensões antes de tabelas):
    ```sql
    -- 0001_profiles.sql
    -- Story 1.3: profiles + handle_new_user + RLS
    -- Depends on: auth.users (provisionado pelo Supabase)

    create extension if not exists "pgcrypto";  -- gen_random_uuid (não usada aqui, mas requisito do stack — ver architecture.md)

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

    create index idx_profiles_email on public.profiles (email);
    create index idx_profiles_role on public.profiles (role);
    ```
    **Não** adicionar FK composta, `graduation_year` range check, ou constraint de UF — escopo mínimo AC; validação virá em Zod (Story 1.5) e polimento em Story 1.9.
  - [x] 1.3 Seção **updated_at auto-trigger** (padrão do repo — usado também nas Stories 1.9/1.10):
    ```sql
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
    ```
    `set_updated_at()` é genérica e será reutilizada por `user_curriculum`, `user_scores`, etc. nas próximas stories — criar aqui.
  - [x] 1.4 Seção **handle_new_user trigger** (sync `auth.users → profiles`):
    ```sql
    create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
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
        nullif(new.raw_user_meta_data->>'graduation_year','')::int,
        new.raw_user_meta_data->>'specialty_interest'
      );
      return new;
    end;
    $$;

    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
    ```
    **Detalhes críticos:**
    - `security definer` + `set search_path = public` são **obrigatórios** — sem eles o trigger roda com as permissões do caller (anon/authenticated) e falha ao inserir em `public.profiles` sob RLS.
    - `coalesce(..., '')` em `name` evita violar `NOT NULL` quando signup não manda metadados (defesa em profundidade; Story 1.5 valida no cliente).
    - `nullif(...,'')::int` em `graduation_year` trata string vazia do metadata JSON (sem isso, `''::int` lança erro).
    - Usar `public.profiles` qualificado mesmo com `search_path = public` — legibilidade para reviewer.
  - [x] 1.5 Seção **RLS habilitada + policies**:
    ```sql
    -- Helper SECURITY DEFINER para checar admin sem recursão de RLS
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

    alter table public.profiles enable row level security;
    alter table public.profiles force row level security;

    -- SELECT: student vê só a si; admin vê todos
    create policy "profiles_select_own_or_admin"
      on public.profiles for select
      using (auth.uid() = id or public.is_admin(auth.uid()));

    -- UPDATE: student atualiza própria linha, NÃO pode mudar role; admin atualiza tudo
    create policy "profiles_update_own_preserve_role"
      on public.profiles for update
      using (auth.uid() = id)
      with check (
        auth.uid() = id
        and role = (select p.role from public.profiles p where p.id = auth.uid())
      );

    create policy "profiles_update_admin_all"
      on public.profiles for update
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));

    -- INSERT direto: negado para todos (client nunca insere; trigger handle_new_user é SECURITY DEFINER e bypassa)
    -- Não criamos policy de INSERT → default deny sob RLS forçada.

    -- DELETE: student deleta a própria linha (cascata vem de auth.users via ON DELETE CASCADE na Edge Function delete-account da Story 5.3); admin deleta qualquer
    create policy "profiles_delete_own_or_admin"
      on public.profiles for delete
      using (auth.uid() = id or public.is_admin(auth.uid()));
    ```
    **Detalhes críticos:**
    - `force row level security` garante que até o dono da tabela respeita RLS (sem `force`, migrations rodadas por `postgres` bypassam silenciosamente — já vi acontecer em code review).
    - `is_admin(uid)` é SECURITY DEFINER para **evitar loop de RLS** quando a policy consulta `profiles` para saber se é admin (RLS → helper → RLS → ∞). `stable` permite ao planner cachear por sessão.
    - `with check` da UPDATE policy student compara novo `role` com o atual via subquery — se o client tentar `update profiles set role='admin'`, o `with check` falha e o UPDATE é rejeitado com `new row violates row-level security policy`. Alternativa considerada (trigger `prevent_role_self_escalation`) é mais verbosa e duplicada; `with check` é idiomático.
    - **Não criamos INSERT policy** — o trigger `handle_new_user` (SECURITY DEFINER) insere em nome de `postgres`, bypassando RLS. Client nunca deve fazer `supabase.from('profiles').insert(...)`; signup passa pelo `auth.signUp` + trigger.
    - Nomes descritivos em snake_case (padrão [architecture.md#Naming Patterns linhas 255-266](../planning-artifacts/architecture.md): "RLS policies: nome descritivo").

- [x] **Task 2 — Aplicar migration local e validar schema** (AC: #1, #2)
  - [x] 2.1 Com `supabase start` rodando (Story 1.1 já configurou), aplicar via `supabase db reset` — comando canônico para reaplicar todas as migrations do zero em dev. **Evitar** `supabase migration up` em dev: não garante estado limpo.
  - [x] 2.2 Validar schema via Studio (`http://127.0.0.1:54323` por default) ou psql:
    ```bash
    supabase db execute --local "\\d+ public.profiles"
    ```
    Conferir: 11 colunas conforme AC1, PK em `id`, FK em `auth.users(id)` ON DELETE CASCADE, UNIQUE em `email`, CHECK em `role`, índices `idx_profiles_email` e `idx_profiles_role`.
  - [x] 2.3 Validar triggers: `select tgname from pg_trigger where tgrelid = 'public.profiles'::regclass;` → deve conter `trg_profiles_set_updated_at`. E `select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;` → deve conter `on_auth_user_created`.
  - [x] 2.4 Validar RLS: `select relrowsecurity, relforcerowsecurity from pg_class where relname = 'profiles';` → ambos `t`. `select polname from pg_policies where tablename='profiles';` → 4 policies (select_own_or_admin, update_own_preserve_role, update_admin_all, delete_own_or_admin).

- [x] **Task 3 — Testes pgTAP de comportamento RLS + trigger** (AC: #1, #2, #3)
  - [x] 3.1 Criar `supabase/tests/0001_profiles.test.sql` — testes pgTAP mínimos validando os ACs:
    ```sql
    begin;
    select plan(7);

    -- AC1: schema
    select has_column('public','profiles','role','profiles.role exists');
    select col_has_check('public','profiles','role','role has CHECK constraint');

    -- AC1: handle_new_user cria profile
    insert into auth.users (id, email, raw_user_meta_data)
    values (
      '00000000-0000-0000-0000-000000000001',
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

    -- AC2: student só lê a própria linha
    insert into auth.users (id,email,raw_user_meta_data)
    values ('00000000-0000-0000-0000-000000000002','aluno2@test.com','{"name":"Aluno Dois"}'::jsonb);

    set local role authenticated;
    set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001"}';
    select is(
      (select count(*) from public.profiles),
      1::bigint,
      'student sees only own row'
    );

    -- AC2: student não escalona role
    update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000001';
    reset role;
    select is(
      (select role from public.profiles where id='00000000-0000-0000-0000-000000000001'),
      'student',
      'student cannot escalate role via UPDATE'
    );

    -- AC3: admin vê tudo
    update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000001';
    set local role authenticated;
    set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001"}';
    select is(
      (select count(*) from public.profiles),
      2::bigint,
      'admin sees all rows'
    );

    reset role;
    select finish();
    rollback;
    ```
  - [x] 3.2 Rodar `supabase test db` — **DEVE** passar todos os asserts. Se o dev ambient não tiver pgTAP (Supabase local inclui por default), reportar como **deferred** no fim (não bloqueia AC; pgTAP é [architecture.md#Organização de testes linha 297](../planning-artifacts/architecture.md) "quando aplicável").
  - [x] 3.3 **Alternativa mínima aceitável** se pgTAP der fricção: script bash ad-hoc em `supabase/tests/smoke-profiles.sh` usando `supabase db execute --local` com os mesmos inserts/asserts como `SELECT ok/fail`. Documentar a escolha em Completion Notes.

- [x] **Task 4 — Regenerar `src/lib/database.types.ts`** (AC: #3)
  - [x] 4.1 Com `supabase start` ativo e migration aplicada, rodar:
    ```bash
    supabase gen types typescript --local > src/lib/database.types.ts
    ```
    **Não** usar `--project-id` (staging/prod sync é responsabilidade da Story 1.11 CI).
  - [x] 4.2 Editar o arquivo gerado **apenas** para preservar o comentário-marca no topo:
    ```ts
    // GERADO — não editar manualmente. Re-rodar `supabase gen types typescript --local > src/lib/database.types.ts` após migrations.
    ```
    Colar antes do `export type Json = ...` que o CLI gera. **Nenhuma outra edição manual**.
  - [x] 4.3 Confirmar que `src/lib/supabase.ts` continua compilando com o novo `Database` real (era `any` stub; agora tipado). Se algum consumer reclamar de types (não deve — ninguém consome ainda), esconder atrás de `as const` é anti-pattern — corrigir o tipo.
  - [x] 4.4 **NÃO** migrar `src/lib/types.ts` (Lovable legacy) para usar os novos tipos aqui — é Story 2.1+.

- [x] **Task 5 — Validar lint/build/test continuam verdes + documentar no README** (AC: #3)
  - [x] 5.1 `bun run lint` — 0 erros (warnings pré-existentes de react-refresh em shadcn são aceitáveis; idêntico ao baseline pós-Story 1.2).
  - [x] 5.2 `bun run build` — deve passar. O novo `database.types.ts` é tree-shaken (só tipos, zero runtime).
  - [x] 5.3 `bun run test` — `src/test/example.test.ts` continua verde.
  - [x] 5.4 Atualizar `README.md` seção "Setup local" adicionando 1 linha **após** `bun dev`:
    > Para regenerar types após editar migrations: `supabase gen types typescript --local > src/lib/database.types.ts`.
  - [x] 5.5 **NÃO** criar `docs/rules-engine.md`, `docs/lgpd.md` nem documentar políticas RLS em docs separados — migration é auto-documentada via comentários SQL; policies descritivas em nome.

## Dev Notes

### Contexto crítico (ler antes de codar)

- **Stories anteriores (ambas done, 2026-04-14):**
  - **1.1** configurou `supabase/` via `supabase init` + singleton `src/lib/supabase.ts` + stub `database.types.ts` (`export type Database = any;`) + `.env.example`. `supabase start` sobe Postgres local.
  - **1.2** configurou Design System Medway em `tailwind.config.ts` + Montserrat via `@fontsource` + página `/design-system` dev-only. **Zero impacto** nesta story (story é zero-frontend; só toca `database.types.ts`).
- **Esta story é backend-puro.** Você não escreve React, não toca rotas, não cria componentes. É SQL + 1 arquivo gerado.
- **Dependências downstream que QUEBRAM se esta story falhar:**
  - Story 1.5 (Signup) chama `supabase.auth.signUp({ email, password, options: { data: { name, phone, ... } } })` — sem trigger `handle_new_user`, `profiles` fica vazio após signup e toda a trilha lead/dashboard quebra.
  - Story 1.6 (AuthContext) consulta `profiles.role` para rotear `/app` vs `/admin` — sem schema `role`, guard falha.
  - Story 1.8 (ProtectedRoute) usa `public.is_admin()` — criar aqui evita reimplementar.
  - Story 1.9 (schema scoring_rules) e 1.10 (schema user_curriculum) **dependem** do padrão `set_updated_at()` definido aqui.
  - Epic 4 (LeadTable) consulta `profiles` filtrado por `role='student'` — sem RLS correta, admin vê dados errados ou aluno vê outros.
- **Escopo propositalmente fechado:** só `profiles` + trigger `handle_new_user` + RLS + types. Nada de `institutions`, `specialties`, `scoring_rules` (são Story 1.9), nem `user_curriculum`, `user_scores` (Story 1.10). **Resista ao escopo criativo.**

### Padrões de arquitetura que você DEVE seguir

[Source: architecture.md#Naming Patterns — Database (linhas 255-266)](../planning-artifacts/architecture.md)
- Tabelas `snake_case` plural (`profiles`). Colunas `snake_case`. FK: `{referenced_table_singular}_id` — **exceção** aqui: `profiles.id` é PK E FK para `auth.users(id)` (1-para-1), por isso nome `id` (não `user_id`). Documentar no próprio nome da coluna seria redundante.
- Índices: `idx_{table}_{column}` → `idx_profiles_email`, `idx_profiles_role`.
- Timestamps: `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()` + trigger auto-update.
- Funções SQL: verbo-primeiro `snake_case` → `handle_new_user`, `set_updated_at`, `is_admin`.
- Triggers: `on_{event}_{table}` → `on_auth_user_created`. Para o `set_updated_at` genérico use prefixo `trg_` ([architecture.md#Events linhas 350-353](../planning-artifacts/architecture.md) não proíbe).
- RLS policies: nome descritivo snake_case (`"profiles_select_own_or_admin"`).

[Source: architecture.md#Authentication & Security (linhas 180-188)](../planning-artifacts/architecture.md)
- Autorização: **RLS + coluna `role` em `profiles`**. `student` default (acesso só aos próprios dados); `admin` acesso a regras/instituições/leads. Esta story **estabelece** o pilar — todos os epics dependem.

[Source: architecture.md#Data Boundaries (linhas 594-600)](../planning-artifacts/architecture.md)
- "RLS garante aluno lê só `auth.uid() = user_id`" — aqui o equivalente é `auth.uid() = id`.
- "Escrita de regras apenas `role = 'admin'`" — usaremos `is_admin()` nas Stories 1.9/3.x. **Criar `is_admin()` já aqui** evita duplicação.

[Source: architecture.md#Enforcement Guidelines (linhas 403-414)](../planning-artifacts/architecture.md)
- Regra 1: `snake_case` em todo o stack de dados. Regra 2: `database.types.ts` é fonte de verdade — nunca redefinir tipos manualmente. Regra 9: **nunca** `service_role` no cliente — esta story não toca Edge Functions, mas `handle_new_user` roda como SECURITY DEFINER (server-side) — equivalente correto.

### Anti-patterns a EVITAR (previne retrabalho e buracos de segurança)

- **NÃO** criar policy de `INSERT` em `profiles`. Client nunca deve inserir — a linha é criada pelo trigger. Uma policy permissiva de INSERT aqui vira vetor para criar perfis órfãos sem `auth.users`.
- **NÃO** omitir `SECURITY DEFINER` no `handle_new_user` — sob RLS forçada, trigger roda como caller e falha. Erro silencioso mais caro do que parece.
- **NÃO** omitir `set search_path = public` em SECURITY DEFINER. Sem isso, [CVE histórico do Postgres](https://supabase.com/docs/guides/database/functions#search_path) permite que um usuário malicioso crie objeto homônimo em schema preferido do caller e sequestre execução.
- **NÃO** omitir `force row level security`. `postgres` (dono da tabela) bypassa RLS por default — em ambiente CI rodando migrations como owner, testes de RLS dão falso-positivo.
- **NÃO** escrever policy de admin que consulta `profiles` diretamente sem `is_admin()` SECURITY DEFINER — vira recursão de RLS (policy consulta tabela → RLS aplica policy → policy consulta... ∞). Erro típico: `using (role = 'admin')` lendo da própria tabela sob RLS → não funciona.
- **NÃO** adicionar columns "nice-to-have" (`avatar_url`, `bio`, `locale`, etc.) — não estão no AC e mudar schema depois é cheap; speculative add não é.
- **NÃO** usar `gen_random_uuid()` como default de `profiles.id`. O `id` é **fornecido** pelo trigger a partir de `auth.users.id` — UUID gerado pelo Supabase Auth.
- **NÃO** criar `profiles.password` ou qualquer coluna de credencial. Auth é 100% em `auth.users` (bcrypt interno Supabase).
- **NÃO** editar manualmente `src/lib/database.types.ts` além do comentário-marca. O arquivo é regerado por `supabase gen types` — edits manuais são sobrescritos e perdem-se.
- **NÃO** instalar dependências npm nesta story. Zero deps novos — só SQL e tipos gerados.
- **NÃO** modificar `supabase/config.toml` além do que `supabase init` gerou. Auth email templates, redirect URLs e afins vêm na Story 1.5/1.6.
- **NÃO** mexer em `src/lib/calculations.ts` (ainda preservado por ordem da Story 1.1; extração vem na 1.9).

### Decisões técnicas específicas

- **Por que migration numerada `0001_profiles.sql` e não timestamp?** Alinha com [architecture.md#Implementation Handoff (linha 763)](../planning-artifacts/architecture.md) ("Migration 1: schema base (`profiles`, ...)"). `supabase migration new` gera timestamp por default (`20260414120000_profiles.sql`); renomear para `0001_profiles.sql` facilita leitura manual numa base de 10+ migrations previstas. Supabase CLI aceita ambos (ordenação alfabética).
- **Por que `is_admin(uid uuid)` e não `is_admin()` sem parâmetro?** Testabilidade — em testes pgTAP podemos passar `is_admin('some-uuid')` sem simular JWT. Em policies sempre chamar com `auth.uid()`.
- **Por que criar `set_updated_at()` nesta story (e não só em 1.9/1.10)?** Reuso. Três das próximas quatro stories SQL vão precisar. Criar uma vez aqui economiza duplicação em 4 migrations.
- **Por que index em `role`?** Epic 4 (leads) roda `select * from profiles where role='student'` com filtros e paginação sobre 10k+ registros. Sem índice, seq scan — já fica lento nos primeiros 100. Baixo custo (boolean-like cardinalidade, mas seletiva a favor de student sempre).
- **Por que index em `email`?** Já temos `UNIQUE` que cria índice implícito — adicionar `idx_profiles_email` é redundante. **Correção:** remover `create index idx_profiles_email` da Task 1.2 se o `unique` já está lá. Manter só `idx_profiles_role`.
- **Por que `raw_user_meta_data` (e não `user_metadata`)?** Supabase Auth grava metadados passados em `auth.signUp({options:{data:...}})` em `auth.users.raw_user_meta_data jsonb`. `user_metadata` é a view renderizada no JWT — a tabela bruta é o que o trigger lê.
- **Por que `coalesce(raw_user_meta_data->>'name', '')` quebra idempotência se o signup faltar `name`?** O AC1 diz `name text NOT NULL`. Em Story 1.5, o client **garante** `name` via Zod — o coalesce é defesa em profundidade contra inserts manuais. Alternativa (deixar coluna nullable) perde invariant. Aceitar `''` empty string como valor "pendente" é pior DX que não aceitar — revisitar se virar problema; por ora, seguir com `not null + coalesce`.

### Fluxos de dados a ter em mente

- **Signup (Story 1.5, downstream):**
  1. Client chama `supabase.auth.signUp({ email, password, options: { data: { name, phone, state, university, graduation_year, specialty_interest } } })`.
  2. Supabase Auth grava `auth.users` (id, email, raw_user_meta_data).
  3. Trigger `on_auth_user_created` dispara **imediatamente**, rodando `handle_new_user` como SECURITY DEFINER → `INSERT INTO public.profiles`.
  4. Client recebe session → `AuthContext` (Story 1.6) carrega `profiles` via `supabase.from('profiles').select('*').eq('id', user.id).single()`.
- **RLS em queries tipadas (Story 1.6+):** `supabase.from('profiles').select('*')` (sem filtro) — RLS filtra server-side para student = só própria linha; para admin = todas. Cliente nunca precisa adicionar `.eq('id', user.id)` — mas pode fazê-lo para intent-clarity.
- **Role escalation attempt (ataque):** client autenticado student chama `supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)`. RLS `with check` da UPDATE policy student compara novo role com atual via subquery → falha → `error.code === '42501'` (PGRST).

### Latest tech notes (abr/2026)

- **Supabase CLI 1.x+**: `supabase gen types typescript --local` é estável. Não usar `--db-url` (legacy) — `--local` é o idiomático.
- **Postgres 15+ (padrão Supabase local)**: `raw_user_meta_data jsonb` suporta operadores `->`/`->>`. `nullif` + cast funcionam como esperado.
- **RLS com policies múltiplas no mesmo comando (UPDATE):** Postgres avalia com OR entre policies do mesmo comando/role (`profiles_update_own_preserve_role` **OR** `profiles_update_admin_all`). Isso é exatamente o desejado — student passa pela primeira, admin pela segunda.
- **`security definer` + `search_path`**: Supabase tem guia oficial ([supabase.com/docs/guides/database/functions#search_path](https://supabase.com/docs/guides/database/functions)) tornando `set search_path = public` obrigatório para funções SECURITY DEFINER — lint do Supabase (Supabase Linter) alerta se omitido.
- **pgTAP no Supabase local**: incluído no container Postgres do `supabase start` desde 2023. `supabase test db` executa automaticamente arquivos `*.test.sql` em `supabase/tests/`.

### Project Structure Notes

**Alinhado com [architecture.md#Complete Project Directory Structure (linhas 559-568)](../planning-artifacts/architecture.md):**
- `supabase/migrations/0001_profiles.sql` ✅ (criado nesta story)
- `supabase/tests/0001_profiles.test.sql` ✅ (criado nesta story; pgTAP)
- `src/lib/database.types.ts` ✅ (regenerado — era stub `any` pós-Story 1.1)
- `README.md` ✅ (1 linha nova na seção "Setup local")

**Variações vs a árvore alvo (OK — serão preenchidas nas próximas stories):**
- `supabase/migrations/0002_*.sql` (RLS adicionais de outras tabelas) → Stories 1.9/1.10
- `supabase/functions/_shared/` → populado na Story 3.x (primeira Edge Function)
- `supabase/seeds/` → populado na Story 1.9 (extração de `src/lib/calculations.ts`)
- `src/lib/schemas/profile.ts` Zod → Story 1.5 (signup form)
- `src/lib/queries/auth.ts` → Story 1.6 (AuthContext consumindo `profiles`)

**Conflitos a resolver nesta story:**
- Stub `export type Database = any;` (Story 1.1) → substituído pelos tipos gerados.

### References

- [epics.md#Story 1.3 (`_bmad-output/planning-artifacts/epics.md:384-405`)](../planning-artifacts/epics.md) — AC source of truth.
- [epics.md#Epic 1 — Fundação Completa (linhas 259-267)](../planning-artifacts/epics.md) — contexto bloqueante da story.
- [architecture.md#Authentication & Security (linhas 180-188)](../planning-artifacts/architecture.md) — decisão RLS + role.
- [architecture.md#Data Architecture (linhas 165-178)](../planning-artifacts/architecture.md) — modelagem `profiles` como user + role.
- [architecture.md#Naming Patterns — Database (linhas 255-266)](../planning-artifacts/architecture.md) — convenções SQL.
- [architecture.md#Enforcement Guidelines (linhas 403-414)](../planning-artifacts/architecture.md) — 10 regras obrigatórias para agentes.
- [architecture.md#Implementation Handoff (linhas 759-768)](../planning-artifacts/architecture.md) — ordem de migrations.
- [architecture.md#Development Workflow (linhas 633-648)](../planning-artifacts/architecture.md) — `supabase start`, `supabase gen types`.
- [1-1-integracao-supabase-cliente-singleton-limpeza-lovable.md (`_bmad-output/implementation-artifacts/1-1-...md`)](./1-1-integracao-supabase-cliente-singleton-limpeza-lovable.md) — estado pós-Story 1.1 (stub types, `supabase/` via init).
- [1-2-design-system-medway.md](./1-2-design-system-medway.md) — previous story (zero impacto, FYI).
- [deferred-work.md](./deferred-work.md) — itens diferidos (nenhum bloqueia esta story).
- Código existente relevante: `supabase/config.toml`, `src/lib/supabase.ts` (singleton com generic `<Database>` — passará a consumir tipos reais), `src/lib/database.types.ts` (stub a ser regenerado).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `supabase db reset` — migração `0001_profiles.sql` aplicada sem erros.
- `\d+ public.profiles` via docker exec: 11 colunas, PK `id`, FK `auth.users(id) ON DELETE CASCADE`, UNIQUE `email`, CHECK `role IN ('student','admin')`, índice `idx_profiles_role`, trigger `trg_profiles_set_updated_at`, 4 policies RLS com `force row security enabled`.
- `select tgname from pg_trigger where tgrelid='auth.users'::regclass and tgname='on_auth_user_created'` → presente.
- `supabase test db` → 14/14 testes pgTAP passaram (plano ajustado de 13 para 14 após primeira execução contar cada asserção separadamente).
- `supabase gen types typescript --local` → `Database['public']['Tables']['profiles']` e `Database['public']['Functions']['is_admin']` agora tipados; 221 linhas.
- `bun run lint` → 0 erros, 7 warnings baseline (react-refresh em shadcn/ui — pré-existentes pós-Story 1.2).
- `bun run build` → build Vite OK em 1.22s, bundle 304 kB / gzip 97 kB.
- `bun run test` → `src/test/example.test.ts` verde (1/1).

### Completion Notes List

- Schema `profiles` criado com exatamente os 11 campos do AC1; `id` é PK+FK para `auth.users(id)` com `ON DELETE CASCADE` (pré-requisito do Epic 5 — delete-account).
- Trigger `on_auth_user_created` + função `handle_new_user()` (SECURITY DEFINER, `set search_path = public`) popula `profiles` automaticamente a partir de `raw_user_meta_data`. Defesas aplicadas: `coalesce(..., '')` em `name` (evita violar NOT NULL se signup vier sem metadados), `nullif('','')::int` em `graduation_year` (trata string vazia).
- RLS habilitada **e forçada** (`force row level security`) — garante que até `postgres` respeita policies em CI. Quatro policies: `profiles_select_own_or_admin`, `profiles_update_own_preserve_role` (bloqueia role escalation via `WITH CHECK` comparando role novo com subquery do atual), `profiles_update_admin_all`, `profiles_delete_own_or_admin`. Nenhuma policy de INSERT → default deny; trigger `handle_new_user` SECURITY DEFINER bypassa.
- `public.is_admin(uid uuid)` SECURITY DEFINER + STABLE evita recursão de RLS nas policies de admin.
- `public.set_updated_at()` criada genericamente para reuso em `user_curriculum`, `user_scores`, `scoring_rules`, etc. (Stories 1.9/1.10+).
- Desvio intencional da Task 1.2: **não** criei `idx_profiles_email` — UNIQUE já gera índice implícito `profiles_email_key`. Redundância documentada nas Dev Notes → "Correção" (linha 337). Mantido apenas `idx_profiles_role` para queries do Epic 4.
- `src/lib/database.types.ts` regenerado via `supabase gen types typescript --local`; stub `export type Database = any` substituído por tipos reais. Comentário-marca preservado no topo.
- Testes pgTAP em `supabase/tests/0001_profiles.test.sql` validam: schema (has_table/has_column/col_has_check/col_not_null), trigger (has_trigger + inserção em auth.users + verificação de profile populado), RLS ativa+forçada, contagem de policies=4, isolamento student (conta=1 sob JWT próprio), bloqueio de role escalation via `throws_ok` com SQLSTATE `42501`, visão admin (conta=2 sob JWT de admin).
- Nenhuma dependência npm adicionada (escopo SQL puro + arquivo gerado).

### File List

- `supabase/migrations/0001_profiles.sql` (criado)
- `supabase/tests/0001_profiles.test.sql` (criado)
- `src/lib/database.types.ts` (regenerado — de stub `any` para tipos tipados via `supabase gen types`)
- `README.md` (1 linha adicionada na seção "Setup local" sobre regeneração de types)
- `_bmad-output/implementation-artifacts/1-3-schema-profiles-trigger-rls.md` (status, tasks, Dev Agent Record, File List, Change Log)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status `1-3-...` → review; `last_updated`)

### Review Findings

Code review executado em 2026-04-14 (3 camadas: Blind Hunter, Edge Case Hunter, Acceptance Auditor). Acceptance Auditor: sem violações de AC. Edge/Blind: 46 observações consolidadas em 13 itens + ~15 dispensados.

**Decisões pendentes (4) — precisam de input antes de patch:**

- [x] [Review][Decision] **Role-preservation via subquery vs. BEFORE UPDATE trigger** — `profiles_update_own_preserve_role` usa `with check (... and role = (select p.role from profiles p where p.id = auth.uid()))`. Durante um UPDATE, o snapshot visto pelo subquery pode divergir do esperado (planner-dependent) e, em cenários concorrentes, criar janela para escalation. Padrão mais seguro: trigger BEFORE UPDATE comparando `OLD.role` vs `NEW.role` e abortando quando não-admin. pgTAP atual valida só via SQLSTATE 42501, não o mecanismo. [supabase/migrations/0001_profiles.sql:109-115]
- [x] [Review][Decision] **Suporte a signup sem email (phone-only/OAuth sem email)** — `profiles.email NOT NULL` + `handle_new_user` usa `new.email` direto. Se o projeto algum dia habilitar phone-only signup ou provider OAuth sem email, a signup falha silenciosamente no Auth. Decidir: (a) restringir Auth a email-only e documentar, ou (b) tornar `email` nullable e ajustar trigger. [supabase/migrations/0001_profiles.sql:57-69]
- [x] [Review][Decision] **Sincronização de `profiles.email` com `auth.users.email`** — quando usuário alterar email via Supabase Auth, `profiles.email` fica stale. Decidir: (a) trigger AFTER UPDATE em `auth.users` propagando, (b) remover coluna e usar view/join, ou (c) aceitar drift e documentar. [supabase/migrations/0001_profiles.sql:50-72]
- [x] [Review][Decision] **Policy DELETE permite student auto-deletar (orfana auth.users)** — `profiles_delete_own_or_admin` deixa aluno executar `delete from profiles where id = auth.uid()`; `auth.users` permanece. Epic 5 prevê exclusão via Edge Function `delete-account` (cascade). Decidir: (a) remover student do DELETE policy agora (recomendado — não há caminho no MVP que chame delete direto), ou (b) manter e deixar Epic 5 cuidar. [supabase/migrations/0001_profiles.sql:127-129]

**Patches diretos (3):**

- [x] [Review][Patch] **Revogar EXECUTE de `public.is_admin` de `public`/`anon`** — SECURITY DEFINER exposto via PostgREST RPC permite qualquer cliente (até anon) chamar `rpc('is_admin', { uid: '<qualquer uuid>' })` e enumerar admins. Adicionar `revoke execute on function public.is_admin(uuid) from public, anon; grant execute on function public.is_admin(uuid) to authenticated;`. Manter chamada interna nas policies intacta (executor da policy já tem priv). [supabase/migrations/0001_profiles.sql:82-93]
- [x] [Review][Patch] **Cast seguro de `graduation_year` em `handle_new_user`** — `nullif(..., '')::int` lança `invalid_text_representation` para valor não-numérico (ex.: `"2027a"`, emoji, espaço), abortando a INSERT em `auth.users`. Envolver em bloco com `exception when invalid_text_representation then null` ou validar via regex `'^\d+$'` antes do cast. [supabase/migrations/0001_profiles.sql:67]
- [x] [Review][Patch] **Verificar setup de JWT nos testes pgTAP** — `set local "request.jwt.claims" to '{...}'` + `set local role authenticated`. Supabase local normalmente expõe `auth.uid()` lendo de `request.jwt.claims`, mas há variação entre versões (algumas leem `request.jwt.claim.sub`). Se `auth.uid()` retornar NULL no contexto do teste, as asserções `count=1/count=2` podem estar validando o cenário errado (falso verde). Rodar `supabase db reset && supabase test db` e confirmar que os 14 testes realmente exercem as policies — se não, ajustar para setar ambos GUCs ou usar helper do Supabase. [supabase/tests/0001_profiles.test.sql:76-83,102-108]

**Deferidos (6) — registrados em `deferred-work.md`:**

- [x] [Review][Defer] `set_updated_at` sem `when (old.* is distinct from new.*)` — churn em UPDATEs no-op, baixa prioridade. [supabase/migrations/0001_profiles.sql:42-44]
- [x] [Review][Defer] Email case-sensitivity (`Foo@bar.com` vs `foo@bar.com`) — Supabase Auth normaliza, mas sem `citext`/índice funcional em `profiles.email`. [supabase/migrations/0001_profiles.sql:14]
- [x] [Review][Defer] `handle_new_user` não-idempotente (sem `on conflict do nothing`) — relevante apenas em replay/restore. [supabase/migrations/0001_profiles.sql:57-69]
- [x] [Review][Defer] Faltam INSERT policies para workflows admin (Epic 3 — CRUD de usuário via admin shell). [supabase/migrations/0001_profiles.sql:123-124]
- [x] [Review][Defer] pgTAP insert direto em `auth.users` omite colunas NOT NULL reais (`encrypted_password`, `aud`, `instance_id`, `role`). Supabase local aceita, mas teste diverge de produção. [supabase/tests/0001_profiles.test.sql:20-48]
- [x] [Review][Defer] `graduation_year` sem CHECK bounds (`< 1900 or > 2100`, overflow int4) — validação no Zod da Story 1.5. [supabase/migrations/0001_profiles.sql:18]

**Resoluções aplicadas (2026-04-14):**

- **D1** → criado trigger `BEFORE UPDATE OF role` `trg_prevent_role_escalation` (chama `prevent_role_self_escalation()` SECURITY DEFINER); policy `profiles_update_own_preserve_role` renomeada para `profiles_update_own` e WITH CHECK simplificado (só `auth.uid() = id`). Errcode `42501` mantido — pgTAP `throws_ok` continua válido.
- **D2** → MVP confirmado como email-only. Providers OAuth sem email e phone-only signup estão **fora de escopo**; quando surgir o requisito, tornar `profiles.email` nullable + ajustar `handle_new_user` (coalesce) e abrir migration de revisão.
- **D3** → criado trigger `AFTER UPDATE OF email` em `auth.users` → `handle_user_email_update()` (SECURITY DEFINER) propaga para `profiles.email` quando distinct.
- **D4** → policy DELETE reescrita para `profiles_delete_admin_only` (só admin). Auto-exclusão de aluno via Edge Function `delete-account` no Epic 5.
- **P1** → `revoke execute on function public.is_admin(uuid) from public; grant execute ... to authenticated;`
- **P2** → `graduation_year` agora usa `case when grad_year_raw ~ '^\d{1,9}$' then ::int else null end` — signup não aborta em entrada não-numérica.
- **P3** → pgTAP `plan(15)` com nova asserção `is(auth.uid(), '<uuid>', ...)` logo após primeiro `set local "request.jwt.claims"` — previne falso-verde caso o GUC não resolva.

**Dispensados (~15):** ausência de `idx_profiles_email` (alinhado à correção do spec linha 337), `name=''` default via coalesce (intencional per AC1), `role: string` em types.ts (limitação do `supabase gen types`), concurrent email collision (Supabase Auth trata), `is_admin` STABLE cache (fine para o uso), `search_path = public` omitindo auth (não usado no corpo), FK ON DELETE CASCADE (presente — falso positivo), admin policy OR'd com student (comportamento intencional), validações de format em `phone/state/university` (escopo Zod da Story 1.5).

## Change Log

| Data       | Versão | Descrição                                                                                 | Autor    |
|------------|--------|-------------------------------------------------------------------------------------------|----------|
| 2026-04-14 | 0.1    | Story 1.3 criada via create-story (ready-for-dev). Schema profiles + trigger + RLS.        | PM       |
| 2026-04-14 | 1.0    | Implementação concluída: migration 0001_profiles.sql aplicada, 14 testes pgTAP verdes, types regenerados, lint/build/test ok. Status → review. | Dev (Claude Opus 4.6) |
