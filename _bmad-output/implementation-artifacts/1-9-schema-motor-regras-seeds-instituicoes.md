# Story 1.9: Schema do motor de regras + seeds das 11 instituições

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **desenvolvedor (Rcfranco, solo) do curriculo-medway**,
I want **criar a migration `0002_rules_engine.sql` com as tabelas `institutions`, `specialties` e `scoring_rules` (híbrido relacional + JSONB em `formula`), RLS (leitura pública, escrita apenas admin), e o seed `supabase/seeds/rules_engine.sql` extraído verbatim de `src/lib/calculations.ts` (11 instituições reais)**,
so that **Story 1.10 (user_curriculum/user_scores), Story 2.5 (função `calculate_scores`), Story 2.6 (queries/schemas de scoring), Story 2.8 (specialty selector), Story 2.9 (ScoreHero/GapAnalysis) e Epic 3 (CRUD admin de instituições + AdminRuleEditor) tenham a fonte única das regras de pontuação — parametrizáveis por instituição × especialidade sem deploy de código — alinhado aos FR20, FR21, FR23, FR24 do PRD e ao Data Architecture híbrido do `architecture.md`**.

## Acceptance Criteria

Copiados verbatim de [epics.md#Story 1.9 (_bmad-output/planning-artifacts/epics.md:533-559)](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Migration `0002_rules_engine.sql` cria tabelas + constraints + índices**
   **Given** `supabase/migrations/0002_rules_engine.sql`
   **When** aplico (via `supabase db reset` local)
   **Then** existem as tabelas:
   - `institutions` (`id uuid PK default gen_random_uuid()`, `name text UNIQUE NOT NULL`, `short_name text`, `state text`, `edital_url text`, `pdf_path text`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`)
   - `specialties` (`id uuid PK default gen_random_uuid()`, `name text UNIQUE NOT NULL`, `created_at timestamptz DEFAULT now()`)
   - `scoring_rules` (`id uuid PK default gen_random_uuid()`, `institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE`, `specialty_id uuid NULL REFERENCES specialties(id) ON DELETE RESTRICT`, `category text NOT NULL`, `field_key text NOT NULL`, `weight numeric NOT NULL`, `max_points numeric NOT NULL`, `description text`, `formula jsonb NOT NULL`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`, **CHECK (`weight >= 0 AND weight <= max_points`)**)
   **And** índices `idx_scoring_rules_institution_id` e `idx_scoring_rules_specialty_id` criados
   **And** triggers `trg_*_set_updated_at` reutilizando `public.set_updated_at()` (criada na Story 1.3) ligados a `institutions` e `scoring_rules`

2. **AC2 — RLS: leitura permissiva, escrita admin-only**
   **Given** RLS habilitada + forçada nas 3 tabelas (`alter table ... enable row level security` + `force row level security`)
   **When** anônimo (`anon`) ou authenticated com `role='student'` executa `SELECT`
   **Then** lê todas as linhas das 3 tabelas (`institutions`, `specialties`, `scoring_rules`) — policy de SELECT permissiva para `anon` e `authenticated`
   **And** `INSERT`/`UPDATE`/`DELETE` nas 3 tabelas exige `public.is_admin(auth.uid()) = true` — policy usando helper SECURITY DEFINER da Story 1.3; qualquer caller sem admin recebe `new row violates row-level security policy`

3. **AC3 — Seed `rules_engine.sql` idempotente extraído das 11 instituições reais**
   **Given** `supabase/seeds/rules_engine.sql` extraído literalmente de `src/lib/calculations.ts` (Lovable legacy)
   **When** executo `supabase db reset` (que aplica migrations + seeds)
   **Then** as **11 instituições reais** do `calculations.ts` estão populadas em `institutions`: **UNICAMP, USP-SP, PSU-MG, FMABC, EINSTEIN, SCMSP, SES-PE, SES-DF, SCM-BH, USP-RP, UFPA**
   **And** regras por instituição populadas em `scoring_rules` com `category`, `field_key`, `weight`, `max_points`, `description`, `formula` (JSONB descrevendo operador/coeficientes/caps — ver [§ formula JSONB shape](#formula-jsonb-shape) abaixo)
   **And** `specialty_id = NULL` em todas as regras desta primeira carga (o `calculations.ts` atual **não** varia por especialidade — tabela `specialties` fica vazia no MVP; FR21 suportado pelo schema, sem dados ainda)

4. **AC4 — Seed idempotente: re-rodar não duplica**
   **Given** o seed já foi aplicado uma vez
   **When** executo o seed novamente (`psql ... < supabase/seeds/rules_engine.sql` ou `supabase db reset`)
   **Then** não há duplicação em `institutions` nem em `scoring_rules`
   **And** o padrão usado é `insert ... on conflict (...) do update set ... returning id` (upsert por `name` em institutions/specialties; upsert composto por `(institution_id, specialty_id, field_key)` em scoring_rules — unique constraint a ser criada na migration)

## Tasks / Subtasks

- [x] **Task 1 — Criar migration `0002_rules_engine.sql` com schema + RLS** (AC: #1, #2)
  - [x] 1.1 Gerar arquivo: `supabase migration new rules_engine` → renomear para `supabase/migrations/0002_rules_engine.sql` (prefixo numérico sequencial — padrão estabelecido na Story 1.3; ver [architecture.md#Implementation Handoff (linhas 759-768)](../planning-artifacts/architecture.md) "Migration 2: motor de regras").
  - [x] 1.2 Cabeçalho da migration:
    ```sql
    -- 0002_rules_engine.sql
    -- Story 1.9: institutions + specialties + scoring_rules + RLS
    -- Depends on: 0001_profiles.sql (is_admin, set_updated_at)
    ```
    **Não** redeclarar `pgcrypto` — já criada em 0001. `gen_random_uuid()` continua disponível.
  - [x] 1.3 Criar as 3 tabelas **na ordem** `institutions → specialties → scoring_rules` (FKs dependem dessa ordem):
    ```sql
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

    create table public.specialties (
      id uuid primary key default gen_random_uuid(),
      name text not null unique,
      created_at timestamptz not null default now()
    );

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
    ```
    **Detalhes críticos:**
    - `institutions.name UNIQUE` — necessário para `on conflict (name)` no seed (AC4).
    - `scoring_rules.specialty_id ON DELETE RESTRICT` — deletar uma especialidade que tem regras é **erro** (protege auditoria); admin precisa mover/apagar regras antes. Alternativa `SET NULL` reintroduz ambiguidade com o "default" (specialty_id NULL = regra padrão).
    - `scoring_rules.institution_id ON DELETE CASCADE` — deletar instituição remove suas regras (comportamento de admin CRUD da Story 3.2).
    - Constraint composta `(institution_id, specialty_id, field_key)` UNIQUE — base do upsert idempotente (AC4). Em Postgres, `NULL` compara como distinto em UNIQUE por default (tratar na sub-nota abaixo).
    - **Cuidado com UNIQUE + NULLs:** Postgres 15+ trata `NULL` como distinto em UNIQUE, então `(inst_A, NULL, 'artigos_high_impact')` e outro idêntico **não** colidem. Para o MVP (todas as regras têm `specialty_id NULL`), isso **ainda funciona para upsert** porque o ON CONFLICT do seed usa `(institution_id, field_key) WHERE specialty_id IS NULL` via índice parcial — ver Task 1.4.
  - [x] 1.4 Índices — o UNIQUE composto já cria índice, mas para o path `specialty_id IS NULL` (maioria das queries do MVP) e para o upsert idempotente:
    ```sql
    -- Lookup by institution (cache scoring por aluno em Story 2.5)
    create index idx_scoring_rules_institution_id on public.scoring_rules (institution_id);

    -- Lookup por especialidade (Story 2.8 specialty selector)
    create index idx_scoring_rules_specialty_id on public.scoring_rules (specialty_id);

    -- Índice parcial UNIQUE para upsert quando specialty_id IS NULL (default rule)
    -- Garante idempotência do seed sem depender do comportamento "NULL distinct" do UNIQUE padrão
    create unique index idx_scoring_rules_default_unique
      on public.scoring_rules (institution_id, field_key)
      where specialty_id is null;
    ```
    **Decisão:** índice parcial UNIQUE é o padrão idiomático Postgres para "UNIQUE com NULL tratado como valor único". Ver decisão em [§ Decisões técnicas específicas](#decisoes-tecnicas-especificas).
  - [x] 1.5 Triggers `updated_at` (reutilizar `public.set_updated_at()` criada em 0001):
    ```sql
    create trigger trg_institutions_set_updated_at
      before update on public.institutions
      for each row execute function public.set_updated_at();

    create trigger trg_scoring_rules_set_updated_at
      before update on public.scoring_rules
      for each row execute function public.set_updated_at();
    ```
    **Não** criar trigger em `specialties` — a tabela só tem `created_at` (imutável após insert conforme AC1).
  - [x] 1.6 RLS + policies (padrão "read-public, write-admin"):
    ```sql
    alter table public.institutions enable row level security;
    alter table public.institutions force row level security;
    alter table public.specialties enable row level security;
    alter table public.specialties force row level security;
    alter table public.scoring_rules enable row level security;
    alter table public.scoring_rules force row level security;

    -- SELECT: leitura permissiva (anon + authenticated)
    -- Justificativa: landing page pré-login (SSG, Story 1.4) precisa listar instituições;
    -- dashboard público pode renderizar scores antes do login em versões futuras.
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

    -- WRITE: apenas admin (reutiliza is_admin da Story 1.3)
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
    ```
    **Detalhes críticos:**
    - `for all` cobre INSERT/UPDATE/DELETE/SELECT — mas `to authenticated` restringe o admin-write a sessão autenticada (anon não passa). O SELECT admin **também** é coberto pela policy permissiva de cima (OR entre policies do mesmo comando) — funciona corretamente.
    - `force row level security` obrigatório — sem ele, o dono da tabela (`postgres` em CI) bypassa policies e o teste dá falso-verde.
    - **Não** criar policy de INSERT para anon — seeds rodam como `postgres`/`service_role` que **têm** `force row level security` bypass via `security definer` no seed wrapper (se necessário) OU rodam antes da RLS ser aplicada. **Estratégia real:** `supabase db reset` roda migrations + seeds em sequência; seeds são executados como `postgres` após `enable rls + force rls` — então **o seed precisa ser executado como `security definer` function ou com `set local row_security = off`**. Ver Task 2.3.

- [x] **Task 2 — Criar seed idempotente `supabase/seeds/rules_engine.sql`** (AC: #3, #4)
  - [x] 2.1 Ativar leitura de seeds em `supabase/config.toml` — atualmente `[db.seed]` aponta para `./seed.sql` apenas. Alterar para:
    ```toml
    [db.seed]
    enabled = true
    sql_paths = ["./seeds/*.sql"]
    ```
    **Por que**: epic AC3 especifica caminho `supabase/seeds/rules_engine.sql`; o glob `./seeds/*.sql` permite múltiplos seeds (Story 1.10 adicionará `curriculum_fields.sql`). Ordenação é alfabética, então `curriculum_fields.sql` < `rules_engine.sql` — sem dependência cruzada entre eles, ordem não importa. `./seed.sql` não é usado pelo projeto.
  - [x] 2.2 Extrair as 11 instituições **verbatim** de [src/lib/calculations.ts (linhas 1-329)](../../src/lib/calculations.ts):

    | # | `name` | `short_name` | `state` | `base` | Observação |
    |---|--------|--------------|---------|--------|------------|
    | 1 | UNICAMP | UNICAMP | SP | 100 | — |
    | 2 | USP-SP | USP-SP | SP | 100 | — |
    | 3 | PSU-MG | PSU-MG | MG | 10.0 | Pool MG |
    | 4 | FMABC | FMABC | SP | 10.0 | — |
    | 5 | EINSTEIN | Einstein | SP | 100 | — |
    | 6 | SCMSP | Santa Casa SP | SP | 100 | — |
    | 7 | SES-PE | SES-PE | PE | 100 | — |
    | 8 | SES-DF | SES-DF | DF | 10.0 | — |
    | 9 | SCM-BH | Santa Casa BH | MG | 10.0 | — |
    | 10 | USP-RP | USP-RP | SP | 10.0 | — |
    | 11 | UFPA | UFPA | PA | 100 | — |

    **⚠ DIVERGÊNCIA vs. texto do epic:** o epic menciona "USP-SP, USP-RP, UNIFESP, UNICAMP, UFMG, UFRJ, SCM-BH, UFPA + demais do protótipo" — essa lista **não** corresponde ao conteúdo real de `calculations.ts`. A fonte-da-verdade é o **código existente**; `UNIFESP/UFMG/UFRJ` **não** estão implementadas e serão adicionadas como regra admin futura (Epic 3). O AC3 diz "extraído de `src/lib/calculations.ts`" — portanto carregar exatamente as 11 listadas acima.
  - [x] 2.3 Estratégia do seed para conviver com RLS forçada:
    ```sql
    -- supabase/seeds/rules_engine.sql
    -- Executado como role `postgres` via supabase db reset.
    -- Precisamos contornar `force row level security` na sessão de seed.
    set local row_security = off;

    begin;
    -- 1. Instituições (upsert por name)
    insert into public.institutions (name, short_name, state) values
      ('UNICAMP','UNICAMP','SP'),
      ('USP-SP','USP-SP','SP'),
      ('PSU-MG','PSU-MG','MG'),
      ('FMABC','FMABC','SP'),
      ('EINSTEIN','Einstein','SP'),
      ('SCMSP','Santa Casa SP','SP'),
      ('SES-PE','SES-PE','PE'),
      ('SES-DF','SES-DF','DF'),
      ('SCM-BH','Santa Casa BH','MG'),
      ('USP-RP','USP-RP','SP'),
      ('UFPA','UFPA','PA')
    on conflict (name) do update
      set short_name = excluded.short_name,
          state = excluded.state;
    -- 2. Scoring rules (ver Task 2.4)
    -- ...
    commit;
    ```
    **Detalhes críticos:**
    - `set local row_security = off` é o flag Postgres que bypassa RLS **para a transação corrente**, quando executado por role com privilégio `BYPASSRLS` (o `postgres` do `supabase db reset` tem). Alternativa `security definer function` é mais verbosa para apenas carregar seeds.
    - `on conflict (name) do update set ...` é o padrão de upsert — idempotente por AC4. `do nothing` também seria aceitável, mas `do update` permite re-seed após edição manual de `short_name/state` em dev.
    - **Não** incluir `id uuid` nas INSERTs — deixar o DEFAULT gerar. Para referenciar IDs nas `scoring_rules` inserts abaixo, usar subquery `(select id from public.institutions where name = 'UNICAMP')` — ver Task 2.4.
  - [x] 2.4 Inserir `scoring_rules` extraídas do `calculations.ts`. Para cada uma das 11 instituições, extrair **cada bloco/card** do array `details` como uma regra separada. Exemplo canônico (UNICAMP):

    ```sql
    -- UNICAMP (base 100) — 9 regras
    with inst as (select id from public.institutions where name = 'UNICAMP')
    insert into public.scoring_rules
      (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
    values
      ((select id from inst), null, 'Pesquisa', 'ic',                20, 20,
        'Bolsa Oficial: 20 pts | Voluntária: 10 pts',
        '{"op":"sum","caps":{"total":20},"terms":[{"field":"ic_com_bolsa","mult":20},{"field":"ic_sem_bolsa","mult":10}]}'::jsonb),
      ((select id from inst), null, 'Publicações', 'publicacoes',     15, 15,
        'Autor principal indexado: 10 pts | Coautor/Nacional: 2 a 5 pts',
        '{"op":"sum","caps":{"total":15},"terms":[{"field":"artigos_high_impact","mult":10},{"field":"artigos_mid_impact","mult":5},{"field":"artigos_nacionais","mult":2}]}'::jsonb),
      ((select id from inst), null, 'Eventos', 'apresentacao_congresso', 10, 10,
        'Apresentação oral ou Pôster (2,5 pts cada)',
        '{"op":"sum","caps":{"total":10},"terms":[{"field":"apresentacao_congresso","mult":2.5}]}'::jsonb),
      ((select id from inst), null, 'Extensão', 'voluntariado',        5,  5,
        'Carga horária > 96h (5 pts) | > 48h (2 pts)',
        '{"op":"threshold","field":"voluntariado_horas","brackets":[{"gte":96,"pts":5},{"gte":48,"pts":2}]}'::jsonb),
      ((select id from inst), null, 'Ligas', 'ligas',                  5,  5,
        'Cargo de Gestão/Diretoria (5 pts) | Membro (2 pts)',
        '{"op":"sum","caps":{"total":5},"terms":[{"field":"diretoria_ligas","mult":5},{"field":"membro_liga_anos","mult":2}]}'::jsonb),
      ((select id from inst), null, 'Monitoria', 'monitoria',          5,  5,
        'Duração > 2 semestres (5 pts) | 1 a 2 semestres (2 pts)',
        '{"op":"threshold","field":"monitoria_semestres","brackets":[{"gt":2,"pts":5},{"gt":0,"pts":2}]}'::jsonb),
      ((select id from inst), null, 'Cursos', 'cursos_suporte',        5,  5,
        'Cursos de Suporte (2,5 pts cada)',
        '{"op":"sum","caps":{"total":5},"terms":[{"field":"cursos_suporte","mult":2.5}]}'::jsonb),
      ((select id from inst), null, 'Idiomas', 'ingles_fluente',      10, 10,
        'Certificado de Proficiência em Inglês (10 pts)',
        '{"op":"bool","field":"ingles_fluente","pts_true":10}'::jsonb),
      ((select id from inst), null, 'Formação', 'formacao',           25, 25,
        'Internato Próprio (10 pts) | Mestrado (10 pts) | Doutorado (15 pts)',
        '{"op":"sum","caps":{"total":25},"terms":[{"field":"internato_hospital_ensino","when_true":10},{"field":"mestrado","when_true":10,"override_by":"doutorado"},{"field":"doutorado","when_true":15}]}'::jsonb)
    on conflict on constraint scoring_rules_unique_rule do update
      set weight       = excluded.weight,
          max_points   = excluded.max_points,
          description  = excluded.description,
          formula      = excluded.formula;
    ```

    **Padrão aplicado às 11 instituições:** para cada `InstitutionScore.details[]` no código legado, uma linha em `scoring_rules`. `category` = label da regra (ou prefixo como "Pesquisa/Publicações"; usar julgamento para agrupar consistentemente). `field_key` = identificador curto em `snake_case` (usar o campo primário da regra). `weight` = `max` do `detail` (teto da regra individual). `max_points` = o mesmo `max` (para MVP, `weight == max_points`; a separação existe para cenários futuros onde admin pode reduzir peso mantendo escala de referência). `description` = `rule` verbatim do `detail`. `formula` = JSONB codificando a fórmula real do JS (ver [§ formula JSONB shape](#formula-jsonb-shape)).

    **Total esperado:** ~70 regras (somatório das `details[].length` das 11 instituições — contar exatamente ao implementar; a Task 2.5 confere).

  - [x] 2.5 Após INSERT de todas as 11 instituições, validar contagem:
    ```sql
    -- Dentro da transação do seed (comentado — só para sanity durante dev)
    -- select count(*) from public.institutions; -- expect 11
    -- select count(*) from public.scoring_rules; -- expect N (contar no calculations.ts)
    -- select i.name, count(sr.id)
    --   from public.institutions i
    --   left join public.scoring_rules sr on sr.institution_id = i.id
    --   group by i.name order by i.name;
    ```
    Manter comentado no seed final (sanity só em dev; validação formal nos testes pgTAP da Task 3).

  - [x] 2.6 **NÃO** popular `specialties` — `calculations.ts` não varia por especialidade. Tabela fica vazia e regras usam `specialty_id = NULL` (default). Epic 3 (AdminRuleEditor) será o primeiro a inserir especialidades quando regra variável por especialidade for publicada.

- [x] **Task 3 — Testes pgTAP `0002_rules_engine.test.sql`** (AC: #1, #2, #3, #4)
  - [x] 3.1 Criar `supabase/tests/0002_rules_engine.test.sql` com plano mínimo (ajustar plan ao nº real de asserts):
    ```sql
    begin;
    select plan(20);

    -- AC1: schema das 3 tabelas
    select has_table('public','institutions');
    select has_table('public','specialties');
    select has_table('public','scoring_rules');
    select has_column('public','institutions','name','institutions.name exists');
    select col_is_unique('public','institutions','name','institutions.name is unique');
    select has_column('public','scoring_rules','formula','scoring_rules.formula exists');
    select col_is_fk('public','scoring_rules','institution_id','institution_id FKs');
    select col_has_check('public','scoring_rules','weight','weight/max_points CHECK');

    -- AC1: índices
    select has_index('public','scoring_rules','idx_scoring_rules_institution_id');
    select has_index('public','scoring_rules','idx_scoring_rules_specialty_id');

    -- AC2: RLS ativa+forçada nas 3 tabelas
    select is(
      (select relforcerowsecurity from pg_class where relname='scoring_rules'),
      true,
      'scoring_rules has force rls'
    );

    -- AC2: SELECT anônimo lê institutions
    set local role anon;
    set local "request.jwt.claims" to '';
    select is(
      (select count(*) from public.institutions),
      11::bigint,
      'anon reads all 11 institutions'
    );

    -- AC2: anon INSERT em institutions falha (negado por RLS)
    select throws_ok(
      $$insert into public.institutions (name) values ('hacker')$$,
      '42501',
      null,
      'anon cannot insert institutions'
    );
    reset role;

    -- AC2: student autenticado ainda negado em WRITE
    set local role authenticated;
    set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000099"}';
    select throws_ok(
      $$update public.scoring_rules set weight = 999 where true$$,
      '42501',
      null,
      'student cannot update scoring_rules'
    );
    reset role;

    -- AC3: 11 instituições seed
    select is(
      (select count(*) from public.institutions),
      11::bigint,
      '11 institutions seeded'
    );
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

    -- AC3: formula é JSONB válido
    select isnt(
      (select count(*) from public.scoring_rules where jsonb_typeof(formula) = 'object'),
      0::bigint,
      'formula column stores jsonb objects'
    );

    -- AC3: weight <= max_points (CHECK já garante, mas sanity do seed)
    select is(
      (select count(*) from public.scoring_rules where weight > max_points),
      0::bigint,
      'all seeded weights respect max_points'
    );

    -- AC4: idempotência — rodar seed inline 2ª vez (via include ou INSERT duplicado)
    insert into public.institutions (name, short_name, state) values ('UNICAMP','UNICAMP','SP')
      on conflict (name) do update set short_name = excluded.short_name;
    select is(
      (select count(*) from public.institutions where name='UNICAMP'),
      1::bigint,
      'institutions upsert stays idempotent'
    );

    select finish();
    rollback;
    ```
    **Ajustar `plan(N)` ao número final de asserts.** Rodar `supabase test db` — **deve** passar 100%.

  - [x] 3.2 Se pgTAP não rodar (regressão de `supabase start`), fallback aceitável: script `supabase/tests/smoke-rules-engine.sh` com `supabase db execute --local` + asserts via `test $ == 11 || exit 1`. Documentar escolha em Completion Notes. Padrão herdado da Story 1.3.

- [x] **Task 4 — Regenerar `src/lib/database.types.ts`** (AC: #1, #2)
  - [x] 4.1 Com migration + seed aplicados, rodar:
    ```bash
    supabase gen types typescript --local > src/lib/database.types.ts
    ```
    Preservar o comentário-marca no topo (`// GERADO — não editar manualmente...`). O output vai incluir `Database['public']['Tables']['institutions' | 'specialties' | 'scoring_rules']` Row/Insert/Update tipados.
  - [x] 4.2 Validar que tipos novos compilam consumidores:
    - `src/lib/supabase.ts` (genérico `<Database>`) — sem mudança.
    - Nenhum consumer ainda toca `scoring_rules` — tipos ficam prontos para Stories 2.5/2.6.
  - [x] 4.3 **NÃO** migrar `src/lib/calculations.ts` agora — o arquivo continua intacto e é o fallback do cliente até a Story 2.5 (`calculate_scores` database function) substituí-lo. Seguir ordem do PRD.

- [x] **Task 5 — Atualizar `config.toml` + validar lint/build/test** (AC: #3, #4)
  - [x] 5.1 Aplicar mudança em [supabase/config.toml](../../supabase/config.toml) seção `[db.seed]`:
    ```toml
    [db.seed]
    enabled = true
    sql_paths = ["./seeds/*.sql"]
    ```
    Verificar `supabase db reset` lê o novo glob e aplica `supabase/seeds/rules_engine.sql`.
  - [x] 5.2 `bun run lint` — 0 erros novos (warnings baseline de shadcn permanecem).
  - [x] 5.3 `bun run build` — Vite precisa passar; `database.types.ts` é só tipagem, zero runtime.
  - [x] 5.4 `bun run test` — Vitest existente continua verde. **Nenhum teste novo em TS nesta story** (os testes de comportamento são pgTAP).
  - [x] 5.5 `supabase db reset` → `supabase test db` — rodar ambos e colar output no Debug Log. Total de testes pgTAP deve ser ≥ 14 (Story 1.3) + ~20 (esta) = ≥ 34 passando.

### Review Findings

_Code review adversarial (Blind Hunter + Edge Case Hunter + Acceptance Auditor) — 2026-04-15._

**Decision-needed (2) — resolvidas 2026-04-15:**
- [x] [Review][Decision] Policies para `service_role` nas 3 tabelas → **deferido**. Motivo: `service_role` do Supabase tem atributo `BYPASSRLS` no role, então escrita já funciona hoje (mesmo com `force rls`). Criar policy explícita só quando o padrão mudar ou quando houver a primeira Edge Function admin.
- [x] [Review][Decision] SES-PE `historico` `{gte:70, pts:15}` → **dismissed (falso positivo do Edge Hunter)**. O bracket existe no legado em [src/lib/calculations.ts:198](../../src/lib/calculations.ts#L198) (`else if (val(data.media_geral) >= 70) historico = 15`). Seed é fiel.

**Patch (7) — todos aplicados 2026-04-15:**
- [x] [Review][Patch] `SET LOCAL row_security = off` movido para depois do `begin;` [[supabase/seeds/rules_engine.sql:34-35](../../supabase/seeds/rules_engine.sql#L34-L35)]
- [x] [Review][Patch] Header do seed expandido listando 10 operadores e todas as flags (when_true/when_gt0/override_by/null_policy/aggregate) [[supabase/seeds/rules_engine.sql:9-32](../../supabase/seeds/rules_engine.sql#L9-L32)]
- [x] [Review][Patch] EINSTEIN `publicacoes` description agora inclui "Nacionais (2pts)" [[supabase/seeds/rules_engine.sql:194-196](../../supabase/seeds/rules_engine.sql#L194-L196)]
- [x] [Review][Patch] EINSTEIN `pos_graduacao` — `override_by:null` removido em `doutorado` (uniformiza com UNICAMP/USP-SP) [[supabase/seeds/rules_engine.sql:202](../../supabase/seeds/rules_engine.sql#L202)]
- [x] [Review][Patch] pgTAP agora valida `scoring_rules_weight_bounds_chk` por nome via `pg_constraint` [[supabase/tests/0002_rules_engine.test.sql:19-26](../../supabase/tests/0002_rules_engine.test.sql#L19-L26)]
- [x] [Review][Patch] pgTAP agora inclui `has_index('idx_scoring_rules_default_unique')` [[supabase/tests/0002_rules_engine.test.sql:34](../../supabase/tests/0002_rules_engine.test.sql#L34)]
- [x] [Review][Patch] pgTAP agora cobre anon UPDATE/DELETE silent-0 via `DO blocks` + `row_count` [[supabase/tests/0002_rules_engine.test.sql:76-100](../../supabase/tests/0002_rules_engine.test.sql#L76-L100)]

**Plan bump:** pgTAP `plan(24)` → `plan(28)` (4 novos asserts: constraint-by-name + partial unique index + anon UPDATE pass + anon DELETE pass).

**Deferrals (5):** ver `deferred-work.md` seção "Deferred from: code review of story-1.9 (2026-04-15)".

- [x] [Review][Defer] AdminRuleEditor (Story 3.4) precisará de ON CONFLICT diferente para regras com `specialty_id IS NOT NULL` — deferido para Story 3.4.
- [x] [Review][Defer] `formula: Json` untyped em `database.types.ts` — discriminated union TS deferido para Story 2.6 (Zod schemas).
- [x] [Review][Defer] FMABC `bloco_cientifico` usa `field:"artigos_total"` + sibling `aggregate` ad-hoc ([seed:177](../../supabase/seeds/rules_engine.sql#L177)) — contrato com `calculate_scores` deferido para Story 2.5.
- [x] [Review][Defer] Sem CHECK de shape no `formula jsonb` no DB — validação Zod deferida para Story 2.6.
- [x] [Review][Defer] Glob `./seeds/*.sql` carrega `curriculum_fields.sql` antes de `rules_engine.sql` (alfabético); depende da migration 0003 da Story 1.10 existir — deferido para Story 1.10 (WIP).

**Dismissed (5):** CHECK `weight <= max_points` tautológico no MVP mas guarda edição admin futura | RLS SELECT permissiva para anon justificada no spec (editais públicos) | `./seed.sql` órfão — confirmado inexistente | migration não-idempotente é padrão forward-only | header "GERADO" de `database.types.ts` — arquivo é realmente gerado por `supabase gen types`.

## Dev Notes

### Contexto crítico (ler antes de codar)

- **Stories anteriores relevantes:**
  - **1.1** (done): `supabase/` inicializado, singleton `src/lib/supabase.ts`, stub de types. `supabase start` sobe Postgres local.
  - **1.3** (done): migration `0001_profiles.sql` criou `profiles` + `is_admin(uid uuid)` SECURITY DEFINER + `set_updated_at()` genérica + padrão RLS (enable + force + policies descritivas). **Esta story reutiliza `is_admin()` e `set_updated_at()`** — não recriar.
  - **1.5** (done): signup público com LGPD. `profiles` já ganha linhas conforme signups acontecem.
- **Esta story é backend-puro** (SQL + seed + types regenerados). Zero React, zero rotas, zero componentes.
- **Stories que DEPENDEM desta (downstream — quebram se falharmos):**
  - **1.10** (schema curriculum/scores + bucket editais) — consome FK `institution_id` e `specialty_id` de `scoring_rules` em `user_scores`. Migration 0003 depende desta 0002.
  - **2.5** (função `calculate_scores`) — lê `scoring_rules.formula` JSONB + `weight/max_points` para calcular `user_scores`. **Esta é a razão do schema híbrido** — dispara trigger `on_scoring_rule_updated` marcando scores stale.
  - **2.6** (queries/schemas scoring) — Zod schemas usam `database.types.ts` regerado aqui.
  - **2.8** (specialty selector inline) — lê `specialties` e filtra `scoring_rules` por `specialty_id`. Se a lista vazia bloquear UX, tratar como `null → default rule` (documentado).
  - **2.9** (ScoreHero/GapAnalysis) — consome `scoring_rules.description` para explicar gap.
  - **3.2** (CRUD instituições) — admin edita `institutions`. Sem RLS write-admin, CRUD quebra com 403.
  - **3.3** (upload PDF edital) — grava `institutions.pdf_path`.
  - **3.4** (CRUD regras — AdminRuleEditor) — admin edita `scoring_rules.formula` via UI com validador de schema.
  - **3.6** (log de alterações) — trigger de auditoria em `scoring_rules` será criado em Story 3.6; **não** criar aqui.
- **Escopo propositalmente fechado:** só as 3 tabelas + RLS + seed das 11 instituições. **Nada de** `user_curriculum`/`user_scores` (Story 1.10), **nada de** função `calculate_scores` (Story 2.5), **nada de** storage bucket `editais` (Story 1.10), **nada de** trigger de auditoria de regras (Story 3.6), **nada de** populares `specialties`. Resista ao escopo criativo.

### Padrões de arquitetura que você DEVE seguir

[Source: architecture.md#Data Architecture (linhas 165-178)](../planning-artifacts/architecture.md)
- Modelagem híbrida relacional + JSONB. `scoring_rules.formula jsonb` guarda a expressão parametrizável; metadados (weight, max_points, field_key, category) ficam em colunas tipadas para indexação e CHECK constraints.

[Source: architecture.md#Naming Patterns — Database (linhas 253-266)](../planning-artifacts/architecture.md)
- Tabelas `snake_case` plural: `institutions`, `specialties`, `scoring_rules`.
- Colunas `snake_case`: `institution_id`, `specialty_id`, `field_key`, `max_points`.
- FK: `{referenced_table_singular}_id` → `institution_id`, `specialty_id`.
- Índices: `idx_{table}_{column}` → `idx_scoring_rules_institution_id`, `idx_scoring_rules_specialty_id`.
- Timestamps padrão + trigger `trg_{table}_set_updated_at` reutilizando `public.set_updated_at()`.
- RLS policies descritivas snake_case: `"scoring_rules_select_public"`, `"scoring_rules_write_admin"`.

[Source: architecture.md#Authentication & Security (linhas 180-188)](../planning-artifacts/architecture.md)
- `role='admin'` tem acesso a regras, instituições e leads. Esta story é **a primeira consumidora** do helper `is_admin()` estabelecido na 1.3.

[Source: architecture.md#Enforcement Guidelines (linhas 403-414)](../planning-artifacts/architecture.md)
- Regra 1: `snake_case` em todo stack de dados.
- Regra 2: `database.types.ts` é fonte de verdade — nunca redefinir tipos manualmente.
- Regra 9: nunca `service_role` no cliente. O seed roda como `postgres` em `supabase db reset` — server-side, OK.

[Source: PRD#Requisitos Funcionais — Motor de Regras (linhas 122-150)](../planning-artifacts/prd.md)
- **FR20** regras configuráveis por instituição → `institution_id` obrigatório.
- **FR21** regras variáveis por especialidade → `specialty_id` nullable (NULL = default da instituição).
- **FR22** alteração recalcula scores → trigger `on_scoring_rule_updated` está em Story 2.5, **não** aqui.
- **FR23** cada regra define campo + peso + máximo + descrição → colunas correspondem.
- **FR24** nova instituição sem alteração de código → só seed INSERT + admin UI.

[Source: epics.md#Story 1.10 (linhas 561-587)](../planning-artifacts/epics.md)
- `user_scores (user_id, institution_id FK, specialty_id NULL FK, ...)` — **confirma** ON DELETE policy de `institutions`/`specialties`: CASCADE/RESTRICT (escolhidas na Task 1.3 consistentes com user_scores Story 1.10).

[Source: epics.md#Epic 3 (linhas 283-292)](../planning-artifacts/epics.md)
- Admin consome RLS admin-write — consumidor real do policy `*_write_admin`.

### formula JSONB shape

Estrutura canônica para `scoring_rules.formula` (documentar no seed + consumir em Story 2.5). **Não** criar validador Postgres nesta story; validação Zod fica na Story 2.6.

```jsonc
// Operador principal: sum (soma de termos com teto opcional)
{
  "op": "sum",
  "caps": { "total": 15 },          // teto total da regra (≡ max_points; redundante mas útil pra debug)
  "terms": [
    { "field": "artigos_high_impact", "mult": 10 },   // número * coeficiente
    { "field": "artigos_mid_impact",  "mult": 5 },
    { "field": "artigos_nacionais",   "mult": 2 }
  ]
}

// Operador: threshold (faixas discretas)
{
  "op": "threshold",
  "field": "voluntariado_horas",
  "brackets": [
    { "gte": 96, "pts": 5 },  // se horas >= 96 → 5 pts
    { "gte": 48, "pts": 2 }   // senão se horas >= 48 → 2 pts
                              // senão → 0 (implícito)
  ]
}

// Operador: bool (flag booleana)
{ "op": "bool", "field": "ingles_fluente", "pts_true": 10 }

// Operador: tiered (tabela por valor exato ou faixa)
{
  "op": "tiered",
  "field": "ic_horas_totais",
  "tiers": [
    { "gte": 400, "pts": 30 },
    { "gte": 300, "pts": 25 },
    { "gte": 200, "pts": 20 },
    { "gte": 100, "pts": 15 },
    { "gt":   0,  "pts":  5 }
  ]
}

// Operador: mean_threshold (histórico/média)
{
  "op": "mean_threshold",
  "field": "media_geral",
  "null_policy": "skip",    // null → 0 pts (não conta como baixo)
  "brackets": [
    { "gte": 85, "pts": 30 },
    { "gte": 80, "pts": 25 },
    { "gte": 75, "pts": 20 },
    { "gte": 70, "pts": 15 },
    { "gt":   0, "pts": 10 }
  ]
}
```

Casos não cobertos acima no `calculations.ts` (EX: `SCMSP.formacao` = `internato + (ranking_ruf_top35 ? 20 : (null ? 0 : 5))`; USP-SP `instituicao_origem` etc.) devem usar **composição** explícita ou um operador `custom` com payload descritivo — aceitável desde que Story 2.5 trate. Se simplificação gerar perda de fidelidade > 5% vs `calculations.ts`, abrir item em `deferred-work.md` (não bloqueia esta story — AC diz "extraído de", não "100% paridade aritmética").

**Princípio:** o `formula` JSONB é um **protocolo entre seed e `calculate_scores`** da Story 2.5. Não precisa ser elegante — precisa ser fiel e decodificável em pgplsql/TS.

### <a id="decisoes-tecnicas-especificas"></a>Decisões técnicas específicas

- **Por que `specialty_id NULL = regra default` (e não linha separada com enum)?** FR21 diz "suporta variações por especialidade". A regra default (NULL) aplica a todas as especialidades **exceto** aquelas com override específico. Alternativa (tabela `default_rules` + `specific_rules`) duplica lógica. Padrão relacional idiomático: `specialty_id null` = "aplica a todos".
- **Por que `numeric` (não `int` ou `real`) em `weight`/`max_points`?** Algumas regras têm decimais (0.5, 2.5, etc.) vindas de `calculations.ts` (PSU-MG, FMABC, SES-DF base 10.0). `numeric` (DECIMAL) evita erros de ponto flutuante; precisão de Postgres é arbitrária. Custo de storage desprezível.
- **Por que índice parcial UNIQUE `(institution_id, field_key) WHERE specialty_id IS NULL`?** O UNIQUE composto `(institution_id, specialty_id, field_key)` da Task 1.3 **não** garante unicidade quando `specialty_id IS NULL` (Postgres trata NULL como distinto). O MVP é 100% specialty_id null — sem o índice parcial, o seed poderia inserir duplicatas e o `on conflict` falharia silenciosamente. Este é o padrão idiomático Postgres para "NULL-aware UNIQUE".
- **Por que SELECT público em `scoring_rules` (e não só authenticated)?** A landing page (Story 1.4) e o fluxo pré-login podem mostrar prévia de instituição + regras-exemplo como hook. Dados **não são sensíveis** — são editais públicos. Custo: zero vazamento de PII. Benefício: SSG da landing pode fetchar em build time.
- **Por que `on delete cascade` em `institution_id` mas `restrict` em `specialty_id`?** Deletar instituição em CRUD admin (Story 3.2) **implica** apagar suas regras — é o comportamento esperado. Deletar especialidade com regras pendentes é **acidente** — RESTRICT força admin a movê-las antes.
- **Por que `set local row_security = off` no seed?** `supabase db reset` roda com role `postgres` que tem `BYPASSRLS`; o `force row level security` aplica mesmo assim em releases recentes — daí a necessidade explícita. Alternativa (`security definer function` no seed) é mais verbosa. Esta escolha alinha com a prática oficial do Supabase para seeds pós-RLS.
- **Por que não popular `specialties` agora?** `calculations.ts` não varia por especialidade. Inserir especialidades "vazias" de regras é lixo no banco. Primeira especialidade será inserida via Story 3.4 (AdminRuleEditor) quando houver uma regra real que dependa dela.
- **Por que migrations numeradas `0002_...`?** Alinha com [architecture.md#Implementation Handoff (linhas 759-768)](../planning-artifacts/architecture.md): "Migration 2: motor de regras". Padrão estabelecido na Story 1.3.
- **Por que `config.toml` `[db.seed]` via glob `./seeds/*.sql`?** Story 1.10 adiciona `curriculum_fields.sql`. Glob evita edições incrementais na `config.toml`. O seed `./seed.sql` (default do supabase init) não é usado pelo projeto; remover a linha sem substituto também é válido, mas glob é o mais robusto.
- **Deferral de `src/lib/calculations.ts`:** ver [deferred-work.md:32-48](./deferred-work.md) — a issue `val(v: any) => Number(v) || 0` com coerção silenciosa, caps independentes USP-RP, semântica divergente `ranking_ruf_top35`, UFPA cap agregado truncando 11 pts etc., foi diferida **explicitamente para esta story**. Durante a extração, **documentar** divergências semânticas na `description` da regra e/ou abrir novos itens em `deferred-work.md` apontando para Story 2.5 (onde `calculate_scores` vai interpretar). **Esta story não resolve** a semântica — só migra fielmente para seed.

### Anti-patterns a EVITAR (previne retrabalho e buracos de segurança)

- **NÃO** redeclarar `is_admin()`, `set_updated_at()` ou `pgcrypto`. Já existem desde 0001. Duplicar funções SECURITY DEFINER multiplica superfície de CVE.
- **NÃO** criar trigger de auditoria de `scoring_rules` nesta story — é Story 3.6. Sem a infra de `rule_change_log` planejada, trigger órfão vira débito.
- **NÃO** criar trigger `on_scoring_rule_updated` que marca `user_scores.stale=true` — é Story 2.5. `user_scores` nem existe ainda (Story 1.10).
- **NÃO** alterar `profiles` nesta story (adicionar `default_specialty_id` etc.) — escopo de Story 2.1+.
- **NÃO** tornar `formula jsonb` em `jsonb` sem `NOT NULL` — regras sem fórmula são lixo que quebra `calculate_scores`.
- **NÃO** adicionar `description` como NOT NULL — é human-friendly, pode vir vazio em regras low-ceremony; Zod da Story 2.6 valida.
- **NÃO** criar índices em `institutions.name` ou `specialties.name` — UNIQUE já gera índice implícito. Repetir é o erro documentado na Story 1.3 linhas 337-338.
- **NÃO** popular `institutions.edital_url` ou `pdf_path` no seed — Story 3.3 preencherá via admin upload. Deixar NULL.
- **NÃO** habilitar bucket `editais` aqui — é AC da Story 1.10 (migration 0004).
- **NÃO** incluir `short_name` inventado para instituições — usar **exatamente** o `name` legado do `calculations.ts` (ou abreviação óbvia: "Einstein", "Santa Casa SP", "Santa Casa BH"). Admin renomeia depois via CRUD (Story 3.2).
- **NÃO** hardcodar UUIDs nas inserções — deixar DEFAULT `gen_random_uuid()` gerar. Referenciar via subquery por `name`.
- **NÃO** omitir `force row level security` em nenhuma das 3 tabelas. Sem `force`, CI passa com seq-scan que bypassa RLS e produção quebra silenciosamente.
- **NÃO** usar `current_user` em lugar de `auth.uid()` nas policies. `current_user` retorna `postgres`/`authenticated` (Postgres role), não o UUID do usuário.
- **NÃO** popular `specialties` com lista especulativa — vazio até que admin insira na Story 3.4. Lista seca de especialidades vem de consulta ao cliente.
- **NÃO** instalar dependências npm nesta story. Zero deps novas. Só SQL + arquivo de tipos gerado.
- **NÃO** editar `src/lib/database.types.ts` manualmente além do comentário-marca — regerado por `supabase gen types`.
- **NÃO** mexer em `src/lib/calculations.ts` ainda — continua como fallback client-side até Story 2.5. Apenas documentar desvios na `description` SQL.

### Fluxos de dados a ter em mente

- **Boot local (developer):**
  1. `supabase start` → Postgres local sobe.
  2. `supabase db reset` → aplica 0001 → aplica 0002 → executa `./seeds/*.sql` (glob inclui `rules_engine.sql`) → trigger de updated_at presente, 11 rows em `institutions`, N regras em `scoring_rules`, `specialties` vazia.
  3. `supabase gen types typescript --local > src/lib/database.types.ts` → tipos refletem novas tabelas.
  4. `supabase test db` → pgTAP 0001 + 0002 passam.
- **Read path (Story 2.5, downstream):** `supabase.rpc('calculate_scores', { p_user_id, p_specialty_id: null })` → função PL/pgSQL lê `scoring_rules` filtrando `institution_id × (specialty_id = p_specialty_id OR specialty_id is null)` com prioridade em override específico sobre default. RLS permite `student` ler `scoring_rules` (SELECT público).
- **Write path (Story 3.4, downstream):** admin autenticado faz `supabase.from('scoring_rules').update({ formula, weight, max_points }).eq('id', ruleId)`. RLS checa `is_admin(auth.uid())` via helper SECURITY DEFINER → sucesso. Trigger `set_updated_at` bumpa `updated_at`. **Trigger de invalidação de scores** virá em Story 2.5 (aqui **não** criar).
- **Delete cascade:** admin deleta instituição → `scoring_rules` cai em cascata; `user_scores` (existente após Story 1.10) **também** deve cair — verificar em Story 1.10 que `user_scores.institution_id REFERENCES institutions(id) ON DELETE CASCADE`.

### Latest tech notes (abr/2026)

- **Supabase Postgres 17** (supabase/config.toml linha `major_version = 17`): JSONB com `jsonb_path_query` + operadores `@>` performantes. `numeric` sem precisão definida permite decimais arbitrários (usado em `weight/max_points`).
- **`set local row_security = off`** é stable desde Postgres 9.5 — comportamento consistente no 17.
- **Partial unique indexes** com `WHERE specialty_id IS NULL` são padrão Postgres há anos; `on conflict` reconhece automaticamente se a expressão match.
- **Supabase CLI 1.x+**: `supabase gen types typescript --local` gera tipos para JSONB como `Json = ...` (union recursiva) — `scoring_rules.formula: Json`. Consumidores TS (Story 2.6) vão refinar via Zod para os operadores acima.
- **pgTAP no Supabase 2024+**: `has_index`, `col_is_fk`, `col_has_check`, `throws_ok` estão disponíveis sem instalação adicional.

### Project Structure Notes

**Alinhado com [architecture.md#Complete Project Directory Structure (linhas 559-568)](../planning-artifacts/architecture.md):**
- `supabase/migrations/0002_rules_engine.sql` ✅ (criado nesta story)
- `supabase/tests/0002_rules_engine.test.sql` ✅ (criado nesta story)
- `supabase/seeds/rules_engine.sql` ✅ (criado nesta story)
- `supabase/config.toml` ✅ (editado — `[db.seed].sql_paths`)
- `src/lib/database.types.ts` ✅ (regerado com 3 novas tabelas)

**Variações vs a árvore alvo (OK — próximas stories preenchem):**
- `supabase/migrations/0003_curriculum_scores.sql` → Story 1.10.
- `supabase/migrations/0004_storage_editais.sql` → Story 1.10.
- `supabase/migrations/0005_calculate_scores.sql` → Story 2.5.
- `supabase/seeds/curriculum_fields.sql` → Story 1.10.
- `src/lib/schemas/scoring.ts` Zod → Story 2.6.

**Conflitos a resolver nesta story:**
- `supabase/config.toml` atual tem `sql_paths = ["./seed.sql"]` (default do init). Alterar para `["./seeds/*.sql"]`.
- `src/lib/calculations.ts` **permanece** — deferral documentado em `deferred-work.md:32-48`. Não remover; extração semântica é Story 2.5.

### References

- [epics.md#Story 1.9 (linhas 533-559)](../planning-artifacts/epics.md) — AC source of truth.
- [epics.md#Epic 1 — Fundação Completa (linhas 259-267)](../planning-artifacts/epics.md) — contexto bloqueante.
- [epics.md#Story 1.10 (linhas 561-587)](../planning-artifacts/epics.md) — consumidor direto (user_curriculum/user_scores); FK requirements.
- [epics.md#Story 2.5 (linhas 710-732)](../planning-artifacts/epics.md) — consumidor principal do `formula` JSONB (função `calculate_scores`).
- [epics.md#Epic 3 (linhas 283-292)](../planning-artifacts/epics.md) — consumidor de RLS write-admin.
- [architecture.md#Data Architecture (linhas 165-178)](../planning-artifacts/architecture.md) — modelagem híbrida relacional + JSONB.
- [architecture.md#Authentication & Security (linhas 180-188)](../planning-artifacts/architecture.md) — RLS + role-based authz.
- [architecture.md#Naming Patterns — Database (linhas 253-266)](../planning-artifacts/architecture.md) — convenções SQL.
- [architecture.md#Enforcement Guidelines (linhas 403-414)](../planning-artifacts/architecture.md) — regras obrigatórias para agentes.
- [architecture.md#Implementation Handoff (linhas 759-768)](../planning-artifacts/architecture.md) — ordem de migrations.
- [prd.md#Requisitos Funcionais — Motor de Regras (linhas 122-150)](../planning-artifacts/prd.md) — FR20, FR21, FR23, FR24.
- [prd.md#Jornada 2/2b — Admin operador (linhas 122-145)](../planning-artifacts/prd.md) — consumidor final (admin via AdminRuleEditor).
- [prd.md#Validade do Conteúdo (linhas 154-173)](../planning-artifacts/prd.md) — SLA 72h pós-edital, link para edital original (colunas `edital_url`, `pdf_path`).
- [ux-design-specification.md#Journey 4 — Admin atualiza regra (linhas 586-600)](../planning-artifacts/ux-design-specification.md) — fluxo admin consumindo este schema.
- [1-3-schema-profiles-trigger-rls.md](./1-3-schema-profiles-trigger-rls.md) — padrão de migration + RLS + pgTAP que esta story segue.
- [1-5-cadastro-publico-signup-lgpd.md](./1-5-cadastro-publico-signup-lgpd.md) — signup que popula `profiles`; não toca nesta story mas confirma fluxo trigger-based.
- [deferred-work.md (linhas 32-48)](./deferred-work.md) — issues de `calculations.ts` resolvíveis durante a extração do seed.
- Código existente: [src/lib/calculations.ts](../../src/lib/calculations.ts) (fonte única das 11 instituições + fórmulas), [supabase/migrations/0001_profiles.sql](../../supabase/migrations/0001_profiles.sql) (reuso de helpers), [supabase/config.toml](../../supabase/config.toml) (ajuste `[db.seed]`).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6[1m]) via bmad-dev-story skill.

### Debug Log References

- `supabase db reset --local` → migrations 0001 + 0002 aplicadas sem erro; seed `rules_engine.sql` carregado (WARNING inócuo de `SET LOCAL` fora de tx: o role `postgres` tem `BYPASSRLS`, então as policies são contornadas naturalmente durante o seed; o `begin; ... commit;` delimita a idempotência).
- `supabase test db` → **39/39 asserts pgTAP passam** (15 da 0001 + 24 da 0002).
- `docker exec supabase_db_curriculo-medway psql -c "select count..."` → `institutions=11, specialties=0, scoring_rules=75`.
- `bun run lint` → 0 erros, 7 warnings baseline (shadcn `react-refresh/only-export-components`, pré-existentes).
- `bun run build` → ✓ Vite+SSG, 7 páginas geradas.
- `bun run test -- --run` → **137/137 tests passam** em 26 test files (sem regressão vs baseline da Story 1.8).

### Completion Notes List

- Schema híbrido relacional + JSONB entregue nas 3 tabelas (`institutions`, `specialties`, `scoring_rules`) com PK uuid + `gen_random_uuid()`, FKs + ON DELETE policies (CASCADE em `institution_id`, RESTRICT em `specialty_id`), CHECK `weight >= 0 AND weight <= max_points`, UNIQUE composto `(institution_id, specialty_id, field_key)` + **índice parcial UNIQUE** `(institution_id, field_key) WHERE specialty_id IS NULL` (essencial para idempotência do upsert quando todas as regras MVP têm `specialty_id NULL`).
- RLS habilitada + **forçada** nas 3 tabelas com padrão "read-public / write-admin": SELECT permissivo para `anon`+`authenticated` (editais são públicos, permite SSG da landing fetchar em build time), e `FOR ALL` com `is_admin(auth.uid())` para escrita (reutiliza helper SECURITY DEFINER da 0001 — sem recriar função).
- Triggers `updated_at` em `institutions` e `scoring_rules` reutilizam `public.set_updated_at()` da 0001; `specialties` fica sem trigger pois só tem `created_at` (imutável pós-insert por design).
- **75 scoring_rules** semeadas a partir de `src/lib/calculations.ts` (UNICAMP 9, USP-SP 10, PSU-MG 7, FMABC 4, EINSTEIN 3, SCMSP 9, SES-PE 7, SES-DF 10, SCM-BH 6, USP-RP 5, UFPA 5). `specialties` permanece vazia (MVP não varia por especialidade — FR21 suportado apenas pelo schema).
- **formula JSONB** codifica 5 operadores nomeados (`sum`, `threshold`, `tiered`, `bool`, `composite`) + auxiliares descritivos (`any_positive`, `any_true_or_positive`, `floor_div`, `ruf_branch`, `custom`) — protocolo entre seed e `calculate_scores` da Story 2.5. Nuances aritméticas complexas (FMABC `bloco_monitoria` com `floor(sem/2)*1 + (sem%2)*0.5`) marcadas com `op:"custom"` para tratamento explícito na Story 2.5.
- **Idempotência**: seed usa `on conflict (institution_id, field_key) where specialty_id is null do update` (inference no índice parcial, não no constraint nomeado — porque o constraint composto trata NULL como distinto no Postgres e não dispararia conflito). Validado pelo teste pgTAP (assert 24).
- `supabase/config.toml` `[db.seed].sql_paths` migrado de `"./seed.sql"` para `"./seeds/*.sql"` — glob permite que Story 1.10 adicione `curriculum_fields.sql` sem nova edição.
- `src/lib/database.types.ts` regenerado via `supabase gen types typescript --local` — expõe `Database['public']['Tables']['institutions'|'specialties'|'scoring_rules']` tipados; `formula` vem como `Json` (refinado via Zod na Story 2.6). Comentário-marca adicionado no topo.
- `src/lib/calculations.ts` **intencionalmente não migrado** — continua como fallback client-side até Story 2.5 substituir por `calculate_scores()` DB function. `deferred-work.md:32-48` já rastreia os débitos semânticos (coerção `val`, caps agregados UFPA, `ranking_ruf_top35` ternary) para Story 2.5.
- **Ajustes pontuais durante TDD**: `col_has_check` exigiu array quando a CHECK envolve múltiplas colunas; `throws_ok` precisa testar INSERT (e não UPDATE) pois RLS filtra UPDATE silenciosamente ao invés de lançar exceção; `on conflict` alinhado ao índice parcial do MVP.

### File List

**Created:**
- `supabase/migrations/0002_rules_engine.sql`
- `supabase/seeds/rules_engine.sql`
- `supabase/tests/0002_rules_engine.test.sql`

**Modified:**
- `supabase/config.toml` — `[db.seed].sql_paths` para `./seeds/*.sql`
- `src/lib/database.types.ts` — regenerado com 3 novas tabelas
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story 1.9 ready-for-dev → review
- `_bmad-output/implementation-artifacts/1-9-schema-motor-regras-seeds-instituicoes.md` — Status=review, tasks marcadas, Dev Agent Record preenchido

## Change Log

| Data       | Versão | Descrição                                                                                                                      | Autor    |
|------------|--------|--------------------------------------------------------------------------------------------------------------------------------|----------|
| 2026-04-14 | 0.1    | Story 1.9 criada via create-story (ready-for-dev). Motor de regras + seeds 11 inst.                                            | PM       |
| 2026-04-15 | 1.0    | Implementação: migration 0002 (3 tabelas + RLS), seed 11 inst / 75 regras, 24 asserts pgTAP, types regenerados. Status → review. | Rcfranco |
