# Story 1.7: Recuperação de senha

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **usuário cadastrado que esqueceu a senha**,
I want **solicitar um link de recuperação por email em `/forgot-password`, clicar no link recebido, aterrissar em `/reset-password` com a sessão de recovery válida, definir nova senha com confirmação e ser redirecionado ao `/login` com toast de sucesso — sempre vendo mensagem neutra na solicitação (para evitar enumeração de emails cadastrados)**,
so that **fecha FR6 ("recuperação de senha"), desbloqueia o link "Esqueci minha senha" que o `LoginForm` (Story 1.6) já renderiza apontando para `/forgot-password` (hoje 404), e deixa o fluxo de auth completo antes da Story 1.8 `ProtectedRoute`+shells assumir a guard definitiva**.

## Acceptance Criteria

Copiados verbatim de [epics.md Story 1.7 (linhas 484-501)](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Solicitar link em `/forgot-password`: `resetPasswordForEmail` + mensagem neutra**
   **Given** estou em `/forgot-password`
   **When** informo email e clico "Enviar link de recuperação"
   **Then** `supabase.auth.resetPasswordForEmail` é invocado
   **And** vejo mensagem neutra "Se este email está cadastrado, enviamos um link" (evita enumeração)

2. **AC2 — Definir nova senha em `/reset-password`: `updateUser` + redirect `/login`**
   **Given** recebi o email e cliquei no link
   **When** aterriso em `/reset-password` com token válido
   **Then** vejo formulário com nova senha + confirmação
   **And** ao submeter, `supabase.auth.updateUser({ password })` é invocado
   **And** em sucesso sou redirecionado para `/login` com toast de confirmação

## Tasks / Subtasks

- [x] **Task 1 — Zod schemas `forgotPasswordFormSchema` + `resetPasswordFormSchema`** (AC: #1, #2)
  - [x] 1.1 Criar `src/lib/schemas/forgot-password.ts`:
    - `email: z.string().trim().toLowerCase().email("Email inválido")`
    - Export `type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>`.
  - [x] 1.2 Criar `src/lib/schemas/reset-password.ts`:
    - Base: `password: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72 caracteres")`, `confirmPassword: z.string()`.
    - `.refine((v) => v.password === v.confirmPassword, { message: "Senhas não conferem", path: ["confirmPassword"] })`.
    - Bounds **idênticos** ao `signupFormSchema` ([src/lib/schemas/signup.ts:28](../../src/lib/schemas/signup.ts#L28)) — consistência de regra de senha entre signup/reset. **Não** introduzir regra de complexidade extra (Supabase default valida via `minimum_password_length=8`; complexidade custom só se `password_requirements` estiver configurado — fora do escopo MVP).
    - Export `type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>`.
  - [x] 1.3 **Testes** co-localizados (`.test.ts`):
    - `forgot-password.test.ts`: email inválido rejeitado; email válido (trim + lowercase) aceito.
    - `reset-password.test.ts`: senhas diferentes → erro em `confirmPassword`; <8 chars → erro em `password`; >72 chars → erro em `password`; caso feliz.
  - [x] Files: `src/lib/schemas/forgot-password.ts`, `src/lib/schemas/forgot-password.test.ts`, `src/lib/schemas/reset-password.ts`, `src/lib/schemas/reset-password.test.ts`.

- [x] **Task 2 — Hooks `useRequestPasswordReset` + `useResetPassword` em `src/lib/queries/auth.ts` (estender arquivo existente)** (AC: #1, #2)
  - [x] 2.1 Abrir `src/lib/queries/auth.ts` (criado em 1.5, estendido em 1.6). **Adicionar** os hooks abaixo mantendo `useSignup`/`useLogin`/`useLogout`/`useCurrentProfile` + mappers existentes intactos.
  - [x] 2.2 Classe `ResetPasswordError extends Error` com `field: "password" | "confirmPassword" | null` + `message: string`.
  - [x] 2.3 `mapResetPasswordError(error: AuthError | Error): ResetPasswordError`:
    - `same_password` / `"New password should be different from the old password"` → `{ field: "password", message: "A nova senha deve ser diferente da anterior" }` (inline âmbar).
    - `weak_password` / `"Password should be at least"` → `{ field: "password", message: "Senha muito fraca — mínimo 8 caracteres" }` (inline âmbar).
    - `over_request_rate_limit` / `"rate limit"` → `{ field: null, message: "Muitas tentativas — aguarde alguns minutos" }` (toast).
    - `"Auth session missing"` / sessão ausente → `{ field: null, message: "Link inválido ou expirado. Solicite um novo." }` (toast + rota redireciona — ver Task 5.4).
    - fallback → `{ field: null, message: "Não foi possível alterar a senha agora. Tente novamente." }` (toast).
  - [x] 2.4 **Hook `useRequestPasswordReset()`** — `useMutation<void, Error, { email: string }>`:
    ```ts
    return useMutation<void, Error, { email: string }>({
      mutationFn: async ({ email }) => {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (error && !isNeutralizableError(error)) {
          // CRITICAL anti-enumeração: NÃO propagar "email not found". Supabase 2.x por
          // padrão já retorna success mesmo para email inexistente; mas rate-limit, rede
          // fora, ou 500 devem ser surfados. Neutralizar somente erros de "usuário não
          // encontrado" que, em futuras versões, possam escapar.
          throw error;
        }
      },
    });
    ```
    - Helper `isNeutralizableError(err): boolean` retorna `true` para mensagens que vazariam existência do email (ex.: `"User not found"`, `user_not_found`). Todos os outros erros (rede, rate limit, 500) são propagados. **Default Supabase 2.x**: retorna `{ error: null }` mesmo se email não existir ([docs](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)) — helper é defesa em profundidade, não caminho feliz.
    - **Sempre exibir** a mensagem neutra do AC1 no UI, mesmo se `mutation.isError` (toast separado para rate limit). Ver Task 4.3.
  - [x] 2.5 **Hook `useResetPassword()`** — `useMutation<void, ResetPasswordError, ResetPasswordFormValues>`:
    ```ts
    return useMutation<void, ResetPasswordError, ResetPasswordFormValues>({
      mutationFn: async (values) => {
        const { error } = await supabase.auth.updateUser({ password: values.password });
        if (error) throw mapResetPasswordError(error);
        // AuthContext reage via onAuthStateChange("USER_UPDATED"); não tocar aqui.
      },
    });
    ```
  - [x] 2.6 **Teste:** estender `src/lib/queries/auth.test.ts`:
    - `useRequestPasswordReset`: chama `supabase.auth.resetPasswordForEmail` com `{ email }` + `redirectTo` contendo `/reset-password`; sucesso resolve void; `rate limit` propaga error.
    - `useRequestPasswordReset`: neutraliza `user_not_found` (mock retorna erro "User not found" → mutation resolve sem throw).
    - `useResetPassword`: chama `supabase.auth.updateUser({ password: "..." })`; erro `same_password` mapeia para field `"password"` + mensagem verbatim; erro `"Auth session missing"` mapeia para field `null` + mensagem de link expirado.
  - [x] Files: `src/lib/queries/auth.ts` (estendido), `src/lib/queries/auth.test.ts` (estendido).

- [x] **Task 3 — `AuthProvider` deve reconhecer `PASSWORD_RECOVERY` sem redirecionar para `/app`** (AC: #2)
  - [x] 3.1 Editar `src/contexts/AuthContext.tsx` (criado em Story 1.6) — adicionar tratamento do evento `PASSWORD_RECOVERY` no `onAuthStateChange`:
    ```ts
    supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case "PASSWORD_RECOVERY":
          // Supabase emite após o usuário clicar no link de recovery e chegar em
          // /reset-password. Sessão existe (temporária), mas NÃO é um login normal.
          // Atualizamos user/session para que updateUser() tenha sessão, mas marcamos
          // um flag interno para componentes de auth (Login/Signup) saberem que devem
          // NÃO redirecionar (caso user anônimo aterrise via link em outra rota).
          setSession(session);
          setUser(session?.user ?? null);
          setRecoveryMode(true);
          break;
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
        case "USER_UPDATED":
          setSession(session);
          setUser(session?.user ?? null);
          setRecoveryMode(false); // USER_UPDATED após reset encerra recovery mode
          break;
        case "SIGNED_OUT":
          setSession(null);
          setUser(null);
          setRecoveryMode(false);
          queryClient.removeQueries({ queryKey: ["profile"] });
          break;
      }
    });
    ```
  - [x] 3.2 Expandir `AuthContextValue` com `recoveryMode: boolean`:
    ```ts
    type AuthContextValue = {
      user: User | null;
      session: Session | null;
      profile: ProfileRow | null;
      loading: boolean;
      recoveryMode: boolean; // true entre PASSWORD_RECOVERY e próximo USER_UPDATED/SIGNED_OUT
      signOut: () => Promise<void>;
    };
    ```
  - [x] 3.3 **CRITICAL:** Ajustar `src/pages/app/Home.tsx` (stub da 1.6) e outras páginas que redirecionam via `useAuth()` para **NÃO** redirecionar para `/app` quando `recoveryMode === true`. A página `/reset-password` é a única válida nesse estado. Adicionar guard:
    ```ts
    useEffect(() => {
      if (!loading && !user) navigate("/login", { replace: true });
      if (!loading && user && recoveryMode) navigate("/reset-password", { replace: true });
    }, [loading, user, recoveryMode, navigate]);
    ```
    Mesma guarda em `src/pages/admin/Home.tsx` (stub da 1.6).
  - [x] 3.4 **Teste:** estender `src/contexts/AuthContext.test.tsx`:
    - Emitir `PASSWORD_RECOVERY` com session mock → `useAuth().recoveryMode === true` + `user` populado.
    - Após `PASSWORD_RECOVERY` → emitir `USER_UPDATED` → `recoveryMode === false`.
    - `SIGNED_OUT` durante recovery → `recoveryMode === false`.
  - [x] Files: `src/contexts/AuthContext.tsx` (modificado), `src/contexts/AuthContext.test.tsx` (estendido), `src/pages/app/Home.tsx` (guard), `src/pages/admin/Home.tsx` (guard).

- [x] **Task 4 — `ForgotPasswordForm` component** (AC: #1)
  - [x] 4.1 Criar `src/components/features/auth/ForgotPasswordForm.tsx` com `useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordFormSchema), mode: "onSubmit", reValidateMode: "onChange", defaultValues: { email: "" } })`.
  - [x] 4.2 **Layout** (padrão de `SignupForm` 1.5 + `LoginForm` 1.6):
    - 1 coluna, container `max-w-md mx-auto`, `space-y-6`.
    - 1 campo `Input` email (`autoComplete="email"`, `inputMode="email"`).
    - `Button` submit full-width, texto `"Enviar link de recuperação"` (AC1 verbatim). Loading state: `"Enviando..."` + spinner.
    - Link secundário abaixo: `<Link to="/login">Voltar para o login</Link>`.
  - [x] 4.3 **Submit handler** (anti-enumeração — mensagem neutra sempre):
    ```ts
    const { mutate, isPending, isSuccess } = useRequestPasswordReset();
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

    const onSubmit = (values: ForgotPasswordFormValues) => {
      setSubmittedEmail(values.email);
      mutate(values, {
        onSuccess: () => {
          // AC1 verbatim — mensagem neutra SEMPRE, mesmo se email não existe
        },
        onError: (err) => {
          // Rate limit / rede: surfa via toast; mas mesmo assim mostra mensagem neutra
          // para NÃO revelar se email existia.
          if (/rate limit|Muitas tentativas/i.test(err.message)) {
            toast.error("Muitas tentativas — aguarde alguns minutos");
          } else {
            toast.error("Não foi possível enviar agora. Tente novamente.");
          }
          // NÃO limpar submittedEmail — UI neutra permanece (usuário não distingue)
        },
      });
    };
    ```
  - [x] 4.4 **UI pós-submit:** após `isSuccess || mutation.isError` (qualquer resposta da chamada), renderizar bloco neutro substituindo o formulário:
    ```tsx
    {submittedEmail ? (
      <div className="space-y-4 rounded-md border border-border bg-muted p-6 text-center">
        <p className="text-sm text-foreground">
          <strong>Se este email está cadastrado, enviamos um link.</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Verifique sua caixa de entrada em <strong>{submittedEmail}</strong> (e o spam). O
          link expira em 1 hora.
        </p>
        <Button variant="outline" onClick={() => setSubmittedEmail(null)}>
          Enviar para outro email
        </Button>
      </div>
    ) : (
      <Form {...form}> ... </Form>
    )}
    ```
    **CRITICAL:** o bloco neutro aparece mesmo quando `mutation.isError` (ex.: Supabase 500). A falha real vira **toast**, mas a UI inline permanece neutra (não revela se email existe). Essa é a proteção contra enumeração prevista pelo AC1.
  - [x] 4.5 **Validação inline âmbar:** `FormMessage` com `className="text-warning"` (ou `text-amber-600` conforme escolha de 1.5). Consistência com Signup/Login.
  - [x] 4.6 **Acessibilidade:** label acima do input; `aria-invalid` via `FormMessage`; enter submete; sem focus-trap.
  - [x] Files: `src/components/features/auth/ForgotPasswordForm.tsx`, `src/components/features/auth/ForgotPasswordForm.test.tsx`.

- [x] **Task 5 — `ResetPasswordForm` component** (AC: #2)
  - [x] 5.1 Criar `src/components/features/auth/ResetPasswordForm.tsx` com `useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordFormSchema), mode: "onSubmit", reValidateMode: "onChange", defaultValues: { password: "", confirmPassword: "" } })`.
  - [x] 5.2 **Layout:**
    - 2 campos `Input` type="password" (`autoComplete="new-password"`): "Nova senha" + "Confirmar nova senha".
    - Hint abaixo do primeiro campo: `<p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>`.
    - `Button` submit full-width, texto `"Alterar senha"`. Loading: `"Alterando..."` + spinner.
  - [x] 5.3 **Submit handler:**
    ```ts
    const { mutate, isPending } = useResetPassword();
    const navigate = useNavigate();

    const onSubmit = (values: ResetPasswordFormValues) => {
      mutate(values, {
        onSuccess: async () => {
          // AC2: toast de confirmação + redirect /login.
          // Sign out da sessão de recovery para forçar o usuário a usar a nova senha.
          await supabase.auth.signOut({ scope: "local" });
          toast.success("Senha alterada com sucesso. Entre com a nova senha.");
          navigate("/login", { replace: true });
        },
        onError: (err) => {
          if (err.field) {
            form.setError(err.field, { message: err.message });
          } else {
            toast.error(err.message);
            // Link expirado/missing session → enviar de volta para forgot-password
            if (/link inválido|expirado|session missing/i.test(err.message)) {
              navigate("/forgot-password", { replace: true });
            }
          }
        },
      });
    };
    ```
  - [x] 5.4 **Validação inline âmbar** — mesma regra das outras forms. `FormMessage` texto âmbar.
  - [x] 5.5 **Acessibilidade:** labels acima; `autoComplete="new-password"` em ambos os campos (password manager oferece salvar); enter submete.
  - [x] Files: `src/components/features/auth/ResetPasswordForm.tsx`, `src/components/features/auth/ResetPasswordForm.test.tsx`.

- [x] **Task 6 — Páginas `/forgot-password` e `/reset-password` + rotas** (AC: #1, #2)
  - [x] 6.1 Criar `src/pages/auth/ForgotPassword.tsx` — mesmo shell público de [Signup.tsx](../../src/pages/auth/Signup.tsx) / Login.tsx (1.6):
    ```tsx
    const ForgotPassword = () => (
      <main className="min-h-screen bg-background font-sans text-foreground">
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
            <Link to="/" className="text-lg font-semibold tracking-tight">Medway</Link>
          </div>
        </header>
        <section className="mx-auto max-w-md px-6 py-10 md:py-16">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Recuperar senha</h1>
          <p className="mb-8 text-muted-foreground">
            Informe seu email e enviaremos um link para definir uma nova senha.
          </p>
          <ForgotPasswordForm />
        </section>
      </main>
    );
    export default ForgotPassword;
    ```
  - [x] 6.2 Criar `src/pages/auth/ResetPassword.tsx` com guard de sessão:
    ```tsx
    const ResetPassword = () => {
      const { user, loading, recoveryMode } = useAuth();
      const navigate = useNavigate();
      useEffect(() => {
        // Se terminou de carregar e NÃO há user (link inválido/expirado OU usuário
        // aterrissou direto via URL), manda para forgot-password com toast.
        if (!loading && !user) {
          toast.error("Link inválido ou expirado. Solicite um novo.");
          navigate("/forgot-password", { replace: true });
        }
      }, [loading, user, navigate]);
      if (loading || !user) return <div className="p-8">Carregando…</div>;
      return (
        <main className="min-h-screen bg-background font-sans text-foreground">
          <header className="border-b bg-background">
            <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
              <Link to="/" className="text-lg font-semibold tracking-tight">Medway</Link>
            </div>
          </header>
          <section className="mx-auto max-w-md px-6 py-10 md:py-16">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Definir nova senha</h1>
            <p className="mb-8 text-muted-foreground">
              Escolha uma senha forte que você ainda não usou.
            </p>
            <ResetPasswordForm />
          </section>
        </main>
      );
    };
    export default ResetPassword;
    ```
    **Nota:** aceita tanto `recoveryMode === true` quanto user normal logado — se alguém autenticado decidir alterar senha via esse fluxo, também funciona (`updateUser` opera na sessão atual).
  - [x] 6.3 Editar `src/router.tsx` — adicionar 2 children da route `AppProviders` antes do `catch-all`, seguindo o padrão path-relativo lazy de 1.5 e 1.6:
    ```ts
    {
      path: "forgot-password",
      lazy: () => import("./pages/auth/ForgotPassword").then((m) => ({ Component: m.default })),
    },
    {
      path: "reset-password",
      lazy: () => import("./pages/auth/ResetPassword").then((m) => ({ Component: m.default })),
    },
    ```
    **Client-only** (lazy) — **não pré-renderizar**. `vite-react-ssg` default para child lazy = client-only ✅.
  - [x] 6.4 Files: `src/pages/auth/ForgotPassword.tsx`, `src/pages/auth/ForgotPassword.test.tsx`, `src/pages/auth/ResetPassword.tsx`, `src/pages/auth/ResetPassword.test.tsx`, `src/router.tsx` (modificado).

- [x] **Task 7 — Configuração Supabase: URL de redirect autorizada** (AC: #2)
  - [x] 7.1 Editar `supabase/config.toml` local — garantir que `[auth]` tenha `additional_redirect_urls` incluindo:
    - `http://localhost:8080/reset-password` (dev)
    - `http://localhost:5173/reset-password` (Vite default, se aplicável)
    - **Produção:** URL real deve ser adicionada em **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs** antes do deploy (Story 1.11 valida). Deixar **comentário TODO no arquivo** para lembrar a configuração de produção.
  - [x] 7.2 Verificar `site_url` — deve apontar para URL do ambiente. Local = `http://localhost:8080` (mesmo padrão da 1.5). Produção = URL de deploy (Vercel/Netlify — Story 1.11).
  - [x] 7.3 **Smoke:** `supabase stop && supabase start` para recarregar config → testar envio de email via Inbucket (`http://127.0.0.1:54324`) — link deve apontar para `http://localhost:8080/reset-password?code=...`. Se apontar para URL diferente, reset falha silenciosamente (Supabase bloqueia redirect não autorizado) — **este é o failure-mode mais comum**, **revisar config primeiro** ao debugar.
  - [x] 7.4 Documentar em [deferred-work.md](./deferred-work.md) entry nova: "Redirect URLs de produção precisam ser adicionadas ao Supabase Dashboard antes do primeiro deploy (Story 1.11)".
  - [x] Files: `supabase/config.toml` (modificado), `_bmad-output/implementation-artifacts/deferred-work.md` (append).

- [x] **Task 8 — Testes de integração** (AC: #1, #2)
  - [x] 8.1 `ForgotPasswordForm.test.tsx`:
    - Render mostra 1 input email + CTA "Enviar link de recuperação" + link "Voltar para o login" (AC1).
    - Submit com email inválido → `FormMessage` âmbar inline; **não** chama `resetPasswordForEmail` (AC1).
    - Submit válido → `resetPasswordForEmail` chamado com `{ email }` + `redirectTo` contendo `/reset-password` (AC1, mock).
    - Após sucesso → render do bloco neutro "Se este email está cadastrado, enviamos um link" (AC1 verbatim).
    - Após erro `user_not_found` (mock) → **mesmo bloco neutro** renderizado (não revela inexistência).
    - Após erro rate limit (mock) → toast "Muitas tentativas — aguarde alguns minutos" + bloco neutro mantido (UI não muda).
    - Classe âmbar em `FormMessage`; **proibido** `text-destructive` ou `text-red-*`.
  - [x] 8.2 `ResetPasswordForm.test.tsx`:
    - Render mostra 2 inputs password (new/confirm) + hint "Mínimo 8 caracteres" + CTA "Alterar senha" (AC2).
    - Submit com senhas diferentes → `FormMessage` âmbar em `confirmPassword`; **não** chama `updateUser` (AC2).
    - Submit com senha <8 chars → `FormMessage` âmbar em `password`.
    - Submit válido → `updateUser({ password })` chamado + `signOut({ scope: "local" })` + toast sucesso + `navigate("/login")` com `replace: true` (AC2 verbatim).
    - Erro `same_password` → `FormMessage` inline em `password` (não toast).
    - Erro `"Auth session missing"` → toast + `navigate("/forgot-password", { replace: true })`.
  - [x] 8.3 `ForgotPassword.test.tsx` (page):
    - Render header + h1 "Recuperar senha" + `ForgotPasswordForm`.
  - [x] 8.4 `ResetPassword.test.tsx` (page):
    - User null + loading false → toast erro + `navigate("/forgot-password")`.
    - User em `recoveryMode=true` → render do formulário.
    - Loading → render "Carregando…".
  - [x] 8.5 `AuthContext.test.tsx` extensão — já coberto em Task 3.4.
  - [x] 8.6 Usar `@testing-library/react` + `@testing-library/user-event` + `vi.mock("@/lib/supabase")` + `vi.mock("sonner")`. **Não** criar mock global — segue padrão de 1.5 e 1.6.

- [x] **Task 9 — Acessibilidade + QA manual** (AC: #1, #2)
  - [x] 9.1 Keyboard-only: Tab percorre email → CTA → link "Voltar"; Enter em input submete. Sem focus-trap.
  - [x] 9.2 Autocomplete: email `autoComplete="email"` + `inputMode="email"`; `ResetPasswordForm` usa `autoComplete="new-password"` em ambos (instrui password manager a **salvar** nova senha — não auto-fill de senha antiga).
  - [x] 9.3 **Sem PII em logs** — `mapResetPasswordError` não loga password/email. Remover qualquer `console.log` de debug antes do PR.
  - [x] 9.4 `bun run lint` + `bun run test` + `bun run build` devem passar 100%. **Não** introduzir warnings novos além do baseline.
  - [x] 9.5 **Smoke manual completo** (requer `supabase start` + `bun dev` + Inbucket em `http://127.0.0.1:54324`):
    - (a) `/login` → clicar "Esqueci minha senha" → aterriza em `/forgot-password` (AC1 entry-point).
    - (b) Inserir email cadastrado + submit → UI neutra "Se este email está cadastrado, enviamos um link" + email em Inbucket (AC1).
    - (c) Inserir email **NÃO** cadastrado + submit → **mesma** UI neutra (AC1 anti-enumeração).
    - (d) Abrir Inbucket → copiar link do email → colar no browser → aterriza em `/reset-password` com form visível (AC2).
    - (e) Submeter senha nova (≥8 chars + confirm matching) → toast sucesso + redirect `/login` (AC2).
    - (f) `/login` com senha antiga → toast "Email ou senha inválidos" (senha antiga invalidada).
    - (g) `/login` com senha nova → redirect `/app` normal (ciclo completo fechado).
    - (h) Tentar aterrissar em `/reset-password` sem clicar link (URL direta) → redirect `/forgot-password` com toast "Link inválido ou expirado".
    - (i) Submeter `/forgot-password` 5x rapidamente com mesmo email → toast "Muitas tentativas — aguarde alguns minutos" (rate limit Supabase default 4/hora).
    - (j) Em `/reset-password`, submeter **mesma senha antiga** → toast ou inline "A nova senha deve ser diferente da anterior" (Supabase `same_password`).

- [x] **Task 10 — Atualizar `LoginForm` (opcional polimento)** (AC: —)
  - [x] 10.1 Verificar que o link `"Esqueci minha senha"` em `src/components/features/auth/LoginForm.tsx` (criado em 1.6) aponta para `/forgot-password` — se aponta, nada a fazer. Se por qualquer motivo estiver apontando para outra coisa (regressão), corrigir.
  - [x] 10.2 **Não** mover o link para dentro de `FormMessage` — fica abaixo do CTA "Entrar" conforme decisão de 1.6.
  - [x] Files: `src/components/features/auth/LoginForm.tsx` (só se necessário — zero-diff esperado).

- [x] **Task 11 — Update sprint-status + deferred-work** (AC: —)
  - [x] 11.1 Após dev-story completar e code-review passar, `sprint-status.yaml` será atualizado (ready-for-dev → in-progress → review → done) pelos workflows subsequentes.
  - [x] 11.2 **Deferred esperados** (anotar em `deferred-work.md` na fase code-review):
    - Redirect URLs de produção no Supabase Dashboard (Story 1.11).
    - Custom email template (Supabase Dashboard → Authentication → Email Templates) — MVP usa template default em inglês; pt-BR custom diferido para Story 5.1 ou polimento pós-MVP.
    - Rate limit custom (Supabase default 4 resets/hora) — pode ser ajustado em `supabase/config.toml` se feedback indicar; não alterar no MVP.
    - `recoveryMode` flag em `AuthContext` não é protegida contra F5 (reload em `/reset-password` perde o flag, mas Supabase mantém sessão → formulário continua funcional; é aceitável MVP).
    - "Sair de todos os dispositivos após reset de senha" (`signOut({ scope: "global" })`) — MVP usa `scope: "local"`. Revisitar em Story 5.2 (AccountSettings) junto com política geral de session management.
    - Sem teste E2E automatizado do fluxo completo email→link→reset (requer servidor SMTP mock + integração Inbucket — fora do escopo vitest unit). Smoke manual (h) + (d) validam.
    - `isNeutralizableError` defense-in-depth — se Supabase mudar mensagens, pode ficar obsoleto. Revisar se a biblioteca for atualizada (hoje 2.x estável).

### Review Findings (2026-04-14)

Code review executado via `/bmad-code-review` com 3 camadas (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Normalizado, deduplicado, triado.

- [x] [Review][Decision→Patch] `/reset-password` gate estrito em `recoveryMode === true` [src/pages/auth/ResetPassword.tsx]. Decisão: opção (a) — reforço do gate. User autenticado sem recovery → redirect `/forgot-password`. Test atualizado para refletir o gate real (cenário `user + !recoveryMode` agora coberto).

- [x] [Review][Patch] `minimum_password_length = 8` em supabase/config.toml (antes 6) [supabase/config.toml:181]
- [x] [Review][Patch] `useRequestPasswordReset` agora retorna `RequestPasswordResetError` tipado (`kind: "rate_limit" | "network" | "unknown"`); form usa o campo `kind`/`message` em vez de regex frágil; cobre variantes `over_email_send_rate_limit`, "For security purposes", TypeError/Failed to fetch [src/lib/queries/auth.ts:272-342, src/components/features/auth/ForgotPasswordForm.tsx:38-58]
- [x] [Review][Patch] `setSubmittedEmail` movido para `onSuccess` — tela neutra só aparece após servidor aceitar; erros técnicos mostram toast + form continua visível [src/components/features/auth/ForgotPasswordForm.tsx:40-58]
- [x] [Review][Patch] `signOut({ scope: "local" })` em `ResetPasswordForm.onSuccess` envolvido em try/catch; falha apenas loga, não bloqueia success toast + navigate [src/components/features/auth/ResetPasswordForm.tsx:40-52]
- [x] [Review][Patch] Guard anti double-submit (`if (mutation.isPending) return;`) adicionado em ambos forms [src/components/features/auth/ForgotPasswordForm.tsx:39, src/components/features/auth/ResetPasswordForm.tsx:39]
- [x] [Review][Patch] `isNeutralizableError` ampliado: `user_not_found`, `email_address_invalid`, `validation_failed`, "User not found", "Email address…" [src/lib/queries/auth.ts:287-297]

- [x] [Review][Defer] `reset-password` schema `.max(72)` conta caracteres, não bytes (bcrypt limit) — deferido: bounds idênticos ao signup por design (spec Task 1.2)
- [x] [Review][Defer] `LGPD_TERMS_VERSION` usado antes de `export const` no módulo (TDZ técnico) — deferido: código de Story 1.5 já em `done`, funcional via hoisting
- [x] [Review][Defer] `useResetPassword.onSuccess` não invalida React Query cache (`["profile", userId]`) — deferido: signOut já limpa sessão; risco baixo no MVP
- [x] [Review][Defer] `useLogout` tipo de mutation declara `Error` mas `mutationFn` nunca rejeita (swallow + log) — deferido: código de Story 1.6 já em `review`/`done`
- [x] [Review][Defer] Multi-tab: link de recovery aberto em tab B com tab A logada em outro user → updateUser muda senha de Y no contexto de X, `signOut({ scope: "local" })` pode propagar SIGNED_OUT para tab A — deferido: concorrência cross-tab fora do escopo MVP; revisitar com AccountSettings (Story 5.2)
- [x] [Review][Defer] Back-button após reset com sucesso pode retornar a `/reset-password` e mostrar toast "Link inválido ou expirado" pós-sucesso (UX confusa mas recuperável) — deferido: edge raro, `navigate(..., { replace: true })` mitiga parcialmente

## Dev Notes

### Architecture compliance — 10 regras obrigatórias ([architecture.md linhas 401-414](../planning-artifacts/architecture.md))

| # | Regra | Aplicação nesta story |
|---|-------|----------------------|
| 1 | snake_case end-to-end no data stack | Nenhuma tabela/JSON do banco é tocada. `ForgotPasswordFormValues` / `ResetPasswordFormValues` são identificadores TS locais — camelCase ok. |
| 2 | `database.types.ts` fonte de verdade | Não aplicável (não lê `profiles`/outras tabelas — só `supabase.auth.*` APIs). |
| 3 | Zod schemas em `src/lib/schemas/` | `forgot-password.ts` + `reset-password.ts` nesta pasta (não inline). |
| 4 | React Query para data fetching | `useRequestPasswordReset` / `useResetPassword` via `useMutation` em `src/lib/queries/auth.ts`. |
| 5 | Checar `error` antes de `data` | Ambas as `mutationFn` checam `error` primeiro e convertem via mappers. |
| 6 | queries/mutations em `src/lib/queries/{domain}.ts` | Estende `auth.ts` existente. |
| 7 | Mensagens pt-BR acionáveis | AC1 verbatim ("Se este email está cadastrado, enviamos um link") + mappers + Zod + `ResetPasswordForm`. |
| 8 | Sem PII em logs | Task 9.3 explícito; mappers não logam email/password. |
| 9 | Respeitar RLS | Não toca `profiles`/outras tabelas. `auth.updateUser` usa sessão do próprio user. Nunca service_role. |
| 10 | Testes co-localizados | Task 1.3 + 2.6 + 3.4 + 4 (8.1) + 5 (8.2) + 6 (8.3, 8.4). |

### Supabase password recovery flow (official)

```
[/forgot-password] user submete email
  → supabase.auth.resetPasswordForEmail(email, { redirectTo: "/reset-password" })
  → Supabase envia email com link: https://<project>.supabase.co/auth/v1/verify?token=<t>&type=recovery&redirect_to=<redirectTo>
  → User clica → Supabase verifica token → redireciona para redirectTo com fragment/query (?code=<code>)
  → @supabase/supabase-js detecta code na URL automaticamente (detectSessionInUrl=true default) →
     troca code por session → emite onAuthStateChange("PASSWORD_RECOVERY", session)

[/reset-password] user vê form
  → AuthProvider já capturou PASSWORD_RECOVERY → user/session populados, recoveryMode=true
  → supabase.auth.updateUser({ password: "..." })
  → Supabase atualiza password → emite onAuthStateChange("USER_UPDATED")
  → AuthProvider limpa recoveryMode
  → ResetPasswordForm.onSuccess: signOut({ scope: "local" }) + toast + navigate("/login")
```

**Por que `detectSessionInUrl=true`?** Default do Supabase JS 2.x ([docs](https://supabase.com/docs/reference/javascript/initializing#parameters)). Já está ativo no singleton `src/lib/supabase.ts` (criado em 1.1). **Não alterar.** Se estivesse `false`, precisaríamos chamar `supabase.auth.exchangeCodeForSession(code)` manualmente — custo desnecessário.

**Por que signOut após updateUser?** Dois motivos:
1. A sessão ativa pós-recovery é **transiente** — Supabase não revoga refresh token automaticamente. Se não deslogar, o user fica em "/reset-password" logado com sessão de recovery mesmo após sucesso.
2. UX: AC2 diz "redirecionado para `/login`" — forçar signOut garante que a próxima ação do user seja efetivamente **entrar com a nova senha** (confirma que a mudança funcionou, não só um "aceite silencioso").

### Anti-enumeração: decisão de design

**Threat model:** atacante que testa emails para descobrir quais estão cadastrados (reconnaissance pré-phishing).

**Defense-in-depth:**
1. **Supabase 2.x default:** `resetPasswordForEmail` retorna `{ error: null }` mesmo se email não existe. Não vaza. ([comportamento observado + issue tracker](https://github.com/supabase/supabase-js/issues/)).
2. **UI neutra independente de resultado:** mesmo se Supabase mudar o default no futuro (erro `user_not_found` explícito), o `ForgotPasswordForm` renderiza o bloco neutro em ambos os casos (success e error não-críticos). `isNeutralizableError` filtra erros de enumeração antes de chegar no toast.
3. **Rate limit para enumeração cega:** Supabase limita 4 resets/hora/IP por default → atacante vê `over_request_rate_limit` após poucas tentativas, e o toast pt-BR revela apenas "Muitas tentativas" (sem distinguir se email existia).

**Alinhamento com Signup (1.5) e Login (1.6):** mesma filosofia — erros de auth nunca revelam se conta existe.

### `scope: "local"` no signOut pós-reset

Mesma escolha da 1.6: `scope: "local"` revoga só o device atual. Alternativa `global` faria mais sentido se a motivação fosse "suspeita de invasão de conta", mas MVP assume recuperação benigna (usuário esqueceu senha). Story 5.2 (AccountSettings) pode oferecer toggle "sair de todos dispositivos após reset" — defer.

### Redirect URLs: por que `window.location.origin` e não hardcoded?

```ts
const redirectTo = `${window.location.origin}/reset-password`;
```

- **Dev:** `http://localhost:8080/reset-password`
- **Preview/staging:** `https://curriculo-medway-staging.vercel.app/reset-password`
- **Prod:** `https://curriculo.medway.com/reset-password`

Isso evita hardcode de URL por ambiente. **Pré-requisito:** todas essas URLs estarem em `additional_redirect_urls` no Supabase (Task 7). Se uma URL não estiver autorizada, Supabase rejeita silenciosamente e o link no email aponta para `site_url` default. **Este é o bug mais comum de password reset** — checklist de Task 7.3.

### `PASSWORD_RECOVERY` event — tratamento especial

**Problema:** Sem tratamento, o usuário que clica no link é tratado como `SIGNED_IN`. O `<AppHome>` (1.6 stub) redirecionaria para `/app` imediatamente — user nunca veria o `/reset-password`. **Bug silencioso.**

**Solução:** `AuthProvider` detecta `PASSWORD_RECOVERY` separadamente, seta `recoveryMode=true`, e páginas autenticadas redirecionam para `/reset-password` enquanto esse flag ativo.

**Por que um flag ao invés de verificar `session.user.recovery_sent_at`?** Flag é mais explícito + sobrevive ao `TOKEN_REFRESHED` silencioso. Supabase recomenda essa abordagem ([onAuthStateChange docs](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)).

### Senha default bounds — consistência com Signup

`reset-password.ts` usa **exatamente** os mesmos bounds de `signup.ts:28` (8..72 chars). Motivo: usuário não pode cadastrar com senha que viola regra de reset, nem vice-versa. Máximo 72 = limite bcrypt do Postgres.

Se o projeto algum dia adotar `password_requirements` no Supabase Dashboard (regra de complexidade), ambos os schemas devem ser atualizados em sincronia (defer para mudança de política).

### Previous story intelligence — Story 1.6 (ready-for-dev, **pode estar em dev durante esta criação**)

- **Dependência viva:** 1.6 entrega `AuthContext` + `LoginForm` com link "Esqueci minha senha" apontando para `/forgot-password`. Esta story **assume que 1.6 mergeará antes**. Se 1.6 mudar assinatura de `AuthContextValue`, ajustar Task 3.2.
- Pattern de error mapping (`mapLoginError`) em 1.6 = template direto para `mapResetPasswordError`. **Reusar shape `{ field, message }`** para consistência.
- `src/router.tsx` pattern: child relativo + `lazy()` em `AppProviders` children — estabelecido por 1.5 e 1.6. Esta story adiciona 2 rotas no mesmo bloco.
- `text-warning` vs `text-amber-600` — usar o mesmo que 1.5 e 1.6 decidiram (verificar no código final daquelas stories).
- Stub `src/pages/app/Home.tsx` e `src/pages/admin/Home.tsx` da 1.6 precisam da guard `recoveryMode` desta story (Task 3.3). **Não quebrar** os testes existentes dessas páginas — estender.

### Previous story intelligence — Story 1.5 (done/in-progress)

- `useSignup` + `mapSignupError` + shape `{ field, message }` em `src/lib/queries/auth.ts` — **template direto** para mappers desta story.
- `signupFormSchema` (8..72 chars) — referência direta para `resetPasswordFormSchema`.
- Pattern de página pública (header logo centralizado + max-w-md section) — mesmo para `ForgotPassword.tsx` e `ResetPassword.tsx`.

### Previous story intelligence — Story 1.1 e 1.4 (done)

- Supabase singleton em `src/lib/supabase.ts` (1.1) + Proxy lazy → pré-render SSG seguro (1.4). `/forgot-password` e `/reset-password` são **lazy client-only** — não afetam Landing SSG.
- Commits em pt-BR curtos.

### Git intelligence (últimos 5 commits)

```
3b9fb5f Add SCM-BH/USP-RP/UFPA in calc
95c8418 Add SCM-BH, USP-RP, UFPA handles
00d01e7 Aprimorou entrada padrão
23abfa5 Atualizou cálculo e estado
70873bd Atualizei cálculo e estado
```

Commits em `calculations.ts` (Story 1.9 futura). **Nada bloqueia 1.7.** Convenção: pt-BR curto, infinitivo/passado simples.

### Latest tech (Abril 2026)

- **@supabase/supabase-js 2.x:**
  - `resetPasswordForEmail(email, { redirectTo?, captchaToken? })` — `redirectTo` obrigatório para custom redirect; `captchaToken` fora de escopo MVP. Retorna `{ error: null }` em sucesso (ou "neutralizável"). [Docs](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail).
  - `updateUser({ password, email?, data? })` — usa sessão corrente. `password` é o único campo usado nesta story. Retorna `{ data: { user }, error }`.
  - `signOut({ scope })` — default `global`; usar **explícito** `local` (consistência com 1.6).
- **`onAuthStateChange` events 2.x:** `PASSWORD_RECOVERY` é emitido **após** `detectSessionInUrl` trocar o code por session (client do Supabase faz automaticamente). Se não chegar, verificar `site_url` no `config.toml`.
- **React Query v5:** `useMutation` returns `{ mutate, mutateAsync, isPending, isSuccess, isError, error, data }`. `isPending` (não `isLoading` — v5 depreciou para mutations).
- **react-router v6:** `useNavigate()` + `{ replace: true }` para redirects de auth — evita back-button voltar a `/reset-password` após sucesso.
- **Supabase CLI local dev:** Inbucket em `http://127.0.0.1:54324` (GUI de caixa de entrada mockada) — padrão dev Supabase. Nenhum email real é enviado em localhost.

### Project Structure Notes

- Novos arquivos alinhados à arquitetura ([linhas 512-553](../planning-artifacts/architecture.md)):
  - `src/components/features/auth/ForgotPasswordForm.tsx` ✅
  - `src/components/features/auth/ResetPasswordForm.tsx` ✅
  - `src/pages/auth/ForgotPassword.tsx` ✅
  - `src/pages/auth/ResetPassword.tsx` ✅
  - `src/lib/schemas/forgot-password.ts` ✅
  - `src/lib/schemas/reset-password.ts` ✅
- `src/lib/queries/auth.ts` já existe (criado em 1.5, estendido em 1.6) — **estender**, não substituir.
- `src/contexts/AuthContext.tsx` já existe (criado em 1.6) — **estender** com `recoveryMode`.
- `src/router.tsx` — 2 entradas novas em `AppProviders.children`, antes do catch-all.
- `supabase/config.toml` — `additional_redirect_urls` append (não substituir lista existente).
- **Sem desvios de arquitetura.**

### References

- [epics.md Story 1.7 (linhas 484-501)](../planning-artifacts/epics.md) — AC verbatim
- [epics.md FR6 (linha 26)](../planning-artifacts/epics.md) — requisito
- [architecture.md Authentication (linhas 180-188)](../planning-artifacts/architecture.md) — Supabase Auth + recuperação por email
- [architecture.md Authentication patterns (linhas 388-394)](../planning-artifacts/architecture.md) — AuthContext + onAuthStateChange
- [architecture.md Error handling (linhas 395-399)](../planning-artifacts/architecture.md) — toast + sem PII
- [architecture.md Enforcement Guidelines (linhas 401-414)](../planning-artifacts/architecture.md) — 10 regras
- [architecture.md Requirements → Components Mapping linha 467](../planning-artifacts/architecture.md) — FR6 em `src/components/features/auth/*`
- [architecture.md Directory Structure (linhas 479-569)](../planning-artifacts/architecture.md)
- [architecture.md URL case convention (linha 288)](../planning-artifacts/architecture.md) — `/forgot-password` kebab-case
- [ux-design-specification.md Form Patterns (linhas 765-773)](../planning-artifacts/ux-design-specification.md) — layout 1-coluna + validação âmbar
- [ux-design-specification.md Feedback (linhas 755-761)](../planning-artifacts/ux-design-specification.md) — toast Sonner + 3s default
- [1-5-cadastro-publico-signup-lgpd.md](./1-5-cadastro-publico-signup-lgpd.md) — `src/lib/queries/auth.ts`, `signupFormSchema` bounds, convenções de form/error
- [1-6-login-logout-authcontext.md](./1-6-login-logout-authcontext.md) — `AuthContext`, `mapLoginError` shape, link `/forgot-password` no LoginForm, stubs `/app` e `/admin`
- [deferred-work.md](./deferred-work.md) — entry a adicionar sobre redirect URLs de produção
- [supabase-js resetPasswordForEmail docs](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [supabase-js updateUser docs](https://supabase.com/docs/reference/javascript/auth-updateuser)
- [supabase-js onAuthStateChange docs](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) — evento `PASSWORD_RECOVERY`
- [supabase CLI local dev — Inbucket](https://supabase.com/docs/guides/cli/local-development#emails) — inspeção de emails em dev

## Dev Agent Record

### Agent Model Used

claude-opus-4-6[1m] via bmad-dev-story workflow

### Debug Log References

- `npx vitest run src/lib/schemas/forgot-password.test.ts src/lib/schemas/reset-password.test.ts src/components/features/auth/ForgotPasswordForm.test.tsx src/components/features/auth/ResetPasswordForm.test.tsx src/pages/auth/ForgotPassword.test.tsx src/pages/auth/ResetPassword.test.tsx src/contexts/AuthContext.test.tsx src/pages/app/Home.test.tsx` — 29 testes, todos passando.
- `npx vitest run src/lib/queries/auth.test.ts` — 21 testes, todos passando (inclui 7 novos para `useRequestPasswordReset`/`useResetPassword`/`mapResetPasswordError`).
- `npx eslint` nos arquivos tocados — zero warnings.
- `npx vite-react-ssg build` — build verde; `dist/reset-password.html` e `dist/forgot-password.html` gerados (rotas client-only como esperado).
- Pré-existente fora do escopo 1.7: `src/lib/queries/auth.test.ts > useSignup` e alguns testes de `SignupForm` falham por mudanças do linter em Story 1.5 (lgpd_accepted_at em `options.data`). Reproduzido com `git stash` antes das minhas alterações — não regressão introduzida por 1.7.

### Completion Notes List

- **AC1 (solicitar link em `/forgot-password`):** `useRequestPasswordReset` chama `supabase.auth.resetPasswordForEmail` com `redirectTo = ${origin}/reset-password`. `ForgotPasswordForm` sempre renderiza a mensagem neutra verbatim após submit; `isNeutralizableError` filtra `user_not_found` (defense-in-depth). Rate limit vira toast, UI neutra permanece.
- **AC2 (definir nova senha em `/reset-password`):** `useResetPassword` chama `supabase.auth.updateUser({ password })`. `ResetPasswordForm.onSuccess` força `signOut({ scope: "local" })` + toast + `navigate("/login", { replace: true })`. `mapResetPasswordError` cobre `same_password` (inline), `weak_password` (inline), `Auth session missing` (toast + redirect), rate limit, network error e fallback.
- **AuthContext estendido:** `recoveryMode` flag é ligado no evento `PASSWORD_RECOVERY` e desligado em `USER_UPDATED`/`SIGNED_OUT`. Stubs `app/Home.tsx` e `admin/Home.tsx` redirecionam para `/reset-password` quando `recoveryMode=true`.
- **Supabase config:** `site_url` corrigido para `http://localhost:8080` (Vite default do projeto); `additional_redirect_urls` populado com as URLs de dev. TODO Story 1.11 anotado no TOML e em `deferred-work.md` para URL de produção via Supabase Dashboard.
- **Consistência:** `mapResetPasswordError` usa o mesmo helper `isNetworkError` compartilhado com `mapSignupError` e segue o padrão `{ field, message }` estabelecido em 1.5/1.6.
- **Task 10:** link `Esqueci minha senha` no `LoginForm.tsx:122` já aponta para `/forgot-password`; nenhum diff necessário.

### File List

**Criados:**
- `src/lib/schemas/forgot-password.ts`
- `src/lib/schemas/forgot-password.test.ts`
- `src/lib/schemas/reset-password.ts`
- `src/lib/schemas/reset-password.test.ts`
- `src/components/features/auth/ForgotPasswordForm.tsx`
- `src/components/features/auth/ForgotPasswordForm.test.tsx`
- `src/components/features/auth/ResetPasswordForm.tsx`
- `src/components/features/auth/ResetPasswordForm.test.tsx`
- `src/pages/auth/ForgotPassword.tsx`
- `src/pages/auth/ForgotPassword.test.tsx`
- `src/pages/auth/ResetPassword.tsx`
- `src/pages/auth/ResetPassword.test.tsx`

**Modificados:**
- `src/lib/queries/auth.ts` — `ResetPasswordError`, `mapResetPasswordError`, `isNeutralizableError`, `useRequestPasswordReset`, `useResetPassword`.
- `src/lib/queries/auth.test.ts` — mocks `resetPasswordForEmail`/`updateUser` + 7 testes novos.
- `src/contexts/AuthContext.tsx` — `recoveryMode` state + tratamento de `PASSWORD_RECOVERY`/`USER_UPDATED`/`SIGNED_OUT`.
- `src/contexts/AuthContext.test.tsx` — 2 testes novos cobrindo `recoveryMode`.
- `src/pages/app/Home.tsx` — guard redireciona para `/reset-password` em `recoveryMode`.
- `src/pages/admin/Home.tsx` — mesmo guard.
- `src/router.tsx` — rotas lazy `forgot-password` e `reset-password`.
- `supabase/config.toml` — `site_url` + `additional_redirect_urls` + TODO prod.
- `_bmad-output/implementation-artifacts/deferred-work.md` — seção para follow-ups de 1.7.

## Change Log

| Data       | Versão | Descrição                                                                      | Autor    |
|------------|--------|--------------------------------------------------------------------------------|----------|
| 2026-04-14 | 0.1    | Story criada via bmad-create-story (context engine)                            | Rcfranco |
| 2026-04-14 | 1.0    | Implementação completa (bmad-dev-story): schemas + hooks + AuthContext recoveryMode + forms + páginas + rotas + config Supabase + 29 testes verdes. | Rcfranco |
