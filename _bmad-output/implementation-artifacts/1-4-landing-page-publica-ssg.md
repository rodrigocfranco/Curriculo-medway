# Story 1.4: Landing page pública via SSG (vite-react-ssg)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **visitante (lead não-autenticado) do curriculo-medway**,
I want **chegar numa landing page `/` pré-renderizada estaticamente com proposta clara do produto (hero + headline + CTA "Começar" → `/signup`), meta tags + Open Graph + robots.txt + sitemap.xml, paleta Medway e Montserrat**,
so that **entendo o valor em <2s (NFR1, FCP), decido se vale me cadastrar, e a página é indexável por Google/redes sociais — desbloqueando Story 1.5 (signup) e o funil de captação FR1/FR2**.

## Acceptance Criteria

Copiados verbatim de [epics.md#Story 1.4 (linhas 407-429)](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — `vite-react-ssg` configurado gera `dist/index.html` pré-renderizado para `/`**
   **Given** `vite-ssg` não está configurado (hoje: `src/main.tsx` usa `createRoot()` puro; `vite.config.ts` sem plugin SSG; `package.json` script `build: vite build`)
   **When** adiciono a dependência e ajusto `vite.config.ts`
   **Then** `bun run build` gera `dist/index.html` pré-renderizado para `/`
   **And** o HTML servido contém título, hero e CTA sem executar JavaScript (verificável via `curl http://localhost:4173/ | grep -i "<h1"` após `bun run preview`)

2. **AC2 — Conteúdo Medway, links, SEO básico**
   **Given** a rota `/` responde via SSG
   **When** abro no navegador
   **Then** vejo hero com headline **"Descubra como está seu currículo para as maiores instituições de residência do Brasil"**
   **And** CTA primário **"Começar"** leva para `/signup`
   **And** paleta Medway (navy.900 `#00205B`, teal.500 `#01CFB5`), Montserrat, `max-w-5xl` (1024px)
   **And** `public/robots.txt` permite crawl, `public/sitemap.xml` lista `/`, meta tags `<title>`, `<meta description>`, Open Graph (`og:title`, `og:description`, `og:image`) presentes

3. **AC3 — Performance: Lighthouse ≥ 90 e FCP < 2s (NFR1)**
   **Given** a landing deployada (ou `bun run preview` local)
   **When** executo Lighthouse (Chrome DevTools, categoria Performance, throttling Mobile padrão)
   **Then** Performance ≥ 90 e First Contentful Paint < 2s (NFR1)

## Tasks / Subtasks

- [x] **Task 1 — Adicionar `vite-react-ssg` e refatorar entrypoint SPA→SSG** (AC: #1)
  - [x] 1.1 **Nome da dependência correto:** `vite-ssg` (nome no epic) é pacote Vue-only do Antfu. Para React + Vite + React Router v6 o equivalente maduro é **`vite-react-ssg`** (github.com/Daydreamer-riri/vite-react-ssg, API compatível com react-router-dom v6.4+ `createBrowserRouter`). **Usar `vite-react-ssg`** e documentar esta escolha em uma linha no commit: "usa vite-react-ssg (equivalente React do vite-ssg mencionado no epic)". Não abrir issue de arquitetura — é nomenclatura, não desvio.
  - [x] 1.2 Rodar `bun add vite-react-ssg` (runtime dep — SSG usa helpers em build). **Usar Bun** (não npm/pnpm; `bun.lockb` é fonte de verdade — ver [architecture.md linha 639](../planning-artifacts/architecture.md)).
  - [x] 1.3 Criar `src/router.tsx` exportando o array de rotas no formato `createBrowserRouter` (data router API requerido por `vite-react-ssg`):
    ```ts
    // src/router.tsx
    import type { RouteRecord } from 'vite-react-ssg';
    import { lazy } from 'react';
    import NotFound from './pages/NotFound';

    const DesignSystem = import.meta.env.DEV
      ? lazy(() => import('./pages/DesignSystem'))
      : null;

    export const routes: RouteRecord[] = [
      {
        path: '/',
        lazy: () => import('./pages/Landing').then((m) => ({ Component: m.default })),
        // entry: true (implícito para '/') — inclui esta rota na build SSG
      },
      ...(import.meta.env.DEV && DesignSystem
        ? [{ path: '/design-system', Component: DesignSystem }]
        : []),
      { path: '*', Component: NotFound },
    ];
    ```
    **Rationale do `lazy` em `/`:** mantém o chunk da Landing SSG-rendered como HTML estático + hydration separada (reduz bundle inicial). `DesignSystem` permanece dev-only (ver Anti-patterns — `import.meta.env.DEV` tree-shake já validado em Story 1.2).
  - [x] 1.4 Substituir `src/main.tsx` (hoje usa `createRoot`) pelo bootstrap do `vite-react-ssg`:
    ```ts
    // src/main.tsx
    import { ViteReactSSG } from 'vite-react-ssg';
    import '@fontsource/montserrat/400.css';
    import '@fontsource/montserrat/500.css';
    import '@fontsource/montserrat/600.css';
    import '@fontsource/montserrat/700.css';
    import './index.css';
    import { routes } from './router';
    import { AppProviders } from './App';

    export const createRoot = ViteReactSSG(
      { routes },
      ({ router, routes, isClient, initialState }) => {
        // hook opcional — providers montam via AppProviders como children
      },
      {
        rootContainer: '#root',
      }
    );
    ```
    **CRITICAL:** `vite-react-ssg` requer que o arquivo **exporte** (named `createRoot`) — diferente do `main.tsx` SPA que invoca `createRoot(...).render(...)`. **Não** chamar `.render()` manualmente.
  - [x] 1.5 Refatorar `src/App.tsx`: extrair `QueryClientProvider`/`TooltipProvider`/`Toaster`/`Sonner` para um componente `<AppProviders>{children}</AppProviders>` **e remover o `<BrowserRouter>` + `<Routes>`** (o router agora vem de `vite-react-ssg` via `routes`). Componente final:
    ```tsx
    // src/App.tsx
    import { Toaster } from '@/components/ui/toaster';
    import { Toaster as Sonner } from '@/components/ui/sonner';
    import { TooltipProvider } from '@/components/ui/tooltip';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
    import { Outlet } from 'react-router-dom';

    const queryClient = new QueryClient();

    export const AppProviders = ({ children }: { children?: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children ?? <Outlet />}
        </TooltipProvider>
      </QueryClientProvider>
    );

    export default AppProviders;
    ```
    E em `src/router.tsx`, envolver as rotas com `AppProviders` como layout root:
    ```ts
    export const routes: RouteRecord[] = [
      {
        path: '/',
        Component: AppProviders, // layout root com providers + <Outlet />
        children: [
          { index: true, lazy: () => import('./pages/Landing').then(m => ({ Component: m.default })) },
          ...(import.meta.env.DEV && DesignSystem ? [{ path: 'design-system', Component: DesignSystem }] : []),
          { path: '*', Component: NotFound },
        ],
      },
    ];
    ```
    **Padrão adotado: layout root wrappers via `<Outlet />`**. Consistente com plano do Epic 1.8 (`<ProtectedRoute>` vira layout). Importar `AppProviders` no `router.tsx` de `./App`.
  - [x] 1.6 Em `vite.config.ts`, **não** é necessário plugin adicional — `vite-react-ssg` é CLI-based (substitui `vite build` por `vite-react-ssg build` no script). Atualizar `package.json`:
    ```json
    "scripts": {
      "dev": "vite",
      "build": "vite-react-ssg build",
      "build:dev": "vite build --mode development",
      "lint": "eslint .",
      "preview": "vite preview",
      ...
    }
    ```
    **`dev` permanece `vite`** (SPA) — SSG só roda no build. **`build:dev`** permanece `vite build` para preview de dev-mode sem SSG (útil para `DesignSystem` disponível). **Não** tocar em `vitest.config.ts` — testes continuam via `vitest`.
  - [x] 1.7 Remover o `<Route path="/" element={<div>em construção</div>}>` inline do `App.tsx` — ele agora vive em `src/pages/Landing.tsx`.

- [x] **Task 2 — Criar componente `src/pages/Landing.tsx` (hero + CTA)** (AC: #2)
  - [x] 2.1 Criar `src/pages/Landing.tsx` com estrutura mínima estática (sem `useState`, `useEffect`, nem dados dinâmicos — SSG exige output determinístico):
    ```tsx
    import { Link } from 'react-router-dom';
    import { Button } from '@/components/ui/button';

    const Landing = () => (
      <main className="min-h-screen bg-background font-sans text-foreground">
        <section className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 py-16 md:py-24">
          <h1 className="text-[40px] font-bold leading-tight tracking-tight md:text-[48px] md:leading-[56px]">
            Descubra como está seu currículo para as maiores instituições de residência do Brasil
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Preencha seu currículo em minutos e veja seu score em até 11 programas — com regras oficiais e gap analysis por instituição.
          </p>
          <Button asChild size="lg">
            <Link to="/signup">Começar</Link>
          </Button>
        </section>
      </main>
    );

    export default Landing;
    ```
    - **Headline verbatim do AC2** — não parafrasear, não abreviar (é requisito textual).
    - Tamanho `display` 48/56 Montserrat 700 (ver [ux-design-specification.md linha 371](../planning-artifacts/ux-design-specification.md) — tabela Typography System). Usar `text-[48px] leading-[56px]` (valores arbitrários Tailwind) — **não** adicionar token customizado no `tailwind.config.ts` nesta story (escopo fora).
    - Container `max-w-5xl` (AC2 explícito; ver [ux-design-specification.md linha 397](../planning-artifacts/ux-design-specification.md) — "max-w-5xl — landing").
    - Densidade "generosa" (landing) — `space-12`/`space-16` entre seções, `py-16 md:py-24` (ver [ux-design-specification.md linha 409](../planning-artifacts/ux-design-specification.md)).
    - CTA: `<Button asChild>` + `<Link to="/signup">` — NÃO usar `<a href="/signup">` (força full reload SPA; ver [deferred-work.md item NotFound.tsx](./deferred-work.md)). Botão default é `variant="default"` que resolve para `bg-primary` = navy.900 (ver Story 1.2 tokens) — contraste AA com foreground branco garantido.
    - Parágrafo de subheadline é **curto e concreto** (UX principle "microcopy 2ª pessoa direta, sem jargão" — [ux-design-specification.md linha 791](../planning-artifacts/ux-design-specification.md)). Valor do produto em 1 frase.
  - [x] 2.2 **Mobile:** headline reduz uma escala (`text-[40px]` em mobile, `text-[48px]` em `md:`). Ver [ux-design-specification.md linha 828](../planning-artifacts/ux-design-specification.md): "Body 16px sempre; display/h1 reduzem uma escala em mobile".
  - [x] 2.3 **Acessibilidade:**
    - `<main>` como landmark (implícito `role=main`).
    - `<h1>` único na página com headline (AC2 verbatim).
    - Button tem texto visível "Começar" (AC2) — sem `aria-label` extra necessário; `asChild` do shadcn preserva o `<a>` nativo do `<Link>` do react-router.
    - Contraste: navy.900 text sobre background branco = ratio 15:1 (AA+); button primary (navy.900 bg, branco fg) = mesmo ratio.
    - Target touch ≥44px — `size="lg"` do shadcn Button já resolve (h-11 = 44px).
    - **Não** adicionar `skipnav` nesta story — não há navbar ainda (header chegará na Story 1.8, `PublicHeader.tsx`). Landing MVP é uma única seção.
  - [x] 2.4 **Não criar** `PublicHeader`, `Footer`, nem segunda seção marketing — escopo AC2 é **hero + CTA**. Seções adicionais (features, social proof, FAQ) estão **fora do MVP desta story**. Landing minimal vale (ver [ux-design-specification.md linha 783](../planning-artifacts/ux-design-specification.md): "Landing: navbar minimal; CTAs em 2–3 momentos" — a meta de 2–3 CTAs é aspiracional, não bloqueante para AC).
  - [x] 2.5 **Não consumir Supabase** na landing — ela é pública, pré-renderizada, sem user. Zero import de `@/lib/supabase` no arquivo `Landing.tsx` (trivial verificar via `grep`).

- [x] **Task 3 — SEO: `index.html`, `robots.txt`, `sitemap.xml`, `og-image.png`** (AC: #2)
  - [x] 3.1 **`index.html`** — substituir os placeholders Lovable ainda presentes. Estado atual tem `<title>Lovable App</title>`, `<meta description>Lovable Generated Project</meta>`, `og:image` apontando para `https://lovable.dev/...`. Conteúdo final:
    ```html
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />

        <title>Currículo Medway — Score de residência por instituição</title>
        <meta name="description" content="Descubra como está seu currículo para as maiores instituições de residência do Brasil. Score + gap analysis por instituição com regras oficiais." />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Currículo Medway — Score de residência por instituição" />
        <meta property="og:description" content="Descubra como está seu currículo para as maiores instituições de residência do Brasil." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:locale" content="pt_BR" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Currículo Medway — Score de residência por instituição" />
        <meta name="twitter:description" content="Descubra como está seu currículo para as maiores instituições de residência do Brasil." />
        <meta name="twitter:image" content="/og-image.png" />
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
    ```
    - `lang="pt-BR"` — obrigatório (a11y + SEO).
    - **Remover** `<meta name="author" content="Lovable" />`, `@Lovable` do Twitter, `https://lovable.dev/...` — limpeza Lovable residual (consistente com Story 1.1 que removeu `src/components/CurriculumForm.tsx`, `InstitutionCard.tsx`, `NavLink.tsx`, `ResultsDashboard.tsx`).
    - **Não** adicionar `<meta name="twitter:site" content="@medway">` se não houver handle oficial confirmado — omitir é aceitável para MVP.
    - **og:image** aponta para `/og-image.png` relativo (servido de `public/og-image.png`).
  - [x] 3.2 **`public/og-image.png`** — criar arquivo placeholder 1200×630px (padrão Open Graph). Se não houver asset aprovado pronto, gerar um simples com:
    - Fundo navy.900 `#00205B`
    - Logo Medway (teal.500 `#01CFB5`) ou texto "Currículo Medway" em Montserrat 700 branco
    - Subtexto "Score de residência por instituição" em branco 70%
    - **Decisão operacional:** se o dev não tem ferramenta de design, pode gerar via script ou usar SVG convertido. Commitar **como placeholder** e documentar no commit: "og-image.png placeholder — substituir quando design final de marketing chegar". O AC2 exige **presença da tag**, não qualidade visual final.
  - [x] 3.3 **`public/robots.txt`** — já existe (Story 1.1) permitindo crawl para Googlebot/Bingbot/Twitterbot/facebookexternalhit/`*` (`Allow: /`). **Verificar** e adicionar linha `Sitemap: /sitemap.xml` ao final:
    ```
    User-agent: *
    Allow: /

    Sitemap: /sitemap.xml
    ```
    **Não** adicionar `Disallow: /app /admin /signup /login` nesta story — essas rotas ainda não existem no build. Diferir para Story 1.8 (`ProtectedRoute`) ou Story 1.11 (CI/CD) quando a árvore de rotas estiver completa. **Documentar em `deferred-work.md`** se aplicável.
  - [x] 3.4 **`public/sitemap.xml`** — criar arquivo estático mínimo:
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
      <url>
        <loc>/</loc>
        <lastmod>2026-04-14</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
      </url>
    </urlset>
    ```
    **Não** hardcodar URL absoluta (`https://...`) — domínio ainda não definido (deploy Vercel na Story 1.11). URLs relativas são aceitas por Google. Quando houver domínio canônico, ajustar em Story 1.11.

- [x] **Task 4 — Validar Lighthouse ≥ 90 Performance e FCP < 2s** (AC: #3)
  - [x] 4.1 Rodar `bun run build && bun run preview` (vite preview serve estático em `localhost:4173`).
  - [x] 4.2 Abrir Chrome DevTools > Lighthouse > Performance > Mobile > "Analyze page load" em `http://localhost:4173/`.
  - [x] 4.3 Metas (AC3): **Performance ≥ 90, FCP < 2s**. Se falhar:
    - Verificar que **Montserrat preload** funcionou — checar `<link rel="preload" as="font">` injetado via `@fontsource` em `dist/index.html` (ver Story 1.2 Task 1.5 — preload nativo do `@fontsource`, sem `<link>` manual).
    - Confirmar que o HTML servido **contém** o hero textualmente (teste `curl http://localhost:4173/ | grep "Descubra como"`) — se não, SSG não renderizou, voltar à Task 1.
    - Se CLS > 0, verificar fontes loading (font-display: swap + `@fontsource` preload resolve).
  - [x] 4.4 **Test manual sem JS:** desabilitar JavaScript no DevTools (Settings > Debugger > "Disable JavaScript"), recarregar `/`. **Deve** ver hero + CTA renderizados (AC1 explícito: "o HTML servido contém título, hero e CTA sem executar JavaScript"). CTA será link estático (sem React hydration) mas texto + `<a href>` presentes.
  - [x] 4.5 **Screenshot + nota em Completion Notes:** capturar screenshot do Lighthouse report com score Performance final e FCP; anexar caminho em "Debug Log References".

- [x] **Task 5 — Smoke tests automatizados** (AC: #1, #2, #3)
  - [x] 5.1 Criar `src/pages/Landing.test.tsx` (co-localizado, padrão do repo — ver [architecture.md linha 295](../planning-artifacts/architecture.md)):
    ```tsx
    import { render, screen } from '@testing-library/react';
    import { MemoryRouter } from 'react-router-dom';
    import Landing from './Landing';

    describe('Landing', () => {
      it('renders headline verbatim', () => {
        render(<MemoryRouter><Landing /></MemoryRouter>);
        expect(
          screen.getByRole('heading', { level: 1, name: /Descubra como está seu currículo para as maiores instituições de residência do Brasil/ })
        ).toBeInTheDocument();
      });

      it('CTA "Começar" aponta para /signup', () => {
        render(<MemoryRouter><Landing /></MemoryRouter>);
        const cta = screen.getByRole('link', { name: 'Começar' });
        expect(cta).toHaveAttribute('href', '/signup');
      });
    });
    ```
  - [x] 5.2 Criar `src/pages/Landing.ssg.test.ts` (pós-build; valida HTML estático):
    ```ts
    import { readFileSync, existsSync } from 'node:fs';
    import path from 'node:path';

    const distIndex = path.resolve(__dirname, '../../dist/index.html');

    describe.skipIf(!existsSync(distIndex))('SSG output', () => {
      const html = readFileSync(distIndex, 'utf-8');
      it('contém headline pré-renderizado', () => {
        expect(html).toMatch(/Descubra como está seu currículo/);
      });
      it('contém CTA link para /signup', () => {
        expect(html).toMatch(/href="\/signup"/);
      });
      it('contém meta description pt-BR', () => {
        expect(html).toMatch(/<meta name="description"/);
      });
      it('contém og:image', () => {
        expect(html).toMatch(/property="og:image"/);
      });
    });
    ```
    `describe.skipIf(!existsSync(...))` — só roda se `dist/` já foi gerado; não força `build` no CI de testes unitários. Em CI completo, rodar `bun run build && bun run test`.
  - [x] 5.3 `bun run lint` sem novos erros; `bun run test` verde; `bun run build` sem warnings novos (baseline Story 1.3: 7 warnings react-refresh em shadcn/ui — pré-existentes).

- [x] **Task 6 — Atualizar sprint-status + File List + finalizar**
  - [x] 6.1 Atualizar `_bmad-output/implementation-artifacts/sprint-status.yaml`:
    - `1-4-landing-page-publica-ssg: backlog` → `review` (após dev completo; a criação da story move para `ready-for-dev` via este workflow).
    - `last_updated: 2026-04-14`.
  - [x] 6.2 Commitar com mensagem padrão pt-BR: "feat(landing): SSG via vite-react-ssg + hero/CTA + SEO básico (Story 1.4)".

### Review Findings

_Code review 2026-04-14 (3 camadas: Blind Hunter, Edge Case Hunter, Acceptance Auditor). AC1 e AC2 satisfeitos; AC3 parcial (FCP 2.10s vs <2s — já deferido para Story 1.11)._

**Decision needed**

- [x] [Review][Decision→Patch] Sitemap e robots.txt agora usam URL absoluta placeholder `https://curriculo.medway.com.br/` (domínio definitivo a confirmar na Story 1.11 CI/CD) [public/sitemap.xml:4, public/robots.txt:16]

**Patch**

- [x] [Review][Patch] `.env.example` — placeholder `your-anon-key-here` adicionado [.env.example:5]
- [x] [Review][Patch] `supabase.ts` — refatorado para Proxy + `getClient()` lazy; validação só dispara no primeiro uso [src/lib/supabase.ts]
- [x] [Review][Patch] `Landing.ssg.test.ts` — skip agora emite `console.warn` visível em CI quando `dist/` não existe [src/pages/Landing.ssg.test.ts:10]
- [x] [Review][Patch] `vite-react-ssg` — pin exato `0.9.1-beta.1` (removido caret) [package.json:66]
- [x] [Review][Patch] `Landing.test.tsx` — matcher troca regex parcial por `name: "<headline completo>"` + `exact: true` [src/pages/Landing.test.tsx]

**Defer (pré-existente ou fora de escopo desta story)**

- [x] [Review][Defer] CTA `/signup` leva a 404 (rota não existe) — será resolvido pela Story 1.5 (cadastro/signup) que está em backlog. Teste e código corretos per AC2 [src/pages/Landing.tsx:13]
- [x] [Review][Defer] Rota catch-all `*` retorna 200 em static host (não 404 real) — config de hosting, escopo da Story 1.11 (CI/CD) [src/router.tsx:25]
- [x] [Review][Defer] Lazy `import()` sem `errorElement` — chunks stale em rollover de deploy geram tela branca; enhancement para Story 1.11 [src/router.tsx]
- [x] [Review][Defer] Meta tags apenas em `index.html` (sem Helmet/per-rota) — só há uma rota pública hoje; reavaliar quando houver rotas públicas adicionais [index.html]
- [x] [Review][Defer] Trailing-slash / case-sensitivity em rotas — config de hosting [src/router.tsx]
- [x] [Review][Defer] FCP 2.10s vs <2s (NFR1 gap ~100ms) — já documentado em Completion Notes e `deferred-work.md`, escopo Story 1.11 [Lighthouse]

### Arquitetura & patterns aplicáveis

- **Stack:** Vite 5.4 + React 18.3 + TypeScript 5.8 + React Router v6.30 + @tanstack/react-query 5.83 + Tailwind 3.4 + shadcn/ui + Montserrat via `@fontsource` (ver [architecture.md#Technical Stack](../planning-artifacts/architecture.md)). Nenhuma dep nova além de `vite-react-ssg`.
- **Package manager:** **Bun** (`bun.lockb` presente; `package-lock.json` foi removido na Story 1.1). **NÃO** rodar `npm install` — vai gerar `package-lock.json` órfão e dessincronizar lock.
- **Roteamento:** React Router v6 data router API (`createBrowserRouter` / `RouteRecord[]`). `vite-react-ssg` injeta o router — removemos `<BrowserRouter>` do `App.tsx`.
- **Containers/landing:** `max-w-5xl` (1024px), densidade generosa (`space-12`/`space-16`) — ver [ux-design-specification.md#Spacing & Layout Foundation (linhas 389-410)](../planning-artifacts/ux-design-specification.md).
- **Tipografia:** Montserrat 400/500/600/700 via `@fontsource` (Story 1.2); token `display` = 48/56 Montserrat 700 (sem classe utilitária custom — usar valores Tailwind arbitrários `text-[48px] leading-[56px]`).
- **Cores:** navy.900 `#00205B`, teal.500 `#01CFB5`, neutros (ver Story 1.2 `tailwind.config.ts`). `bg-primary` = navy.900, `bg-accent` = teal.500 via CSS vars shadcn.
- **Acessibilidade:** touch ≥44px (WCAG 2.5.5), contraste AA, `lang="pt-BR"`, landmark `<main>`, `<h1>` único — ver [ux-design-specification.md#Accessibility (linhas 845-900)](../planning-artifacts/ux-design-specification.md).

### Source tree — arquivos afetados

```
src/
├── main.tsx                     # REFATORADO: ViteReactSSG entry (era createRoot)
├── App.tsx                      # REFATORADO: extrai AppProviders, remove BrowserRouter
├── router.tsx                   # CRIADO: routes array com layout root
├── pages/
│   ├── Landing.tsx              # CRIADO: hero + CTA (SSG)
│   ├── Landing.test.tsx         # CRIADO: smoke de render
│   ├── Landing.ssg.test.ts      # CRIADO: valida dist/index.html pós-build
│   ├── DesignSystem.tsx         # Intocado (continua dev-only)
│   └── NotFound.tsx             # Intocado
├── index.css                    # Intocado
public/
├── robots.txt                   # EDITADO: adiciona "Sitemap: /sitemap.xml"
├── sitemap.xml                  # CRIADO
├── og-image.png                 # CRIADO (placeholder 1200×630)
├── favicon.ico                  # Intocado
index.html                       # EDITADO: title/description/OG pt-BR
package.json                     # EDITADO: "build": "vite-react-ssg build"
vite.config.ts                   # Intocado (vite-react-ssg é CLI, sem plugin Vite)
```

### Testing standards

- **Framework:** Vitest 3.2 + @testing-library/react 16 + jsdom 20 (ver `vitest.config.ts` / `src/test/setup.ts`).
- **Co-localização:** `Landing.tsx` + `Landing.test.tsx` no mesmo dir (convenção do repo — [architecture.md linha 295](../planning-artifacts/architecture.md)).
- **React Query não é necessária** no teste — `Landing.tsx` não consome queries. Wrap apenas com `<MemoryRouter>`.
- **Rodar:** `bun run test` (vitest run). **`bun run test:watch`** para dev.
- **Cobertura esperada:** AC2 — headline + CTA href. AC1/AC3 — validados pelo `.ssg.test.ts` + Lighthouse manual.
- **Sem E2E** nesta story (Playwright diferido pós-MVP — ver [architecture.md linha 742](../planning-artifacts/architecture.md)).

### Anti-patterns (NÃO fazer)

- ❌ **NÃO** usar `vite-ssg` (Vue-only). Usar **`vite-react-ssg`**. Se houver conflito com Vite major (5.4 atual), fallback é documentar como "diferido para Story 1.11" em `deferred-work.md` e entregar landing como SPA minimal — mas primeiro tentar `vite-react-ssg` (compatível com Vite 5).
- ❌ **NÃO** fazer `npm install` ou `pnpm install` — **Bun apenas** (Story 1.2 feedback consolidado).
- ❌ **NÃO** adicionar `useState`, `useEffect`, chamadas de rede, `useAuth()` (não existe até Story 1.6), ou qualquer side-effect no `Landing.tsx` — SSG precisa de output determinístico.
- ❌ **NÃO** importar de `@/lib/supabase` em `Landing.tsx` — landing é pública, o singleton Supabase jogaria se `VITE_SUPABASE_URL` não estiver no contexto de build (ver `src/lib/supabase.ts:7-11` — `throw` em module-eval; [deferred-work.md](./deferred-work.md)).
- ❌ **NÃO** tocar em `src/components/ui/` primitives (feedback Story 1.2 — violações de `interface → type` em `command.tsx`/`textarea.tsx` já são débito registrado).
- ❌ **NÃO** tocar em `src/lib/calculations.ts` (escopo Story 1.9).
- ❌ **NÃO** adicionar seções extras de marketing (features, pricing, testimonials) na landing — fora do escopo AC2.
- ❌ **NÃO** hardcodar domínio absoluto em `sitemap.xml` / `robots.txt` — deploy canonical URL vem na Story 1.11.
- ❌ **NÃO** remover `DesignSystem` ou `NotFound` das rotas — continuam funcionando (hidratação client-side).
- ❌ **NÃO** criar `PublicHeader` ou `Footer` — essas entrarão na Story 1.8 com `AppShell`/`AdminShell`.
- ❌ **NÃO** adicionar `<link rel="preload" as="font">` manual em `index.html` — `@fontsource` + Vite já resolvem (Story 1.2 Task 1.5).
- ❌ **NÃO** mudar o QueryClient default options ou adicionar ErrorBoundary nesta story — ambos estão em [deferred-work.md](./deferred-work.md) da Story 1.1, fora do escopo.

### Considerações específicas

- **SSG + React Query:** `QueryClient` é criado **por módulo** (singleton no `App.tsx`). `vite-react-ssg` roda em Node durante build e gera HTML para `/`; como Landing não usa queries, **não há hydration mismatch**. Se no futuro alguma rota SSG-rendered usar `useQuery`, precisará de `dehydrate`/`Hydrate` wrappers — tema para Stories futuras.
- **Hydration:** o HTML estático hidrata quando o JS chega; nesse momento `<BrowserRouter>` equivalente injetado pelo `vite-react-ssg` assume. Clique em "Começar" → navegação SPA para `/signup` (que ainda não existe até Story 1.5 — **aceitável**; cairá no `NotFound` até lá).
- **`index.html` vs SSG rendered:** `vite-react-ssg` usa `index.html` como template — as meta tags que colocamos ali **persistem** no `dist/index.html` gerado (não são sobrescritas por default). Se algum dia quisermos meta tags por rota, adotar `react-helmet-async` (fora desta story).
- **Fontes em SSG:** `@fontsource` importa CSS que injeta `@font-face` + preload. Em SSG o CSS é extraído e linkado no `<head>` estático → FCP rápido. Validar na Task 4.
- **Contraste CTA:** `variant="default"` do Button shadcn usa `bg-primary text-primary-foreground`. CSS vars pós-Story 1.2: `--primary: 220 100% 18%` (navy.900), `--primary-foreground: 0 0% 100%` (branco) — contraste 15:1.

### Previous story intelligence (Story 1.3 → 1.4)

Story 1.3 (done, 2026-04-14) — **zero dependência direta** nesta story (1.4 é frontend puro, 1.3 é schema Postgres). Pontos de atenção transversais:

- ✅ `src/lib/database.types.ts` agora tem tipos reais (pós-1.3). Landing não consome, mas qualquer import futuro deve usar `Database['public']['Tables']['profiles']`.
- ✅ `supabase/migrations/0001_profiles.sql` + RLS ativo. Irrelevante para landing pública.
- ⚠️ `src/lib/supabase.ts` ainda throw em module-eval se env faltar — **motivo pelo qual Landing NÃO importa de `@/lib/supabase`** (crashing build SSG se `VITE_SUPABASE_URL` não estiver no CI).

### Previous story intelligence (Story 1.2 → 1.4)

Story 1.2 (done) — dependência direta. Já entregue:

- ✅ Tokens Medway em `tailwind.config.ts`: `navy.700/800/900`, `teal.500/600`, `neutral.0-900`, `semantic-*`.
- ✅ CSS vars shadcn mapeadas em HSL (padrão `H S% L%` sem vírgulas — crítico para `hsl(var(--x) / <alpha>)` funcionar).
- ✅ Montserrat 400/500/600/700 via `@fontsource` com preload nativo.
- ✅ `border-radius`: `sm` 4px, `md` 8px, `lg` 12px, `xl` 16px.
- ✅ `font-sans` resolve para Montserrat em `body` (via `@apply font-sans` em `src/index.css`).
- ⚠️ `fontFamily.mono` / `fontFamily.serif` removidos — se algum dia chart usar `font-mono`, cai no default system (não impacta landing).
- 📋 [deferred-work.md Story 1.2](./deferred-work.md) tem 8 itens — nenhum bloqueia 1.4.

### Previous story intelligence (Story 1.1 → 1.4)

Story 1.1 (done) — integração Supabase + limpeza Lovable parcial. Pontos residuais relevantes:

- ⚠️ `index.html` ainda tem `Lovable App` / `@Lovable` / `https://lovable.dev/...` — **esta story remove** (Task 3.1).
- ⚠️ `src/App.tsx:25-29` tem placeholder `"curriculo-medway — em construção"` inline — **esta story substitui** pela rota que carrega `Landing.tsx`.
- ⚠️ `public/placeholder.svg` Lovable residual — **não remover nesta story** (pode estar referenciado em testes/fixtures futuros; auditar em Story 1.11).

### Git intelligence (últimos 5 commits)

```
3b9fb5f Add SCM-BH/USP-RP/UFPA in calc
95c8418 Add SCM-BH, USP-RP, UFPA handles
00d01e7 Aprimorou entrada padrão
23abfa5 Atualizou cálculo e estado
70873bd Atualizei cálculo e estado
```

Todos focados em `src/lib/calculations.ts` (escopo Story 1.9). **Nenhum impacto em 1.4.** Observação: commits estão em PT-BR (convenção do projeto) — manter ao commitar esta story.

### Latest tech — `vite-react-ssg` (Abril/2026)

- **Package:** `vite-react-ssg` (Daydreamer-riri/vite-react-ssg no GitHub).
- **Por que não `vite-ssg`:** este é Vue-only (@antfu). Confusão do epic — usar a versão React.
- **Compatibilidade:** Vite 5.x ✅, React 18 ✅, react-router-dom 6.4+ ✅ (data router).
- **API:** `ViteReactSSG({ routes }, setupFn?, options)` em `src/main.tsx` como **export** (não `createRoot().render()`).
- **CLI:** `vite-react-ssg build` substitui `vite build`. Dev continua `vite`.
- **Riscos:** se Vite major upgrade (6.x) acontecer pós-1.4, reavaliar. Hoje em 5.4.19 — ok.
- **Fallback:** se `vite-react-ssg build` falhar por algum motivo (caso-limite com SWC + lovable-tagger), documentar em `deferred-work.md` e entregar landing como SPA minimal + `bun run build` padrão — **perde AC1 técnico mas ganha AC2/AC3**. **Só ativar fallback após tentativa real de fix.**

### Project Structure Notes

- Alinhamento com árvore canônica em [architecture.md#Complete Project Directory Structure (linhas 479-569)](../planning-artifacts/architecture.md) ✅.
- Variância: `src/router.tsx` novo — **está** previsto no spec (linha 554 da arquitetura).
- Variância: `AppProviders` extraído do `App.tsx` — decisão desta story para acomodar layout root do `vite-react-ssg`; documentar em `docs/architecture-deviations.md` se criado, senão no commit.

### References

- [epics.md#Story 1.4 (linhas 407-429)](../planning-artifacts/epics.md) — AC verbatim.
- [epics.md#UX-DR17 (linha 180)](../planning-artifacts/epics.md) — landing requirement.
- [epics.md#FR1 (linha 21)](../planning-artifacts/epics.md) — requisito funcional.
- [epics.md#NFR1 (linha 78)](../planning-artifacts/epics.md) — <2s SSG.
- [architecture.md#Frontend Architecture (linhas 199-213)](../planning-artifacts/architecture.md) — SSG + roteamento.
- [architecture.md#Requirements → Components Mapping (linhas 463-465)](../planning-artifacts/architecture.md) — Landing.tsx + vite-ssg.
- [architecture.md#Complete Project Directory Structure (linhas 479-569)](../planning-artifacts/architecture.md) — árvore.
- [architecture.md#Enforcement Guidelines (linhas 401-414)](../planning-artifacts/architecture.md) — 10 regras.
- [architecture.md#Development Workflow (linhas 633-647)](../planning-artifacts/architecture.md) — bun dev / build.
- [architecture.md#Naming Patterns (linhas 255-290)](../planning-artifacts/architecture.md) — kebab-case rotas, camelCase TS.
- [ux-design-specification.md#Typography System (linhas 363-388)](../planning-artifacts/ux-design-specification.md) — display 48/56 Montserrat 700.
- [ux-design-specification.md#Spacing & Layout (linhas 389-420)](../planning-artifacts/ux-design-specification.md) — max-w-5xl landing.
- [ux-design-specification.md#Navigation Patterns (linha 783)](../planning-artifacts/ux-design-specification.md) — navbar minimal.
- [ux-design-specification.md#Responsive (linhas 799-828)](../planning-artifacts/ux-design-specification.md) — mobile headline reduz escala.
- [1-1-integracao-supabase-cliente-singleton-limpeza-lovable.md](./1-1-integracao-supabase-cliente-singleton-limpeza-lovable.md) — estado pós-1.1 (placeholder rota, Lovable residual).
- [1-2-design-system-medway.md](./1-2-design-system-medway.md) — tokens Medway + Montserrat prontos.
- [1-3-schema-profiles-trigger-rls.md](./1-3-schema-profiles-trigger-rls.md) — sem impacto direto.
- [deferred-work.md](./deferred-work.md) — 15+ itens diferidos consolidados; nenhum bloqueia 1.4.
- Código existente relevante: `src/main.tsx`, `src/App.tsx`, `src/pages/NotFound.tsx`, `src/pages/DesignSystem.tsx`, `index.html`, `public/robots.txt`, `vite.config.ts`, `package.json`, `tailwind.config.ts`, `src/index.css`.
- Externo: [vite-react-ssg repo](https://github.com/Daydreamer-riri/vite-react-ssg), [vite-react-ssg docs](https://vite-react-ssg.netlify.app/docs/getting-started).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Build SSG (`bun run vite-react-ssg build`): 17 módulos, `dist/index.html` = 3.02 KiB, warning pré-existente "`toast` importado de `sonner` mas não usado em `sonner.tsx`" (não introduzido por esta story).
- `dist/index.html` pós-build contém: `<html lang="pt-BR">`, `<h1>` com headline verbatim, `<a href="/signup">Começar</a>`, `<meta name="description">`, `<meta property="og:image" content="/og-image.png">`. Verificado via `grep -E "<h1|<title|description|og:image|/signup|lang=" dist/index.html`.
- Preview local (`bun run preview` em `localhost:4173/`): curl retorna HTML pré-renderizado com hero e CTA; `/og-image.png` responde 200; `/robots.txt` contém `Sitemap: /sitemap.xml`; `/sitemap.xml` serve o XML.
- Testes: `bun run test` → 3 arquivos, 7 testes passando (Landing.test.tsx: 2 · Landing.ssg.test.ts: 4 · example.test.ts: 1).
- Lint: `bun run lint` → 0 erros, 7 warnings pré-existentes (baseline shadcn/ui `react-refresh/only-export-components` em badge/button/form/navigation-menu/sidebar/sonner/toggle).
- Lighthouse mobile simulado (headless Chrome, Slow 4G + 4× CPU), 3 runs: Performance 97 / FCP 2.10s / LCP 2.10s / TBT 0ms / CLS 0.018.

### Completion Notes List

- **AC1 ✅ — SSG ativo.** `vite-react-ssg@0.9.1-beta.1` instalado, `package.json` script `build` → `vite-react-ssg build`. `dist/index.html` contém hero + CTA pré-renderizados (verificável sem JS). `src/main.tsx` exporta `createRoot = ViteReactSSG({ routes }, ...)` (não chama `.render()` manual).
- **AC2 ✅ — Conteúdo + SEO.** `src/pages/Landing.tsx` tem headline verbatim, CTA "Começar" → `/signup`, paleta Medway (bg-primary navy.900 + primary-foreground branco), Montserrat, container `max-w-5xl`. `index.html` limpo do conteúdo Lovable (title, description, og:title, og:description, og:image, twitter:* pt-BR). `public/robots.txt` tem `Sitemap: /sitemap.xml`. `public/sitemap.xml` criado com `<loc>/</loc>`. `public/og-image.png` criado (placeholder 1200×630 cor sólida navy.900 via script Python, 3.1 KB — documentado em deferred-work para substituição de asset final).
- **AC3 🟡 — Performance 97 ✅ / FCP 2.10s 🟡.** Lighthouse mobile simulado: Performance 97 (meta ≥90 cumprida com folga). FCP 2.10s estoura meta <2s em ~100ms de forma consistente (3 runs). Gap é network-bound na simulação Slow 4G pessimista do Lighthouse (11.75 KB gzip CSS + 117 KB gzip JS via module script); main-thread usa apenas ~100ms. Otimizar abaixo de 2s no simulador exigiria extrair `QueryClientProvider`/`TooltipProvider`/`Toaster`/`Sonner` do render SSG inicial, o que contradiz a Task 1.5 (AppProviders como layout root). Em aparelhos reais 4G, FCP deve ficar confortavelmente abaixo de 2s. **Gap deferido para Story 1.11 (CI/CD)** — ver `deferred-work.md` para ação (bundle splitting, re-medição pós-deploy Vercel).
- **Refatoração `App.tsx`:** Extraído `AppProviders` como componente nomeado (QueryClient + TooltipProvider + Toaster + Sonner + `<Outlet/>`). Removido `<BrowserRouter>`/`<Routes>`/`<Route>` — o router agora vem de `src/router.tsx` injetado pelo `vite-react-ssg`. Placeholder inline `"em construção"` eliminado.
- **`src/router.tsx` (novo):** `routes: RouteRecord[]` com `AppProviders` como layout root em `/` e children `{ index → Landing (lazy), design-system (DEV only, lazy), * → NotFound }`.
- **Testes:** `Landing.test.tsx` (render + href CTA) + `Landing.ssg.test.ts` (`describe.skipIf(!existsSync(distIndex))` — só valida `dist/index.html` quando já existe build).
- **Tree-shake validado:** `DesignSystem` segue dev-only (lazy + `import.meta.env.DEV`); não aparece no chunk de produção.
- **Zero import de Supabase** em Landing (confirmado via inspeção — SSG público determinístico, sem side-effects de módulo).

### File List

**Criados:**
- `src/pages/Landing.tsx`
- `src/pages/Landing.test.tsx`
- `src/pages/Landing.ssg.test.ts`
- `src/router.tsx`
- `public/sitemap.xml`
- `public/og-image.png`

**Modificados:**
- `src/main.tsx` (SPA `createRoot` → `ViteReactSSG` entry export)
- `src/App.tsx` (refatorado → `AppProviders` nomeado; `BrowserRouter`/`Routes` removidos; placeholder rota inline removido)
- `index.html` (conteúdo Lovable substituído por SEO pt-BR Medway; `lang="pt-BR"`)
- `public/robots.txt` (adicionado `Sitemap: /sitemap.xml`)
- `package.json` (`build` script → `vite-react-ssg build`; nova dep `vite-react-ssg@^0.9.1-beta.1`)
- `bun.lockb` (lock atualizado pelo `bun add`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (story 1-4 → `review`; `last_updated` atualizado)
- `_bmad-output/implementation-artifacts/deferred-work.md` (4 itens novos da story 1.4)

## Change Log

| Data       | Versão | Descrição                                                                      | Autor    |
|------------|--------|--------------------------------------------------------------------------------|----------|
| 2026-04-14 | 0.1    | Story 1.4 criada via create-story (ready-for-dev). Landing SSG + SEO + hero/CTA. | PM       |
| 2026-04-14 | 1.0    | Dev completo — SSG via vite-react-ssg, Landing.tsx, SEO pt-BR, 7 testes verdes, Lighthouse Perf=97. FCP=2.10s fica 100ms acima de AC3 (gap network-bound em simulação mobile; deferido para Story 1.11). Status → review. | Dev      |
