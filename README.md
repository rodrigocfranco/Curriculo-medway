# curriculo-medway

Projeto curriculo-medway: avaliação de perfil de candidatos a residência médica e matching com instituições.

## Stack

- Vite 5 + React 18 + TypeScript estrito
- Tailwind CSS + shadcn/ui
- React Query, react-hook-form, zod
- Vitest (testes)
- Supabase (backend — cliente singleton em `src/lib/supabase.ts`)
- Bun (gerenciador de pacotes — `bun.lockb`)

## Setup local

Pré-requisitos:

- [Bun](https://bun.sh) (`curl -fsSL https://bun.sh/install | bash`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- Docker Desktop rodando (necessário para `supabase start`)

Passos:

```sh
# 1. Instalar dependências
bun install

# 2. Subir a stack Supabase local (Postgres + Studio + Auth)
supabase start

# 3. Copiar o template de env e preencher a anon key
cp .env.example .env.local
# Pegue VITE_SUPABASE_ANON_KEY do output de `supabase status` e cole no .env.local

# 4. Rodar o dev server
bun dev
```

Dev server em `http://localhost:8080`.

Visite `/design-system` em dev para ver os tokens e primitives aplicados.

Para regenerar types após editar migrations: `supabase gen types typescript --local > src/lib/database.types.ts`.

## Scripts

- `bun dev` — Vite dev server
- `bun run build` — build de produção
- `bun run lint` — ESLint
- `bun run test` — Vitest (run once)
- `bun run test:watch` — Vitest watch mode
- `supabase start` / `supabase stop` — stack local
- `supabase status` — URLs e chaves locais
<!-- CI smoke test -->
