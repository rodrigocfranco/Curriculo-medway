# Deferred Work

## Deferred from: code review of story 6-2-social-proof-faq-footer (2026-04-19)

- **Sem skip-to-content link na landing page (WCAG 2.4.1)** — Landing page agora tem 7 seções; keyboard users não têm como pular navegação/hero e ir direto ao conteúdo principal. Pre-existing concern para toda a landing, não introduzido pela Story 6.2.

## Deferred from: story 6-2-social-proof-faq-footer (2026-04-19)

- **Coletar depoimentos reais de alunos pós-lançamento** — SocialProofSection usa dados mock hardcoded (3 depoimentos fictícios). Componente aceita prop `testimonials?: Testimonial[]` para facilitar troca futura por dados dinâmicos. Substituir mock data quando houver depoimentos reais coletados.

## Deferred from: story 6-1-landing-completa-hero-como-funciona-preview (2026-04-19)

- **Contagem "11 instituições" hardcoded na landing** — Seção "Como funciona" e microcopy do hero mencionam "11 instituições" como valor fixo. SSG não tem acesso ao DB em build-time para contagem dinâmica. Revisitar quando houver API pública de contagem ou quando o número mudar.

## Deferred from: code review of story 6-1-landing-completa-hero-como-funciona-preview (2026-04-19)

- **AuthProvider acoplado ao SSG build** — `supabase.ts` faz throw em module-scope se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` estão ausentes. O `AuthProvider` importa `supabase` e envolve a landing page. Pré-existente, não introduzido pela Story 6.1. Revisitar quando o SSG for desacoplado do AuthProvider.

## Resolved by Story 1.11 — CI/CD completo (2026-04-15)

Os itens abaixo, previamente deferidos de Stories 1.1 / 1.4 / 1.5 / 1.6 / 1.7 / 1.8, foram fechados na Story 1.11 e **removidos** das seções correspondentes abaixo:

| Origem                | Item fechado                                                            | Como                                                                                 |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1.1 code review       | ErrorBoundary global ausente                                            | `GlobalErrorBoundary` em `src/App.tsx`                                               |
| 1.4 code review       | Catch-all `*` retorna 200 em static host                                | `vercel.json` rewrites SPA → `/index.html`                                           |
| 1.4 code review       | Lazy `import()` sem `errorElement`                                      | `ChunkLoadErrorFallback` via `errorElement` no root route                            |
| 1.4 deferrals         | `robots.txt` sem Disallow para rotas privadas                           | Disallow `/app /admin /signup /login /forgot-password /reset-password`               |
| 1.4 deferrals         | `sitemap.xml` URL relativa                                              | Já absoluta (`https://curriculo.medway.com.br/`) — validado                          |
| 1.5 code review       | `supabase.ts` Proxy lazy + env tardio                                   | Validação top-level com throw explícito em `src/lib/supabase.ts`                     |
| 1.5 deferrals         | Redirect URLs de produção no Supabase Auth                              | Documentado em `docs/deployment.md#Vercel Setup`                                     |
| 1.5 deferrals         | Email confirmation flag indefinido                                      | Documentado + checklist em `docs/deployment.md`                                      |
| 1.5 deferrals         | `robots.txt` Disallow `/signup` + `crawl:false` para rota SSG           | `includedRoutes` em `src/main.tsx` filtra rotas privadas do SSG                      |
| 1.5 deferrals         | Admin bootstrap via SQL                                                 | Documentado em `docs/deployment.md#Admin Bootstrap`                                  |
| 1.6 code review       | ErrorBoundary global ausente                                            | Idem 1.1                                                                             |
| 1.6 deferrals         | `dist/app.html` / `admin.html` / `login.html` gerados pelo SSG          | `includedRoutes` filtro em `src/main.tsx`                                            |
| 1.7 deferrals         | Redirect URLs produção                                                  | Idem 1.5                                                                             |

## New deferrals from Story 1.11 (2026-04-15)

- **FCP 2.10s vs NFR1 <2s (~100ms gap)** — bundle-splitting de `<GlobalUI>` client-only boundary para tirar `QueryClientProvider`/`TooltipProvider`/`Toaster`/`Sonner` do SSG inicial. **Medir Lighthouse em produção real (device 4G) antes de mexer** — pode já estar confortavelmente <2s.
- **`LoginForm` role-aware redirect + `?redirect=` query param** (fecha deferrals 1.6 + 1.8) — mudança cirúrgica em `src/components/features/auth/LoginForm.tsx`: (a) ler `?redirect=` do querystring, (b) consultar `profiles.role` pós-signin, (c) navegar para `/admin` se admin + sem redirect, ou para `redirect` param. PR dedicado pós-1.11.
- **Rate limit custom em `/signup`** (deferral 1.5) — Turnstile ou captcha. Avaliar spam real pós-launch antes de implementar.
- **Sentry Session Replay** — desabilitado no MVP (LGPD + free tier). Revisitar com consentimento explícito se debug de UX justificar.
- **E2E Playwright** — diferido. Track separado com bmad-testarch.
- **Source maps upload para Sentry** — stack traces minificados aceitáveis no MVP (1 dev, build determinístico). Revisitar quando volume de erros justificar setup do `@sentry/vite-plugin`.
- **Required reviewers em repo privado plano Free** — `db-push.yml` depende de GitHub Environments com required reviewers, que exige plano Team/Enterprise em repos privados. Se Free, o guard é fraco (basta alterar código). Documentado em `docs/deployment.md`; avaliar upgrade antes do primeiro `db-push` real em produção.
- **Domínio customizado `curriculo.medway.com.br` pendente** — se ainda não registrado/delegado ao Vercel no momento do deploy, `robots.txt` + `sitemap.xml` apontam para URL inexistente. Resolver antes do primeiro UptimeRobot monitor ser criado.

## Deferred from: code review of story 2-2-motor-calculo-db-function-trigger-queries (2026-04-17)

- **Cast boolean/numeric de valores inválidos no JSONB** — `evaluate_formula` faz `(p_data->>field)::numeric` e `::boolean` sem proteção contra tipos inesperados. Validação pertence à camada de currículo (Zod schema Story 2.1), não ao evaluate_formula.
- **UPDATE institution_id no trigger não marca stale na instituição antiga** — `mark_scores_stale` usa apenas `NEW.institution_id` em UPDATE; se admin mover uma regra de instituição, scores da origem ficam desatualizados. Cenário raro em admin.
- **Recursão ilimitada em composite** — `evaluate_formula` chama a si mesma recursivamente sem depth limit. JSONB malformado poderia causar stack overflow. Impacto baixo com dados controlados via admin.
- **Zod schemas decorativos (type assertion sem parse)** — `as UserScore[]` e `as Institution[]` em vez de `.parse()`. Padrão da codebase (consistente com `curriculum.ts`).
- **Termo sum sem operador ignorado silenciosamente** — Se um termo em `sum.terms[]` não tem `mult`, `when_true` nem `when_gt0`, contribui 0 sem warning.
- **Smoke tests insuficientes para AC5** — Testes de `scoring.test.ts` cobrem apenas query keys e exports; testes de renderHook planejados para Story 2.3.

## Deferred from: code review of story 3-1-navegacao-admin-crud-instituicoes-upload-edital (2026-04-17)

- **Stale closure no `onSubmit` — sem optimistic locking** — Se outro usuário alterar a instituição entre abrir o dialog e submeter, `onSubmit` usa dados desatualizados. Padrão pré-existente no projeto (não introduzido nesta story).
- **Select de estado não pode ser limpo após seleção** — Não há opção "Nenhum" no Select de UF; uma vez selecionado, não há como voltar para vazio. UX enhancement.
- **Schema `edital_url` aceita URLs non-http(s)** — Zod `.url()` aceita `javascript:`, `data:`, `file:`. Risco mínimo (admin-only). Hardening de segurança.

## Deferred from: code review of story 4-1-pagina-leads-tabela-filtros-metricas-drawer (2026-04-17)

- **PK de `user_scores` inclui `specialty_id` nullable** — PostgreSQL trata NULLs como distintos em PK, funciona mas é não-convencional. Pré-existente (migration 0003). Decisão para Story 2.5.

## Deferred from: code review of story 1-11-ci-cd-completo (2026-04-16)

- **Rotas stub no router (`/admin/regras`, `/admin/leads`, `/admin/historico`)** — forward work de Story 1.8 presente no `src/router.tsx`. Fora de escopo da 1.11; manter como está até as stories 3.x que implementam essas telas.

## Deferred from: code review of story 1-10-schema-curriculo-scores-bucket-editais (2026-04-15)

- PK composta `user_scores (user_id, institution_id, specialty_id)` com `specialty_id NULL` — decisão arquitetural (UNIQUE NULLS NOT DISTINCT vs sentinel UUID) fica junto ao `calculate_scores` RPC na Story 2.5. Documentado também na entrada original abaixo.
- Policies INSERT/UPDATE/DELETE de `user_scores` permitem student escrever via PostgREST direto — implementação segue AC2 literal. Tightening (remover CRUD de student, manter só SELECT, escrita exclusiva via RPC SECURITY DEFINER) é decisão junto ao `calculate_scores` na Story 2.5.
- Seed `curriculum_fields.sql` não remove `field_key` órfãos em reruns — drift silencioso quando `UserProfile` evoluir. Aceitável MVP; Epic 2 deve formalizar contrato.
- `user_curriculum.data jsonb` sem validação server-side contra o catálogo — intencional por design (validação client-side via Zod em Epic 2).
- `curriculum_fields.category` como `text` livre sem FK/enum — considerar enum em Epic 2.
- `conceito_historico` com options mas não lido por `calculations.ts` — dead data até Epic 2.6.
- Label `media_geral` ambíguo (`0-10 ou 0-100`) — UI de Epic 2 precisa definir escala.

## Deferred from: story 1-10-schema-curriculo-scores-bucket-editais (2026-04-15)

- `supabase/migrations/0003_curriculum_scores.sql` (PK de `user_scores`) — PK composta `(user_id, institution_id, specialty_id)` com `specialty_id NULL`. Postgres trata `(u, i, NULL)` como distinto em PK. **Decisão para Story 2.5** (`calculate_scores`): escolher entre `UNIQUE NULLS NOT DISTINCT` (PG15+) ou sentinel UUID `'00000000-...-0'` para upsert determinístico do "default institucional".
- Trigger `mark_scores_stale` em `scoring_rules` — **NÃO** implementado aqui; escopo explícito da Story 2.5 (invalidação reativa do cache `user_scores.stale`).
- `src/lib/types.ts` + `src/lib/calculations.ts` (legado Lovable) — Mantidos intocados até Epic 2 (consumo pelo frontend migra para Supabase em Story 2.1). Seed `curriculum_fields` deriva de `types.ts` mas não há linkage em runtime ainda.
- `supabase/seeds/curriculum_fields.sql` (labels) — Labels são **curadoria** (português direto, 1 linha), não extração literal de `calculations.ts`. Revisitar com design/UX quando formulário de Story 2.2 for construído.
- Sem validação client-side de tipo/tamanho/MIME do upload de edital — defesa em profundidade (frontend + Edge Function) virá na Story 3.3 (upload admin).

## Deferred from: code review of story 1-8-protectedroute-appshell-adminshell (2026-04-15)

- `src/components/layout/UserMenu.tsx:12-21` — `getInitials` frágil com emoji ZWJ (surrogate pair quebrada) e strings só-pontuação. Tratar junto com i18n de nomes.
- `src/components/layout/ProtectedRoute.tsx:37` — `<Navigate>` descarta `location.hash` ao construir `redirect=`. Projeto não usa rotas com hash hoje.
- `src/components/layout/AdminShell.tsx:20` — `<nav aria-label="Admin">` label curto/duplica badge. Polimento a11y para pass dedicado.
- `src/components/layout/AppShell.tsx:15-19` — `specialty-selector-slot` com `aria-hidden="true"` em div vazia (`flex-1`). Será substituído pelo SpecialtySelector na Story 2.8; risco de esquecer de remover `aria-hidden`.
- `src/components/layout/ProtectedRoute.tsx:41-47` — Sem reconciliação quando `profile` flutter (admin volta a admin depois de ser visto como student por ms). Depende de melhoria no AuthContext.
- `src/components/layout/AdminShell.tsx:23` — Admin mobile <768px sem navegação (tabs `hidden md:flex` sem drawer/hamburguer). AC5 aceita aviso não-bloqueante — decisão de produto revalidar no Epic 3.
- `src/components/layout/AdminShell.test.tsx:51-58` + `AppShell.test.tsx:41-50` — Asserts tautológicos sobre classes Tailwind (`max-w-screen-2xl`, `px-3`, `font-medium`). Refactor amplo para testes visuais/comportamentais em pass dedicado.
- `src/components/layout/ProtectedRoute.tsx:35` — `recoveryMode` tem precedência absoluta e não preserva intent original (`redirect=`). Fluxo raro (reset de senha).

## Deferred from: code review of story 1-7-recuperacao-de-senha (2026-04-14)

- `src/lib/schemas/reset-password.ts` — `.max(72)` conta caracteres JS (UTF-16 code units), não bytes; bcrypt limit é 72 bytes. Mantido consistente com `signup.ts` por design (spec Task 1.2). Revisitar junto com a regra de senha global.
- `src/lib/queries/auth.ts` (useSignup) — `LGPD_TERMS_VERSION` é referenciado em `mutationFn` antes da sua declaração `export const` no módulo; funciona por hoisting de closure, mas é frágil. Código de Story 1.5 (`done`). Refatorar junto com rework futuro de `auth.ts`.
- `src/lib/queries/auth.ts` (useResetPassword.onSuccess) — sem `queryClient.invalidateQueries(["profile", userId])` pós-reset. Risco baixo pois `signOut` limpa sessão; revisitar se surgir bug de cache.
- `src/lib/queries/auth.ts` (useLogout) — `mutationFn` sempre resolve (swallow + console.error); declaração `useMutation<void, Error, void>` sugere erros propagáveis que nunca ocorrem. Código Story 1.6.
- `src/pages/auth/ResetPassword.tsx` + `ResetPasswordForm.tsx` — comportamento cross-tab: recovery link aberto em tab B muda senha do user corrente em tab A; `signOut({ scope: "local" })` pode propagar SIGNED_OUT indesejado para tab A. Fora do escopo MVP; revisitar em AccountSettings (Story 5.2).
- `src/components/features/auth/ResetPasswordForm.tsx` — back-button após sucesso pode reabrir `/reset-password` sem sessão e exibir toast "Link inválido" pós-success. `navigate({ replace: true })` mitiga parcialmente; edge raro.

## Deferred from: story 1-7-recuperacao-de-senha (2026-04-14)

- Custom email template de recuperação (Supabase Dashboard → Authentication → Email Templates) — MVP usa template default em inglês; pt-BR custom diferido para Story 5.1 ou polimento pós-MVP.
- Rate limit custom para password reset — Supabase default 4/hora; ajuste via `supabase/config.toml` quando feedback indicar necessidade. Não alterar no MVP.
- `src/contexts/AuthContext.tsx` — Flag `recoveryMode` não sobrevive a F5 (reload em `/reset-password` perde o flag). Supabase mantém sessão temporária, então o formulário continua funcional — aceitável MVP. Revisitar se houver queixa de UX.
- Pós-reset usa `signOut({ scope: "local" })` — revoga só device atual. Alternativa `global` para "suspeita de invasão" fica para toggle em AccountSettings (Story 5.2).
- Sem teste E2E automatizado do fluxo completo email → link → reset. Requer SMTP mock + integração Inbucket (fora do escopo Vitest unit). Smoke manual (Task 9.5 d, h) cobre. Candidato a cobrir em Playwright quando bmad-testarch configurar.
- `isNeutralizableError` em `src/lib/queries/auth.ts` é defense-in-depth contra mudanças futuras de mensagem do Supabase. Revisar se a lib for atualizada (hoje 2.x estável).

## Deferred from: code review of story 1-5-cadastro-publico-signup-lgpd (2026-04-14)

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
- `src/pages/NotFound.tsx` — `console.error("404 Error: ...", location.pathname)` pode logar tokens/IDs em URL (risco baixo de PII no console do usuário). Usa `<a href="/">` em vez de `<Link>` do react-router, forçando full reload do SPA.

## Deferred from: code review of story 1-2-design-system-medway (2026-04-14)

- `tailwind.config.ts` — `boxShadow` customizado removido e tokens `--shadow-*` removidos de `src/index.css`. Verificar se nenhum primitive shadcn referencia `shadow-xs`/`shadow-2xs` silenciosamente resolvendo para vazio.
- `src/components/ui/chart.tsx:211` — `font-mono` usado com `fontFamily.mono` removido do config. Tailwind cai no stack default; mudança visual em tooltips. Charts não usados no MVP — revisitar quando chart aparecer em tela.
- `src/index.css` — `--sidebar-primary-foreground` navy sobre fundo teal pode ter contraste borderline para texto pequeno. Sidebar não usada no MVP; confirmar com design antes do Epic que usar.
- `eslint.config.js:8` — Diretório `supabase/` inteiro ignorado. Edge functions futuras (Story 3.3+, 4.5+, 5.3) escaparão do lint. Restringir ignore a `supabase/migrations/` quando a primeira function for criada.
- `src/App.tsx:5-10` — Validar em produção (`bun run build` + inspeção de `dist/assets/`) que o chunk de `DesignSystem` foi eliminado por tree-shake do `import.meta.env.DEV`.
- `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx` — Refactor `interface → type` violou anti-pattern "NÃO mexer em `src/components/ui/`"; reverter forçaria novo toque nos primitives shadcn, efeito desnecessário. Manter como está.
- `src/lib/calculations.ts:3` — `eslint-disable-next-line` adicionado e comentário com escapes `\u00e9`/`\u00e7` literais. Spec proíbe tocar `calculations.ts`; qualquer fix (reverter ou corrigir encoding) força novo toque. Resolver junto à extração para seeds SQL na Story 1.9.

## Deferred from: story 1-4-landing-page-publica-ssg (2026-04-14)

- Lighthouse mobile simulado (Slow 4G + 4× CPU throttle) mede FCP = 2.10s em 3 runs consistentes, ~100ms acima da meta AC3/NFR1 de <2s. Performance score = 97 (≥90 folgado). Gap é network-bound (bundle inicial ~117KB gzip JS + 12KB gzip CSS) sob simulação pessimista — real-device 4G deve ficar confortavelmente <2s. Otimização exige tirar `QueryClientProvider`/`TooltipProvider`/`Toaster`/`Sonner` do SSG inicial (contradiz Task 1.5 da Story 1.4). Revisitar na Story 1.11 (CI/CD) com bundle-splitting e possível `<GlobalUI>` client-only boundary. Validar novamente com medição real pós-deploy Vercel.
- `public/og-image.png` — placeholder 1200×630 cor sólida navy.900 (3.1KB). Substituir quando o time de marketing entregar asset final com logo + headline renderizados.

## Deferred from: code review of story 1-4-landing-page-publica-ssg (2026-04-14)

- **CTA `/signup` → 404 hoje**: Landing.tsx:13 aponta para `/signup` que não existe; será satisfeito pela Story 1.5 (cadastro público).
- **Meta tags apenas em `index.html`**: sem gerenciamento per-rota (Helmet/`vite-react-ssg` head). Reavaliar quando houver >1 rota pública.
- **Trailing-slash / case-sensitivity**: comportamento depende da config do host (Vercel). Validar na Story 1.11.
- **FCP 2.10s vs <2s NFR1 (~100ms gap)**: já registrado acima; bundle-splitting + possível `<GlobalUI>` client-only boundary na Story 1.11.

## Deferred from: story 1-5-cadastro-publico-signup-lgpd (2026-04-14)

- `/termos` e `/privacidade` linkados no checkbox LGPD → 404 até Story 5.1 entregar as páginas de termos/política de privacidade. Aceito como gap temporário da MVP.
- `/login` (link "Já tem conta?" na página Signup) e `/app` (redirect pós-signup) → 404 até Stories 1.6 (login/AuthContext) e 1.8 (ProtectedRoute/AppShell). A sessão Supabase já persiste em `localStorage` e será consumida por 1.6/1.8.
- Sem rate limit custom no `/signup` (sem Turnstile/captcha). Defer para Story 1.11 conforme architecture.md (gap importante #3).
- Sem password strength meter — MVP valida apenas `min(8)` via Zod; Supabase pode rejeitar via policy do projeto (erro mapeado para "Senha muito fraca").
- Combobox de faculdades com lista curada (~36 itens); entrada livre já suportada. Expansão via Story 1.9 (seeds) ou admin pós-MVP.

## Deferred from: story 1-6-login-logout-authcontext (2026-04-14)

- `/forgot-password` → 404 até Story 1.7 (link "Esqueci minha senha" no LoginForm). Trade-off aceito.
- `ProtectedRoute` HOC ainda não existe — `/app` e `/admin` são guardados por `useEffect` soft nas pages stub. Risk: flash visual de conteúdo autenticado antes do redirect. Fecha em Story 1.8.
- `AppShell` / `AdminShell` / Avatar menu não existem — CTA "Sair" é placeholder inline em stubs `src/pages/app/Home.tsx` e `src/pages/admin/Home.tsx`. Story 1.8 substitui pelas shells reais (arquitetura prevê `Dashboard.tsx` / equivalente).
- `useCurrentProfile` propaga erro de RLS/PGRST116 silenciosamente (profile=null). AuthProvider permanece funcional (user.email fallback no stub). RLS coberta em 1.3; refinar tratamento pós-Story 1.8 ou em retrospective do Epic.
- Redirect-por-role em `LoginForm.onSuccess` faz `supabase.from("profiles").select("role").single()` direto — exceção documentada à arch regra 4. Revisitar quando houver forma determinística de aguardar profile pós-SIGNED_IN (ex.: `useSuspenseQuery` em 1.8 + React Query v5 `ensureQueryData`).
- `signOut({ scope: "local" })` — revoga só o device atual. "Sair de todos os dispositivos" fica para AccountSettings (Story 5.2).
- Cross-tab sync via `onAuthStateChange` funciona out-of-the-box (storage events), mas sem teste automatizado — difícil reproduzir em Vitest. Smoke manual valida (Task 9.5.g).
- Baseline de warnings de lint permanece em 7 (todos em `src/components/ui/*`). Um `eslint-disable-next-line react-refresh/only-export-components` foi adicionado em `src/contexts/AuthContext.tsx` para o `AuthContext` value; `useAuth` está isolado em `src/contexts/useAuth.ts` para evitar o warning no hook. Alternativa: extrair o Context para arquivo próprio se a convenção for rígida.

## Deferred from: code review of story-1.6 (2026-04-14)

- `removeQueries({queryKey:["profile"]})` em SIGNED_OUT só limpa profile. Hoje único cache user-scoped, mas antes de Epic 2 introduzir queries de currículo/scores, trocar por `queryClient.clear()` (ou estratégia de prefixo) para evitar leak entre usuários. [src/contexts/AuthContext.tsx]
- `/login` flasha o LoginForm para usuário já autenticado em hard-refresh (SSG render + effect só client). Adicionar skeleton "Verificando sessão…" enquanto `loading=true`. [src/pages/auth/Login.tsx]
- `useCurrentProfile` sem `AbortSignal` — race silencioso em troca rápida de usuário; raro hoje, mitigar quando multi-tab/multi-user comum. [src/lib/queries/auth.ts]
- Header `/login` mostra texto "Medway" em vez de `<img src="/logo.svg" />` (spec Task 5.1). Trocar quando o asset for adicionado. [src/pages/auth/Login.tsx]

## Deferred from: story 1-8-protectedroute-appshell-adminshell (2026-04-15)

- `LoginForm` ainda não lê `?redirect=` do querystring. Story 1.8 **grava** o querystring em anonymous → /login redirect (`ProtectedRoute` passo 3), mas o login atual sempre volta para `/app` default. Deep-link em `/app/curriculo/X` → após login vai para `/app`, não para a rota pedida. Candidato para Story 1.11 ou patch pontual no `LoginForm` de 1.6. [src/components/features/auth/LoginForm.tsx]
- `LoginForm` não rotaciona destino por role — admin logando aterrisa em `/app` e precisa navegar manualmente para `/admin`. Arquitetura prevê ([architecture.md:391](../planning-artifacts/architecture.md#L391)) redirect `/admin` quando role=admin. Diferir junto com o `?redirect=` acima (mesma superfície). [src/components/features/auth/LoginForm.tsx]
- `UserMenu` tem apenas item "Sair" no MVP; "Minha conta" / "Alterar senha" / "Excluir conta" ficam para Story 5.2 (AccountSettings).
- Admin mobile: apenas aviso não-bloqueante visível <768px; sem hamburger menu ou responsive tabs. Decisão deliberada ([ux:801-807](../planning-artifacts/ux-design-specification.md#L801-L807)). Revisitar se feedback do Rcfranco indicar operação em tablet.
- Tabs admin "Regras" / "Leads" / "Histórico" renderizadas mas sem rota registrada — click leva a NotFound até Stories 3.1/3.4/3.6/4.x. Considerar placeholder "Em breve" se QA reclamar antes das stories 3.x.
- Badge "Admin" usa `variant="secondary"` neutro (token já do DS). Variante com cor de marca (teal Medway) fica para polimento 1.11 se necessário.
- Assets de logo Medway (SVG) não incluídos — usamos placeholder textual `"Medway"` nos shells + header `/login`. Trocar quando o asset chegar.
- Edge admin → `/app`: se um admin autenticado acessar `/app`, `ProtectedRoute role="student"` detecta mismatch e redireciona para `/app` (mesmo path) → loop potencial com toast repetido coalescido em 1 toast (microtask dedupe), mas *gera renders sem efeito útil*. Mitigação real: `LoginForm` role-aware (item acima) + opcional: em caso de mismatch em rota `student`, redirecionar para `/admin` em vez de `/app`. Registrar como ajuste da mesma PR futura.
- Edge StrictMode dev: `scheduleAccessRestrictedToast` usa microtask + módulo-flag para coalescer toasts; funciona em runtime e em test, mas depende de `queueMicrotask` estar disponível. Sonner via `toast.error(..., { id })` seria alternativa mais idiomática quando optar por remover o módulo-flag. [src/components/layout/ProtectedRoute.tsx]


## Deferred from: code review of story-1.9 (2026-04-15)

- **Story 3.4 — AdminRuleEditor ON CONFLICT polimorfico:** o seed idempotente usa `on conflict (institution_id, field_key) where specialty_id is null` ([supabase/seeds/rules_engine.sql](../../supabase/seeds/rules_engine.sql)), que só casa com o índice parcial. Quando o AdminRuleEditor inserir regras com `specialty_id NOT NULL`, o conflict target precisa ser `(institution_id, specialty_id, field_key)` — a tabela tem ambos os índices. Implementar seleção dinâmica do ON CONFLICT na camada de upsert.
- **Story 2.6 — Discriminated union TS para `scoring_rules.formula`:** hoje `formula: Json` em [src/lib/database.types.ts](../../src/lib/database.types.ts). Criar `src/lib/schemas/scoring-formula.ts` (Zod) cobrindo o contrato completo (`sum | threshold | tiered | bool | composite | custom | ruf_branch | floor_div | any_positive | any_true_or_positive`) e flags (`when_true`, `when_gt0`, `override_by`, `null_policy`, `aggregate`).
- **Story 2.5 — `calculate_scores` cobertura de operadores exóticos:** implementar em pgplsql todos os ops usados no seed — incluindo `custom` (`fn:"fmabc_monitoria"` em [seed:174](../../supabase/seeds/rules_engine.sql#L174)), `ruf_branch` (SCMSP formacao), `floor_div` (SES-DF social), `any_positive`/`any_true_or_positive` (FMABC/SCMSP), `aggregate:{sum_of:[...]}` (FMABC bloco_cientifico com `field:"artigos_total"` sintético). Sem implementação, regras retornam 0 silentemente.
- **Story 2.6 — CHECK de shape para `formula jsonb`:** adicionar validação Zod na escrita via admin (não no DB) garantindo `formula ? 'op'` e shape por operador.
- **Story 1.10 — Seed `curriculum_fields.sql` vs migration 0003:** glob alfabético `./seeds/*.sql` carrega `curriculum_fields.sql` antes de `rules_engine.sql`. Story 1.10 já traz migration 0003 (`public.curriculum_fields`) — validar que ordem filesystem + migration dependency stay aligned quando 1.10 mergear.


## Deferred from: code review of story 4-2-edge-export-leads-csv-hubspot (2026-04-17)

- **Sem validação de filtros na Edge Function** — Frontend valida; PostgREST parameteriza queries. Risco é resultado errado, não injection. Padrão pré-existente replicado do frontend.
- **Formatadores duplicados no test file** — Limitação Deno/Node impede import direto das funções da Edge Function. O test file re-implementa e documenta "keep in sync". Constraint arquitetural.
- **formatE164 corrompe números internacionais** — Sistema exclusivamente brasileiro; números internacionais fora de escopo. Se expandir para outros países, refatorar.
- **formatE164 ambíguo com DDD 55** — Heurística `startsWith("55") && length >= 12` é razoável para a escala atual. Números do DDD 55 (RS) sem prefixo de país podem ser mal interpretados. Aceitável até haver validação na entrada.

## Deferred from: code review of story 5-1-paginas-termos-politica-privacidade (2026-04-17)

- **Nenhum teste SSG smoke para páginas jurídicas** — só Landing tem `Landing.ssg.test.ts`. Se um componente futuro usar `window`/`localStorage` sem guard, regressão SSG passará despercebida. Padrão pré-existente (não introduzido por esta story).

## Deferred from: story 3-2-crud-regras-adminruleeditor-impactpreview (2026-04-17)

- **Re-entrada de scoring_rules por instituição** — Seed do Lovable usava taxonomia de "blocos" (`bloco_cientifico`, `bloco_extra`, `publicacoes`, `ic`, `extensao`, `formacao`, etc.) que não correspondem aos `field_key` de `curriculum_fields`. Os 75 registros foram deletados (sem alunos afetados). Regras devem ser re-inseridas pelo admin via CRUD `/admin/regras` usando as categorias e `field_key` corretos de `curriculum_fields` (Publicações, Acadêmico, Prática/Social, Liderança/Eventos, Perfil). Cada regra vincula-se a um campo granular (ex: `artigos_high_impact`, `ic_com_bolsa`, `monitoria_semestres`) em vez de blocos agregados.
- **RPC `preview_rule_impact` server-side** — Impact preview atual é client-side (MVP). Para produção com muitos alunos, criar RPC PL/pgSQL `preview_rule_impact(rule_data jsonb)` que calcula delta server-side com precisão, usando a lógica real de `calculate_scores` em vez de estimativa simplificada.
- **Campo `formula` no formulário admin** — Oculto na UI atual (default `{}`). Quando o motor de regras suportar fórmulas complexas (threshold, tiered, composite), reexpor o campo com editor visual ou assistido em vez de JSON cru.

## Deferred from: code review of story 3-2-crud-regras-adminruleeditor-impactpreview (2026-04-17)

- **Impact preview delta é flat (+weight)** — `previewRuleImpact` calcula `weight - current_weight` como delta uniforme para todos os alunos, ignorando a quantidade que cada aluno tem no campo. Delta real deveria ser `(novo_weight * quantidade) - score_atual`. Simplificação MVP aceita; corrigir com RPC server-side.
- **`specialty_interest` validação relaxada de enum para string** — Zod schema do signup trocou `z.enum(SPECIALTIES_TUPLE)` por `z.string().min(1)`. Qualquer string passa. Adicionar validação server-side (trigger ou check constraint) para garantir que o valor existe na tabela `specialties`.
- **`medical_schools` tabela sem migration formal** — Criada via SQL direto no dev local. Antes de homolog, criar migration em `supabase/migrations/` com CREATE TABLE + RLS + seed de dados.
- **`previewRuleImpact` como async direto** — Usa `useEffect` + async function em vez de React Query hook. Padrão aceitável para query efêmera one-shot. Migrar para `useQuery` se preview ficar complexo.
- **`useEffect` com `values` object reference** — Depende de `useState` manter referência estável. Se componente pai reconstruir `values` em cada render, effect re-dispara. Estável com padrão atual.
- **`editingRule?.weight` captura antes de batching** — `handlePublish` lê `editingRule.weight` e depois seta `editingRule=null` no mesmo tick. Funciona com React 18 auto-batching mas quebraria em callbacks async sem batching.

## Deferred from: code review of story-2.1 (2026-04-17)

- **W1 — `formatTimeAgo` nunca atualiza:** texto "há poucos segundos" fica stale indefinidamente até próximo save. Falta interval para re-render periódico. [AutosaveIndicator.tsx:11-17]
- **W2 — `categoryToValue` duplicada em 3 arquivos:** função idêntica em CurriculoFormSection.tsx, CurriculumSummary.tsx e Curriculo.tsx. Divergência silenciosa quebraria deep-links do accordion. Extrair para utility compartilhada.
- **W3 — `updated_at` definido client-side:** clock do cliente pode ser incorreto, afetando resolução de conflito draft vs servidor. Deveria usar timestamp retornado pelo servidor.
- **W4 — Transição offline→online não re-dispara save pendente:** dados ficam apenas em localStorage até próxima edição do usuário. [use-autosave.ts:48-52]
- **W5 — `conceito_historico` aceita string livre no schema Zod:** deveria validar contra options ["A","B","C"] do seed. Form UI usa Select corretamente, mas API aceita qualquer string via schema.
- **W6 — `curriculum_fields` vazio renderiza página em branco:** se seed não rodou, accordion vazio sem empty state ou mensagem de orientação.
- **W7 — `pb-safe` utility pode não estar configurado:** requer plugin Tailwind safe-area ou custom config. Verificar se projeto inclui essa utility.
- **W8 — Sync real-time entre dispositivos:** merge silencioso de draft local vs servidor pode sobrescrever dados editados em outro device. Implementar sync com Supabase Realtime + merge por campo em story futura.

## Deferred from: code review of story-5.2 (2026-04-17)

- **W1 — CORS wildcard `*` na Edge Function `delete-account`:** `Access-Control-Allow-Origin: *` permite qualquer origem invocar a função. Padrão arquitetural herdado (architecture.md). Restringir ao domínio da aplicação quando domínio de produção estiver definido.
- **W2 — CROSS JOIN em `benchmark_curriculum_completeness`:** query `curriculum_fields CROSS JOIN user_curriculum` produz produto cartesiano O(M×N) e calcula avg_fill_rate sobre todos os pares, não por usuário. Resultado correto apenas se cada user tem exatamente 1 row em `user_curriculum`. Redesenhar query quando houver mais dados.
- **W3 — Sem cron para refresh semanal das views materializadas (AC7):** `refresh_benchmarks()` existe para uso on-demand (chamada pela Edge Function e via RPC admin). Configurar `pg_cron` ou Supabase scheduled function para refresh semanal em produção.

## Deferred from: code review of story 3-3-log-historico-alteracoes-regras (2026-04-18)

- **W1 — Concurrent revert sem idempotência** — Dois admins revertendo a mesma entrada simultaneamente: UPDATE reverts geram 2 audit entries redundantes; DELETE reverts colidem na PK. Baixa probabilidade no MVP (equipe admin pequena, <500 registros).
- **W2 — `useAuditLog` carrega tabela inteira sem server-side limit** — Query faz `select(*)` sem `.limit()` ou `.range()`. Volume <500 no MVP é aceitável; implementar paginação server-side quando volume crescer.

## Deferred from: code review of story 2-4-detalhe-instituicao-scorehero-gapanalysis-disclaimer (2026-04-19)

- **W1 — `breakdown` sem null guard defensivo** — `Object.entries(breakdown)` em `GapAnalysisList.tsx` crasharia se breakdown viesse null do JSONB. Improvável (RPC `calculate_scores` sempre popula), mas defensivamente frágil. [GapAnalysisList.tsx:330]
- **W2 — `handleRetry` invalidação parcial quando userId é null** — Em `InstitutionDetail.tsx`, scores não são invalidados se userId for null no momento do click (ex: sessão expirou entre render e click). Institutions sempre invalidados. [InstitutionDetail.tsx:54-63]
- **W3 — Signed URL TTL vs staleTime assimétrico** — `useEditalUrl` cria signed URL com TTL 1h mas `staleTime` de 30min. React Query re-fetcha antes de expirar (seguro), mas gera chamada desnecessária. Inverso seria perigoso. [scoring.ts:249-251]
- **W4 — `parseRuleItems` renderização mista estruturada/texto** — Descrições com mix de itens com/sem pontuação `(Xpts)` resultam em lista com layout assimétrico no "Como pontuar". Depende de padronização das descrições nas scoring_rules. [GapAnalysisList.tsx:121-131]

## Deferred from: code review of story-2.3 (2026-04-17)

- **W1 — InstitutionDetail sem loading/404:** Placeholder da Story 2.4, sem skeleton/loading state e sem tratamento de ID inválido. Será implementado completo na Story 2.4 (ScoreHero + GapAnalysis).
- **W2 — `prefers-reduced-motion` ainda aplica fade 200ms:** WCAG 2.1 SC 2.3.3 sugere `animation: none` para usuários que pedem reduced motion. Atualmente faz apenas fade sem slide. Polimento a11y para pass dedicado.
- **W3 — Admin "Ver como aluno" escondido em mobile:** `AdminShell.tsx` — botão é `hidden md:inline-flex`. Admin mobile é deferral geral do Epic 3.
- **W4 — `useScores` re-trigger RPC em cada mount (staleTime:0):** Pré-existente da Story 2.2. Cada navegação para `/app` remonta e re-executa `calculate_scores` se não há scores. Otimizar com staleTime ou refetchOnMount: false.
