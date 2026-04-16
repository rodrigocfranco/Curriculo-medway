# Architecture Deviations

Registro de desvios deliberados da arquitetura canônica ([`_bmad-output/planning-artifacts/architecture.md`](../_bmad-output/planning-artifacts/architecture.md)). Cada entrada documenta _por que_ o desvio foi aceito e _quando_ revisitar.

## 2026-04-15 — Story 1.11 (CI/CD)

- **Sentry source maps não uploadados no MVP.** Trade-off: stacktraces minificados em produção. Rationale: 1 dev, build determinístico, setup adicional (`@sentry/vite-plugin`) não justifica no MVP. Revisitar em Fase 2 se volume de bugs de produção exigir debug de stack detalhado.
- **Health endpoint é JSON estático em `public/api/health.json`, não Edge Function.** Trade-off: não valida banco. Rationale: frontend up implica stack up (Supabase down → Sentry captura erros reais); economiza quota de Edge Function; latência <100ms vs ~500ms cold start. Revisitar se surgir caso onde CDN está up mas Supabase está down sem alertar.
- **`vite-react-ssg` filtra rotas privadas via `includedRoutes` em `main.tsx`, não via `ssg.crawlExcludes` no `vite.config.ts`.** Rationale: `includedRoutes` é a API real do `vite-react-ssg` (a docs usa `crawlExcludes` como nome conceitual). Mesmo efeito — rotas privadas não são pré-renderizadas.
- **Sentry Session Replay desabilitado.** Rationale: LGPD (replay captura DOM que pode conter PII) + quota free tier limitada. Revisitar se surgir necessidade de debug de UX pós-launch com consentimento explícito LGPD.
- **Admin bootstrap via SQL manual, não UI.** Rationale: único admin (Rcfranco) — criar UI para 1 usuário é overkill. Documentado em `docs/deployment.md`. Epic 3 (CRUD admin) não contempla criar outros admins — se precisar, evoluir.
- **`database.types.ts` recebe comentário-marca `// GERADO — não editar manualmente` na linha 1, que não é emitido pelo `supabase gen types`.** Rationale: permite que o drift gate no CI use `tail -n +2` para ignorar a marca; o workflow injeta a mesma linha no arquivo temporário antes de comparar. Manter a marca ao rodar `supabase gen types typescript --local > src/lib/database.types.ts` — o desenvolvedor precisa re-adicionar no topo.

