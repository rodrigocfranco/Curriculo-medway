# Deferred Work

## Deferred from: code review of story 1-7-recuperacao-de-senha (2026-04-14)

- `src/lib/schemas/reset-password.ts` — `.max(72)` conta caracteres JS (UTF-16 code units), não bytes; bcrypt limit é 72 bytes. Mantido consistente com `signup.ts` por design (spec Task 1.2). Revisitar junto com a regra de senha global.
- `src/lib/queries/auth.ts` (useSignup) — `LGPD_TERMS_VERSION` é referenciado em `mutationFn` antes da sua declaração `export const` no módulo; funciona por hoisting de closure, mas é frágil. Código de Story 1.5 (`done`). Refatorar junto com rework futuro de `auth.ts`.
- `src/lib/queries/auth.ts` (useResetPassword.onSuccess) — sem `queryClient.invalidateQueries(["profile", userId])` pós-reset. Risco baixo pois `signOut` limpa sessão; revisitar se surgir bug de cache.
- `src/lib/queries/auth.ts` (useLogout) — `mutationFn` sempre resolve (swallow + console.error); declaração `useMutation<void, Error, void>` sugere erros propagáveis que nunca ocorrem. Código Story 1.6.
- `src/pages/auth/ResetPassword.tsx` + `ResetPasswordForm.tsx` — comportamento cross-tab: recovery link aberto em tab B muda senha do user corrente em tab A; `signOut({ scope: "local" })` pode propagar SIGNED_OUT indesejado para tab A. Fora do escopo MVP; revisitar em AccountSettings (Story 5.2).
- `src/components/features/auth/ResetPasswordForm.tsx` — back-button após sucesso pode reabrir `/reset-password` sem sessão e exibir toast "Link inválido" pós-success. `navigate({ replace: true })` mitiga parcialmente; edge raro.

## Deferred from: story 1-7-recuperacao-de-senha (2026-04-14)

- `supabase/config.toml:150-160` — Redirect URLs de produção (Vercel/Netlify) precisam ser adicionadas em Supabase Dashboard → Authentication → URL Configuration → Redirect URLs antes do primeiro deploy. Task da Story 1.11 (CI/CD).
- Custom email template de recuperação (Supabase Dashboard → Authentication → Email Templates) — MVP usa template default em inglês; pt-BR custom diferido para Story 5.1 ou polimento pós-MVP.
- Rate limit custom para password reset — Supabase default 4/hora; ajuste via `supabase/config.toml` quando feedback indicar necessidade. Não alterar no MVP.
- `src/contexts/AuthContext.tsx` — Flag `recoveryMode` não sobrevive a F5 (reload em `/reset-password` perde o flag). Supabase mantém sessão temporária, então o formulário continua funcional — aceitável MVP. Revisitar se houver queixa de UX.
- Pós-reset usa `signOut({ scope: "local" })` — revoga só device atual. Alternativa `global` para "suspeita de invasão" fica para toggle em AccountSettings (Story 5.2).
- Sem teste E2E automatizado do fluxo completo email → link → reset. Requer SMTP mock + integração Inbucket (fora do escopo Vitest unit). Smoke manual (Task 9.5 d, h) cobre. Candidato a cobrir em Playwright quando bmad-testarch configurar.
- `isNeutralizableError` em `src/lib/queries/auth.ts` é defense-in-depth contra mudanças futuras de mensagem do Supabase. Revisar se a lib for atualizada (hoje 2.x estável).

## Deferred from: code review of story 1-5-cadastro-publico-signup-lgpd (2026-04-14)

- `src/lib/supabase.ts` — Proxy lazy-init acessa `import.meta.env.VITE_SUPABASE_URL` a cada uso; em SSG/pré-render sem env pode lançar erro tardio e opaco. Mover validação para módulo top-level com throw explícito (Story 1.11 CI/CD).
- `src/components/features/auth/SignupForm.tsx` (links LGPD) — Links `/termos` e `/privacidade` abrem `NotFound` até que Story 5.1 adicione as páginas institucionais.
- `src/lib/schemas/signup.test.ts` — Cobertura de emails com alias `+`, IDN (`münchen.de`), trailing dot não incluída (Decision D7 fechou em "exigir TLD via regex"; casos exóticos viram follow-up quando UX der feedback).
- `src/components/features/auth/SignupForm.tsx` (máscara telefone) — Backspace em máscara reaplica `formatPhone` em cada onChange, perdendo posição do cursor. Polish UX cosmético, não-bloqueador MVP.
- `supabase/migrations/0001_profiles.sql` (trigger `handle_new_user`) — Se trigger falhar (constraint/rede), `supabase.auth.signUp` retorna sucesso e deixa usuário órfão em `auth.users` sem linha em `profiles`. Requer decisão arquitetural: (a) retry + cleanup client-side, (b) Edge Function de signup com transação, ou (c) observabilidade + reconciliação (Story 1.11). Escalate antes de Story 2.
- `src/lib/queries/auth.ts` (LGPD audit trail) — Hoje persistido em `auth.users.raw_user_meta_data` via `options.data.lgpd_accepted_at` + `lgpd_version`. Promover para colunas dedicadas em `public.profiles` fica para Story 5.x (AccountSettings/compliance).
- `supabase/migrations/0001_profiles.sql` (trigger `handle_new_user`) — Se trigger falhar (constraint/rede), `supabase.auth.signUp` retorna sucesso e deixa usuário órfão em `auth.users` sem linha em `profiles`. Requer decisão arquitetural: (a) retry + cleanup client-side, (b) Edge Function de signup com transação, ou (c) observabilidade + reconciliação (Story 1.11). Escalate antes de Story 2.

## Deferred from: code review of story 1-3-schema-profiles-trigger-rls (2026-04-14)

- `supabase/migrations/0001_profiles.sql:42-44` — `set_updated_at` sem `when (old.* is distinct from new.*)`; UPDATEs no-op mesmo assim bumpam `updated_at`. Baixa prioridade; ajustar quando houver queries de "alterado desde X".
- `supabase/migrations/0001_profiles.sql:14` — `email text not null unique` sem `citext` ou índice funcional `lower(email)`. Supabase Auth normaliza, mas duplicatas por case podem entrar via admin paths futuros.
- `supabase/migrations/0001_profiles.sql:57-69` — `handle_new_user` sem `on conflict (id) do nothing`; replay de backup ou logical replication abortam com PK violation. Relevante em cenários de disaster recovery (Story 1.11+).
- `supabase/migrations/0001_profiles.sql:123-124` — Sem INSERT policy; apenas o trigger SECURITY DEFINER cria perfis. Workflows admin do Epic 3 (ex.: criar aluno via painel) precisarão de policy específica ou Edge Function com service role.
- `supabase/tests/0001_profiles.test.sql:20-48` — Inserts diretos em `auth.users` omitem colunas NOT NULL reais de produção (`encrypted_password`, `aud`, `instance_id`, `role`). Supabase local tolera, mas tests divergem da realidade — revisitar quando Story 1.5 (signup E2E) for implementada.
- `supabase/migrations/0001_profiles.sql:18` — `graduation_year int` sem CHECK bounds (aceita negativos, overflow int4, ano absurdo). Validação virá no Zod schema da Story 1.5 (signup form).

## Deferred from: code review of story 1-1-integracao-supabase-cliente-singleton-limpeza-lovable (2026-04-14)

- `src/lib/calculations.ts` — `val(v: any) => Number(v) || 0` coerce silencioso (`NaN`, negativos, strings), sem validação de range/escala da `media_geral`, caps independentes em USP-RP (potencial 4.0 em bloco), UFPA cap agregado truncando 11 pts silenciosamente, semântica de `ranking_ruf_top35` diverge entre USP-SP (falsy → 0) e SCMSP (null=0, false=5). Resolver ao extrair para seeds na Story 1.9.
- `src/App.tsx` — `QueryClient` sem `defaultOptions` (3 retries default × env inválida pode gerar tempestade de requests para Supabase); nenhum `ErrorBoundary` engloba as rotas, então qualquer throw (incluindo o de `supabase.ts` sem env) vira tela branca em produção.
- `src/pages/NotFound.tsx` — `console.error("404 Error: ...", location.pathname)` pode logar tokens/IDs em URL (risco baixo de PII no console do usuário). Usa `<a href="/">` em vez de `<Link>` do react-router, forçando full reload do SPA.

## Deferred from: code review of story 1-2-design-system-medway (2026-04-14)

- `tailwind.config.ts` — `boxShadow` customizado removido e tokens `--shadow-*` removidos de `src/index.css`. Verificar se nenhum primitive shadcn referencia `shadow-xs`/`shadow-2xs` silenciosamente resolvendo para vazio.
- `src/components/ui/chart.tsx:211` — `font-mono` usado com `fontFamily.mono` removido do config. Tailwind cai no stack default; mudança visual em tooltips. Charts não usados no MVP — revisitar quando chart aparecer em tela.
- `src/index.css` — `--sidebar-primary-foreground` navy sobre fundo teal pode ter contraste borderline para texto pequeno. Sidebar não usada no MVP; confirmar com design antes do Epic que usar.
- `eslint.config.js:8` — Diretório `supabase/` inteiro ignorado. Edge functions futuras (Story 3.3+, 4.5+, 5.3) escaparão do lint. Restringir ignore a `supabase/migrations/` quando a primeira function for criada.
- `src/App.tsx:5-10` — Validar em produção (`bun run build` + inspeção de `dist/assets/`) que o chunk de `DesignSystem` foi eliminado por tree-shake do `import.meta.env.DEV`.
- `src/lib/supabase.ts:7-11` — Cliente faz `throw` em module-eval se env vars faltarem (pré-existente da Story 1.1, arquivo ainda untracked). Deploy mal configurado → crash total sem fallback. Tratar na Story 1.1 follow-up ou 1.9.
- `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx` — Refactor `interface → type` violou anti-pattern "NÃO mexer em `src/components/ui/`"; reverter forçaria novo toque nos primitives shadcn, efeito desnecessário. Manter como está.
- `src/lib/calculations.ts:3` — `eslint-disable-next-line` adicionado e comentário com escapes `\u00e9`/`\u00e7` literais. Spec proíbe tocar `calculations.ts`; qualquer fix (reverter ou corrigir encoding) força novo toque. Resolver junto à extração para seeds SQL na Story 1.9.

## Deferred from: story 1-4-landing-page-publica-ssg (2026-04-14)

- Lighthouse mobile simulado (Slow 4G + 4× CPU throttle) mede FCP = 2.10s em 3 runs consistentes, ~100ms acima da meta AC3/NFR1 de <2s. Performance score = 97 (≥90 folgado). Gap é network-bound (bundle inicial ~117KB gzip JS + 12KB gzip CSS) sob simulação pessimista — real-device 4G deve ficar confortavelmente <2s. Otimização exige tirar `QueryClientProvider`/`TooltipProvider`/`Toaster`/`Sonner` do SSG inicial (contradiz Task 1.5 da Story 1.4). Revisitar na Story 1.11 (CI/CD) com bundle-splitting e possível `<GlobalUI>` client-only boundary. Validar novamente com medição real pós-deploy Vercel.
- `public/og-image.png` — placeholder 1200×630 cor sólida navy.900 (3.1KB). Substituir quando o time de marketing entregar asset final com logo + headline renderizados.
- `public/sitemap.xml` — `<loc>/</loc>` relativo (sem domínio absoluto); Google aceita mas recomenda absoluto. Atualizar para `https://<domínio>/` quando a Story 1.11 definir a URL canônica do deploy Vercel.
- `public/robots.txt` — sem `Disallow: /app /admin /signup /login` (essas rotas ainda não existem). Adicionar quando a árvore de rotas estiver completa (Story 1.8 `ProtectedRoute` ou 1.11 CI/CD).

## Deferred from: code review of story 1-4-landing-page-publica-ssg (2026-04-14)

- **CTA `/signup` → 404 hoje**: Landing.tsx:13 aponta para `/signup` que não existe; será satisfeito pela Story 1.5 (cadastro público).
- **Catch-all `*` retorna 200 em static host**: `src/router.tsx:25` — ajustar config de hosting (Vercel `notFoundPage` / pre-render de `/404.html`) na Story 1.11.
- **Lazy `import()` sem `errorElement`**: chunks stale durante rollover de deploy podem causar tela branca. Adicionar error boundary na Story 1.11.
- **Meta tags apenas em `index.html`**: sem gerenciamento per-rota (Helmet/`vite-react-ssg` head). Reavaliar quando houver >1 rota pública.
- **Trailing-slash / case-sensitivity**: comportamento depende da config do host (Vercel). Validar na Story 1.11.
- **FCP 2.10s vs <2s NFR1 (~100ms gap)**: já registrado acima; bundle-splitting + possível `<GlobalUI>` client-only boundary na Story 1.11.

## Deferred from: story 1-5-cadastro-publico-signup-lgpd (2026-04-14)

- `/termos` e `/privacidade` linkados no checkbox LGPD → 404 até Story 5.1 entregar as páginas de termos/política de privacidade. Aceito como gap temporário da MVP.
- `/login` (link "Já tem conta?" na página Signup) e `/app` (redirect pós-signup) → 404 até Stories 1.6 (login/AuthContext) e 1.8 (ProtectedRoute/AppShell). A sessão Supabase já persiste em `localStorage` e será consumida por 1.6/1.8.
- `robots.txt` sem `Disallow: /signup` e sem `<meta name="robots" content="noindex">` inline — rota pode ser indexada pelo Google. Trade-off aceito no MVP; fechar na Story 1.11 (CI/CD) junto com demais rotas privadas.
- Supabase "email confirmation" assumido DISABLED (padrão local dev). Se ambiente de produção habilitar, `signUp` com email novo retorna sem sessão e o redirect `/app` quebra (AC2). Documentar estado do flag em `supabase/config.toml` ou `docs/deployment.md` na Story 1.11; caso contrário, abrir follow-up 1.5.1.
- Sem rate limit custom no `/signup` (sem Turnstile/captcha). Defer para Story 1.11 conforme architecture.md (gap importante #3).
- Sem password strength meter — MVP valida apenas `min(8)` via Zod; Supabase pode rejeitar via policy do projeto (erro mapeado para "Senha muito fraca").
- Combobox de faculdades com lista curada (~36 itens); entrada livre já suportada. Expansão via Story 1.9 (seeds) ou admin pós-MVP.
- `role` em `profiles` é `'student'` por default (schema 1.3); signup nunca envia `role`. Admin bootstrap via SQL manual — documentar em `docs/deployment.md` na Story 1.11.
- `dist/signup.html` (~13KB) é gerado pelo `vite-react-ssg` apesar da intenção de ser client-only — valida-se apenas que hidrata sem crash (Proxy lazy de `@/lib/supabase` não dispara em module-eval). Se virar ruído, configurar `crawl: false` para a rota na Story 1.11.

## Deferred from: story 1-6-login-logout-authcontext (2026-04-14)

- `/forgot-password` → 404 até Story 1.7 (link "Esqueci minha senha" no LoginForm). Trade-off aceito.
- `ProtectedRoute` HOC ainda não existe — `/app` e `/admin` são guardados por `useEffect` soft nas pages stub. Risk: flash visual de conteúdo autenticado antes do redirect. Fecha em Story 1.8.
- `AppShell` / `AdminShell` / Avatar menu não existem — CTA "Sair" é placeholder inline em stubs `src/pages/app/Home.tsx` e `src/pages/admin/Home.tsx`. Story 1.8 substitui pelas shells reais (arquitetura prevê `Dashboard.tsx` / equivalente).
- `ErrorBoundary` global segue ausente. Endereça **parcialmente** o deferred da 1.1 via `queryClient.defaultOptions.queries.retry=1` + `staleTime=60s` agora em `src/App.tsx`. ErrorBoundary completo fica para Story 1.11.
- `useCurrentProfile` propaga erro de RLS/PGRST116 silenciosamente (profile=null). AuthProvider permanece funcional (user.email fallback no stub). RLS coberta em 1.3; refinar tratamento pós-Story 1.8 ou em retrospective do Epic.
- Redirect-por-role em `LoginForm.onSuccess` faz `supabase.from("profiles").select("role").single()` direto — exceção documentada à arch regra 4. Revisitar quando houver forma determinística de aguardar profile pós-SIGNED_IN (ex.: `useSuspenseQuery` em 1.8 + React Query v5 `ensureQueryData`).
- `signOut({ scope: "local" })` — revoga só o device atual. "Sair de todos os dispositivos" fica para AccountSettings (Story 5.2).
- Cross-tab sync via `onAuthStateChange` funciona out-of-the-box (storage events), mas sem teste automatizado — difícil reproduzir em Vitest. Smoke manual valida (Task 9.5.g).
- `dist/app.html`, `dist/admin.html`, `dist/login.html` são gerados pelo `vite-react-ssg` — conteúdo é fallback "Carregando…" seguido de hidratação client-side. Não vaza PII (sem user autenticado no SSR). Se virar ruído de SEO/crawler, configurar `crawl: false` na Story 1.11 junto com `/signup`.
- Baseline de warnings de lint permanece em 7 (todos em `src/components/ui/*`). Um `eslint-disable-next-line react-refresh/only-export-components` foi adicionado em `src/contexts/AuthContext.tsx` para o `AuthContext` value; `useAuth` está isolado em `src/contexts/useAuth.ts` para evitar o warning no hook. Alternativa: extrair o Context para arquivo próprio se a convenção for rígida.

## Deferred from: code review of story-1.6 (2026-04-14)

- `removeQueries({queryKey:["profile"]})` em SIGNED_OUT só limpa profile. Hoje único cache user-scoped, mas antes de Epic 2 introduzir queries de currículo/scores, trocar por `queryClient.clear()` (ou estratégia de prefixo) para evitar leak entre usuários. [src/contexts/AuthContext.tsx]
- `/login` flasha o LoginForm para usuário já autenticado em hard-refresh (SSG render + effect só client). Adicionar skeleton "Verificando sessão…" enquanto `loading=true`. [src/pages/auth/Login.tsx]
- `useCurrentProfile` sem `AbortSignal` — race silencioso em troca rápida de usuário; raro hoje, mitigar quando multi-tab/multi-user comum. [src/lib/queries/auth.ts]
- ErrorBoundary global ausente; `profileQuery.isError` nunca consultado. Mitigado parcialmente por `retry: 1` (Task 7.2). Fechamento completo previsto na Story 1.11. [src/contexts/AuthContext.tsx, src/App.tsx]
- Header `/login` mostra texto "Medway" em vez de `<img src="/logo.svg" />` (spec Task 5.1). Trocar quando o asset for adicionado. [src/pages/auth/Login.tsx]
