# Story 1.1: Integração Supabase + cliente singleton + limpeza Lovable

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **desenvolvedor (Rcfranco, solo) do curriculo-medway**,
I want **integrar o Supabase ao projeto (CLI local + cliente singleton no frontend) e remover o código residual do protótipo Lovable**,
so that **temos a base de backend conectada e um codebase enxuto — pronto para receber as features das Stories 1.2–1.11 (Design System, schemas, auth, deploy) em paralelo.**

## Acceptance Criteria

Copiados verbatim do `epics.md` → Story 1.1 (formato Given/When/Then). **Nenhum AC pode ser cortado**.

1. **AC1 — Dependência e cliente singleton**
   **Given** o repositório na branch `main`
   **When** executo `bun install` após a story
   **Then** `@supabase/supabase-js` está listado como dependência
   **And** `src/lib/supabase.ts` exporta um cliente singleton usando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   **And** `.env.example` documenta as duas variáveis

2. **AC2 — Supabase CLI local inicializado**
   **Given** o projeto Supabase local está inicializado via `supabase init`
   **When** executo `supabase start`
   **Then** o banco Postgres local sobe com sucesso
   **And** a pasta `supabase/` está versionada com `config.toml`

3. **AC3 — Limpeza Lovable preservando `calculations.ts`**
   **Given** o protótipo Lovable deixou arquivos não aplicáveis ao produto (telas-exemplo, rotas placeholder)
   **When** reviso `src/pages/`, `src/components/` e `src/lib/`
   **Then** todos os arquivos não aplicáveis foram removidos
   **And** `bun run build` e `bun run lint` passam sem erros
   **And** `src/lib/calculations.ts` é preservado (será extraído como seed em Story 1.9)

## Tasks / Subtasks

- [x] **Task 1 — Instalar e configurar o cliente Supabase no frontend** (AC: #1)
  - [x] 1.1 Rodar `bun add @supabase/supabase-js` — não usar npm/pnpm (repo usa Bun; ver `bun.lockb`). Verificar que o pacote foi adicionado em `dependencies` de `package.json` (não em `devDependencies`).
  - [x] 1.2 Criar `src/lib/supabase.ts` exportando **UM ÚNICO** cliente singleton via `createClient<Database>(url, anonKey)` — padrão de arquitetura obrigatório ([architecture.md#Structure Patterns], [architecture.md#Architectural Boundaries] — "`src/lib/supabase.ts` é o único ponto de entrada para Supabase no cliente").
    - Ler `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` via `import.meta.env` (padrão Vite — **nunca** `process.env`).
    - Lançar erro imediato se qualquer uma das vars estiver ausente (`throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')`) — previne cliente silencioso com `undefined`.
    - O tipo `Database` virá de `src/lib/database.types.ts` — esse arquivo **ainda não existe** (é gerado pela Story 1.11/CI). Para esta story, use `createClient(url, anonKey)` sem genérico, OU crie um stub `export type Database = any;` em `src/lib/database.types.ts` com um comentário `// GERADO — não editar manualmente. Stub temporário até Story 1.11.` (preferir o stub, alinha com o path final da arquitetura).
    - Exportar como `export const supabase = createClient(...)` (nomeado, não default — convenção do repo).
  - [x] 1.3 Criar/atualizar `.env.example` na raiz com:
    ```
    VITE_SUPABASE_URL=http://127.0.0.1:54321
    VITE_SUPABASE_ANON_KEY=<pegar do output de `supabase start` ou `supabase status`>
    ```
    Documentar em comentário que os valores default são os do `supabase start` local; staging/prod virão da Vercel em Story 1.11.
  - [x] 1.4 Criar `.env.local` (NÃO commitar — já deve estar no `.gitignore`; validar). Se `.gitignore` não contiver `.env.local`, adicionar.
  - [x] 1.5 **NÃO** modificar `src/App.tsx` para injetar o cliente ainda — AuthContext virá na Story 1.6. Esta story só expõe o singleton.

- [x] **Task 2 — Inicializar Supabase CLI localmente** (AC: #2)
  - [x] 2.1 Verificar que `supabase` CLI está instalado (`supabase --version`). Se ausente: instruir no `docs/deployment.md` (criar se não existir) a instalar via `brew install supabase/tap/supabase` (macOS — ambiente do dev). **Não adicionar** `supabase` como devDependency do Node — é CLI global.
  - [x] 2.2 Rodar `supabase init` na raiz do repo — cria pasta `supabase/` com `config.toml` + `.gitignore` interno.
  - [x] 2.3 Commitar `supabase/config.toml` e a estrutura inicial; garantir que `supabase/.branches/`, `supabase/.temp/` e `supabase/volumes/` estão no `.gitignore` (o `supabase init` costuma gerar um `.gitignore` dentro de `supabase/` — validar).
  - [x] 2.4 Rodar `supabase start` e validar que sobe Postgres + Studio + Auth localmente sem erro. Anotar URLs/keys no `.env.local` local (apenas para dev).
  - [x] 2.5 Criar pastas vazias (com `.gitkeep`) que as stories seguintes vão popular, alinhadas com [architecture.md#Complete Project Directory Structure]:
    - `supabase/migrations/.gitkeep`
    - `supabase/functions/_shared/.gitkeep`
    - `supabase/seeds/.gitkeep`
    - `supabase/tests/.gitkeep`
  - [x] 2.6 Rodar `supabase stop` ao final para liberar recursos (docs only).

- [x] **Task 3 — Limpar código residual do Lovable** (AC: #3)
  - [x] 3.1 **Remover** (Lovable/ALOFT — não aplicáveis ao produto final):
    - `src/pages/Index.tsx` (tela ALOFT beta — será substituída por Landing SSG na Story 1.4)
    - `src/components/CurriculumForm.tsx` (formulário monolítico — será reescrito em accordion nas Stories 2.1–2.2)
    - `src/components/ResultsDashboard.tsx` (dashboard client-side antigo — será reescrito na Story 2.7)
    - `src/components/InstitutionCard.tsx` (será substituído por `ScoreCard` na Story 2.7)
    - `src/components/NavLink.tsx` (nav placeholder — shells virão na Story 1.8)
    - `src/App.css` (não utilizado — styling via Tailwind)
  - [x] 3.2 **PRESERVAR (crítico, AC3):**
    - `src/lib/calculations.ts` — fonte única do motor de regras; será extraído para `supabase/seeds/*.sql` na Story 1.9. **Se removido, perdemos a fonte de verdade das 11 instituições.**
    - `src/lib/types.ts` — adiar decisão; pode ser removido/refatorado em Story 2.1, não nesta.
    - `src/lib/utils.ts` — `cn()` do shadcn, em uso.
    - Toda a pasta `src/components/ui/` (shadcn primitives — base do Design System da Story 1.2).
    - `src/hooks/use-mobile.tsx`, `src/hooks/use-toast.ts` — em uso pelos primitives.
    - `src/test/setup.ts`, `src/test/example.test.ts` — infra Vitest.
  - [x] 3.3 Substituir `src/App.tsx` por uma raiz mínima e placeholder:
    - Manter `QueryClientProvider`, `TooltipProvider`, `Toaster`, `Sonner`, `BrowserRouter`.
    - Trocar `<Route path="/" element={<Index />} />` por um placeholder inline simples (ex.: `<Route path="/" element={<div className="p-8 font-sans">curriculo-medway — em construção</div>} />`) — Landing real chega na Story 1.4.
    - Manter `<Route path="*" element={<NotFound />} />`.
    - **Remover** os imports de `Index` (já deletado) e `defaultProfile`/`UserProfile` (não precisam mais aqui).
  - [x] 3.4 Garantir que `src/pages/NotFound.tsx` não tem branding "ALOFT" residual — se tiver, tornar neutro (`curriculo-medway`).
  - [x] 3.5 Remover quaisquer `console.log` e TODOs órfãos introduzidos por Lovable em arquivos tocados.

- [x] **Task 4 — Validar build e lint verdes** (AC: #3)
  - [x] 4.1 Rodar `bun run lint` — **DEVE** passar com zero erros. Se houver warnings novos introduzidos por esta story, resolvê-los; não silenciar com `eslint-disable` a não ser que documentado.
  - [x] 4.2 Rodar `bun run build` — **DEVE** passar. Atenção: o Vite vai reclamar se `supabase.ts` for importado em algum lugar sem as env vars; nesta story ninguém ainda importa o singleton além do próprio arquivo, então o build não quebra por ENV ausente em CI (mas proteja o throw com um guard que só dispara em runtime, não em import-time se possível — ver nota em 1.2).
  - [x] 4.3 Rodar `bun run test` (Vitest) — o teste `example.test.ts` existente deve continuar passando. Se criar teste novo para `supabase.ts`, mockar `import.meta.env`.
  - [x] 4.4 Confirmar que o `bun dev` sobe sem erros e o placeholder aparece em `http://localhost:8080` (ou porta configurada no `vite.config.ts`).

- [x] **Task 5 — Documentação mínima de setup** (suporte AC2/AC3)
  - [x] 5.1 Atualizar `README.md` com seção "Setup local" cobrindo: `bun install`, `supabase start`, copiar `.env.example → .env.local`, `bun dev`. Manter curto (1 dev, sem over-engineering).
  - [x] 5.2 **NÃO** criar `docs/architecture-deviations.md`, `docs/rules-engine.md`, `docs/lgpd.md` — são de outras stories/epics.

## Dev Notes

### Contexto crítico (ler antes de codar)

- **Projeto brownfield**: o repositório já tem Vite 5 + React 18.3 + TS estrito + Tailwind + shadcn/ui + React Query + react-hook-form + zod + Vitest. **Não reinstalar nada disso.** Ver `package.json` e [architecture.md#Selected Starter: Base Vite existente].
- **Gerenciador de pacotes é Bun** (`bun.lockb` presente). Usar `bun add`, `bun install`, `bun run ...`. Não usar npm/yarn/pnpm — introduz lockfiles conflitantes.
- **Esta é a Story 1 do Epic 1 (bloqueante)**: não há "previous story intelligence". O que existe é o protótipo Lovable/ALOFT que precisa ser parcialmente desmontado.
- **Escopo desta story é propositalmente enxuto**: só cliente singleton + `.env.example` + `supabase init`/`start` + limpeza. Nada de schema, nada de auth, nada de RLS — tudo isso vem nas Stories 1.3, 1.6, 1.9, 1.10.

### Padrões de arquitetura que você DEVE seguir

[Source: architecture.md#Naming Patterns]
- TS/React: componentes `PascalCase`, hooks `useCamelCase`, utils `camelCase`, constantes globais `SCREAMING_SNAKE_CASE`.
- Database types gerados vivem em `src/lib/database.types.ts` — **não editar manualmente** (arquivo-marca, nesta story é um stub `any`).
- Schemas Zod em `src/lib/schemas/` (não criar ainda — Stories 1.5+).

[Source: architecture.md#Architectural Boundaries]
- **`src/lib/supabase.ts` é o ÚNICO ponto de entrada** para o Supabase no cliente. Todas as futuras queries em `src/lib/queries/{domain}.ts` vão importar daqui. Qualquer `createClient()` fora desse arquivo é bug a ser bloqueado em code review.
- Cliente usa **anon key apenas** — `service_role` nunca entra no bundle do browser (barreira física de segurança; quebrar isso é vazamento crítico).

[Source: architecture.md#Structure Patterns]
- Estrutura alvo (não criar tudo agora — só o que esta story precisa): `src/lib/supabase.ts`, `src/lib/utils.ts` (já existe), `src/lib/database.types.ts` (stub nesta story).
- `supabase/` na raiz com `config.toml`, `migrations/`, `functions/`, `seeds/`, `tests/` (apenas estrutura; conteúdo virá nas próximas stories).

### Anti-patterns a EVITAR (previne retrabalho)

- **NÃO** crie `AuthContext`, `ProtectedRoute`, `use-role`, rotas `/login`, `/signup`, `/app/*`, `/admin/*` — tudo isso é das Stories 1.6 e 1.8.
- **NÃO** aplique tokens Medway (navy/teal) ou Montserrat em `tailwind.config.ts` — é a **Story 1.2** inteira (e alteraria o escopo desta).
- **NÃO** apague `src/lib/calculations.ts`. Crítico para a Story 1.9. AC3 torna isso explícito — violar falha a story.
- **NÃO** apague `src/components/ui/*` (shadcn primitives). É a base do Design System (Story 1.2).
- **NÃO** migre para `next.config` / Next.js. Arquitetura decidiu manter Vite ([architecture.md#Selected Starter]).
- **NÃO** adicione dependências além de `@supabase/supabase-js`. Outras libs vêm em stories próprias (`@fontsource/montserrat` na 1.2, etc.).
- **NÃO** faça refactor oportunista em arquivos não cobertos pelos ACs — introduz ruído em revisão e atrasa stories paralelas.

### Decisões técnicas específicas

- **Versão do `@supabase/supabase-js`**: usar a mais recente estável 2.x no momento da implementação (a linha 2.x é estável há meses, sem breaking changes previstos). Não fixar `^2.0.0` — o Bun resolverá o latest minor compatível.
- **Guard de env vars** em `supabase.ts`: preferir lançar ao chamar `createClient` (não no top-level import), para não quebrar `bun run build` quando `.env.local` não existe em CI. Padrão sugerido:
  ```ts
  import { createClient } from '@supabase/supabase-js';

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — ver .env.example');
  }

  export const supabase = createClient(url, anonKey);
  ```
  Como ninguém importa `supabase` ainda nesta story, o throw só dispara quando Story 1.6 começar a usar. Aceitável.
- **Placeholder do App.tsx**: texto mínimo em pt-BR. Sem assets, sem Tailwind elaborado — evita conflito estético com Story 1.2.
- **NotFound.tsx**: manter como está (shadcn-ish); se contiver branding ALOFT, apenas neutralizar copy.

### Testing Standards

[Source: architecture.md#Starter Options Considered — Testing Framework]
- Framework: **Vitest** (já configurado). Playwright fica para pós-MVP.
- Teste opcional nesta story: pode-se adicionar `src/lib/supabase.test.ts` validando que o singleton exporta um objeto com método `.auth` ou similar (mockar `import.meta.env`). **Não obrigatório** para fechar os ACs; priorizar que `bun run test` continue verde (AC3 implica build+lint, teste segue como sanity).
- Cobertura: sem gate numérico; basta não regredir.

### Fluxos de dados a ter em mente (para não reinventar depois)

[Source: architecture.md#Data Flow — cálculo de scores]

A arquitetura prevê que, a partir da Story 2, o cliente fala com Supabase via `supabase.from(...)` (PostgREST), `supabase.rpc(...)` (Database Function `calculate_scores`) e `supabase.functions.invoke(...)` (Edge Functions `export-leads`, `delete-account`). O singleton que você cria aqui é a base de TODOS esses caminhos. Fazê-lo bem agora evita refactors em cadeia.

### Project Structure Notes

**Alinhado com [architecture.md#Complete Project Directory Structure]:**
- `src/lib/supabase.ts` ✅ (criado nesta story)
- `src/lib/database.types.ts` ✅ (stub nesta story; geração real em Story 1.11)
- `supabase/config.toml` ✅ (via `supabase init`)
- `supabase/migrations/`, `supabase/functions/`, `supabase/seeds/`, `supabase/tests/` ✅ (diretórios vazios com `.gitkeep`)
- `.env.example` ✅ (raiz)
- `.env.local` no `.gitignore` ✅

**Variações vs a árvore alvo (OK — serão preenchidas nas próximas stories):**
- Sem `src/contexts/AuthContext.tsx` ainda → Story 1.6
- Sem `src/components/layout/` → Story 1.8
- Sem `src/components/features/{auth,curriculum,scoring,admin}/` → populado ao longo dos Epics 1–4
- Sem `vite-ssg` / `vite.config.ts` modificado → Story 1.4
- Sem `.github/workflows/` → Story 1.11
- `src/App.css` removido (não no alvo) ✅

**Conflitos a resolver nesta story:**
- `src/pages/Index.tsx` (presente) vs `src/pages/Landing.tsx` (alvo) → Index removido; Landing criada na Story 1.4.
- `src/components/{CurriculumForm,ResultsDashboard,InstitutionCard,NavLink}.tsx` (presentes, Lovable) vs `src/components/features/{...}` (alvo) → removidos nesta story.

### References

- [epics.md#Story 1.1 (`_bmad-output/planning-artifacts/epics.md:334-357`)](../planning-artifacts/epics.md) — AC source of truth.
- [architecture.md#Selected Starter: Base Vite existente (`_bmad-output/planning-artifacts/architecture.md:83-138`)](../planning-artifacts/architecture.md) — stack, ferramentas e primeiro passo.
- [architecture.md#Data Architecture (`_bmad-output/planning-artifacts/architecture.md:165-178`)](../planning-artifacts/architecture.md) — por que Supabase é o backend.
- [architecture.md#Naming Patterns (`_bmad-output/planning-artifacts/architecture.md:253-289`)](../planning-artifacts/architecture.md) — convenções TS/DB/rotas.
- [architecture.md#Structure Patterns (`_bmad-output/planning-artifacts/architecture.md:291-327`)](../planning-artifacts/architecture.md) — layout de `src/lib/` e `supabase/`.
- [architecture.md#Complete Project Directory Structure (`_bmad-output/planning-artifacts/architecture.md:477-569`)](../planning-artifacts/architecture.md) — árvore alvo.
- [architecture.md#Architectural Boundaries (`_bmad-output/planning-artifacts/architecture.md:571-601`)](../planning-artifacts/architecture.md) — singleton como único entry point; `service_role` nunca no cliente.
- [prd.md](../planning-artifacts/prd.md) — contexto de negócio e brownfield.
- Código existente: `src/App.tsx`, `src/pages/Index.tsx`, `src/components/{CurriculumForm,ResultsDashboard,InstitutionCard,NavLink}.tsx`, `src/lib/calculations.ts`, `package.json` (declara `bun.lockb`).

### Latest tech notes (abr/2026)

- `@supabase/supabase-js` está na linha 2.x; API `createClient(url, anonKey, options?)` estável. Para SSR/SSG (Story 1.4), existe `@supabase/ssr` — **não** introduzir aqui; ficará para a Story 1.4 se vier a ser necessário no build SSG.
- Supabase CLI v1.x gera `config.toml` com portas default (54321 studio, 54322 db, 54323 auth). Manter defaults; sobrescritas ficam para Story 1.11 (CI/CD).

## Dev Agent Record

### Agent Model Used

claude-opus-4-6[1m] (Claude Opus 4.6 com janela de 1M tokens)

### Debug Log References

- `bun run lint` — 0 erros, 7 warnings (react-refresh em primitives shadcn pré-existentes).
- `bun run build` — ✓ `built in 1.16s` (304 KB gzip 97 KB).
- `bun run test` — 1 passed (`example.test.ts`).
- `supabase start` / `supabase status` — stack local subiu em 127.0.0.1:54321/54322/54323 ok; `supabase stop` liberou containers.
- `bun dev` — respondeu HTTP 200 em `http://localhost:8080/`.

### Completion Notes List

- **Task 1 (AC1)**: `@supabase/supabase-js@2.103.0` adicionado em `dependencies`. `src/lib/supabase.ts` exporta singleton nomeado; guard lança erro se env vars ausentes (runtime, não top-level, como sugerido em Dev Notes — não quebra `bun run build` em CI sem `.env`). Stub `Database = any` em `src/lib/database.types.ts` com comentário indicando geração real na Story 1.11.
- **Task 2 (AC2)**: Supabase CLI instalado via brew no ambiente do dev (não é dep do Node). `supabase init` gerou `supabase/config.toml` + `supabase/.gitignore` interno. `supabase start` validado (Postgres 54322, Studio 54323, REST 54321). Pastas `migrations/`, `functions/_shared/`, `seeds/`, `tests/` criadas com `.gitkeep`.
- **Task 3 (AC3)**: Removidos `src/pages/Index.tsx`, `src/components/{CurriculumForm,ResultsDashboard,InstitutionCard,NavLink}.tsx`, `src/App.css`. `src/App.tsx` simplificado com placeholder inline em pt-BR. `src/pages/NotFound.tsx` neutralizado para pt-BR. **`src/lib/calculations.ts` preservado** (AC3 crítico). shadcn primitives em `src/components/ui/` preservados. `.env.local` coberto por `*.local` no `.gitignore` + entrada explícita `.env`.
- **Task 4 (AC3)**: Lint limpo após correções mínimas em arquivos cobertos pela limpeza Lovable/shadcn: `textarea.tsx` e `command.tsx` (interface vazia → type alias), `tailwind.config.ts` (`require` → `import`), `calculations.ts` e `database.types.ts` (eslint-disable documentado para `any` — justificativa no comentário). `eslint.config.js` ignora `.claude/`, `_bmad/`, `_bmad-output/`, `supabase/`, `.agent/`. Build e test verdes, dev server OK.
- **Task 5**: README reescrito com seção "Setup local" (Bun + Supabase CLI + Docker + passos). Removido branding Lovable.
- **Bloqueadores resolvidos em sessão**: Bun ausente → instalado via bun.sh; Supabase CLI ausente → instalado via brew. Ambos documentados no README.

### File List

**Novos:**
- `src/lib/supabase.ts`
- `src/lib/database.types.ts`
- `.env.example`
- `supabase/config.toml`
- `supabase/.gitignore`
- `supabase/migrations/.gitkeep`
- `supabase/functions/_shared/.gitkeep`
- `supabase/seeds/.gitkeep`
- `supabase/tests/.gitkeep`

**Modificados:**
- `package.json` (dep `@supabase/supabase-js`)
- `bun.lockb`
- `.gitignore` (`.env`, `supabase/.branches/`, `supabase/.temp/`, `supabase/volumes/`)
- `src/App.tsx` (remoção de `Index`; placeholder inline)
- `src/pages/NotFound.tsx` (pt-BR neutro)
- `src/lib/calculations.ts` (eslint-disable documentado — arquivo preservado quanto à lógica)
- `src/components/ui/textarea.tsx` (interface vazia → type)
- `src/components/ui/command.tsx` (interface vazia → type)
- `tailwind.config.ts` (`require("tailwindcss-animate")` → `import tailwindcssAnimate`)
- `eslint.config.js` (ignores adicionados)
- `README.md` (setup local; remoção de branding Lovable)

**Deletados:**
- `src/App.css`
- `src/pages/Index.tsx`
- `src/components/CurriculumForm.tsx`
- `src/components/ResultsDashboard.tsx`
- `src/components/InstitutionCard.tsx`
- `src/components/NavLink.tsx`

### Review Findings

- [x] [Review][Patch] Design System Medway revertido — `tailwind.config.ts` e `src/index.css` restaurados ao HEAD (Inter/Space Mono/Lora). Tokens Medway ficam para Story 1.2 (ACs próprios, incluindo correção da sintaxe HSL alpha).
- [x] [Review][Patch] `package-lock.json` removido do repo e adicionado ao `.gitignore` — política bun-only mantida [package-lock.json, .gitignore]
- [x] [Review][Patch] `supabase/.env` adicionado ao `.gitignore` (preventivo) [.gitignore]
- [x] [Review][Defer] `calculations.ts`: `val(v: any) => Number(v) || 0` coerce silencioso; falta validação de range/escala; caps independentes em USP-RP/UFPA; semântica divergente de `ranking_ruf_top35` entre USP-SP/SCMSP [src/lib/calculations.ts] — deferred, pre-existing; Story 1.9 extrai para seeds
- [x] [Review][Defer] `App.tsx`: `QueryClient` sem `defaultOptions` (retries × env inválida pode gerar tempestade) e sem `ErrorBoundary` (throw do supabase → tela branca) [src/App.tsx] — deferred, pre-existing
- [x] [Review][Defer] `NotFound.tsx`: `console.error` com `pathname` (risco baixo de PII) e `<a href="/">` em vez de `<Link>` (full reload SPA) [src/pages/NotFound.tsx] — deferred, pre-existing

## Change Log

| Data       | Versão | Descrição                                                                                 | Autor    |
|------------|--------|-------------------------------------------------------------------------------------------|----------|
| 2026-04-14 | 0.1    | Implementação Story 1.1: cliente Supabase singleton, CLI local inicializado, limpeza Lovable (mantendo `calculations.ts`), lint/build/test verdes, README atualizado. | Amelia/Dev |
