# Sprint Change Proposal — Consolidação de Stories (Epics 2–5)

**Data:** 2026-04-16
**Autor:** Rcfranco (via Correct Course workflow)
**Tipo de mudança:** Reorganização de backlog — fusão de stories com acoplamento forte
**Escopo:** Moderate — requer atualização de epics.md, sprint-status.yaml e regeneração de story files

---

## 1. Resumo do Issue

### Problema
As stories dos Epics 2–5 foram decompostas com granularidade excessiva durante o planejamento inicial. Várias stories descrevem partes inseparáveis da mesma feature (mesmo schema, mesmo componente, mesmo fluxo UX), criando overhead de contexto e handoff desnecessário para 1 dev.

### Evidências
- **Epic 2:** 11 stories para 4 features lógicas (formulário, cálculo, dashboard, detalhe)
- **Epic 4:** 6 stories para 1 página + 1 Edge Function
- Stories como 4.5 (CSV) e 4.6 (Hubspot) são literalmente a mesma função com parâmetro diferente
- Story 3.3 (upload PDF) é um campo dentro do form de Story 3.2 (CRUD instituições)
- Story 5.3 depende de 5.4 e vice-versa (delete-account copia para benchmarks antes de deletar)

### Contexto
Epic 1 está 100% entregue (11/11 stories done). O codebase tem contratos estáveis: schemas Supabase, RLS policies, AuthContext, ProtectedRoute, AppShell, AdminShell, Design System Medway, CI/CD. Nenhuma fusão proposta quebra esses contratos.

---

## 2. Impact Analysis

### Epic Impact

| Epic | Stories antes | Stories depois | Redução |
|------|:---:|:---:|:---:|
| Epic 2 | 11 | 4 | −7 (64%) |
| Epic 3 | 6 | 3 | −3 (50%) |
| Epic 4 | 6 | 2 | −4 (67%) |
| Epic 5 | 4 | 2 | −2 (50%) |
| **Total** | **27** | **11** | **−16 (59%)** |

### Artifact Impact
- **epics.md:** Reescrever seções dos Epics 2–5 com stories consolidadas
- **sprint-status.yaml:** Atualizar IDs e status das stories
- **Story files:** Regenerar via `bmad-create-story` para as 11 stories consolidadas
- **PRD:** Sem impacto — todos os FRs continuam cobertos
- **Architecture:** Sem impacto — nenhuma decisão arquitetural muda
- **UX Design Spec:** Sem impacto — componentes continuam os mesmos

### FR Coverage — Verificação de rastreabilidade

| FR | Story atual | Story consolidada | Status |
|---|---|---|---|
| FR7 | 2.2 | NEW 2.1 | ✅ Coberto |
| FR8 | 2.2 | NEW 2.1 | ✅ Coberto |
| FR9 | 2.3 | NEW 2.1 | ✅ Coberto |
| FR10 | 2.4 | NEW 2.1 | ✅ Coberto |
| FR11 | 2.5 | NEW 2.2 | ✅ Coberto |
| FR12 | 2.7 | NEW 2.3 | ✅ Coberto |
| FR13 | 2.9 | NEW 2.4 | ✅ Coberto |
| FR14 | 2.9 | NEW 2.4 | ✅ Coberto |
| FR15 | 2.10 | NEW 2.4 | ✅ Coberto |
| FR16 | 2.10 | NEW 2.4 | ✅ Coberto |
| FR17 | 2.7 | NEW 2.3 | ✅ Coberto |
| FR18 | 2.7 | NEW 2.3 | ✅ Coberto |
| FR19 | 2.7 | NEW 2.3 | ✅ Coberto |
| FR22 | 2.5 | NEW 2.2 | ✅ Coberto |
| FR25 | 3.2 | NEW 3.1 | ✅ Coberto |
| FR26 | 3.4 | NEW 3.2 | ✅ Coberto |
| FR27 | 3.3 | NEW 3.1 | ✅ Coberto |
| FR28 | 4.2 | NEW 4.1 | ✅ Coberto |
| FR29 | 4.5 | NEW 4.2 | ✅ Coberto |
| FR30 | 4.6 | NEW 4.2 | ✅ Coberto |
| FR31 | 4.1 | NEW 4.1 | ✅ Coberto |
| FR33 | 5.2, 5.3 | NEW 5.2 | ✅ Coberto |
| FR34 | 5.4 | NEW 5.2 | ✅ Coberto |

**Resultado: 0 FRs perdidos.** Todos os 23 FRs dos Epics 2–5 mantêm rastreabilidade.

---

## 3. Proposta Detalhada — Before/After

### Epic 2: Currículo, Cálculo e Dashboard (11 → 4 stories)

#### FUSÃO 2.A: Stories 2.1 + 2.2 + 2.3 + 2.4 → **NEW Story 2.1**

**NEW 2.1: Formulário de currículo completo com autosave**

| Aspecto | Detalhe |
|---------|---------|
| **Stories fundidas** | 2.1 (Queries/schemas currículo), 2.2 (Formulário accordion), 2.3 (Autosave + AutosaveIndicator), 2.4 (Resumo do currículo) |
| **Justificativa** | Schemas Zod e React Query hooks (2.1) existem exclusivamente para servir o formulário (2.2). Autosave (2.3) é comportamento integral — formulário sem autosave não é entregável. Resumo (2.4) é trivial (read-only dos mesmos dados, ~50 LOC). Do ponto de vista do usuário, é uma feature: "preencho meu currículo e ele salva sozinho". |
| **FRs cobertos** | FR7, FR8, FR9, FR10 |
| **Riscos** | Story é a maior da proposta. Mitiga-se porque: (a) o schema `user_curriculum` + `curriculum_fields` já existem (Story 1.10 done); (b) Zod + react-hook-form + React Query são padrões já usados no projeto; (c) pode ser implementada incrementalmente (schemas → form → autosave → resumo) sem necessidade de stories separadas. |
| **Dependências** | Story 1.10 (schema curriculum — done) |
| **Entregáveis** | `src/lib/schemas/curriculum.ts`, `src/lib/queries/curriculum.ts`, `src/components/features/curriculum/CurriculoFormSection.tsx`, `src/hooks/use-autosave.ts`, `src/components/features/curriculum/AutosaveIndicator.tsx`, rota `/app/curriculo` com resumo |

#### FUSÃO 2.B: Stories 2.5 + 2.6 → **NEW Story 2.2**

**NEW 2.2: Motor de cálculo — DB Function + trigger + queries frontend**

| Aspecto | Detalhe |
|---------|---------|
| **Stories fundidas** | 2.5 (DB Function calculate_scores + trigger mark_scores_stale), 2.6 (Queries/schemas scoring) |
| **Justificativa** | A camada de queries (2.6) é um wrapper direto sobre a DB Function (2.5). `useScores()` checa `stale` e invoca `calculate_scores` via RPC — são front e back da mesma feature. Separar cria uma story (2.6) que não pode ser testada end-to-end sem a outra (2.5). |
| **FRs cobertos** | FR11, FR22 |
| **Riscos** | Baixo. Migration SQL + 1 arquivo TS de queries. A complexidade real está na DB Function (PL/pgSQL), que é autocontida. |
| **Dependências** | Story 1.9 (scoring_rules schema — done), Story 1.10 (user_scores schema — done) |
| **Entregáveis** | `supabase/migrations/0005_calculate_scores.sql`, `src/lib/queries/scoring.ts`, `src/lib/schemas/scoring.ts`, testes pgTAP |

#### FUSÃO 2.C: Stories 2.7 + 2.8 + 2.11 → **NEW Story 2.3**

**NEW 2.3: Dashboard com ScoreCard + NarrativeBanner + SpecialtySelector + transição**

| Aspecto | Detalhe |
|---------|---------|
| **Stories fundidas** | 2.7 (Dashboard grid + ScoreCard + NarrativeBanner), 2.8 (SpecialtySelector inline), 2.11 (Transição fade+slide + skeleton) |
| **Justificativa** | SpecialtySelector (2.8) vive no header do AppShell e dispara invalidação de `useScores` — é um select com mutation, não uma story. Transição (2.11) é ~20 LOC de CSS/framer-motion no botão "Ver resultados" → dashboard. Ambos são microinterações inseparáveis da experiência do dashboard. |
| **FRs cobertos** | FR12, FR17, FR18, FR19 |
| **Riscos** | Médio-baixo. É a story mais visual (grid responsivo, 4 componentes custom). Mitiga-se porque todos os dados já vêm prontos da NEW 2.2 (queries scoring). |
| **Dependências** | NEW 2.2 (queries scoring) |
| **Entregáveis** | `src/components/features/scoring/ScoreCard.tsx`, `NarrativeBanner.tsx`, `SpecialtySelector.tsx`, `src/pages/app/Dashboard.tsx`, transição CSS |

#### FUSÃO 2.D: Stories 2.9 + 2.10 → **NEW Story 2.4**

**NEW 2.4: Detalhe da instituição — ScoreHero + GapAnalysis + DisclaimerBanner**

| Aspecto | Detalhe |
|---------|---------|
| **Stories fundidas** | 2.9 (Detalhe instituição + ScoreHero + GapAnalysisList), 2.10 (DisclaimerBanner + link edital) |
| **Justificativa** | DisclaimerBanner (2.10) é um componente de ~30 LOC que aparece dentro da tela de detalhe (2.9). O link para edital é um `<a>` no header do detalhe. Não justifica story separada — é parte integrante da tela. |
| **FRs cobertos** | FR13, FR14, FR15, FR16 |
| **Riscos** | Baixo. Tela de detalhe consome os mesmos hooks de `useScores` + `useInstitutions` da NEW 2.2. |
| **Dependências** | NEW 2.2 (queries scoring), NEW 2.3 (dashboard — navegação "ver detalhes") |
| **Entregáveis** | `src/components/features/scoring/ScoreHero.tsx`, `GapAnalysisList.tsx`, `DisclaimerBanner.tsx`, rota `/app/instituicoes/:id` |

---

### Epic 3: Admin — Motor de Regras e Editais (6 → 3 stories)

#### FUSÃO 3.A: Stories 3.1 + 3.2 + 3.3 → **NEW Story 3.1**

**NEW 3.1: Navegação admin + CRUD de instituições + upload de edital**

| Aspecto | Detalhe |
|---------|---------|
| **Stories fundidas** | 3.1 (AdminShell tabs + guard), 3.2 (CRUD instituições), 3.3 (Upload/vínculo PDF edital) |
| **Justificativa** | AdminShell com guard já foi entregue na Story 1.8 — o que resta em 3.1 é adicionar tabs de navegação (~30 LOC). Upload de PDF (3.3) é um campo dentro do formulário de edição de instituição (3.2) — separar significa entregar um form de instituição sem poder anexar edital, o que é incompleto do ponto de vista de produto. |
| **FRs cobertos** | FR25, FR27 |
| **Riscos** | Baixo. Upload usa Supabase Storage com bucket `editais` já criado (Story 1.10 done). O CRUD é PostgREST padrão + React Query + formulário Zod. |
| **Dependências** | Story 1.8 (AdminShell — done), Story 1.10 (bucket editais — done) |
| **Entregáveis** | Tabs no AdminShell, `src/components/features/admin/InstitutionForm.tsx`, `InstitutionTable.tsx`, `src/lib/queries/admin.ts`, upload para Storage |

#### FUSÃO 3.B: Stories 3.4 + 3.5 → **NEW Story 3.2**

**NEW 3.2: CRUD de regras com AdminRuleEditor + ImpactPreview**

| Aspecto | Detalhe |
|---------|---------|
| **Stories fundidas** | 3.4 (CRUD regras + AdminRuleEditor), 3.5 (ImpactPreviewDialog) |
| **Justificativa** | O ImpactPreviewDialog é disparado pelo botão "Publicar" do AdminRuleEditor — é o passo de confirmação do mesmo fluxo. Entregar o editor sem preview seria funcional mas violaria a jornada do admin descrita no PRD ("preview de impacto antes de publicar"). Entregar preview sem editor não faz sentido. |
| **FRs cobertos** | FR26 |
| **Riscos** | Médio. A preview function que calcula deltas é lógica nova. Mas pode ser uma query simples: contar users com `user_curriculum.data ? field_key` para a instituição, e calcular amostra de 5 via `calculate_scores` em modo dry-run. |
| **Dependências** | NEW 3.1 (tabs de navegação), NEW 2.2 (DB Function calculate_scores) |
| **Entregáveis** | `src/components/features/admin/AdminRuleEditor.tsx`, `ImpactPreviewDialog.tsx`, `RulesTable.tsx` |

#### MANTIDA: Story 3.6 → **NEW Story 3.3**

**NEW 3.3: Log/histórico de alterações de regras**

| Aspecto | Detalhe |
|---------|---------|
| **Por que não fundir** | Requer migration própria (tabela `scoring_rules_audit` + trigger `audit_scoring_rules`), UI própria (aba Histórico com timeline + expand old/new), e funcionalidade de reverter. É um módulo independente com escopo bem definido e sem acoplamento direto com o CRUD de regras em si. Fundir com 3.2 criaria uma story grande demais. |
| **FRs cobertos** | Nenhum FR explícito — é requisito de auditoria do PRD (jornada admin "log de auditoria") |
| **Dependências** | NEW 3.2 (trigger de audit precisa do CRUD de regras funcionando) |

---

### Epic 4: Admin — Gestão e Exportação de Leads (6 → 2 stories)

#### FUSÃO 4.A: Stories 4.1 + 4.2 + 4.3 + 4.4 → **NEW Story 4.1**

**NEW 4.1: Página de leads completa — tabela + filtros + métricas + drawer**

| Aspecto | Detalhe |
|---------|---------|
| **Stories fundidas** | 4.1 (Métricas header), 4.2 (LeadTable paginação), 4.3 (Filtros server-side + chips + URL params), 4.4 (Drawer detalhe lead) |
| **Justificativa** | São todas partes da **mesma página** `/admin/leads`. Métricas (4.1) são 4 cards de query agregada acima da tabela. Filtros (4.3) são o header da tabela (4.2). Drawer (4.4) é o click handler de uma linha da tabela. Nenhum desses componentes tem valor isolado — juntos formam a experiência de gestão de leads. Entregar a tabela sem filtros ou sem métricas seria uma experiência incompleta. |
| **FRs cobertos** | FR28, FR31 |
| **Riscos** | Médio. É uma página densa (TanStack DataTable + paginação server-side + filtros + URL params). Mitiga-se com: (a) TanStack Table é bem documentado; (b) filtros server-side são queries PostgREST padrão; (c) pode implementar incrementalmente (tabela → filtros → métricas → drawer). |
| **Dependências** | Story 1.3 (profiles schema — done), NEW 3.1 (tabs admin) |
| **Entregáveis** | `src/components/features/admin/LeadTable.tsx`, `LeadMetrics.tsx`, `LeadDrawer.tsx`, `src/lib/queries/admin.ts` (leads section) |

#### FUSÃO 4.B: Stories 4.5 + 4.6 → **NEW Story 4.2**

**NEW 4.2: Edge Function export-leads — CSV + formato Hubspot**

| Aspecto | Detalhe |
|---------|---------|
| **Stories fundidas** | 4.5 (Export CSV padrão), 4.6 (Export formato Hubspot) |
| **Justificativa** | É literalmente a **mesma Edge Function** (`supabase/functions/export-leads/`). A diferença é um `if (format === 'hubspot')` que mapeia headers para `First Name,Last Name,Email,...` e formata telefone em E.164. Ter 2 stories para 1 função com 2 branches é fatiamento artificial. |
| **FRs cobertos** | FR29, FR30 |
| **Riscos** | Baixo. Edge Function isolada com lógica de formatação simples. |
| **Dependências** | NEW 4.1 (botões "Exportar CSV" e "Exportar Hubspot" vivem na página de leads) |
| **Entregáveis** | `supabase/functions/export-leads/index.ts`, `_shared/` helpers, botões de export no LeadTable |

---

### Epic 5: LGPD — Compliance e Direito ao Esquecimento (4 → 2 stories)

#### MANTIDA: Story 5.1 → **NEW Story 5.1**

**NEW 5.1: Páginas públicas Termos de Uso + Política de Privacidade**

| Aspecto | Detalhe |
|---------|---------|
| **Por que não fundir** | São rotas públicas (`/termos`, `/privacidade`) com conteúdo jurídico estático. Não têm acoplamento com a funcionalidade de exclusão (5.2+5.3+5.4). São linkadas desde o cadastro (Story 1.5 done — "Aceito os Termos de Uso e a Política de Privacidade"). Podem ser implementadas em qualquer momento sem dependência. |
| **FRs cobertos** | (Complementa FR32 — links já existem no cadastro, faltam as páginas de destino) |

#### FUSÃO 5.A: Stories 5.2 + 5.3 + 5.4 → **NEW Story 5.2**

**NEW 5.2: Exclusão de conta LGPD — AccountSettings + Edge Function + benchmarks anonimizados**

| Aspecto | Detalhe |
|---------|---------|
| **Stories fundidas** | 5.2 (AccountSettings + fluxo exclusão), 5.3 (Edge Function delete-account), 5.4 (Views materializadas benchmarks) |
| **Justificativa** | Dependência circular: delete-account (5.3) precisa copiar para benchmarks (5.4) ANTES de deletar; AccountSettings (5.2) é o único consumidor de delete-account. Story 5.4 sozinha não tem valor de produto (views sem dados não servem). Story 5.3 sozinha não pode ser testada sem UI (5.2) nem sem destino de anonimização (5.4). As três juntas formam o fluxo completo de LGPD. |
| **FRs cobertos** | FR33, FR34 |
| **Riscos** | Médio. Envolve: migration (views materializadas + tabela `account_deletions`), Edge Function (Deno, cascade delete + admin API), UI (AccountSettings + dialog de confirmação). Mitiga-se porque: (a) cascade delete é SQL direto; (b) views materializadas são queries de agregação; (c) UI é 1 página com 1 dialog. |
| **Dependências** | Story 1.3 (profiles schema — done), NEW 2.1 (user_curriculum precisa existir para ter dados a deletar — mas pode usar dados mock para testar) |
| **Entregáveis** | `src/pages/app/AccountSettings.tsx`, `supabase/functions/delete-account/index.ts`, migration com views materializadas + tabela `account_deletions` |

---

## 4. Resumo Before/After

### Epic 2: Currículo, Cálculo e Dashboard

| ANTES | DEPOIS |
|-------|--------|
| 2.1 Queries/schemas currículo | **2.1 Formulário de currículo completo com autosave** |
| 2.2 Formulário accordion | ↑ (fundida) |
| 2.3 Autosave + AutosaveIndicator | ↑ (fundida) |
| 2.4 Resumo do currículo | ↑ (fundida) |
| 2.5 DB Function calculate_scores + trigger | **2.2 Motor de cálculo — DB Function + trigger + queries** |
| 2.6 Queries/schemas scoring | ↑ (fundida) |
| 2.7 Dashboard grid + ScoreCard + NarrativeBanner | **2.3 Dashboard completo + SpecialtySelector + transição** |
| 2.8 SpecialtySelector inline | ↑ (fundida) |
| 2.11 Transição fade+slide | ↑ (fundida) |
| 2.9 Detalhe instituição + ScoreHero + GapAnalysis | **2.4 Detalhe instituição + DisclaimerBanner** |
| 2.10 DisclaimerBanner + link edital | ↑ (fundida) |

### Epic 3: Admin — Motor de Regras

| ANTES | DEPOIS |
|-------|--------|
| 3.1 AdminShell + navegação + guard | **3.1 Navegação admin + CRUD instituições + upload edital** |
| 3.2 CRUD instituições | ↑ (fundida) |
| 3.3 Upload PDF edital | ↑ (fundida) |
| 3.4 CRUD regras + AdminRuleEditor | **3.2 CRUD regras + ImpactPreview** |
| 3.5 ImpactPreviewDialog | ↑ (fundida) |
| 3.6 Log/histórico | **3.3 Log/histórico de alterações** (mantida) |

### Epic 4: Admin — Leads

| ANTES | DEPOIS |
|-------|--------|
| 4.1 Métricas header | **4.1 Página leads completa (tabela + filtros + métricas + drawer)** |
| 4.2 LeadTable paginação | ↑ (fundida) |
| 4.3 Filtros + chips + URL params | ↑ (fundida) |
| 4.4 Drawer detalhe lead | ↑ (fundida) |
| 4.5 Export CSV | **4.2 Edge Function export-leads (CSV + Hubspot)** |
| 4.6 Export Hubspot | ↑ (fundida) |

### Epic 5: LGPD

| ANTES | DEPOIS |
|-------|--------|
| 5.1 Páginas termos/privacidade | **5.1 Páginas termos/privacidade** (mantida) |
| 5.2 AccountSettings + exclusão | **5.2 Exclusão LGPD completa (Settings + Edge Function + benchmarks)** |
| 5.3 Edge Function delete-account | ↑ (fundida) |
| 5.4 Views materializadas benchmarks | ↑ (fundida) |

---

## 5. Impacto nos Artefatos

### sprint-status.yaml
- Remover 16 entradas de stories fundidas
- Renumerar para IDs consolidados (2.1–2.4, 3.1–3.3, 4.1–4.2, 5.1–5.2)
- Status de todas: `backlog` (nenhuma foi iniciada)

### epics.md
- Reescrever seções dos Epics 2–5 com as 11 stories consolidadas
- Manter Epic 1 e Epic 6 intactos
- Atualizar FR Coverage Map (mesmos FRs, novos IDs de stories)

### Story files
- Nenhum story file existe ainda para Epics 2–5 (todos em `backlog` no sprint-status)
- Serão criados via `bmad-create-story` quando forem para `ready-for-dev`

---

## 6. Recomendação

**Caminho recomendado: Ajuste Direto (Option 1)**

- **Esforço:** Baixo — atualizar 2 arquivos (epics.md, sprint-status.yaml)
- **Risco:** Baixo — nenhuma story foi iniciada, não há código a reconciliar
- **Impacto no MVP:** Positivo — menos overhead de contexto, implementação mais fluida

### Atualização 2026-04-16: Epic 6 também consolidado (6 → 2 stories)

| ANTES | DEPOIS |
|-------|--------|
| 6.1 Hero redesign | **6.1 Landing completa — hero + como funciona + preview** |
| 6.2 "Como funciona" | ↑ (fundida) |
| 6.3 Preview dashboard | ↑ (fundida) |
| 6.4 Social proof | **6.2 Social proof + FAQ + footer** |
| 6.5 FAQ | ↑ (fundida) |
| 6.6 Footer | ↑ (fundida) |

**Total final do projeto: 44 → 24 stories (−20, 45% de redução)**

---

## 7. Mapa de Dependências e Paralelismo

### Legenda
- **→** dependência obrigatória (B só começa após A terminar)
- **∥** podem rodar em paralelo
- **Onda** = grupo de stories que pode ser executado simultaneamente

### Grafo de dependências

```
Epic 1 (DONE) ─────┬──→ Story 2.1 (Formulário currículo)
                    │         │
                    │         ▼
                    ├──→ Story 2.2 (Motor de cálculo)
                    │         │
                    │         ▼
                    │    Story 2.3 (Dashboard) ──→ Story 2.4 (Detalhe instituição)
                    │
                    ├──→ Story 3.1 (CRUD instituições) ──→ Story 3.2 (CRUD regras) ──→ Story 3.3 (Histórico)
                    │
                    ├──→ Story 4.1 (Página leads) ──→ Story 4.2 (Export CSV/Hubspot)
                    │
                    ├──→ Story 5.1 (Termos/Privacidade)
                    │
                    └──→ Story 5.2 (Exclusão LGPD)

Epic 6 depende de Epics 1–5 completos:
                    Story 6.1 (Landing completa) ──→ Story 6.2 (Social proof + FAQ + footer)
```

### Ondas de execução (para 1 dev)

| Onda | Stories em paralelo | Justificativa |
|:----:|---------------------|---------------|
| **1** | **2.1** ∥ **3.1** ∥ **5.1** | Zero dependências cruzadas. 2.1 é frontend currículo, 3.1 é admin instituições, 5.1 são páginas estáticas. Domínios diferentes, arquivos diferentes. |
| **2** | **2.2** ∥ **3.2** ∥ **4.1** ∥ **5.2** | 2.2 depende de 2.1 (schemas). 3.2 depende de 3.1 (tabs/instituições). 4.1 e 5.2 só dependem de Epic 1. Todos tocam domínios distintos. |
| **3** | **2.3** ∥ **3.3** ∥ **4.2** | 2.3 depende de 2.2 (scores). 3.3 depende de 3.2 (regras). 4.2 depende de 4.1 (página leads). |
| **4** | **2.4** | Depende de 2.3 (dashboard entrega a navegação "ver detalhes"). Última story do fluxo aluno. |
| **5** | **6.1** → **6.2** | Pós-MVP. Depende de Epics 1–5 completos (screenshots reais, dados de uso, termos publicados). |

### Tabela de dependências por story

| Story | Depende de | Libera |
|-------|-----------|--------|
| **2.1** Formulário currículo | Epic 1 (done) | 2.2 |
| **2.2** Motor de cálculo | 2.1 | 2.3, 3.2 (preview usa calculate_scores) |
| **2.3** Dashboard | 2.2 | 2.4 |
| **2.4** Detalhe instituição | 2.3 | — |
| **3.1** CRUD instituições | Epic 1 (done) | 3.2 |
| **3.2** CRUD regras + ImpactPreview | 3.1, 2.2 (preview function) | 3.3 |
| **3.3** Histórico | 3.2 | — |
| **4.1** Página leads | Epic 1 (done) | 4.2 |
| **4.2** Export CSV/Hubspot | 4.1 | — |
| **5.1** Termos/Privacidade | Epic 1 (done) | 6.2 (links no footer) |
| **5.2** Exclusão LGPD | Epic 1 (done) | — |
| **6.1** Landing completa | Epics 1–5 (screenshots) | 6.2 |
| **6.2** Social proof + FAQ + footer | 6.1, 5.1 (links termos) | — |

### Recomendação para 1 dev (caminho crítico)

O **caminho crítico** (sequência mais longa) é:

```
2.1 → 2.2 → 2.3 → 2.4   (4 stories sequenciais — trilha aluno)
```

Recomendação: **priorizar a trilha aluno (Epic 2)** como linha principal, intercalando stories de outros epics nos momentos de espera ou como quebra de contexto:

1. Começar por **2.1** (formulário) — é o alicerce de tudo
2. Enquanto testa 2.1, pode criar **3.1** (CRUD instituições) ou **5.1** (termos) como troca de contexto
3. Seguir com **2.2** (cálculo) → **2.3** (dashboard) → **2.4** (detalhe)
4. Intercalar **3.2**, **4.1**, **5.2** entre as stories do Epic 2
5. Fechar com **3.3**, **4.2** (stories finais de cada trilha admin)
6. Epic 6 fica para pós-MVP conforme já planejado

### Handoff
- **Escopo:** Moderate
- **Responsável:** Rcfranco (PO/Dev)
- **Critério de sucesso:** epics.md e sprint-status.yaml atualizados; 0 FRs perdidos; stories prontas para `bmad-create-story`
- **Status:** ✅ Artefatos atualizados em 2026-04-16
