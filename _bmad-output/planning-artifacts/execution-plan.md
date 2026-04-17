# Plano de Execução — Stories Epics 2–6

**Data:** 2026-04-16
**Contexto:** Epic 1 completo (11/11 done). 13 stories restantes organizadas em ondas.

---

## Regras de leitura

- **SEQUENCIAL (→):** A story da direita SÓ começa após a da esquerda estar done.
- **PARALELO (∥):** Stories na mesma onda podem rodar ao mesmo tempo, sem esperar uma pela outra.
- **Motivo:** Cada dependência tem justificativa técnica explícita.

---

## Dependências obrigatórias (hard dependencies)

| # | Antes | Depois | Motivo técnico |
|---|-------|--------|----------------|
| D1 | 2.1 | → 2.2 | `calculate_scores` precisa dos schemas Zod e do `user_curriculum` preenchido para testar |
| D2 | 2.2 | → 2.3 | Dashboard usa `useScores()` e `useInstitutions()` criados em 2.2 |
| D3 | 2.3 | → 2.4 | Detalhe da instituição é drill-down do dashboard (navegação `ScoreCard` → `/app/instituicoes/:id`) |
| D4 | 3.1 | → 3.2 | CRUD de regras precisa das tabs admin e do CRUD de instituições (select de instituição no form de regra) |
| D5 | 2.2 | → 3.2 | `ImpactPreviewDialog` usa `calculate_scores` para calcular deltas |
| D6 | 3.2 | → 3.3 | Histórico audita alterações de regras — precisa do CRUD de regras + trigger de audit |
| D7 | 4.1 | → 4.2 | Botões "Exportar CSV" e "Exportar Hubspot" vivem na página de leads |
| D8 | 6.1 | → 6.2 | Social proof + FAQ + footer ficam abaixo das seções de hero/preview |

---

## Ondas de execução

### ONDA 1 — Início imediato (depende apenas do Epic 1 done)

```
┌─────────────────────────────────────────────────┐
│  Executar em PARALELO:                          │
│                                                 │
│  Story 2.1  Formulário de currículo + autosave  │
│  Story 3.1  CRUD instituições + upload edital   │
│  Story 4.1  Página de leads completa            │
│  Story 5.1  Páginas termos + privacidade        │
│  Story 5.2  Exclusão LGPD completa              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Por que paralelo:** Nenhuma dessas stories depende de outra. Todas dependem exclusivamente de artefatos já entregues no Epic 1 (schemas, RLS, AuthContext, AdminShell, AppShell). Tocam domínios e arquivos completamente distintos:

| Story | Domínio | Arquivos principais |
|-------|---------|-------------------|
| 2.1 | Currículo (aluno) | `src/lib/schemas/curriculum.ts`, `src/lib/queries/curriculum.ts`, `src/components/features/curriculum/*`, `src/hooks/use-autosave.ts` |
| 3.1 | Admin instituições | `src/components/features/admin/Institution*`, `src/lib/queries/admin.ts` |
| 4.1 | Admin leads | `src/components/features/admin/Lead*`, `src/lib/queries/admin.ts` (seção leads) |
| 5.1 | Páginas públicas | `src/pages/Termos.tsx`, `src/pages/Privacidade.tsx` |
| 5.2 | Conta/LGPD | `src/pages/app/AccountSettings.tsx`, `supabase/functions/delete-account/`, migration benchmarks |

> **Nota para 1 dev:** Priorizar **2.1** como primeira (está no caminho crítico). Intercalar 3.1, 4.1, 5.1, 5.2 conforme conveniência.

---

### ONDA 2 — Após Onda 1

```
┌───────────────────────────────────────────────────────────┐
│  Pré-requisitos: 2.1 done, 3.1 done                      │
│                                                           │
│  Executar em PARALELO:                                    │
│                                                           │
│  Story 2.2  Motor de cálculo (DB Function + queries)      │
│  Story 4.2  Edge Function export-leads (CSV + Hubspot)    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Pré-requisitos específicos:**
- **2.2** precisa de: 2.1 done (D1)
- **4.2** precisa de: 4.1 done (D7)

**Por que paralelo entre si:** 2.2 é backend PL/pgSQL + queries React Query no domínio scoring. 4.2 é Edge Function Deno no domínio leads. Zero sobreposição.

> **Nota para 1 dev:** Se 4.1 terminou na Onda 1, 4.2 pode entrar aqui. Se não, 4.2 entra quando 4.1 estiver done.

---

### ONDA 3 — Após Onda 2

```
┌───────────────────────────────────────────────────────────┐
│  Pré-requisitos: 2.2 done, 3.1 done                      │
│                                                           │
│  Executar em PARALELO:                                    │
│                                                           │
│  Story 2.3  Dashboard + ScoreCard + SpecialtySelector     │
│  Story 3.2  CRUD regras + ImpactPreview                   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Pré-requisitos específicos:**
- **2.3** precisa de: 2.2 done (D2)
- **3.2** precisa de: 3.1 done (D4) E 2.2 done (D5)

**Por que paralelo entre si:** 2.3 é frontend aluno (dashboard). 3.2 é frontend admin (editor de regras). Ambos consomem `useScores`/`calculate_scores` de 2.2 mas não se tocam.

---

### ONDA 4 — Após Onda 3

```
┌───────────────────────────────────────────────────────────┐
│  Pré-requisitos: 2.3 done, 3.2 done                      │
│                                                           │
│  Executar em PARALELO:                                    │
│                                                           │
│  Story 2.4  Detalhe instituição + GapAnalysis             │
│  Story 3.3  Log/histórico de alterações                   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Pré-requisitos específicos:**
- **2.4** precisa de: 2.3 done (D3)
- **3.3** precisa de: 3.2 done (D6)

**Por que paralelo entre si:** 2.4 é frontend aluno (detalhe). 3.3 é migration + frontend admin (audit log). Domínios distintos.

---

### ONDA 5 — Pós-MVP (após Epics 1–5 completos)

```
┌───────────────────────────────────────────────────────────┐
│  Pré-requisitos: TODOS os Epics 1–5 done                  │
│                                                           │
│  SEQUENCIAL:                                              │
│                                                           │
│  Story 6.1  Landing completa (hero + como funciona)       │
│       │                                                   │
│       ▼                                                   │
│  Story 6.2  Social proof + FAQ + footer                   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Por que sequencial:** 6.2 (footer/FAQ) fica abaixo das seções de 6.1 (hero/preview) e precisa delas renderizadas para testar layout (D8). Ambas precisam de screenshots reais do dashboard (Epic 2 done) e links para termos (5.1 done).

---

## Caminho crítico

A sequência mais longa que define o prazo mínimo do projeto:

```
2.1 → 2.2 → 2.3 → 2.4    (4 stories sequenciais)
```

Todas as outras trilhas são mais curtas:
- Epic 3: 3.1 → 3.2 → 3.3 (3 stories, mas 3.2 espera 2.2 também)
- Epic 4: 4.1 → 4.2 (2 stories)
- Epic 5: 5.1 e 5.2 independentes (1 story cada)
- Epic 6: 6.1 → 6.2 (2 stories, pós-MVP)

---

## Visão consolidada (diagrama)

```
          ONDA 1              ONDA 2         ONDA 3         ONDA 4       ONDA 5
     (início imediato)                                                  (pós-MVP)

     ┌──── 2.1 ──────────→ 2.2 ──────────→ 2.3 ──────→ 2.4
     │                      │
     ├──── 3.1 ─────────────┼────────────→ 3.2 ──────→ 3.3
     │                      │               ▲
     │                      └───────────────┘ (D5)
     │
E1 ──┤
     ├──── 4.1 ──────────→ 4.2
     │
     ├──── 5.1 ────────────────────────────────────────────────────→ 6.1 → 6.2
     │
     └──── 5.2
```

---

## Sequência recomendada para 1 dev

Para um desenvolvedor solo, a ordem sugerida otimiza o caminho crítico:

| Ordem | Story | Epic | Onda |
|:-----:|-------|:----:|:----:|
| 1 | **2.1** Formulário currículo + autosave | 2 | 1 |
| 2 | **3.1** CRUD instituições + upload edital | 3 | 1 |
| 3 | **5.1** Termos + Privacidade | 5 | 1 |
| 4 | **2.2** Motor de cálculo | 2 | 2 |
| 5 | **4.1** Página de leads | 4 | 1* |
| 6 | **5.2** Exclusão LGPD | 5 | 1* |
| 7 | **2.3** Dashboard | 2 | 3 |
| 8 | **3.2** CRUD regras + ImpactPreview | 3 | 3 |
| 9 | **4.2** Export CSV/Hubspot | 4 | 2* |
| 10 | **2.4** Detalhe instituição | 2 | 4 |
| 11 | **3.3** Histórico | 3 | 4 |
| 12 | **6.1** Landing completa | 6 | 5 |
| 13 | **6.2** Social proof + FAQ + footer | 6 | 5 |

*\* Onda indica quando a story PODE começar; a ordem acima indica a sequência recomendada para 1 dev priorizando o caminho crítico (Epic 2).*

**Lógica:** Destravar 2.1 primeiro (caminho crítico). Enquanto 2.1 solidifica, fazer 3.1 e 5.1 (stories leves e independentes). Depois manter Epic 2 como trilha principal (2.2 → 2.3 → 2.4), intercalando stories dos outros Epics nos intervalos.
