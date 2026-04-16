# Deployment — curriculo-medway

Guia operacional para deploy, observabilidade, monitoramento e migrations em produção.

Última revisão: 2026-04-15 (Story 1.11).

---

## Pré-requisitos (contas)

- **GitHub** — repositório `medway/curriculo-medway` (plano Free/Team/Enterprise — required reviewers exigem Team+ em repos privados; ver §GitHub Environments).
- **Railway** — plano pago; deploy via Dockerfile (Nginx + Bun build).
- **Supabase** — um projeto:
  - `curriculo-medway-prod` — usado por Vercel Preview e Production (MVP, 1 dev). Separar staging quando houver usuários reais em produção.
- **Sentry** — organização Medway; um project:
  - `curriculo-medway` — Preview e Production separados via `VITE_APP_ENV` (campo `environment` nos eventos).
- **UptimeRobot** — plano Free (50 monitors, 5min interval).
- **Domínio** — `curriculo.medway.com.br` registrado e delegável ao Vercel.

---

## Ambiente Supabase

1. Criar 1 projeto no [Supabase Dashboard](https://supabase.com/dashboard) — região preferida `sa-east-1` (São Paulo) para latência.
2. Copiar:
   - `Project URL` e `anon public key` (Settings → API).
   - `Project ref` (Settings → General) para uso em `db-push.yml`.
   - Definir senha do Postgres (Settings → Database) para `SUPABASE_DB_PASSWORD`.
3. Bootstrap inicial do schema (uma vez só):
   ```bash
   supabase link --project-ref <prod-ref>
   supabase db push --password <senha>
   ```
4. Preview e Production no Vercel usam o mesmo projeto Supabase no MVP (1 dev). Separar staging quando houver usuários reais.

---

## Railway Setup

### Import do projeto

1. Railway Dashboard → **New Project** → **Deploy from GitHub Repo** → selecionar `curriculo-medway`.
2. Railway detecta o `Dockerfile` automaticamente (Nginx + Bun multi-stage build).
3. Não é necessário configurar build/start commands — o Dockerfile cuida de tudo.

### Como funciona o deploy

- `Dockerfile` faz build multi-stage: Bun instala deps + builda → Nginx serve `dist/`
- `nginx.conf` configura: SPA catch-all, cache immutable em `/assets/*`, headers de segurança, health endpoint
- Railway injeta `PORT` e as env vars como build args automaticamente

### Domínio customizado

1. Service → Settings → Networking → Custom Domain → `curriculo.medway.com.br`.
2. Seguir instruções DNS (CNAME para o domínio gerado pelo Railway).
3. Railway provisiona SSL automaticamente via Let's Encrypt.

### Env Vars (Service → Variables)

| Nome                    | Valor                    | Notas                                             |
| ----------------------- | ------------------------ | ------------------------------------------------- |
| `VITE_SUPABASE_URL`     | URL do projeto Supabase  | Frontend                                          |
| `VITE_SUPABASE_ANON_KEY`| Anon key do projeto      | Frontend — NUNCA service_role                     |
| `VITE_SENTRY_DSN`       | DSN do Sentry (ou vazio) | Vazio desliga Sentry (gate por PROD+DSN)          |
| `VITE_APP_ENV`          | `production`             | Usado como `environment` no Sentry                |
| `VITE_RELEASE`          | `$RAILWAY_GIT_COMMIT_SHA`| Railway injeta o SHA do commit automaticamente    |

**NUNCA** colocar `SUPABASE_SERVICE_ROLE_KEY` como var de frontend — serve só para Edge Functions server-side.

### Supabase Auth — Redirect URLs

Supabase Dashboard → Authentication → URL Configuration → Redirect URLs — adicionar no projeto:

- `https://curriculo.medway.com.br/**`
- `https://*.up.railway.app/**` (wildcard para deploys Railway)
- `http://localhost:*` (dev local)
- `http://127.0.0.1:*` (dev local)

Fecha o TODO deixado em [supabase/config.toml:150-162](../supabase/config.toml).

### Email confirmation flag

Supabase Dashboard → Authentication → Providers → Email → **Confirm email**:

- Default Supabase local dev: **DISABLED** (signup já autentica direto).
- **Recomendado MVP:** manter DISABLED em prod. Se habilitar, o redirect pós-signup (`/app`) quebra — usuário precisa ver uma página "Confirme seu email" antes (follow-up 1.5.1).
- Documentar estado atual aqui após decidir:
  - [ ] prod: ___

### Admin Bootstrap

Não há UI para criar admin no MVP. Bootstrap manual via SQL no projeto de produção (Supabase Dashboard → SQL Editor):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'rodrigo.franco@medway.com.br';
```

Rodar **depois** que o usuário fez signup pela primeira vez (assim `profiles.id` já existe via trigger `handle_new_user`).

---

## GitHub Environments (required reviewers para db-push)

1. Settings → Environments → New environment → `production`.
2. **Required reviewers:** `rodrigocfranco`.
   - ⚠️ **Planos Free de repos privados não permitem required reviewers.** Se for esse o caso, o guard alternativo no `db-push.yml` é fraco (basta alterar código). Considerar upgrade ou mover repo para público/Team.
3. **Environment secrets** (Settings → Environments → production → Add secret):
   - `SUPABASE_ACCESS_TOKEN` — obter em https://supabase.com/dashboard/account/tokens
   - `SUPABASE_PROJECT_ID` — ref do projeto de produção
   - `SUPABASE_DB_PASSWORD` — senha do Postgres de produção
4. Verificar que os secrets **não** estão replicados em repo-level.

---

## Branch Protection (main)

Settings → Branches → Branch protection rules → `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging:
  - `Quality (lint + typecheck + test + build)`
  - `Schema drift (database.types.ts)`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings (opcional, recomendado)

---

## Sentry Setup

1. Criar 1 project em https://sentry.io (organização Medway):
   - `curriculo-medway` — platform: React
2. Copiar DSN → configurar em Vercel (§Env Vars). Preview e Production usam o mesmo DSN; o campo `environment` (`preview` vs `production`) separa eventos no dashboard.
3. Em cada project, Settings → General → confirmar:
   - **Data Scrubbing:** habilitado (defense-in-depth; o `beforeSend` client já faz scrub).
   - **Store Native Stacktraces:** desnecessário (SPA JS).
4. Quotas free tier: 5k erros/mês — suficiente para MVP com 1 dev.
5. **Session Replay:** **DESABILITADO** no MVP (LGPD + quota). Revisitar se volume de UX bugs justificar.
6. **Source maps upload:** **NÃO** configurado no MVP. Stack traces minificados são aceitáveis (1 dev, build determinístico). Revisitar em Fase 2 com `@sentry/vite-plugin`.

---

## Uptime Monitoring (UptimeRobot)

1. Login em https://uptimerobot.com (conta gratuita).
2. Criar 2 monitors (Type: HTTP(s), interval 5min):
   | Nome               | URL                                              | Keyword       | Expect |
   | ------------------ | ------------------------------------------------ | ------------- | ------ |
   | Landing            | `https://curriculo.medway.com.br/`               | `Medway`      | exists |
   | Health             | `https://curriculo.medway.com.br/api/health`     | `"status":"ok"` | exists |
3. My Settings → Alert Contacts → adicionar email `rodrigo.franco@medway.com.br`.
4. Cada monitor → Edit → Alert Contacts to Notify → marcar o email.
5. (Opcional) Public Status Page → criar → link aqui:
   - Dashboard público: _(preencher após criar)_

NFR22 (uptime 99%) observável via histórico do monitor.

---

## Migrations para Produção

Nunca rode `supabase db push` manualmente contra produção. Use o workflow:

1. Merge do PR com migration em `main` (CI valida via `supabase db reset` em DB efêmero).
2. GitHub → Actions → **DB Push (Production)** → Run workflow.
3. Primeiro run: `dry_run = true` → aprovar no environment gate → ler output do `supabase db diff --linked`.
4. Revisar o diff. Se OK:
5. Segundo run: `dry_run = false` → aprovar → `supabase db push` aplica migrations.
6. Verificar em Supabase Dashboard → Database → Migrations que a versão nova apareceu.
7. Rodar smoke test (ver §Smoke Test) para garantir que o frontend em prod continua funcionando.

**Rollback:** não existe `db rollback` no Supabase CLI. Rollback = escrever migration reversa e repetir o processo.

---

## Rollback (frontend)

Railway → Service → Deployments → encontrar deploy anterior → **Rollback**. Reverte em segundos.

**Nunca** rodar `supabase db reset --linked` contra produção (DANGER: apaga dados).

---

## Smoke test end-to-end

Executar após qualquer mudança estrutural (deploy, migration, env vars):

- [ ] Abrir PR de teste → `quality` e `types-drift` verdes
- [ ] Railway deploy do branch funciona
- [ ] URL de deploy renderiza landing + `/signup` funciona
- [ ] `throw new Error("sentry-smoke")` em dev console → evento chega no Sentry sem PII
- [ ] Pausar UptimeRobot monitor → voltar → emails de down/up chegam
- [ ] `db-push` workflow com `dry_run=true` → approval gate acionado + diff printado
- [ ] Merge em `main` → deploy de produção OK
- [ ] `curl https://curriculo.medway.com.br/api/health` → `{"status":"ok",...}`
- [ ] `curl https://curriculo.medway.com.br/app` → HTTP 200 com SPA index (rewrite OK)
- [ ] `ls dist/*.html` após build → apenas rotas públicas (sem `app.html`/`admin.html`/`signup.html`)

---

## Referências

- Story canônica: [`_bmad-output/implementation-artifacts/1-11-ci-cd-completo.md`](../_bmad-output/implementation-artifacts/1-11-ci-cd-completo.md)
- Arquitetura: [`_bmad-output/planning-artifacts/architecture.md`](../_bmad-output/planning-artifacts/architecture.md)
- Desvios: [`docs/architecture-deviations.md`](./architecture-deviations.md)
