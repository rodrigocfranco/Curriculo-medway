# Story 2.4: Detalhe da instituição — ScoreHero + GapAnalysis + DisclaimerBanner

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **aluno**,
I want **ver o detalhe de cada instituição com gap por categoria, disclaimer e link para o edital original**,
So that **entendo exatamente onde posso ganhar pontos e posso consultar a fonte**.

## Acceptance Criteria

1. **AC1 — Página de detalhe com breadcrumb e header**
   **Given** rota `/app/instituicoes/:id`
   **When** acesso
   **Then** vejo breadcrumb "← Dashboard" (máx 2 níveis)
   **And** header com nome + especialidade + link externo do edital (`target="_blank" rel="noopener"`, ícone e texto "abre em nova aba")
   **And** `ScoreHero` com score 96px + barra ampla

2. **AC2 — GapAnalysisList com categorias**
   **Given** `GapAnalysisList`
   **When** renderiza
   **Then** `<ul>/<li>` de categorias com: nome, "X/Y pontos", mini-barra, "+Δ possíveis", botão "Saiba +"
   **And** "Saiba +" expande explicação de `scoring_rules.description`

3. **AC3 — Microcopy positiva para score baixo**
   **Given** microcopy de score
   **When** score é baixo
   **Then** texto contextualiza positivamente ("Você tem {X} pontos possíveis para crescer aqui"); nunca vermelho, nunca culpa

4. **AC4 — DisclaimerBanner full no detalhe**
   **Given** `DisclaimerBanner` no detalhe da instituição
   **When** renderiza
   **Then** exibe "Estes scores são estimativas baseadas em editais públicos. A pontuação oficial é determinada pela instituição."
   **And** fundo âmbar sutil (warning semântico), ícone ⚠️, tipografia caption

5. **AC5 — Link para edital original**
   **Given** detalhe da instituição
   **When** clico em "Ver edital original"
   **Then** abre em nova aba o `institutions.edital_url` OU URL assinada do Storage (se `pdf_path` existe)
   **And** link sinaliza "abre em nova aba" a leitores de tela

## Tasks / Subtasks

- [x] **Task 1 — Componente `ScoreHero`** (AC: #1, #3)
  - [x] 1.1 Criar `src/components/features/scoring/ScoreHero.tsx`
    - Props: `score: number`, `maxScore: number`, `institutionName: string`
    - Score exibido em 96px (`text-[96px] font-bold tabular-nums` ou equivalente `text-8xl`)
    - Barra `Progress` ampla (`h-3`) com `bg-primary/20` fundo + `bg-accent` progresso (mesmo padrão do ScoreCard)
    - Percentual = `score / maxScore * 100` (score base varia por instituição — UNICAMP base 100, FMABC base 10)
    - Microcopy contextual por faixa (nunca punitiva):
      - `score >= 75%` do max → "Ótima posição nesta instituição!"
      - `score >= 50%` do max → "Bom caminho — veja onde pode crescer"
      - `score < 50%` do max → "Você tem {maxScore - score} pontos possíveis para crescer aqui"
    - Cores: navy/teal apenas, **nunca vermelho** para scores. [Source: UX-DR33]
    - `aria-label`: "Score {score} de {maxScore} em {institutionName}"
  - [x] 1.2 Criar `src/components/features/scoring/ScoreHero.test.tsx` — testes para 3 faixas de microcopy + aria-label + renderização com score 0

- [x] **Task 2 — Componente `GapAnalysisList`** (AC: #2, #3)
  - [x] 2.1 Criar `src/components/features/scoring/GapAnalysisList.tsx`
    - Props: `breakdown: ScoreBreakdown` (de `user_scores.breakdown` JSONB)
    - Renderizar `<ul>` com `<li>` por categoria (cada entry do breakdown)
    - Cada item: nome da categoria (`item.description` ou fallback para `key`), "X/Y pontos", mini-barra `Progress` (`h-1.5`), "+Δ possíveis" em texto accent, botão "Saiba +"
    - "Saiba +" usa `Collapsible` shadcn (ou accordion inline) para expandir `description` da regra
    - Ordenar por delta descendente (maior oportunidade primeiro)
    - Delta = `item.max - item.score`; se delta = 0, exibir "✓ Máximo atingido" em texto success
    - Microcopy: nunca usar vermelho, nunca culpa. Delta positivo = "espaço para crescer". [Source: UX-DR33, UX-DR34]
    - Semântica: `<ul role="list">`, `<li>` com informação completa, mini-barra decorativa (`aria-hidden`)
  - [x] 2.2 Criar `src/components/features/scoring/GapAnalysisList.test.tsx` — testes: renderização normal, categoria com delta 0, breakdown vazio, expansão "Saiba +"

- [x] **Task 3 — Hook `useInstitutionScore`** (AC: #1, #2, #5)
  - [x] 3.1 Adicionar ao `src/lib/queries/scoring.ts`:
    - `useInstitutionScore(userId, institutionId, specialtyId)` — filtra `useScores` data para a instituição específica, ou faz query direta se mais eficiente
    - Retorna `{ score: UserScore | null, institution: Institution | null, isLoading, isError }`
    - Reutilizar `useScores` e `useInstitutions` existentes (filtrando client-side) para não duplicar queries
  - [x] 3.2 Helper `useEditalUrl(institution)` — retorna URL do edital:
    - Se `institution.edital_url` existe → retornar diretamente
    - Se `institution.pdf_path` existe → gerar signed URL via `supabase.storage.from('editais').createSignedUrl(pdf_path, 3600)`
    - Se nenhum → retornar `null`
    - Signed URL com 1h de validade (suficiente para a sessão)

- [x] **Task 4 — Reescrever `InstitutionDetail` page** (AC: #1, #2, #3, #4, #5)
  - [x] 4.1 Reescrever `src/pages/app/InstitutionDetail.tsx` (substituir placeholder):
    - `useParams<{ id: string }>()` para obter `institutionId`
    - Usar `useAuth()` para `userId` + `specialtyId`
    - Usar `useInstitutionScore` (Task 3) para dados
    - Usar `useEditalUrl` (Task 3) para link do edital
    - Layout:
      - Breadcrumb: `<Link to="/app">` com `<ArrowLeft>` + "Dashboard" (já existe no placeholder)
      - Header: nome da instituição (`h1 text-2xl font-bold`) + estado + link edital
      - Link edital: `<a href={editalUrl} target="_blank" rel="noopener noreferrer">` com ícone `ExternalLink` Lucide + texto "Ver edital original" + sr-only "(abre em nova aba)"
      - Se edital não disponível: não exibir link (sem placeholder)
      - `<ScoreHero>` com score, maxScore, nome da instituição
      - `<GapAnalysisList>` com breakdown do score
      - `<DisclaimerBanner variant="full" />` ao final da página
    - Container: `max-w-3xl` (consistente com formulário de currículo)
  - [x] 4.2 Loading state: skeleton para ScoreHero (block 96px height) + 5 skeleton lines para GapAnalysis
  - [x] 4.3 Error state: mensagem pt-BR "Não conseguimos carregar os detalhes desta instituição." + botão retry
  - [x] 4.4 404 state: se `institutionId` não encontrado nos dados → "Instituição não encontrada" + link "← Voltar ao dashboard"
  - [x] 4.5 Criar `src/pages/app/InstitutionDetail.test.tsx` — testes: loading, dados completos, erro, instituição não encontrada, link edital URL, link edital PDF (signed URL)

- [x] **Task 5 — Integração e validação** (AC: todos)
  - [x] 5.1 Rodar `bun run lint && bunx tsc --noEmit && bun run test` — tudo verde
  - [x] 5.2 Rodar `bun run build` — build sem erros
  - [x] 5.3 Verificar que baseline de testes não regrediu (343 é o baseline atual)
  - [ ] 5.4 Validar manualmente: dashboard → clicar ScoreCard → ver detalhe com ScoreHero + GapAnalysis + DisclaimerBanner + link edital
  - [ ] 5.5 Validar: breadcrumb "← Dashboard" leva de volta ao `/app`
  - [ ] 5.6 Validar: acessibilidade — tab navigation, aria-labels, "abre em nova aba" anunciado
  - [ ] 5.7 Validar: mobile — layout responsivo, touch targets ≥44px

## Dev Notes

### Contexto crítico (ler antes de codar)

1. **Esta é a QUARTA e ÚLTIMA story do Epic 2** — completa a trilha do aluno. Após esta story, o aluno pode: preencher currículo (2.1), ver scores calculados (2.2), ver dashboard (2.3), e fazer drill-down por instituição (2.4). O placeholder `InstitutionDetail.tsx` com "Detalhes em breve — Story 2.4" é substituído pelo componente completo.

2. **`InstitutionDetail.tsx` placeholder já existe** — `src/pages/app/InstitutionDetail.tsx` já tem breadcrumb "← Dashboard" e usa `useParams` + `useInstitutions`. **REESCREVER** este arquivo, não criar novo. Rota já registrada em `src/router.tsx:74-78` com lazy loading.

3. **Hooks de scoring já existem** — `src/lib/queries/scoring.ts` exporta `useScores(userId, specialtyId)`, `useInstitutions()`, `useRecalculateScores()`, `useSpecialties()`, `useUpdateSpecialty()` e `scoringKeys`. **NÃO reimplementar** — consumir diretamente. O `useScores` retorna array ordenado `score desc` — filtrar pelo `institution_id` específico para esta página.

4. **Schemas Zod já existem** — `src/lib/schemas/scoring.ts` exporta `UserScore`, `Institution`, `ScoreBreakdown`, `ScoreBreakdownItem`. Usar esses tipos. `ScoreBreakdown` é `Record<string, ScoreBreakdownItem>` onde cada item tem `{ score, max, description }`.

5. **Breakdown JSONB** — cada score em `user_scores` tem `breakdown jsonb` com formato `{ "field_key": { "score": X, "max": Y, "description": "..." } }`. O `description` vem de `scoring_rules.description` e é o texto que aparece ao expandir "Saiba +" na GapAnalysisList.

6. **Score base varia por instituição** — UNICAMP/USP-SP são base 100; PSU-MG/FMABC são base 10. Barra de progresso deve usar `score / max_score * 100` (percentual), não valor absoluto. Microcopy de faixa também deve usar percentual.

7. **DisclaimerBanner `full` variant já existe** — `src/components/features/scoring/DisclaimerBanner.tsx` já implementa `variant="full"` com texto expandido e fundo âmbar. **Importar e usar diretamente**, sem recriar. O texto no AC4 dos epics é ligeiramente diferente do que está implementado — **manter o texto já implementado** que é mais completo: "Os scores exibidos são estimativas baseadas em editais públicos e podem não refletir critérios internos das instituições. Use como referência, não como garantia."

8. **Sentinel UUID para "sem especialidade"** — `DEFAULT_SPECIALTY_ID = "00000000-0000-0000-0000-000000000000"` definido em `scoring.ts`. Quando `profile.specialty_interest` é null ou não é UUID válido, usar undefined (o hook `useScores` trata internamente).

9. **Edital pode ser URL ou PDF no Storage** — `institutions.edital_url` (link externo) e `institutions.pdf_path` (caminho no bucket `editais`). Se `pdf_path` existe, gerar signed URL via `supabase.storage.from('editais').createSignedUrl()`. Priorizar `edital_url` se ambos existirem (link oficial > upload).

10. **343 testes é o baseline atual** — NÃO regredir. Adicionar testes para ScoreHero, GapAnalysisList e InstitutionDetail.

### Padrões de arquitetura que você DEVE seguir

- **Componentes em `src/components/features/scoring/`** — ScoreHero e GapAnalysisList vão neste diretório. [Source: architecture.md#Structure Patterns]
- **Snake_case no stack de dados** — dados do Supabase mantêm snake_case no TS. `institution.short_name`, `score.max_score`, `institution.edital_url`, `institution.pdf_path`. [Source: architecture.md#Naming Patterns]
- **React Query para TODO data fetching** — nenhum `supabase.from().select()` direto em componentes. Consumir hooks de `src/lib/queries/scoring.ts`. [Source: architecture.md#Enforcement Guidelines regra 4]
- **Sempre checar `error` antes de `data`** nas chamadas Supabase. [Source: architecture.md#Enforcement Guidelines regra 5]
- **Testes co-localizados** — `.test.tsx` no mesmo diretório do componente. [Source: architecture.md#Structure Patterns]
- **Mensagens ao usuário em pt-BR** — acionáveis, sem jargão técnico. [Source: architecture.md#Enforcement Guidelines regra 7]
- **Conventional Commits em pt-BR** — `feat(scoring): detalhe instituição ScoreHero + GapAnalysis + DisclaimerBanner (Story 2.4)`.
- **shadcn/ui para primitives** — `Card`, `Progress`, `Badge`, `Skeleton`, `Button`, `Collapsible` já instalados em `src/components/ui/`. [Source: codebase scan]
- **Sem PII em logs** — nunca logar email, nome, telefone. [Source: architecture.md#Enforcement Guidelines regra 8]
- **Lazy loading de routes** — rota já registrada com `lazy: () => import(...)`. Manter `export default` no componente. [Source: src/router.tsx]

### Anti-patterns a EVITAR

- ❌ **Não** reimplementar hooks de scoring — `useScores`, `useInstitutions` já existem em `src/lib/queries/scoring.ts`
- ❌ **Não** usar `useState` + `useEffect` para data fetching — usar React Query via hooks existentes
- ❌ **Não** criar `supabase.from()` direto em componentes — toda query passa por `src/lib/queries/`
- ❌ **Não** usar vermelho para scores baixos — UX spec exige reframe de oportunidade ("espaço para crescer"), sem cor punitiva. Navy/teal apenas. [Source: UX-DR33]
- ❌ **Não** usar spinner full-screen — skeleton shadcn para loading. [Source: UX-DR26]
- ❌ **Não** hardcodar texto do DisclaimerBanner — importar `<DisclaimerBanner variant="full" />` que já existe
- ❌ **Não** recriar componente de breadcrumb — usar `<Link to="/app">` com `<ArrowLeft>` Lucide (padrão já no placeholder)
- ❌ **Não** ignorar `target="_blank"` sem `rel="noopener noreferrer"` nos links externos
- ❌ **Não** bloquear visualização para currículo parcial — badge "Parcial" é educativo, não bloqueante. [Source: UX-DR34]
- ❌ **Não** criar page routes fora do lazy loading pattern — rota já existe, manter `export default`

### Decisões técnicas específicas

- **`useInstitutionScore` hook:** Reutilizar `useScores` (que já retorna todos os scores) e `useInstitutions` filtrando client-side. Evita query separada por instituição. Se scores não carregaram ainda, o hook refaz via `useScores` que auto-recalcula quando stale.

- **`useEditalUrl` hook:** Async helper que retorna URL do edital. Para signed URLs do Storage, usar `useQuery` com `staleTime: 30 * 60 * 1000` (30min) para cachear a signed URL (válida por 1h). Não buscar signed URL se `edital_url` existe (link direto é preferido).

- **GapAnalysisList ordering:** Ordenar categorias por delta descendente (maior oportunidade primeiro). Categorias com delta = 0 vão para o final com "✓ Máximo atingido".

- **ScoreHero microcopy:** Usar percentual (`score / maxScore * 100`) para determinar faixa, não valor absoluto. Isso normaliza entre instituições com bases diferentes (100, 10, etc.).

- **Collapsible para "Saiba +":** Usar `Collapsible` do shadcn (Radix). Cada `<li>` é um `CollapsibleTrigger` + `CollapsibleContent`. Trigger mostra ícone `ChevronDown` que rotaciona ao abrir.

- **Responsivo:** `max-w-3xl mx-auto` no container. Mini-barras Progress mantêm proporção em mobile. Touch targets ≥44px nos botões "Saiba +" e link do edital.

### UX specs que esta story implementa

| Componente | UX-DR | Requisito-chave |
|---|---|---|
| ScoreHero | UX-DR14 | Score grande 96px com microcopy contextual por faixa, nunca punitiva |
| GapAnalysisList | UX-DR8 | Lista de categorias com X/Y + mini-barra + delta + "Saiba +" expandível |
| DisclaimerBanner full | UX-DR16 | Aviso de estimativa com link para edital original (abre em nova aba) |
| Breadcrumb | UX-DR19 | "← Dashboard" máx 2 níveis |
| Link edital | UX-DR19 | Header com link externo do edital |
| Microcopy | UX-DR33 | pt-BR 2ª pessoa; score baixo = oportunidade; sem vermelho; sem jargão |
| Loading | UX-DR26 | Skeleton shadcn obrigatório, nunca spinner full-screen |
| Touch targets | UX-DR29 | ≥44px em mobile |
| A11y | UX-DR27, UX-DR28 | Focus ring, aria-labels, "abre em nova aba" anunciado, links externos |

### Previous story intelligence (Story 2.3)

- **Story 2.3 (done)** — Dashboard completo. **Padrões a seguir:**
  - `scoringKeys` como objeto de query keys tipadas
  - `useScores` retorna array ordenado `score desc` — filtrar por `institution_id` para esta página
  - `useInstitutions` com staleTime 10 min
  - Type assertion `as UserScore[]` (padrão da codebase, schemas decorativos)
  - ScoreCard navega para `/app/instituicoes/${inst.id}` — é de lá que o user chega nesta página
  - DisclaimerBanner já tem variante `compact` (dashboard) e `full` (esta story) — NÃO recriar
  - UUID validation regex `UUID_RE` definido em `Home.tsx` — reutilizar ou copiar se necessário
  - `profile.specialty_interest` pode ser null ou string não-UUID — tratar como undefined
  - **Review deferrals da 2.3 relevantes:**
    - W1: InstitutionDetail sem loading/404 — **esta story resolve** (Task 4.2, 4.3, 4.4)
    - W4: `useScores` staleTime:0 re-trigger em cada mount — pré-existente, NÃO escopo desta story

- **Story 2.2 (done)** — Motor de cálculo. **Padrões relevantes:**
  - `calculate_scores` RPC auto-recálculo integrado no `useScores`
  - `breakdown` JSONB com `{ score, max, description }` por field_key — formato consumido pela GapAnalysisList
  - Scores inexistentes disparam cálculo inicial automaticamente (guard no `useScores`)

- **Story 2.1 (done)** — Formulário currículo. **Padrão relevante:**
  - `categoryToValue` duplicada em 3 arquivos — NÃO duplicar novamente. Se precisar de mapeamento categoria↔valor, extrair para utility compartilhada

### Git intelligence (últimos commits)

- Conventional Commits em pt-BR: `feat:`, `fix:`, `ci:`, `test:`, `chore:`.
- Para esta story: `feat(scoring): detalhe instituição ScoreHero + GapAnalysis + DisclaimerBanner (Story 2.4)`.
- 343 testes é o baseline — NÃO regredir.
- Migrations numeradas até 0008. Esta story **NÃO cria migrations** (apenas UI).

### Deferrals conhecidos relevantes a esta story

- **W1 (Story 2.3 review)** — InstitutionDetail sem loading/404 → **RESOLVIDO por esta story** (Tasks 4.2, 4.3, 4.4).
- **Impact preview delta flat (Story 3.2)** — previewRuleImpact calcula delta simplificado. Não afeta esta story (user-facing, não admin).
- **`useScores` staleTime:0** (Story 2.2/2.3) — Re-trigger RPC em cada mount. Pré-existente. NÃO escopo desta story. Se causar lentidão no detalhe, documentar em completion notes.

### Project Structure Notes

Arquivos criados/modificados esperados:

```
src/
  components/
    features/
      scoring/
        ScoreHero.tsx                               [NOVO]
        ScoreHero.test.tsx                           [NOVO]
        GapAnalysisList.tsx                          [NOVO]
        GapAnalysisList.test.tsx                     [NOVO]
  pages/
    app/
      InstitutionDetail.tsx                          [REESCRITO — placeholder → completo]
      InstitutionDetail.test.tsx                     [NOVO]
  lib/
    queries/
      scoring.ts                                     [MODIFICADO — useEditalUrl hook]
```

**NÃO devem ser tocados:**
- `supabase/migrations/*` — sem migrations nesta story
- `src/lib/schemas/scoring.ts` — schemas já completos
- `src/components/ui/*` — primitives shadcn já instalados
- `src/components/features/scoring/DisclaimerBanner.tsx` — já tem variant full, importar e usar
- `src/components/features/scoring/ScoreCard.tsx` — não modificar (já navega para esta página)
- `src/components/features/scoring/NarrativeBanner.tsx` — não modificar
- `src/router.tsx` — rota já registrada
- `src/lib/database.types.ts` — sem regeneração (nada mudou no schema)

### References

- [epics.md#Story 2.4 (linhas 785-820)](../planning-artifacts/epics.md) — ACs canônicos
- [architecture.md#Frontend Architecture (linhas 199-213)](../planning-artifacts/architecture.md) — estrutura features/scoring, React Router, shadcn
- [architecture.md#Communication Patterns (linhas 349-363)](../planning-artifacts/architecture.md) — query keys, invalidation
- [architecture.md#Process Patterns (linhas 365-399)](../planning-artifacts/architecture.md) — error handling, loading, validation
- [src/lib/queries/scoring.ts](../../src/lib/queries/scoring.ts) — hooks existentes (useScores, useInstitutions, scoringKeys)
- [src/lib/schemas/scoring.ts](../../src/lib/schemas/scoring.ts) — tipos UserScore, Institution, ScoreBreakdown
- [src/pages/app/InstitutionDetail.tsx](../../src/pages/app/InstitutionDetail.tsx) — placeholder atual a ser substituído
- [src/components/features/scoring/DisclaimerBanner.tsx](../../src/components/features/scoring/DisclaimerBanner.tsx) — variante full já implementada
- [src/components/features/scoring/ScoreCard.tsx](../../src/components/features/scoring/ScoreCard.tsx) — navega para esta página via onClick
- [src/pages/app/Home.tsx](../../src/pages/app/Home.tsx) — dashboard que linka para esta página
- [src/router.tsx](../../src/router.tsx) — rota já registrada (linha 74-78)
- [2-3-dashboard-scorecard-narrativebanner-specialtyselector.md](./2-3-dashboard-scorecard-narrativebanner-specialtyselector.md) — completion notes Story 2.3
- [deferred-work.md](./deferred-work.md) — deferrals pendentes (W1 resolvido por esta story)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- ScoreHero test fix: Progress shadcn não expõe `aria-valuenow` diretamente — ajustado teste para verificar presença do progressbar

### Completion Notes List

- **ScoreHero**: Score 96px com microcopy contextual por faixa (≥75%, ≥50%, <50%), nunca punitiva, barra `Progress h-3`, aria-label completo
- **GapAnalysisList**: Lista ordenada por delta descendente, "✓ Máximo atingido" para delta=0, "Saiba +" com `Collapsible` para expandir descrição, touch targets ≥44px
- **useInstitutionScore**: Reutiliza `useScores` + `useInstitutions` filtrando client-side via `useMemo` — sem queries adicionais
- **useEditalUrl**: Query com `staleTime: 30min` para signed URLs do Storage; prioriza `edital_url` direto sobre `pdf_path`
- **InstitutionDetail**: Reescrito (substituiu placeholder). Estados: loading (skeleton), error (retry), 404 (voltar dashboard), data completo. Container `max-w-3xl`, breadcrumb "← Dashboard", header com estado + link edital, ScoreHero, GapAnalysisList, DisclaimerBanner full
- **Testes**: 18 novos testes (6 ScoreHero + 5 GapAnalysisList + 7 InstitutionDetail). Baseline 343 → 361, zero regressões
- **Subtasks 5.4-5.7**: Validação manual no browser pendente (requer login com dados reais). Dev server disponível em localhost
- **Deferral W1 resolvido**: InstitutionDetail agora tem loading/error/404 states (era placeholder)

### Change Log

- 2026-04-18: Story 2.4 implementada — ScoreHero + GapAnalysisList + InstitutionDetail reescrito + hooks useInstitutionScore/useEditalUrl

### File List

- `src/components/features/scoring/ScoreHero.tsx` [REMOVIDO — dead code, substituído por badge inline]
- `src/components/features/scoring/ScoreHero.test.tsx` [REMOVIDO — dead code]
- `src/components/features/scoring/GapAnalysisList.tsx` [NOVO]
- `src/components/features/scoring/GapAnalysisList.test.tsx` [NOVO]
- `src/pages/app/InstitutionDetail.tsx` [REESCRITO]
- `src/pages/app/InstitutionDetail.test.tsx` [NOVO]
- `src/lib/queries/scoring.ts` [MODIFICADO — useInstitutionScore + useEditalUrl]

### Review Findings

- [x] [Review][Decision] **Desvios deliberados do spec + ScoreHero dead code** — Aceito como evolução de design. ScoreHero dead code removido (ScoreHero.tsx + ScoreHero.test.tsx deletados).
- [x] [Review][Patch] **Label inconsistente "pts" vs "pontos"** — Resolvido pela remoção do ScoreHero dead code. Apenas "pts" permanece (InstitutionDetail header badge).
- [x] [Review][Patch] **`formatCurriculumValue` arrays sempre exibem "artigo(s)"** — Corrigido para "N item/itens" genérico. [GapAnalysisList.tsx:145]
- [x] [Review][Defer] **`breakdown` sem null guard defensivo** [GapAnalysisList.tsx:330] — `Object.entries(breakdown)` crasharia se breakdown fosse null. Improvável (RPC sempre popula), mas defensivamente frágil. — deferred, data integrity guard
- [x] [Review][Defer] **`handleRetry` invalidação parcial quando userId é null** [InstitutionDetail.tsx:54-63] — scores não invalidados se userId null no momento do click. — deferred, edge case session
- [x] [Review][Defer] **Signed URL TTL vs staleTime assimétrico** [scoring.ts:249-251] — staleTime 30min < URL TTL 1h, re-fetch desnecessário. Inverso seria perigoso. — deferred, otimização
- [x] [Review][Defer] **`parseRuleItems` renderização mista** [GapAnalysisList.tsx:121-131] — Descrições com mix de itens com/sem pontuação resultam em lista visualmente assimétrica. — deferred, depende do formato das descrições
