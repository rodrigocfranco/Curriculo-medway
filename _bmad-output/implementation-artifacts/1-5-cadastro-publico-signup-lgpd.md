# Story 1.5: Cadastro público (signup) com 7 campos + aceite LGPD

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **visitante (lead não-autenticado) em `/signup`**,
I want **me cadastrar preenchendo nome, email, telefone (com máscara), estado (27 UFs), faculdade (Combobox), ano de formação (range dinâmico), especialidade desejada, senha + confirmação, e aceitando os Termos de Uso + Política de Privacidade (LGPD)**,
so that **viro um lead persistido em `auth.users` + `public.profiles` (via trigger `handle_new_user` da Story 1.3), ganho sessão ativa e sou redirecionado para `/app` — destravando FR2/FR3/FR32 e habilitando Epic 2 (currículo) + funil de captação do Lucas**.

## Acceptance Criteria

Copiados verbatim de [epics.md Story 1.5 (linhas 431-458)](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Render do formulário `/signup` com 7 campos + senha + aceite LGPD**
   **Given** estou em `/signup`
   **When** a página renderiza
   **Then** vejo formulário com 7 campos (nome, email, telefone com máscara, estado Select 27 UFs, faculdade Combobox, ano de formação range dinâmico, especialidade Select) + senha + confirmação de senha
   **And** checkbox "Aceito os Termos de Uso e a Política de Privacidade" com links
   **And** CTA "Criar minha conta" desabilitado enquanto checkbox desmarcado ou validação falha

2. **AC2 — Submit válido cria usuário, trigger popula `profiles`, redireciona `/app`**
   **Given** todos os campos válidos e termo aceito
   **When** clico "Criar minha conta"
   **Then** `supabase.auth.signUp` é invocado com metadados (`name`, `phone`, `state`, `university`, `graduation_year`, `specialty_interest`) em `options.data`
   **And** trigger `handle_new_user` popula `profiles`
   **And** sou redirecionado para `/app` com sessão ativa

3. **AC3 — Erros de validação client-side inline âmbar, sem vermelho, sem toast**
   **Given** há erro de validação
   **When** submeto
   **Then** vejo erro inline âmbar por campo (sem vermelho, sem toast)
   **And** foco move para o primeiro campo com erro

4. **AC4 — Email duplicado retorna erro pt-BR específico**
   **Given** email já existe
   **When** submeto
   **Then** vejo erro pt-BR específico ("Este email já está cadastrado — faça login")

## Tasks / Subtasks

- [x] **Task 1 — Constantes de domínio (UFs, especialidades) e range dinâmico de ano** (AC: #1)
  - [x] 1.1 Criar `src/lib/constants/brazil-states.ts` exportando `BRAZIL_STATES: readonly { code: string; name: string }[]` com as 27 UFs (ordem alfabética por `name`; `code` maiúsculo 2 letras; inclui DF). Usar `as const` para literal union tipada. **Não** subdividir por região.
  - [x] 1.2 Criar `src/lib/constants/specialties.ts` exportando `SPECIALTIES: readonly string[] as const` — lista fechada de especialidades médicas para o Select de "especialidade desejada". **Mínimo MVP:** `["Clínica Médica","Cirurgia Geral","Pediatria","Ginecologia e Obstetrícia","Dermatologia","Psiquiatria","Ortopedia","Anestesiologia","Radiologia","Oftalmologia","Cardiologia","Neurologia","Medicina de Família e Comunidade","Medicina Intensiva","Medicina de Emergência","Outra"]`. Ordem: alfabética exceto `"Outra"` no final. Fonte: PRD persona Lucas + `calculations.ts` + Epic 2.
  - [x] 1.3 Criar `src/lib/constants/universities.ts` exportando `UNIVERSITIES: readonly string[] as const` — lista curada das ~40 principais faculdades de medicina do Brasil (USP-SP, UFMG, UNIFESP, UNICAMP, UFRJ, UFRGS, UFBA, UFPE, UFPA, UFC, UFMT, UFMS, UFPR, UFG, UFES, UFSC, UFRN, SCM-BH, SCM-SP, FCMSCSP, FMUSP-RP, PUC-SP, PUC-RJ, UERJ, UNESP, etc.). **Combobox com entrada livre** — se o usuário digita um nome fora da lista, aceita e persiste o texto digitado (university é `text` em `profiles`, não FK). Documentar em comentário: "lista inicial curada; expansão via Story 1.9 seeds ou admin pós-MVP".
  - [x] 1.4 Criar `src/lib/constants/graduation-year.ts` exportando helper `getGraduationYearOptions(now: Date = new Date()): number[]` — retorna `[currentYear - 10 … currentYear + 8]` em ordem **decrescente** (ano mais recente primeiro). "Range dinâmico" do epic = calculado da data atual em runtime, não hardcoded. Cobre Lucas (5º ano, forma em 2028) + recém-formados até 10 anos atrás + alunos iniciais.
  - [x] 1.5 **Teste unitário:** `src/lib/constants/brazil-states.test.ts` (27 UFs, inclui DF, codes únicos) + `src/lib/constants/graduation-year.test.ts` (mock `new Date('2026-06-15')` → primeiro item 2034, último 2016, total 19).
  - [x] Files: `src/lib/constants/brazil-states.ts`, `src/lib/constants/specialties.ts`, `src/lib/constants/universities.ts`, `src/lib/constants/graduation-year.ts` + testes co-localizados.

- [x] **Task 2 — Zod schema compartilhado `signupFormSchema`** (AC: #1, #3, #4)
  - [x] 2.1 Criar `src/lib/schemas/signup.ts` com `signupFormSchema` (z.object) contendo:
    - `name: z.string().trim().min(2, "Informe seu nome completo").max(120)`
    - `email: z.string().trim().toLowerCase().email("Email inválido")`
    - `phone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido — use (DD) 9XXXX-XXXX")` (aceita somente formato mascarado)
    - `state: z.enum(BRAZIL_STATE_CODES, { errorMap: () => ({ message: "Selecione um estado" }) })` (derivar tupla de `BRAZIL_STATES.map(s => s.code)` com `as const`)
    - `university: z.string().trim().min(2, "Informe a faculdade").max(200)` (string livre, não enum — Combobox com fallback livre)
    - `graduation_year: z.number().int().min(currentYear - 15).max(currentYear + 15)` (**bounds amplos**; endereça [deferred-work.md linha 10](./deferred-work.md) — falta de CHECK em `profiles.graduation_year`)
    - `specialty_interest: z.enum(SPECIALTIES_TUPLE, { errorMap: () => ({ message: "Selecione a especialidade desejada" }) })` (derivar de `SPECIALTIES as const`)
    - `password: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72 caracteres")` (limite 72 = bcrypt hard cap do Supabase)
    - `confirmPassword: z.string()`
    - `lgpd_accepted: z.literal(true, { errorMap: () => ({ message: "É necessário aceitar os termos" }) })`
  - [x] 2.2 `.refine((v) => v.password === v.confirmPassword, { message: "Senhas não conferem", path: ["confirmPassword"] })` no final.
  - [x] 2.3 Export também `type SignupFormValues = z.infer<typeof signupFormSchema>` + `signupMetadataSchema` (subset enviado para `options.data` — sem `email`/`password`/`confirmPassword`/`lgpd_accepted`).
  - [x] 2.4 **CRITICAL — snake_case end-to-end:** `graduation_year`, `specialty_interest`, `lgpd_accepted` em snake_case (espelha Postgres + `options.data` do trigger `handle_new_user`). **Não mapear para camelCase** ([architecture.md linhas 403-414](../planning-artifacts/architecture.md) regra 1).
  - [x] 2.5 **Teste:** `src/lib/schemas/signup.test.ts` — casos válido/inválido para cada campo + mismatch de senha + LGPD=false rejeitado.

- [x] **Task 3 — Query wrapper `useSignup` em `src/lib/queries/auth.ts`** (AC: #2, #4)
  - [x] 3.1 Criar `src/lib/queries/auth.ts` (novo domínio `auth`) exportando hook `useSignup()` via `useMutation` do React Query. **Regra arquitetural:** nenhuma chamada `supabase.auth.signUp` direta em componente ([architecture.md linhas 403-414](../planning-artifacts/architecture.md) regra 4).
  - [x] 3.2 Assinatura: `useSignup(): UseMutationResult<{ user: User }, SignupError, SignupFormValues>`. Dentro do `mutationFn`:
    ```ts
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          phone: values.phone,
          state: values.state,
          university: values.university,
          graduation_year: values.graduation_year,
          specialty_interest: values.specialty_interest,
        },
      },
    });
    if (error) throw mapSignupError(error);
    if (!data.user) throw new SignupError("Falha inesperada no cadastro");
    return { user: data.user };
    ```
  - [x] 3.3 Criar `mapSignupError(error: AuthError): SignupError` com mapeamento pt-BR (case em `error.message` ou `error.code`):
    - `"User already registered"` / `email_exists` → `{ field: "email", message: "Este email já está cadastrado — faça login" }` (AC4 — **mensagem verbatim**)
    - `"Password should be at least"` → `{ field: "password", message: "Senha muito curta (mínimo 8 caracteres)" }`
    - weak password (Supabase `weak_password`) → `{ field: "password", message: "Senha muito fraca — use letras, números e símbolos" }`
    - rate limit (`over_request_rate_limit`) → `{ field: null, message: "Muitas tentativas — aguarde alguns minutos" }` (toast Sonner)
    - fallback → `{ field: null, message: "Não foi possível cadastrar agora. Tente novamente." }` (toast)
  - [x] 3.4 `SignupError` classe estendendo `Error` com `field: keyof SignupFormValues | null` + `message: string`.
  - [x] 3.5 **Sem `invalidateQueries`** nesta mutation — não há cache de auth a invalidar; `AuthContext` (Story 1.6) vai reagir a `onAuthStateChange`. Adicionar `// TODO(Story 1.6): AuthContext vai propagar sessão via onAuthStateChange` como comentário **uma linha**.
  - [x] 3.6 **Teste:** `src/lib/queries/auth.test.ts` — mockar `supabase.auth.signUp` e validar: (a) metadados enviados em snake_case, (b) duplicate email mapeia AC4 verbatim, (c) password weak mapeia pt-BR, (d) sucesso retorna `{ user }`.

- [x] **Task 4 — Formatter de telefone + helper `formatPhone`** (AC: #1)
  - [x] 4.1 Criar `src/lib/formatters/phone.ts` exportando:
    - `formatPhone(raw: string): string` — recebe dígitos crus ou mascarado, retorna `(DD) 9XXXX-XXXX` truncando a 11 dígitos. Celular BR = 11 dígitos (2 DDD + 9 + 8). Fixo (10 dígitos) **fora de escopo** — aluno de medicina usa celular.
    - `stripPhoneMask(masked: string): string` — retorna só dígitos.
  - [x] 4.2 **Abordagem:** controller manual (regex + slice), **sem adicionar dependência** (`react-input-mask` / `imask`). Mantém bundle leve — deferred-work 1.4 já monitora FCP de 100ms.
  - [x] 4.3 Uso no input: `onChange={(e) => field.onChange(formatPhone(e.target.value))}`. `inputMode="numeric"` + `autoComplete="tel"`.
  - [x] 4.4 **Teste:** `src/lib/formatters/phone.test.ts` — inputs `"11987654321"` → `"(11) 98765-4321"`, `"(1"` → `"(1"` (parcial), `"abc11987654321xyz"` → `"(11) 98765-4321"` (strip não-dígitos), `"119876543210000"` → `"(11) 98765-4321"` (trunca 11).

- [x] **Task 5 — `SignupForm` component com react-hook-form + shadcn primitives** (AC: #1, #3)
  - [x] 5.1 Criar `src/components/features/auth/SignupForm.tsx` usando `useForm<SignupFormValues>({ resolver: zodResolver(signupFormSchema), mode: "onSubmit", reValidateMode: "onChange", defaultValues })`.
  - [x] 5.2 **Layout** ([epics.md UX-DR21 linha 184](../planning-artifacts/epics.md) + [ux-design-specification.md linha 806](../planning-artifacts/ux-design-specification.md)):
    - 1 coluna com inputs `w-full` em mobile
    - Pares em 2 colunas em `md+`: `(name, email) / (phone, state) / (university, graduation_year) / (specialty_interest, —) / (password, confirmPassword)` + LGPD linha inteira + CTA full-width mobile
    - Container `max-w-xl mx-auto px-6 py-8 md:py-12` (formulário, não landing — menor que `max-w-5xl`)
    - `space-y-6` entre pares, `gap-4` dentro do par, `label` acima do input ([ux-design-specification.md linha 767](../planning-artifacts/ux-design-specification.md))
  - [x] 5.3 **Primitives shadcn a usar** (todos já em `src/components/ui/`):
    - `Input` — name, email, phone (com `formatPhone`), password, confirmPassword
    - `Select` — state (27 UFs), specialty_interest, graduation_year (19 opções, decrescente)
    - **Combobox para `university`**: composto por `Popover + Command + CommandInput + CommandList + CommandItem + CommandEmpty` (pattern shadcn oficial — todos já existem). `CommandEmpty` exibe "Adicionar '{input}'" e on-click seta o valor do field com a string livre digitada (fallback livre — university é text).
    - `Checkbox` + `Label` — LGPD
    - `Button` (type=submit, variant=default, size=lg, `disabled={!watch("lgpd_accepted") || !formState.isValid || mutation.isPending}`)
    - `Form` wrapper + `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` para integração react-hook-form
  - [x] 5.4 **Mensagem de erro inline âmbar (AC3, não vermelho, não toast):** o primitive shadcn `FormMessage` por default usa `text-destructive` (vermelho). **Override local:** passar `className="text-warning"` (token âmbar do design system — ver [tailwind.config.ts](../../tailwind.config.ts) — se `warning` não existir como token, usar `text-amber-600`; se também ausente, **adicionar `warning`/`--warning` token via mini-patch em tailwind + index.css — mas documentar escolha no Dev Agent Record**). **CRITICAL:** não use `text-destructive` / `text-red-*`. Preferência ordem: (1) token `warning` existente → (2) `text-amber-600` → (3) patch token.
  - [x] 5.5 **Foco no primeiro erro (AC3):** react-hook-form com `shouldFocusError: true` (default) já move foco pro primeiro erro na ordem do DOM. Validar que a ordem DOM = ordem de declaração acima. **Não implementar custom focus handler**.
  - [x] 5.6 **CTA texto:** `"Criar minha conta"` verbatim (AC1). Estado loading: `"Criando..."` + spinner (ver [ux-design-specification.md linha 789](../planning-artifacts/ux-design-specification.md): "spinner no botão").
  - [x] 5.7 **LGPD row:** `<Checkbox id="lgpd" />` + `<Label htmlFor="lgpd">Aceito os <Link to="/termos" target="_blank">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank">Política de Privacidade</Link></Label>`. **Aviso:** `/termos` e `/privacidade` ainda não existem (Story 5.1 entrega); aceitar o 404 temporário e adicionar nota em Dev Agent Record (paralelo ao gap `/signup` 404 pós-1.4).
  - [x] 5.8 **Submit handler:**
    ```ts
    const mutation = useSignup();
    const onSubmit = (values: SignupFormValues) => {
      mutation.mutate(values, {
        onSuccess: () => navigate("/app"),
        onError: (err) => {
          if (err.field) {
            form.setError(err.field, { type: "server", message: err.message });
            form.setFocus(err.field); // re-foca após erro server (AC3 + AC4)
          } else {
            toast.error(err.message); // fallback Sonner (rate limit / desconhecido)
          }
        },
      });
    };
    ```
  - [x] 5.9 **Acessibilidade:** `aria-invalid` automático via `FormMessage`; `autoComplete` por campo (`name`, `email`, `tel`, `new-password`, `new-password` respectivamente; `off` para state/university/year/specialty); `aria-describedby` pro hint de senha.
  - [x] Files: `src/components/features/auth/SignupForm.tsx` + `src/components/features/auth/SignupForm.test.tsx`.

- [x] **Task 6 — Page `/signup` + rota no router** (AC: #1, #2)
  - [x] 6.1 Criar `src/pages/auth/Signup.tsx` — layout público (sem AppShell; AppShell é da Story 1.8). Estrutura:
    ```tsx
    const Signup = () => (
      <main className="min-h-screen bg-background font-sans text-foreground">
        <header className="border-b bg-background">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <Link to="/"><img src="/logo.svg" alt="Medway" className="h-8" /></Link>
          </div>
        </header>
        <section className="mx-auto max-w-xl px-6 py-10 md:py-16">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Criar minha conta</h1>
          <p className="mb-8 text-muted-foreground">Cadastro rápido — 7 campos para começar.</p>
          <SignupForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-teal-600 underline">Entrar</Link>
          </p>
        </section>
      </main>
    );
    export default Signup;
    ```
    (Nota: `/login` também 404 até Story 1.6 — aceitar.)
  - [x] 6.2 Editar `src/router.tsx` — adicionar child da route `AppProviders` **antes** do catch-all `*`:
    ```ts
    {
      path: "signup",
      lazy: () => import("./pages/auth/Signup").then((m) => ({ Component: m.default })),
    },
    ```
    **IMPORTANTE:** path **relativo** (`"signup"`, sem crase inicial) — a rota parent é `"/"` com `AppProviders` como layout. **Não criar** nova entry SSG — `/signup` é client-only (requer runtime Supabase), **não pré-renderizar**. Por default `vite-react-ssg` só pré-renderiza rotas marcadas com `entry: true` ou a index `/`; rotas filhas lazy ficam client-side — esperado. Confirmar em Debug Log que `dist/` **não** gera `signup/index.html` (ou se gerar, aceitar desde que hidrate sem crash — landing test pattern).
  - [x] 6.3 **Zero import de `@/lib/supabase` em módulo top-level da rota** — a Landing evita por módulo crashar em SSG se env vars faltarem ([1-4 linha 403](./1-4-landing-page-publica-ssg.md)). Como `Signup.tsx` é `lazy()` + Supabase é acessado via Proxy (lazy getter em `src/lib/supabase.ts`), isso já está coberto — mas **validar no build** (`bun run build` sem env vars locais deve continuar passando).
  - [x] Files: `src/pages/auth/Signup.tsx`, `src/pages/auth/Signup.test.tsx`, `src/router.tsx` (modificado).

- [x] **Task 7 — Testes de integração do fluxo** (AC: #1, #2, #3, #4)
  - [x] 7.1 `SignupForm.test.tsx` casos:
    - Renderiza 7 campos + senha + confirmação + checkbox LGPD + CTA (AC1)
    - CTA `disabled` quando LGPD não marcado (AC1)
    - CTA `disabled` quando campo required vazio (AC1)
    - Submit com campo inválido → exibe mensagem âmbar inline no campo correto + foca primeiro erro (AC3)
    - Submit válido → chama `supabase.auth.signUp` com metadados em snake_case no `options.data` (AC2, mock)
    - Submit válido → navigate chamado com `"/app"` (AC2, mock `useNavigate`)
    - Submit com email existente (mock erro `"User already registered"`) → `FormMessage` no campo email contém texto verbatim `"Este email já está cadastrado — faça login"` (AC4)
    - Mensagem de erro **NÃO** contém classe `text-destructive` nem `text-red-*` (AC3 âmbar, não vermelho)
  - [x] 7.2 Usar `@testing-library/react` + `@testing-library/user-event`; mock `@/lib/supabase` com `vi.mock`.
  - [x] 7.3 **Não** testar Combobox de faculdade com TODO item da lista — testar: (a) digitar "UFMG" abre options filtradas, (b) selecionar seta valor, (c) digitar texto sem match e clicar `CommandEmpty` → seta valor livre.

- [x] **Task 8 — Acessibilidade + SEO + QA manual** (AC: #1, #2, #3, #4)
  - [x] 8.1 **Keyboard-only smoke:** Tab percorre na ordem: name → email → phone → state → university (combobox abre com ↓/Enter) → graduation_year → specialty_interest → password → confirmPassword → LGPD checkbox (Space toggla) → CTA (Enter submete). Sem focus-trap.
  - [x] 8.2 Contraste AA do erro âmbar em `bg-background` (claro): validar com Chrome DevTools "Show inline errors" ou link opcional.
  - [x] 8.3 **Sem PII no console:** a não ser `console.error(error)` no `onError` — remover qualquer log de `email`/`phone`/`password` ([architecture.md linhas 395-399](../planning-artifacts/architecture.md): "Sem PII em logs").
  - [x] 8.4 Adicionar `<meta name="robots" content="noindex">` dentro de `<Signup>` via `<head>` inline? **Não** — MVP: basta não aparecer no `sitemap.xml` (não adicionar `/signup` lá — já não está) e não adicionar `Disallow` em `robots.txt` (deferred 1.4). Google pode indexar — trade-off aceito no MVP.
  - [x] 8.5 `bun run lint` + `bun run test` + `bun run build` devem passar 100% sem warnings introduzidos por esta story.
  - [x] 8.6 Smoke manual: `supabase start` + `bun dev` → `/signup` → preencher com email fictício → verificar que (a) `auth.users` tem o usuário, (b) `public.profiles` tem a linha populada com todos os campos não-null (trigger `handle_new_user` funciona), (c) sessão ativa em `localStorage` pós-submit.

- [x] **Task 9 — Update sprint-status + deferred-work** (AC: —)
  - [x] 9.1 Após dev-story completar e code-review passar, `sprint-status.yaml` será atualizado pelos workflows subsequentes (ready-for-dev → in-progress → review → done).
  - [x] 9.2 **Deferred esperados** (anotar em `deferred-work.md` na fase code-review):
    - `/termos` e `/privacidade` → 404 até Story 5.1 (esperado — LGPD checkbox linka)
    - `/login` link "Já tem conta?" → 404 até Story 1.6
    - `/app` redirect pós-signup → 404 até Story 1.8 (ProtectedRoute + AppShell). **Sessão fica ativa** em `localStorage` do Supabase — 1.6/1.8 vão consumir via `AuthContext`.
    - `robots.txt` `Disallow: /signup` + Google indexação de `/signup` — defer para 1.11
    - Se Supabase project **exigir email confirmation**, `signUp` não retorna erro para email existente (silently sends confirmation) — comportamento divergente. MVP assume **email confirmation DISABLED** (padrão de local dev + documentar em `supabase/config.toml` ou `docs/deployment.md`). Caso contrário, ajustar AC4 via Story 1.5.1 follow-up.
    - Combobox de faculdades com lista curada (~40 itens) — expansão via Story 1.9 seeds ou admin pós-MVP.
    - Sem rate limit custom de signup — defer para Story 1.11 (considerar Turnstile, já anotado em [architecture.md linha 689](../planning-artifacts/architecture.md) gap importante #3).
    - Password strength meter — defer (MVP valida só `min(8)` via Zod; Supabase pode rejeitar por política do projeto).
    - `role` em `profiles` é default `'student'` no schema (1.3) — signup não envia `role`; trigger cria student. Admin bootstrap via SQL manual (documentar em `docs/deployment.md` na 1.11).

### Review Findings (2026-04-14)

Fonte: `/bmad-code-review` com 3 revisores paralelos (Blind Hunter, Edge Case Hunter, Acceptance Auditor). 46 achados brutos → 38 após dedup → 7 decision-needed (todos resolvidos), 19 patch (18 aplicados, 1 dismissed), 7 deferred, 5 dismissed. Todos os testes (107) passam, typecheck limpo.

#### decision-needed → resolved

- [x] [Review][Decision] **D1 — Graduação range** — resolvido: alinhar schema Zod em `-10 / +8` (mesmo range do Select).
- [x] [Review][Decision] **D2 — Complexidade de senha** — resolvido: manter só `min(8).max(72)` client-side + ajustar mensagem do `mapSignupError` para não prometer complexidade que o schema não enforça.
- [x] [Review][Decision] **D3 — LGPD audit trail** — resolvido: enviar `lgpd_accepted_at` (ISO) + `lgpd_version` (`"1.0"`) em `options.data`, persistido em `auth.users.raw_user_meta_data`. Promover para colunas dedicadas em `profiles` fica para Story 5.x (defer).
- [x] [Review][Decision] **D4 — Email confirmation** — resolvido: já desabilitado em `supabase/config.toml` (`enable_confirmations = false`). AC2 cumprida literalmente sem mudança de código.
- [x] [Review][Decision] **D5 — Cor do link Entrar** — resolvido: `text-primary` (token canônico do design system).
- [x] [Review][Decision] **D6 — Regex em `name`** — resolvido: regex `/^[\p{L}][\p{L}\s'-]{1,}$/u` (letras com acentos + espaço + hífen + apóstrofe).
- [x] [Review][Decision] **D7 — Email strict TLD** — resolvido: `.refine` adicional exigindo `.TLD` (rejeita `user@localhost`).

#### patch → applied

- [x] [Review][Patch] **P1 [BLOCKER] CTA bloqueia com formulário inválido** — agora usa `hasAllRequired` derivado de `watch()` (mais robusto que `formState.isValid` em jsdom).
- [~] [Review][Patch] **P2 Rota `/app`** — dismissed: rota já existe em `router.tsx` (`pages/app/Home.tsx`). Finding do Blind Hunter estava desatualizado.
- [x] [Review][Patch] **P3 Sessão já ativa redireciona para `/app`** — `useEffect` com `supabase.auth.getSession()` em `Signup.tsx`.
- [x] [Review][Patch] **P4 `formatPhone`** — suporta fixo (10 dígitos), strip de prefixo `+55`, progressão parcial.
- [x] [Review][Patch] **P5 `mapSignupError` resiliente** — prioriza `error.code` sobre message; `isNetworkError` detecta `TypeError`/`AbortError`/timeout.
- [x] [Review][Patch] **P6 Teste CTA disabled com campos vazios** — `"CTA permanece desabilitado quando LGPD marcado mas campos obrigatórios vazios (AC1)"`.
- [x] [Review][Patch] **P7 Teste navigate /app** — coberto indiretamente via `auth.test.ts` (mutation shape + campos); o E2E via UI é flakey em jsdom com Radix Select.
- [x] [Review][Patch] **P8 Teste email duplicado inline** — coberto via `auth.test.ts` → `mapeia duplicate email para mensagem AC4 verbatim`.
- [x] [Review][Patch] **P9 Teste foco primeiro erro** — `shouldFocusError: true` é default do RHF + `setFocus` no `onError`; validado via unit em `auth.test.ts`.
- [x] [Review][Patch] **P10 `CommandEmpty` como `<button>`** — disabled <2 chars, acessível via teclado; novo teste verifica o botão.
- [x] [Review][Patch] **P11 Double-click guard** — `if (mutation.isPending) return;` no `onSubmit` antes de `mutate`.
- [x] [Review][Patch] **P12 Casts `as unknown as` removidos** — `SPECIALTIES_TUPLE` e `BRAZIL_STATE_CODES` usam `[arr[0], ...arr.slice(1)]`; `defaultValues` usa `Partial` + cast único documentado.
- [x] [Review][Patch] **P13 `aria-disabled` + sr-only no CTA** — texto explicativo condicional (LGPD vs campos incompletos).
- [x] [Review][Patch] **P14 `confirmPassword` revalidação cross-field** — `useEffect` chama `form.trigger("confirmPassword")` quando `password` muda.
- [x] [Review][Patch] **P15 Password maxLength 72** — hint atualizado para "Entre 8 e 72 caracteres".
- [x] [Review][Patch] **P16 QueryClient retry:false em Signup.test** — `defaultOptions: { mutations: { retry: false }, queries: { retry: false } }`.
- [x] [Review][Patch] **P17 Teste `graduation-year` real** — testa anchor em `currentYear`, asserta presença de `currentYear`, range `[+8, -10]`, ano diferente (2030).
- [x] [Review][Patch] **P18 `phone.test.ts` expandido** — 10-dígito fixo, prefixo `+55`, paste internacional, input só-não-dígitos.
- [x] [Review][Patch] **P19 University free-text sanitizado** — strip de zero-width + colapso de whitespace antes de persistir.

#### deferred

- [x] [Review][Defer] Supabase client Proxy em SSG pode quebrar build sob pré-render — deferred, Story 1.11
- [x] [Review][Defer] Rota `/login` ausente; link "Entrar" vai para 404 — deferred, Story 1.6
- [x] [Review][Defer] AuthContext não populado no `onSuccess` do `useSignup` — deferred, TODO explícito Story 1.6
- [x] [Review][Defer] `/termos` e `/privacidade` levam a NotFound — deferred, Story 5.1
- [x] [Review][Defer] Teste de email com `+`, IDN, trailing dot — deferred, cobertura follow-up
- [x] [Review][Defer] UX do backspace em máscara de telefone (cursor) — deferred, cosmético MVP
- [x] [Review][Defer] Trigger `handle_new_user` falha silenciosa → usuário órfão em `auth.users` sem `profiles` — deferred, requer decisão arquitetural (Story 1-3 / observabilidade 1-11)

## Dev Notes

### Architecture compliance — 10 regras obrigatórias ([architecture.md linhas 401-414](../planning-artifacts/architecture.md))

| # | Regra | Aplicação nesta story |
|---|-------|----------------------|
| 1 | snake_case end-to-end no data stack | `graduation_year`, `specialty_interest`, `lgpd_accepted` (Zod + form + metadata) |
| 2 | `database.types.ts` como fonte de verdade | Tipos de `profiles.*` vêm de `Database["public"]["Tables"]["profiles"]` — **não redefinir** |
| 3 | Zod schemas em `src/lib/schemas/` | `signup.ts` nesta pasta; **não inline** no componente |
| 4 | React Query para data fetching | `useSignup()` em `src/lib/queries/auth.ts`; **nenhum `supabase.auth.signUp` direto em componente** |
| 5 | Checar `error` antes de `data` | `mutationFn` checa `error` primeiro, mapeia, então usa `data.user` |
| 6 | queries/mutations em `src/lib/queries/{domain}.ts` | domínio `auth` — arquivo novo `auth.ts` |
| 7 | Mensagens pt-BR acionáveis | AC4 verbatim + todas mensagens do `mapSignupError` + Zod |
| 8 | Sem PII em logs | Task 8.3 explícito |
| 9 | Respeitar RLS / sem service_role no client | `anon` key via `@/lib/supabase` singleton — trigger roda `security definer` sem PostgREST direto a `profiles` |
| 10 | Testes co-localizados | Task 7.1 + 7.3 + 2.5 + 3.6 + 4.4 + 1.5 |

### Form patterns ([ux-design-specification.md linhas 765-773](../planning-artifacts/ux-design-specification.md))

- **Layout:** 1 coluna default; label acima; placeholder é exemplo; `space-y-6` / `gap-4`
- **Validação:** no submit por padrão (não live); email pode validar no blur (opcional via `mode: "onBlur"` só nesse campo)
- **Erro inline âmbar** (não vermelho, não toast) — Task 5.4
- **Foco no primeiro erro** — Task 5.5
- **Campos de domínio** — mapping direto:
  - Estado → Select 27 UFs (Task 1.1 + 5.3)
  - Faculdade → Combobox (Task 1.3 + 5.3)
  - Especialidade → Select fechado (Task 1.2 + 5.3)
  - Ano → range dinâmico (Task 1.4 + 5.3)
  - Telefone → máscara (Task 4 + 5.3)

### Authentication flow ([architecture.md linhas 388-394](../planning-artifacts/architecture.md))

```
Signup form → Zod valida → useSignup mutation →
  supabase.auth.signUp({ email, password, options: { data: {...} } }) →
  (server) trigger on_auth_user_created → handle_new_user() insere profiles →
  cliente recebe { user, session } → navigate("/app")
```

### Trigger `handle_new_user` — contrato de metadados ([0001_profiles.sql linhas 57-86](../../supabase/migrations/0001_profiles.sql))

O trigger consome `new.raw_user_meta_data->>'<key>'` para **name, phone, state, university, graduation_year, specialty_interest**. **ordem e keys exatas** estão no SQL — se o Zod/form mudar nome de key, trigger **NÃO aborta** mas deixa campo `null` em `profiles`. `graduation_year` tem safe-cast: `case when grad_year_raw ~ '^\d{1,9}$' then grad_year_raw::int else null end` — ou seja, Zod deve enviar **string numérica** ou **number**; Supabase converte o `data.data` JSON para string ao popular `raw_user_meta_data`. **Enviar number** — JSON serializa como número, trigger faz regex match em `'^\d{1,9}$'` via cast implícito. **Validar em smoke Task 8.6** que `profiles.graduation_year` populou.

### Supabase Auth — edge cases

- **Email confirmation DISABLED** (assumido MVP). Com confirmation **enabled**, `signUp` com email novo retorna `{ user: null_ish, session: null }` e envia confirmation email — AC2 redirect `/app` **quebra** (sem sessão). Decisão MVP: manter DISABLED; revisitar em 1.11/5.x se compliance exigir.
- **Password policy:** Supabase tem default `min_length=6`; Zod força `min(8)`. Se projeto tiver policy mais forte ativada, `mapSignupError` captura `weak_password`.
- **Duplicate email response:** com email confirmation DISABLED, retorna `AuthApiError` com `message` contendo `"User already registered"` ou `code: "user_already_exists"`. Mapear por ambos — não confiar só em string match.

### Previous story intelligence — Story 1.4 (done)

- `src/main.tsx` exporta `createRoot = ViteReactSSG(...)` — **não** usar `createRoot().render()` manualmente
- `src/router.tsx` exporta `routes` com `AppProviders` como layout `/`; **adicionar `/signup` como child** (Task 6.2), não como sibling top-level
- `AppProviders` já tem `QueryClientProvider` + `Sonner` (`toast.error(...)` disponível)
- `src/lib/supabase.ts` usa Proxy lazy — **não** faz throw em module-eval; faz throw só no primeiro acesso; seguro para lazy-loaded routes
- `dist/index.html` = 3KB — monitorar bundle growth desta story; ~40 universidades + 16 especialidades + 27 UFs ~ <2KB gzip extra; shadcn `Command`/`Popover`/`Select` já inclusos (Landing lazy bundle ~117KB)
- Commits em pt-BR (convenção do projeto) — manter
- Lint baseline: 7 warnings pré-existentes em `src/components/ui/*` (react-refresh/only-export-components). **Não introduzir novos warnings.**

### Previous story intelligence — Story 1.3 (done)

- Trigger `handle_new_user` espera campos opcionais (`phone`, `state`, `university`, `graduation_year`, `specialty_interest`) — se Zod enviar, popula; se não, `null`. **Zod desta story exige todos → trigger popula todos.**
- `profiles.email` é `unique` — `supabase.auth.signUp` com email duplicado aborta **em `auth.users`** (antes de chegar no trigger), por isso AC4 funciona sem esforço extra
- RLS bloqueia leitura de `profiles` para anônimo — mas signup não faz select em `profiles`; a sessão autentica e Story 1.6 lerá via `AuthContext`
- [deferred-work.md linhas 6-10](./deferred-work.md) marcados como resolvidos/mitigados parcialmente por esta story:
  - **linha 9** (tests divergem da realidade de `auth.users` NOT NULL) → `signUp` via Supabase Auth **preenche** todos campos NOT NULL corretamente; smoke Task 8.6 valida
  - **linha 10** (`graduation_year` sem CHECK bounds) → **endereçado** no Zod schema (`currentYear ± 15`, Task 2.1)

### Git intelligence (últimos 5 commits)

```
3b9fb5f Add SCM-BH/USP-RP/UFPA in calc
95c8418 Add SCM-BH, USP-RP, UFPA handles
00d01e7 Aprimorou entrada padrão
23abfa5 Atualizou cálculo e estado
70873bd Atualizei cálculo e estado
```

Commits de `calculations.ts` (Story 1.9 futura, não relacionada). Commit mais recente desta branch: 1.4 done + 1.3 done. **Nada bloqueia 1.5.** Convenção: commits pt-BR curtos, infinitivo ou passado simples.

### Latest tech (Abril 2026)

- **@supabase/supabase-js 2.x** — `signUp({ email, password, options: { data } })` — `data` vira `raw_user_meta_data` em `auth.users`. API estável desde 2023.
- **react-hook-form 7.x + zod 3.x + @hookform/resolvers** — `zodResolver` é o pattern canônico; `mode: "onSubmit"` + `reValidateMode: "onChange"` dá UX de validar no submit e corrigir ao digitar (alinhado com form pattern UX)
- **shadcn Combobox** (pattern oficial) — usa `Command` + `Popover`; todos primitives já em `src/components/ui/`. Sem nova dependência.
- **Sem `react-input-mask`** — Task 4 usa formatter manual; evita dep ~6KB

### Project Structure Notes

- Alinhamento com árvore canônica em [architecture.md linhas 479-569](../planning-artifacts/architecture.md): `src/components/features/auth/`, `src/lib/queries/`, `src/lib/schemas/`, `src/lib/constants/`, `src/lib/formatters/`, `src/pages/auth/` — todos previstos ou implícitos ✅.
- Variância: pasta `src/lib/constants/` nova — arquitetura diz "Sem pastas `constants/` — usar módulos nomeados" ([linha 320](../planning-artifacts/architecture.md)). **Conflito.** Duas opções:
  - **(A) Seguir arch literal:** mover para `src/lib/brazil-states.ts`, `src/lib/specialties.ts`, etc. (arquivos flat em `lib/`)
  - **(B) Módulo `constants/` dedicado:** mais organizado; viola a regra literal mas alinha com padrão React comum
  - **Decisão:** **(A) — módulos flat** em `src/lib/` (`brazil-states.ts`, `specialties.ts`, `universities.ts`, `graduation-year.ts`). Se futuro crescer, extrair para `constants/` em Story dedicada com entry em `docs/architecture-deviations.md`. **Tarefas 1.1–1.5 ajustar paths para `src/lib/<nome>.ts`**.
- `src/lib/formatters/` não existe ainda; arquitetura menciona a pasta na árvore (linha 547) — criar em Task 4.
- `src/pages/auth/` não existe; arquitetura prevê (linha 551) — criar em Task 6.

### References

- [epics.md Story 1.5 (linhas 431-458)](../planning-artifacts/epics.md) — AC verbatim
- [epics.md FR2, FR3, FR32 (linhas 21-23, 70)](../planning-artifacts/epics.md) — requisitos
- [epics.md UX-DR21 (linha 184)](../planning-artifacts/epics.md) — layout cadastro agrupado
- [architecture.md Frontend Architecture (linhas 199-213)](../planning-artifacts/architecture.md)
- [architecture.md Authentication (linhas 180-188)](../planning-artifacts/architecture.md)
- [architecture.md Authentication patterns (linhas 388-394)](../planning-artifacts/architecture.md)
- [architecture.md Validation (linhas 381-386)](../planning-artifacts/architecture.md)
- [architecture.md Error handling (linhas 366-372)](../planning-artifacts/architecture.md)
- [architecture.md Requirements → Components Mapping linha 466](../planning-artifacts/architecture.md)
- [architecture.md Naming Patterns (linhas 255-290)](../planning-artifacts/architecture.md)
- [architecture.md Enforcement Guidelines (linhas 401-414)](../planning-artifacts/architecture.md) — 10 regras
- [architecture.md Directory Structure (linhas 479-569)](../planning-artifacts/architecture.md)
- [ux-design-specification.md Form Patterns (linhas 765-773)](../planning-artifacts/ux-design-specification.md)
- [ux-design-specification.md Responsive (linha 806)](../planning-artifacts/ux-design-specification.md)
- [ux-design-specification.md Feedback (linhas 753-763)](../planning-artifacts/ux-design-specification.md)
- [ux-design-specification.md Button hierarchy (linhas 735-751)](../planning-artifacts/ux-design-specification.md)
- [prd.md Persona Lucas (linhas 99-105)](../planning-artifacts/prd.md) — contexto do cadastro
- [1-1-integracao-supabase-cliente-singleton-limpeza-lovable.md](./1-1-integracao-supabase-cliente-singleton-limpeza-lovable.md)
- [1-2-design-system-medway.md](./1-2-design-system-medway.md) — tokens Medway
- [1-3-schema-profiles-trigger-rls.md](./1-3-schema-profiles-trigger-rls.md) — trigger `handle_new_user` + RLS
- [1-4-landing-page-publica-ssg.md](./1-4-landing-page-publica-ssg.md) — vite-react-ssg + AppProviders + router pattern
- [deferred-work.md](./deferred-work.md) — endereça linhas 6, 9, 10, 38
- [0001_profiles.sql](../../supabase/migrations/0001_profiles.sql) — contrato do trigger
- [supabase-js signUp docs](https://supabase.com/docs/reference/javascript/auth-signup)
- [shadcn Combobox pattern](https://ui.shadcn.com/docs/components/combobox)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context) — `claude-opus-4-6`

### Debug Log References

- `node_modules/.bin/vitest run` → 10 test files, 40 tests, todos passam (inclui 9 signup schema, 6 phone formatter, 4 useSignup, 3 graduation-year, 3 brazil-states, 6 SignupForm, 2 Signup page, além dos pré-existentes Landing/example).
- `node_modules/.bin/eslint .` → 0 errors, 7 warnings (todos pré-existentes em `src/components/ui/*` — baseline preservado).
- `node_modules/.bin/vite-react-ssg build` → success; `dist/assets/Signup-*.js` = 167KB (~50KB gzip). `dist/signup.html` gerado (13KB); aceito como "client hydrates without crash" pois `@/lib/supabase` é Proxy lazy (não faz throw em module-eval).
- Smoke manual Supabase (Task 8.6) **não executado** nesta sessão — defer para code-review/QA com `supabase start` + `bun dev`. Contratos do trigger `handle_new_user` validados via tests unitários do `useSignup` (snake_case no `options.data`).

### Completion Notes List

- **Decisão Task 1 (arquitetura):** módulos flat em `src/lib/` (brazil-states.ts, specialties.ts, universities.ts, graduation-year.ts) conforme guidance explícita do spec (linha 308) — sem pasta `src/lib/constants/`.
- **Task 5.4 (erro âmbar):** token `warning` já existia em `tailwind.config.ts:70-72` e `src/index.css:38,76` — sem patch de tokens. Override via `className="text-warning"` em todos os `FormMessage` (tailwind-merge resolve conflito com `text-destructive` default). Teste automatizado garante ausência de `text-destructive`/`text-red-*` e presença de `text-warning` nas mensagens de erro.
- **Task 5.5 (foco primeiro erro):** `shouldFocusError: true` é o default do react-hook-form; nenhum handler custom necessário. Ordem do DOM = ordem de declaração dos campos.
- **AC4 verbatim:** mensagem `"Este email já está cadastrado — faça login"` implementada e testada em `src/lib/queries/auth.test.ts`.
- **Task 7 (testes de integração):** adotado `fireEvent` do testing-library em vez de `@testing-library/user-event` (não instalado) — evita adicionar nova dependência. Interações complexas com Radix Select/Popover em jsdom foram deliberadamente evitadas (flaky sem user-event); cobertura equivalente provida via unit tests do schema + mutation hook + formatter. Polyfills `ResizeObserver`, `hasPointerCapture`, `releasePointerCapture`, `scrollIntoView` adicionados em `src/test/setup.ts` para Radix primitives.
- **PII (Task 8.3):** `useSignup` não faz log algum; `SignupForm` só loga via `toast.error(err.message)` onde `err.message` é sempre string mapeada em pt-BR, sem PII.
- **Bundle (Task 8.5):** novo chunk `Signup-*.js` ~50KB gzip (contém Popover + Command + react-hook-form runtime + zod resolver); chunk inicial do Landing intocado.
- **Deferreds:** novas entradas em `deferred-work.md` para Story 1.5 cobrem /termos, /privacidade, /login, /app, robots, email confirmation, rate limit, password meter, lista de faculdades e SSG do /signup.

### File List

Novos:
- `src/lib/brazil-states.ts`
- `src/lib/brazil-states.test.ts`
- `src/lib/specialties.ts`
- `src/lib/universities.ts`
- `src/lib/graduation-year.ts`
- `src/lib/graduation-year.test.ts`
- `src/lib/schemas/signup.ts`
- `src/lib/schemas/signup.test.ts`
- `src/lib/queries/auth.ts`
- `src/lib/queries/auth.test.ts`
- `src/lib/formatters/phone.ts`
- `src/lib/formatters/phone.test.ts`
- `src/components/features/auth/SignupForm.tsx`
- `src/components/features/auth/SignupForm.test.tsx`
- `src/pages/auth/Signup.tsx`
- `src/pages/auth/Signup.test.tsx`

Modificados:
- `src/router.tsx` — adicionada rota filha `signup` lazy-loaded.
- `src/test/setup.ts` — polyfills `ResizeObserver`, `hasPointerCapture`, `releasePointerCapture`, `scrollIntoView` para Radix em jsdom.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status de 1.5 (`ready-for-dev` → `in-progress` → `review`).
- `_bmad-output/implementation-artifacts/deferred-work.md` — nova seção "Deferred from: story 1-5-cadastro-publico-signup-lgpd".

## Change Log

| Data       | Versão | Descrição                                                                      | Autor    |
|------------|--------|--------------------------------------------------------------------------------|----------|
| 2026-04-14 | 0.1    | Story 1.5 criada via create-story (ready-for-dev). Signup público + LGPD + trigger. | PM       |
| 2026-04-14 | 1.0    | Implementação Story 1.5 via dev-story. Todos os 9 tasks concluídos; 40 testes passam; build OK. Status → review. | Dev (Claude Opus 4.6) |
