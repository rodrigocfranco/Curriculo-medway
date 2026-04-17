# Story 4.1: Página de leads completa — tabela + filtros + métricas + drawer

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **admin (Rcfranco) do curriculo-medway**,
I want **ver métricas de captação em cards resumo, listar leads com filtros server-side e paginação via TanStack DataTable, persistir estado de filtros na URL, e abrir detalhes do lead num drawer lateral sem sair da tabela**,
so that **acompanho o funil de captação de forma eficiente, segmento leads por período/UF/especialidade/status, compartilho URLs filtradas com contexto preservado, e navego entre visão geral e detalhe sem perder posição na listagem**.

## Acceptance Criteria

Baseados em [epics.md#Story 4.1](../planning-artifacts/epics.md) — seção "Story 4.1: Página de leads completa". **Nenhum AC pode ser cortado.**

### AC1 — Cards de métricas no header da página

**Given** rota `/admin/leads`
**When** acesso como admin autenticado
**Then** header exibe 4 cards de métricas:
- Total de leads (count de `profiles` onde `role='student'`)
- Últimos 7 dias (filtro `created_at >= now() - interval '7 days'`)
- Últimos 30 dias (filtro `created_at >= now() - interval '30 days'`)
- Leads com currículo preenchido vs. só cadastro (join com `user_curriculum` — preenchido = `data` tem ao menos 1 campo com valor não-null/não-vazio)
**And** dados vêm de queries agregadas usando Supabase client (não Edge Function)
**And** cards usam layout horizontal responsivo (4 colunas xl+, 2 colunas md, 1 coluna mobile)
**And** cada card usa componente `Card` do shadcn com densidade admin (`p-3`/`p-4`)
**And** loading exibe `Skeleton` shadcn com dimensões finais (nunca spinner full-screen)

### AC2 — LeadTable com TanStack DataTable + paginação server-side

**Given** abaixo dos cards de métricas
**When** renderiza
**Then** `LeadTable` exibe colunas: nome, email, telefone, estado, faculdade, ano de formação, especialidade, data de cadastro
**And** paginação server-side com 50 registros por página default
**And** ordenação por colunas clicáveis com `aria-sort` (default: `created_at desc`)
**And** HTML semântico: `<table>`, `<thead>`, `<tbody>`, `scope="col"` em headers
**And** tabular numerals (`font-feature-settings: 'tnum'`) em datas e números

**Given** 10k+ registros
**When** navego entre páginas
**Then** cada troca carrega em <2s
**And** indicador de loading discreto (skeleton das linhas, não spinner)

### AC3 — Filtros como chips removíveis + persistência URL

**Given** área de filtros acima da tabela
**When** aplico filtros (período date-range, UF select, especialidade select, status currículo select)
**Then** cada filtro ativo vira chip removível (`Badge` com `x`)
**And** estado persistido em URL params (ex: `/admin/leads?state=SP&specialty=dermato&from=2026-03-01&to=2026-03-31&curriculum=filled`)
**And** compartilhar URL restaura todos os filtros
**And** mudanças de params usam `useSearchParams` do React Router — sem full reload

**Given** removo um chip
**When** clico no `x`
**Then** filtro correspondente é removido da URL e da query
**And** tabela re-fetcha com filtros atualizados

**Given** clico "Limpar filtros"
**When** há filtros ativos
**Then** todos os chips são removidos, URL volta a `/admin/leads`, tabela mostra todos os leads

### AC4 — Drawer lateral de detalhe do lead

**Given** clico numa linha da tabela
**When** abre
**Then** `Sheet` lateral (lado direito) mostra:
- Todos os campos de `profiles` (nome, email, telefone, estado, faculdade, ano formação, especialidade, role, created_at, updated_at)
- Resumo do currículo (dados de `user_curriculum.data` agrupados por categoria, mostrando campos preenchidos vs. vazios)
- Top-3 scores (de `user_scores` ordenados `score desc`, mostrando instituição + score + max_score)
- Data de criação e última atualização

**And** fecha via ESC, clique fora, ou botão fechar
**And** foco retorna à linha clicada após fechar (acessibilidade)
**And** `Sheet` usa z-index acima de todo o conteúdo (padrão Radix)

### AC5 — Guard admin + acessibilidade

**Given** rota `/admin/leads` protegida via `ProtectedRoute role="admin"`
**When** user não-admin tenta acessar
**Then** é redirecionado para `/app` com toast "Acesso restrito"

**Given** viewport < 768px
**When** acesso `/admin/leads`
**Then** vejo aviso não-bloqueante "Painel admin otimizado para desktop" (herdado do `AdminShell`)

**Given** toda a página
**When** valido acessibilidade
**Then** tabela com `thead`/`tbody`/`scope`/`aria-sort`; focus ring `ring-2 ring-teal-500 ring-offset-2` em todos interativos; chips removíveis via teclado; Sheet com focus trap Radix

## Tasks / Subtasks

- [x] Task 1 — Instalar `@tanstack/react-table` (AC: #2)
  - [x] 1.1 `bun add @tanstack/react-table`
  - [x] 1.2 Verificar compatibilidade com React 18 e versão TanStack Query existente (v5.83.0)

- [x] Task 2 — Schema Zod + tipos para leads (AC: #2, #3, #4)
  - [x] 2.1 Criar `src/lib/schemas/leads.ts` com schema de filtros (`leadsFilterSchema`) e tipo do lead
  - [x] 2.2 Exportar `LeadsFilterValues = z.infer<typeof leadsFilterSchema>`

- [x] Task 3 — Queries React Query para leads (AC: #1, #2, #3, #4)
  - [x] 3.1 Criar `src/lib/queries/leads.ts`
  - [x] 3.2 Hook `useLeadMetrics()` — queries agregadas para os 4 cards (key: `['lead-metrics']`)
  - [x] 3.3 Hook `useLeads(filters, pagination, sorting)` — query paginada server-side com filtros (key: `['leads', filters, page, sorting]`)
  - [x] 3.4 Hook `useLeadDetail(userId)` — perfil + currículo + top-3 scores (key: `['lead-detail', userId]`)
  - [x] 3.5 Funções auxiliares de fetch com Supabase client (count, range, order, filters)

- [x] Task 4 — Hook de filtros com URL params (AC: #3)
  - [x] 4.1 Criar `src/hooks/use-lead-filters.ts`
  - [x] 4.2 Sync bidirecional entre estado local e `useSearchParams`
  - [x] 4.3 Parsear/serializar filtros (date-range, arrays, strings)

- [x] Task 5 — Componente LeadMetricsCards (AC: #1)
  - [x] 5.1 Criar `src/components/features/admin/LeadMetricsCards.tsx`
  - [x] 5.2 4 cards com `Card` shadcn + skeleton loading
  - [x] 5.3 Layout responsivo (4 col xl / 2 col md / 1 col mobile)

- [x] Task 6 — Componente LeadFilters + chips (AC: #3)
  - [x] 6.1 Criar `src/components/features/admin/LeadFilters.tsx`
  - [x] 6.2 Filtros: período (date range input), UF (Select), especialidade (Select), status currículo (Select)
  - [x] 6.3 Chips removíveis (`Badge` variant outline + botão `x`)
  - [x] 6.4 Botão "Limpar filtros" quando há filtros ativos

- [x] Task 7 — Componente LeadTable com DataTable (AC: #2)
  - [x] 7.1 Criar `src/components/features/admin/LeadTable.tsx` usando `@tanstack/react-table` + `Table` shadcn
  - [x] 7.2 Definir colunas com `ColumnDef[]` (nome, email, telefone, estado, faculdade, ano, especialidade, data cadastro)
  - [x] 7.3 Paginação server-side (controle manual de `pageIndex`/`pageSize` via `manualPagination: true`)
  - [x] 7.4 Ordenação server-side (`manualSorting: true`, default `created_at desc`)
  - [x] 7.5 Row click handler → abre drawer
  - [x] 7.6 Skeleton loading nas linhas durante fetch
  - [x] 7.7 `aria-sort`, `scope="col"`, HTML semântico

- [x] Task 8 — Componente LeadDetailDrawer (AC: #4)
  - [x] 8.1 Criar `src/components/features/admin/LeadDetailDrawer.tsx` usando `Sheet` shadcn (side="right")
  - [x] 8.2 Seção perfil completo (todos campos de `profiles`)
  - [x] 8.3 Seção resumo currículo (agrupado por categoria)
  - [x] 8.4 Seção top-3 scores (com barra de progresso)
  - [x] 8.5 Loading state com Skeleton
  - [x] 8.6 Gestão de foco: retornar à linha clicada ao fechar

- [x] Task 9 — Página `/admin/leads` (AC: #1–#5)
  - [x] 9.1 Criar/substituir `src/pages/admin/Leads.tsx` (substituir `LeadsStub`)
  - [x] 9.2 Compor: LeadMetricsCards + LeadFilters + LeadTable + LeadDetailDrawer
  - [x] 9.3 Atualizar router em `src/router.tsx` (lazy import para nova página)
  - [x] 9.4 Remover `LeadsStub` de `src/pages/admin/Stub.tsx`

- [x] Task 10 — Testes (AC: todos)
  - [x] 10.1 Testes unitários do schema Zod de filtros
  - [x] 10.2 Testes dos hooks de query (mock Supabase)
  - [x] 10.3 Teste de renderização da página com dados mock
  - [x] 10.4 Teste de acessibilidade (aria-sort, scope, focus management)

- [x] Task 11 — Verificação final
  - [x] 11.1 `bun run lint` passa
  - [x] 11.2 `bunx tsc --noEmit` passa
  - [x] 11.3 `bun run test` passa (todos os testes, inclusive os novos)
  - [x] 11.4 `bun run build` passa
  - [ ] 11.5 Testar manualmente no browser: métricas, filtros, paginação, drawer, URL params

### Review Findings

#### Decision Needed (resolvidos)

- [x] [Review][Decision→Patch] **RLS: admin não tem SELECT em `user_curriculum` e `user_scores`** — Confirmado: migrations só têm `select_own`. Criar migration com policies admin SELECT. (blind+edge+auditor)

- [x] [Review][Decision→Dismiss] **Métrica "Com currículo" conta todas as rows de `user_curriculum`** — Decisão do PO: "com currículo" = tem linha em `user_curriculum`, independente do conteúdo de `data`. Currículo com campos zerados é válido. Lógica atual está **correta**. Spec AC1 precisa de correção textual. (blind+auditor)

- [x] [Review][Decision→Patch] **Paginação não persistida na URL** — Decisão: sincronizar page com URL params para compartilhamento completo. (auditor)

#### Patch (todos aplicados)

- [x] [Review][Patch] **Unsafe `as` cast no filtro `curriculum`** — validação inline `raw === "filled" || raw === "empty"`. [src/hooks/use-lead-filters.ts] (blind+edge)
- [x] [Review][Patch] **`as never` casts em `onPaginationChange`/`onSortingChange`** — tipados como `OnChangeFn<T>`. [src/components/features/admin/LeadTable.tsx] (blind+edge)
- [x] [Review][Patch] **Select não permite limpar valor individual** — adicionado `<SelectItem value="__all__">Todos</SelectItem>` nos 3 selects. [src/components/features/admin/LeadFilters.tsx] (blind+edge+auditor)
- [x] [Review][Patch] **Focus ring `ring-inset` → `ring-offset-2`** — corrigido per AC5. [src/components/features/admin/LeadTable.tsx] (auditor)
- [x] [Review][Patch] **Filtros de data sem validação de formato** — adicionada regex `YYYY-MM-DD` no hook. [src/hooks/use-lead-filters.ts] (blind+edge)
- [x] [Review][Patch] **Range `from > to` sem aviso** — adicionado `dateRangeInvalid` + warning visual. [src/components/features/admin/LeadFilters.tsx] (edge)
- [x] [Review][Patch] **`setFilter` key `string` genérico** — tipado como `FilterKey`. [src/hooks/use-lead-filters.ts] (blind)
- [x] [Review][Patch] **Dead code `focusRow` + `rowRefs`** — removido. [src/components/features/admin/LeadTable.tsx] (edge+auditor)
- [x] [Review][Patch] **`CSS.escape` no selector `data-lead-id`** — aplicado. [src/pages/admin/Leads.tsx] (blind+edge)
- [x] [Review][Patch] **RLS admin SELECT em `user_curriculum`/`user_scores`** — nova migration 0005. [supabase/migrations/0005_admin_select_curriculum_scores.sql] (blind+edge+auditor)
- [x] [Review][Patch] **Paginação sincronizada com URL** — `page` param via `useLeadFilters`. [src/hooks/use-lead-filters.ts, src/pages/admin/Leads.tsx] (auditor)

#### Defer

- [x] [Review][Defer] **PK de `user_scores` inclui `specialty_id` nullable** — PostgreSQL trata NULLs como distintos em PK, funciona mas é não-convencional. Pré-existente (migration 0003). [supabase/migrations/0003_curriculum_scores.sql:55] — deferred, pre-existing

## Dev Notes

### Padrões Estabelecidos no Projeto (OBRIGATÓRIO seguir)

**React Query (v5.83.0):**
- Query keys tipadas como arrays: `['leads', filters, page]`, `['lead-metrics']`, `['lead-detail', userId]`
- Custom Error subclasses quando necessário (ver `src/lib/queries/auth.ts` como referência)
- `staleTime` padrão: `60_000` (definido no QueryClient em `App.tsx`); dados de métricas podem usar `staleTime: 5 * 60 * 1000`
- Mutations usam `invalidateQueries` em `onSuccess`
- Pattern: `useMutation<SuccessData, ErrorType, InputData>` / `useQuery<DataType, ErrorType>`

**Schemas Zod (v3.25.76):**
- 1 arquivo por domínio em `src/lib/schemas/`
- Exportar tipo inferido: `export type X = z.infer<typeof xSchema>`
- Campo snake_case para espelhar Postgres
- Arquivo de referência: `src/lib/schemas/signup.ts`

**Supabase Client:**
- Singleton tipado em `src/lib/supabase.ts`: `export const supabase: SupabaseClient<Database>`
- Queries usam o client diretamente: `supabase.from('profiles').select(...)`
- Nunca criar novo client — sempre importar `supabase` de `src/lib/supabase.ts`
- Tipos gerados em `src/lib/database.types.ts`

**Componentes UI:**
- shadcn/ui em `src/components/ui/` — **NUNCA editar**. Apenas usar/compor.
- Feature components em `src/components/features/admin/` (criar esta pasta — não existe ainda)
- Páginas em `src/pages/admin/`
- Utility `cn()` de `src/lib/utils.ts` para class composition
- `react-hook-form` + `zodResolver` para formulários (ver `LoginForm.tsx` como referência)

**Roteamento:**
- React Router v6.30.1 com `vite-react-ssg`
- Lazy loading: `.lazy(() => import("...").then(m => ({ Component: m.default })))`
- Rota `/admin/leads` já registrada em `src/router.tsx` apontando para stub
- `AdminShell` já tem tab "Leads" definida em `ADMIN_TABS`

**Estilo Admin (densidade compacta):**
- Padding: `p-3` / `p-4` (nunca `p-6` no admin)
- Bordas `border-neutral-200` substituem sombras em contexto admin
- Tipografia: `text-sm` para labels/dados de tabela, `text-xs` para metadata
- Tabular numerals: `tabular-nums` (classe Tailwind) em datas e contadores
- Cores: navy.900 para texto/headers, teal.500/600 para accent/interação, neutros para bordas/fundos

### Dependências a Instalar

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `@tanstack/react-table` | latest (^8.x) | DataTable com sorting/pagination/filtering server-side |

**Já instaladas e disponíveis:**
- `@tanstack/react-query` v5.83.0 (data fetching)
- `@supabase/supabase-js` (client)
- `zod` v3.25.76 (validação)
- `react-hook-form` + `@hookform/resolvers` (forms)
- `react-router-dom` v6.30.1 (routing + `useSearchParams`)
- `lucide-react` (ícones)
- shadcn/ui components: Table, Sheet, Badge, Card, Select, Skeleton, Tabs, Button, etc.

### Componentes shadcn Já Disponíveis (NÃO criar novos)

- `Table` / `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell` → usar como base do DataTable
- `Sheet` / `SheetContent` / `SheetHeader` / `SheetTitle` → drawer lateral
- `Badge` → chips de filtro (variant="outline" + botão x)
- `Card` / `CardHeader` / `CardTitle` / `CardContent` → cards de métricas
- `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` → filtros
- `Skeleton` → loading states
- `Button` → ações (limpar filtros, exportar, navegação)
- `ScrollArea` → scroll horizontal em tabelas se necessário em telas menores

### Queries Supabase — Guia de Implementação

**Métricas (useLeadMetrics):**
```
// Total
supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')

// Últimos 7d / 30d
supabase.from('profiles').select('*', { count: 'exact', head: true })
  .eq('role', 'student').gte('created_at', sevenDaysAgo)

// Com currículo
supabase.from('profiles').select('id, user_curriculum(data)', { count: 'exact' })
  .eq('role', 'student').not('user_curriculum', 'is', null)
```

**Lista paginada (useLeads):**
```
let query = supabase.from('profiles')
  .select('id, name, email, phone, state, university, graduation_year, specialty_interest, created_at', { count: 'exact' })
  .eq('role', 'student')
  .order(sortColumn, { ascending: sortAsc })
  .range(page * pageSize, (page + 1) * pageSize - 1)

// Aplicar filtros condicionalmente
if (filters.state) query = query.eq('state', filters.state)
if (filters.specialty) query = query.eq('specialty_interest', filters.specialty)
if (filters.from) query = query.gte('created_at', filters.from)
if (filters.to) query = query.lte('created_at', filters.to)
```

**Detalhe do lead (useLeadDetail):**
```
// Perfil
supabase.from('profiles').select('*').eq('id', userId).single()

// Currículo
supabase.from('user_curriculum').select('data, updated_at').eq('user_id', userId).maybeSingle()

// Top 3 scores
supabase.from('user_scores')
  .select('score, max_score, institution:institutions(name, short_name)')
  .eq('user_id', userId).order('score', { ascending: false }).limit(3)
```

### RLS — Já Configurado (não precisa de migration)

- `profiles`: admin pode SELECT todos os registros (policy existente da Story 1.3)
- `user_curriculum`: admin pode SELECT (policy existente da Story 1.10)
- `user_scores`: admin pode SELECT (policy existente da Story 1.10)
- **Verificar:** se as policies de admin SELECT estão ativas. Se não, criar migration pontual.

### TanStack React Table — Padrão de Uso

```tsx
// Configuração do table instance
const table = useReactTable({
  data: leads ?? [],
  columns,
  pageCount: Math.ceil((totalCount ?? 0) / pageSize),
  state: { pagination: { pageIndex, pageSize }, sorting },
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
  manualPagination: true,   // server-side
  manualSorting: true,       // server-side
  getCoreRowModel: getCoreRowModel(),
})
```

Renderizar usando os componentes `Table` do shadcn como wrapper visual.

### Filtros com URL Params — Padrão

```tsx
const [searchParams, setSearchParams] = useSearchParams()

// Ler filtros da URL
const filters = useMemo(() => ({
  state: searchParams.get('state') ?? undefined,
  specialty: searchParams.get('specialty') ?? undefined,
  from: searchParams.get('from') ?? undefined,
  to: searchParams.get('to') ?? undefined,
  curriculum: searchParams.get('curriculum') ?? undefined,
}), [searchParams])

// Atualizar URL ao mudar filtro
const setFilter = (key: string, value: string | undefined) => {
  setSearchParams(prev => {
    if (value) prev.set(key, value)
    else prev.delete(key)
    prev.delete('page') // reset paginação ao filtrar
    return prev
  }, { replace: true })
}
```

### Estrutura de Arquivos Esperada

```
src/
├── lib/
│   ├── schemas/
│   │   └── leads.ts                          # Zod schemas para filtros
│   └── queries/
│       └── leads.ts                          # React Query hooks
├── hooks/
│   └── use-lead-filters.ts                   # Hook de filtros ↔ URL params
├── components/
│   └── features/
│       └── admin/
│           ├── LeadMetricsCards.tsx           # Cards de métricas
│           ├── LeadFilters.tsx               # Filtros + chips removíveis
│           ├── LeadTable.tsx                 # DataTable TanStack
│           └── LeadDetailDrawer.tsx          # Sheet lateral de detalhe
└── pages/
    └── admin/
        └── Leads.tsx                         # Página principal (substitui stub)
```

### Anti-Patterns a Evitar

1. **NÃO criar DataTable genérico reutilizável** — construir direto para leads; abstração prematura desperdiça tempo
2. **NÃO fazer filtros client-side** — com 10k+ registros, DEVE ser server-side via Supabase query
3. **NÃO usar `supabase.rpc()` para queries simples** — usar `.from().select()` com filtros
4. **NÃO armazenar estado de filtros em useState separado da URL** — URL é a fonte de verdade
5. **NÃO adicionar botões de export CSV/Hubspot nesta story** — isso é Story 4.2
6. **NÃO criar migrations** — schema já existe; se faltar policy de admin SELECT, criar migration pontual mínima
7. **NÃO editar componentes em `src/components/ui/`** — são intocáveis (shadcn pristine)
8. **NÃO usar spinner full-screen** — sempre skeleton com dimensões finais
9. **NÃO usar vermelho para métricas ou dados** — vermelho é exclusivo para `danger` (erros técnicos e exclusão)

### Acessibilidade (WCAG 2.1 AA)

- Tabela: `<thead>`, `<tbody>`, `<th scope="col">`, `aria-sort="ascending|descending|none"`
- Focus ring: `ring-2 ring-teal-500 ring-offset-2` em todos os interativos
- Chips removíveis: `aria-label="Remover filtro: SP"`, acionáveis via teclado (Enter/Space)
- Sheet: focus trap automático via Radix; `aria-labelledby` no título
- Foco ao fechar drawer: retornar à linha clicada (usar `ref` na row ou ID)
- Touch targets: min 44px em todos os botões/links
- Skeleton com `aria-busy="true"` no container durante loading

### Performance (NFRs)

- **NFR2:** Área autenticada carrega em <3s
- Paginação server-side: 50 registros por request (não carregar tudo)
- `staleTime` adequado para métricas (5 min) e lista (1 min)
- Queries de métricas usam `{ count: 'exact', head: true }` — não trazem dados, só contagem

### Project Structure Notes

- Alinhado com estrutura unificada: features em `src/components/features/admin/`, queries em `src/lib/queries/`, schemas em `src/lib/schemas/`
- `AdminShell` já tem tab "Leads" com rota `/admin/leads` configurada — apenas substituir o stub
- Router em `src/router.tsx` já tem lazy import para a rota — apontar para novo componente `Leads.tsx`

### References

- [Source: epics.md#Epic 4, Story 4.1](../planning-artifacts/epics.md)
- [Source: ux-design-specification.md — LeadTable, Journey 5, admin density](../planning-artifacts/ux-design-specification.md)
- [Source: src/lib/queries/auth.ts — padrão React Query](../../src/lib/queries/auth.ts)
- [Source: src/lib/schemas/signup.ts — padrão Zod](../../src/lib/schemas/signup.ts)
- [Source: src/components/layout/AdminShell.tsx — ADMIN_TABS + layout](../../src/components/layout/AdminShell.tsx)
- [Source: src/pages/admin/Stub.tsx — LeadsStub a substituir](../../src/pages/admin/Stub.tsx)
- [Source: src/router.tsx — lazy routes](../../src/router.tsx)
- [Source: src/lib/supabase.ts — client singleton](../../src/lib/supabase.ts)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript check: 0 errors
- ESLint: 0 errors (7 warnings pre-existentes em shadcn/ui)
- Tests: 37 files, 215 tests passed
- Build (vite build): OK (SSG phase fails pre-existente por falta de env vars — não é regressão)

### Completion Notes List

- Instalado `@tanstack/react-table` v8.21.3 — compatível com React 18 e TanStack Query v5
- Schema Zod `leadsFilterSchema` com tipos `LeadRow`, `LeadDetail`, `LeadCurriculum`, `LeadScore`, `LeadMetrics`
- 3 hooks React Query: `useLeadMetrics` (staleTime 5min), `useLeads` (server-side pagination+sorting+filters), `useLeadDetail`
- Hook `useLeadFilters` com sync bidirecional URL params ↔ filtros, chips removíveis, clearFilters
- `LeadMetricsCards`: 4 cards com Card shadcn, skeleton loading, layout responsivo grid 1/2/4 colunas
- `LeadFilters`: date range inputs, Select (UF, especialidade, currículo), chips Badge removíveis com aria-label, botão limpar filtros
- `LeadTable`: TanStack DataTable com manualPagination + manualSorting, 8 colunas, skeleton loading, aria-sort, scope="col", rows clicáveis com focus ring teal-500, paginação com controles prev/next
- `LeadDetailDrawer`: Sheet lateral (side=right) com perfil completo, currículo agrupado por categoria (preenchidos/vazios), top-3 scores com Progress bar
- Página `Leads.tsx` compõe todos os componentes, gerencia estado de pagination/sorting/selectedLead, retorna foco à linha ao fechar drawer via `data-lead-id` + `requestAnimationFrame`
- Router atualizado: `/admin/leads` aponta para novo `Leads.tsx` (lazy import)
- `LeadsStub` removido de `Stub.tsx`
- Testes: 5 testes schema, 4 testes hooks query, 7 testes renderização página + acessibilidade (aria-sort, scope, role=button, tabindex)
- Task 11.5 (teste manual no browser) requer ambiente com Supabase — pendente para revisão humana

### Change Log

- 2026-04-16: Implementação completa da Story 4.1 — página de leads admin com métricas, filtros, DataTable, drawer

### File List

- `src/lib/schemas/leads.ts` (novo)
- `src/lib/schemas/leads.test.ts` (novo)
- `src/lib/queries/leads.ts` (novo)
- `src/lib/queries/leads.test.ts` (novo)
- `src/hooks/use-lead-filters.ts` (novo)
- `src/components/features/admin/LeadMetricsCards.tsx` (novo)
- `src/components/features/admin/LeadFilters.tsx` (novo)
- `src/components/features/admin/LeadTable.tsx` (novo)
- `src/components/features/admin/LeadDetailDrawer.tsx` (novo)
- `src/pages/admin/Leads.tsx` (novo)
- `src/pages/admin/Leads.test.tsx` (novo)
- `src/router.tsx` (modificado — lazy import leads → Leads.tsx)
- `src/pages/admin/Stub.tsx` (modificado — removido LeadsStub)
- `package.json` (modificado — +@tanstack/react-table)
- `bun.lock` (modificado)
