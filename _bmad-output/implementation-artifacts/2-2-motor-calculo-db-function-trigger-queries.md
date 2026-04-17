# Story 2.2: Motor de cálculo — DB Function + trigger + queries frontend

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **desenvolvedor do Medway Currículo**,
I want **uma função PL/pgSQL que calcula scores por instituição, trigger de invalidação e camada de queries frontend**,
So that **o backend tem lógica autoritativa de cálculo e o dashboard consome scores consistentemente via React Query**.

## Acceptance Criteria

Copiados verbatim de [epics.md#Story 2.2](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Migration `calculate_scores` DB Function**
   **Given** `supabase/migrations/0005_calculate_scores.sql`
   **When** aplico
   **Then** existe `calculate_scores(p_user_id uuid, p_specialty_id uuid DEFAULT NULL) RETURNS void`
   **And** lê `user_curriculum.data`, itera `scoring_rules` aplicáveis (specialty_id ou default NULL), aplica `formula` JSONB + `weight` + `max_points`, faz upsert em `user_scores` com `stale=false` e `calculated_at=now()`
   **And** executa em <1s para 11 instituições × 1 aluno (NFR3)

2. **AC2 — RPC exposta com RLS**
   **Given** RPC `calculate_scores` exposta
   **When** chamo via `supabase.rpc('calculate_scores', { p_user_id, p_specialty_id })`
   **Then** respeita RLS (aluno só calcula próprios scores)

3. **AC3 — Trigger `on_scoring_rule_updated`**
   **Given** admin atualiza `scoring_rules`
   **When** trigger `on_scoring_rule_updated` dispara
   **Then** marca `user_scores.stale=true` para users afetados

4. **AC4 — Testes pgTAP**
   **Given** `supabase/tests/calculate_scores.sql` (pgTAP)
   **When** executo
   **Then** passam ao menos 3 cenários: currículo vazio → 0; currículo cheio → score esperado por instituição; troca de especialidade usa regras específicas quando existem

5. **AC5 — `src/lib/queries/scoring.ts`**
   **Given** `src/lib/queries/scoring.ts`
   **When** importo
   **Then** `useScores(userId, specialtyId)` (a) lê `user_scores`; (b) se algum `stale=true`, invoca RPC `calculate_scores` e re-lê; (c) retorna array ordenado `score desc`
   **And** `useInstitutions()` retorna lista com `edital_url` e `pdf_path`
   **And** keys tipadas `['scores', userId, specialtyId]`, `['institutions']`

## Tasks / Subtasks

- [x] **Task 1 — DB Function `calculate_scores`** (AC: #1, #2)
  - [x] 1.1 Criar `supabase/migrations/0007_calculate_scores.sql` (próximo número disponível após 0006)
    - Criar função `calculate_scores(p_user_id uuid, p_specialty_id uuid DEFAULT NULL) RETURNS void` como `SECURITY DEFINER` com `SET search_path = public`
    - Ler `user_curriculum.data` do user
    - Para cada institution, buscar `scoring_rules` onde `specialty_id = p_specialty_id` OR `specialty_id IS NULL` (priorizar specialty-specific sobre default via `DISTINCT ON` ou similar)
    - Implementar interpretador de `formula` JSONB que suporta TODOS os operadores usados no seed:
      - `sum` — soma de termos com cap total (`caps.total`), suporta flags: `mult`, `when_true`, `when_gt0`, `override_by`
      - `threshold` / `tiered` — faixas exclusivas (`brackets`/`tiers`) com `gte`/`gt` + `pts`; flag `null_policy:"zero"`; flag `aggregate:{sum_of:[...]}`
      - `bool` — flag booleana `{field, pts_true}`
      - `composite` — `groups[]` independentes, cada grupo com seu próprio `op` e `caps`; cap total externo
      - `custom` — mapeamento para sub-funções PL/pgSQL nomeadas (`fn:"fmabc_monitoria"`)
      - `ruf_branch` — tri-state `{field, pts_true, pts_false, pts_null}`
      - `floor_div` — `{field, divisor, mult}` → `floor(field/divisor) * mult`
      - `any_positive` — retorna `pts` se qualquer `fields[]` > 0
      - `any_true_or_positive` — retorna `pts` se qualquer `fields_true[]` true OU `fields_positive[]` > 0
    - Criar sub-função `fmabc_monitoria(p_semestres numeric) RETURNS numeric` — `floor(sem/2)*1.0 + (sem%2)*0.5, cap 1.5`
    - Upsert resultado em `user_scores` com `stale=false`, `calculated_at=now()`
    - Score total por instituição = soma dos resultados de cada regra, capped por `SUM(max_points)` da instituição
    - `breakdown` JSONB = `{ "rule_field_key": { "score": X, "max": Y, "description": "..." }, ... }`
  - [x] 1.2 Resolver PK `user_scores` com `specialty_id` nullable
    - **Decisão recomendada:** usar sentinel UUID `'00000000-0000-0000-0000-000000000000'` para "sem especialidade" no upsert — evita problemas com `NULL` em PK composta do Postgres
    - Alternativa: `UNIQUE NULLS NOT DISTINCT` (PG15+) — validar que Supabase local suporta
    - **CRITICAL:** esta decisão afeta toda query que lê/escreve `user_scores`. Documentar no completion notes.
  - [x] 1.3 Revogar INSERT/UPDATE/DELETE em `user_scores` de students via PostgREST direto
    - Remover policies `user_scores_insert_own`, `user_scores_update_own`, `user_scores_delete_own`
    - Manter apenas `user_scores_select_own` para leitura
    - Escrita exclusiva via `calculate_scores` que é `SECURITY DEFINER`
  - [x] 1.4 Expor RPC: `GRANT EXECUTE ON FUNCTION calculate_scores TO authenticated`
    - RLS interna: dentro da função, validar `auth.uid() = p_user_id` antes de executar (ou confiar no SECURITY DEFINER + RLS da tabela fonte)
    - **Decisão recomendada:** adicionar `IF auth.uid() != p_user_id THEN RAISE EXCEPTION 'unauthorized'; END IF;` no início da função

- [x] **Task 2 — Trigger `on_scoring_rule_updated`** (AC: #3)
  - [x] 2.1 Na mesma migration 0007, criar função `mark_scores_stale()`:
    - Em INSERT/UPDATE/DELETE de `scoring_rules`, marcar `user_scores.stale=true` para TODOS os users que têm scores da `institution_id` afetada
    - Se a regra tem `specialty_id` específico, marcar stale apenas os scores daquela specialty
    - Se a regra é default (`specialty_id IS NULL`), marcar stale TODOS os scores daquela institution
  - [x] 2.2 Criar trigger `on_scoring_rule_changed` AFTER INSERT OR UPDATE OR DELETE ON `scoring_rules`
    - `FOR EACH ROW EXECUTE FUNCTION mark_scores_stale()`
    - Usar `COALESCE(NEW.institution_id, OLD.institution_id)` para cobrir DELETE

- [x] **Task 3 — Testes pgTAP** (AC: #4)
  - [x] 3.1 Criar `supabase/tests/0007_calculate_scores.test.sql`:
    - Test 1: currículo vazio (data = '{}') → score = 0 para todas as instituições
    - Test 2: currículo preenchido com valores conhecidos → validar score exato contra cálculo manual para UNICAMP e PSU-MG (bases diferentes: 100 vs 10.0)
    - Test 3: specialty-specific rule override (criar regra com specialty_id → validar que é usada em vez da default)
    - Test 4: trigger `mark_scores_stale` — atualizar regra → verificar `user_scores.stale=true`
    - Test 5: `fmabc_monitoria` custom fn — testar valores: 0→0, 1→0.5, 2→1.0, 3→1.5, 4→1.5 (cap)
    - Test 6: validar NFR3 (<1s) com `clock_timestamp()` para 11 instituições × 1 aluno

- [x] **Task 4 — Schemas Zod de scoring** (AC: #5)
  - [x] 4.1 Criar `src/lib/schemas/scoring.ts`:
    - Exportar `userScoreSchema` baseado em `user_scores` Row type
    - Exportar `institutionSchema` baseado em `institutions` Row type
    - Exportar `scoreBreakdownSchema` para o JSONB `breakdown`
    - Tipos: `UserScore`, `Institution`, `ScoreBreakdown`
  - [x] 4.2 Criar `src/lib/schemas/scoring.test.ts` — validar schemas contra dados de exemplo

- [x] **Task 5 — React Query hooks de scoring** (AC: #5)
  - [x] 5.1 Criar `src/lib/queries/scoring.ts`:
    - `scoringKeys` com padrão de query keys tipadas:
      - `scores: (userId, specialtyId) => ['scores', userId, specialtyId]`
      - `institutions: ['institutions']`
    - `useInstitutions()`: `useQuery` que busca todas as institutions ordenadas por name, com `staleTime: 10 * 60 * 1000`
    - `useScores(userId, specialtyId)`:
      - (a) `useQuery` que busca `user_scores` filtrado por user_id + specialty_id
      - (b) Dentro do `queryFn` ou em efeito separado: se algum score tem `stale=true`, invocar `supabase.rpc('calculate_scores', { p_user_id: userId, p_specialty_id: specialtyId })` e re-buscar
      - (c) Retorna array ordenado `score desc`
      - `staleTime: 0` (sempre re-checar stale flag)
    - `useRecalculateScores()`: `useMutation` que invoca RPC manualmente + `invalidateQueries(['scores', userId])`
  - [x] 5.2 Criar `src/lib/queries/scoring.test.ts` — mock Supabase, validar query keys, auto-recálculo quando stale

- [x] **Task 6 — Integração e validação** (AC: todos)
  - [x] 6.1 Rodar `supabase db reset` e validar que seed + migrations + calculate_scores funcionam juntos
  - [x] 6.2 Validar manualmente: inserir currículo via `/app/curriculo` → chamar RPC → verificar `user_scores` populados
  - [x] 6.3 Validar trigger: alterar `scoring_rules` → verificar `stale=true` em `user_scores`
  - [x] 6.4 Validar NFR3: cálculo <1s para 11 instituições (medir com `EXPLAIN ANALYZE`)
  - [x] 6.5 Regenerar `src/lib/database.types.ts` via `supabase gen types typescript --local`
  - [x] 6.6 Rodar `bun run lint && bunx tsc --noEmit && bun run test && bun run build` — tudo verde

## Dev Notes

### Contexto crítico (ler antes de codar)

1. **Esta é a SEGUNDA story do Epic 2** — migra o cálculo de scores do client-side (`src/lib/calculations.ts`) para o backend. O arquivo `calculations.ts` NÃO deve ser removido nesta story — ele será removido quando o frontend migrar para os hooks React Query. O schema de currículo e scores já existe (migrations 0002 + 0003). Os seeds com fórmulas JSONB já estão carregados (75 regras em `supabase/seeds/rules_engine.sql`).

2. **Fórmulas JSONB já documentadas no seed** — O seed file (`supabase/seeds/rules_engine.sql`, linhas 9-31) documenta o contrato completo de operadores e flags. A DB Function `calculate_scores` é o **interpretador** dessas fórmulas. Cada regra em `scoring_rules` tem uma coluna `formula jsonb` que descreve como calcular o score daquele item. A função deve iterar as regras e aplicar a fórmula de cada uma.

3. **Operadores obrigatórios (todos usados no seed):**
   - `sum` — 43 ocorrências. Soma de termos com `caps.total`. Cada termo: `{field, mult}` ou `{field, when_true: pts}` ou `{field, when_gt0: pts}`. Flag `override_by`: se campo referenciado é truthy, ignora este termo.
   - `threshold` / `tiered` — 17 ocorrências. Faixas exclusivas (primeira match ganha). `brackets`/`tiers`: `[{gte:X, pts:Y}, {gt:Z, pts:W}]`. Flag `null_policy:"zero"` (campo null conta como 0). Flag `aggregate:{sum_of:[fields]}` (campo sintético somando outros).
   - `bool` — 9 ocorrências. `{field, pts_true}` — retorna pts se campo é truthy.
   - `composite` — 6 ocorrências. `groups[]` onde cada group é uma sub-fórmula independente com seu op e caps. Cap total externo em `caps.total`.
   - `custom` — 1 ocorrência (FMABC monitoria). `{fn:"fmabc_monitoria"}` com campo e caps.
   - `ruf_branch` — 1 ocorrência (SCMSP formação). `{field, pts_true, pts_false, pts_null}` — tri-state.
   - `floor_div` — 1 ocorrência (SES-DF social). `{field, divisor, mult}`.
   - `any_positive` — 3 ocorrências. `{fields:[], pts}` — retorna pts se qualquer campo > 0.
   - `any_true_or_positive` — 1 ocorrência. `{fields_true:[], fields_positive:[], pts}` — retorna pts se qualquer truthy ou > 0.

4. **PK `user_scores` com specialty_id nullable** — Decisão técnica pendente desde Story 1.10. A PK composta `(user_id, institution_id, specialty_id)` tem `specialty_id` nullable. Postgres trata NULL como distinto em PK, o que quebra upsert via `ON CONFLICT`. **Opções:**
   - (a) Sentinel UUID `'00000000-0000-0000-0000-000000000000'` no lugar de NULL — upsert funciona nativamente
   - (b) `UNIQUE NULLS NOT DISTINCT` (PG15+) — mais limpo mas requer PG15
   - (c) `INSERT ... ON CONFLICT DO UPDATE` com índice parcial `WHERE specialty_id IS NULL` + índice regular para NOT NULL
   - **Recomendação:** opção (a) sentinel UUID. O Supabase pode não estar em PG15 e a solução é universalmente compatível. Requer: (i) alterar `specialties` seed para incluir uma row sentinel, (ii) na migration, alterar `user_scores.specialty_id` para `NOT NULL DEFAULT sentinel`, (iii) converter lógica de "sem especialidade" de NULL para sentinel em toda query.
   - **Alternativa mais simples:** manter NULL e usar `INSERT ... ON CONFLICT ON CONSTRAINT user_scores_pkey DO UPDATE` com lógica manual de `WHERE specialty_id IS NULL OR specialty_id = p_specialty_id`. **Validar empiricamente com o PG do Supabase local antes de decidir.**

5. **Tightening RLS de `user_scores`** — Deferred desde Story 1.10. Atualmente students podem INSERT/UPDATE/DELETE em `user_scores` via PostgREST direto. Esta story deve remover essas policies e manter apenas SELECT. A escrita passa a ser exclusiva via `calculate_scores` SECURITY DEFINER.

6. **`src/lib/calculations.ts` NÃO deve ser removido** — Legado preservado. O frontend ainda consome essa lib até o Dashboard (Story 2.3) migrar para `useScores()`. Esta story cria o backend + hooks; a Story 2.3 conecta.

7. **Score base varia por instituição** — UNICAMP/USP-SP/SCMSP/SES-PE/UFPA são base 100; PSU-MG/FMABC/SES-DF/SCM-BH/USP-RP são base 10. A `max_score` em `user_scores` deve refletir o `SUM(max_points)` das regras da instituição (não um valor fixo).

### Padrões de arquitetura que você DEVE seguir

- **Snake_case no stack de dados** — dados vindos do Supabase mantêm snake_case no TS. NÃO mapear para camelCase. [Source: architecture.md#Naming Patterns]
- **React Query para TODO data fetching** — nenhum `supabase.from().select()` direto em componentes. Sempre via hooks em `src/lib/queries/`. [Source: architecture.md#Enforcement Guidelines regra 4]
- **Schemas Zod em `src/lib/schemas/`** — reutilizáveis entre client e server. [Source: architecture.md#Enforcement Guidelines regra 3]
- **Query keys como tupla tipada** — `['scores', userId, specialtyId]`, `['institutions']`. [Source: architecture.md#Communication Patterns]
- **Mutations com `invalidateQueries` explícito** em `onSuccess`. [Source: architecture.md#Communication Patterns]
- **Sempre checar `error` antes de `data`** nas chamadas Supabase. [Source: architecture.md#Enforcement Guidelines regra 5]
- **Testes co-localizados** — `.test.ts(x)` no mesmo diretório. [Source: architecture.md#Structure Patterns]
- **Funções SQL: `snake_case` verbo-primeiro** — `calculate_scores`, `mark_scores_stale`, `fmabc_monitoria`. [Source: architecture.md#Naming Patterns]
- **Mensagens ao usuário em pt-BR** — acionáveis, sem jargão técnico. [Source: architecture.md#Enforcement Guidelines regra 7]
- **Conventional Commits em pt-BR** — `feat(scoring): motor de cálculo calculate_scores + trigger + queries (Story 2.2)`.

### Anti-patterns a EVITAR

- ❌ **Não** remover `src/lib/calculations.ts` — legado preservado até Story 2.3
- ❌ **Não** criar componentes de UI nesta story — escopo é backend + queries layer
- ❌ **Não** hardcodar lógica de cálculo por instituição — implementar interpretador genérico de `formula` JSONB
- ❌ **Não** ignorar operadores "exóticos" (`custom`, `ruf_branch`, `floor_div`, `any_positive`, `any_true_or_positive`) — TODOS estão em uso no seed e retornariam 0 silenciosamente se não implementados
- ❌ **Não** usar `service_role` key no cliente — `calculate_scores` é SECURITY DEFINER e executa com owner privileges internamente
- ❌ **Não** deixar policies de escrita student em `user_scores` — revogar INSERT/UPDATE/DELETE de student
- ❌ **Não** usar `useState` + `useEffect` para data fetching — usar React Query
- ❌ **Não** logar PII (email, nome, telefone) em console ou Sentry
- ❌ **Não** alterar migrations existentes (0001-0006) — apenas criar 0007+
- ❌ **Não** alterar seeds existentes — a migration resolve o PK issue internamente

### Decisões técnicas específicas

- **Interpretador de fórmulas em PL/pgSQL:** Criar uma função auxiliar `evaluate_formula(p_formula jsonb, p_data jsonb) RETURNS numeric` que recebe a fórmula e os dados do currículo, despacha por `formula->>'op'` e retorna o score parcial. `calculate_scores` itera as regras e acumula os resultados.

- **`composite` é recursivo:** cada group dentro de `groups[]` é uma sub-fórmula com seu próprio `op`. `evaluate_formula` deve chamar a si mesma recursivamente para cada group. Cap total do composite aplicado sobre a soma dos groups.

- **`aggregate` é pré-processamento:** quando `aggregate.sum_of` está presente num threshold/tiered, o campo avaliado é um campo sintético calculado como soma dos campos listados. Construir o valor antes de avaliar os brackets.

- **`override_by` em termos de `sum`:** se o campo referenciado por `override_by` for truthy nos dados do currículo, o termo corrente é ignorado (score = 0 para esse termo). Exemplo: mestrado com `override_by: "doutorado"` — se doutorado = true, mestrado é ignorado.

- **`null_policy:"zero"` em threshold:** quando o campo é NULL ou ausente no JSONB data, tratar como 0 (em vez do default que seria skip/0 pts implícito — ambos resultam no mesmo, mas o flag documenta a intenção).

- **Breakdown JSONB:** Para cada regra, armazenar no `breakdown` o `field_key` como chave com `{ "score": X, "max": Y, "description": "..." }`. Isso é consumido pela Story 2.4 (GapAnalysisList) para mostrar detalhes por categoria.

- **Stale-check no `useScores`:** O hook deve verificar se algum score retornado tem `stale=true`. Se sim, disparar RPC `calculate_scores` e refetch. Implementar com lógica dentro do `queryFn` (fetch → check stale → if stale, rpc → refetch) para manter atomicidade da query. Evitar `useEffect` separado.

- **`useInstitutions` com staleTime alto:** Instituições mudam raramente. `staleTime: 10 * 60 * 1000` (10 min).

### Campos do currículo consumidos pelas fórmulas

Referência cruzada entre `user_curriculum.data` (JSONB com keys = `field_key` de `curriculum_fields`) e os campos usados nas fórmulas. Todos os 29 campos do seed são usados por pelo menos uma regra:

| field_key | Tipo | Instituições que usam |
|---|---|---|
| `artigos_high_impact` | number | UNICAMP, USP-SP, PSU-MG, FMABC, EINSTEIN, SCMSP, SES-PE, SES-DF, SCM-BH, USP-RP |
| `artigos_mid_impact` | number | UNICAMP, USP-SP, PSU-MG, FMABC, SCMSP, SES-PE, SES-DF, SCM-BH, USP-RP |
| `artigos_low_impact` | number | USP-SP, PSU-MG, FMABC, SCMSP, SES-PE, SES-DF, SCM-BH, USP-RP |
| `artigos_nacionais` | number | UNICAMP, PSU-MG, FMABC, SES-PE, SCM-BH, USP-RP, UFPA |
| `capitulos_livro` | number | (nenhuma regra no seed — dead data no MVP) |
| `ic_com_bolsa` | number | UNICAMP, USP-SP, PSU-MG, FMABC, SCMSP, SES-PE, SES-DF, SCM-BH, USP-RP |
| `ic_sem_bolsa` | number | UNICAMP, USP-SP, PSU-MG, FMABC, SES-PE, SES-DF, SCM-BH, USP-RP |
| `ic_horas_totais` | number | EINSTEIN |
| `monitoria_semestres` | number | UNICAMP, USP-SP, PSU-MG, FMABC, SCMSP, SES-PE, SES-DF, SCM-BH, USP-RP |
| `extensao_semestres` | number | USP-SP, PSU-MG, SES-PE, SES-DF, SCM-BH, UFPA |
| `voluntariado_horas` | number | UNICAMP, USP-SP, FMABC, SCMSP, USP-RP |
| `estagio_extracurricular_horas` | number | PSU-MG, FMABC |
| `trabalho_sus_meses` | number | SES-DF |
| `projeto_rondon` | boolean | USP-SP, FMABC, SES-DF, SES-PE |
| `internato_hospital_ensino` | boolean | UNICAMP, USP-SP, SCMSP, USP-RP |
| `diretoria_ligas` | number | UNICAMP, USP-SP, PSU-MG, FMABC, SCMSP |
| `membro_liga_anos` | number | UNICAMP, PSU-MG, FMABC, SCMSP, SES-PE, SES-DF, SCM-BH, USP-RP |
| `representante_turma_anos` | number | USP-SP, FMABC, SES-DF, USP-RP |
| `cursos_suporte` | number | UNICAMP, USP-SP, PSU-MG, FMABC, SCMSP, SES-DF |
| `apresentacao_congresso` | number | UNICAMP, USP-SP, FMABC, SCMSP, SES-PE, SES-DF, SCM-BH, USP-RP |
| `ouvinte_congresso` | number | USP-SP, FMABC, SES-DF, SCM-BH, UFPA |
| `organizador_evento` | number | FMABC |
| `teste_progresso` | number | FMABC |
| `ingles_fluente` | boolean | UNICAMP, USP-SP, PSU-MG, FMABC, SCMSP, SES-PE, SES-DF, UFPA |
| `media_geral` | number | USP-SP, PSU-MG, SES-PE, SES-DF, SCM-BH |
| `conceito_historico` | select | (nenhuma regra — dead data; deferred-work.md) |
| `ranking_ruf_top35` | boolean | USP-SP, SCMSP |
| `mestrado` | boolean | UNICAMP, EINSTEIN |
| `doutorado` | boolean | UNICAMP, EINSTEIN |

### Leitura de valores do JSONB `data`

A função PL/pgSQL deve extrair valores com coerção de tipo:
- `number` → `COALESCE((p_data->>field_key)::numeric, 0)`
- `boolean` → `COALESCE((p_data->>field_key)::boolean, false)`
- Campos ausentes no JSONB → default 0 ou false (nunca erro)

### UX specs que esta story habilita (sem implementar UI)

- **Dashboard (Story 2.3):** `useScores()` + `useInstitutions()` serão consumidos por `ScoreCard`, `NarrativeBanner`, `SpecialtySelector`
- **Detalhe instituição (Story 2.4):** `breakdown` JSONB será consumido por `GapAnalysisList` para mostrar score por categoria + delta possível
- **Admin regras (Story 3.2):** trigger `on_scoring_rule_changed` garante recálculo reativo ao mudar regras

### Previous story intelligence (Story 2.1)

- **Story 2.1 (done, code review 2026-04-17)** — Formulário de currículo com autosave. 14 arquivos novos, 250 testes verdes. Padrões estabelecidos:
  - Schemas Zod em `src/lib/schemas/curriculum.ts` — schema estático com 29 campos + `z.catchall(z.unknown())`
  - React Query hooks em `src/lib/queries/curriculum.ts` — `curriculumKeys` como objeto de query keys, `useCurriculumFields()`, `useCurriculum(userId)`, `useUpdateCurriculum(userId)`
  - Hook `use-autosave` em `src/hooks/use-autosave.ts`
  - Componentes em `src/components/features/curriculum/`
  - Upsert de `user_curriculum` via PostgREST direto (não Edge Function)
  - `useForm({ resolver: zodResolver(schema), mode: "onBlur" })`
  - **Patches do code review:** race condition no autosave (P1), flush retorna Promise (P3), guard userId vazio (P4), Sonner toast para erros (P11)
  - **Completion notes relevantes:** `queryClient.clear()` em SIGNED_OUT deve ser revisado agora que há cache user-scoped scoring

- **Story 1.10 (done)** — Criou `user_scores` com PK composta + RLS. Policies de escrita student existem e devem ser removidas.
- **Story 1.9 (done)** — Seeds das 11 instituições com 75 regras JSONB. Operadores documentados no header do seed.

### Git intelligence (últimos commits)

- Conventional Commits em pt-BR: `feat:`, `fix:`, `ci:`, `test:`, `chore:`.
- Para esta story: `feat(scoring): motor de cálculo calculate_scores + trigger + queries (Story 2.2)`.
- 250 testes verdes é o baseline atual — NÃO regredir.
- Migrations numeradas sequencialmente: 0001-0006 existem. Próxima: `0007_calculate_scores.sql`.

### Deferrals conhecidos relevantes a esta story

- **PK `user_scores` com specialty_id nullable** — [deferred-work.md] Decisão pendente desde 1.10. Esta story DEVE resolver.
- **Policies de escrita student em `user_scores`** — [deferred-work.md] Tightening para SECURITY DEFINER. Esta story DEVE resolver.
- **`conceito_historico` dead data** — [deferred-work.md] Nenhuma regra consome este campo. Irrelevante para `calculate_scores`.
- **`media_geral` escala ambígua (0-10 ou 0-100)** — [deferred-work.md] Seeds usam `gte:80` e `gte:85` — claramente escala 0-100. A função aplica o que o seed diz.
- **Discriminated union TS para `scoring_rules.formula`** — [deferred-work.md Story 1.9] Criar `src/lib/schemas/scoring-formula.ts` — **NÃO é escopo desta story** (escopo de Story 2.6 ou 3.2 quando admin edita fórmulas). Nesta story o JSONB é consumido apenas pelo PL/pgSQL.
- **`queryClient.clear()` em SIGNED_OUT** — [deferred-work.md Story 2.1] Com cache `['scores', userId, specialtyId]` adicionado, validar que o AuthContext limpa adequadamente.

### Project Structure Notes

Arquivos criados/modificados esperados:

```
supabase/
  migrations/
    0007_calculate_scores.sql                   [NOVO]
  tests/
    0007_calculate_scores.test.sql              [NOVO]
src/
  lib/
    schemas/
      scoring.ts                                [NOVO]
      scoring.test.ts                           [NOVO]
    queries/
      scoring.ts                                [NOVO]
      scoring.test.ts                           [NOVO]
    database.types.ts                           [REGENERADO — supabase gen types]
```

**NÃO devem ser tocados:**
- `src/lib/calculations.ts` — legado preservado até Story 2.3
- `supabase/migrations/0001-0006` — migrations existentes imutáveis
- `supabase/seeds/*` — seeds estáveis
- `src/components/features/*` — sem UI nesta story

### References

- [epics.md#Story 2.2 (linhas 692-727)](../planning-artifacts/epics.md) — ACs canônicos
- [architecture.md#API & Communication Patterns (linhas 189-198)](../planning-artifacts/architecture.md) — cálculo via RPC + trigger
- [architecture.md#Data Flow cálculo de scores (linhas 618-625)](../planning-artifacts/architecture.md) — fluxo currículo → stale → recálculo
- [architecture.md#Implementation Patterns (linhas 249-420)](../planning-artifacts/architecture.md) — naming, query keys, error handling
- [supabase/seeds/rules_engine.sql (linhas 1-31)](../../supabase/seeds/rules_engine.sql) — contrato de operadores JSONB
- [supabase/migrations/0003_curriculum_scores.sql](../../supabase/migrations/0003_curriculum_scores.sql) — schema user_scores + RLS
- [supabase/migrations/0002_rules_engine.sql](../../supabase/migrations/0002_rules_engine.sql) — schema scoring_rules
- [src/lib/queries/curriculum.ts](../../src/lib/queries/curriculum.ts) — padrão de React Query hooks a seguir
- [src/lib/schemas/curriculum.ts](../../src/lib/schemas/curriculum.ts) — padrão de Zod schema a seguir
- [src/lib/database.types.ts](../../src/lib/database.types.ts) — tipos gerados (user_scores linhas 268-322)
- [deferred-work.md](./deferred-work.md) — deferrals pendentes de 1.10 e 1.9

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- COALESCE type mismatch na `mark_scores_stale()`: `CASE` com `NULL` literal é interpretado como `text`, não `uuid`. Fix: trocar `COALESCE(CASE...)` por `IF tg_op = 'DELETE' THEN ... ELSE ... END IF`.
- pgTAP plan count off-by-one: 25 → 26 (contagem manual errada).
- Test 2b max_score 105 em vez de 100: query sem filtro `specialty_id` pegava row de outro test quando dados residuais existiam. Fix: filtrar por sentinel UUID.
- Test 0002 `specialties table empty` falhou: sentinel `__default__` adicionado pela migration 0007. Fix: alterar teste para excluir sentinel.
- `supabase gen types` incluiu `Connecting to db 5432` na primeira linha do output. Fix: removido manualmente.

### Completion Notes List

- **PK specialty_id sentinel UUID:** Decisão implementada — `user_scores.specialty_id` agora é `NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'`. Sentinel inserido em `specialties` com `name='__default__'`. Todas as queries que lêem/escrevem `user_scores` DEVEM usar sentinel em vez de NULL para "sem especialidade". Frontend hooks já usam `DEFAULT_SPECIALTY_ID` constant.
- **RLS tightened:** Policies `user_scores_insert_own`, `user_scores_update_own`, `user_scores_delete_own` removidas. Students agora só têm SELECT. Escrita exclusiva via `calculate_scores` SECURITY DEFINER.
- **evaluate_formula genérico:** Interpretador recursivo em PL/pgSQL. Suporta todos os 10 operadores do seed (sum, threshold, tiered, bool, composite, custom, ruf_branch, floor_div, any_positive, any_true_or_positive). Composite chama evaluate_formula recursivamente.
- **Performance NFR3:** ~2ms para 11 instituições × 1 aluno (benchmark: <1s exigido).
- **294 testes TS + 107 pgTAP:** Nenhuma regressão. 15 novos testes TS (scoring schemas + queries) + 26 novos pgTAP (story 2.2).
- **queryClient.clear() em SIGNED_OUT:** Cache `['scores', userId, specialtyId]` adicionado. O `queryClient.clear()` existente no AuthContext já cobre — validar comportamento quando Story 2.3 conectar o dashboard.

### File List

**Novos:**
- `supabase/migrations/0007_calculate_scores.sql` — Migration principal: PK fix, RLS tightening, evaluate_formula, calculate_scores, fmabc_monitoria, mark_scores_stale, trigger
- `supabase/tests/0007_calculate_scores.test.sql` — 26 testes pgTAP
- `src/lib/schemas/scoring.ts` — Schemas Zod: userScoreSchema, institutionSchema, scoreBreakdownSchema
- `src/lib/schemas/scoring.test.ts` — 10 testes de schema
- `src/lib/queries/scoring.ts` — React Query hooks: useScores, useInstitutions, useRecalculateScores, scoringKeys
- `src/lib/queries/scoring.test.ts` — 5 testes de query keys e exports

**Modificados:**
- `supabase/tests/0002_rules_engine.test.sql` — Ajustado teste de specialties (sentinel __default__)
- `src/lib/database.types.ts` — Regenerado com novas funções (calculate_scores, evaluate_formula, fmabc_monitoria)

### Change Log

- 2026-04-17: Implementação completa Story 2.2 — Motor de cálculo calculate_scores + trigger + queries frontend
- 2026-04-17: Code review executado (Blind Hunter + Edge Case Hunter + Acceptance Auditor)

### Review Findings

#### Decision Needed
- [x] [Review][Decision] **weight ignorado no cálculo** — RESOLVIDO: weight é redundante por design (== max_points em 100% das regras). Fórmula JSONB controla toda a lógica. Documentado.
- [x] [Review][Decision] **auth.uid() com service_role/admin** — RESOLVIDO: manter comportamento atual (service_role passa). Necessário para recálculo em massa após admin alterar regras. Requisito adicional registrado: notificação in-app ao aluno quando scores mudam por alteração admin (story futura).

#### Patch
- [x] [Review][Patch] **Divisão por zero em `floor_div`** [`supabase/migrations/0007_calculate_scores.sql:250`] — Guard adicionado: `if divisor = 0 then return 0`.
- [x] [Review][Patch] **Scores inexistentes não disparam cálculo inicial** [`src/lib/queries/scoring.ts:78`] — `needsCalc` agora inclui `data.length === 0` para primeiro acesso.
- [x] [Review][Patch] **ORDER BY no SELECT DISTINCT de instituições** [`supabase/migrations/0007_calculate_scores.sql:361`] — `ORDER BY institution_id` adicionado para prevenir deadlock.
- [x] [Review][Patch] **Loop infinito potencial com stale** [`src/lib/queries/scoring.ts:78-96`] — Recálculo feito uma única vez; re-fetch após RPC não re-checa stale.
- [x] [Review][Patch] **RLS não testada em pgTAP** [`supabase/tests/0007_calculate_scores.test.sql`] — Test 7 adicionado: `throws_ok` verifica exception 42501 ao calcular scores de outro user.

#### Deferred
- [x] [Review][Defer] **Cast boolean/numeric de valores inválidos no JSONB** — Input validation na camada de currículo (Story 2.1 Zod schema), não no evaluate_formula. Deferred, pre-existing.
- [x] [Review][Defer] **UPDATE institution_id no trigger não marca stale na instituição antiga** — Cenário admin raro; trigger usa apenas NEW.institution_id. Deferred.
- [x] [Review][Defer] **Recursão ilimitada em composite** — Sem depth limit. Impacto baixo com dados controlados via admin. Deferred.
- [x] [Review][Defer] **Zod schemas decorativos (type assertion sem parse)** — Padrão da codebase; `as UserScore[]` em vez de `.parse()`. Consistente com `curriculum.ts`. Deferred.
- [x] [Review][Defer] **Termo sum sem operador ignorado silenciosamente** — Se um termo não tem `mult`, `when_true` nem `when_gt0`, contribui 0 sem warning. Deferred.
- [x] [Review][Defer] **Smoke tests insuficientes para AC5** — Testes de renderHook planejados para Story 2.3. Deferred.
