---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-04-13'
lastStep: 8
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-04-13.md
workflowType: 'architecture'
project_name: 'curriculo-medway'
user_name: 'Rcfranco'
date: '2026-04-13'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (34 FRs em 7 grupos):**

- **Acesso & Captação (FR1–FR6):** landing pública, cadastro com dados de lead, aceite LGPD, login/logout, recuperação de senha
- **Gestão de Currículo (FR7–FR10):** formulário multi-seção, edição livre, persistência automática, resumo
- **Cálculo & Resultados (FR11–FR16):** scores por instituição, detalhes por categoria, gap analysis, disclaimer, link para edital
- **Dashboard (FR17–FR19):** visão consolidada, identificação rápida de melhor/pior desempenho, drill-down
- **Motor de Regras (FR20–FR24):** regras configuráveis por instituição × especialidade, recálculo assíncrono, extensibilidade sem deploy
- **Painel Admin (FR25–FR31):** CRUD de instituições/regras/editais, gestão e exportação de leads (CSV/Hubspot), métricas
- **Compliance (FR32–FR34):** termos de uso, direito ao esquecimento, anonimização para benchmarks

**Non-Functional Requirements (23 NFRs):**

- **Performance:** landing <2s (SSG), app logado <3s, cálculo <1s, save <500ms, export 10k leads em <10s
- **Segurança:** TLS 1.2+, JWT via Supabase Auth, role admin obrigatório para painel, criptografia em repouso, bcrypt
- **Escalabilidade:** 1k usuários no Q1, 10k no ano 1 sem reescrita
- **Acessibilidade:** contraste 4.5:1, labels, navegação por teclado, tamanhos mínimos
- **Integração:** Hubspot, Supabase Storage (PDFs até 10MB)
- **Disponibilidade:** uptime 99%+, backups automáticos Supabase

**Scale & Complexity:**

- Domínio técnico primário: **Full-stack web (frontend SPA/SSG + backend API + Postgres)**
- Nível de complexidade: **Média**
- Componentes arquiteturais estimados: ~8–10 (landing/SSG, app SPA autenticada, API, motor de regras, Auth, Storage, admin panel, integração Hubspot, módulo de export)

### Technical Constraints & Dependencies

- **Brownfield:** projeto parte de protótipo Lovable existente (React + TypeScript + Tailwind + Vite); migração/evolução precisa considerar o código atual
- **Stack direcional (a validar em step 04):** Next.js como framework sugerido; Supabase (Postgres + Auth + Storage) como backend acelerador
- **Hospedagem evolutiva:** Railway no MVP → Google Cloud em produção
- **Design System Medway:** Navy #00205B, Teal #01CFB5, Montserrat; desktop-first mobile-friendly
- **Prazo crítico:** produto estável até fim de abril/2026; janela de atualização de editais jul–nov cria SLA operacional de 72h
- **Equipe:** 1 dev (Rcfranco) — arquitetura precisa priorizar simplicidade e velocidade sobre sofisticação
- **Cálculo hoje é client-side:** migração para backend é inevitável para atender FR22 (recálculo) e integridade

### Cross-Cutting Concerns Identified

- **Autenticação/Autorização:** dois perfis (aluno, admin) com áreas e permissões distintas; RLS no Supabase é candidato natural
- **Persistência e integridade de dados:** formulário com autosave, recálculo assíncrono desencadeado por mudança de regras
- **Motor de regras:** schema Postgres × estrutura JSON — decisão de modelagem crítica que afeta admin, cálculo e extensibilidade
- **Compliance LGPD:** atravessa cadastro, storage, admin e feature de exclusão
- **SEO vs autenticação:** fronteira clara entre conteúdo indexável e área privada (afeta roteamento e renderização)
- **Observabilidade:** uptime 99% implica monitoring mínimo (logs, erros, health checks)
- **Integração Hubspot:** export CSV obrigatório no MVP; integração direta pode ser iteração futura
- **Design System:** consistência visual aplicada em landing, app e admin

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web app (brownfield) — frontend SPA já existente + backend a ser adicionado via Supabase.

### Starter Options Considered

Como projeto brownfield originado do Lovable, a decisão não foi escolher um starter do zero, e sim avaliar se migramos a base atual. Três opções foram avaliadas:

1. **Manter Vite + React (atual) + Supabase** — evolução da base existente; SSG da landing via `vite-ssg` ou pré-renderização
2. **Migrar para Next.js 15 (App Router)** — SSG/SSR/CSR nativos, mas custo de migração alto
3. **Híbrido: Vite (app) + site estático separado para landing** — SEO resolvido sem migrar, mas complexidade operacional dobrada

### Selected Starter: Base Vite existente (evoluída, não substituída)

**Rationale for Selection:**

- **Prazo crítico (fim abril/2026) com 1 dev** é o driver dominante — migração consumiria semanas que devem ir para o motor de regras, admin e integração Supabase
- Base atual já cobre todas as micro-decisões de UI, forms, data-fetching e roteamento — valor acumulado que descartar seria desperdício
- SEO "básico no lançamento" (NFR PRD) é atendível com SSG leve sobre a landing (`vite-ssg` ou `react-snap`) sem migração
- Next.js segue como caminho de upgrade pós-MVP se SEO avançado se tornar prioridade e recursos justificarem

**Initialization Command:**

N/A — projeto já inicializado no repositório. A primeira história de implementação será:
1. Configurar projeto Supabase (DB + Auth + Storage)
2. Adicionar cliente Supabase (`@supabase/supabase-js`) ao projeto
3. Remover código residual do protótipo Lovable que não se aplica ao produto final

**Architectural Decisions Provided by Current Base:**

**Language & Runtime:**
- TypeScript 5.x estrito + React 18.3 + Node 20+ (dev) / Bun lockfile presente

**Styling Solution:**
- Tailwind CSS + shadcn/ui (Radix UI primitives) + next-themes + Lucide icons
- Design System Medway será aplicado via configuração Tailwind (cores navy/teal + Montserrat)

**Build Tooling:**
- Vite 5 (dev server, HMR, build otimizado)
- PostCSS configurado

**Testing Framework:**
- Vitest configurado (unitários + integração do frontend)
- Opção de adicionar Playwright para E2E em iteração posterior

**Code Organization:**
- `src/pages/` — páginas/rotas (React Router v6)
- `src/components/` — componentes (shadcn/ui em `components/ui/`)
- `src/hooks/` — custom hooks
- `src/lib/` — utilitários
- `src/test/` — testes

**Data & Forms:**
- `@tanstack/react-query` para fetching/cache
- `react-hook-form` + `zod` para forms com validação

**Development Experience:**
- Hot reloading via Vite
- ESLint flat config
- TypeScript strict mode

**Gaps a preencher em decisões arquiteturais (step 04):**
- Backend (Supabase confirmado no PRD — a detalhar)
- Estratégia de SSG para landing (vite-ssg, react-snap, ou outra)
- Deploy (Railway inicial → GCloud)
- Observabilidade e logging

**Note:** Como brownfield, a "primeira história" não é bootstrap do projeto, e sim integração com Supabase e limpeza de código residual do Lovable.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Modelagem do motor de regras (híbrido relacional + JSONB)
- Estratégia de cálculo de scores (Database Function via RPC)
- Autenticação e autorização (Supabase Auth + RLS)
- Estrutura de migrations (Supabase CLI)

**Important Decisions (Shape Architecture):**
- SSG da landing (vite-ssg)
- Hospedagem MVP (Vercel sugerido no lugar de Railway)
- Monitoring (Sentry + Supabase Logs)
- Integração Hubspot (export CSV manual no MVP)

**Deferred Decisions (Post-MVP):**
- Integração direta Hubspot via API
- Notificações automatizadas (email/push) de mudança de regras
- Dark mode (NFR desejável D3)
- WCAG 2.1 AA completo
- Testes E2E com Playwright
- Multi-região / CDN avançado
- IA e recomendações (Fase 2)

### Data Architecture

- **Banco de dados:** Supabase Postgres (plano gratuito → Pro conforme demanda)
- **Modelagem do motor de regras:** Híbrido relacional + JSONB
  - `institutions` (id, nome, edital_url, pdf_path)
  - `specialties` (id, nome)
  - `scoring_rules` (id, institution_id, specialty_id NULL=default, category, field_key, weight, max_points, description, formula JSONB)
  - `curriculum_fields` — catálogo de campos do currículo
  - `profiles` — usuários com coluna `role` (student/admin)
  - `user_curriculum` — dados do currículo por usuário
  - `user_scores` — cache de scores calculados com flag `stale`
- **Validação:** Zod compartilhado entre frontend e Edge Functions via `src/lib/schemas/`
- **Migrations:** Supabase CLI, arquivos SQL versionados em `supabase/migrations/`
- **Caching:** @tanstack/react-query no cliente; sem Redis no MVP

### Authentication & Security

- **Autenticação:** Supabase Auth (email/senha + recuperação por email); JWT gerenciado nativamente
- **Autorização:** Row Level Security (RLS) do Postgres + coluna `role` em `profiles`
  - `role='student'` (default): acesso apenas aos próprios dados
  - `role='admin'`: acesso a regras, instituições e leads
- **Criptografia & TLS:** Padrão Supabase — at-rest encryption, TLS 1.3, bcrypt para senhas
- **LGPD — direito ao esquecimento:** Edge Function `delete-account` com cascade delete; dados agregados/anonimizados mantidos separadamente

### API & Communication Patterns

- **Padrão de API:** PostgREST auto-gerada pelo Supabase (via `@supabase/supabase-js`) para CRUD + Edge Functions (Deno) para lógica que não cabe em SQL/RLS
- **Cálculo de scores:** Database Function (PL/pgSQL) `calculate_scores(user_id)` chamada via RPC
  - Trigger ao atualizar regras marca `scores_stale = true` no user afetado
  - Frontend dispara recálculo no próximo acesso
- **Error handling:** Padrão `{ data, error }` do Supabase no cliente; toast via Sonner; erros server-side em Supabase Logs
- **Rate limiting:** Nativo Supabase Auth no MVP; limites custom em Edge Functions críticas se necessário
- **Integrações externas:** Hubspot via export CSV manual no MVP; integração direta diferida

### Frontend Architecture

- **State management:** @tanstack/react-query (server state) + React Context (sessão/tema); sem Zustand/Redux
- **Estrutura de componentes:**
  - `src/components/ui/` — primitives shadcn/ui
  - `src/components/features/` — componentes de domínio (CurriculumForm, ScoreCard, GapAnalysis, LeadsTable)
  - `src/components/layout/` — headers, sidebars, shells
- **Roteamento:** React Router v6
  - `/` — landing (pública, SSG)
  - `/login`, `/signup`, `/forgot-password` — auth
  - `/app/*` — área autenticada (dashboard, currículo, resultados)
  - `/admin/*` — painel admin (guard RLS + frontend)
- **SSG landing:** `vite-ssg` — integração nativa com Vite + React Router
- **Design System Medway:** tokens via `tailwind.config.ts` (navy #00205B, teal #01CFB5) + Montserrat via Google Fonts + shadcn/ui tematizado
- **Formulário de currículo (autosave):** react-hook-form + `watch` com debounce 800ms disparando upsert Supabase; feedback "salvando/salvo" via toast discreto

### Infrastructure & Deployment

- **Hospedagem frontend (MVP):** Vercel (sugerido no lugar de Railway) — deploy simples para Vite, previews automáticos por PR, tier gratuito adequado; GCloud em produção pós-MVP
- **Backend:** Supabase cloud (Free → Pro conforme demanda); Edge Functions onde aplicável
- **CI/CD:** GitHub Actions — lint + test + build em PRs; deploy automático em merge para `main`
- **Ambientes:** 3 projetos Supabase (local via CLI, staging, production); variáveis em `.env.local` + secrets Vercel
- **Monitoring:** Sentry (free) para frontend + Supabase Logs nativo para backend + Better Uptime / UptimeRobot para uptime check
- **Backups:** Nativos Supabase Pro quando volume justificar
- **Escalonamento:** Vertical via Supabase Pro até 10k usuários; sem multi-região no MVP

### Decision Impact Analysis

**Implementation Sequence:**

1. Setup Supabase + migrations base (`profiles`, `institutions`, `specialties`, `scoring_rules`, `curriculum_fields`, `user_curriculum`, `user_scores`)
2. Integração Supabase Auth + RLS policies + flow de signup/login
3. Formulário de currículo com autosave
4. Database function `calculate_scores` + RPC + trigger de invalidação
5. Dashboard + gap analysis
6. Painel admin (CRUD regras, instituições, editais)
7. Gestão e export de leads (CSV)
8. SSG da landing + SEO básico + disclaimer e LGPD
9. Deploy (Vercel + Supabase) + monitoring + CI/CD

**Cross-Component Dependencies:**

- RLS policies dependem da definição de `role` em `profiles` — precisa ser o primeiro passo após migrations base
- `calculate_scores` depende do schema de `scoring_rules` e `user_curriculum` estarem finalizados
- Painel admin depende de RLS para proteger endpoints PostgREST sensíveis
- SSG landing depende de decisão de meta tags/OG — deve ser feita antes do deploy final
- Export Hubspot CSV depende apenas do schema de `profiles` (dados do lead) — pode ser desenvolvido em paralelo

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

~30 áreas de conflito potencial identificadas entre agentes de IA, com regra única para cada.

### Naming Patterns

**Database (Postgres/Supabase):**

- Tabelas: `snake_case`, plural (`users`, `scoring_rules`, `user_curriculum`)
- Colunas: `snake_case` (`user_id`, `created_at`, `is_active`)
- Chaves primárias: sempre `id uuid DEFAULT gen_random_uuid()`
- Foreign keys: `{referenced_table_singular}_id` (`institution_id`, `user_id`)
- Timestamps padrão: `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()` (+ trigger de auto-update)
- Índices: `idx_{table}_{column(s)}` (`idx_scoring_rules_institution_id`)
- Constraints: `{table}_{column}_{type}` (`users_email_unique`)
- Enums: `snake_case` valores (`'student'`, `'admin'`)
- Funções SQL: `snake_case` verbo-primeiro (`calculate_scores`, `mark_scores_stale`)
- RLS policies: nome descritivo (`"students can read own curriculum"`)

**API (PostgREST + Edge Functions):**

- Endpoints PostgREST: automáticos, usar nome da tabela (`/rest/v1/scoring_rules`)
- Edge Functions: `kebab-case` (`/functions/v1/calculate-scores`, `/functions/v1/export-leads`, `/functions/v1/delete-account`)
- Query params PostgREST: convenção nativa (`?institution_id=eq.{uuid}&order=name.asc`)
- Request/response body: `snake_case` (espelha Postgres, evita mapeamento duplo)

**TypeScript / React:**

- Componentes: `PascalCase` — arquivo e nome iguais (`CurriculumForm.tsx`)
- Hooks: `useCamelCase` (`useCurriculum`, `useScores`)
- Funções utilitárias: `camelCase`
- Variáveis/props: `camelCase`
- Constantes globais: `SCREAMING_SNAKE_CASE` (`MAX_FILE_SIZE_MB`)
- Tipos/interfaces: `PascalCase` sem prefixo `I`
- Tipos Supabase gerados: `src/lib/database.types.ts` via `supabase gen types`
- **Manter snake_case no TS quando vindo do banco** — não mapear para camelCase

**Rotas:**

- Rotas: `kebab-case` (`/forgot-password`, `/app/curriculo`, `/admin/regras`)
- Parâmetros de rota: `:paramName` em camelCase (`/app/resultados/:institutionId`)

### Structure Patterns

**Organização de testes:**

- Co-localizados: `Component.tsx` + `Component.test.tsx` no mesmo diretório
- Lib/hooks: `use-something.ts` + `use-something.test.ts`
- SQL functions: `supabase/tests/` com pgTAP quando aplicável

**Organização de componentes (por feature, não por tipo):**

- `src/components/ui/` — primitives shadcn (mantido)
- `src/components/layout/` — AppShell, AdminShell, PublicHeader, Footer
- `src/components/features/{feature}/` — agrupamento por domínio:
  - `curriculum/`, `scoring/`, `admin/`, `auth/`

**Utilitários compartilhados:**

- `src/lib/supabase.ts` — cliente singleton
- `src/lib/schemas/` — schemas Zod
- `src/lib/queries/` — wrappers React Query por domínio (`scoring.ts`, `curriculum.ts`, `admin.ts`)
- `src/lib/utils.ts` — utils genéricos
- `src/lib/database.types.ts` — tipos gerados

**Configuração e assets:**

- `supabase/` — migrations, functions, seeds
- `public/` — assets estáticos servidos direto
- `src/assets/` — imagens importadas pelo código
- `.env.local`, `.env.example` — na raiz
- Sem pastas `constants/` — usar módulos nomeados

**Documentação:**

- `README.md` — setup e visão geral
- `docs/` — guias operacionais
- `_bmad-output/planning-artifacts/` — PRD, arquitetura, research

### Format Patterns

**Respostas de API:**

- PostgREST: array ou objeto nativos, sem wrapper
- Edge Functions: padrão `{ data, error }` (compatível com helper Supabase):
  - sucesso: `{ "data": {...}, "error": null }`
  - erro: `{ "data": null, "error": { "message": "...", "code": "INVALID_INPUT" } }`
- Status codes: HTTP semânticos (200/201/204, 400, 401, 403, 404, 409, 500)
- Error codes internos: `SCREAMING_SNAKE_CASE` (`INVALID_INPUT`, `RULE_NOT_FOUND`, `UNAUTHORIZED_ROLE`)

**Formato de dados:**

- JSON: `snake_case` (espelha Postgres)
- Datas: ISO 8601 string (`"2026-04-13T14:30:00Z"`), nunca timestamp numérico
- Booleanos: `true`/`false`, nunca 0/1
- Dinheiro/pontuação: `numeric` no banco, `number` em JS, 2 casas ao exibir
- Campos opcionais: `null`, não omitidos
- Arrays vazios: `[]`, não `null`

### Communication Patterns

**Events (banco):**

- Triggers: `on_{event}_{table}` (`on_scoring_rule_updated`, `on_user_deleted`)
- Payloads: nativos Postgres (NEW/OLD)

**State Management (frontend):**

- React Query query keys como tupla: `['scores', userId]`, `['rules', institutionId, specialtyId]`
- Mutations com `invalidateQueries` explícito em `onSuccess`
- Arquivo `src/lib/queries/{domain}.ts` por domínio — nunca `useQuery` ad-hoc em componentes
- React Context apenas para `AuthContext` e `ThemeContext`; resto via React Query
- Imutabilidade: sempre spread/new objects
- Handlers: `handleSubmit`, `handleChange`, `handleClick`

### Process Patterns

**Error handling:**

- Cliente Supabase: sempre checar `error` antes de usar `data`
- Edge Functions: try/catch obrigatório; retornar `{ data: null, error: {...} }` consistente
- UI: erros do usuário via Sonner (`toast.error(...)`); erros críticos → Sentry
- Error boundaries: um em `src/App.tsx` global + um em `src/pages/admin/`
- Mensagens ao usuário em pt-BR, acionáveis; nunca stack traces ao aluno

**Loading states:**

- React Query: `isLoading`, `isFetching`, `isPending` nativos
- UI: skeleton shadcn para conteúdo principal; spinner inline para ações
- Autosave currículo: 3 estados ("salvando...", "salvo", "erro"); retry automático 1x
- Sem full-screen loaders exceto no boot inicial

**Validação:**

- Client: Zod + react-hook-form para feedback imediato
- Server: revalidação em Edge Functions com o mesmo schema Zod (compartilhados em `src/lib/schemas/`)
- Database: constraints + CHECK para invariantes (`CHECK (weight >= 0 AND weight <= max_points)`)
- Erros de validação por campo (react-hook-form), nunca como toast

**Autenticação:**

- Signup: email + senha + aceite LGPD → Supabase Auth → redirect `/app`
- Login: Supabase Auth → redirect `/app` (ou `/admin` se role admin)
- Guard: HOC `<ProtectedRoute role="student|admin">` em grupos de rota
- Session: `AuthContext` escuta `onAuthStateChange` do Supabase

**Logging:**

- Frontend: `console.warn`/`console.error` apenas em dev; produção → Sentry
- Edge Functions: `console.log` estruturado (JSON), Supabase captura nativamente
- **Sem PII em logs** (email, nome, telefone, senha)

### Enforcement Guidelines

**Todos os agentes de IA DEVEM:**

1. Usar snake_case em todo o stack de dados (Postgres, JSON, tipos gerados); camelCase apenas em identificadores TS locais não vindos do banco
2. Consultar `src/lib/database.types.ts` como fonte de verdade; nunca redefinir tipos manualmente
3. Colocar schemas Zod em `src/lib/schemas/` e reutilizá-los entre client e Edge Functions
4. Usar React Query para todo data fetching — nenhum `fetch`/`supabase.from().select()` direto em componentes
5. Sempre checar `error` antes de usar `data` de chamadas Supabase
6. Criar queries/mutations em `src/lib/queries/{domain}.ts`, não inline
7. Mensagens ao usuário em pt-BR, acionáveis, sem jargão técnico
8. Nunca logar PII
9. Respeitar RLS — nunca usar service_role key no cliente
10. Escrever testes co-localizados (`.test.ts(x)`) para lib e hooks de domínio

**Como verificar aderência:**

- ESLint + typescript-eslint estritos
- Supabase types gerados no CI (`supabase gen types typescript > src/lib/database.types.ts`)
- Code review com checklist de pattern violations como bloqueadores
- Desvios justificados documentados em `docs/architecture-deviations.md`

### Pattern Examples

**✅ Correto:**

```typescript
// src/lib/queries/scoring.ts
export function useScores(userId: string) {
  return useQuery({
    queryKey: ['scores', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_scores', { p_user_id: userId });
      if (error) throw error;
      return data;
    },
  });
}

// Uso no componente
const { data: scores, isLoading, error } = useScores(userId);
if (error) return <ErrorState message="Não foi possível carregar seus scores." />;
```

**❌ Anti-padrão:**

```typescript
// fetch direto no componente, sem React Query, sem checar erro
const ScoreCard = ({ userId }) => {
  const [scores, setScores] = useState(null);
  useEffect(() => {
    supabase.from('user_scores').select('*').eq('user_id', userId)
      .then(({ data }) => setScores(data)); // erro não tratado
  }, [userId]);
};
```

## Project Structure & Boundaries

### Requirements → Components Mapping

| Área | FRs cobertos | Localização |
|------|--------------|-------------|
| Landing & SEO | FR1 | `src/pages/Landing.tsx`, SSG via `vite-ssg` |
| Captação de Leads | FR2, FR3, FR32 | `src/components/features/auth/SignupForm.tsx`, `src/lib/queries/auth.ts`, `src/lib/schemas/signup.ts` |
| Autenticação | FR4, FR5, FR6 | `src/components/features/auth/*`, `src/contexts/AuthContext.tsx`, `src/components/layout/ProtectedRoute.tsx` |
| Currículo | FR7–FR10 | `src/components/features/curriculum/*`, `src/lib/queries/curriculum.ts`, Postgres: `user_curriculum`, `curriculum_fields` |
| Cálculo de Scores | FR11 | Postgres: `calculate_scores()`; Edge Function opcional |
| Resultados/Gap Analysis | FR12–FR16 | `src/components/features/scoring/*`, `src/lib/queries/scoring.ts`, Postgres: `user_scores` |
| Dashboard | FR17–FR19 | `src/pages/app/Dashboard.tsx`, `src/components/features/scoring/ScoreDashboard.tsx` |
| Motor de Regras | FR20–FR24 | Postgres: `scoring_rules`, `institutions`, `specialties`; trigger `mark_scores_stale` |
| Admin — Instituições/Regras | FR25–FR27 | `src/pages/admin/*`, `src/components/features/admin/*`, `src/lib/queries/admin.ts` |
| Admin — Leads | FR28–FR31 | `src/components/features/admin/LeadsTable.tsx`, Edge Function `export-leads` |
| LGPD / Exclusão | FR33, FR34 | Edge Function `delete-account`, `src/pages/app/AccountSettings.tsx` |

### Complete Project Directory Structure

```
curriculo-medway/
├── README.md
├── package.json
├── bun.lockb / package-lock.json
├── vite.config.ts                      # Vite + vite-ssg
├── vitest.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── tailwind.config.ts                  # tokens Medway (navy, teal, Montserrat)
├── postcss.config.js
├── eslint.config.js
├── components.json                     # shadcn/ui config
├── index.html
├── .env.local                          # gitignored
├── .env.example
├── .gitignore
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── docs/
│   ├── architecture-deviations.md
│   ├── deployment.md
│   ├── rules-engine.md
│   └── lgpd.md
├── _bmad-output/planning-artifacts/
│   ├── prd.md
│   ├── architecture.md
│   └── implementation-readiness-report-*.md
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── main.tsx
│   ├── App.tsx                         # root + error boundary + providers
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── assets/
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── components/
│   │   ├── ui/                         # shadcn primitives
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── AdminShell.tsx
│   │   │   ├── PublicHeader.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── features/
│   │       ├── auth/
│   │       ├── curriculum/
│   │       ├── scoring/
│   │       └── admin/
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── use-autosave.ts
│   │   └── use-role.ts
│   ├── lib/
│   │   ├── supabase.ts                 # cliente singleton
│   │   ├── database.types.ts           # GERADO — não editar
│   │   ├── utils.ts
│   │   ├── constants/
│   │   ├── schemas/                    # Zod compartilhados
│   │   ├── queries/                    # React Query wrappers por domínio
│   │   └── formatters/
│   ├── pages/
│   │   ├── Landing.tsx                 # SSG
│   │   ├── NotFound.tsx
│   │   ├── auth/
│   │   ├── app/
│   │   └── admin/
│   ├── router.tsx
│   └── test/
│       ├── setup.ts
│       ├── test-utils.tsx
│       └── mocks/
└── supabase/
    ├── config.toml
    ├── migrations/
    ├── functions/
    │   ├── _shared/
    │   ├── calculate-scores/
    │   ├── export-leads/
    │   └── delete-account/
    ├── seeds/
    └── tests/
```

### Architectural Boundaries

**API Boundaries:**

- Cliente ↔ Supabase: `src/lib/supabase.ts` (único ponto de entrada, anon key + RLS)
- Cliente ↔ Edge Functions: via `supabase.functions.invoke()`, apenas em `src/lib/queries/*.ts`
- Edge Functions ↔ Postgres: Deno Supabase client com service_role (server-side)
- service_role nunca exposta ao cliente — barreira física

**Component Boundaries:**

- `ui/` — primitives, zero lógica de domínio
- `features/{domain}/` — orientado a feature; importa de `ui/` e `lib/queries/`
- `layout/` — shells, headers, guards
- `pages/` — composição; lógica mínima
- Regra: `features/A/` não importa de `features/B/`; compartilhado sobe para `components/shared/` ou `lib/`

**Service Boundaries:**

- Autenticação isolada em `AuthContext` + Supabase Auth; resto via `useAuth()`
- Data fetching exclusivamente em `lib/queries/{domain}.ts`
- Schemas Zod em `lib/schemas/` compartilhados client + Edge Functions

**Data Boundaries:**

- RLS garante aluno lê só `auth.uid() = user_id`
- `institutions`, `specialties`, `scoring_rules` públicos via RLS permissiva
- Escrita de regras apenas `role = 'admin'`
- Leads PII apenas admin
- Anonimização via views materializadas para benchmarks

### Integration Points

**Internal Communication:**

- Cliente → Supabase: PostgREST + RPC + Edge Functions + Auth
- Postgres: triggers marcam `user_scores.stale=true` ao mudar regras
- Frontend: React Query invalidation após mutations

**External Integrations:**

- Supabase Storage: PDFs de editais (bucket `editais`, max 10MB)
- Sentry: erros frontend + Edge Functions
- Better Uptime / UptimeRobot
- Hubspot: export CSV manual no MVP
- Google Fonts: Montserrat

**Data Flow — cálculo de scores:**

1. Aluno preenche currículo → `use-autosave` → upsert `user_curriculum`
2. Trigger Postgres marca `user_scores.stale=true`
3. Aluno acessa Dashboard → `useScores()`
4. Se stale, RPC `calculate_scores(user_id)` atualiza `user_scores`
5. React Query cache atualizado → UI renderiza

### File Organization Patterns

- Config na raiz; `.env.local` gitignored; `.env.example` commitado
- Fonte feature-based; domínios espelhados em `lib/queries/`, `lib/schemas/`, `supabase/migrations/`
- Testes co-localizados; `src/test/` só setup/mocks; `supabase/tests/` pgTAP
- `public/` servido como-está; `src/assets/` processado pelo Vite

### Development Workflow

**Dev server:**

```bash
supabase start     # Terminal 1
bun dev            # Terminal 2
```

**Build:**

```bash
supabase gen types typescript --local > src/lib/database.types.ts
bun run build
```

**Deploy:**

- Vercel automático no merge para `main`
- Edge Functions: `supabase functions deploy`
- Migrations: `supabase db push` em CI com approval manual em produção

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Stack Vite + React Query + Supabase é combinação amplamente validada em produção. Nenhuma decisão contradiz outra. Todas versões ativamente mantidas.

**Pattern Consistency:** snake_case end-to-end (Postgres → JSON → types gerados → TS) elimina mapeamento duplo. React Query centralizando fetching elimina divergência entre agentes.

**Structure Alignment:** `src/lib/queries/`, `src/lib/schemas/`, `supabase/migrations/` e `supabase/functions/` espelham os mesmos domínios (auth, curriculum, scoring, admin), reforçando coesão.

### Requirements Coverage Validation ✅

**Functional Requirements:** 33/34 cobertos por componentes, queries, funções SQL ou Edge Functions explícitas. 1 gap menor: FR10 (resumo do currículo) — resolvido com `CurriculumSummary.tsx` em `features/curriculum/`.

**Non-Functional Requirements:** 22/23 plenamente cobertos. Atenção a:
- NFR3 (<1s cálculo) — validar empiricamente com volume real
- NFR15–18 (a11y) — shadcn + tokens Medway cobrem bases; falta checklist manual de keyboard/tab no PR review

### Implementation Readiness Validation ✅

**Decision Completeness:** todas as decisões críticas documentadas com rationale, componentes afetados e sequência de implementação.

**Structure Completeness:** árvore de diretórios específica, boundaries explícitos, mapeamento FR → estrutura.

**Pattern Completeness:** ~30 pontos de conflito endereçados; exemplos concretos; 10 regras obrigatórias para agentes de IA.

### Gap Analysis Results

**Críticos:** nenhum.

**Importantes (endereçar durante implementação):**

1. Seed inicial das regras — extrair de `src/lib/calculations.ts` (protótipo Lovable) para `supabase/seeds/scoring-rules.sql`
2. Estratégia de migração do código existente — história dedicada para reorganizar em `features/` e conectar ao Supabase
3. Rate limiting de signup — avaliar Turnstile/reCAPTCHA se surgir spam
4. Sincronização de `database.types.ts` no CI — job que roda `supabase gen types` e falha se houver drift

**Menores:**

- `CurriculumSummary.tsx` para FR10
- Checklist de a11y no PR review
- Nota clara: testes E2E diferidos pós-MVP
- Dependabot/Renovate com pin de major, permitir minor/patch

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context analisado
- [x] Escala e complexidade avaliadas (média, full-stack web, 1k→10k users)
- [x] Constraints técnicos identificados (brownfield Lovable, 1 dev, prazo abril/2026)
- [x] Cross-cutting concerns mapeados (auth, persistência, motor de regras, LGPD, SEO, observabilidade)

**✅ Architectural Decisions**
- [x] Decisões críticas documentadas (modelagem de regras, cálculo via RPC, RLS, migrations)
- [x] Stack totalmente especificado (Vite + React + TS + shadcn + Supabase + Vercel + Sentry)
- [x] Integration patterns definidos (PostgREST + RPC + Edge Functions)
- [x] Performance addressed (SSG, React Query cache, DB function)

**✅ Implementation Patterns**
- [x] Naming conventions estabelecidas (snake_case stack de dados, camelCase TS local, kebab-case rotas)
- [x] Structure patterns definidos (feature-based, co-located tests)
- [x] Communication patterns especificados (query keys, invalidation, AuthContext)
- [x] Process patterns documentados (error handling, loading, validação, auth, logging)

**✅ Project Structure**
- [x] Árvore de diretórios completa
- [x] Component boundaries estabelecidos
- [x] Integration points mapeados
- [x] Requirements → estrutura mapping completo

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** Alto — arquitetura coerente, cobre 97% dos FRs explicitamente, gaps remanescentes são incrementais e não bloqueadores.

**Key Strengths:**

- Reaproveitamento máximo da base Vite existente (preserva prazo)
- Supabase elimina toneladas de infraestrutura custom para 1 dev
- Motor de regras com modelagem híbrida (relacional + JSONB) equilibra simplicidade × flexibilidade
- Padrões de implementação detalhados reduzem divergência entre agentes de IA
- RLS como primeira linha de defesa (segurança por design)

**Areas for Future Enhancement:**

- Migração para Next.js pós-MVP se SEO avançado se tornar prioridade
- Testes E2E com Playwright
- WCAG 2.1 AA completo
- Integração direta Hubspot via API
- IA para planos de ação (Fase 2 do produto)
- Dark mode
- Multi-região / CDN

### Implementation Handoff

**AI Agent Guidelines:**

- Seguir todas as decisões arquiteturais documentadas
- Aplicar os patterns de implementação consistentemente
- Respeitar boundaries e estrutura de projeto
- Consultar este documento para qualquer dúvida arquitetural
- Em desvios justificados, documentar em `docs/architecture-deviations.md`

**First Implementation Priority:**

1. **Setup Supabase + Migration Inicial** (primeira história):
   - Criar projeto Supabase (local + cloud staging)
   - Migration 1: schema base (`profiles`, `institutions`, `specialties`, `scoring_rules`, `curriculum_fields`, `user_curriculum`, `user_scores`)
   - Migration 2: RLS policies por tabela
   - Migration 3: DB function `calculate_scores` + trigger `mark_scores_stale`
   - Seeds: extrair de `src/lib/calculations.ts` → `supabase/seeds/*.sql`
   - Gerar `src/lib/database.types.ts`
   - Adicionar `@supabase/supabase-js` e criar `src/lib/supabase.ts`
