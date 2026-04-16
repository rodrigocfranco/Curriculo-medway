# Story 1.10: Schema de currículo e scores + bucket `editais`

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **desenvolvedor (Rcfranco, solo) do curriculo-medway**,
I want **criar as migrations `0003_curriculum_scores.sql` (tabelas `curriculum_fields`, `user_curriculum`, `user_scores` + triggers + RLS) e `0004_storage_editais.sql` (bucket `editais` com limit 10MB e policies), popular `supabase/seeds/curriculum_fields.sql` a partir do contrato atual ([src/lib/types.ts](../../src/lib/types.ts) + labels de [src/lib/calculations.ts](../../src/lib/calculations.ts)), e regenerar `src/lib/database.types.ts`**,
so that **Epic 2 (currículo + autosave + cálculo via RPC `calculate_scores`) tenha o schema base pronto, Epic 3 (admin) tenha onde anexar PDFs de editais, e o cache `user_scores.stale=true` esteja em lugar para invalidação reativa das triggers de `scoring_rules`**.

## Acceptance Criteria

Copiados verbatim de [epics.md#Story 1.10 (_bmad-output/planning-artifacts/epics.md:561-587)](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Migration `0003_curriculum_scores.sql` cria 3 tabelas com schema correto + triggers `updated_at`**
   **Given** as migrations prévias aplicadas (`0001_profiles.sql` da Story 1.3 — define `public.profiles` + função genérica `public.set_updated_at()`; `0002_rules_engine.sql` da Story 1.9 — define `public.institutions` e `public.specialties`)
   **When** aplico `supabase/migrations/0003_curriculum_scores.sql` via `supabase db reset`
   **Then** existem:
   - `public.curriculum_fields (id uuid PK default gen_random_uuid(), category text NOT NULL, field_key text UNIQUE NOT NULL, label text NOT NULL, field_type text NOT NULL CHECK (field_type IN ('number','boolean','select','text')), options jsonb, display_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now())`
   - `public.user_curriculum (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now())`
   - `public.user_scores (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE, specialty_id uuid NULL REFERENCES public.specialties(id) ON DELETE CASCADE, score numeric NOT NULL DEFAULT 0, max_score numeric NOT NULL DEFAULT 0, breakdown jsonb NOT NULL DEFAULT '{}'::jsonb, stale boolean NOT NULL DEFAULT true, calculated_at timestamptz NULL, PRIMARY KEY (user_id, institution_id, specialty_id))` (PK composta; `specialty_id NULL` é default institucional)
   **And** triggers `BEFORE UPDATE` reutilizam `public.set_updated_at()` (da Story 1.3) para `user_curriculum`
   **And** índices criados: `idx_curriculum_fields_display_order (category, display_order)`, `idx_user_scores_user_id (user_id)`, `idx_user_scores_institution (institution_id, specialty_id)`

2. **AC2 — RLS isola aluno aos próprios dados em `user_curriculum`/`user_scores`; `curriculum_fields` tem leitura pública e escrita admin**
   **Given** RLS habilitada + `FORCE` nas 3 tabelas (`ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`)
   **When** aluno autenticado (`auth.uid()` não-null, `role='student'`) consulta
   **Then** `user_curriculum` e `user_scores` só retornam linhas onde `auth.uid() = user_id` (SELECT + INSERT + UPDATE + DELETE policies usando `USING (auth.uid() = user_id)` e `WITH CHECK (auth.uid() = user_id)`)
   **And** `curriculum_fields` permite SELECT para `anon` e `authenticated` (leitura pública — padrão do motor de regras de 1.9); INSERT/UPDATE/DELETE apenas quando `public.is_admin(auth.uid())` (helper SECURITY DEFINER já criado na Story 1.3)
   **And** PK composta de `user_scores` não é bypassada: aluno não consegue INSERT/UPDATE de linha com `user_id ≠ auth.uid()`

3. **AC3 — Seed `supabase/seeds/curriculum_fields.sql` popula catálogo completo + idempotente**
   **Given** `supabase/seeds/curriculum_fields.sql` derivado de [src/lib/types.ts](../../src/lib/types.ts) (contrato canônico de `UserProfile`) com labels de [src/lib/calculations.ts](../../src/lib/calculations.ts) (melhor fonte humana)
   **When** executo `supabase db reset` (que roda migrations + `supabase/seed.sql` que chama o arquivo via `\i`)
   **Then** todas as **29 chaves** de `UserProfile` estão em `curriculum_fields`, distribuídas nas 5 categorias:
   - `Publicações` (5 fields): `artigos_high_impact`, `artigos_mid_impact`, `artigos_low_impact`, `artigos_nacionais`, `capitulos_livro`
   - `Acadêmico` (5 fields): `ic_com_bolsa`, `ic_sem_bolsa`, `ic_horas_totais`, `monitoria_semestres`, `extensao_semestres`
   - `Prática/Social` (5 fields): `voluntariado_horas`, `estagio_extracurricular_horas`, `trabalho_sus_meses`, `projeto_rondon`, `internato_hospital_ensino`
   - `Liderança/Eventos` (8 fields): `diretoria_ligas`, `membro_liga_anos`, `representante_turma_anos`, `cursos_suporte`, `apresentacao_congresso`, `ouvinte_congresso`, `organizador_evento`, `teste_progresso`
   - `Perfil` (6 fields): `ingles_fluente`, `media_geral`, `conceito_historico`, `ranking_ruf_top35`, `mestrado`, `doutorado`
   **And** `field_type` mapeia: `boolean` → checkbox (`projeto_rondon`, `internato_hospital_ensino`, `ingles_fluente`, `ranking_ruf_top35`, `mestrado`, `doutorado`); `select` → `conceito_historico` com `options='["A","B","C"]'::jsonb`; `number` → demais
   **And** `display_order` preserva ordem de declaração em `UserProfile` dentro de cada categoria (offset 10 entre itens para permitir inserções futuras sem realocar)
   **And** seed usa `INSERT ... ON CONFLICT (field_key) DO UPDATE SET label=EXCLUDED.label, category=EXCLUDED.category, field_type=EXCLUDED.field_type, options=EXCLUDED.options, display_order=EXCLUDED.display_order` (idempotente — rodar 2x não duplica)

4. **AC4 — Migration `0004_storage_editais.sql` cria bucket + MIME/size + policies**
   **Given** `supabase/migrations/0004_storage_editais.sql`
   **When** aplico
   **Then** bucket `editais` existe em `storage.buckets` com `file_size_limit = 10485760` (10 MiB exatos), `allowed_mime_types = ARRAY['application/pdf']`, `public = false`
   **And** policies em `storage.objects` restritas ao `bucket_id = 'editais'`:
   - `editais_admin_write_insert`: INSERT WITH CHECK `public.is_admin(auth.uid())`
   - `editais_admin_write_update`: UPDATE USING + WITH CHECK `public.is_admin(auth.uid())`
   - `editais_admin_write_delete`: DELETE USING `public.is_admin(auth.uid())`
   - `editais_authenticated_read`: SELECT USING `auth.role() = 'authenticated'` (qualquer student autenticado faz download/preview)
   **And** INSERT é idempotente (`INSERT ... ON CONFLICT (id) DO UPDATE SET file_size_limit=EXCLUDED.file_size_limit, allowed_mime_types=EXCLUDED.allowed_mime_types`) — rerun de `db reset` não quebra

5. **AC5 — `src/lib/database.types.ts` regenerado + commitado**
   **Given** migrations 0003 e 0004 aplicadas localmente (`supabase db reset` limpo)
   **When** rodo `supabase gen types typescript --local > src/lib/database.types.ts`
   **Then** o arquivo contém `Database['public']['Tables']['curriculum_fields' | 'user_curriculum' | 'user_scores']['Row'|'Insert'|'Update']` com todas as colunas tipadas
   **And** `data: Json` em `user_curriculum.Row` e `breakdown: Json` em `user_scores.Row` (jsonb)
   **And** marca-comentário `// GERADO — não editar manualmente` no topo é **preservada** (re-adicionar se o gen remover)
   **And** `tsc --noEmit` passa sem erro (nenhum consumidor existente quebra — esse schema é greenfield, consumido só a partir de Epic 2)

## Tasks / Subtasks

- [x] **Task 1 — Criar migration `0003_curriculum_scores.sql`** (AC: #1, #2)
  - [x] 1.1 Gerar esqueleto: `supabase migration new curriculum_scores`; **renomear** arquivo para `0003_curriculum_scores.sql` (convenção numérica sequencial — ver [architecture.md#Implementation Handoff (linhas 761-767)](../planning-artifacts/architecture.md) e padrão estabelecido em `0001_profiles.sql`).
  - [x] 1.2 Header + dependências explícitas (pattern da Story 1.3):
    ```sql
    -- 0003_curriculum_scores.sql
    -- Story 1.10: curriculum_fields + user_curriculum + user_scores + RLS
    -- Depends on: 0001_profiles.sql (profiles + set_updated_at + is_admin),
    --             0002_rules_engine.sql (institutions + specialties)
    ```
  - [x] 1.3 **Tabela `curriculum_fields`** — catálogo de campos (leitura pública, escrita admin):
    ```sql
    create table public.curriculum_fields (
      id uuid primary key default gen_random_uuid(),
      category text not null,
      field_key text not null unique,
      label text not null,
      field_type text not null check (field_type in ('number','boolean','select','text')),
      options jsonb,
      display_order int not null default 0,
      created_at timestamptz not null default now()
    );

    create index idx_curriculum_fields_display_order
      on public.curriculum_fields (category, display_order);
    ```
    **Não** adicionar `updated_at` — catálogo mutável por seed/admin; suficiente `created_at` para auditoria mínima.
  - [x] 1.4 **Tabela `user_curriculum`** — currículo do aluno (1 linha por user, `data jsonb`):
    ```sql
    create table public.user_curriculum (
      user_id uuid primary key references public.profiles(id) on delete cascade,
      data jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    );

    create trigger trg_user_curriculum_set_updated_at
      before update on public.user_curriculum
      for each row execute function public.set_updated_at();
    ```
    **Reutilize** `public.set_updated_at()` — função genérica criada na Story 1.3 (não redefinir).
    **Não** adicionar coluna `specialty` — especialidade escolhida fica no `profiles.specialty_interest` (já existe) + seleção inline (Epic 2).
  - [x] 1.5 **Tabela `user_scores`** — cache de scores com PK composta + flag `stale`:
    ```sql
    create table public.user_scores (
      user_id uuid not null references public.profiles(id) on delete cascade,
      institution_id uuid not null references public.institutions(id) on delete cascade,
      specialty_id uuid null references public.specialties(id) on delete cascade,
      score numeric not null default 0,
      max_score numeric not null default 0,
      breakdown jsonb not null default '{}'::jsonb,
      stale boolean not null default true,
      calculated_at timestamptz null,
      primary key (user_id, institution_id, specialty_id)
    );

    create index idx_user_scores_user_id on public.user_scores (user_id);
    create index idx_user_scores_institution on public.user_scores (institution_id, specialty_id);
    ```
    **Atenção PK composta com NULL**: Postgres considera `(u, i, NULL)` e `(u, i, NULL)` como **distintos** em UNIQUE/PK por default. Para MVP aceitar essa semântica — `calculate_scores` (Story 2.5) usará `INSERT ... ON CONFLICT (user_id, institution_id, specialty_id)` com lógica explícita de NULL via `COALESCE(specialty_id, '00000000-0000-0000-0000-000000000000'::uuid)` ou via `UNIQUE NULLS NOT DISTINCT` (Postgres 15+). **Decisão**: deixar PK composta simples agora; documentar no dev note para Story 2.5 escolher a abordagem.
  - [x] 1.6 **Habilitar RLS** (padrão `ENABLE + FORCE` da Story 1.3):
    ```sql
    alter table public.curriculum_fields enable row level security;
    alter table public.curriculum_fields force row level security;

    alter table public.user_curriculum enable row level security;
    alter table public.user_curriculum force row level security;

    alter table public.user_scores enable row level security;
    alter table public.user_scores force row level security;
    ```
  - [x] 1.7 **Policies `curriculum_fields`** — leitura pública (anon+authenticated), escrita admin via helper `is_admin`:
    ```sql
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
    ```
    Reutiliza helper `public.is_admin(uuid)` da Story 1.3 (já tem `grant execute ... to authenticated` aplicado).
  - [x] 1.8 **Policies `user_curriculum` e `user_scores`** — isolamento estrito por `auth.uid() = user_id`:
    ```sql
    -- user_curriculum: CRUD completo limitado ao dono
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

    -- user_scores: idem (cache; em tese escrita só vem de calculate_scores SECURITY DEFINER,
    -- mas deixamos policy simétrica — defesa em profundidade se SD for desabilitado acidentalmente)
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
    ```
    **Não** adicionar policy admin para `user_*` — admin acessa dados de alunos via views anonimizadas (Epic 4/5), não direto.

- [x] **Task 2 — Criar seed `supabase/seeds/curriculum_fields.sql`** (AC: #3)
  - [x] 2.1 **Extrair contrato** de [src/lib/types.ts](../../src/lib/types.ts) (29 chaves de `UserProfile`) + labels curtos em português (derivados de [src/lib/calculations.ts](../../src/lib/calculations.ts); ver dev note "Labels canônicos" abaixo).
  - [x] 2.2 Criar `supabase/seeds/curriculum_fields.sql` com **exatamente 29 INSERTs** + `ON CONFLICT` idempotente:
    ```sql
    -- supabase/seeds/curriculum_fields.sql
    -- Story 1.10: Catálogo de campos do currículo (29 fields, 5 categorias).
    -- Fonte canônica: src/lib/types.ts (UserProfile). Labels de src/lib/calculations.ts.
    -- Idempotente: rodar 2x não duplica, atualiza label/category/type/order.

    insert into public.curriculum_fields (category, field_key, label, field_type, options, display_order) values
      -- Publicações (5)
      ('Publicações','artigos_high_impact','Artigos de alto impacto (1º autor, indexado)','number',null,10),
      ('Publicações','artigos_mid_impact','Artigos de médio impacto / coautoria indexada','number',null,20),
      ('Publicações','artigos_low_impact','Artigos de baixo impacto','number',null,30),
      ('Publicações','artigos_nacionais','Artigos em periódicos nacionais','number',null,40),
      ('Publicações','capitulos_livro','Capítulos de livro publicados','number',null,50),
      -- Acadêmico (5)
      ('Acadêmico','ic_com_bolsa','Iniciações científicas com bolsa (anos)','number',null,10),
      ('Acadêmico','ic_sem_bolsa','Iniciações científicas sem bolsa (anos)','number',null,20),
      ('Acadêmico','ic_horas_totais','Horas totais de IC','number',null,30),
      ('Acadêmico','monitoria_semestres','Semestres de monitoria oficial','number',null,40),
      ('Acadêmico','extensao_semestres','Semestres de extensão universitária','number',null,50),
      -- Prática/Social (5)
      ('Prática/Social','voluntariado_horas','Horas de voluntariado','number',null,10),
      ('Prática/Social','estagio_extracurricular_horas','Horas de estágio extracurricular','number',null,20),
      ('Prática/Social','trabalho_sus_meses','Meses de trabalho no SUS','number',null,30),
      ('Prática/Social','projeto_rondon','Participou do Projeto Rondon','boolean',null,40),
      ('Prática/Social','internato_hospital_ensino','Internato em hospital de ensino próprio','boolean',null,50),
      -- Liderança/Eventos (8)
      ('Liderança/Eventos','diretoria_ligas','Cargos em diretoria de ligas','number',null,10),
      ('Liderança/Eventos','membro_liga_anos','Anos como membro de liga','number',null,20),
      ('Liderança/Eventos','representante_turma_anos','Anos como representante de turma','number',null,30),
      ('Liderança/Eventos','cursos_suporte','Cursos de suporte de vida (ACLS, ATLS, PALS)','number',null,40),
      ('Liderança/Eventos','apresentacao_congresso','Apresentações em congressos','number',null,50),
      ('Liderança/Eventos','ouvinte_congresso','Participações como ouvinte em congressos','number',null,60),
      ('Liderança/Eventos','organizador_evento','Eventos organizados','number',null,70),
      ('Liderança/Eventos','teste_progresso','Testes de progresso realizados','number',null,80),
      -- Perfil (6)
      ('Perfil','ingles_fluente','Inglês fluente (certificação oficial)','boolean',null,10),
      ('Perfil','media_geral','Média geral no histórico (0-10 ou 0-100)','number',null,20),
      ('Perfil','conceito_historico','Conceito global do histórico','select','["A","B","C"]'::jsonb,30),
      ('Perfil','ranking_ruf_top35','Faculdade no Top 35 RUF','boolean',null,40),
      ('Perfil','mestrado','Mestrado concluído','boolean',null,50),
      ('Perfil','doutorado','Doutorado concluído','boolean',null,60)
    on conflict (field_key) do update set
      label = excluded.label,
      category = excluded.category,
      field_type = excluded.field_type,
      options = excluded.options,
      display_order = excluded.display_order;
    ```
  - [x] 2.3 **Wire up no `supabase/seed.sql`** (arquivo carregado por `db reset` pós-migrations): adicionar `\i seeds/curriculum_fields.sql` (ou criar `supabase/seed.sql` se não existe — `supabase/seeds/` não é auto-carregado, só `supabase/seed.sql` é). **Verificar primeiro** se Story 1.9 já criou `supabase/seed.sql` para carregar seeds de instituições — se sim, apenas anexar linha; se não, criar com comentário-header.

- [x] **Task 3 — Criar migration `0004_storage_editais.sql`** (AC: #4)
  - [x] 3.1 Gerar esqueleto: `supabase migration new storage_editais`; renomear para `0004_storage_editais.sql`.
  - [x] 3.2 **Insert idempotente do bucket** em `storage.buckets`:
    ```sql
    -- 0004_storage_editais.sql
    -- Story 1.10: bucket `editais` (PDFs, 10MB max, leitura autenticada, escrita admin)

    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('editais', 'editais', false, 10485760, array['application/pdf'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
    ```
  - [x] 3.3 **Policies em `storage.objects`** — `USING`/`WITH CHECK` inclui `bucket_id = 'editais'` para isolar policies deste bucket:
    ```sql
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
    ```
    **Atenção**: policies em `storage.objects` são **globais** — o filtro `bucket_id = 'editais'` é obrigatório para não afetar outros buckets (ex.: avatars futuros).
  - [x] 3.4 **Guard de `DROP POLICY IF EXISTS`** antes de cada `CREATE POLICY` para tornar migration re-aplicável em ambientes onde `db reset` não dropa storage schema (staging/prod):
    ```sql
    drop policy if exists "editais_authenticated_read" on storage.objects;
    drop policy if exists "editais_admin_write_insert" on storage.objects;
    drop policy if exists "editais_admin_write_update" on storage.objects;
    drop policy if exists "editais_admin_write_delete" on storage.objects;
    ```
    Colocar **antes** dos `create policy`.

- [x] **Task 4 — Testes pgTAP** (AC: #1, #2, #3, #4)
  - [x] 4.1 Criar `supabase/tests/0003_curriculum_scores.test.sql` seguindo padrão de `0001_profiles.test.sql`:
    - `has_table` para as 3 tabelas
    - `col_type_is`/`col_has_check` para `curriculum_fields.field_type`
    - `has_pk` composta em `user_scores`
    - RLS: `relrowsecurity = true` e `relforcerowsecurity = true` nas 3 tabelas
    - Fluxo funcional: inserir 2 users via `auth.users` (aproveitando trigger `handle_new_user`), setar `role='admin'` em 1 via update direto (ou via helper de teste), `set local role authenticated` + `set local request.jwt.claim.sub = ...`, upsert em `user_curriculum` do user 1 → confirmar que user 2 não vê
    - Contagem: `select is((select count(*) from public.curriculum_fields), 29::bigint, 'seed has 29 fields')` — **após** carregar seed manualmente na prova de teste ou em fixture separada
  - [x] 4.2 Criar `supabase/tests/0004_storage_editais.test.sql`:
    - `is((select file_size_limit from storage.buckets where id='editais'), 10485760, '10MB limit')`
    - `is((select allowed_mime_types from storage.buckets where id='editais'), array['application/pdf'], 'pdf only')`
    - Verificar existência das 4 policies em `storage.objects` via `pg_policies`
  - [x] 4.3 **Não** usar `test_helpers` ad-hoc além dos usados em 0001 — manter estilo consistente.

- [x] **Task 5 — Regenerar `src/lib/database.types.ts`** (AC: #5)
  - [x] 5.1 Subir Supabase local limpo: `supabase stop && supabase start && supabase db reset` (garante que `0001 + 0002 + 0003 + 0004` + seeds aplicam em ordem sem erro).
  - [x] 5.2 Rodar: `supabase gen types typescript --local > src/lib/database.types.ts`.
  - [x] 5.3 **Preservar o comentário-marca no topo**: após a regeneração, inserir `// GERADO — não editar manualmente` na linha 1 se o gen sobrescrever (gen do Supabase não preserva comentário — ver [1-3#AC3 (../planning-artifacts/epics.md:403)](../planning-artifacts/epics.md); padrão estabelecido em Story 1.3).
  - [x] 5.4 Confirmar `npx tsc --noEmit` passa. **Nenhum consumidor existente** usa `curriculum_fields`/`user_curriculum`/`user_scores` (schema greenfield consumido só a partir de Epic 2) — portanto risco zero de regressão.
  - [x] 5.5 Rodar `npm test` (vitest) — nenhum teste existente toca esse schema; deve permanecer verde.

- [x] **Task 6 — Atualizar [deferred-work.md](./deferred-work.md) e status**
  - [x] 6.1 Adicionar entrada em `deferred-work.md` (se já existir) listando itens fora de escopo que merecem ser rastreados:
    - PK composta com `NULL` em `user_scores.specialty_id` → escolher `UNIQUE NULLS NOT DISTINCT` vs sentinel UUID em **Story 2.5** (database function `calculate_scores`).
    - Trigger `mark_scores_stale` — **NÃO** implementar aqui; é escopo explícito da **Story 2.5**.
    - Legado `src/lib/calculations.ts` + `src/lib/types.ts` — manter intocado até Epic 2 (ver decisão consolidada em Story 1.3 dev notes).
  - [x] 6.2 Atualizar `sprint-status.yaml` (já feito pelo workflow; confirmar status `1-10-schema-curriculo-scores-bucket-editais: ready-for-dev`).

### Review Findings

_Code review executado em 2026-04-15 — 3 camadas paralelas (Blind Hunter, Edge Case Hunter, Acceptance Auditor)._

#### decision-needed

- [x] [Review][Decision] Orquestrador do seed diverge do AC3 literal — AC3 pedia `supabase/seed.sql` com `\i seeds/...`, mas `\i` é meta-comando psql e o driver pgx do Supabase CLI não aceita (verificado: `supabase db reset` falha com `syntax error at or near "\"`). **Resolução**: `sql_paths = ["./seeds/rules_engine.sql", "./seeds/curriculum_fields.sql"]` em `config.toml` — ordem explícita sem glob. AC3 deve ser atualizado na retrospectiva. [`supabase/config.toml:65`]

#### patch

- [x] [Review][Patch] `database.types.ts` não compila (falso positivo) — `tsc --noEmit` passa limpo; Acceptance Auditor reportou string `Connecting to db 5432` mas arquivo já estava limpo no HEAD. Verificado por grep. [`src/lib/database.types.ts`] **[DISMISSED — falso positivo]**
- [x] [Review][Patch] Testes pgTAP de `0004_storage_editais` agora têm 3 casos funcionais de RLS: student `throws_ok` em INSERT, anon vê 0 rows em SELECT, admin `lives_ok` em INSERT. `plan(10)`. [`supabase/tests/0004_storage_editais.test.sql:78-113`]
- [x] [Review][Patch] Teste 0003 agora valida caminho positivo admin: `lives_ok` insert em `curriculum_fields` via JWT com `profiles.role='admin'`, e conta persistência. [`supabase/tests/0003_curriculum_scores.test.sql:144-162`]
- [x] [Review][Patch] `plan()` ajustado para 28 (28 asserções reais; rodado e verde). [`supabase/tests/0003_curriculum_scores.test.sql:4`]
- [x] [Review][Patch] CHECK `user_scores_non_negative (score >= 0 and max_score >= 0)` adicionado. [`supabase/migrations/0003_curriculum_scores.sql:54`]
- [x] [Review][Patch] CHECK `user_scores_calc_consistency (stale = true or calculated_at is not null)` adicionado. [`supabase/migrations/0003_curriculum_scores.sql:55`]
- [x] [Review][Patch] CHECK `curriculum_fields_options_consistency` (field_type='select' ⇔ options IS NOT NULL) adicionado. [`supabase/migrations/0003_curriculum_scores.sql:19-22`]

#### defer

- [x] [Review][Defer] PK composta com `specialty_id NULL` em `user_scores` — deferido para Story 2.5 (conforme Task 6.1 e Dev Notes linhas 125/312/358). `UNIQUE NULLS NOT DISTINCT` vs sentinel UUID será decidido junto ao `calculate_scores`. [`supabase/migrations/0003_curriculum_scores.sql:42-52`] — deferido, decisão arquitetural em escopo futuro
- [x] [Review][Defer] Policies INSERT/UPDATE/DELETE de `user_scores` permitem student escrever via PostgREST direto (bypassando `calculate_scores` SECURITY DEFINER) — implementação segue AC2 literal ("SELECT + INSERT + UPDATE + DELETE policies"). Tightening (remover policies CRUD de student, manter só SELECT, escrita exclusiva via RPC) é decisão da Story 2.5. [`supabase/migrations/0003_curriculum_scores.sql:117-136`] — deferido, tightening faz sentido junto ao RPC
- [x] [Review][Defer] Seed `curriculum_fields` não remove `field_key` órfãos em reruns — drift silencioso quando `UserProfile` mudar. Aceitável MVP; revisitar quando Epic 2 formalizar contrato. [`supabase/seeds/curriculum_fields.sql:44-49`] — deferido, aceitável MVP
- [x] [Review][Defer] `user_curriculum.data jsonb` sem validação contra catálogo — aluno pode gravar chaves/tipos arbitrários. Intencional por design (flexibilidade Epic 2); validação cliente-side via Zod. [`supabase/migrations/0003_curriculum_scores.sql:28-32`] — deferido, validação na camada de app
- [x] [Review][Defer] `curriculum_fields.category` como `text` livre sem FK/enum — typo futuro cria categoria fantasma. Trade-off de simplicidade; considerar enum em Epic 2. [`supabase/migrations/0003_curriculum_scores.sql:12`] — deferido, Epic 2
- [x] [Review][Defer] `field_type='text'` permitido no CHECK mas nenhum field usa — reservado para futuro. Não-bug. [`supabase/migrations/0003_curriculum_scores.sql:15`] — deferido, reservado
- [x] [Review][Defer] `conceito_historico` tem `options='["A","B","C"]'` mas `calculations.ts` nunca lê essa chave — dead data até Epic 2 consumir. [`supabase/seeds/curriculum_fields.sql:40`] — deferido, Epic 2.6
- [x] [Review][Defer] Label `media_geral` ambíguo (`0-10 ou 0-100`) — `calculations.ts` usa `>= 80` e `>= 85` (escala 0-100). UI de Epic 2 precisa resolver escala. [`supabase/seeds/curriculum_fields.sql:38`] — deferido, Epic 2

## Dev Notes

### Contexto crítico (ler antes de codar)

1. **Pré-requisito NÃO satisfeito ainda: Story 1.9** cria `institutions` e `specialties` (FKs usadas em `user_scores`). No sprint atual 1.9 está `backlog`. **Se 1.9 não rodou antes**, o `db reset` desta migration **vai falhar** no `REFERENCES public.institutions(id)`. Decisão operacional: **rodar 1.9 antes de 1.10**, ou — se o desenvolvedor optar por paralelizar — criar esta migration mas **deferir `supabase db reset`** até 1.9 estar aplicada. **Flag isso no completion notes** se 1.9 ainda for backlog quando esta story for dev'ada.
2. **Escopo greenfield total**: `curriculum_fields`, `user_curriculum`, `user_scores` são tabelas **novas**; **nenhum consumidor em runtime** usa (frontend ainda consome `src/lib/calculations.ts` + state local — migração para Supabase começa em Story 2.1). Portanto: **risco zero de regressão**, foco 100% no schema correto.
3. **Helpers reutilizados da Story 1.3** (não redefinir): `public.set_updated_at()` e `public.is_admin(uuid)`. Ambos já têm `grant execute` apropriado. Se o dev agent tentar recriar, abortar — é duplicação que confunde migrations futuras.
4. **Padrão migration-por-feature estabelecido** ([architecture.md#761-767](../planning-artifacts/architecture.md)): `0001_profiles`, `0002_rules_engine` (Story 1.9), `0003_curriculum_scores` (esta), `0004_storage_editais` (esta). **Não** mesclar 0003 e 0004 numa só migration — separação Postgres-schema vs Storage é deliberada (facilita rollback cirúrgico de Storage sem mexer em schema relacional).

### Padrões de arquitetura que você DEVE seguir (confirmados nas Stories 1.1–1.7)

- **SQL lowercase** (keywords minúsculas, identifier quoting ausente) — ver `0001_profiles.sql`.
- **RLS `ENABLE + FORCE` em todas as tabelas** — `FORCE` garante que dono da tabela respeita policies em testes/migrations.
- **Policies com `to authenticated`** explícito quando só usuários logados podem acessar; `to anon, authenticated` quando leitura pública. **Evitar** policies sem `TO <role>` (default é `PUBLIC` que inclui `service_role` e pode vazar em cenários inesperados).
- **Helpers SECURITY DEFINER + `set search_path = public`** — padrão de `handle_new_user` e `is_admin` em `0001`. Esta story **não cria novas funções**, mas se precisar, seguir esse padrão.
- **Índices explícitos por FK** — Postgres não indexa FK automaticamente; adicionar `idx_<table>_<cols>` para queries do Epic 2 (`user_scores` por `user_id` e `institution_id, specialty_id`).
- **`ON DELETE CASCADE` nos FKs para `auth.users`/`profiles`** — LGPD: exclusão de conta em Epic 5 apaga currículo + scores em cascata sem código adicional.

### Anti-patterns a EVITAR

- ❌ **Não** colocar `specialty_id uuid NOT NULL` em `user_scores` — AC exige `NULL` como "especialidade default da instituição" (casos onde regras não variam por especialidade).
- ❌ **Não** usar `serial`/`bigserial`/sequence integer em nenhuma PK — projeto usa `uuid` em toda parte (consistência com `profiles.id`).
- ❌ **Não** criar trigger `mark_scores_stale` aqui — é escopo explícito da Story 2.5 (DB function `calculate_scores` + trigger de invalidação). Esta story só deixa `stale boolean DEFAULT true` como cache flag.
- ❌ **Não** criar índice em `user_scores (user_id, stale) WHERE stale = true` — otimização prematura (sem dados ainda). Adicionar em Story 2.5 se benchmarks justificarem.
- ❌ **Não** popular `user_scores` com seeds — é cache runtime; fica vazio até o primeiro `calculate_scores(user_id)` do aluno.
- ❌ **Não** adicionar coluna `deleted_at` (soft delete) — escopo não contempla; usar `ON DELETE CASCADE` puro.
- ❌ **Não** criar RLS policy de admin em `user_curriculum`/`user_scores` — dados do aluno não são acessados diretamente pelo admin; admin consome views anonimizadas (Story 5.4) e agregações (Epic 4).
- ❌ **Não** editar [src/lib/types.ts](../../src/lib/types.ts) nem [src/lib/calculations.ts](../../src/lib/calculations.ts) — são legado intocado até Epic 2 (decisão consolidada em Story 1.3 dev notes).

### Decisões técnicas específicas

- **Seed como `supabase/seeds/curriculum_fields.sql` + wire em `supabase/seed.sql`**: Supabase CLI só auto-carrega `supabase/seed.sql` após `db reset`. Para manter o arquivo desta story versionável e modular, criar `seeds/curriculum_fields.sql` e incluir via `\i seeds/curriculum_fields.sql` no `seed.sql`. Verificar se Story 1.9 já criou `seed.sql` para incluir `seeds/rules_engine.sql` — se sim, apenas adicionar linha; se não, criar com header:
  ```sql
  -- supabase/seed.sql
  -- Carregado automaticamente por `supabase db reset` após migrations.
  \i seeds/rules_engine.sql     -- Story 1.9 (se aplicável)
  \i seeds/curriculum_fields.sql -- Story 1.10
  ```
- **`allowed_mime_types = array['application/pdf']`**: Supabase Storage **já valida MIME no upload**, mas o client pode enviar qualquer `Content-Type`. Em Story 3.3 (upload admin de PDFs) a validação também deve ocorrer no frontend + Edge Function (defesa em profundidade).
- **`file_size_limit = 10485760`** (exatos 10 MiB = 10 × 1024 × 1024). PRD fala "10MB" — **aceitar a convenção 10 MiB = 10 × 2²⁰** como implementação (padrão Storage).
- **`public = false`** no bucket — URLs são assinadas (`createSignedUrl`) quando Story 3.3 implementar upload. Não expor via URL pública direta.
- **PK composta `(user_id, institution_id, specialty_id)` com NULL semântico**: documentado como limitação conhecida; Story 2.5 decide entre `UNIQUE NULLS NOT DISTINCT` (Postgres 15+ — Supabase já está em 15) ou sentinel UUID `'00000000-0000-0000-0000-000000000000'` para "default institucional". **Não decidir aqui** — esta story entrega o schema base; decisão é escopo de Story 2.5 quando o `calculate_scores` for escrito.
- **29 fields exatos no seed** — conferir com `git diff` contra [src/lib/types.ts#UserProfile](../../src/lib/types.ts) antes de commit para evitar drift silencioso.

### Labels canônicos (fonte: calculations.ts + interpretação)

`calculations.ts` mistura labels de várias instituições que não batem 100% com as chaves de `UserProfile` (ex.: `pubs` agrega várias chaves). Portanto os labels do seed são **curadoria** (baseados nas categorias e no significado semântico das chaves), não extração literal. Critério: **português direto, 1 linha, sem numeração** (numeração é responsabilidade de UI via `display_order`). Ver valores propostos na Task 2.2.

### Fluxos de dados a ter em mente (para não errar o schema)

1. **Autosave (Epic 2, Story 2.3)**: frontend → `supabase.from('user_curriculum').upsert({ user_id, data })` — `data` é jsonb com shape de `UserProfile`. `user_curriculum` NÃO explode campos em colunas — é JSONB deliberado para permitir evolução do catálogo sem migration.
2. **Cálculo (Epic 2, Story 2.5)**: `supabase.rpc('calculate_scores', { p_user_id })` → função lê `user_curriculum.data` + `scoring_rules` + `institutions` + `specialties` → faz `INSERT ... ON CONFLICT` em `user_scores` com `stale=false, calculated_at=now()`.
3. **Invalidação (Epic 2/3)**: trigger em `scoring_rules` (Story 2.5) marca `user_scores.stale=true` para todos os users; próximo fetch do dashboard detecta e chama RPC.
4. **Admin upload edital (Epic 3, Story 3.3)**: `supabase.storage.from('editais').upload(path, file)` — policy `editais_admin_write_insert` + `is_admin()` permite; depois `update` em `institutions.pdf_path` com caminho. Preview aluno: `createSignedUrl`.

### Latest tech notes (abril/2026)

- **Supabase CLI `supabase gen types typescript`** pode ser chamado com `--local` (DB local) ou `--project-id <ref>` (staging/prod). Sempre usar `--local` no dev loop; CI deve usar `--project-id` de staging com `SUPABASE_ACCESS_TOKEN` (ver Story 1.11).
- **PostgreSQL 15** (Supabase padrão em abril/2026): suporta `UNIQUE NULLS NOT DISTINCT`. Útil para Story 2.5, não para esta.
- **`storage.buckets.allowed_mime_types`**: campo `text[]` — usar `array['application/pdf']`, não `'{application/pdf}'::text[]` (funciona, mas o primeiro é mais legível).
- **pgTAP 1.3.x** (instalado em `0001_profiles.test.sql`) suporta `plan(N)`, `has_table`, `col_type_is`, `col_has_check`, `is`, `isnt`, `has_pk`, `has_trigger`. Consultar testes existentes para convenção.

### Previous story intelligence

- **Story 1.3 (done)** — estabeleceu: padrão `0001_profiles.sql`, helpers `set_updated_at()` e `is_admin()`, convenção `ENABLE + FORCE` RLS, padrão `SECURITY DEFINER + search_path = public`, arquivo de teste pgTAP em `supabase/tests/`. **Reutilizar tudo**. Arquivo de referência: [supabase/migrations/0001_profiles.sql](../../supabase/migrations/0001_profiles.sql), [supabase/tests/0001_profiles.test.sql](../../supabase/tests/0001_profiles.test.sql).
- **Story 1.5 (done)** — signup popula `profiles` via trigger; metadados em `raw_user_meta_data`. Relevante aqui só para testes pgTAP: para criar usuários nos testes, inserir direto em `auth.users` com `raw_user_meta_data` (padrão já usado em `0001_profiles.test.sql`).
- **Story 1.6/1.7 (review)** — sessão autenticada via `AuthContext`; irrelevante para migrations.
- **Story 1.9 (backlog, PRÉ-REQUISITO)** — cria `institutions` + `specialties` + `scoring_rules`. **Bloqueia o `db reset` desta story se não estiver aplicada**.

### Git intelligence (últimos commits)

- `e1096ee feat: implementa stories 1.1–1.6` — padrões de commit usados: `feat:` + descrição em português. Usar estilo similar.
- Migrations atuais no repo: **só `0001_profiles.sql`** — esta story adiciona as duas próximas (pulando 0002 que é Story 1.9).

### Project Structure Notes

Arquivos criados/modificados esperados:

```
supabase/
  migrations/
    0003_curriculum_scores.sql   [NOVO]
    0004_storage_editais.sql     [NOVO]
  seeds/
    curriculum_fields.sql        [NOVO]
  tests/
    0003_curriculum_scores.test.sql   [NOVO]
    0004_storage_editais.test.sql     [NOVO]
  seed.sql                       [NOVO ou MODIFICADO — adicionar `\i seeds/curriculum_fields.sql`]

src/lib/
  database.types.ts              [REGENERADO — preservar comentário-marca]
```

**Nenhum arquivo de runtime** (`src/components/`, `src/pages/`, `src/lib/queries/`, `src/lib/schemas/`) é tocado nesta story — consumo fica para Epic 2.

### References

- [epics.md#Story 1.10 (linhas 561-587)](../planning-artifacts/epics.md) — ACs canônicos
- [architecture.md#DB Schema & Migrations (linhas 165-195)](../planning-artifacts/architecture.md) — motor de regras + curriculum + scores
- [architecture.md#Implementation Handoff (linhas 758-768)](../planning-artifacts/architecture.md) — ordem de migrations
- [architecture.md#Project Structure (linhas 540-590)](../planning-artifacts/architecture.md) — convenções de nomes
- [supabase/migrations/0001_profiles.sql](../../supabase/migrations/0001_profiles.sql) — padrão SQL de referência
- [supabase/tests/0001_profiles.test.sql](../../supabase/tests/0001_profiles.test.sql) — padrão pgTAP de referência
- [src/lib/types.ts](../../src/lib/types.ts) — contrato canônico de `UserProfile` (29 fields)
- [src/lib/calculations.ts](../../src/lib/calculations.ts) — labels humanos por categoria
- Supabase Storage policies: https://supabase.com/docs/guides/storage/security/access-control
- pgTAP reference: https://pgtap.org/documentation.html

## Dev Agent Record

### Agent Model Used

claude-opus-4-6[1m]

### Debug Log References

- `supabase db reset` aplicou 0001 → 0002 → 0003 → 0004 + seeds `curriculum_fields.sql` e `rules_engine.sql` sem erro (NOTICE esperado sobre DROP POLICY IF EXISTS na primeira aplicação do 0004).
- `supabase db test` → 72 testes pgTAP verdes (0001: 15, 0002: 24, 0003: 26, 0004: 7).
- `npx tsc --noEmit` → 0 erros.
- `npm test -- --run` → 26 arquivos / 143 testes verdes (nenhuma regressão).
- **Observação**: config.toml usa `[db.seed] sql_paths = ["./seeds/*.sql"]` — seeds são auto-carregados por glob; `supabase/seed.sql` orquestrador **não é necessário** e **não foi criado** (diverge da guidance na Task 2.3 do story file, que é stale).
- Plan pgTAP inicialmente em 22 para 0003 foi corrigido para 26 após primeira execução sinalizar "ran 26".

### Completion Notes List

- ✅ AC1 — Migration `0003_curriculum_scores.sql` cria `curriculum_fields`, `user_curriculum`, `user_scores` com schema exato, trigger `updated_at` reutilizando `public.set_updated_at()` e 3 índices (`idx_curriculum_fields_display_order`, `idx_user_scores_user_id`, `idx_user_scores_institution`). PK composta em `user_scores` validada por pgTAP.
- ✅ AC2 — RLS `ENABLE + FORCE` nas 3 tabelas. Policies: `curriculum_fields` leitura `anon, authenticated`; escrita via `is_admin`. `user_curriculum` e `user_scores` com CRUD isolado por `auth.uid() = user_id`. Testes funcionais verificam isolamento (aluno A vê só própria linha; aluno B vê zero; WITH CHECK bloqueia cross-user insert; anon lê catálogo público).
- ✅ AC3 — Seed `supabase/seeds/curriculum_fields.sql` com **29 fields** distribuídos em 5 categorias (5+5+5+8+6). Mapping de `field_type`: 6 boolean, 1 select (`conceito_historico` com `options=["A","B","C"]`), demais number. Idempotente via `ON CONFLICT (field_key) DO UPDATE SET ...`. `display_order` com offset 10.
- ✅ AC4 — Migration `0004_storage_editais.sql` cria bucket `editais` (private, 10 MiB, MIME=pdf) idempotente via `ON CONFLICT (id)`, + 4 policies em `storage.objects` com `bucket_id = 'editais'` e guard `DROP POLICY IF EXISTS` antes de `CREATE`.
- ✅ AC5 — `src/lib/database.types.ts` regenerado com `supabase gen types typescript --local`. Comentário-marca `// GERADO — não editar manualmente` re-inserido no topo (gen do Supabase não preserva). `tsc --noEmit` OK; Vitest 143/143 verdes.
- **Pré-requisito 1.9 atendido**: 0002_rules_engine.sql já aplicado no repo (`institutions` e `specialties` disponíveis como FKs de `user_scores`).
- **Legado intocado**: `src/lib/types.ts` e `src/lib/calculations.ts` não foram modificados — consumo Supabase começa no Epic 2.
- **Escopo deferido** registrado em `_bmad-output/implementation-artifacts/deferred-work.md` (semântica PK-com-NULL para Story 2.5; trigger `mark_scores_stale` para Story 2.5; validação client-side de upload para Story 3.3).

### File List

- `supabase/migrations/0003_curriculum_scores.sql` [NOVO]
- `supabase/migrations/0004_storage_editais.sql` [NOVO]
- `supabase/seeds/curriculum_fields.sql` [NOVO]
- `supabase/tests/0003_curriculum_scores.test.sql` [NOVO]
- `supabase/tests/0004_storage_editais.test.sql` [NOVO]
- `src/lib/database.types.ts` [REGENERADO — comentário-marca preservado]
- `_bmad-output/implementation-artifacts/deferred-work.md` [MODIFICADO — nova seção Story 1.10]
- `_bmad-output/implementation-artifacts/1-10-schema-curriculo-scores-bucket-editais.md` [MODIFICADO — tasks marcadas + Dev Agent Record]
- `_bmad-output/implementation-artifacts/sprint-status.yaml` [MODIFICADO — status 1-10 → review]

### Change Log

- 2026-04-15 — Story 1.10 implementada: migrations 0003+0004, seed 29 fields, pgTAP 33 testes novos (26+7), types regenerados. Todos os 5 ACs satisfeitos; 72 pgTAP + 143 Vitest + tsc verdes. Status → review.
