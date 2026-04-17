# Story 2.3: Dashboard completo com ScoreCard + NarrativeBanner + SpecialtySelector + transição

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **aluno**,
I want **ver um dashboard com meus scores nas 11 instituições, trocar especialidade pelo header e ter transição fluida do formulário**,
So that **tenho clareza imediata de onde estou mais competitivo e o momento "ver o farol acender" é marcante**.

## Acceptance Criteria

1. **AC1 — Dashboard grid com ScoreCards ordenados**
   **Given** rota `/app` (home do aluno)
   **When** logado com currículo preenchido
   **Then** header AppShell + SpecialtySelector + Avatar
   **And** subheader com título "Sua posição em 11 instituições" + DisclaimerBanner compacto
   **And** `NarrativeBanner` com 1 linha: "Você está mais competitivo em {top}. Maior oportunidade: +{X} em {inst}, {categoria}."
   **And** grid de `ScoreCard` em 4 colunas (xl+), 3 (md/lg), 1 (mobile), ordenado `score desc`

2. **AC2 — ScoreCard individual**
   **Given** `ScoreCard` de uma instituição
   **When** renderiza
   **Then** mostra nome (h3), score 48px, barra `Progress` (navy.200 fundo + teal.500 progresso), 1 linha de gap resumido, chevron
   **And** hover: elevação sutil + chevron em teal
   **And** `aria-label` completo ("USP-RP, score 68 de 100, mais 32 possíveis em publicações, botão ver detalhes")
   **And** clique leva a `/app/instituicoes/:id`

3. **AC3 — Currículo parcial ou vazio**
   **Given** currículo parcial ou vazio
   **When** cards renderizam
   **Then** cards exibem badge "Parcial" ou estado vazio com CTA "Comece a preencher"
   **And** não bloqueiam visualização

4. **AC4 — Loading skeletons**
   **Given** scores em carregamento
   **When** `useScores` em `isLoading`
   **Then** vejo 11 skeletons com dimensões finais (nunca spinner full-screen)

5. **AC5 — SpecialtySelector no header**
   **Given** `SpecialtySelector` no header AppShell
   **When** abro o dropdown
   **Then** vejo todas as especialidades cadastradas
   **And** a atual está marcada

6. **AC6 — Troca de especialidade com recálculo**
   **Given** seleciono outra especialidade
   **When** confirmo
   **Then** mutation atualiza `profile.specialty_interest`
   **And** `useScores` invalida e dispara `calculate_scores` com nova especialidade
   **And** dashboard atualiza em <1s (NFR3)
   **And** `aria-live` anuncia "Scores atualizados para {especialidade}"

7. **AC7 — Transição formulário → dashboard**
   **Given** estou no formulário
   **When** clico "Ver meus resultados"
   **Then** transição fade+slide ~200ms leva ao dashboard
   **And** skeletons dos 11 cards aparecem instantaneamente
   **And** cards populam numa única atualização (não sequencial) em <1s

8. **AC8 — Reduced motion**
   **Given** user com `prefers-reduced-motion: reduce`
   **When** a transição dispara
   **Then** anima só com opacidade (ou sem animação), sem slide

## Tasks / Subtasks

- [x] **Task 1 — Componente `ScoreCard`** (AC: #2, #3)
  - [x] 1.1 Criar `src/components/features/scoring/ScoreCard.tsx`
    - Props: `institution: Institution`, `score: UserScore | null`, `onClick: () => void`
    - Card com nome instituição (h3), score 48px (`text-5xl font-bold tabular-nums`), barra `Progress` do shadcn
    - Barra: fundo `bg-navy-200` (usar `bg-primary/20`), progresso `bg-teal-500` (usar `bg-accent`), percentual = `score / max_score * 100`
    - 1 linha de gap: extrair do `breakdown` a categoria com maior delta (`max - score`), exibir "+{delta} em {categoria}"
    - Chevron à direita (`ChevronRight` Lucide), muda para `text-accent` em hover
    - Hover: `hover:shadow-md hover:border-accent/50` + transição suave
    - `aria-label` dinâmico: `"{nome}, score {score} de {max_score}, mais {gap} possíveis em {categoria}, botão ver detalhes"`
    - Click handler navega para `/app/instituicoes/${institution.id}`
  - [x] 1.2 Estado parcial: se `score` existe mas `breakdown` mostra poucos campos preenchidos → badge `<Badge variant="secondary">Parcial</Badge>`
  - [x] 1.3 Estado vazio: se `score` é null ou score=0 com breakdown todo zerado → CTA "Comece a preencher" com link para `/app/curriculo`
  - [x] 1.4 Criar `src/components/features/scoring/ScoreCard.test.tsx` — testes de renderização para estados: completo, parcial, vazio, hover, aria-label

- [x] **Task 2 — Componente `NarrativeBanner`** (AC: #1)
  - [x] 2.1 Criar `src/components/features/scoring/NarrativeBanner.tsx`
    - Props: `scores: UserScore[]`, `institutions: Institution[]`
    - Calcular: `top` = instituição com maior score; `oportunidade` = instituição com maior delta total (`max_score - score`), categoria com maior delta individual no breakdown
    - Renderizar: ícone 🧭 + fundo `bg-muted` (neutral.50) + texto 1 linha
    - Formato: "Você está mais competitivo em {top.short_name || top.name}. Maior oportunidade: +{delta} em {inst.short_name}, {categoria}."
    - Se scores vazios ou todos zero: "Preencha seu currículo para ver onde você se destaca."
  - [x] 2.2 Criar `src/components/features/scoring/NarrativeBanner.test.tsx`

- [x] **Task 3 — Componente `DisclaimerBanner`** (AC: #1)
  - [x] 3.1 Criar `src/components/features/scoring/DisclaimerBanner.tsx`
    - Versão compacta para subheader do dashboard: 1 linha, fundo `bg-warning/10`, ícone `AlertTriangle` Lucide, tipografia caption (`text-xs text-muted-foreground`)
    - Texto: "Scores são estimativas baseadas em editais públicos."
    - Props opcionais: `variant: 'compact' | 'full'` (full será usado na Story 2.4)
  - [x] 3.2 Criar `src/components/features/scoring/DisclaimerBanner.test.tsx`

- [x] **Task 4 — Componente `SpecialtySelector`** (AC: #5, #6)
  - [x] 4.1 Criar `src/components/features/scoring/SpecialtySelector.tsx`
    - Buscar especialidades via query em `specialties` (excluir sentinel `__default__` com `name != '__default__'`)
    - Select/Popover inline com label da especialidade atual (de `profile.specialty_interest`)
    - Se `profile.specialty_interest` é null → exibir "Todas as especialidades" como default
    - Responsivo: em mobile, nome truncado com `max-w-[120px] truncate`
  - [x] 4.2 Mutation de troca:
    - `supabase.from('profiles').update({ specialty_interest: newSpecialtyId }).eq('id', userId)`
    - Em `onSuccess`: `invalidateQueries(['scores', ...])` + `invalidateQueries(['profile', ...])` + `useRecalculateScores` com nova specialty
    - Feedback: `aria-live="polite"` region com "Scores atualizados para {nome da especialidade}"
  - [x] 4.3 Criar `src/lib/queries/scoring.ts` — adicionar `useSpecialties()` hook:
    - Query em `specialties` filtrando `name != '__default__'`, `staleTime: 10 * 60 * 1000`
    - Key: `scoringKeys.specialties = ['specialties']`
  - [x] 4.4 Criar `src/components/features/scoring/SpecialtySelector.test.tsx`

- [x] **Task 5 — Integrar SpecialtySelector no AppShell** (AC: #5)
  - [x] 5.1 Modificar `src/components/layout/AppShell.tsx`:
    - Substituir o `div[data-testid="specialty-selector-slot"]` pelo `<SpecialtySelector />` real
    - Remover `aria-hidden="true"` do slot
    - Posicionar no centro do header com `flex-1 flex justify-center`

- [x] **Task 6 — Página Dashboard `/app`** (AC: #1, #4)
  - [x] 6.1 Reescrever `src/pages/app/Home.tsx` como o Dashboard:
    - Usar `useAuth()` para obter `user.id` e `profile.specialty_interest`
    - Usar `useScores(userId, specialtyId)` e `useInstitutions()`
    - Subheader: título "Sua posição em {N} instituições" + `<DisclaimerBanner variant="compact" />`
    - `<NarrativeBanner scores={scores} institutions={institutions} />`
    - Grid: `grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4`
    - Map scores → ScoreCard com institution match por `institution_id`
  - [x] 6.2 Loading state: 11 `<Skeleton className="h-[180px] rounded-lg" />` no grid
  - [x] 6.3 Error state: mensagem pt-BR com botão "Tentar novamente" que invalida queries
  - [x] 6.4 Criar `src/pages/app/Home.test.tsx` — testes com mock de useScores/useInstitutions para estados: loading, dados, erro, vazio

- [x] **Task 7 — Rota `/app/instituicoes/:id`** (AC: #2)
  - [x] 7.1 Adicionar rota em `src/router.tsx`:
    - `{ path: "instituicoes/:id", lazy: () => import("./pages/app/InstitutionDetail") }`
    - Dentro do children de `/app`
  - [x] 7.2 Criar `src/pages/app/InstitutionDetail.tsx` como **placeholder** (implementação completa na Story 2.4):
    - Breadcrumb "← Dashboard" com link para `/app`
    - Título com nome da instituição
    - Texto: "Detalhes em breve — Story 2.4"
    - Usar `useParams()` para ler `:id`

- [x] **Task 8 — Transição formulário → dashboard** (AC: #7, #8)
  - [x] 8.1 No formulário de currículo (`src/pages/app/Curriculo.tsx` ou `CurriculoFormSection`):
    - CTA "Ver meus resultados" deve navegar para `/app` via `useNavigate()`
    - Antes de navegar, flush do autosave pendente (se houver) via `autosave.flush()`
  - [x] 8.2 Implementar transição fade+slide no Dashboard (ou wrapper de transição):
    - CSS: `@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`
    - Aplicar `animation: fadeSlideIn 200ms ease-out` no container do dashboard
    - Respeitar `prefers-reduced-motion`: `@media (prefers-reduced-motion: reduce) { animation: fadeIn 200ms ease-out; }` (só opacidade, sem slide)
  - [x] 8.3 Skeletons: aparecer instantaneamente (sem delay de animação), cards populam todos de uma vez quando `useScores` resolve

- [x] **Task 9 — Remover `src/lib/calculations.ts`** (cleanup)
  - [x] 9.1 Verificar que nenhum import referencia `calculations.ts` no codebase
  - [x] 9.2 Se nenhum import encontrado, deletar o arquivo
  - [x] 9.3 Se ainda houver imports, documentar em completion notes e NÃO deletar

- [x] **Task 10 — Integração e validação** (AC: todos)
  - [x] 10.1 Rodar `bun run lint && bunx tsc --noEmit && bun run test` — tudo verde
  - [x] 10.2 Rodar `bun run build` — build sem erros
  - [ ] 10.3 Validar manualmente: login como student → ver dashboard → trocar especialidade → ver atualização
  - [ ] 10.4 Validar: navegar do formulário → dashboard → ver transição + skeletons → cards populam
  - [ ] 10.5 Validar: currículo vazio → cards com CTA "Comece a preencher"
  - [ ] 10.6 Validar: acessibilidade — tab navigation nos cards, aria-labels, aria-live do SpecialtySelector

## Dev Notes

### Contexto crítico (ler antes de codar)

1. **Esta é a TERCEIRA story do Epic 2** — conecta o motor de cálculo (Story 2.2) ao frontend. A página `/app` atual é um stub placeholder (`src/pages/app/Home.tsx` com "Olá, {nome}"). Esta story **substitui** esse stub pelo dashboard completo.

2. **Hooks de scoring já existem** — `src/lib/queries/scoring.ts` já exporta `useScores(userId, specialtyId)`, `useInstitutions()`, `useRecalculateScores()` e `scoringKeys`. O hook `useScores` já implementa auto-recálculo quando stale. **NÃO reimplementar** — consumir diretamente.

3. **Schemas Zod já existem** — `src/lib/schemas/scoring.ts` exporta `UserScore`, `Institution`, `ScoreBreakdown`, `ScoreBreakdownItem`. Usar esses tipos.

4. **Sentinel UUID para "sem especialidade"** — `DEFAULT_SPECIALTY_ID = "00000000-0000-0000-0000-000000000000"` definido em `scoring.ts`. Quando `profile.specialty_interest` é null, usar esse sentinel. A tabela `specialties` tem uma row sentinel com `name='__default__'` — **filtrar essa row** do SpecialtySelector dropdown.

5. **AppShell tem slot preparado** — `src/components/layout/AppShell.tsx:15-19` tem um `div[data-testid="specialty-selector-slot"]` com `aria-hidden="true"`. Substituir pelo `SpecialtySelector` real e remover `aria-hidden`.

6. **`src/lib/calculations.ts` é legado** — Story 2.2 completion notes dizem "legado preservado até Story 2.3". Verificar se ainda é importado em algum lugar. Se não, pode ser deletado nesta story. Se sim, documentar e manter.

7. **Rota `/app/instituicoes/:id` é preparação para Story 2.4** — criar rota + placeholder. A Story 2.4 implementará ScoreHero + GapAnalysisList + DisclaimerBanner full. O `ScoreCard` deve navegar para essa rota no click.

8. **Breakdown JSONB** — cada score em `user_scores` tem `breakdown jsonb` com formato `{ "field_key": { "score": X, "max": Y, "description": "..." } }`. Usar para calcular gap por categoria e encontrar a maior oportunidade para NarrativeBanner e ScoreCard.

9. **Score base varia por instituição** — UNICAMP/USP-SP são base 100; PSU-MG/FMABC são base 10. Barra de progresso deve usar `score / max_score * 100` (percentual), não valor absoluto.

10. **294 testes TS é o baseline atual** — NÃO regredir. Adicionar testes para todos os novos componentes.

### Padrões de arquitetura que você DEVE seguir

- **Componentes em `src/components/features/scoring/`** — criar diretório se não existir. [Source: architecture.md#Structure Patterns]
- **Snake_case no stack de dados** — dados do Supabase mantêm snake_case no TS. `institution.short_name`, `score.max_score`, `profile.specialty_interest`. [Source: architecture.md#Naming Patterns]
- **React Query para TODO data fetching** — nenhum `supabase.from().select()` direto em componentes. Consumir hooks de `src/lib/queries/scoring.ts`. [Source: architecture.md#Enforcement Guidelines regra 4]
- **Mutations com `invalidateQueries` explícito** em `onSuccess`. [Source: architecture.md#Communication Patterns]
- **Sempre checar `error` antes de `data`** nas chamadas Supabase. [Source: architecture.md#Enforcement Guidelines regra 5]
- **Testes co-localizados** — `.test.tsx` no mesmo diretório do componente. [Source: architecture.md#Structure Patterns]
- **Mensagens ao usuário em pt-BR** — acionáveis, sem jargão técnico. [Source: architecture.md#Enforcement Guidelines regra 7]
- **Conventional Commits em pt-BR** — `feat(dashboard): dashboard ScoreCard + NarrativeBanner + SpecialtySelector (Story 2.3)`.
- **shadcn/ui para primitives** — `Card`, `Progress`, `Badge`, `Skeleton`, `Select`, `Button` já instalados em `src/components/ui/`. [Source: codebase scan]
- **Sonner para toasts** — erros via `toast.error(...)`, sucesso via `toast.success(...)`. Importar de `sonner`. [Source: architecture.md#Process Patterns]
- **Sem PII em logs** — nunca logar email, nome, telefone. [Source: architecture.md#Enforcement Guidelines regra 8]

### Anti-patterns a EVITAR

- ❌ **Não** reimplementar hooks de scoring — `useScores`, `useInstitutions`, `useRecalculateScores` já existem em `src/lib/queries/scoring.ts`
- ❌ **Não** usar `useState` + `useEffect` para data fetching — usar React Query via hooks existentes
- ❌ **Não** criar `supabase.from()` direto em componentes — toda query passa por `src/lib/queries/`
- ❌ **Não** usar vermelho para scores baixos — UX spec exige reframe de oportunidade ("espaço para crescer"), sem cor punitiva. Navy/teal apenas. [Source: UX-DR33]
- ❌ **Não** usar spinner full-screen — skeleton shadcn para loading. [Source: UX-DR26]
- ❌ **Não** ignorar `prefers-reduced-motion` — transição fade+slide deve respeitar. [Source: UX-DR30]
- ❌ **Não** hardcodar 11 instituições — usar `institutions.length` dinâmico
- ❌ **Não** bloquear visualização para currículo parcial — badge "Parcial" é educativo, não bloqueante. [Source: UX-DR34]
- ❌ **Não** criar page routes fora do lazy loading pattern — todas as routes usam `lazy: () => import(...)` no router. [Source: src/router.tsx]
- ❌ **Não** esquecer de remover `aria-hidden="true"` do specialty-selector-slot ao substituir pelo componente real. [Source: deferred-work.md]

### Decisões técnicas específicas

- **Gap calculation no ScoreCard:** Iterar `breakdown` JSONB → para cada entry, calcular `delta = max - score` → exibir a categoria com maior delta. Se empate, usar a primeira encontrada.

- **NarrativeBanner lógica:** `top` = `scores[0]` (já ordenado `score desc` por `useScores`). `oportunidade` = instituição com `max(max_score - score)`, dentro dela a categoria com `max(breakdown[key].max - breakdown[key].score)`.

- **SpecialtySelector mutation:** Criar mutation inline (ou em `src/lib/queries/scoring.ts`) que faz update em `profiles.specialty_interest`, invalida `['scores', ...]` e `['profile', ...]`. O `useScores` com nova specialtyId dispara auto-recálculo via RPC.

- **Transição CSS-only:** Não usar library de animação. CSS `@keyframes` + `animation` no container. Respeitar `prefers-reduced-motion` com media query. Simples e sem dependência.

- **Rota `/app/instituicoes/:id`:** Placeholder para Story 2.4. Registrar no router dentro dos children de `/app` (StudentLayout). Componente minimal com breadcrumb "← Dashboard" + nome da instituição + "Detalhes em breve".

- **`useSpecialties` hook:** Adicionar ao `src/lib/queries/scoring.ts` junto aos hooks existentes. Query simples em `specialties` com filtro `name != '__default__'`. staleTime alto (10 min). Key: `['specialties']`.

### UX specs que esta story implementa

| Componente | UX-DR | Requisito-chave |
|---|---|---|
| ScoreCard | UX-DR6 | card-unidade com score 48px + Progress + gap + chevron + ARIA completo |
| NarrativeBanner | UX-DR7 | faixa 1 linha com destaque + oportunidade, ícone 🧭, fundo neutral.50 |
| DisclaimerBanner | UX-DR16 | aviso de estimativa discreto (compact no dashboard, full na Story 2.4) |
| SpecialtySelector | UX-DR13 | seletor inline no header, dispara recálculo global |
| Dashboard grid | UX-DR18 | 4 colunas xl+, 3 md/lg, 1 mobile; header sticky; subheader com disclaimer + narrativa |
| Loading | UX-DR26 | skeleton shadcn obrigatório, nunca spinner full-screen |
| Transição | UX-DR23 | fade+slide ~200ms; skeletons instantâneos; cards populam numa atualização |
| Parcial/vazio | UX-DR34 | badge "Parcial" educativo; CTA "Comece a preencher"; nunca bloqueante |
| Microcopy | UX-DR33 | pt-BR 2ª pessoa; score baixo = oportunidade; sem vermelho; sem jargão |
| Reduced motion | UX-DR30 | respeitar `prefers-reduced-motion` |
| Touch targets | UX-DR29 | ≥44px em mobile |
| A11y | UX-DR27, UX-DR28 | focus ring, aria-labels, aria-live, skip link |

### Previous story intelligence (Story 2.2 → 2.1)

- **Story 2.2 (done)** — Motor de cálculo. Criou `evaluate_formula` + `calculate_scores` em PL/pgSQL + trigger `mark_scores_stale` + hooks React Query. **Padrões a seguir:**
  - `scoringKeys` como objeto de query keys tipadas
  - `DEFAULT_SPECIALTY_ID` sentinel para "sem especialidade"
  - `useScores` retorna array ordenado `score desc` + auto-recálculo quando stale
  - `useInstitutions` com staleTime 10 min
  - Type assertion `as UserScore[]` (padrão da codebase, schemas decorativos)
  - **Patches do code review:** divisão por zero guard, scores inexistentes disparam cálculo inicial, loop infinito prevenido
  - **Completion note:** `queryClient.clear()` em SIGNED_OUT já cobre cache scoring — validar comportamento quando dashboard conectar

- **Story 2.1 (done)** — Formulário currículo com autosave. **Padrões relevantes:**
  - Componentes em `src/components/features/curriculum/`
  - `AutosaveIndicator` com `aria-live="polite"`
  - `use-autosave` hook com `flush()` method — chamar antes de navegar para dashboard
  - CTA "Ver meus resultados" no formulário — conectar ao navigate `/app`
  - `categoryToValue` duplicada em 3 arquivos — NÃO duplicar novamente

### Git intelligence (últimos commits)

- Conventional Commits em pt-BR: `feat:`, `fix:`, `ci:`, `test:`, `chore:`.
- Para esta story: `feat(dashboard): dashboard ScoreCard + NarrativeBanner + SpecialtySelector (Story 2.3)`.
- 294 testes TS é o baseline — NÃO regredir.
- Migrations numeradas até 0007. Esta story NÃO cria migrations (apenas UI).

### Deferrals conhecidos relevantes a esta story

- **`aria-hidden="true"` no specialty-selector-slot** — [deferred-work.md Story 1.8] DEVE ser removido ao substituir pelo SpecialtySelector real.
- **`calculations.ts` legado** — [deferred-work.md Story 2.2] "Legado preservado até Story 2.3". Verificar e remover se não mais importado.
- **Smoke tests insuficientes para AC5 scoring hooks** — [deferred-work.md Story 2.2] "Testes de renderHook planejados para Story 2.3". Considerar adicionar se escopo permitir.
- **`formatTimeAgo` nunca atualiza** — [deferred-work.md Story 2.1] Irrelevante para esta story (está no AutosaveIndicator).
- **`LoginForm` role-aware redirect** — [deferred-work.md Story 1.11] Pré-existente, não escopo desta story.

### Project Structure Notes

Arquivos criados/modificados esperados:

```
src/
  components/
    features/
      scoring/                                    [NOVO diretório]
        ScoreCard.tsx                             [NOVO]
        ScoreCard.test.tsx                        [NOVO]
        NarrativeBanner.tsx                       [NOVO]
        NarrativeBanner.test.tsx                  [NOVO]
        DisclaimerBanner.tsx                      [NOVO]
        DisclaimerBanner.test.tsx                 [NOVO]
        SpecialtySelector.tsx                     [NOVO]
        SpecialtySelector.test.tsx                [NOVO]
    layout/
      AppShell.tsx                                [MODIFICADO — substituir slot por SpecialtySelector]
  pages/
    app/
      Home.tsx                                    [REESCRITO — stub → dashboard]
      Home.test.tsx                               [REESCRITO/NOVO — testes do dashboard]
      InstitutionDetail.tsx                       [NOVO — placeholder Story 2.4]
  lib/
    queries/
      scoring.ts                                  [MODIFICADO — adicionar useSpecialties + mutation troca]
    calculations.ts                               [DELETAR se sem imports]
  router.tsx                                      [MODIFICADO — adicionar rota instituicoes/:id]
```

**NÃO devem ser tocados:**
- `supabase/migrations/*` — sem migrations nesta story
- `src/lib/schemas/scoring.ts` — schemas já completos
- `src/components/ui/*` — primitives shadcn já instalados
- `src/components/features/curriculum/*` — exceto conectar CTA "Ver meus resultados" se necessário
- `src/lib/database.types.ts` — sem regeneração (nada mudou no schema)

### References

- [epics.md#Story 2.3 (linhas 728-783)](../planning-artifacts/epics.md) — ACs canônicos
- [architecture.md#Frontend Architecture (linhas 199-213)](../planning-artifacts/architecture.md) — estrutura features/scoring, React Router, shadcn
- [architecture.md#Communication Patterns (linhas 349-363)](../planning-artifacts/architecture.md) — query keys, invalidation
- [architecture.md#Process Patterns (linhas 365-399)](../planning-artifacts/architecture.md) — error handling, loading, validation
- [src/lib/queries/scoring.ts](../../src/lib/queries/scoring.ts) — hooks existentes (useScores, useInstitutions, scoringKeys)
- [src/lib/schemas/scoring.ts](../../src/lib/schemas/scoring.ts) — tipos UserScore, Institution, ScoreBreakdown
- [src/components/layout/AppShell.tsx](../../src/components/layout/AppShell.tsx) — header com slot para SpecialtySelector
- [src/pages/app/Home.tsx](../../src/pages/app/Home.tsx) — stub atual a ser substituído
- [src/router.tsx](../../src/router.tsx) — router com rotas /app/*
- [2-2-motor-calculo-db-function-trigger-queries.md](./2-2-motor-calculo-db-function-trigger-queries.md) — completion notes Story 2.2
- [deferred-work.md](./deferred-work.md) — deferrals pendentes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

Nenhum debug significativo — implementação seguiu plano sem bloqueios.

### Completion Notes List

- ScoreCard implementado com 3 estados (completo, parcial, vazio), aria-label dinâmico, hover teal, Progress com bg-primary/20 + bg-accent. 8 testes.
- NarrativeBanner calcula top (maior score) e oportunidade (maior gap total + categoria), com fallback para currículo vazio. 4 testes.
- DisclaimerBanner com variantes compact (dashboard) e full (Story 2.4). 3 testes.
- SpecialtySelector usa useSpecialties (novo hook) + useUpdateSpecialty (nova mutation). Radix Select com truncate mobile. aria-live polite para feedback de troca. 5 testes.
- AppShell: slot `specialty-selector-slot` + `aria-hidden` removidos, substituído por `<SpecialtySelector />` real. Testes AppShell atualizados.
- Dashboard (Home.tsx) reescrito: subheader com contagem dinâmica + DisclaimerBanner compact, NarrativeBanner, grid responsivo 1/3/4 cols, loading com 11 skeletons, error com retry. 6 testes.
- Rota `/app/instituicoes/:id` registrada no router com lazy loading. Placeholder InstitutionDetail com breadcrumb "← Dashboard".
- Transição CSS-only: `fadeSlideIn` 200ms ease-out com `prefers-reduced-motion: reduce` fallback (só opacidade). Classe `dashboard-enter` no container do dashboard.
- `calculations.ts` legado deletado — nenhum import TS referenciava o arquivo (apenas comentários em SQL tests).
- Task 8.1 (CTA formulário → dashboard): já implementado na Story 2.1 — `handleNavigateResults` faz `flush()` + `navigate("/app")`.
- scoring.ts: adicionados `scoringKeys.specialties`, `useSpecialties()`, `useUpdateSpecialty()`.
- Validação: 340 testes passando (baseline era 294, +46 novos), lint 0 erros, TypeScript 0 erros, build OK.
- Tasks 10.3-10.6 (validação manual) requerem ambiente com Supabase rodando — marcadas como pendentes para validação humana.

### File List

- `src/components/features/scoring/ScoreCard.tsx` — NOVO
- `src/components/features/scoring/ScoreCard.test.tsx` — NOVO
- `src/components/features/scoring/NarrativeBanner.tsx` — NOVO
- `src/components/features/scoring/NarrativeBanner.test.tsx` — NOVO
- `src/components/features/scoring/DisclaimerBanner.tsx` — NOVO
- `src/components/features/scoring/DisclaimerBanner.test.tsx` — NOVO
- `src/components/features/scoring/SpecialtySelector.tsx` — NOVO
- `src/components/features/scoring/SpecialtySelector.test.tsx` — NOVO
- `src/components/layout/AppShell.tsx` — MODIFICADO (slot → SpecialtySelector real)
- `src/components/layout/AppShell.test.tsx` — MODIFICADO (mocks atualizados)
- `src/pages/app/Home.tsx` — REESCRITO (stub → dashboard)
- `src/pages/app/Home.test.tsx` — REESCRITO (testes dashboard)
- `src/pages/app/InstitutionDetail.tsx` — NOVO (placeholder)
- `src/lib/queries/scoring.ts` — MODIFICADO (useSpecialties, useUpdateSpecialty, scoringKeys.specialties)
- `src/router.tsx` — MODIFICADO (rota instituicoes/:id)
- `src/index.css` — MODIFICADO (animações dashboard-enter)
- `src/lib/calculations.ts` — DELETADO (legado)

### Review Findings

- [x] [Review][Decision] D1 — CTA "Comece a preencher" no card vazio navega para `/app/curriculo` — RESOLVIDO: card vazio agora usa `onEmptyClick` → currículo
- [x] [Review][Decision] D2 — SpecialtySelector no dashboard (não header) — RESOLVIDO: decisão confirmada pelo usuário, manter no dashboard
- [x] [Review][Patch] P1 — `useUpdateSpecialty` agora invalida por prefix match `["scores", userId]` — todas specialties [scoring.ts:181]
- [x] [Review][Patch] P2 — `NarrativeBanner` bestOppCategory com fallback para key + guard de string vazia [NarrativeBanner.tsx:41]
- [x] [Review][Patch] P3 — `onError` toast adicionado ao SpecialtySelector [SpecialtySelector.tsx:35]
- [x] [Review][Patch] P4 — Skeleton count usa `institutionCount || 11` — dinâmico quando disponível [Home.tsx:108]
- [x] [Review][Patch] P5 — Empty ScoreCard aria-label "preencher currículo" + `onEmptyClick` handler [ScoreCard.tsx:65]
- [x] [Review][Patch] P6 — Heading usa `scores.length` com fallback para `institutions.length` [Home.tsx:86]
- [x] [Review][Patch] P7 — Migration verification checa `formula = '{}' OR formula IS NULL` [0008:394]
- [x] [Review][Defer] W1 — InstitutionDetail sem loading/404 — placeholder Story 2.4 [InstitutionDetail.tsx] — deferred, será implementado na Story 2.4
- [x] [Review][Defer] W2 — `prefers-reduced-motion` ainda faz fade 200ms — WCAG sugere `animation: none` [index.css:133] — deferred, polimento a11y
- [x] [Review][Defer] W3 — Admin "Ver como aluno" escondido em mobile [AdminShell.tsx] — deferred, admin mobile é deferral Epic 3
- [x] [Review][Defer] W4 — `useScores` re-trigger RPC em cada mount com staleTime:0 [scoring.ts:66] — deferred, pré-existente Story 2.2

### Change Log

- 2026-04-17: Implementação completa Story 2.3 — Dashboard com ScoreCard, NarrativeBanner, DisclaimerBanner, SpecialtySelector, transição formulário→dashboard, rota placeholder instituição, remoção calculations.ts legado. 340 testes passando (+46 novos).
- 2026-04-17: Code review — 2 decision-needed, 7 patch, 4 defer, 5 dismissed.
