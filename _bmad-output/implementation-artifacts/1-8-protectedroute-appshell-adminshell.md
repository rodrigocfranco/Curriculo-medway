# Story 1.8: ProtectedRoute por role + AppShell e AdminShell

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **desenvolvedor do Medway (e, por efeito, qualquer aluno ou admin que navegue pelo produto)**,
I want **um componente `<ProtectedRoute role>` que proteja grupos de rota por autenticação + role e dois shells (`AppShell` para aluno, `AdminShell` para admin) que forneçam header + container padronizados sobre os quais `/app` e `/admin` serão renderizados via `<Outlet />`**,
so that **qualquer feature futura de Epics 2–5 (dashboard, detalhe de instituição, currículo, painel admin, configurações de conta) proteja rotas sem duplicar lógica de auth/role e herde automaticamente header, redirects e densidade corretos — fechando a fundação do Epic 1 antes de 1.9/1.10/1.11**.

## Acceptance Criteria

Copiados verbatim de [epics.md Story 1.8 (linhas 503-531)](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Anônimo bloqueado em rota `role="student"` → `/login?redirect={path}`**
   **Given** `<ProtectedRoute role="student">` envolve uma rota
   **When** user anônimo tenta acessar
   **Then** é redirecionado para `/login?redirect={path}`

2. **AC2 — Role mismatch (student em rota admin) → `/app` + toast**
   **Given** `<ProtectedRoute role="admin">` envolve uma rota
   **When** user com role student tenta acessar
   **Then** é redirecionado para `/app` com toast "Acesso restrito"

3. **AC3 — Aluno autenticado em `/app` → `AppShell` (header sticky 64/56px + container)**
   **Given** aluno autenticado acessa `/app`
   **When** a página carrega
   **Then** `AppShell` renderiza header sticky (64/56px) com logo + espaço para SpecialtySelector + Avatar
   **And** container `max-w-7xl` centralizado

4. **AC4 — Admin autenticado em `/admin` → `AdminShell` (header + badge + tabs + densidade compacta)**
   **Given** admin autenticado acessa `/admin`
   **When** a página carrega
   **Then** `AdminShell` renderiza header com logo + badge "Admin" + tabs + Avatar
   **And** densidade compacta (`p-3`/`p-4`)

5. **AC5 — `/admin` em viewport <768px → aviso não-bloqueante**
   **Given** `/admin` acessado em viewport <768px
   **When** detecto mobile
   **Then** vejo aviso não-bloqueante "Painel admin otimizado para desktop"

## Tasks / Subtasks

- [ ] **Task 1 — `ProtectedRoute` component + testes** (AC: #1, #2)
  - [ ] 1.1 Criar `src/components/layout/ProtectedRoute.tsx`:
    - Props: `{ role: "student" | "admin"; children?: ReactNode }`. Usa `<Outlet />` como fallback quando `children` ausente (padrão react-router v6 para route element).
    - Consome `useAuth()` de [src/contexts/useAuth.ts](../../src/contexts/useAuth.ts) (já criado em 1.6, expõe `{ user, profile, loading, recoveryMode }`).
    - Consome `useLocation()` + `useNavigate()` de `react-router-dom`.
    - **Algoritmo de guard (ordem importa):**
      1. `loading === true` → renderiza `<Skeleton />` (ver Task 1.3). **Nunca** decidir redirect enquanto auth carrega (evita flash de `/login` para user autenticado).
      2. `recoveryMode === true` → `<Navigate to="/reset-password" replace />` (preserva comportamento da 1.7 — sessão de recovery não deve acessar `/app` ou `/admin`).
      3. `user === null` → `<Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />` (AC1 verbatim — inclui querystring para preservar deep-link).
      4. `profile === null` (user existe mas profile ainda não chegou — edge: trigger `handle_new_user` atrasou, RLS negou) → `<Skeleton />`. **Não** redirecionar.
      5. `profile.role !== role` → `<Navigate to="/app" replace />` **e** dispara `toast.error("Acesso restrito")` (AC2 verbatim) via Sonner `toast` ([src/components/ui/sonner.tsx](../../src/components/ui/sonner.tsx) + `toast` de `sonner`). **Disparar toast em `useEffect`** para evitar duplo-toast em StrictMode; efeito condicionado a `role mismatch && !redirected`. Alternativa aceita: toast antes do `<Navigate>` via chamada única imediata, se o efeito complicar. Usar o padrão que mantiver 1 toast por mismatch.
      6. Senão → `<Outlet />` (ou `children` se passado explicitamente).
    - **Nunca logar** `user.id`, `user.email`, `profile.name` (Enforcement regra 8 — [architecture.md:412](../planning-artifacts/architecture.md#L412)).
  - [ ] 1.2 **Decisão explícita — `?redirect=` handling no `/login`:** `LoginForm` **não** lê/consome `?redirect=` nesta story. Esta story apenas **grava** o querystring; story futura (1.11 ou ajuste no LoginForm) pode opcionalmente ler `searchParams.get("redirect")` e substituir o default `navigate("/app")`. Anotar em `deferred-work.md` (Task 9.3). Motivo: evitar escopo/risk creep sobre `LoginForm` de 1.6 em review.
  - [ ] 1.3 **Loading state:** usar `Skeleton` de [src/components/ui/skeleton.tsx](../../src/components/ui/skeleton.tsx). Renderizar um bloco genérico full-viewport: `<div className="flex min-h-screen items-center justify-center"><Skeleton className="h-12 w-64" /></div>`. UX guideline: "sempre skeleton, nunca spinner centralizado em tela cheia" ([ux-design-specification.md:761](../planning-artifacts/ux-design-specification.md#L761)). **Remover** `<div className="p-8">Carregando…</div>` dos stubs em Task 6.
  - [ ] 1.4 **Testes** co-localizados em `src/components/layout/ProtectedRoute.test.tsx`:
    - Anônimo (`user=null, loading=false`) + rota `role="student"` → `<Navigate>` para `/login?redirect=/app`. Usar `MemoryRouter initialEntries={["/app?x=1"]}` e assertar que `window.location` (ou mock de `useNavigate`) recebeu `/login?redirect=%2Fapp%3Fx%3D1`.
    - Anônimo + rota `role="admin"` com path `/admin/instituicoes` → redirect `/login?redirect=%2Fadmin%2Finstituicoes`.
    - `loading=true` → renderiza skeleton, **não** chama `<Navigate>`.
    - `recoveryMode=true` + user existe → redirect `/reset-password`.
    - `user` + `profile.role="student"` + `<ProtectedRoute role="admin">` → redirect `/app` **E** `toast.error` chamado com `"Acesso restrito"` exato. Mock `sonner` (`vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))`) — mesmo padrão de [ResetPasswordForm.test.tsx](../../src/components/features/auth/ResetPasswordForm.test.tsx).
    - `user` + `profile.role="admin"` + `<ProtectedRoute role="admin">` → renderiza `<Outlet />` (testar com rota filha que imprime texto).
    - `user` + `profile.role="student"` + `<ProtectedRoute role="student">` → renderiza `<Outlet />`.
    - `user` existe + `profile=null` (pendente) + `loading=false` → skeleton (não redirect).
    - StrictMode (2 renders) + role mismatch → toast chamado **exatamente 1x** (evitar regressão double-toast).
  - [ ] Files: `src/components/layout/ProtectedRoute.tsx`, `src/components/layout/ProtectedRoute.test.tsx`.

- [ ] **Task 2 — `AppShell` component (layout aluno)** (AC: #3)
  - [ ] 2.1 Criar `src/components/layout/AppShell.tsx`:
    - Estrutura: `<div className="min-h-screen bg-background font-sans text-foreground"><header>…</header><main><Outlet /></main></div>`.
    - **Header sticky:** `className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur"`. Altura: `h-14 md:h-16` (56px mobile / 64px desktop — AC3 verbatim).
    - **Conteúdo do header:** `<div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">`.
      - **Esquerda:** `<Link to="/app" className="text-lg font-semibold tracking-tight">Medway</Link>` (logo textual; assets SVG ficam para 1.11/polish).
      - **Centro:** `<div data-testid="specialty-selector-slot" className="flex-1 px-4" />` — slot vazio reservado. **Não renderizar `SpecialtySelector` agora** (Story 2.8 adiciona). Estrutura preparada (flex-1 permite ocupar espaço disponível). AC3 verbatim: "espaço para SpecialtySelector".
      - **Direita:** `<UserMenu />` (Task 4) — Avatar + dropdown.
    - **Main:** `<main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">` — container AC3 verbatim `max-w-7xl centralizado`. Padding vertical respirável (aluno = `p-6`/`py-8` conforme [architecture densidades](../planning-artifacts/ux-design-specification.md#L405-L407)).
    - `<Outlet />` no body do main para renderizar rotas filhas (`/app`, futuras `/app/curriculo`, `/app/instituicoes/:id`).
  - [ ] 2.2 **Testes** em `src/components/layout/AppShell.test.tsx`:
    - Renderiza logo "Medway" com `href="/app"`.
    - Renderiza slot `data-testid="specialty-selector-slot"`.
    - Renderiza `UserMenu` (testar por `data-testid="user-menu"` — Task 4.1).
    - Header tem classe `sticky` + `top-0`.
    - Container main tem `max-w-7xl`.
    - `<Outlet />` renderiza conteúdo de rota filha (usar `MemoryRouter` + `Routes` com rota nested).
  - [ ] Files: `src/components/layout/AppShell.tsx`, `src/components/layout/AppShell.test.tsx`.

- [ ] **Task 3 — `AdminShell` component (layout admin + aviso mobile)** (AC: #4, #5)
  - [ ] 3.1 Criar `src/components/layout/AdminShell.tsx`:
    - Estrutura igual ao AppShell (min-h-screen + header sticky + main + Outlet), mas com **densidade compacta** e identidade admin.
    - **Header:** mesma sticky + altura `h-14 md:h-16`. Conteúdo `<div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-3 md:px-4">`.
      - **Esquerda:** `<Link to="/admin" …>Medway</Link>` + `<Badge variant="secondary">Admin</Badge>` lado a lado (AC4 verbatim: "badge 'Admin'"). `Badge` de [src/components/ui/badge.tsx](../../src/components/ui/badge.tsx).
      - **Centro:** `<nav aria-label="Admin">` com tabs renderizadas via `<NavLink>` de `react-router-dom` (não `Tabs` do shadcn — cada tab navega, não alterna conteúdo interno). Items iniciais (AC4 menciona "tabs" + Story 3.1 [epics.md:864-895](../planning-artifacts/epics.md#L864-L895) detalha): `[{ to: "/admin", label: "Instituições" }, { to: "/admin/regras", label: "Regras" }, { to: "/admin/leads", label: "Leads" }, { to: "/admin/historico", label: "Histórico" }]`. **Renderizar as 4 tabs**, mas apenas `/admin` deve ter rota registrada nesta story; demais aterrissam em `NotFound` até stories 3.x/4.x. Classe ativa: `text-foreground` (com underline/box); inativa: `text-muted-foreground hover:text-foreground`. Usar utilitário `cn(…)` de [src/lib/utils.ts](../../src/lib/utils.ts). **Nota:** tabs não-funcionais (404 em clique) são **esperadas** nesta fundação; evita duplicar componente em 3.1. Story 3.1 expande tabs com rotas reais.
      - **Direita:** `<UserMenu />` (mesmo componente da AppShell).
    - **Main:** `<main className="mx-auto max-w-screen-2xl px-3 py-3 md:px-4 md:py-4">` — densidade compacta AC4 verbatim `p-3/p-4` ([ux densidades admin](../planning-artifacts/ux-design-specification.md#L408-L410)). Container mais largo (`max-w-screen-2xl`) para tabelas densas (pattern Linear).
    - `<Outlet />` no body do main.
  - [ ] 3.2 **Aviso mobile não-bloqueante (AC5):**
    - Detectar mobile via CSS responsivo — **não** `window.matchMedia` (evita complicar SSR/initial render). Renderizar aviso visível apenas <768px via classes Tailwind `md:hidden`:
      ```tsx
      <div role="status" className="bg-warning/10 text-warning-foreground md:hidden">
        <div className="mx-auto max-w-screen-2xl px-3 py-2 text-xs">
          Painel admin otimizado para desktop
        </div>
      </div>
      ```
      Posicionar **abaixo do header e acima do main**. Texto AC5 verbatim. **Não-bloqueante:** sem botão de dismiss, sem `<Dialog>`, sem `<Sheet>`. `role="status"` sinaliza aria live discreto sem anunciar agressivamente.
    - **Cor:** usar token `warning` (âmbar da Story 1.2/1.5). Se o projeto usa `bg-amber-50` em vez de `bg-warning/10`, confirmar no [src/index.css](../../src/index.css) e preferir o token já usado em `FormMessage` âmbar das stories 1.5/1.6/1.7 (consistência de densidade calma — [ux:755-761](../planning-artifacts/ux-design-specification.md#L755-L761)).
  - [ ] 3.3 **Testes** em `src/components/layout/AdminShell.test.tsx`:
    - Renderiza logo "Medway" + badge com texto "Admin" + 4 tabs (Instituições, Regras, Leads, Histórico).
    - Renderiza `UserMenu`.
    - Renderiza bloco "Painel admin otimizado para desktop" com `role="status"` e classe `md:hidden` presente (assertar via `toHaveClass("md:hidden")` no elemento).
    - Container main tem classe `max-w-screen-2xl` e padding `p-3`/`p-4` (compacto).
    - `<Outlet />` renderiza conteúdo de rota filha.
    - Tab ativa: renderizar com `initialEntries={["/admin"]}` → tab "Instituições" tem classe de ativo; as demais não.
  - [ ] Files: `src/components/layout/AdminShell.tsx`, `src/components/layout/AdminShell.test.tsx`.

- [ ] **Task 4 — `UserMenu` (Avatar + DropdownMenu — reutilizado por ambas as shells)** (AC: #3, #4)
  - [ ] 4.1 Criar `src/components/layout/UserMenu.tsx`:
    - Consome `useAuth()` para obter `{ user, profile, signOut }`.
    - Renderiza [Avatar](../../src/components/ui/avatar.tsx) com `AvatarFallback` contendo **iniciais** derivadas de `profile.name` (`getInitials("Lucas Silva") => "LS"`, máx 2 chars uppercase; fallback para primeira letra de `user.email` se `profile.name` vazio). Função helper inline — **não** criar `src/lib/strings.ts` (evitar abstração prematura — uma função).
    - Envolver `Avatar` em `<DropdownMenuTrigger asChild><button type="button" aria-label="Menu do usuário" data-testid="user-menu" className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">…</button></DropdownMenuTrigger>` — [DropdownMenu shadcn](../../src/components/ui/dropdown-menu.tsx).
    - **Items do menu (MVP enxuto):**
      - `<DropdownMenuLabel>` com `profile.name` + `<DropdownMenuLabel className="text-xs text-muted-foreground">` com `user.email` (discreto — 2 linhas pequenas).
      - `<DropdownMenuSeparator />`.
      - `<DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>`.
    - **handleSignOut:**
      ```ts
      const handleSignOut = async () => {
        await signOut();
        navigate("/", { replace: true });
      };
      ```
      Pattern idêntico ao stub atual de `src/pages/app/Home.tsx:23-26` e `src/pages/admin/Home.tsx:22-25` — **reutilizar** a semântica que Story 1.6 já validou.
    - **Não** incluir "Minha conta" / "Configurações" — Story 5.2 adiciona `AccountSettings`. Manter menu com 2 itens (label+email, Sair).
  - [ ] 4.2 **Testes** em `src/components/layout/UserMenu.test.tsx`:
    - Renderiza Avatar com iniciais derivadas de `profile.name` (caso `name="Lucas Silva"` → "LS"; `name="Ana"` → "A"; `name=""` + `email="lucas@medway.com"` → "L").
    - Click abre dropdown; botão "Sair" visível.
    - Click em "Sair" chama `signOut()` do contexto (mock via `vi.mock("@/contexts/useAuth")` retornando objeto com `signOut: vi.fn()`) + `navigate("/")` com `replace: true`.
    - `data-testid="user-menu"` presente (usado por AppShell/AdminShell tests).
  - [ ] Files: `src/components/layout/UserMenu.tsx`, `src/components/layout/UserMenu.test.tsx`.

- [ ] **Task 5 — Integrar em `src/router.tsx` (ProtectedRoute + shells como layout route)** (AC: #1, #2, #3, #4)
  - [ ] 5.1 Editar [src/router.tsx](../../src/router.tsx) — trocar rotas planas `/app` e `/admin` por **layout routes** (react-router pattern: route pai sem `path` ou com `path`, renderizando o shell que contém `<Outlet />`). Estrutura alvo:
    ```tsx
    export const routes: RouteRecord[] = [
      {
        path: "/",
        Component: AppProviders,
        children: [
          { index: true, lazy: () => import("./pages/Landing").then(m => ({ Component: m.default })) },
          ...devDesignSystemRoute,
          { path: "signup", lazy: () => import("./pages/auth/Signup").then(m => ({ Component: m.default })) },
          { path: "login", lazy: () => import("./pages/auth/Login").then(m => ({ Component: m.default })) },
          { path: "forgot-password", lazy: () => import("./pages/auth/ForgotPassword").then(m => ({ Component: m.default })) },
          { path: "reset-password", lazy: () => import("./pages/auth/ResetPassword").then(m => ({ Component: m.default })) },
          {
            // Grupo ALUNO — ProtectedRoute("student") + AppShell
            path: "app",
            lazy: () => import("./components/layout/StudentLayout").then(m => ({ Component: m.default })),
            children: [
              { index: true, lazy: () => import("./pages/app/Home").then(m => ({ Component: m.default })) },
              // Stories 2.x adicionarão: curriculo, dashboard, instituicoes/:id
            ],
          },
          {
            // Grupo ADMIN — ProtectedRoute("admin") + AdminShell
            path: "admin",
            lazy: () => import("./components/layout/AdminLayout").then(m => ({ Component: m.default })),
            children: [
              { index: true, lazy: () => import("./pages/admin/Home").then(m => ({ Component: m.default })) },
              // Stories 3.x/4.x adicionarão: regras, leads, historico, etc.
            ],
          },
          { path: "*", Component: NotFound },
        ],
      },
    ];
    ```
  - [ ] 5.2 Criar `src/components/layout/StudentLayout.tsx` (wrapper de 1 linha para simplificar import lazy):
    ```tsx
    import ProtectedRoute from "./ProtectedRoute";
    import AppShell from "./AppShell";

    const StudentLayout = () => (
      <ProtectedRoute role="student">
        <AppShell />
      </ProtectedRoute>
    );
    export default StudentLayout;
    ```
    **Decisão — por que passar `<AppShell />` como children do `ProtectedRoute`:** `ProtectedRoute` usa `<Outlet />` como default, mas no caso de layout composto (shell + outlet) precisamos que `ProtectedRoute` renderize o shell, e o shell renderize seu próprio `<Outlet />` para rotas filhas. Passando `children` explícito, o `ProtectedRoute` renderiza o shell quando auth OK; shell fica responsável pelo outlet interno. Mantém a API do `ProtectedRoute` simples.
  - [ ] 5.3 Criar `src/components/layout/AdminLayout.tsx` análogo:
    ```tsx
    const AdminLayout = () => (
      <ProtectedRoute role="admin">
        <AdminShell />
      </ProtectedRoute>
    );
    ```
  - [ ] 5.4 **SSG:** `/app` e `/admin` devem permanecer **client-only** (não pré-renderizar). Padrão `vite-react-ssg` com `lazy()` em child é client-only por default ([comprovado na Story 1.4](./1-4-landing-page-publica-ssg.md) e 1.7). Verificar que `bun run build` gera `dist/app.html` e `dist/admin.html` como shells client (sem pré-render de conteúdo dinâmico) — igual comportamento de `/login`, `/signup`, `/forgot-password`, `/reset-password`. **Não** adicionar entry manual em `src/main.ts` / SSG routes config.
  - [ ] 5.5 **Testes:** **não** criar teste unit do router em si (react-router já testa sua mecânica). Cobertura efetiva vem dos testes de `ProtectedRoute` (Task 1.4) + `AppShell`/`AdminShell` (Task 2.2/3.3) + páginas (Task 6.3/6.4) + smoke manual (Task 9.5).
  - [ ] Files: `src/router.tsx` (modificado), `src/components/layout/StudentLayout.tsx`, `src/components/layout/AdminLayout.tsx`.

- [ ] **Task 6 — Simplificar stubs `src/pages/app/Home.tsx` e `src/pages/admin/Home.tsx` (ProtectedRoute assume o guard)** (AC: #3, #4)
  - [ ] 6.1 Editar [src/pages/app/Home.tsx](../../src/pages/app/Home.tsx):
    - **Remover:** todo o `useEffect` que redireciona para `/login`/`/reset-password`, o early return `if (loading || !user)`, o botão "Sair" (migrado para `UserMenu`), `useNavigate`, `Button` import não-usado.
    - **Manter apenas:** uso de `useAuth()` para exibir `profile.name` / `user.email` / `profile.role` no conteúdo. Sem header próprio (o `AppShell` fornece).
    - Exemplo final enxuto:
      ```tsx
      import { useAuth } from "@/contexts/useAuth";

      const AppHome = () => {
        const { user, profile } = useAuth();
        // ProtectedRoute + AppShell garantem que aqui `user` e `profile` já existem.
        return (
          <section className="space-y-2">
            <h1 className="text-2xl font-bold">Olá, {profile?.name ?? user?.email}</h1>
            <p className="text-muted-foreground">
              Área autenticada — {profile?.role}
            </p>
          </section>
        );
      };
      export default AppHome;
      ```
    - **Comentário antigo** `// TEMPORÁRIO — Story 1.8 substitui por AppShell…` **remover** (esta É a Story 1.8; o comentário ficou obsoleto).
  - [ ] 6.2 Editar [src/pages/admin/Home.tsx](../../src/pages/admin/Home.tsx) análogo:
    - Remover `useEffect` de guard, early return, botão "Sair", imports não usados.
    - Conteúdo enxuto:
      ```tsx
      import { useAuth } from "@/contexts/useAuth";

      const AdminHome = () => {
        const { user, profile } = useAuth();
        return (
          <section className="space-y-2">
            <h1 className="text-xl font-semibold">Instituições</h1>
            <p className="text-sm text-muted-foreground">
              Painel admin — {profile?.name ?? user?.email}
            </p>
          </section>
        );
      };
      export default AdminHome;
      ```
    - Remover comentário obsoleto `// TEMPORÁRIO — Story 1.8 substitui…`.
  - [ ] 6.3 Atualizar [src/pages/app/Home.test.tsx](../../src/pages/app/Home.test.tsx) (criado em 1.6, estendido em 1.7 para cobrir `recoveryMode`):
    - **Remover** testes de redirect (`user=null → /login`, `recoveryMode=true → /reset-password`) — essa responsabilidade migrou para `ProtectedRoute.test.tsx` (Task 1.4).
    - **Manter/adaptar:** render básico mostra `profile.name` + `profile.role`.
    - **Não** renderizar `ProtectedRoute` no teste da página (teste isolado de conteúdo, não de integração).
  - [ ] 6.4 Criar `src/pages/admin/Home.test.tsx` (não existia):
    - Render básico: mock `useAuth` retornando `{ user, profile: { name: "Admin", role: "admin", … } }` → renderiza "Painel admin".
  - [ ] Files: `src/pages/app/Home.tsx` (modificado), `src/pages/app/Home.test.tsx` (modificado), `src/pages/admin/Home.tsx` (modificado), `src/pages/admin/Home.test.tsx` (criado).

- [ ] **Task 7 — Toast "Acesso restrito" + sonner wiring sanity-check** (AC: #2)
  - [ ] 7.1 Confirmar que `<Toaster />` (Sonner) já está montado em algum wrapper alto (provavelmente `AppProviders` em [src/App.tsx](../../src/App.tsx) — criado em 1.2 ou 1.5). **Verificar via Grep**: `Grep "Toaster" src/App.tsx`. Se **não** estiver montado, adicionar `<Toaster richColors position="top-right" />` dentro do `AppProviders` children (antes do `<Outlet />`/routes). **Não** duplicar.
  - [ ] 7.2 Texto do toast: `"Acesso restrito"` (AC2 verbatim) — sem ponto final, sem prefixo. Use `toast.error("Acesso restrito")` de `sonner`. Manter consistência com 1.5/1.6/1.7 (toast neutro curto).
  - [ ] 7.3 **Evitar double-toast em StrictMode/re-render:** Navigate causa re-mount; sem cuidado, toast dispara 2x. Opção preferida: disparar via `useEffect(() => { if (shouldRedirect) toast.error(…) }, [shouldRedirect])` **ou** usar um `useRef(false)` que marca "já toasted". Padrão minimalista:
    ```tsx
    const toasted = useRef(false);
    if (user && profile && profile.role !== role) {
      if (!toasted.current) {
        toasted.current = true;
        toast.error("Acesso restrito");
      }
      return <Navigate to="/app" replace />;
    }
    ```
    Teste cobre (Task 1.4 último item).
  - [ ] Files: `src/components/layout/ProtectedRoute.tsx` (inclui lógica), possivelmente `src/App.tsx` (só se `<Toaster>` estiver ausente).

- [ ] **Task 8 — Acessibilidade + QA responsivo + smoke manual** (AC: #3, #4, #5)
  - [ ] 8.1 **Keyboard-only:** Tab percorre logo → tabs admin (no AdminShell) → UserMenu → conteúdo. Enter/Space em UserMenu abre dropdown (comportamento nativo do shadcn/Radix). Esc fecha. `UserMenu` trigger tem `aria-label="Menu do usuário"` explícito (Task 4.1).
  - [ ] 8.2 **Headings:** `AppShell` e `AdminShell` **não** renderizam `<h1>` — a página filha é responsável pelo `<h1>` (padrão já seguido em `Signup.tsx`, `Login.tsx`). Mantém hierarquia correta.
  - [ ] 8.3 **Contraste WCAG AA:** badge "Admin" usa `variant="secondary"` do shadcn (já tematizado na 1.2 com tokens Medway). Aviso mobile âmbar sobre fundo `warning/10` — conferir contraste se usando token `warning-foreground`.
  - [ ] 8.4 **Responsive:**
    - AppShell: validar em `sm` (<640px), `md` (≥768), `lg` (≥1024), `xl` (≥1280). Header reduz para 56px em `<md`; Avatar visível sempre; slot do SpecialtySelector vazio é ok.
    - AdminShell: `<768px` renderiza aviso. Tabs em mobile podem quebrar — aceitável (admin desktop-first, [ux:801-807](../planning-artifacts/ux-design-specification.md#L801-L807)). **Não** implementar menu hamburger para admin (out-of-scope MVP).
  - [ ] 8.5 **Smoke manual** (`supabase start` + `bun dev`, com 2 users seed: 1 student, 1 admin):
    - (a) Anônimo acessa `/app` → redirect `/login?redirect=%2Fapp`. Fazer login; validar que user aterrisa em `/app` (nota: `?redirect=` ainda não é lido pelo LoginForm — user vai pro default `/app` por coincidência; OK, não testável nesta story).
    - (b) Anônimo acessa `/admin` → redirect `/login?redirect=%2Fadmin`. Login como **student** → redirect para `/app` (default do LoginForm 1.6) → tentar `/admin` direto → toast "Acesso restrito" + redirect `/app`.
    - (c) Login como **admin** → aterriza em `/app` (LoginForm 1.6 default; 1.11+ ajustará lógica role-aware). Navegar para `/admin` manualmente → AdminShell renderiza (logo + badge Admin + tabs + Avatar).
    - (d) Em `/app` (aluno logado): header sticky visível ao rolar; slot SpecialtySelector vazio; Avatar com iniciais; click no Avatar → menu "Sair" → signOut + redirect `/`.
    - (e) Em `/admin` (admin logado): header sticky + badge Admin + 4 tabs. Click em "Regras" (sem rota ainda) → NotFound (esperado até Story 3.x).
    - (f) Responsive `/admin` em viewport 375px (DevTools): aviso "Painel admin otimizado para desktop" visível; ≥768px aviso some.
    - (g) Em `/app`, F5 durante `loading=true` (throttle 3G) → skeleton full-screen, não flash de `/login`.
    - (h) Em `/reset-password` com `recoveryMode=true` + tentar acessar `/app` → redirect para `/reset-password` (comportamento 1.7 preservado via Task 1.1 algoritmo passo 2).
  - [ ] 8.6 **Lint/type/test/build:** `bun run lint` + `bun run typecheck` (se existe — caso contrário `bunx tsc --noEmit`) + `bun run test` + `bun run build` devem passar 100%. Zero warnings novos.

- [ ] **Task 9 — Atualizar deferred-work + sprint-status** (AC: —)
  - [ ] 9.1 Append em [deferred-work.md](./deferred-work.md) seção `## Deferred from: story 1-8-protectedroute-appshell-adminshell (2026-04-14)`:
    - `LoginForm` ainda não lê `?redirect=` do querystring (Story 1.8 grava, mas leitura é deferred). Usuário deep-linkado em `/app/curriculo/X` → após login vai para `/app` padrão, não para a rota originalmente pedida. Escalate se UX indicar. Candidato para 1.11 ou patch em 1.6.
    - `LoginForm` não rotaciona destino por role — admin logando aterrisa em `/app` e precisa navegar manualmente para `/admin`. Arquitetura prevê ([architecture.md:391](../planning-artifacts/architecture.md#L391)) redirect `/admin` se role admin. Defer porque mexer em 1.6 força retest; pode entrar junto com `?redirect=` acima.
    - Menu do usuário tem apenas "Sair" no MVP; "Minha conta" / "Alterar senha" ficam para Story 5.2 (AccountSettings).
    - Admin mobile: apenas aviso não-bloqueante; sem hamburger menu / responsive tabs. Decisão deliberada ([ux:801-807](../planning-artifacts/ux-design-specification.md#L801-L807)); rever se feedback do Rcfranco indicar operação em tablet.
    - Tabs admin "Regras"/"Leads"/"Histórico" renderizadas mas sem rota — click leva a NotFound até Stories 3.1/3.4/3.6/4.x. Considerar placeholder "Em breve" se QA reclamar.
    - Badge "Admin" usa `variant="secondary"` neutro; design futuro pode querer variante com cor de marca (teal). Fora do escopo MVP.
    - Assets de logo SVG (Medway) não incluídos — logo textual `"Medway"` é placeholder até 1.11.
  - [ ] 9.2 Sprint-status: ready-for-dev → in-progress → review → done transitam nos workflows `dev-story` e `code-review`. **Não** tocar manualmente aqui.
  - [ ] 9.3 Files: `_bmad-output/implementation-artifacts/deferred-work.md` (append), `_bmad-output/implementation-artifacts/sprint-status.yaml` (automático pelos workflows subsequentes).

## Dev Notes

### Architecture compliance — 10 regras obrigatórias ([architecture.md:401-414](../planning-artifacts/architecture.md#L401))

| # | Regra | Aplicação nesta story |
|---|-------|-----------------------|
| 1 | snake_case end-to-end no data stack | Não aplicável — nenhuma tabela/JSON nova. Props TS (`role: "student" \| "admin"`) = camelCase local OK. `profile.role` vindo do banco mantém snake_case (valor `"student"`/`"admin"` é string, não identificador). |
| 2 | `database.types.ts` fonte de verdade | Reusa `ProfileRow["role"]` já tipado via `useAuth()` — não redefinir. |
| 3 | Zod em `src/lib/schemas/` | Não aplicável (nenhum form novo). |
| 4 | React Query para fetching | Auth data já vem de `useCurrentProfile` (1.5/1.6) via contexto. Nenhum fetch novo. |
| 5 | Checar `error` antes de `data` | `profile===null` tratado explicitamente (Task 1.1 algoritmo passo 4). |
| 6 | queries/mutations em `src/lib/queries/` | Não aplicável. |
| 7 | Mensagens pt-BR acionáveis | "Acesso restrito" (AC2), "Painel admin otimizado para desktop" (AC5), "Menu do usuário" aria-label, "Sair", "Medway" — tudo pt-BR. |
| 8 | Sem PII em logs | Toast não inclui email/nome; `handleSignOut` não loga; `getInitials` não loga. Remover qualquer `console.log` de debug antes do PR. |
| 9 | Respeitar RLS | Não toca banco; apenas lê `profile.role` do contexto. |
| 10 | Testes co-localizados | `.test.tsx` para cada novo componente (ProtectedRoute, AppShell, AdminShell, UserMenu) + stubs (`Home.test.tsx`). |

### Fluxo de guard (diagrama simplificado)

```
  request rota protegida /app ou /admin
            │
            ▼
      ProtectedRoute(role=X)
            │
   ┌────────┼──────────────────────────────────────┐
   │        │                                      │
loading   recovery                           role check
   │       mode                                    │
 skeleton   │                                      │
           /reset-password                         │
                                                  │
                            ┌─── user null ───────┤
                            │                     │
                     /login?redirect=<path>       │
                                                  │
                            ┌─── profile null ────┤
                            │                     │
                         skeleton                 │
                                                  │
                            ┌─── role mismatch ───┤
                            │                     │
                         toast "Acesso restrito" + /app
                                                  │
                                                  ▼
                                              <Shell><Outlet /></Shell>
                                              (AppShell ou AdminShell)
```

### Design tokens & densidades (de [ux:405-410](../planning-artifacts/ux-design-specification.md#L405), [ux:777-779](../planning-artifacts/ux-design-specification.md#L777))

| Elemento | Aluno (AppShell) | Admin (AdminShell) |
|---|---|---|
| Header altura | 56/64px (`h-14 md:h-16`) | 56/64px (`h-14 md:h-16`) |
| Container max-width | `max-w-7xl` (AC3) | `max-w-screen-2xl` (Linear-style denso) |
| Padding main | `px-4 py-6 md:px-6 md:py-8` (respirável) | `px-3 py-3 md:px-4 md:py-4` (compacto, AC4) |
| Identidade extra | — | Badge "Admin" + tabs |
| Mobile (<768px) | Responsive completo | Aviso não-bloqueante |

Rationale: densidade calma no aluno, eficiência no admin — duas personalidades sob uma marca ([ux:86](../planning-artifacts/ux-design-specification.md#L86)).

### Por que `children` explícito em `ProtectedRoute` + layout route no router?

React-router v6 oferece **layout routes** — uma route pai com `Component` + `children`, onde o pai renderiza `<Outlet />` e as routes filhas aparecem no outlet. Padrão normal:

```tsx
{ path: "app", Component: AppShell, children: [{ index: true, Component: AppHome }] }
```

Mas aqui queremos **2 camadas** de decoração: `ProtectedRoute` (guarda) → `AppShell` (shell). Opção A (implementada): `StudentLayout` component de 1 linha que compõe ambos + passa `<AppShell />` como children do `ProtectedRoute`. `ProtectedRoute` renderiza children quando OK; `AppShell` tem seu próprio `<Outlet />` para routes filhas. **Simples, explícito, testável**.

Opção B rejeitada: aninhar layout routes (`ProtectedRoute` como route com children = shell com children = pages). Duas rotas sem `path` empilhadas confundem `vite-react-ssg` e `react-router` dev tools. Benefício marginal, custo maior.

### Por que `<Outlet />` dentro do shell e não `children`?

Shells (`AppShell`, `AdminShell`) são **layout routes** no react-router — precisam de `<Outlet />` para que o router renderize os filhos no lugar certo. Usar `children` forçaria passar manualmente o conteúdo de cada page — perde a vantagem do routing declarativo.

### Previous story intelligence — Stories 1.6 e 1.7 (done)

- **`useAuth()` shape:** `{ user, session, profile, loading, recoveryMode, signOut }` — consumir via `@/contexts/useAuth`. **Não** importar `AuthContext` direto ([useAuth.ts:2](../../src/contexts/useAuth.ts#L2) exporta o hook; AuthContext só para Provider).
- **`recoveryMode` precisa ser honrado:** 1.7 preserva o requisito de que `/app` e `/admin` redirecionem para `/reset-password` quando em recovery. Task 1.1 passo 2 cobre explicitamente.
- **Sonner mock pattern:** [ResetPasswordForm.test.tsx](../../src/components/features/auth/ResetPasswordForm.test.tsx) usa `vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))`. Replicar.
- **Lazy client-only:** 1.5/1.6/1.7 confirmaram que `lazy(() => import(...))` em route children do `AppProviders` = client-only no `vite-react-ssg`. Aplicar mesmo padrão em Task 5.
- **Stubs 1.6/1.7 removidos:** os `useEffect` de guard nos stubs eram **temporários** anotados como "Story 1.8 substitui". Esta story executa essa substituição (Task 6). Não reintroduzir.

### Previous story intelligence — Stories 1.2 e 1.4 (done)

- **Design System tokens:** [src/index.css](../../src/index.css) define `background`, `foreground`, `border`, `muted-foreground`, `warning`, etc. como CSS vars HSL. Usar via classes Tailwind (`bg-background`, `text-foreground`) — não cores hardcoded ([architecture.md:405-414](../planning-artifacts/architecture.md#L405)).
- **shadcn primitives:** Avatar, DropdownMenu, Badge, Skeleton já instalados ([src/components/ui/](../../src/components/ui/)). **Não** criar wrappers novos; consumir direto.
- **SSG compatibilidade:** `AppShell`/`AdminShell` renderizam dentro de rotas client-only — nenhum cuidado extra de SSG. `window`/`document` podem ser usados livremente (mas **Task 3.2 deliberadamente evita** `window.matchMedia` preferindo CSS `md:hidden` por clareza e menos statefulness).

### Git intelligence (últimos 5 commits)

```
e1096ee feat: implementa stories 1.1–1.6 (Supabase, design system, auth)
3b9fb5f Add SCM-BH/USP-RP/UFPA in calc
95c8418 Add SCM-BH, USP-RP, UFPA handles
00d01e7 Aprimorou entrada padrão
23abfa5 Atualizou cálculo e estado
```

`e1096ee` agregou 1.1→1.6 em um commit grande (fundação). Commits `3b9fb5f/95c8418/…` são no `calculations.ts` (fora do escopo 1.8). Convenção: PT-BR curto (imperativo/infinitivo) ou `feat:` Conventional Commits quando escopo > 1 story. Esta story provavelmente fecha com `feat: implementa story 1.8 (ProtectedRoute + AppShell + AdminShell)`.

**Nota:** Story 1.7 ainda não foi commitada (status "review" no sprint, modificações untracked no `git status` inicial). Esta story **assume 1.7 merged** antes do dev-story rodar. Se 1.7 ainda estiver em review, dev-story deve aguardar ou o dev agent deve incluir 1.7 no mesmo PR após confirmação.

### Latest tech (Abril 2026)

- **react-router-dom v6:** `<Outlet />`, `<Navigate>`, `useLocation()`, `useNavigate()`, `<NavLink>` com `className` via função `({ isActive }) => …` continuam estáveis ([docs](https://reactrouter.com/en/6/components/outlet)). V7 lançou-se mas o projeto está em v6 ([package.json](../../package.json) — confirmar se necessário antes de usar v7-only APIs).
- **vite-react-ssg:** `lazy()` em `children` = client-only rendering (confirmado em 1.4/1.5/1.6/1.7). Routes pai `Component: AppProviders` pré-renderiza Landing; filhos lazy são código-splitted e client-only. Mesmo comportamento para layout routes nested.
- **@supabase/supabase-js 2.x:** `supabase.auth` já tratado em stories 1.1/1.5/1.6/1.7; esta story só consome via `useAuth()`. **Não** importar `supabase` diretamente — desnecessário.
- **Sonner 1.x:** `toast.error("msg")` + `<Toaster />` montado. Evitar `toast.error` em render direto (causa warning "setState during render") — usar `useEffect` ou `useRef` (Task 7.3).
- **shadcn DropdownMenu (Radix):** `DropdownMenuTrigger asChild` + botão custom é padrão; `aria-label` no botão (não no trigger) para acessibilidade ([Radix docs](https://www.radix-ui.com/primitives/docs/components/dropdown-menu#accessibility)).
- **Tailwind 3.x:** classes `backdrop-blur`, `sticky top-0 z-40`, `bg-background/95`, `md:hidden` estão todas disponíveis no preset atual do projeto ([tailwind.config.ts](../../tailwind.config.ts)).

### Project Structure Notes

- **Arquivos novos alinhados à arquitetura** ([architecture.md:518-569](../planning-artifacts/architecture.md#L518)):
  - `src/components/layout/ProtectedRoute.tsx` ✅
  - `src/components/layout/AppShell.tsx` ✅
  - `src/components/layout/AdminShell.tsx` ✅
  - `src/components/layout/UserMenu.tsx` ✅
  - `src/components/layout/StudentLayout.tsx` ✅ (novo, não previsto explicitamente mas coerente com pasta `layout/`)
  - `src/components/layout/AdminLayout.tsx` ✅ (análogo)
- **Arquivos existentes modificados:**
  - `src/router.tsx` — grupos `app` e `admin` viram layout routes com children.
  - `src/pages/app/Home.tsx` — simplificado (Task 6.1).
  - `src/pages/admin/Home.tsx` — simplificado (Task 6.2).
  - `src/pages/app/Home.test.tsx` — testes de redirect removidos (movidos para `ProtectedRoute.test.tsx`).
  - `src/App.tsx` — **possivelmente** adicionar `<Toaster />` se ainda não montado (Task 7.1 — verificar primeiro).
- **Sem desvios de arquitetura.** `PublicHeader.tsx` e `Footer.tsx` mencionados em [architecture.md:526-527](../planning-artifacts/architecture.md#L526) ficam para Stories 5.1 / landing redesign (6.x) — não aplicável aqui.

### References

- [epics.md Story 1.8 (linhas 503-531)](../planning-artifacts/epics.md) — AC verbatim
- [epics.md Epic 1 escopo (linhas 135-148)](../planning-artifacts/epics.md) — ProtectedRoute HOC com role
- [epics.md Story 3.1 (linhas 864-895)](../planning-artifacts/epics.md) — contexto das tabs admin (Instituições/Regras/Leads/Histórico)
- [architecture.md Autenticação (linhas 388-394)](../planning-artifacts/architecture.md) — pattern AuthContext + ProtectedRoute
- [architecture.md Enforcement Guidelines (linhas 401-414)](../planning-artifacts/architecture.md) — 10 regras
- [architecture.md Directory Structure (linhas 518-569)](../planning-artifacts/architecture.md) — `src/components/layout/` esperado
- [architecture.md Requirements → Components (linha 467)](../planning-artifacts/architecture.md) — FR4/5/6 mapeados para `src/components/features/auth/*` + `src/components/layout/ProtectedRoute.tsx`
- [ux-design-specification.md Navigation Patterns (linhas 775-783)](../planning-artifacts/ux-design-specification.md) — header aluno/admin, 64/56px, sticky
- [ux-design-specification.md Densidades (linhas 405-410)](../planning-artifacts/ux-design-specification.md) — aluno respirável vs admin compacto
- [ux-design-specification.md Responsive (linhas 797-807)](../planning-artifacts/ux-design-specification.md) — painel admin desktop-only MVP
- [ux-design-specification.md Feedback (linhas 755-761)](../planning-artifacts/ux-design-specification.md) — toast Sonner
- [ux-design-specification.md Skeleton vs spinner (linha 761)](../planning-artifacts/ux-design-specification.md) — skeleton obrigatório
- [1-6-login-logout-authcontext.md](./1-6-login-logout-authcontext.md) — AuthContext shape, stubs que esta story substitui
- [1-7-recuperacao-de-senha.md](./1-7-recuperacao-de-senha.md) — `recoveryMode` flag, guard pattern em stubs
- [src/contexts/useAuth.ts](../../src/contexts/useAuth.ts) — hook a consumir
- [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx) — shape com `recoveryMode`
- [src/router.tsx](../../src/router.tsx) — router a modificar
- [src/components/ui/avatar.tsx](../../src/components/ui/avatar.tsx), [dropdown-menu.tsx](../../src/components/ui/dropdown-menu.tsx), [badge.tsx](../../src/components/ui/badge.tsx), [skeleton.tsx](../../src/components/ui/skeleton.tsx), [sonner.tsx](../../src/components/ui/sonner.tsx) — primitives shadcn a reusar
- [deferred-work.md](./deferred-work.md) — entries a adicionar (Task 9.1)
- [react-router v6 Outlet](https://reactrouter.com/en/6/components/outlet), [Navigate](https://reactrouter.com/en/6/components/navigate), [NavLink](https://reactrouter.com/en/6/components/nav-link)
- [Sonner docs](https://sonner.emilkowal.ski/) — `toast.error` API

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Data       | Versão | Descrição                                                          | Autor    |
|------------|--------|--------------------------------------------------------------------|----------|
| 2026-04-14 | 0.1    | Story criada via bmad-create-story (context engine)                | Rcfranco |
