---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# curriculo-medway - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **curriculo-medway** (Medway Currículo), decomposing the requirements from the PRD, UX Design Specification, and Architecture Decision Document into implementable stories.

## Requirements Inventory

### Functional Requirements

**Acesso Público e Captação:**

- **FR1:** Visitante pode visualizar landing page com proposta de valor do produto
- **FR2:** Visitante pode se cadastrar fornecendo nome, email, telefone, estado, faculdade, ano de formação e especialidade desejada
- **FR3:** Visitante deve aceitar termos de uso e política de privacidade antes de concluir cadastro
- **FR4:** Usuário cadastrado pode fazer login para acessar a área autenticada
- **FR5:** Usuário cadastrado pode fazer logout
- **FR6:** Usuário cadastrado pode recuperar senha

**Gestão de Currículo:**

- **FR7:** Aluno pode preencher formulário de currículo com dados de publicações, acadêmico, prática/social, liderança/eventos e perfil de formação
- **FR8:** Aluno pode editar dados do currículo a qualquer momento
- **FR9:** Dados do currículo são persistidos automaticamente (sem perda ao fechar navegador)
- **FR10:** Aluno pode visualizar um resumo dos dados preenchidos no currículo

**Cálculo e Resultados:**

- **FR11:** Sistema calcula scores do aluno para cada instituição com base nas regras do motor de regras
- **FR12:** Aluno pode visualizar scores de todas as 11 instituições disponíveis
- **FR13:** Aluno pode visualizar detalhes do score por categoria dentro de cada instituição
- **FR14:** Aluno pode visualizar gap analysis — pontos possíveis de ganhar por categoria em cada instituição
- **FR15:** Aluno pode visualizar disclaimer informando que scores são estimativas baseadas em editais públicos
- **FR16:** Aluno pode acessar o edital original de cada instituição (link ou PDF)

**Dashboard do Aluno:**

- **FR17:** Aluno pode visualizar dashboard consolidado com visão geral de todos os scores
- **FR18:** Aluno pode identificar rapidamente instituições onde tem melhor e pior desempenho
- **FR19:** Aluno pode expandir detalhes de cada instituição a partir do dashboard

**Motor de Regras:**

- **FR20:** Sistema suporta regras de cálculo configuráveis por instituição
- **FR21:** Sistema suporta variações de regras por especialidade dentro da mesma instituição
- **FR22:** Alteração de regras recalcula scores dos alunos na próxima sessão
- **FR23:** Cada regra define: campo do currículo, peso/pontuação, valor máximo e descrição da regra
- **FR24:** Sistema suporta adição de novas instituições sem alteração de código

**Painel Administrativo:**

- **FR25:** Admin pode criar, editar e remover instituições
- **FR26:** Admin pode criar, editar e remover regras de cálculo por instituição e especialidade
- **FR27:** Admin pode fazer upload ou vincular PDF de edital por instituição
- **FR28:** Admin pode visualizar lista de leads cadastrados com filtros
- **FR29:** Admin pode exportar leads em formato CSV
- **FR30:** Admin pode exportar leads para integração com Hubspot
- **FR31:** Admin pode visualizar métricas básicas de captação (total de cadastros, cadastros por período)

**Compliance e Privacidade:**

- **FR32:** Sistema exibe termos de uso e política de privacidade no fluxo de cadastro
- **FR33:** Usuário pode solicitar exclusão de seus dados (direito ao esquecimento — LGPD)
- **FR34:** Dados utilizados em comparações futuras são agregados e anonimizados

### NonFunctional Requirements

**Performance:**

- **NFR1:** Landing page carrega em menos de 2 segundos (SSG)
- **NFR2:** Área autenticada carrega em menos de 3 segundos
- **NFR3:** Cálculo de scores completa em menos de 1 segundo após preenchimento
- **NFR4:** Exportação de leads (CSV) processa até 10.000 registros em menos de 10 segundos
- **NFR5:** Formulário de currículo salva dados com feedback visual em menos de 500ms

**Segurança:**

- **NFR6:** Dados pessoais armazenados com criptografia em repouso (Supabase Postgres)
- **NFR7:** Comunicação entre cliente e servidor via HTTPS (TLS 1.2+)
- **NFR8:** Autenticação gerenciada pelo Supabase Auth com tokens JWT
- **NFR9:** Painel administrativo acessível apenas por usuários com role admin
- **NFR10:** Senhas armazenadas com hash seguro (bcrypt via Supabase Auth)
- **NFR11:** Dados de leads acessíveis apenas por admin, nunca expostos a alunos

**Escalabilidade:**

- **NFR12:** Sistema suporta até 1.000 usuários cadastrados no primeiro trimestre sem degradação
- **NFR13:** Sistema suporta até 10.000 usuários cadastrados no primeiro ano sem necessidade de reescrita
- **NFR14:** Banco de dados dimensionado para crescimento (Supabase plano gratuito → Pro conforme demanda)

**Acessibilidade:**

- **NFR15:** Contraste de cores adequado para leitura (ratio mínimo 4.5:1 para texto)
- **NFR16:** Formulários com labels associadas a inputs
- **NFR17:** Navegação por teclado funcional em todas as telas
- **NFR18:** Textos com tamanho mínimo legível (14px corpo, 12px secundário)

**Integração:**

- **NFR19:** Exportação de leads compatível com formato de importação do Hubspot
- **NFR20:** Upload de PDFs de editais via Supabase Storage com limite de 10MB por arquivo
- **NFR21:** Links externos para editais abrem em nova aba

**Disponibilidade:**

- **NFR22:** Uptime mínimo de 99% (dependente de SLA Supabase e Railway/GCloud)
- **NFR23:** Backups automáticos do banco de dados (Supabase nativo)

### Additional Requirements

**Contexto Brownfield:**

- Projeto parte de protótipo Lovable existente (Vite + React 18 + TypeScript + Tailwind + shadcn/ui); a primeira história NÃO é bootstrap, e sim setup Supabase + limpeza de código residual do Lovable
- Cálculo atualmente client-side em `src/lib/calculations.ts` precisa ser migrado para backend (Database Function Postgres)
- Seed inicial de regras deve ser extraído de `src/lib/calculations.ts` para `supabase/seeds/*.sql`

**Backend Supabase (a configurar):**

- Criar 3 projetos Supabase: local (CLI), staging, production
- Schema base via migrations: `profiles` (com coluna `role` student/admin), `institutions`, `specialties`, `scoring_rules` (híbrido relacional + JSONB `formula`), `curriculum_fields`, `user_curriculum`, `user_scores` (com flag `stale`)
- RLS policies por tabela: aluno lê apenas próprios dados; admin tem acesso de escrita a regras/instituições/leads
- Database Function `calculate_scores(user_id)` em PL/pgSQL chamada via RPC
- Trigger `on_scoring_rule_updated` marca `user_scores.stale = true` nos users afetados
- Edge Functions (Deno): `export-leads` (CSV), `delete-account` (LGPD cascade delete); `calculate-scores` como fallback opcional
- Supabase Storage: bucket `editais` (PDFs, max 10MB)
- Geração automática de `src/lib/database.types.ts` via `supabase gen types` no CI

**Frontend e Integração:**

- Adicionar `@supabase/supabase-js` com cliente singleton em `src/lib/supabase.ts` (anon key apenas)
- Schemas Zod compartilhados em `src/lib/schemas/` entre client e Edge Functions
- React Query wrappers por domínio em `src/lib/queries/{auth,curriculum,scoring,admin}.ts`
- AuthContext escutando `onAuthStateChange` + ProtectedRoute HOC com parâmetro `role`
- SSG da landing via `vite-ssg` (fica como rota `/`)
- Reorganização do código em `src/components/features/{auth,curriculum,scoring,admin}/`

**Infraestrutura e Operação:**

- Deploy frontend: Vercel (substitui Railway sugerido no PRD) com previews automáticos por PR
- CI/CD: GitHub Actions com lint + test + build em PRs; deploy automático em merge para `main`; job que gera types Supabase e falha em drift
- Observabilidade: Sentry (frontend + Edge Functions) + Supabase Logs + UptimeRobot/Better Uptime
- Migrations via `supabase db push` em CI com approval manual em produção
- SLA operacional de 72h para atualização de regras após publicação de edital (requisito de processo, não de código)
- Sem PII em logs (email, telefone, nome, senha)

### UX Design Requirements

**Design System & Tokens (Tailwind + shadcn/ui):**

- **UX-DR1:** Configurar tokens Medway em `tailwind.config.ts` — paleta navy (900 #00205B, 700/800 variantes), teal (500 #01CFB5, 600 #01A695 para texto), neutrals (0 a 900), semânticos (success #10B981, warning âmbar #F59E0B, danger #DC2626 exclusivo erro, info #3B82F6); converter para HSL e mapear CSS vars do shadcn (`--primary`, `--accent`, `--background`, etc.)
- **UX-DR2:** Configurar tipografia Montserrat via `@fontsource/montserrat` com `font-display: swap` e preload dos pesos 400/500/600/700; escala tipográfica completa (display 48/56, h1 32, h2 24, h3 20, body-lg 18, body 16, body-sm 14, caption 12, score-hero 64/96) com tabular numerals em scores e datas
- **UX-DR3:** Configurar escala de espaçamento e border-radius (sm 4px, md 8px, lg 12px cards padrão, xl 16px modais); densidades distintas para aluno (`p-6`) vs admin (`p-3`/`p-4`)
- **UX-DR4:** Instalar/tematizar componentes shadcn/ui base necessários: Button, Input, Textarea, Select, Checkbox, Label, Form, Card, Dialog, Sheet, DropdownMenu, Tabs, Accordion, Table + TanStack DataTable, Toast (Sonner), Skeleton, Tooltip, Progress, Badge, Separator, Avatar, Popover, Alert, ScrollArea, Breadcrumb, Combobox
- **UX-DR5:** Dark mode preparado em CSS vars mas toggle oculto no MVP (pós-MVP)

**Componentes de Domínio (custom):**

- **UX-DR6:** Componente `ScoreCard` — card-unidade do dashboard (instituição h3 + score 48px + barra Progress + 1 linha gap + chevron); estados default/hover/focus/partial/empty/loading; anunciado via ARIA como "USP-RP, score 68 de 100, mais 32 possíveis em publicações, botão ver detalhes"
- **UX-DR7:** Componente `NarrativeBanner` — faixa de 1 linha acima do grid com destaque + oportunidade ("Você está mais competitivo em X. Maior oportunidade: +Y em Z"); ícone 🧭 + fundo `neutral.50`
- **UX-DR8:** Componente `GapAnalysisList` — lista de categorias em `ul`/`li` (nome + X/Y + mini-barra + delta possível + "Saiba +"); linha clicável expande explicação do edital
- **UX-DR9:** Componente `CurriculoFormSection` — accordion com autosave `onBlur`, contador de completude, indicador de save state; uma seção expandida por default, demais recolhidas
- **UX-DR10:** Componente `AdminRuleEditor` — editor de regra por instituição/especialidade com estados draft/published/dirty/publishing/error
- **UX-DR11:** Componente `ImpactPreviewDialog` — modal de confirmação pré-publicação com contagem de alunos afetados e amostra de 5 deltas antes do confirm
- **UX-DR12:** Componente `LeadTable` — DataTable TanStack com filtros server-side, paginação, chips removíveis, persistência via URL params, export CSV/Hubspot; drawer Sheet para detalhe
- **UX-DR13:** Componente `SpecialtySelector` — seletor inline no header do aluno que dispara recálculo global do dashboard
- **UX-DR14:** Componente `ScoreHero` — score grande (96px) no detalhe da instituição com microcopy contextual por faixa, nunca punitiva
- **UX-DR15:** Componente `AutosaveIndicator` — estados idle/saving/saved/error/offline com `aria-live="polite"`; sempre visível, nunca bloqueante
- **UX-DR16:** Componente `DisclaimerBanner` — aviso de estimativa discreto com link para edital original (abre em nova aba)

**Páginas e Layouts:**

- **UX-DR17:** Landing page via SSG (vite-ssg) com hero + proposta de valor + CTA "Começar"; max-w-5xl; meta tags + Open Graph + sitemap + robots.txt
- **UX-DR18:** Dashboard como primeira tela pós-login com grid 4 colunas (desktop xl+), 3 (tablet md/lg), 1 (mobile); header sticky 64/56px com logo + SpecialtySelector + Avatar; subheader com título + disclaimer compacto + faixa narrativa
- **UX-DR19:** Tela de detalhe da instituição com breadcrumb "← Dashboard" (máx 2 níveis), header com link externo do edital, ScoreHero 96px, lista vertical de categorias, disclaimer ao final
- **UX-DR20:** Formulário de currículo em container `max-w-3xl`, seções em accordion, CTA "Ver meus resultados" fixo no bottom com `safe-area-inset` em mobile
- **UX-DR21:** Fluxo de cadastro agrupado visualmente (7 campos + termos) em uma única tela, não wizard linear; pares em 2 colunas md+, `w-full` em mobile
- **UX-DR22:** Painel admin desktop-only no MVP (mobile mostra aviso não-bloqueante); header com logo + badge Admin + tabs + Avatar; densidade compacta

**Interações e Microinterações:**

- **UX-DR23:** Transição fade+slide ~200ms do formulário para o dashboard ("ver o farol acender"); skeletons dos 11 cards aparecem instantaneamente, populados em uma única atualização
- **UX-DR24:** Autosave silencioso com debounce 500ms + trigger `onBlur`/mudança de seção; retry em background; warning após 3 falhas; fallback local; toast discreto "Salvo há 2s" (nunca modal)
- **UX-DR25:** Delta temporal humanizado no retorno ("Seu score subiu +6 em USP-RP desde 12 de março"); microcopy, não badge
- **UX-DR26:** Estados de loading: skeleton shadcn obrigatório em toda transição >200ms (nunca spinner full-screen); spinner apenas inline em botões

**Acessibilidade (WCAG 2.1 AA — alvo do MVP):**

- **UX-DR27:** Focus ring visível em todos os elementos interativos (`ring-2 ring-teal-500 ring-offset-2`); skip link como primeiro tabbable; focus trap Radix em modais/dropdowns
- **UX-DR28:** Labels associadas via `htmlFor` em todos os inputs; erros com `aria-invalid` + `aria-describedby` + `role="alert"`; toasts com `role="status"`/`role="alert"`; loading com `aria-busy`
- **UX-DR29:** Touch targets ≥44px (WCAG 2.5.5); texto mínimo 16px corpo / 14px labels; sem hover-only em mobile; sem informação portada apenas por cor
- **UX-DR30:** Respeitar `prefers-reduced-motion` desabilitando animações; suporte a zoom 200% sem perda de funcionalidade; `lang="pt-BR"` no HTML
- **UX-DR31:** Tabela de leads com `thead`/`tbody`/`scope`/`aria-sort`; links externos indicam "abre em nova aba"; troca de especialidade anuncia "Scores atualizados" via aria-live

**Responsividade:**

- **UX-DR32:** Estratégia mobile-functional, desktop-first (CSS mobile-first, enhancement com `md:`/`lg:`/`xl:`); breakpoints Tailwind default; sem perda informacional em mobile; sem scroll horizontal inesperado (tabelas com `ScrollArea` explícito); CTAs fixos respeitam `safe-area-inset`

**Microcopy e Linguagem:**

- **UX-DR33:** Microcopy em pt-BR, 2ª pessoa direta, imperativo afirmativo; score baixo sempre em reframe de oportunidade ("espaço para crescer" > "gap"); sem vermelho para scores (usar navy.200 fundo + teal.500 progresso); sem jargão técnico para aluno
- **UX-DR34:** Estados vazios convidativos com CTA claro (ex.: "Adicione sua primeira publicação"); currículo parcial permite ver resultados com badge "Parcial" — educativo, não bloqueante
- **UX-DR35:** Toasts via Sonner posicionados canto inferior direito (desktop) / topo (mobile); 3s padrão, 5s com detalhe, persistente em erros com retry; nunca bloqueiam UI

**Testing & Quality Gates de UI:**

- **UX-DR36:** axe-core/Lighthouse em CI com zero erros bloqueantes; testes de navegação por teclado em fluxos críticos; VoiceOver manual a cada release; cross-browser (Chrome/Safari/Firefox/Edge atuais + 1 anterior)

### FR Coverage Map

| FR | Epic | Story | Capacidade |
|---|---|---|---|
| FR1 | 1 | 1.4 | Landing com proposta de valor |
| FR2 | 1 | 1.5 | Cadastro com 7 campos |
| FR3 | 1 | 1.5 | Aceite LGPD no cadastro |
| FR4 | 1 | 1.6 | Login |
| FR5 | 1 | 1.6 | Logout |
| FR6 | 1 | 1.7 | Recuperação de senha |
| FR7 | 2 | 2.1 | Formulário de currículo multi-seção |
| FR8 | 2 | 2.1 | Edição do currículo a qualquer momento |
| FR9 | 2 | 2.1 | Persistência automática (autosave) |
| FR10 | 2 | 2.1 | Resumo dos dados preenchidos |
| FR11 | 2 | 2.2 | Cálculo de scores por instituição |
| FR12 | 2 | 2.3 | Visualização de scores das 11 instituições |
| FR13 | 2 | 2.4 | Detalhes por categoria |
| FR14 | 2 | 2.4 | Gap analysis |
| FR15 | 2 | 2.4 | Disclaimer de estimativa |
| FR16 | 2 | 2.4 | Link/PDF do edital original |
| FR17 | 2 | 2.3 | Dashboard consolidado |
| FR18 | 2 | 2.3 | Identificação rápida de desempenho |
| FR19 | 2 | 2.3 | Drill-down por instituição |
| FR20 | 1 | 1.9 | Regras configuráveis por instituição (schema + seed no Epic 1); UI admin no Epic 3 |
| FR21 | 1 | 1.9 | Variações por especialidade (schema no Epic 1); UI admin no Epic 3 |
| FR22 | 2 | 2.2 | Recálculo na próxima sessão (trigger + stale flag) |
| FR23 | 1 | 1.9 | Estrutura da regra (schema JSONB no Epic 1) |
| FR24 | 1 | 1.9 | Extensibilidade sem alteração de código (modelo de dados no Epic 1) |
| FR25 | 3 | 3.1 | CRUD de instituições |
| FR26 | 3 | 3.2 | CRUD de regras |
| FR27 | 3 | 3.1 | Upload/link PDF de edital |
| FR28 | 4 | 4.1 | Listagem de leads com filtros |
| FR29 | 4 | 4.2 | Exportação CSV |
| FR30 | 4 | 4.2 | Exportação Hubspot |
| FR31 | 4 | 4.1 | Métricas de captação |
| FR32 | 1 | 1.5 | Exibição de termos no cadastro |
| FR33 | 5 | 5.2 | Exclusão de dados (LGPD) |
| FR34 | 5 | 5.2 | Anonimização para benchmarks |

**Cobertura:** 34/34 FRs mapeados ✅

## Epic List

### Epic 1: Fundação Completa (BLOQUEANTE)

**Goal:** Entregar a plataforma deployada no ar — visitante vê landing, se cadastra virando lead, faz login/logout/recupera senha; toda a infra de dados (migrations + seeds + RLS), autenticação, design system Medway e pipeline de deploy está pronta para qualquer feature subsequente rodar em paralelo.

**Escopo consolidado:** Setup Supabase (local + staging + prod); TODAS as migrations de schema (`profiles`, `institutions`, `specialties`, `scoring_rules` com JSONB, `curriculum_fields`, `user_curriculum`, `user_scores`); seeds completos das 11 instituições × especialidades extraídos de `src/lib/calculations.ts`; RLS policies por tabela; Storage bucket `editais`; types gerados em `src/lib/database.types.ts`; cliente Supabase singleton; AuthContext + ProtectedRoute; Design System Medway (tokens Tailwind navy/teal, Montserrat via @fontsource, shadcn tematizado); SSG Landing via vite-ssg; cadastro com 7 campos + aceite LGPD; login/logout/recuperação de senha; Deploy Vercel + CI/CD GitHub Actions + Sentry + UptimeRobot; limpeza de código residual Lovable; schemas Zod base + queries auth.

**FRs cobertos:** FR1, FR2, FR3, FR4, FR5, FR6, FR20 (schema), FR21 (schema), FR23 (schema), FR24 (schema), FR32

**Dependências:** nenhuma — é a base. Bloqueante para Epics 2–5.

---

### Epic 2 (Trilha Aluno): Currículo, Cálculo e Dashboard (Farol Acende)

**Goal:** Aluno preenche currículo em seções com autosave silencioso, clica em "Ver meus resultados", vê o farol acender — scores nas 11 instituições ordenados maior→menor, faixa narrativa com destaque + oportunidade, e pode fazer drill-down em qualquer instituição para ver gap analysis por categoria com link para o edital original.

**Escopo:** Formulário de currículo em accordion (`CurriculoFormSection`) + `AutosaveIndicator` + hook `use-autosave` + resumo do currículo; Database Function `calculate_scores(user_id)` em PL/pgSQL + RPC + trigger `mark_scores_stale` ao mudar regras; Dashboard grid responsivo 4/3/1 + `ScoreCard` + `NarrativeBanner` + `SpecialtySelector` inline no header; página de detalhe da instituição com breadcrumb + `ScoreHero` 96px + `GapAnalysisList` + `DisclaimerBanner` + link externo do edital.

**FRs cobertos:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR22

**Dependências:** apenas Epic 1. Roda em paralelo com Epics 3, 4, 5.

---

### Epic 3 (Trilha Admin): Painel de Motor de Regras e Editais

**Goal:** Rcfranco (admin) atualiza regras de edital por instituição × especialidade com preview de impacto (quantos alunos serão recalculados + amostra de deltas) e log de auditoria, sem deploy de código; pode fazer upload ou vincular PDF do edital.

**Escopo:** `AdminShell` + guard RLS/ProtectedRoute com `role='admin'`; CRUD de instituições; CRUD de regras por instituição × especialidade; upload PDF edital via Supabase Storage (bucket `editais`, 10MB); `AdminRuleEditor` com estados draft/published/dirty/publishing/error; `ImpactPreviewDialog` com contagem + amostra de 5 deltas antes de publicar; log/histórico de alterações.

**FRs cobertos:** FR25, FR26, FR27

**Dependências:** apenas Epic 1. Roda em paralelo com Epics 2, 4, 5.

---

### Epic 4 (Trilha Admin): Gestão e Exportação de Leads

**Goal:** Admin visualiza leads captados com filtros server-side, paginação, métricas básicas de captação, e exporta em CSV ou formato compatível com Hubspot para alimentar o funil comercial.

**Escopo:** `LeadTable` com TanStack DataTable + filtros server-side + chips removíveis + paginação + persistência via URL params + drawer (`Sheet`) para detalhe do lead; métricas header (total de cadastros, cadastros por período); Edge Function `export-leads` em Deno gerando CSV (<10s para 10k registros) em duas variantes: CSV padrão e formato Hubspot-ready.

**FRs cobertos:** FR28, FR29, FR30, FR31

**Dependências:** apenas Epic 1. Roda em paralelo com Epics 2, 3, 5.

---

### Epic 5 (Trilha LGPD): Compliance e Direito ao Esquecimento

**Goal:** Usuário pode ler termos de uso e política de privacidade completos; pode excluir seus dados em 1 clique (cascade delete LGPD); sistema preserva agregados anonimizados em views materializadas para benchmarks futuros sem acoplamento aos dados pessoais.

**Escopo:** Páginas jurídicas de Termos de Uso e Política de Privacidade (conteúdo + roteamento público); `AccountSettings` na área autenticada com fluxo de exclusão (confirmação dupla); Edge Function `delete-account` em Deno com cascade delete; views materializadas anonimizadas para benchmarks futuros.

**FRs cobertos:** FR33, FR34

**Dependências:** apenas Epic 1. Roda em paralelo com Epics 2, 3, 4.

---

## Parallelization Map

```
Epic 1 (bloqueante) ──┬──▶ Epic 2 (Aluno: Currículo + Dashboard)
                      ├──▶ Epic 3 (Admin: Regras + Editais)
                      ├──▶ Epic 4 (Admin: Leads + Export)
                      └──▶ Epic 5 (LGPD: Compliance)
```

Após Epic 1 concluído, Epics 2–5 são totalmente independentes entre si: sem conflitos de schema, sem conflitos de rotas, sem conflitos de componentes.

## Epic 1: Fundação Completa

Entregar a plataforma deployada no ar com toda a infra de dados, auth, design system e pipeline de deploy prontos, de modo que qualquer epic subsequente possa rodar em paralelo sem dependências cruzadas.

### Story 1.1: Integração Supabase + cliente singleton + limpeza Lovable

As a desenvolvedor,
I want integrar o Supabase ao projeto e remover código residual do protótipo Lovable,
So that temos a base de backend conectada e um codebase enxuto pronto para receber features.

**Acceptance Criteria:**

**Given** o repositório na branch `main`
**When** executo `bun install` após a story
**Then** `@supabase/supabase-js` está listado como dependência
**And** `src/lib/supabase.ts` exporta um cliente singleton usando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
**And** `.env.example` documenta as duas variáveis

**Given** o projeto Supabase local está inicializado via `supabase init`
**When** executo `supabase start`
**Then** o banco Postgres local sobe com sucesso
**And** a pasta `supabase/` está versionada com `config.toml`

**Given** o protótipo Lovable deixou arquivos não aplicáveis ao produto (telas-exemplo, rotas placeholder)
**When** reviso `src/pages/`, `src/components/` e `src/lib/`
**Then** todos os arquivos não aplicáveis foram removidos
**And** `bun run build` e `bun run lint` passam sem erros
**And** `src/lib/calculations.ts` é preservado (será extraído como seed em Story 1.9)

### Story 1.2: Design System Medway (tokens Tailwind + Montserrat + shadcn tematizado)

As a desenvolvedor,
I want configurar os tokens do Design System Medway em Tailwind e shadcn/ui,
So that qualquer tela futura use a identidade visual Medway sem esforço adicional.

**Acceptance Criteria:**

**Given** `tailwind.config.ts` com tokens shadcn default
**When** aplico os tokens Medway
**Then** paleta navy (900 #00205B, 800, 700), teal (500 #01CFB5, 600 #01A695), neutros (0–900) e semânticos (success #10B981, warning #F59E0B, danger #DC2626, info #3B82F6) estão disponíveis via classes Tailwind
**And** CSS vars do shadcn (`--primary`, `--accent`, `--background`) estão mapeadas em HSL para os tokens Medway
**And** border radius (`sm` 4px, `md` 8px, `lg` 12px, `xl` 16px) estão configurados

**Given** Montserrat não está instalada
**When** adiciono `@fontsource/montserrat` com pesos 400/500/600/700
**Then** `font-sans` default resolve para Montserrat com `font-display: swap`
**And** os 4 pesos são preloaded
**And** classe utilitária aplica tabular numerals (`font-feature-settings: 'tnum'`)

**Given** shadcn/ui está instalado
**When** verifico os primitives existentes (Button, Card, Input)
**Then** eles renderizam com paleta Medway (primary = navy, accent = teal)
**And** uma página dev-only `/design-system` exibe todos os tokens + primitives tematizados

### Story 1.3: Schema `profiles` + trigger handle_new_user + RLS

As a desenvolvedor,
I want criar a tabela `profiles` com trigger de sync com `auth.users` e RLS,
So that todo usuário que se cadastra tem seus dados persistidos com isolamento de segurança.

**Acceptance Criteria:**

**Given** um projeto Supabase inicializado
**When** aplico a migration `supabase/migrations/0001_profiles.sql`
**Then** a tabela `profiles` existe com `id uuid PK REFERENCES auth.users(id) ON DELETE CASCADE`, `name`, `email UNIQUE`, `phone`, `state`, `university`, `graduation_year int`, `specialty_interest`, `role text CHECK IN ('student','admin') DEFAULT 'student'`, `created_at`, `updated_at`
**And** função `handle_new_user()` + trigger `on_auth_user_created` em `auth.users` popula `profiles` automaticamente após signup com metadados

**Given** RLS habilitada em `profiles`
**When** user com `role='student'` consulta
**Then** só enxerga/edita a própria linha (`auth.uid() = id`)
**And** nunca pode alterar o próprio `role`

**Given** admin consulta `profiles`
**When** usa client anon com sessão admin
**Then** enxerga todos os registros
**And** `src/lib/database.types.ts` é regenerado e commitado

### Story 1.4: Landing page pública via SSG (vite-ssg)

As a visitante,
I want chegar numa landing page com proposta clara do produto,
So that entendo o valor e decido se vale me cadastrar.

**Acceptance Criteria:**

**Given** `vite-ssg` não está configurado
**When** adiciono a dependência e ajusto `vite.config.ts`
**Then** `bun run build` gera `dist/index.html` pré-renderizado para `/`
**And** o HTML servido contém título, hero e CTA sem executar JavaScript

**Given** a rota `/` responde via SSG
**When** abro no navegador
**Then** vejo hero com headline "Descubra como está seu currículo para as maiores instituições de residência do Brasil"
**And** CTA primário "Começar" leva para `/signup`
**And** paleta Medway, Montserrat, `max-w-5xl`
**And** `public/robots.txt` permite crawl, `public/sitemap.xml` lista `/`, meta tags `<title>`, `<meta description>`, Open Graph (`og:title`, `og:description`, `og:image`) presentes

**Given** a landing deployada
**When** executo Lighthouse
**Then** Performance ≥ 90 e First Contentful Paint < 2s (NFR1)

### Story 1.5: Cadastro público (signup) com 7 campos + aceite LGPD

As a visitante,
I want me cadastrar com os 7 campos aceitando os termos,
So that viro um lead e ganho acesso à área autenticada.

**Acceptance Criteria:**

**Given** estou em `/signup`
**When** a página renderiza
**Then** vejo formulário com 7 campos (nome, email, telefone com máscara, estado Select 27 UFs, faculdade Combobox, ano de formação range dinâmico, especialidade Select) + senha + confirmação de senha
**And** checkbox "Aceito os Termos de Uso e a Política de Privacidade" com links
**And** CTA "Criar minha conta" desabilitado enquanto checkbox desmarcado ou validação falha

**Given** todos os campos válidos e termo aceito
**When** clico "Criar minha conta"
**Then** `supabase.auth.signUp` é invocado com metadados
**And** trigger `handle_new_user` popula `profiles`
**And** sou redirecionado para `/app` com sessão ativa

**Given** há erro de validação
**When** submeto
**Then** vejo erro inline âmbar por campo (sem vermelho, sem toast)
**And** foco move para o primeiro campo com erro

**Given** email já existe
**When** submeto
**Then** vejo erro pt-BR específico ("Este email já está cadastrado — faça login")

### Story 1.6: Login e logout com AuthContext

As a usuário cadastrado,
I want fazer login e logout,
So that acesso minha área autenticada e encerro a sessão quando quiser.

**Acceptance Criteria:**

**Given** estou em `/login`
**When** preencho email + senha e clico "Entrar"
**Then** `supabase.auth.signInWithPassword` é invocado
**And** em sucesso sou redirecionado para `/app` (role student) ou `/admin` (role admin)
**And** em erro vejo toast pt-BR não bloqueante ("Email ou senha inválidos")

**Given** logado
**When** clico "Sair" no menu do Avatar
**Then** `supabase.auth.signOut` é invocado
**And** sou redirecionado para `/`

**Given** `AuthContext` escuta `onAuthStateChange`
**When** ocorre login, logout, ou refresh de token
**Then** estado de sessão é atualizado globalmente
**And** `useAuth()` retorna `{ user, profile, loading, signOut }` para qualquer componente

### Story 1.7: Recuperação de senha

As a usuário,
I want recuperar minha senha por email,
So that não perco acesso à plataforma.

**Acceptance Criteria:**

**Given** estou em `/forgot-password`
**When** informo email e clico "Enviar link de recuperação"
**Then** `supabase.auth.resetPasswordForEmail` é invocado
**And** vejo mensagem neutra "Se este email está cadastrado, enviamos um link" (evita enumeração)

**Given** recebi o email e cliquei no link
**When** aterriso em `/reset-password` com token válido
**Then** vejo formulário com nova senha + confirmação
**And** ao submeter, `supabase.auth.updateUser({ password })` é invocado
**And** em sucesso sou redirecionado para `/login` com toast de confirmação

### Story 1.8: ProtectedRoute por role + AppShell e AdminShell

As a desenvolvedor,
I want um componente `<ProtectedRoute role>` e shells por contexto,
So that qualquer feature futura proteja rotas sem duplicar lógica.

**Acceptance Criteria:**

**Given** `<ProtectedRoute role="student">` envolve uma rota
**When** user anônimo tenta acessar
**Then** é redirecionado para `/login?redirect={path}`

**Given** `<ProtectedRoute role="admin">` envolve uma rota
**When** user com role student tenta acessar
**Then** é redirecionado para `/app` com toast "Acesso restrito"

**Given** aluno autenticado acessa `/app`
**When** a página carrega
**Then** `AppShell` renderiza header sticky (64/56px) com logo + espaço para SpecialtySelector + Avatar
**And** container `max-w-7xl` centralizado

**Given** admin autenticado acessa `/admin`
**When** a página carrega
**Then** `AdminShell` renderiza header com logo + badge "Admin" + tabs + Avatar
**And** densidade compacta (`p-3`/`p-4`)

**Given** `/admin` acessado em viewport <768px
**When** detecto mobile
**Then** vejo aviso não-bloqueante "Painel admin otimizado para desktop"

### Story 1.9: Schema do motor de regras + seeds das 11 instituições

As a desenvolvedor,
I want criar schema do motor de regras e carregar 11 instituições com suas regras atuais,
So that o cálculo tem dados reais para operar e o admin tem o que gerenciar.

**Acceptance Criteria:**

**Given** `supabase/migrations/0002_rules_engine.sql`
**When** aplico
**Then** existem as tabelas `institutions` (id, name UNIQUE, short_name, state, edital_url, pdf_path, timestamps), `specialties` (id, name UNIQUE), `scoring_rules` (id, institution_id FK, specialty_id NULL FK, category, field_key, weight numeric, max_points numeric, description, formula jsonb, CHECK weight ≥ 0 AND weight ≤ max_points, timestamps)
**And** índices `idx_scoring_rules_institution_id`, `idx_scoring_rules_specialty_id` criados

**Given** RLS habilitada nas 3 tabelas
**When** anônimo ou student consulta
**Then** pode SELECT (leitura permissiva)
**And** apenas `role='admin'` faz INSERT/UPDATE/DELETE

**Given** `supabase/seeds/rules_engine.sql` extraído de `src/lib/calculations.ts`
**When** executo `supabase db reset`
**Then** as 11 instituições estão populadas (USP-SP, USP-RP, UNIFESP, UNICAMP, UFMG, UFRJ, SCM-BH, UFPA + demais do protótipo)
**And** regras por instituição populadas em `scoring_rules` com category, field_key, weight, max_points, description
**And** onde há variação por especialidade, `specialty_id` preenchido; caso contrário `NULL` (default)

**Given** o seed é idempotente
**When** rodo novamente
**Then** não há duplicações

### Story 1.10: Schema de currículo e scores + bucket `editais`

As a desenvolvedor,
I want criar o schema de currículo do aluno, cache de scores e bucket de editais,
So that Epic 2 pode preencher/calcular e Epic 3 pode anexar PDFs.

**Acceptance Criteria:**

**Given** `supabase/migrations/0003_curriculum_scores.sql`
**When** aplico
**Then** existem: `curriculum_fields` (id, category, field_key UNIQUE, label, field_type CHECK IN number/boolean/select/text, options jsonb, display_order int, created_at); `user_curriculum` (user_id PK FK profiles ON DELETE CASCADE, data jsonb DEFAULT '{}', updated_at); `user_scores` (user_id FK, institution_id FK, specialty_id NULL FK, score numeric, max_score numeric, breakdown jsonb, stale boolean DEFAULT true, calculated_at, PK composta)
**And** triggers de `updated_at` aplicados

**Given** RLS nas 3 tabelas
**When** aluno consulta
**Then** `user_curriculum` e `user_scores`: apenas `auth.uid() = user_id`
**And** `curriculum_fields`: leitura pública, escrita admin

**Given** `supabase/seeds/curriculum_fields.sql` extraído da estrutura atual
**When** executo `supabase db reset`
**Then** todos os campos do currículo (Publicações, Acadêmico, Prática/Social, Liderança/Eventos, Perfil) populados com label, category, field_type, display_order

**Given** `supabase/migrations/0004_storage_editais.sql`
**When** aplico
**Then** bucket `editais` existe com `file_size_limit = 10485760` (10MB) e MIME allowed `application/pdf`
**And** policy: `role='admin'` faz INSERT/UPDATE/DELETE; qualquer autenticado faz SELECT
**And** `src/lib/database.types.ts` regenerado com todos os tipos

### Story 1.11: CI/CD completo

As a operador,
I want pipeline de CI/CD, deploy automático e observabilidade,
So that a plataforma está deployada, monitorada e com quality gates a cada PR.

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml`
**When** abro PR contra `main`
**Then** roda lint, typecheck, testes e build
**And** roda `supabase gen types typescript` e falha se houver diff em `src/lib/database.types.ts`

**Given** projeto conectado ao Vercel
**When** PR é aberto
**Then** Vercel gera preview URL automaticamente
**And** em merge para `main` roda deploy de produção

**Given** Sentry configurado
**When** erro não tratado ocorre no frontend ou Edge Function
**Then** erro aparece no dashboard com stack trace e contexto (sem PII)
**And** `VITE_SENTRY_DSN` está nas secrets Vercel

**Given** UptimeRobot monitora `/` e endpoint de health
**When** plataforma cai
**Then** recebo notificação em <5min
**And** uptime tracked para atender NFR22 (99%)

**Given** migrations em `supabase/migrations/`
**When** merge em `main`
**Then** existe step manual com approval para `supabase db push` em produção (nunca automático)

## Epic 2: Currículo, Cálculo e Dashboard (Farol Acende)

Aluno preenche currículo em seções com autosave silencioso, clica "Ver meus resultados" e vê o farol acender — scores ordenados das 11 instituições com faixa narrativa, podendo fazer drill-down para gap analysis por categoria com link para o edital.

> **Nota:** Stories consolidadas em 2026-04-16 via sprint-change-proposal. Referência: `planning-artifacts/sprint-change-proposal-2026-04-16.md`

### Story 2.1: Formulário de currículo completo com autosave

As a aluno,
I want preencher meu currículo em seções organizadas com salvamento automático e ver um resumo do que preenchi,
So that a experiência é fluida, nunca perco dados e entendo meu panorama curricular.

**Escopo consolidado:** Schemas Zod (`curriculumDataSchema`) + React Query hooks (`useCurriculumFields`, `useCurriculum`, `useUpdateCurriculum`) + formulário em accordion (`CurriculoFormSection`) com 5 seções (Publicações, Acadêmico, Prática/Social, Liderança/Eventos, Perfil) + hook `use-autosave` (debounce 500ms + `onBlur`) + `AutosaveIndicator` (idle/saving/saved/error/offline com `aria-live`) + fallback localStorage + resumo read-only do currículo.

**FRs cobertos:** FR7, FR8, FR9, FR10

**Acceptance Criteria:**

**Given** `src/lib/schemas/curriculum.ts`
**When** importo
**Then** exporta `curriculumDataSchema` (Zod) compatível com `user_curriculum.data` dinamicamente construído a partir de `curriculum_fields`

**Given** `src/lib/queries/curriculum.ts`
**When** importo
**Then** exporta hooks `useCurriculumFields()` (campos agrupados por categoria), `useCurriculum(userId)` (dados do user) e mutation `useUpdateCurriculum()`
**And** todos usam React Query com keys tipadas (`['curriculum', userId]`, `['curriculum-fields']`)
**And** mutations fazem `invalidateQueries` explícito em `onSuccess`

**Given** rota `/app/curriculo` protegida por role student
**When** acesso
**Then** vejo header minimal + microcopy "Preencha no seu tempo. Tudo é salvo automaticamente."
**And** 5 seções em accordion shadcn: Publicações, Acadêmico, Prática/Social, Liderança/Eventos, Perfil
**And** primeira seção (Publicações) expandida por default; demais recolhidas com contador "(0/N preenchidos)"

**Given** seção expandida
**When** interajo
**Then** cada campo é `Form.Field` com react-hook-form + Zod
**And** label acima do input, placeholder como exemplo, espaçamento `space-4`/`space-6`
**And** numéricos têm `min=0`, booleanos viram Checkbox, selects usam `curriculum_fields.options`

**Given** viewport mobile
**When** renderizo
**Then** 1 coluna, inputs `w-full`, accordion funcional via tap
**And** CTA "Ver meus resultados" fixo no bottom com `safe-area-inset`

**Given** `src/hooks/use-autosave.ts`
**When** importo e uso
**Then** dispara `saveFn` em debounce 500ms após mudança + imediatamente em `onBlur` ou troca de seção

**Given** `AutosaveIndicator`
**When** renderizado
**Then** exibe estados idle ("Salvo"), saving ("Salvando..."), saved ("✓ Salvo há 2s"), error ("Erro ao salvar — tentando novamente"), offline
**And** nunca bloqueia UI, sempre visível no header
**And** `aria-live="polite"` anuncia mudanças

**Given** erro de save
**When** retry em background falha 3 vezes
**Then** vejo warning âmbar persistente com botão "Tentar de novo"
**And** dados persistidos em `localStorage` como fallback

**Given** reabro o navegador
**When** `useCurriculum` carrega
**Then** dados salvos populam o formulário no ponto exato onde deixei
**And** feedback visual de save completa em <500ms (NFR5)

**Given** rota `/app/curriculo/resumo` (ou seção na mesma página)
**When** acesso
**Then** vejo lista agrupada por categoria com valores preenchidos
**And** campos vazios aparecem como "—" (não omitidos)
**And** link "Editar" leva ao formulário

### Story 2.2: Motor de cálculo — DB Function + trigger + queries frontend

As a desenvolvedor,
I want função PL/pgSQL que calcula scores por instituição, trigger de invalidação e camada de queries frontend,
So that o backend tem lógica autoritativa de cálculo e o dashboard consome scores consistentemente.

**Escopo consolidado:** Migration `calculate_scores(p_user_id, p_specialty_id)` em PL/pgSQL + trigger `on_scoring_rule_updated` que marca `stale=true` + RPC exposta com RLS + testes pgTAP + `src/lib/queries/scoring.ts` com hooks `useScores`, `useInstitutions` + schemas Zod de scoring.

**FRs cobertos:** FR11, FR22

**Acceptance Criteria:**

**Given** `supabase/migrations/0005_calculate_scores.sql`
**When** aplico
**Then** existe `calculate_scores(p_user_id uuid, p_specialty_id uuid DEFAULT NULL) RETURNS void`
**And** lê `user_curriculum.data`, itera `scoring_rules` aplicáveis (specialty_id ou default NULL), aplica `formula` JSONB + `weight` + `max_points`, faz upsert em `user_scores` com `stale=false` e `calculated_at=now()`
**And** executa em <1s para 11 instituições × 1 aluno (NFR3)

**Given** RPC `calculate_scores` exposta
**When** chamo via `supabase.rpc('calculate_scores', { p_user_id, p_specialty_id })`
**Then** respeita RLS (aluno só calcula próprios scores)

**Given** admin atualiza `scoring_rules`
**When** trigger `on_scoring_rule_updated` dispara
**Then** marca `user_scores.stale=true` para users afetados

**Given** `supabase/tests/calculate_scores.sql` (pgTAP)
**When** executo
**Then** passam ao menos 3 cenários: currículo vazio → 0; currículo cheio → score esperado por instituição; troca de especialidade usa regras específicas quando existem

**Given** `src/lib/queries/scoring.ts`
**When** importo
**Then** `useScores(userId, specialtyId)` (a) lê `user_scores`; (b) se algum `stale=true`, invoca RPC `calculate_scores` e re-lê; (c) retorna array ordenado `score desc`
**And** `useInstitutions()` retorna lista com `edital_url` e `pdf_path`
**And** keys tipadas `['scores', userId, specialtyId]`, `['institutions']`

### Story 2.3: Dashboard completo com ScoreCard + NarrativeBanner + SpecialtySelector + transição

As a aluno,
I want ver um dashboard com meus scores nas 11 instituições, trocar especialidade pelo header e ter transição fluida do formulário,
So that tenho clareza imediata de onde estou mais competitivo e o momento "ver o farol acender" é marcante.

**Escopo consolidado:** Dashboard grid responsivo 4/3/1 com `ScoreCard` + `NarrativeBanner` + `SpecialtySelector` inline no header AppShell (com mutation + recálculo) + transição fade+slide ~200ms do formulário para o dashboard + skeletons dos 11 cards + `DisclaimerBanner` compacto no subheader.

**FRs cobertos:** FR12, FR17, FR18, FR19

**Acceptance Criteria:**

**Given** rota `/app` (home do aluno)
**When** logado com currículo preenchido
**Then** header AppShell + SpecialtySelector + Avatar
**And** subheader com título "Sua posição em 11 instituições" + DisclaimerBanner compacto
**And** `NarrativeBanner` com 1 linha: "Você está mais competitivo em {top}. Maior oportunidade: +{X} em {inst}, {categoria}."
**And** grid de `ScoreCard` em 4 colunas (xl+), 3 (md/lg), 1 (mobile), ordenado `score desc`

**Given** `ScoreCard` de uma instituição
**When** renderiza
**Then** mostra nome (h3), score 48px, barra `Progress` (navy.200 fundo + teal.500 progresso), 1 linha de gap resumido, chevron
**And** hover: elevação sutil + chevron em teal
**And** `aria-label` completo ("USP-RP, score 68 de 100, mais 32 possíveis em publicações, botão ver detalhes")
**And** clique leva a `/app/instituicoes/:id`

**Given** currículo parcial ou vazio
**When** cards renderizam
**Then** cards exibem badge "Parcial" ou estado vazio com CTA "Comece a preencher"
**And** não bloqueiam visualização

**Given** scores em carregamento
**When** `useScores` em `isLoading`
**Then** vejo 11 skeletons com dimensões finais (nunca spinner full-screen)

**Given** `SpecialtySelector` no header AppShell
**When** abro o dropdown
**Then** vejo todas as especialidades cadastradas
**And** a atual está marcada

**Given** seleciono outra especialidade
**When** confirmo
**Then** mutation atualiza `profile.specialty_interest`
**And** `useScores` invalida e dispara `calculate_scores` com nova especialidade
**And** dashboard atualiza em <1s (NFR3)
**And** `aria-live` anuncia "Scores atualizados para {especialidade}"

**Given** estou no formulário
**When** clico "Ver meus resultados"
**Then** transição fade+slide ~200ms leva ao dashboard
**And** skeletons dos 11 cards aparecem instantaneamente
**And** cards populam numa única atualização (não sequencial) em <1s

**Given** user com `prefers-reduced-motion: reduce`
**When** a transição dispara
**Then** anima só com opacidade (ou sem animação), sem slide

### Story 2.4: Detalhe da instituição — ScoreHero + GapAnalysis + DisclaimerBanner

As a aluno,
I want ver o detalhe de cada instituição com gap por categoria, disclaimer e link para o edital original,
So that entendo exatamente onde posso ganhar pontos e posso consultar a fonte.

**Escopo consolidado:** Rota `/app/instituicoes/:id` com breadcrumb + header com link externo edital + `ScoreHero` 96px + `GapAnalysisList` (categorias com mini-barra + delta + "Saiba +") + `DisclaimerBanner` + link para edital original (URL ou Storage signed URL).

**FRs cobertos:** FR13, FR14, FR15, FR16

**Acceptance Criteria:**

**Given** rota `/app/instituicoes/:id`
**When** acesso
**Then** vejo breadcrumb "← Dashboard" (máx 2 níveis)
**And** header com nome + especialidade + link externo do edital (`target="_blank" rel="noopener"`, ícone e texto "abre em nova aba")
**And** `ScoreHero` com score 96px + barra ampla

**Given** `GapAnalysisList`
**When** renderiza
**Then** `<ul>/<li>` de categorias com: nome, "X/Y pontos", mini-barra, "+Δ possíveis", botão "Saiba +"
**And** "Saiba +" expande explicação de `scoring_rules.description`

**Given** microcopy de score
**When** score é baixo
**Then** texto contextualiza positivamente ("Você tem {X} pontos possíveis para crescer aqui"); nunca vermelho, nunca culpa

**Given** `DisclaimerBanner` no detalhe da instituição
**When** renderiza
**Then** exibe "Estes scores são estimativas baseadas em editais públicos. A pontuação oficial é determinada pela instituição."
**And** fundo âmbar sutil (warning semântico), ícone ⚠️, tipografia caption

**Given** detalhe da instituição
**When** clico em "Ver edital original"
**Then** abre em nova aba o `institutions.edital_url` OU URL assinada do Storage (se `pdf_path` existe)
**And** link sinaliza "abre em nova aba" a leitores de tela

## Epic 3: Painel Admin — Motor de Regras e Editais

Rcfranco atualiza regras de edital por instituição × especialidade com preview de impacto e log de auditoria, sem deploy de código, propagando recálculo aos alunos afetados.

> **Nota:** Stories consolidadas em 2026-04-16 via sprint-change-proposal. Referência: `planning-artifacts/sprint-change-proposal-2026-04-16.md`

### Story 3.1: Navegação admin + CRUD de instituições + upload de edital

As a admin,
I want tabs de navegação no painel admin, poder criar/editar/remover instituições e anexar PDF ou link do edital,
So that a base de instituições é gerenciável sem deploy e o aluno consulta a fonte oficial.

**Escopo consolidado:** Tabs de navegação no AdminShell (Instituições, Regras, Leads, Histórico) + tabela de instituições com CRUD completo + formulário com campos name/short_name/state/edital_url + upload de PDF para bucket `editais` (validação PDF ≤ 10MB) + substituição de PDF anterior.

**FRs cobertos:** FR25, FR27

**Acceptance Criteria:**

**Given** admin autenticado em `/admin`
**When** carrega
**Then** `AdminShell` exibe tabs (Instituições, Regras, Leads, Histórico)
**And** tab ativa destacada
**And** densidade compacta (`p-3`/`p-4`)

**Given** aba `/admin/instituicoes`
**When** acesso
**Then** vejo tabela compacta com colunas: nome, sigla, estado, edital (link), qtd de regras, ações

**Given** clico "Nova instituição"
**When** preencho formulário (name, short_name, state, edital_url)
**Then** mutation cria registro em `institutions`
**And** tabela atualiza via `invalidateQueries(['institutions'])`

**Given** clico "Editar" numa linha
**When** altero e salvo
**Then** mutation atualiza o registro

**Given** clico "Remover"
**When** confirmo em dialog de segurança
**Then** mutation deleta (com cascade explicitado)
**And** toast "Instituição removida" + entrada de auditoria gerada

**Given** estou editando uma instituição
**When** vejo a seção "Edital"
**Then** posso escolher "Link externo (URL)" ou "Upload de PDF"

**Given** seleciono upload
**When** escolho arquivo
**Then** validação: `application/pdf`, tamanho ≤ 10MB (NFR20)
**And** upload para bucket `editais` com path `{institution_id}/{timestamp}.pdf`
**And** `institutions.pdf_path` atualizado
**And** feedback visual durante upload

**Given** havia upload anterior
**When** faço novo upload
**Then** PDF antigo é removido do Storage

### Story 3.2: CRUD de regras com AdminRuleEditor + ImpactPreview

As a admin,
I want configurar regras de cálculo por instituição × especialidade com preview de impacto antes de publicar,
So that adapto pontuações quando editais mudam e opero com confiança.

**Escopo consolidado:** Lista de regras filtráveis por instituição/especialidade + `AdminRuleEditor` com estados draft/dirty/publishing/published/error + formulário Zod (institution, specialty, category, field_key, weight, max_points, description, formula JSONB) + `ImpactPreviewDialog` (contagem de alunos afetados + amostra de 5 deltas) disparado por "Publicar".

**FRs cobertos:** FR26

**Acceptance Criteria:**

**Given** aba `/admin/regras` ou sub-página de uma instituição
**When** acesso
**Then** vejo lista de regras filtráveis por instituição e especialidade
**And** regras default (sem especialidade) aparecem primeiro

**Given** clico "Nova regra" ou "Editar regra"
**When** uso `AdminRuleEditor`
**Then** preencho: instituição (select), especialidade (select opcional), category, field_key (select de `curriculum_fields`), weight, max_points, description, formula (editor JSONB com validação Zod)
**And** CHECK `weight ≥ 0 AND weight ≤ max_points` é respeitada

**Given** editor com estados visuais
**When** interajo
**Then** vejo draft, dirty (editado não salvo), publishing (mutação em voo), published (salvo com timestamp), error (mensagem específica)

**Given** alterei uma regra e cliquei "Publicar"
**When** confirmação abre
**Then** `ImpactPreviewDialog` exibe: contagem de alunos com currículo preenchido + aquela instituição; amostra de 5 alunos com delta estimado ("João: 32 → 38 (+6)") calculado via preview function
**And** CTAs "Confirmar publicação" e "Cancelar"

**Given** confirmo
**When** mutation roda
**Then** regra é persistida
**And** trigger `on_scoring_rule_updated` marca `user_scores.stale=true` para users afetados
**And** toast "Regra publicada — {N} alunos terão recálculo na próxima sessão"

### Story 3.3: Log/histórico de alterações de regras

As a admin,
I want histórico de alterações,
So that tenho auditoria e possibilidade de reverter.

**Acceptance Criteria:**

**Given** `supabase/migrations/00NN_rule_audit.sql`
**When** aplico
**Then** tabela `scoring_rules_audit (id, rule_id, changed_by, change_type, old_values jsonb, new_values jsonb, changed_at)` existe
**And** trigger `audit_scoring_rules` popula a cada INSERT/UPDATE/DELETE

**Given** aba `/admin/historico`
**When** acesso
**Then** vejo lista cronológica com instituição, regra, tipo, admin, timestamp
**And** clique em linha expande old/new

**Given** uma linha
**When** clico "Reverter"
**Then** mutação restaura `old_values` como novo update (nova entrada de audit, histórico preservado)

## Epic 4: Painel Admin — Gestão e Exportação de Leads

Admin filtra leads, vê métricas de captação e exporta em CSV ou formato Hubspot para alimentar o funil comercial.

> **Nota:** Stories consolidadas em 2026-04-16 via sprint-change-proposal. Referência: `planning-artifacts/sprint-change-proposal-2026-04-16.md`

### Story 4.1: Página de leads completa — tabela + filtros + métricas + drawer

As a admin,
I want ver métricas de captação, listar leads com filtros server-side e ver detalhes sem sair da tabela,
So that acompanho e segmento o funil eficientemente.

**Escopo consolidado:** Rota `/admin/leads` com cards de métricas (total, 7d, 30d, currículo preenchido vs. só cadastro) + `LeadTable` TanStack DataTable com paginação server-side (50/página) + filtros por período/UF/especialidade/status como chips removíveis + persistência em URL params + `Sheet` lateral de detalhe do lead (todos os campos + resumo currículo + top-3 scores).

**FRs cobertos:** FR28, FR31

**Acceptance Criteria:**

**Given** rota `/admin/leads`
**When** acesso
**Then** header exibe cards: total de leads, últimos 7 dias, últimos 30 dias, leads com currículo preenchido vs. só cadastro
**And** dados vêm de queries agregadas em `profiles` (`role='student'`)

**Given** abaixo dos cards
**When** renderiza
**Then** `LeadTable` exibe colunas: nome, email, telefone, estado, faculdade, ano formação, especialidade, data de cadastro
**And** paginação server-side (50 por página default)
**And** ordenação por colunas com `aria-sort`
**And** HTML semântico (`<table>`, `<thead>`, `<tbody>`, `scope="col"`)

**Given** 10k+ registros
**When** navego páginas
**Then** cada troca carrega em <2s

**Given** header da tabela
**When** aplico filtros
**Then** cada filtro vira chip removível acima da tabela
**And** estado persistido em URL params (`/admin/leads?state=SP&specialty=dermato&from=2026-03-01`)
**And** compartilhar URL restaura os filtros
**And** mudanças de params não causam full reload (React Router)

**Given** clico numa linha
**When** abre
**Then** `Sheet` lateral mostra todos os campos de `profiles` + resumo de currículo + top-3 scores + data de criação/update
**And** fecha via ESC ou clique fora
**And** foco retorna à linha clicada

### Story 4.2: Edge Function export-leads — CSV + formato Hubspot

As a admin,
I want exportar leads para CSV padrão ou formato compatível com Hubspot,
So that uso fora da plataforma e importo diretamente no CRM.

**Escopo consolidado:** Edge Function `supabase/functions/export-leads/` que aceita `{ filters, format: 'csv' | 'hubspot' }` + check JWT admin server-side + stream CSV UTF-8 com BOM + formato Hubspot com headers compatíveis (First Name, Last Name, Email, Phone E.164, State/Region, Company) + botões "Exportar CSV" e "Exportar para Hubspot" na página de leads.

**FRs cobertos:** FR29, FR30

**Acceptance Criteria:**

**Given** `supabase/functions/export-leads/`
**When** deploy
**Then** Edge Function aceita `{ filters, format: 'csv' }` e retorna stream CSV
**And** processa 10k registros em <10s (NFR4)
**And** apenas invocável por `role='admin'` (check JWT server-side)

**Given** clico "Exportar CSV"
**When** requisito com filtros atuais
**Then** download inicia
**And** CSV tem colunas: nome, email, telefone, estado, faculdade, ano formação, especialidade, data cadastro
**And** encoding UTF-8 com BOM para Excel

**Given** clico "Exportar para Hubspot"
**When** confirmo
**Then** Edge Function retorna CSV com headers `First Name,Last Name,Email,Phone,State/Region,Company,...` compatíveis com importação Hubspot (NFR19)
**And** telefone em E.164 (+55...)
**And** nome quebrado em first/last name (primeiro espaço; fallback tudo no first name)

## Epic 5: LGPD — Compliance e Direito ao Esquecimento

Usuário lê termos/privacidade, exclui dados em 1 clique (cascade delete LGPD) e sistema preserva agregados anonimizados para benchmarks futuros sem acoplamento a PII.

> **Nota:** Stories consolidadas em 2026-04-16 via sprint-change-proposal. Referência: `planning-artifacts/sprint-change-proposal-2026-04-16.md`

### Story 5.1: Páginas públicas Termos de Uso + Política de Privacidade

As a visitante,
I want ler termos de uso e política de privacidade,
So that entendo os compromissos e meus direitos antes de me cadastrar.

**Acceptance Criteria:**

**Given** rotas `/termos` e `/privacidade` (públicas)
**When** acesso
**Then** vejo conteúdo jurídico completo (provisionado ou placeholder editável)
**And** layout `max-w-3xl`, Montserrat, títulos hierárquicos, listas
**And** links do cadastro (Story 1.5) apontam para essas rotas

**Given** mobile
**When** renderizo
**Then** sem overflow horizontal, body 16px+

### Story 5.2: Exclusão de conta LGPD — AccountSettings + Edge Function + benchmarks anonimizados

As a usuário,
I want excluir minha conta e dados com garantia de que agregados anonimizados são preservados para benchmarks,
So that exerço o direito de esquecimento (LGPD) sem comprometer dados estatísticos do produto.

**Escopo consolidado:** Rota `/app/conta` com informações de cadastro + seção "Excluir conta" com confirmação dupla (digitar EXCLUIR) + Edge Function `delete-account` em Deno (verifica JWT → copia agregados → cascade delete → deleta auth.users → registra em `account_deletions`) + migration com views materializadas `benchmark_scores_by_institution` e `benchmark_curriculum_completeness` + tabela `account_deletions` (sem PII) + rollback atômico em caso de erro.

**FRs cobertos:** FR33, FR34

**Acceptance Criteria:**

**Given** rota `/app/conta`
**When** logado como student
**Then** vejo minhas informações de cadastro + seção "Excluir conta"

**Given** clico "Excluir minha conta"
**When** confirmação abre
**Then** Dialog com "Esta ação é irreversível. Todos os seus dados serão removidos. Digite EXCLUIR para confirmar"
**And** botão "Confirmar" só habilita após input correto
**And** "Cancelar" sempre disponível

**Given** confirmo
**When** mutation dispara
**Then** invoca Edge Function `delete-account`
**And** em sucesso sou deslogado + redirecionado para `/` com toast "Conta excluída"

**Given** `supabase/functions/delete-account/`
**When** deploy
**Then** função: (1) verifica JWT (só o próprio user); (2) copia agregados anonimizados para views materializadas; (3) deleta `user_scores`, `user_curriculum`, `profiles` (cascade); (4) deleta `auth.users` via admin API; (5) registra em `account_deletions` (id, deleted_at, state, graduation_year — sem PII)
**And** retorna `{ data: { deleted: true }, error: null }` em sucesso
**And** é idempotente

**Given** qualquer passo falha
**When** erro ocorre
**Then** transação faz rollback
**And** retorna `{ data: null, error: { message, code } }`
**And** nada é deletado parcialmente

**Given** `supabase/migrations/00NN_benchmarks.sql`
**When** aplico
**Then** existem views materializadas `benchmark_scores_by_institution` (institution_id, specialty_id, count, avg_score, p50, p75, p90) e `benchmark_curriculum_completeness` (category, avg_fill_rate)
**And** nenhuma view expõe user_id, nome, email ou telefone
**And** admin faz SELECT; alunos não têm acesso

**Given** job agendado
**When** executa
**Then** views são refreshed semanalmente (ou sob demanda)

## Epic 6: Landing & Marketing Polish

**Goal:** Evoluir a landing pública (`/`) de hero minimal (entregue na Story 1.4) para uma experiência completa que comunica valor, gera credibilidade e converte visitante em lead. As seções usam conteúdo real (screenshots do dashboard, números reais de usuários, depoimentos) coletado durante os Epics 1–5, permitindo iteração baseada em dados de uso em vez de placeholders.

**Dependências:** Epics 1–5 completos e produto com usuários beta rodando. Stack técnico continua sobre `vite-react-ssg` já instalado na Story 1.4. Story 5.1 (termos/privacidade) precisa estar pronta para linkagem no footer (Story 6.6).

**Status:** backlog (pós-MVP).

> **Nota:** Stories consolidadas em 2026-04-16 via sprint-change-proposal. Referência: `planning-artifacts/sprint-change-proposal-2026-04-16.md`

### Story 6.1: Landing completa — hero + como funciona + preview do dashboard

As a visitante da landing,
I want um hero visualmente rico com CTAs claros, entender em 3 passos como o produto funciona e ver screenshots reais do dashboard,
So that entendo o valor, dissolvo ansiedade e tenho prova visual concreta do que vou receber ao me cadastrar.

**Escopo consolidado:** Hero redesign com imagem/ilustração + 2 CTAs (primário "Começar" → `/signup`, secundário "Ver como funciona" → âncora `#como-funciona`) + microcopy persuasiva + seção "Como funciona" com 3 cards visuais (Cadastre-se, Preencha, Veja seu score) + seção preview com 2–3 screenshots anotados do dashboard (assets estáticos em `public/landing/`, sem PII).

**Acceptance Criteria:**

**Given** a landing atual entregue na Story 1.4 (hero + CTA único)
**When** aplico o redesign
**Then** hero passa a ter: imagem/ilustração à direita (ou background com profundidade visual via gradiente/shapes geométricos navy→teal), CTA primário "Começar" → `/signup`, CTA secundário "Ver como funciona" → âncora `#como-funciona`
**And** microcopy substitui subheadline atual por versão mais persuasiva (2ª pessoa direta, specificidade mensurável — ex: "Em 10 minutos você tem seu score em 11 programas das maiores instituições")
**And** layout responsivo: desktop hero split 60/40 (texto/imagem); mobile stack vertical com imagem abaixo do CTA

**Given** acessibilidade
**When** valido
**Then** ilustração tem `alt` descritivo (ou `aria-hidden` se decorativa); contraste AA preservado sobre novo background; CTAs mantêm ≥44px touch target

**Given** seção `#como-funciona` abaixo do hero
**When** visualizo
**Then** vejo 3 cards horizontais (desktop) ou empilhados (mobile) com ícone Lucide + título + descrição curta: (1) "Cadastre-se em 1 minuto" — 7 campos + LGPD, (2) "Preencha seu currículo" — accordion com autosave silencioso, (3) "Veja seu score em 11 instituições" — dashboard com gap analysis
**And** cada card tem ilustração consistente (mesmo estilo/paleta do hero)
**And** links âncora ou CTA secundário volta para "Começar"

**Given** a seção mencione "11 instituições"
**When** atualizo o número
**Then** o valor é fetched de `institutions` table em build-time (SSG) OU hardcoded com nota de revisão em `deferred-work.md` — documentar decisão

**Given** seção `#preview` com screenshots anotados
**When** visualizo
**Then** vejo 2–3 screenshots: (1) dashboard com 11 ScoreCards populados, (2) detalhe de uma instituição com GapAnalysisList, (3) opcional — formulário accordion meio preenchido
**And** cada screenshot tem callout/anotação destacando 1 elemento-chave (ex: seta para NarrativeBanner: "Texto gerado por IA explicando seu score")
**And** screenshots são assets estáticos em `public/landing/` (não live dashboard) para SSG funcionar sem auth

**Given** screenshots podem expor dados pessoais de usuários beta
**When** capturo
**Then** uso conta/currículo mock (nome genérico "Lucas", email fictício); sem PII real

### Story 6.2: Social proof + FAQ + footer institucional

As a visitante que precisa de validação social e respostas rápidas,
I want ver que outros alunos confiam no produto, ter minhas objeções respondidas e navegar para conteúdo institucional,
So that sinto segurança em me cadastrar e encontro todos os caminhos esperados.

**Escopo consolidado:** Seção social proof com estatísticas reais + 2–3 depoimentos (ou fallback "Apoiado pela Medway") + seção FAQ com 5–8 perguntas em Accordion shadcn + footer institucional com 3–4 colunas (logo, links produto, links legais, redes sociais) + links para `/termos` e `/privacidade` (Story 5.1).

**Acceptance Criteria:**

**Given** seção `#social-proof`
**When** visualizo
**Then** vejo estatísticas reais (fetched em build-time ou atualizadas manualmente): número de alunos cadastrados, número de currículos preenchidos, número de instituições cobertas, número de regras configuradas
**And** 2–3 depoimentos de alunos reais (com foto opcional, nome, cidade, ano de formação) — coletados via formulário ou comunidade Medway
**And** se não houver depoimentos coletados, substituir por seção alternativa ("Apoiado pela Medway — 10 anos preparando médicos") e documentar gap em `deferred-work.md`

**Given** consentimento LGPD dos alunos citados
**When** uso depoimento
**Then** tenho registro escrito de autorização (campo dedicado no form de coleta ou email separado)

**Given** seção `#faq` com `Accordion` do shadcn
**When** visualizo
**Then** vejo 5–8 perguntas cobrindo: é gratuito?, meus dados são seguros?, quais instituições cobrem?, como calculam meu score?, preciso pagar depois?, posso excluir meus dados?, quanto tempo leva pra preencher?, a Medway faz mentoria baseada nisso?
**And** cada resposta ≤3 parágrafos, linguagem direta, sem jargão técnico
**And** links internos para `/termos`, `/privacidade` (Story 5.1) quando aplicável

**Given** footer no final da landing (e eventualmente em outras páginas públicas)
**When** visualizo
**Then** vejo 3–4 colunas: (1) logo Medway + tagline curta, (2) links produto ("Como funciona", "FAQ", "Cadastrar"), (3) links institucionais ("Termos de Uso", "Política de Privacidade", "Contato"), (4) redes sociais Medway (Instagram, YouTube, LinkedIn)
**And** linha inferior com "© 2026 Medway — Todos os direitos reservados" + versão da landing (opcional)

**Given** responsivo
**When** mobile
**Then** colunas empilham; links mantêm ≥44px touch target

**Given** Story 5.1 ainda não estar completa quando Story 6.2 rodar
**When** links `/termos` e `/privacidade` não existirem
**Then** link leva para placeholder `/em-breve` OU aguardar 5.1 completar (bloqueio formal) — documentar decisão no commit
