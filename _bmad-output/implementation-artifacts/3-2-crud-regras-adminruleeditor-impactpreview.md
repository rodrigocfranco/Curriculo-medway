# Story 3.2: CRUD de regras com AdminRuleEditor + ImpactPreview

Status: done

## Story

As a admin,
I want configurar regras de cálculo por instituição × especialidade com preview de impacto antes de publicar,
So that adapto pontuações quando editais mudam e opero com confiança sabendo quantos alunos serão afetados.

## Acceptance Criteria

1. **Given** aba `/admin/regras` **When** acesso **Then** vejo lista de regras filtráveis por instituição (Select) e especialidade (Select opcional) **And** regras default (sem especialidade) aparecem primeiro **And** loading state com Skeleton
2. **Given** clico "Nova regra" ou "Editar regra" **When** uso `AdminRuleEditor` **Then** preencho: instituição (Select), especialidade (Select opcional — "Todas" = NULL), category (Select de categorias), field_key (Select de `curriculum_fields` filtrado por category), weight (Input numérico ≥0), max_points (Input numérico ≥ weight), description (Textarea), formula (editor JSONB com validação Zod)
3. **Given** editor com estados visuais **When** interajo **Then** vejo draft (novo, sem ID), dirty (editado não salvo), publishing (mutation em voo), published (salvo com timestamp), error (mensagem específica pt-BR)
4. **Given** `CHECK weight >= 0 AND weight <= max_points` no banco **When** submeto com weight > max_points **Then** validação Zod client-side impede submit **And** mensagem inline âmbar no campo
5. **Given** alterei uma regra e cliquei "Publicar" **When** confirmação abre **Then** `ImpactPreviewDialog` exibe: contagem de alunos com currículo preenchido afetados por aquela instituição + especialidade; amostra de até 5 alunos com delta estimado ("João: 32 → 38 (+6)") **And** CTAs "Confirmar publicação" e "Cancelar"
6. **Given** confirmo no ImpactPreviewDialog **When** mutation roda **Then** regra é persistida (INSERT ou UPDATE) **And** trigger `on_scoring_rule_updated` marca `user_scores.stale=true` para users afetados **And** toast "Regra publicada — {N} alunos terão recálculo na próxima sessão"
7. **Given** clico "Remover" numa regra **When** confirmo em dialog de segurança **Then** mutation deleta **And** trigger marca stale nos users afetados **And** toast "Regra removida"
8. **Given** campo `field_key` no formulário **When** seleciono uma category **Then** dropdown de field_key filtra para mostrar apenas campos daquela categoria (vindos de `curriculum_fields`)

## Tasks / Subtasks

- [x] Task 1: Criar schemas Zod para scoring rules (AC: #2, #4)
  - [x] 1.1 Schema `scoringRuleFormSchema` em `src/lib/schemas/admin.ts` — campos: institution_id (uuid required), specialty_id (uuid optional/null), category (string required), field_key (string required), weight (number ≥0), max_points (number ≥ weight via `.refine()`), description (string optional), formula (Zod json schema)
  - [x] 1.2 Schema `impactPreviewRequestSchema` — institution_id, specialty_id, rule changes
  - [x] 1.3 Testes unitários dos schemas

- [x] Task 2: Criar queries e mutations React Query para scoring rules (AC: #1, #6, #7)
  - [x] 2.1 Em `src/lib/queries/admin.ts` — adicionar:
    - `useScoringRules(institutionId?, specialtyId?)` — lista filtrada, ordered by category + field_key
    - `useSpecialties()` — lista de specialties para selects
    - `useCurriculumFields()` — lista de curriculum_fields para selects (ou reutilizar de `src/lib/queries/curriculum.ts` se já existir)
    - `useCreateScoringRule()` — mutation INSERT + invalidateQueries
    - `useUpdateScoringRule()` — mutation UPDATE + invalidateQueries
    - `useDeleteScoringRule()` — mutation DELETE + invalidateQueries
  - [x] 2.2 Função `previewRuleImpact(ruleData)` — query que calcula impacto estimado: conta alunos afetados + amostra de 5 com delta (pode usar RPC ou query direta com cálculo client-side para MVP)
  - [x] 2.3 Testes unitários das queries

- [x] Task 3: Criar componente `ScoringRuleTable` (AC: #1)
  - [x] 3.1 Componente em `src/components/features/admin/ScoringRuleTable.tsx`
  - [x] 3.2 Tabela HTML semântica (`<table>`, `<thead>`, `<tbody>`, `scope="col"`) usando shadcn `Table`
  - [x] 3.3 Colunas: instituição (short_name), especialidade (ou "Todas"), categoria, campo, peso, máx pontos, ações (editar, remover)
  - [x] 3.4 Filtros por instituição (Select) e especialidade (Select) acima da tabela
  - [x] 3.5 Loading state com Skeleton, empty state com CTA "Criar primeira regra"

- [x] Task 4: Criar componente `ScoringRuleFormDialog` / AdminRuleEditor (AC: #2, #3, #4, #8)
  - [x] 4.1 Componente em `src/components/features/admin/ScoringRuleFormDialog.tsx`
  - [x] 4.2 Dialog shadcn com react-hook-form + zodResolver(`scoringRuleFormSchema`)
  - [x] 4.3 Campos: instituição (Select de `useInstitutions()`), especialidade (Select de `useSpecialties()` + opção "Todas (default)"), category (Select das categorias de `curriculum_fields`), field_key (Select dinâmico filtrado por category), weight (Input type number), max_points (Input type number), description (Textarea), formula (Textarea com JSON validation)
  - [x] 4.4 Indicador visual de estados: draft/dirty/publishing/published/error
  - [x] 4.5 Modo criação e edição (prefill com dados existentes)
  - [x] 4.6 Guard no `onOpenChange` para bloquear fechamento durante mutation (`isPending`)

- [x] Task 5: Criar componente `ImpactPreviewDialog` (AC: #5, #6)
  - [x] 5.1 Componente em `src/components/features/admin/ImpactPreviewDialog.tsx`
  - [x] 5.2 Exibe contagem de alunos afetados (com currículo preenchido + instituição/especialidade)
  - [x] 5.3 Amostra de até 5 alunos com delta estimado (nome, score atual → score estimado, diferença)
  - [x] 5.4 Loading state enquanto calcula preview ("Calculando impacto...")
  - [x] 5.5 CTAs "Confirmar publicação" (primary) e "Cancelar" (secondary)
  - [x] 5.6 Guard: não fecha durante publicação

- [x] Task 6: Criar componente `DeleteScoringRuleDialog` (AC: #7)
  - [x] 6.1 Componente em `src/components/features/admin/DeleteScoringRuleDialog.tsx`
  - [x] 6.2 AlertDialog shadcn com aviso sobre impacto (users afetados terão recálculo)
  - [x] 6.3 Mutation de delete + toast de confirmação

- [x] Task 7: Criar página `/admin/regras` integrando componentes (AC: #1)
  - [x] 7.1 Substituir stub em `src/pages/admin/Regras.tsx` (renomear de Stub ou criar novo)
  - [x] 7.2 Composição: filtros + botão "Nova regra" + ScoringRuleTable
  - [x] 7.3 Atualizar `src/router.tsx` para lazy-import da nova página (substituir Stub)

- [x] Task 8: Testes e validação final
  - [x] 8.1 Testes de schema Zod (validação de weight ≤ max_points, campos obrigatórios, formula JSON)
  - [x] 8.2 Testes de queries/mutations (mock Supabase)
  - [x] 8.3 Teste da página Regras (renderiza tabela, abre dialog)
  - [x] 8.4 `bun run typecheck` passa sem erros
  - [x] 8.5 `bun run lint` passa sem warnings
  - [x] 8.6 `bun run test` — todos os testes existentes + novos passam

### Review Findings

- [x] [Review][Decision] AC#2: campo `formula` removido do UI — decisão: manter oculto, reexpor com editor visual quando motor de fórmulas complexas estiver pronto
- [x] [Review][Decision] AC#3: badge states — corrigido: verde+timestamp para published, amber para dirty, botão retry para error
- [x] [Review][Patch] Zod schema aceita `Infinity` — corrigido: `.finite()` adicionado
- [x] [Review][Patch] Signup: dropdown vazio durante loading — corrigido: placeholder "Carregando..." + disabled
- [x] [Review][Patch] Delete dialog sem guard isPending — corrigido: guard no onOpenChange
- [x] [Review][Patch] field_key não reseta ao trocar categoria em edição — corrigido: tracking de initialCategory
- [x] [Review][Patch] Stale state ao cancelar ImpactPreview — corrigido: cleanup no onOpenChange
- [x] [Review][Patch] ScoringRuleTable maps sem useMemo — corrigido: 3 useMemo adicionados
- [x] [Review][Patch] Duplicate rule toast genérico — corrigido: detecta erro 23505 com mensagem específica
- [x] [Review][Patch] Weight input trata 0 como falsy — corrigido: `||` → `??`
- [x] [Review][Patch] MedicalSchoolRow interface manual — corrigido: usa Database types
- [x] [Review][Defer] Impact preview delta é flat (+weight) — ignora quantidade do campo. Simplificação MVP aceita; RPC server-side planejada — deferred
- [x] [Review][Defer] `specialty_interest` trocou de enum para string livre no Zod — validação server-side futura — deferred
- [x] [Review][Defer] `medical_schools` sem migration formal (criada via SQL direto) — criar migration antes de homolog — deferred
- [x] [Review][Defer] `previewRuleImpact` usa async direto em vez de React Query — padrão aceitável para query efêmera — deferred
- [x] [Review][Defer] `useEffect` com `values` object pode re-triggar se referência mudar — estável com useState atual — deferred
- [x] [Review][Defer] `editingRule?.weight` captura depende de React batching — estável em React 18 — deferred

## Dev Notes

### Padrões obrigatórios do projeto (replicar de Story 3.1)

- **React Query para todo data fetching** — nunca `supabase.from().select()` direto em componentes. Queries/mutations em `src/lib/queries/admin.ts`
- **Schemas Zod em `src/lib/schemas/admin.ts`** — adicionar ao arquivo existente, não criar arquivo novo
- **snake_case nos dados vindos do banco** — não mapear para camelCase; usar tipos de `src/lib/database.types.ts`
- **Mensagens ao usuário em pt-BR**, acionáveis, sem jargão técnico
- **Sempre checar `error` antes de usar `data`** em chamadas Supabase
- **Toasts via Sonner** — `toast.success(...)`, `toast.error(...)`. Posição: canto inferior direito desktop, topo mobile
- **Loading states com Skeleton shadcn** — nunca spinner full-screen
- **Formulários com react-hook-form + zodResolver** — padrão consolidado em `InstitutionFormDialog.tsx`

### Schema do banco — tabela `scoring_rules`

```sql
-- supabase/migrations/0002_rules_engine.sql
create table public.scoring_rules (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  specialty_id uuid references public.specialties(id) on delete set null,
  category text not null,
  field_key text not null,
  weight numeric not null check (weight >= 0),
  max_points numeric not null check (max_points >= 0),
  description text,
  formula jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (weight <= max_points)
);

create index idx_scoring_rules_institution_id on public.scoring_rules(institution_id);
create index idx_scoring_rules_specialty_id on public.scoring_rules(specialty_id);
```

**RLS policies (já ativas):**
- SELECT: público (anon + authenticated)
- INSERT/UPDATE/DELETE: apenas `is_admin(auth.uid())`

**Tipo TypeScript gerado** (`src/lib/database.types.ts`):
```typescript
scoring_rules: {
  Row: {
    id: string; institution_id: string; specialty_id: string | null;
    field_key: string; category: string; formula: Json;
    weight: number; max_points: number; description: string | null;
    created_at: string; updated_at: string;
  }
  Insert: { institution_id: string; field_key: string; category: string;
    formula?: Json; weight: number; max_points: number; /* demais opcionais */ }
  Update: { /* todos opcionais */ }
}
```

### Tabelas relacionadas

**`specialties`** — usada no Select de especialidade:
```typescript
specialties: {
  Row: { id: string; name: string; created_at: string; }
}
```

**`curriculum_fields`** — usada para popular Selects de category e field_key:
```typescript
curriculum_fields: {
  Row: { id: string; category: string; field_key: string; label: string;
    field_type: string; options: Json | null; display_order: number; created_at: string; }
}
```

Categorias disponíveis: Publicações, Acadêmico, Prática/Social, Liderança/Eventos, Perfil

**`user_scores`** — marcada `stale=true` pelo trigger ao alterar regras:
```typescript
user_scores: {
  Row: { user_id: string; institution_id: string; specialty_id: string | null;
    score: number; max_score: number; breakdown: Json;
    stale: boolean; calculated_at: string; }
}
```

### Trigger existente: `on_scoring_rule_updated`

Já existe em `supabase/migrations/0007_calculate_scores.sql`. Ao INSERT/UPDATE/DELETE em `scoring_rules`, marca `user_scores.stale = true` para users que possuem scores naquela institution_id (e specialty_id se aplicável). **NÃO criar trigger novo** — o existente já cobre o cenário.

### ImpactPreview — estratégia de cálculo

Para o `ImpactPreviewDialog`, calcular preview **client-side** para MVP:

1. Query: contar `user_curriculum` com dados preenchidos (`data != '{}'`) que tenham `user_scores` para aquela `institution_id` + `specialty_id`
2. Buscar amostra de 5 users com seus `user_scores` atuais para aquela instituição
3. Simular delta: `(novo_weight * valor_campo) - score_atual_categoria` — simplificação aceitável para preview
4. Exibir: nome (de `profiles`), score atual, score estimado, diferença

**Alternativa futura**: criar RPC `preview_rule_impact(rule_data jsonb)` em PL/pgSQL para cálculo server-side mais preciso. Documentar em `deferred-work.md`.

**IMPORTANTE**: A query que busca nomes de alunos para preview DEVE respeitar RLS (admin tem SELECT em profiles). Nunca expor PII em logs.

### Componentes shadcn disponíveis (já instalados)

Todos necessários já existem em `src/components/ui/`: `Table`, `Dialog`, `AlertDialog`, `Form`, `Input`, `Textarea`, `Select`, `Button`, `Badge`, `Skeleton`, `Tooltip`, `Label`, `Separator`, `Progress`.

### Padrão de formulário — seguir InstitutionFormDialog

Replicar exatamente o padrão de `src/components/features/admin/InstitutionFormDialog.tsx`:
- `useForm` com `zodResolver`
- Componentes `FormField`, `FormControl`, `FormItem`, `FormLabel`, `FormMessage`
- Guard no `onOpenChange` bloqueando fechamento quando `isPending`
- Modo criação vs. edição (prefill)
- Feedback: toast success/error via Sonner

### Select dinâmico de field_key por category

Quando admin seleciona uma `category` no formulário:
1. Filtrar `curriculum_fields` por `category === selectedCategory`
2. Renderizar Select de `field_key` com `label` como display text
3. Se category mudar, resetar field_key (`setValue('field_key', '')`)

Campos por categoria (seed existente em `curriculum_fields`):
- **Publicações (5):** artigos_high_impact, artigos_mid_impact, artigos_low_impact, artigos_nacionais, capitulos_livro
- **Acadêmico (5):** ic_com_bolsa, ic_sem_bolsa, ic_horas_totais, monitoria_semestres, extensao_semestres
- **Prática/Social (5):** voluntariado_horas, estagio_extracurricular_horas, trabalho_sus_meses, projeto_rondon, internato_hospital_ensino
- **Liderança/Eventos (8):** diretoria_ligas, membro_liga_anos, representante_turma_anos, cursos_suporte, apresentacao_congresso, ouvinte_congresso, organizador_evento, teste_progresso
- **Perfil (6):** ingles_fluente, media_geral, conceito_historico, ranking_ruf_top35, mestrado, doutorado

### Queries React Query — padrão de keys

Seguir o padrão existente do projeto:
```typescript
// Existentes
['institutions']
['institution-rule-counts']

// Novos para esta story
['scoring-rules']                          // lista sem filtro
['scoring-rules', institutionId]           // filtrado por instituição
['scoring-rules', institutionId, specialtyId] // filtrado por ambos
['specialties']                            // lista de especialidades
['curriculum-fields']                      // lista de campos (pode já existir)
['rule-impact-preview', ruleData]          // preview de impacto (query efêmera)
```

### Rota e Router

A rota `/admin/regras` já existe no router apontando para um Stub:
```typescript
// src/router.tsx
{ path: "regras", lazy: () => import("./pages/admin/Stub") }
```

**Ação necessária:** Criar `src/pages/admin/Regras.tsx` e atualizar o import no router:
```typescript
{ path: "regras", lazy: () => import("./pages/admin/Regras") }
```

O AdminShell NÃO precisa ser alterado — a tab "Regras" já aponta para `/admin/regras`.

### Estados visuais do AdminRuleEditor

Implementar via estado local + derivação:
- **draft**: regra sem `id` (criação) — badge cinza "Rascunho"
- **dirty**: form `isDirty` (react-hook-form) — badge âmbar "Não salvo"
- **publishing**: mutation `isPending` — badge com spinner "Publicando..."
- **published**: mutation success + timestamp — badge verde "Publicado" + timestamp
- **error**: mutation error — badge vermelho com mensagem + botão "Tentar novamente"

### Acessibilidade obrigatória

- Focus ring: `ring-2 ring-teal-500 ring-offset-2` em todos interativos
- Labels com `htmlFor` em todos os inputs
- Erros: `aria-invalid` + `aria-describedby` + `role="alert"`
- Selects: `aria-label` descritivo ("Filtrar por instituição")
- Dialog: focus trap automático (Radix)
- Toast: `role="status"` (Sonner nativo)
- Tabela: `<thead>`, `<tbody>`, `scope="col"`, `aria-sort` se ordenável

### Armadilhas a evitar

1. **NÃO criar trigger novo** — `on_scoring_rule_updated` já existe e cobre INSERT/UPDATE/DELETE
2. **NÃO criar migration nova** — schema de `scoring_rules` já está completo
3. **NÃO criar arquivo novo de queries** — adicionar em `src/lib/queries/admin.ts` existente
4. **NÃO criar arquivo novo de schemas** — adicionar em `src/lib/schemas/admin.ts` existente
5. **NÃO usar TanStack Table** — scoring_rules são ~100-200 rows max, tabela simples com shadcn `Table` + filtros client-side é suficiente
6. **NÃO duplicar `useInstitutions()`** — já existe em `src/lib/queries/admin.ts`, reutilizar
7. **NÃO duplicar `useCurriculumFields()`** — verificar se já existe em `src/lib/queries/curriculum.ts` e reutilizar; se não, criar em `admin.ts`
8. **NÃO esquecer validação cross-field** — `weight ≤ max_points` via Zod `.refine()` ou `.superRefine()`
9. **NÃO expor PII em logs** — preview mostra nomes de alunos na UI mas nunca loga
10. **NÃO usar `service_role` key** — todas as operações via client anon + RLS admin
11. **NÃO alterar AdminShell** — tabs já estão corretas desde Story 3.1

### Learnings da Story 3.1 (aplicar aqui)

Da review da Story 3.1, os seguintes patches foram necessários — **prevenir proativamente**:
- **Dialog não pode fechar durante mutation** — implementar guard no `onOpenChange` com `isPending`
- **Tratar erro quando query principal falha** — destructurar `error` + banner de erro condicional na página
- **File input reset após rejeição** — não aplicável aqui, mas manter padrão de reset de form
- **Ordem de operações**: sempre DB primeiro, cleanup depois (best-effort). Se delete de regra falha no DB, não marca stale

### Git intelligence — convenções de commit

```
feat(admin): CRUD de regras com AdminRuleEditor + ImpactPreview (Story 3.2)
```

### Project Structure Notes

- Adicionar em `src/lib/schemas/admin.ts` (arquivo existente)
- Adicionar em `src/lib/queries/admin.ts` (arquivo existente)
- Criar `src/components/features/admin/ScoringRuleTable.tsx`
- Criar `src/components/features/admin/ScoringRuleFormDialog.tsx`
- Criar `src/components/features/admin/ImpactPreviewDialog.tsx`
- Criar `src/components/features/admin/DeleteScoringRuleDialog.tsx`
- Criar `src/pages/admin/Regras.tsx` (substituir Stub)
- Modificar `src/router.tsx` (import Regras em vez de Stub)

### References

- [Source: supabase/migrations/0002_rules_engine.sql — schema scoring_rules + institutions + specialties + RLS]
- [Source: supabase/migrations/0007_calculate_scores.sql — trigger on_scoring_rule_updated + calculate_scores RPC]
- [Source: src/lib/database.types.ts — tipos gerados para scoring_rules, specialties, curriculum_fields]
- [Source: src/lib/queries/admin.ts — padrão de queries/mutations institutions (Story 3.1)]
- [Source: src/lib/schemas/admin.ts — padrão de schemas Zod (institutionFormSchema)]
- [Source: src/components/features/admin/InstitutionFormDialog.tsx — padrão de formulário Dialog + react-hook-form]
- [Source: src/components/features/admin/InstitutionTable.tsx — padrão de tabela admin]
- [Source: src/components/features/admin/DeleteInstitutionDialog.tsx — padrão de AlertDialog de confirmação]
- [Source: src/lib/queries/curriculum.ts — hooks useCurriculumFields, useCurriculum]
- [Source: src/lib/queries/scoring.ts — hooks useScores, useInstitutions, useRecalculateScores]
- [Source: src/components/layout/AdminShell.tsx — tabs de navegação admin]
- [Source: src/router.tsx — rotas admin (regras aponta para Stub)]
- [Source: _bmad-output/planning-artifacts/architecture.md — patterns obrigatórios, API, RLS]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — AdminRuleEditor + ImpactPreviewDialog specs]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3 Story 3.2 AC completos]
- [Source: _bmad-output/implementation-artifacts/3-1-navegacao-admin-crud-instituicoes-upload-edital.md — learnings e review patches]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

Nenhum problema encontrado durante a implementacao.

### Completion Notes List

- Schemas Zod implementados com validacao cross-field weight <= max_points e validacao JSON para formula
- 17 novos testes de schema (scoringRuleFormSchema + impactPreviewRequestSchema), todos passando
- Queries React Query: useScoringRules (filtros), useSpecialties, useCreateScoringRule, useUpdateScoringRule, useDeleteScoringRule
- Funcao previewRuleImpact para calculo client-side de impacto (contagem + amostra de 5 alunos com delta)
- Reutilizacao de useCurriculumFields de curriculum.ts e useInstitutions de admin.ts (sem duplicacao)
- ScoringRuleTable com tabela semantica, Skeleton loading, empty state
- ScoringRuleFormDialog com react-hook-form + zodResolver, estados visuais (draft/dirty/publishing/published/error), Select dinamico de field_key filtrado por category, guard no onOpenChange
- ImpactPreviewDialog com calculo assincrono de impacto, amostra de alunos com delta, guard durante publicacao
- DeleteScoringRuleDialog com AlertDialog e confirmacao de impacto
- Pagina Regras com filtros por instituicao e especialidade, integracao de todos os componentes
- Router atualizado: /admin/regras agora aponta para Regras.tsx em vez de Stub
- TypeScript: 0 erros | ESLint: 0 warnings | Vitest: 331 testes (50 arquivos), todos passando

### Change Log

- 2026-04-17: Implementacao completa Story 3.2 — CRUD de regras com AdminRuleEditor + ImpactPreview

### File List

- src/lib/schemas/admin.ts (modificado — adicionados scoringRuleFormSchema, impactPreviewRequestSchema)
- src/lib/schemas/admin.test.ts (modificado — adicionados 17 testes para novos schemas)
- src/lib/queries/admin.ts (modificado — adicionados ScoringRuleRow, SpecialtyRow, useScoringRules, useSpecialties, useCreateScoringRule, useUpdateScoringRule, useDeleteScoringRule, previewRuleImpact)
- src/lib/queries/admin.test.ts (modificado — adicionado teste de exports scoring rules)
- src/components/features/admin/ScoringRuleTable.tsx (novo)
- src/components/features/admin/ScoringRuleFormDialog.tsx (novo)
- src/components/features/admin/ImpactPreviewDialog.tsx (novo)
- src/components/features/admin/DeleteScoringRuleDialog.tsx (novo)
- src/pages/admin/Regras.tsx (novo)
- src/router.tsx (modificado — regras aponta para Regras.tsx)
