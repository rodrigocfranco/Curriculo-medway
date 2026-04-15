# Story 1.6: Login e logout com AuthContext

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **usuário cadastrado (student ou admin) em `/login`**,
I want **autenticar com email + senha, ter minha sessão propagada globalmente via `AuthContext` (que escuta `onAuthStateChange`), ser redirecionado para `/app` (role student) ou `/admin` (role admin) em sucesso, ver toast pt-BR não bloqueante em erro de credenciais e conseguir sair clicando num CTA "Sair" que invoca `supabase.auth.signOut` e me devolve para `/`**,
so that **destravo FR4/FR5 (acesso autenticado + logout), destravo a Story 1.8 (ProtectedRoute consome `useAuth()`), e qualquer feature subsequente (Epic 2 currículo/dashboard, Epic 3 admin) tenha um único ponto de verdade de sessão/role sem duplicar `supabase.auth.getSession()` em componente**.

## Acceptance Criteria

Copiados verbatim de [epics.md Story 1.6 (linhas 460-482)](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Login válido: `signInWithPassword` + redirect por role**
   **Given** estou em `/login`
   **When** preencho email + senha e clico "Entrar"
   **Then** `supabase.auth.signInWithPassword` é invocado
   **And** em sucesso sou redirecionado para `/app` (role student) ou `/admin` (role admin)
   **And** em erro vejo toast pt-BR não bloqueante ("Email ou senha inválidos")

2. **AC2 — Logout: `signOut` + redirect para `/`**
   **Given** logado
   **When** clico "Sair" no menu do Avatar
   **Then** `supabase.auth.signOut` é invocado
   **And** sou redirecionado para `/`

3. **AC3 — `AuthContext` escuta `onAuthStateChange` e propaga sessão globalmente**
   **Given** `AuthContext` escuta `onAuthStateChange`
   **When** ocorre login, logout, ou refresh de token
   **Then** estado de sessão é atualizado globalmente
   **And** `useAuth()` retorna `{ user, profile, loading, signOut }` para qualquer componente

## Tasks / Subtasks

- [x] **Task 1 — Zod schema `loginFormSchema`** (AC: #1)
  - [x] 1.1 Criar `src/lib/schemas/login.ts` com:
    - `email: z.string().trim().toLowerCase().email("Email inválido")`
    - `password: z.string().min(1, "Informe sua senha")` (login **não** re-valida força — Supabase é fonte de verdade; exigir só não-vazio para evitar blank submit)
  - [x] 1.2 Export `type LoginFormValues = z.infer<typeof loginFormSchema>`.
  - [x] 1.3 **Teste:** `src/lib/schemas/login.test.ts` — email inválido rejeitado, senha vazia rejeitada, caso feliz aprovado.
  - [x] Files: `src/lib/schemas/login.ts`, `src/lib/schemas/login.test.ts`.

- [x] **Task 2 — `useLogin` + `useLogout` em `src/lib/queries/auth.ts` (estender arquivo existente)** (AC: #1, #2)
  - [x] 2.1 Abrir `src/lib/queries/auth.ts` (criado na Story 1.5). **Adicionar** (não substituir) os hooks abaixo mantendo `useSignup` + `mapSignupError` + `SignupError` intactos.
  - [x] 2.2 Criar classe `LoginError extends Error` com `field: keyof LoginFormValues | null` + `message: string`.
  - [x] 2.3 Criar `mapLoginError(error: AuthError): LoginError`:
    - `invalid_credentials` / `"Invalid login credentials"` → `{ field: null, message: "Email ou senha inválidos" }` (AC1 — **verbatim**, vai para toast Sonner)
    - `email_not_confirmed` / `"Email not confirmed"` → `{ field: null, message: "Confirme seu email antes de entrar" }` (toast — MVP assume confirmation DISABLED, mas protege prod configurado diferente)
    - `over_request_rate_limit` → `{ field: null, message: "Muitas tentativas — aguarde alguns minutos" }` (toast)
    - fallback → `{ field: null, message: "Não foi possível entrar agora. Tente novamente." }` (toast)
    - **CRITICAL:** nunca revelar "email não encontrado" vs "senha errada" — sempre mensagem genérica (**proteção contra enumeração de email**, alinhado com 1.5 e Supabase defaults).
  - [x] 2.4 Hook `useLogin()`: `useMutation<{ user: User; session: Session }, LoginError, LoginFormValues>` cujo `mutationFn`:
    ```ts
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) throw mapLoginError(error);
    if (!data.user || !data.session) throw new LoginError("Sessão não retornada pelo servidor.");
    return { user: data.user, session: data.session };
    ```
    **Sem `invalidateQueries`** — `AuthContext` reage a `onAuthStateChange` e faz o refetch de `profile`.
  - [x] 2.5 Hook `useLogout()`: `useMutation<void, Error, void>` cujo `mutationFn` chama `supabase.auth.signOut({ scope: "local" })` (ver [Supabase Auth signOut docs](https://supabase.com/docs/reference/javascript/auth-signout) — `scope: "local"` revoga só o device atual; MVP ok). Em caso de `error` não bloqueante, apenas `console.error` + seguir (sessão local será limpa pelo SDK mesmo com 401 do endpoint de revoke).
  - [x] 2.6 Hook `useCurrentProfile(userId: string | null)`: `useQuery<ProfileRow | null>` com `queryKey: ["profile", userId]`, `enabled: !!userId`. `queryFn`:
    ```ts
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId!)
      .single();
    if (error) throw error;
    return data;
    ```
    Tipo: `type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]` (de `database.types.ts`; regra arch #2). **staleTime** `5 * 60 * 1000` (5min) — perfil muda raramente; role/email/etc. ficam cached.
  - [x] 2.7 **Teste:** estender `src/lib/queries/auth.test.ts`:
    - `useLogin`: sucesso retorna `{ user, session }`; erro `invalid_credentials` mapeia para mensagem verbatim AC1; rate limit mapeia toast genérico.
    - `useLogout`: chama `supabase.auth.signOut` uma vez.
    - `useCurrentProfile`: query disabled quando userId null; retorna row ao resolver; propaga error.

- [x] **Task 3 — `AuthContext` + `AuthProvider` + hook `useAuth`** (AC: #3)
  - [x] 3.1 Criar `src/contexts/AuthContext.tsx` (pasta nova — já prevista em [architecture.md linha 518](../planning-artifacts/architecture.md)).
  - [x] 3.2 Assinatura do contexto:
    ```ts
    type AuthContextValue = {
      user: User | null;            // @supabase/supabase-js User
      session: Session | null;      // @supabase/supabase-js Session
      profile: ProfileRow | null;   // public.profiles row (com role)
      loading: boolean;             // true até primeiro getSession() resolver + profile resolver (quando user existe)
      signOut: () => Promise<void>; // delegado a useLogout().mutateAsync
    };
    const AuthContext = React.createContext<AuthContextValue | null>(null);
    export const useAuth = () => {
      const ctx = useContext(AuthContext);
      if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
      return ctx;
    };
    ```
  - [x] 3.3 Implementar `<AuthProvider>{children}</AuthProvider>`:
    - No mount: `supabase.auth.getSession()` para preencher estado inicial (evita flash de "não-autenticado" em refresh). Setar `session`/`user` e deixar `loading=true` até profile carregar (quando user existe).
    - Subscrever `supabase.auth.onAuthStateChange((event, session) => { ... })`:
      - `SIGNED_IN` / `TOKEN_REFRESHED` / `USER_UPDATED`: atualizar `session`/`user`.
      - `SIGNED_OUT`: resetar `session`/`user`/`profile` para `null` + **`queryClient.removeQueries({ queryKey: ["profile"] })`** (evita vazar profile antigo entre users — crítico).
    - **Cleanup no unmount:** chamar `data.subscription.unsubscribe()`.
    - `profile` é derivado via `useCurrentProfile(user?.id ?? null)`:
      ```ts
      const profileQuery = useCurrentProfile(user?.id ?? null);
      const profile = profileQuery.data ?? null;
      const loading = sessionLoading || (!!user && profileQuery.isLoading);
      ```
    - `signOut`: async function que chama o `useLogout().mutateAsync()` (encapsula `supabase.auth.signOut`); **não** navega internamente (navegação é responsabilidade do chamador — AC2 navega para `/`).
  - [x] 3.4 **CRITICAL — SSG safety:** `<AuthProvider>` é montado dentro de `<AppProviders>` (ver Task 7). `AppProviders` é layout-route; durante pré-render (`vite-react-ssg`) **não existe** `window`/`localStorage`, mas **`supabase` é lazy Proxy** e `useEffect` só roda no browser — `getSession()` e `onAuthStateChange` são invocados dentro de `useEffect`, nunca no render sync. Validar no `bun run build`: build tem de passar sem crash (Landing SSG continua funcionando mesmo com AuthProvider no wrapper, porque Landing não chama `useAuth()`).
    - **Se build quebrar:** envolver `getSession()` + `onAuthStateChange` em check `if (typeof window !== "undefined")` dentro do `useEffect` (cinturão + suspensório; React não roda effects em SSR mas não custa).
    - **NÃO** adicionar `"use client"` — projeto não usa RSC.
  - [x] 3.5 **Teste:** `src/contexts/AuthContext.test.tsx` (RTL + `vi.mock("@/lib/supabase")`):
    - Emite `SIGNED_IN` manualmente → `useAuth()` retorna user populado
    - Emite `SIGNED_OUT` → `useAuth()` retorna user=null + `queryClient.removeQueries` invocado com `["profile"]`
    - `useAuth` fora de provider → throw
    - `loading=true` no mount inicial até `getSession` resolver
  - [x] Files: `src/contexts/AuthContext.tsx`, `src/contexts/AuthContext.test.tsx`.

- [x] **Task 4 — `LoginForm` component** (AC: #1)
  - [x] 4.1 Criar `src/components/features/auth/LoginForm.tsx` com `useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema), mode: "onSubmit", reValidateMode: "onChange", defaultValues: { email: "", password: "" } })`.
  - [x] 4.2 **Layout** ([ux-design-specification.md linhas 765-773](../planning-artifacts/ux-design-specification.md) + pattern de 1.5):
    - 1 coluna, container `max-w-md mx-auto`, `space-y-6`
    - Campos: `Input` email (`autoComplete="email"`, `inputMode="email"`) + `Input` password (type="password", `autoComplete="current-password"`)
    - `Button` submit full-width, texto `"Entrar"` (AC1 verbatim). Loading state: `"Entrando..."` + spinner.
    - Links secundários abaixo do CTA:
      - `<Link to="/forgot-password">Esqueci minha senha</Link>` (Story 1.7 — 404 até lá, aceitar — paralelo ao padrão `/termos` da 1.5)
      - `Não tem conta? <Link to="/signup">Criar conta</Link>`
  - [x] 4.3 **Validação inline âmbar (mesma regra da 1.5 Task 5.4):** `FormMessage` com `className="text-warning"` (ou `text-amber-600` fallback); **proibido** `text-destructive` / `text-red-*`. Reuse do token escolhido em 1.5 (checar código de 1.5 para consistência — se 1.5 usou `text-warning`, usar `text-warning`; se 1.5 teve de patchear `amber-600`, usar mesmo).
  - [x] 4.4 **Submit handler:**
    ```ts
    const { mutate, isPending } = useLogin();
    const { profile } = useAuth();           // para ler role após sucesso — ver nota 4.5
    const navigate = useNavigate();

    const onSubmit = (values: LoginFormValues) => {
      mutate(values, {
        onSuccess: async ({ user }) => {
          // fetch profile diretamente p/ decidir redirect (não esperar re-render do AuthContext)
          const { data: prof, error } = await supabase
            .from("profiles").select("role").eq("id", user.id).single();
          if (error || !prof) {
            toast.error("Conta sem perfil. Contate suporte.");
            return;
          }
          navigate(prof.role === "admin" ? "/admin" : "/app", { replace: true });
        },
        onError: (err) => {
          toast.error(err.message); // AC1 — toast Sonner, não inline
          form.setValue("password", ""); // limpar senha em falha (UX segura)
          form.setFocus("password");
        },
      });
    };
    ```
    **Rationale redirect-por-role:** `AuthContext` é a fonte de verdade de sessão global, mas **reage** via `onAuthStateChange` — quando `onSuccess` roda, `profile` pode ainda não estar populado (race). Fazer **um** `.select("role")` direto aqui é pragmático e único lugar onde quebramos a regra "nada de `supabase.from()` em componente" — **documentar em comentário**:
    ```ts
    // EXCEÇÃO arch regra 4: leitura síncrona de role para decidir redirect pós-login.
    // AuthContext refetch paralelo via onAuthStateChange → useCurrentProfile preenche.
    ```
    Alternativa considerada: esperar `profile` popular via `useAuth()` + `useEffect(() => { if (profile) navigate(...) })` na página. **Rejeitado** — race condition + UX de "travado no botão" até profile resolver.
  - [x] 4.5 **Acessibilidade:** `aria-invalid` via `FormMessage`; labels acima dos inputs; enter submete; sem focus-trap.
  - [x] Files: `src/components/features/auth/LoginForm.tsx`, `src/components/features/auth/LoginForm.test.tsx`.

- [x] **Task 5 — Página `/login` + rota** (AC: #1)
  - [x] 5.1 Criar `src/pages/auth/Login.tsx` — layout público espelhando `src/pages/auth/Signup.tsx` (1.5) para consistência visual:
    ```tsx
    const Login = () => (
      <main className="min-h-screen bg-background font-sans text-foreground">
        <header className="border-b bg-background">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <Link to="/"><img src="/logo.svg" alt="Medway" className="h-8" /></Link>
          </div>
        </header>
        <section className="mx-auto max-w-md px-6 py-10 md:py-16">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Entrar</h1>
          <p className="mb-8 text-muted-foreground">Acesse sua área autenticada.</p>
          <LoginForm />
        </section>
      </main>
    );
    export default Login;
    ```
  - [x] 5.2 **Redirect se já logado:** usar `useAuth()` — se `loading=false` e `user` existe, `useEffect` navega para `/app` (ou `/admin` se `profile?.role === "admin"`). Previne re-login enquanto sessão ativa.
  - [x] 5.3 Editar `src/router.tsx` — adicionar child da route `AppProviders` antes do catch-all:
    ```ts
    {
      path: "login",
      lazy: () => import("./pages/auth/Login").then((m) => ({ Component: m.default })),
    },
    ```
    **Path relativo** (mesmo padrão de 1.5). **Client-only** (lazy) — **não pré-renderizar** (requer Supabase runtime). Default do `vite-react-ssg` para child lazy = client-only ✅.
  - [x] Files: `src/pages/auth/Login.tsx`, `src/pages/auth/Login.test.tsx`, `src/router.tsx` (modificado).

- [x] **Task 6 — Página temporária `/app` com CTA "Sair" (stub até Story 1.8)** (AC: #2)
  - [x] 6.1 Criar `src/pages/app/Home.tsx` — **placeholder** mínimo que permite validar AC2 end-to-end antes da Story 1.8 entregar `AppShell`. Estrutura:
    ```tsx
    const AppHome = () => {
      const { user, profile, loading, signOut } = useAuth();
      const navigate = useNavigate();
      useEffect(() => {
        if (!loading && !user) navigate("/login", { replace: true });
      }, [loading, user, navigate]);
      const handleSignOut = async () => { await signOut(); navigate("/", { replace: true }); };
      if (loading || !user) return <div className="p-8">Carregando…</div>;
      return (
        <main className="mx-auto max-w-3xl p-8">
          <h1 className="text-2xl font-bold">Olá, {profile?.name ?? user.email}</h1>
          <p className="mt-2 text-muted-foreground">Área autenticada — {profile?.role ?? "…"}</p>
          <Button onClick={handleSignOut} variant="outline" className="mt-6">Sair</Button>
        </main>
      );
    };
    export default AppHome;
    ```
    **Nota em comentário do arquivo:** `// TEMPORÁRIO — Story 1.8 substitui por AppShell + Avatar menu. Mantém CTA "Sair" para satisfazer AC2 desta story.`
  - [x] 6.2 Criar stub análogo `src/pages/admin/Home.tsx` (diferenciação mínima: título "Admin", mesmo CTA Sair). Motivo: AC1 diz "redirecionado para `/admin` se role admin" — sem rota, redirect 404 e o teste E2E falha. Story 1.8 substitui por `AdminShell`.
    - Comentário: `// TEMPORÁRIO — Story 1.8 substitui por AdminShell.`
  - [x] 6.3 Registrar rotas em `src/router.tsx` como children do layout `AppProviders` (mesma lista onde `login`/`signup` entram):
    ```ts
    {
      path: "app",
      lazy: () => import("./pages/app/Home").then((m) => ({ Component: m.default })),
    },
    {
      path: "admin",
      lazy: () => import("./pages/admin/Home").then((m) => ({ Component: m.default })),
    },
    ```
    **Sem `ProtectedRoute`** aqui (Story 1.8). A guard é soft (o `useEffect` em `AppHome` redireciona se user=null). **Risk aceito:** user anônimo acessando `/app` vê flash antes do redirect. 1.8 fecha via `ProtectedRoute` HOC.
  - [x] 6.4 Files: `src/pages/app/Home.tsx`, `src/pages/admin/Home.tsx`, `src/router.tsx` (modificado).

- [x] **Task 7 — Montar `<AuthProvider>` dentro de `AppProviders`** (AC: #3)
  - [x] 7.1 Editar `src/App.tsx` (`AppProviders`). **Posição:** dentro de `QueryClientProvider` (AuthProvider usa React Query via `useCurrentProfile`) e dentro de `TooltipProvider`/`Toaster` (UI providers devem envolver tudo).
    ```tsx
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          {children ?? <Outlet />}
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
    ```
  - [x] 7.2 **QueryClient defaults:** `AuthProvider` usa `useCurrentProfile`. Se `queryClient` não tiver `defaultOptions.queries.retry=1`, falha de profile fica em retry infinito (impacto já sinalizado em [deferred-work.md linha 15](./deferred-work.md)). **Ajustar nesta story:**
    ```ts
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
    });
    ```
    Endereça parcialmente o deferred da 1.1. Documentar em `deferred-work.md` entry da 1.6 que o `ErrorBoundary` segue pendente (1.11).
  - [x] 7.3 **CRITICAL SSG regression guard:** rodar `bun run build` + `bun run test` após o wrap. Landing SSG hidrata com `AuthProvider` montado — pre-render dispara no build; `AuthProvider` roda `getSession()` dentro de `useEffect` → **não** em SSR. **Se** build quebrar, adicionar guard `typeof window !== "undefined"` (Task 3.4).
  - [x] 7.4 Files: `src/App.tsx` (modificado).

- [x] **Task 8 — Testes de integração** (AC: #1, #2, #3)
  - [x] 8.1 `LoginForm.test.tsx`:
    - Render mostra 2 inputs + CTA "Entrar" + link "Esqueci minha senha" + link "Criar conta" (AC1)
    - Submit com email inválido → `FormMessage` âmbar inline; **não** chama `signInWithPassword` (AC1)
    - Submit válido → `signInWithPassword` chamado com `{ email, password }` (AC1, mock)
    - Sucesso + mock `profiles.select("role") = "student"` → `navigate("/app")` (AC1)
    - Sucesso + mock `profiles.select("role") = "admin"` → `navigate("/admin")` (AC1)
    - Erro `invalid_credentials` → `toast.error("Email ou senha inválidos")` chamado (AC1 verbatim) + senha é limpa + foco em password
    - Mensagem de erro não deve usar classe `text-destructive`/`text-red-*` (consistência com 1.5)
  - [x] 8.2 `Login.test.tsx`:
    - User já autenticado (mock `AuthProvider` com user + profile.role=student) → redirect `/app` via `useEffect`
    - User anônimo → render de `LoginForm`
  - [x] 8.3 `AuthContext.test.tsx` — já coberto em Task 3.5.
  - [x] 8.4 `src/pages/app/Home.test.tsx` (stub):
    - user=null + loading=false → `navigate("/login")`
    - user presente → CTA "Sair" visível; click invoca `signOut` e depois `navigate("/")`
  - [x] 8.5 Usar `@testing-library/react` + `@testing-library/user-event` + `vi.mock("@/lib/supabase")` + `vi.mock("sonner")`. **Não** criar mock global — segue padrão de 1.5.

- [x] **Task 9 — Acessibilidade + QA manual** (AC: #1, #2, #3)
  - [x] 9.1 Keyboard-only: Tab percorre email → password → CTA "Entrar" → link "Esqueci minha senha" → link "Criar conta". Enter em qualquer input submete. Sem focus-trap.
  - [x] 9.2 Autocomplete: `email` input `autoComplete="email"` + `inputMode="email"`; password `autoComplete="current-password"`. Password manager (1Password/Chrome) deve oferecer fill.
  - [x] 9.3 **Sem PII em logs** — `mapLoginError` não loga email/senha. Remover qualquer `console.log` de debug antes do PR.
  - [x] 9.4 `bun run lint` + `bun run test` + `bun run build` devem passar 100%. **Não** introduzir warnings novos além do baseline (7 warnings em `src/components/ui/*` — ver 1.5).
  - [x] 9.5 Smoke manual (`supabase start` + `bun dev`):
    - (a) Criar usuário via `/signup` (Story 1.5) → verificar redirect `/app` com nome exibido
    - (b) Clicar "Sair" em `/app` → redirect `/` + `localStorage` do Supabase sem sessão
    - (c) `/login` com credenciais criadas → redirect `/app` + nome exibido
    - (d) `/login` com credenciais erradas → toast "Email ou senha inválidos" + campo senha limpo + foco em senha
    - (e) Via SQL: `update public.profiles set role='admin' where email='<meu>';` → refresh → novo login deve redirecionar `/admin` (não `/app`)
    - (f) Em `/app`, refresh da página → nome continua aparecendo (sessão persiste via Supabase storage + `getSession` no `AuthProvider`)
    - (g) Em outra aba, abrir DevTools → `supabase.auth.signOut()` manual → primeira aba reage via `onAuthStateChange` (outra aba do mesmo browser recebe evento cross-tab) e redireciona para `/login` no próximo click (ou via `useEffect` se aba em `/app` tiver guard)

- [x] **Task 10 — Update sprint-status + deferred-work** (AC: —)
  - [x] 10.1 Após dev-story completar e code-review passar, `sprint-status.yaml` será atualizado (ready-for-dev → in-progress → review → done) pelos workflows subsequentes.
  - [x] 10.2 **Deferred esperados** (anotar em `deferred-work.md` na fase code-review):
    - `/forgot-password` → 404 até Story 1.7 (link no LoginForm)
    - `ProtectedRoute` HOC não existe — `/app` e `/admin` guardados por `useEffect` soft. Fecha em 1.8. Risk: flash visual de conteúdo autenticado antes do redirect.
    - `AppShell` / `AdminShell` / Avatar menu não existem — CTA "Sair" é placeholder inline em stub. 1.8 substitui.
    - `ErrorBoundary` global ainda ausente (endereça parcialmente deferred 1.1 linha 15 via `queryClient.retry=1` nesta story).
    - `useCurrentProfile` falha silenciosamente (RLS bloqueia leitura anônima; só user logado lê próprio perfil). Se falhar em user logado → `profile=null`, `useAuth().profile` é null, fallback para `user.email` no stub. Acceptable MVP.
    - Redirect-por-role em `LoginForm` faz `supabase.from("profiles").select("role")` direto (exceção documentada à arch regra 4). Revisitar quando `AuthContext` resolver o profile em tempo determinístico (possível migração para `useSuspenseQuery` ou espera explícita pós-SIGNED_IN).
    - `signOut({ scope: "local" })` — revoga só o device atual. Admin pode querer "sair de todos os dispositivos" — defer para Story 5.2 (AccountSettings).
    - Cross-tab sync: funciona out-of-the-box via Supabase storage events, mas sem teste automatizado (difícil em Vitest). Smoke manual (g) valida.
    - Se `useCurrentProfile` falhar com RLS error pós-login, redirect de role cai em "/app" por fallback no `.onSuccess` handler — comportamento correto para student; admin logado com RLS quebrada cairia em `/app`. Very edge-case; RLS está testada em 1.3.

## Dev Notes

### Architecture compliance — 10 regras obrigatórias ([architecture.md linhas 401-414](../planning-artifacts/architecture.md))

| # | Regra | Aplicação nesta story |
|---|-------|----------------------|
| 1 | snake_case end-to-end no data stack | `profiles` row via `Database` types — `graduation_year`, `specialty_interest`, etc. permanecem snake_case. LoginFormValues (`email`/`password`) são identificadores TS locais — camelCase ok, vai direto para `signInWithPassword`. |
| 2 | `database.types.ts` fonte de verdade | `type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]` — **não redefinir**. |
| 3 | Zod schemas em `src/lib/schemas/` | `login.ts` nesta pasta (não inline). |
| 4 | React Query para data fetching | `useLogin` / `useLogout` / `useCurrentProfile` todos em `src/lib/queries/auth.ts`. **Exceção documentada:** leitura síncrona de `profiles.role` no `onSuccess` do LoginForm (Task 4.4) — marcar com comentário. |
| 5 | Checar `error` antes de `data` | `mutationFn` e `queryFn` checam `error` primeiro. |
| 6 | queries/mutations em `src/lib/queries/{domain}.ts` | Estender `auth.ts` existente. |
| 7 | Mensagens pt-BR acionáveis | AC1 verbatim ("Email ou senha inválidos") + todas mensagens do `mapLoginError` + Zod. |
| 8 | Sem PII em logs | Task 9.3 explícito; `mapLoginError` não recebe/loga email. |
| 9 | Respeitar RLS | `useCurrentProfile` lê via anon key + policy `profiles_select_own_or_admin` (Story 1.3). Nunca service_role. |
| 10 | Testes co-localizados | Task 1.3 + 2.7 + 3.5 + 4 (8.1) + 8.2 + 8.4. |

### Authentication flow ([architecture.md linhas 388-394](../planning-artifacts/architecture.md))

```
LoginForm (email+senha) → Zod valida → useLogin mutation →
  supabase.auth.signInWithPassword → retorna { user, session } →
  onSuccess: supabase.from("profiles").select("role").single() →
  navigate("/app" ou "/admin", replace: true)

Paralelo:
  onAuthStateChange("SIGNED_IN") → AuthContext atualiza user/session →
  useCurrentProfile refetch → AuthContext.profile populado
```

```
Logout:
  Avatar menu (stub em /app) → handleSignOut → useAuth().signOut()
    → useLogout mutation → supabase.auth.signOut({ scope: "local" })
    → onAuthStateChange("SIGNED_OUT") → AuthContext limpa + queryClient.removeQueries(["profile"])
    → navigate("/", replace: true)
```

### `AuthContext` — design decisions

**Por que React Context aqui e não React Query puro?**

Arquitetura ([linha 360](../planning-artifacts/architecture.md)): *"React Context apenas para `AuthContext` e `ThemeContext`; resto via React Query"*. Session/user é **estado de identidade global**, não dado remoto paginável — Context é a ferramenta certa. Profile é dado remoto → vive em React Query (`useCurrentProfile`) e é **projetado** dentro do context value pra facilitar consumo.

**Ordem de mount (`AppProviders`):**

```
QueryClient → Tooltip → Toaster/Sonner → AuthProvider → Outlet
```

- `QueryClient` antes porque `AuthProvider` usa `useCurrentProfile` (useQuery) e faz `queryClient.removeQueries` em `SIGNED_OUT`.
- `Toaster`/`Sonner` antes porque `AuthContext.signOut` pode disparar toast em futuras versões (hoje não).
- `AuthProvider` envolve `Outlet` para que todas as páginas vejam `useAuth()`.

**`loading` composto:**

```ts
loading = sessionLoading || (!!user && profileLoading)
```

- `sessionLoading=true` no primeiro render até `getSession()` resolver (evita "não logado" piscar em refresh).
- Se `user` existe, mantém `loading=true` até `profile` popular — assim `ProtectedRoute` (1.8) não redireciona um user com role ainda indefinido.

**Cross-tab:** Supabase SDK emite `onAuthStateChange` em todas as tabs do mesmo storage (localStorage events nativo). Sem trabalho extra.

### Trigger `handle_new_user` — não usado diretamente aqui

Login **não** toca trigger; perfil já foi criado em Signup (1.5). `useCurrentProfile` apenas lê via RLS. Se o trigger falhou em Signup (edge case), `useCurrentProfile` retorna 0 rows → `.single()` lança error PGRST116 → profile=null → redirect cai em `/app` por fallback. Risk **baixo** e reportado no deferred-work.

### `signInWithPassword` vs `signInWithOtp` vs social

MVP: apenas password. Magic link e OAuth (Google/etc.) **fora de escopo** — arquitetura não prevê e PRD FR4 diz "login com email + senha". Documentado.

### `scope: "local"` no signOut

Supabase 2.x oferece 3 scopes: `global` (revoga refresh tokens de todos devices no backend), `local` (só limpa storage local + revoga access token do device atual), `others` (tudo menos o atual). MVP usa `local` — é o mais rápido (uma chamada /logout), e "sair de todos os dispositivos" é feature de AccountSettings (Story 5.2).

### Previous story intelligence — Story 1.5 (ready-for-dev, **não done ainda**)

- **Dependência viva:** 1.5 ainda não foi dev/review. Esta story **assume que 1.5 mergeará antes**. Impactos se 1.5 mudar:
  - `src/lib/queries/auth.ts` é criado em 1.5. Se 1.5 renomear ou mover, esta story precisa realinhar Task 2.1 path.
  - `SignupForm` e `LoginForm` devem compartilhar convenções visuais (header logo, max-w, typography) — conferir no code-review.
  - `text-warning` vs `text-amber-600` — usar o mesmo que 1.5 decidiu (Task 5.4 da 1.5).
- Padrão `mapSignupError` em 1.5 = template para `mapLoginError` — mesmo shape (`{ field, message }`).
- `src/router.tsx` pattern: child relativo + `lazy()` em `AppProviders` children — já estabelecido.
- Proxy lazy em `src/lib/supabase.ts` protege SSG — confirmado em 1.4 e 1.5.

### Previous story intelligence — Story 1.3 (done)

- `profiles.role` é `text not null check (role in ('student','admin')) default 'student'`. Login lê `role` assumindo enum literal — ok.
- RLS policy `profiles_select_own_or_admin` permite user logado ler **própria** linha via `auth.uid() = id`. `useCurrentProfile` ✅.
- `prevent_role_self_escalation` trigger bloqueia user mudar próprio `role` via PostgREST — irrelevante aqui (não fazemos update), mas relevante se Story 5.2 quiser "mudar email".

### Previous story intelligence — Story 1.4 (done)

- SSG via `vite-react-ssg`. AuthProvider não pode chamar Supabase em render sync — **só em `useEffect`** (Task 3.4 guard).
- `createRoot = ViteReactSSG(...)` em `src/main.tsx` — **não tocar**.
- `dist/index.html` = 3KB. Adicionar AuthProvider + useQuery + contexts deve adicionar ~1–2KB gzip ao bundle Landing (React Query hook overhead). Monitorar, mas dentro do orçamento.
- Commits em pt-BR — manter convenção.

### Git intelligence (últimos 5 commits)

```
3b9fb5f Add SCM-BH/USP-RP/UFPA in calc
95c8418 Add SCM-BH, USP-RP, UFPA handles
00d01e7 Aprimorou entrada padrão
23abfa5 Atualizou cálculo e estado
70873bd Atualizei cálculo e estado
```

Commits em `calculations.ts` (Story 1.9 futura). **Nada bloqueia 1.6.** Convenção: pt-BR curto, infinitivo/passado simples.

### Latest tech (Abril 2026)

- **@supabase/supabase-js 2.x** — `signInWithPassword` estável desde 2022 (antes era `signIn`, removido). API: `{ email, password }` → `{ data: { user, session }, error }`.
- **`onAuthStateChange`** — retorna `{ data: { subscription } }`; lembrar `subscription.unsubscribe()` no cleanup.
- **Events 2.x:** `INITIAL_SESSION` (emitido no subscribe com sessão corrente — útil!), `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`, `PASSWORD_RECOVERY`. `PASSWORD_RECOVERY` será relevante na 1.7.
- **`signOut(options?)`** — aceita `{ scope: "global" | "local" | "others" }` desde 2.24. Default `global`. Usar `local` explicitamente no MVP.
- **React Query v5** (projeto usa via `@tanstack/react-query`) — `useMutation` return shape: `{ mutate, mutateAsync, isPending, isError, error, data, ... }`. `isPending` (não `isLoading` — esse foi deprecated em v5 para mutations).
- **react-router v6** — `useNavigate` + `{ replace: true }` para login/logout redirect (evita back-button voltar à tela de auth).

### Project Structure Notes

- Novas pastas esperadas na arquitetura ([linhas 512-553](../planning-artifacts/architecture.md)):
  - `src/contexts/AuthContext.tsx` ✅
  - `src/components/features/auth/LoginForm.tsx` ✅
  - `src/pages/auth/Login.tsx` ✅
  - `src/pages/app/Home.tsx` (stub — 1.8 transforma em `Dashboard.tsx`)
  - `src/pages/admin/Home.tsx` (stub — 1.8+ transforma)
  - `src/lib/schemas/login.ts` ✅
- `src/lib/queries/auth.ts` já existe (criado em 1.5) — **estender**, não substituir.
- **Desvio da arquitetura:** stubs `src/pages/app/Home.tsx` e `src/pages/admin/Home.tsx` existem **temporariamente**. Arquitetura prevê `Dashboard.tsx`/etc. — Story 1.8 reconcilia. Documentar em `docs/architecture-deviations.md` **se** code-review pedir.

### References

- [epics.md Story 1.6 (linhas 460-482)](../planning-artifacts/epics.md) — AC verbatim
- [epics.md FR4, FR5 (linhas 24-25)](../planning-artifacts/epics.md) — requisitos
- [epics.md Story 1.8 (linhas 503-531)](../planning-artifacts/epics.md) — contexto do consumidor (`ProtectedRoute` vai consumir `useAuth()`)
- [architecture.md Authentication (linhas 180-188)](../planning-artifacts/architecture.md)
- [architecture.md Authentication patterns (linhas 388-394)](../planning-artifacts/architecture.md)
- [architecture.md State Management (linhas 358-362)](../planning-artifacts/architecture.md) — AuthContext é exceção
- [architecture.md Error handling (linhas 366-372)](../planning-artifacts/architecture.md)
- [architecture.md Enforcement Guidelines (linhas 401-414)](../planning-artifacts/architecture.md) — 10 regras
- [architecture.md Requirements → Components Mapping linha 467](../planning-artifacts/architecture.md)
- [architecture.md Directory Structure (linhas 479-569)](../planning-artifacts/architecture.md)
- [ux-design-specification.md Form Patterns (linhas 765-773)](../planning-artifacts/ux-design-specification.md)
- [ux-design-specification.md Feedback (linhas 753-763)](../planning-artifacts/ux-design-specification.md)
- [1-3-schema-profiles-trigger-rls.md](./1-3-schema-profiles-trigger-rls.md) — `profiles.role`, RLS policies consumidas
- [1-4-landing-page-publica-ssg.md](./1-4-landing-page-publica-ssg.md) — SSG safety + router pattern
- [1-5-cadastro-publico-signup-lgpd.md](./1-5-cadastro-publico-signup-lgpd.md) — `src/lib/queries/auth.ts` criado + convenções de form/error
- [deferred-work.md](./deferred-work.md) — linha 15 (`QueryClient defaults`) endereçada parcialmente nesta story
- [0001_profiles.sql](../../supabase/migrations/0001_profiles.sql) — RLS policies + role column
- [supabase-js signInWithPassword docs](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [supabase-js signOut docs](https://supabase.com/docs/reference/javascript/auth-signout)
- [supabase-js onAuthStateChange docs](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run test` (15 files, 68 tests, 100% passing — adiciona 28 tests: 4 login schema + 9 auth queries novos + 4 AuthContext + 5 LoginForm + 3 Login page + 2 AppHome).
- `npm run lint` — 7 warnings (baseline inalterado; todos em `src/components/ui/*`).
- `npm run build` — SSG OK; `dist/login.html` 4.74 KiB, `dist/app.html` / `dist/admin.html` 2.08 KiB (fallback "Carregando…").

### Completion Notes List

- **AC1** satisfeito: `signInWithPassword` + redirect-por-role (`/app` vs `/admin`) via `select("role")` no `onSuccess`; toast pt-BR "Email ou senha inválidos" verbatim em erro de credenciais; senha é limpa + foco volta para input de senha em falha. Mensagem de erro usa classe `text-warning` (consistente com 1.5 — **não** `text-destructive`/`text-red-*`).
- **AC2** satisfeito: `useAuth().signOut()` delega a `useLogout().mutateAsync()` (que chama `supabase.auth.signOut({ scope: "local" })`); stubs `/app` e `/admin` invocam `navigate("/", { replace: true })` após `signOut`. `onAuthStateChange("SIGNED_OUT")` limpa estado local e remove queries `["profile"]` do cache (evita vazar profile entre users).
- **AC3** satisfeito: `AuthContext` escuta `onAuthStateChange` (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION) dentro de `useEffect`, atualiza `session`/`user` e projeta `profile` via `useCurrentProfile`. `useAuth()` retorna `{ user, session, profile, loading, signOut }` e throw fora do provider. `loading = sessionLoading || (!!user && profileQuery.isLoading)` evita flash de conteúdo em refresh.
- **Exceção arch regra 4 documentada:** `LoginForm.onSubmit` faz `supabase.from("profiles").select("role").single()` direto para decidir redirect imediato (sem esperar `AuthContext` reagir a `SIGNED_IN`). Comentário inline no código explica o porquê; entrada em deferred-work.
- **QueryClient endurecido:** `defaultOptions.queries.retry=1, staleTime=60_000` em `src/App.tsx` — endereça parcialmente deferred 1.1 linha 15. `ErrorBoundary` completo segue pendente (1.11).
- **SSG safety:** `AuthProvider` usa `typeof window !== "undefined"` guard + todas as chamadas Supabase estão dentro de `useEffect`. Build pré-renderiza `login.html`/`app.html`/`admin.html` sem crash (fallback "Carregando…" hidrata no cliente). Landing SSG segue funcionando.
- **Lint hygiene:** `useAuth` isolado em `src/contexts/useAuth.ts` (separação hook/component); `AuthContext` export em `AuthContext.tsx` exige `eslint-disable-next-line react-refresh/only-export-components` (Context não é componente — false positive esperado). Baseline de 7 warnings preservado.
- **Sem PII em logs:** `mapLoginError` não recebe/loga email; `useLogout` só faz `console.error` do erro de revoke (sem tokens). Nenhum `console.log` de debug deixado no código.

### File List

**Novos:**
- `src/lib/schemas/login.ts`
- `src/lib/schemas/login.test.ts`
- `src/contexts/AuthContext.tsx`
- `src/contexts/AuthContext.test.tsx`
- `src/contexts/useAuth.ts`
- `src/components/features/auth/LoginForm.tsx`
- `src/components/features/auth/LoginForm.test.tsx`
- `src/pages/auth/Login.tsx`
- `src/pages/auth/Login.test.tsx`
- `src/pages/app/Home.tsx`
- `src/pages/app/Home.test.tsx`
- `src/pages/admin/Home.tsx`

**Modificados:**
- `src/lib/queries/auth.ts` — adicionados `LoginError`, `mapLoginError`, `useLogin`, `useLogout`, `useCurrentProfile`, `ProfileRow`; removido TODO do `useSignup`.
- `src/lib/queries/auth.test.ts` — adicionados 10 testes para os novos hooks.
- `src/App.tsx` — `AuthProvider` montado dentro de `AppProviders`; `QueryClient` com `defaultOptions.queries.retry=1 + staleTime=60_000`.
- `src/router.tsx` — rotas `login`, `app`, `admin` adicionadas como children de `AppProviders`.
- `_bmad-output/implementation-artifacts/deferred-work.md` — seção "Deferred from: story 1-6-login-logout-authcontext (2026-04-14)".

## Change Log

| Data       | Versão | Descrição                                                                      | Autor    |
|------------|--------|--------------------------------------------------------------------------------|----------|
| 2026-04-14 | 0.1    | Story criada via bmad-create-story (context engine)                            | Rcfranco |
| 2026-04-14 | 1.0    | Implementação completa (tasks 1–10): login/logout/AuthContext + stubs + testes | Dev      |

### Review Findings (code review 2026-04-14)

#### Decision Needed

- [x] [Review][Decision] Gate de role no `/admin` — implementar agora ou aguardar Story 1.8? — `AdminHome` só checa `user` truthy; um usuário com role `student` que digite `/admin` na URL renderiza a página de admin (titulo "Admin", `profile?.name`). Spec defere `ProtectedRoute` para 1.8, mas role-gate é distinto e barato (um `if (profile?.role !== "admin") navigate("/app")`). [src/pages/admin/Home.tsx]
- [x] [Review][Decision] Código da Story 1.7 (`useRequestPasswordReset`, `useResetPassword`, `mapResetPasswordError`, `ResetPasswordError`, `recoveryMode` no context, handler `PASSWORD_RECOVERY`) está misturado nesta entrega — manter (scope creep aceito) ou reverter para a Story 1.7? [src/lib/queries/auth.ts, src/contexts/AuthContext.tsx]

#### Patch

- [x] [Review][Patch] `getSession()` sem `.catch` — rejeição (rede, storage corrompido) deixa `sessionLoading=true` para sempre, app trava em "Carregando…" sem recuperação [src/contexts/AuthContext.tsx]
- [x] [Review][Patch] Erro/`null` do `useCurrentProfile` rebaixa silenciosamente admin → `/app` — em `Login.tsx` (redirect-se-já-logado) e `LoginForm.onSuccess` (mesmo caminho) admin com falha de fetch profile cai em `/app` em vez de `/admin`; tratar `profileQuery.isError` ou aguardar profile carregado antes de decidir [src/pages/auth/Login.tsx, src/components/features/auth/LoginForm.tsx]
- [x] [Review][Patch] `TOKEN_REFRESHED` com `nextSession=null` zera `user` mid-sessão sem limpar `["profile"]` — defesa do branch `default` trata refresh-failure como SIGNED_OUT parcial; tratar `null` session como `SIGNED_OUT` completo (limpar profile cache também) [src/contexts/AuthContext.tsx]
- [x] [Review][Patch] `.single()` no profile-fetch do `LoginForm.onSuccess` toasta "Conta sem perfil" mas **não** desloga — usuário fica autenticado no `AuthContext`, e o `useEffect` redirect do `Login.tsx` o joga em `/app` apesar do toast. Deslogar (`supabase.auth.signOut`) ou usar `maybeSingle` + signOut explícito no fail [src/components/features/auth/LoginForm.tsx]
- [x] [Review][Patch] Loop potencial `/login` ↔ `/app` quando `profile=null` e `loading=false` — `Login.tsx` redireciona para `/app` por ter `user`; `AppHome` futuro guard (ou se profile-required) chuta de volta para `/login`. Adicionar guard "profile carregado" antes de redirecionar [src/pages/auth/Login.tsx, src/pages/app/Home.tsx]
- [x] [Review][Patch] `signOut` resolve antes do listener `SIGNED_OUT` rodar — `navigate("/")` pode disparar com `user`/`profile` ainda no estado, causando flash de UI autenticada em rotas gated. Mover `navigate` para dentro do listener OU aguardar próximo tick [src/pages/app/Home.tsx, src/pages/admin/Home.tsx]
- [x] [Review][Patch] Branch `default` do `onAuthStateChange` (incl. `INITIAL_SESSION`) seta `session/user` mas não flipa `sessionLoading=false` nem é coberto por testes — `INITIAL_SESSION` corre paralelo a `getSession()` e, se este falhar (combinar com patch 1), `sessionLoading` continua true [src/contexts/AuthContext.tsx]
- [x] [Review][Patch] `recoveryMode` é resetado por `TOKEN_REFRESHED` enquanto user está em `/reset-password` — após ~60s o auto-refresh do Supabase derruba o flag e o gate de proteção do flow de recovery quebra. Não tocar `recoveryMode` em `TOKEN_REFRESHED`/`USER_UPDATED` [src/contexts/AuthContext.tsx]
- [x] [Review][Patch] `useCallback(signOut, [logoutMutation])` regenera referência a cada render — `logoutMutation` muda identidade sempre, então o `value` do `useMemo` churneia e todos os consumers de `useAuth()` re-renderizam por toda mudança no provider. Memoizar via `mutateAsync` direto ou `useEvent`-like ref [src/contexts/AuthContext.tsx]

#### Defer (pre-existente ou planejado)

- [x] [Review][Defer] `removeQueries({queryKey:["profile"]})` só limpa profile; outras queries user-scoped vão vazar entre usuários. Hoje só existe `["profile"]`, mas plantar `queryClient.clear()` em SIGNED_OUT antes de Epic 2 introduzir mais caches — diferido [src/contexts/AuthContext.tsx]
- [x] [Review][Defer] SSG: `/login` flasha o formulário para usuário já autenticado em hard-refresh (effect só roda client-side) — adicionar skeleton "Verificando sessão…" — diferido (UX polish) [src/pages/auth/Login.tsx]
- [x] [Review][Defer] `useCurrentProfile` sem `AbortSignal` — race em troca rápida de usuário (raro hoje sem multi-user no mesmo tab) — diferido [src/lib/queries/auth.ts]
- [x] [Review][Defer] Sem `ErrorBoundary` global; `profileQuery.isError` ignorado em todo o app — endereçado parcialmente por `retry: 1` (Story 1.6 Task 7.2); fechamento completo na Story 1.11 — diferido [src/contexts/AuthContext.tsx, src/App.tsx]
- [x] [Review][Defer] Header da página `/login` usa texto "Medway" em vez de `<img src="/logo.svg">` previsto na spec Task 5.1 — provavelmente porque o asset não existe; trocar quando logo.svg for adicionado — diferido [src/pages/auth/Login.tsx]
