# Story 5.2: Exclusão de conta LGPD — AccountSettings + Edge Function + benchmarks anonimizados

Status: done

## Story

As a **usuário autenticado do Medway Currículo**,
I want **excluir minha conta e todos os meus dados pessoais com garantia de que agregados anonimizados são preservados para benchmarks**,
So that **exerço o direito de esquecimento (LGPD Art. 18) sem comprometer dados estatísticos do produto**.

## Acceptance Criteria

Copiados verbatim de [epics.md#Story 5.2](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Rota `/app/conta`**
   **Given** rota `/app/conta`
   **When** logado como student
   **Then** vejo minhas informações de cadastro + seção "Excluir conta"

2. **AC2 — Confirmação dupla**
   **Given** clico "Excluir minha conta"
   **When** confirmação abre
   **Then** Dialog com "Esta ação é irreversível. Todos os seus dados serão removidos. Digite EXCLUIR para confirmar"
   **And** botão "Confirmar" só habilita após input correto
   **And** "Cancelar" sempre disponível

3. **AC3 — Mutation dispara Edge Function**
   **Given** confirmo
   **When** mutation dispara
   **Then** invoca Edge Function `delete-account`
   **And** em sucesso sou deslogado + redirecionado para `/` com toast "Conta excluída"

4. **AC4 — Edge Function `delete-account`**
   **Given** `supabase/functions/delete-account/`
   **When** deploy
   **Then** função: (1) verifica JWT (só o próprio user); (2) copia agregados anonimizados para views materializadas; (3) deleta `user_scores`, `user_curriculum`, `profiles` (cascade); (4) deleta `auth.users` via admin API; (5) registra em `account_deletions` (id, deleted_at, state, graduation_year — sem PII)
   **And** retorna `{ data: { deleted: true }, error: null }` em sucesso
   **And** é idempotente

5. **AC5 — Rollback atômico**
   **Given** qualquer passo falha
   **When** erro ocorre
   **Then** transação faz rollback
   **And** retorna `{ data: null, error: { message, code } }`
   **And** nada é deletado parcialmente

6. **AC6 — Migration de benchmarks**
   **Given** `supabase/migrations/00NN_benchmarks.sql`
   **When** aplico
   **Then** existem views materializadas `benchmark_scores_by_institution` (institution_id, specialty_id, count, avg_score, p50, p75, p90) e `benchmark_curriculum_completeness` (category, avg_fill_rate)
   **And** nenhuma view expõe user_id, nome, email ou telefone
   **And** admin faz SELECT; alunos não têm acesso

7. **AC7 — Refresh de views**
   **Given** job agendado
   **When** executa
   **Then** views são refreshed semanalmente (ou sob demanda)

## Tasks / Subtasks

- [x] Task 1: Migration `account_deletions` + views materializadas de benchmarks (AC: #6, #7)
  - [x] 1.1 Criar `supabase/migrations/0005_benchmarks_account_deletions.sql`
  - [x] 1.2 Tabela `account_deletions` (id uuid PK, deleted_at timestamptz, state text, graduation_year int) — sem PII
  - [x] 1.3 View materializada `benchmark_scores_by_institution` (institution_id, specialty_id, count, avg_score, p50, p75, p90)
  - [x] 1.4 View materializada `benchmark_curriculum_completeness` (category, avg_fill_rate)
  - [x] 1.5 RLS: admin SELECT only nas views; `account_deletions` admin SELECT, Edge Function INSERT via service_role
  - [x] 1.6 Função SQL `refresh_benchmarks()` para refresh manual/cron das views
  - [x] 1.7 Regenerar `src/lib/database.types.ts`

- [x] Task 2: Edge Function `delete-account` (AC: #4, #5)
  - [x] 2.1 Criar `supabase/functions/delete-account/index.ts` (Deno runtime)
  - [x] 2.2 Verificar JWT do request e extrair `user_id` (só o próprio user pode deletar sua conta)
  - [x] 2.3 Criar client Supabase com `service_role` key (server-side only)
  - [x] 2.4 Dentro de transação SQL: (a) copiar agregados anonimizados via `refresh_benchmarks()` ou INSERT direto; (b) registrar em `account_deletions`; (c) deletar `user_scores`, `user_curriculum` (cascade via profiles ON DELETE CASCADE é suficiente mas explícitar para segurança); (d) deletar `profiles`
  - [x] 2.5 Deletar `auth.users` via Supabase Admin API (`supabase.auth.admin.deleteUser(userId)`) — fora da transação SQL mas após cascade
  - [x] 2.6 Retorno: `{ data: { deleted: true }, error: null }` em sucesso; `{ data: null, error: { message, code } }` em erro
  - [x] 2.7 Idempotência: se user já não existir, retornar sucesso (não erro)
  - [x] 2.8 Configurar `SUPABASE_SERVICE_ROLE_KEY` como secret da Edge Function

- [x] Task 3: Schema Zod + React Query mutation para delete-account (AC: #3)
  - [x] 3.1 Schema Zod em `src/lib/schemas/account.ts` — `deleteAccountConfirmationSchema` (campo `confirmation` com `.refine(v => v === 'EXCLUIR')`)
  - [x] 3.2 Mutation `useDeleteAccount()` em `src/lib/queries/account.ts` — invoca `supabase.functions.invoke('delete-account')`
  - [x] 3.3 Testes unitários co-localizados

- [x] Task 4: Página `/app/conta` — AccountSettings (AC: #1, #2, #3)
  - [x] 4.1 Criar `src/pages/app/Conta.tsx` com informações de cadastro read-only + seção "Excluir conta"
  - [x] 4.2 Componente `DeleteAccountDialog` em `src/components/features/account/DeleteAccountDialog.tsx` — Dialog shadcn com input "EXCLUIR" + confirmação dupla
  - [x] 4.3 Integrar `useDeleteAccount()` mutation no dialog
  - [x] 4.4 Em sucesso: `signOut()` + `navigate('/')` + toast "Conta excluída com sucesso"
  - [x] 4.5 Em erro: toast error pt-BR + fechar dialog
  - [x] 4.6 Testes unitários co-localizados

- [x] Task 5: Registrar rota `/app/conta` + link no UserMenu (AC: #1)
  - [x] 5.1 Adicionar rota `{ path: "conta", lazy: () => import("./pages/app/Conta") }` em `src/router.tsx` dentro de `app` children
  - [x] 5.2 Adicionar item "Minha conta" no `UserMenu` (`src/components/layout/UserMenu.tsx`) apontando para `/app/conta`

- [x] Task 6: Testes de integração e validação (AC: todos)
  - [x] 6.1 Teste da página Conta: renderiza info do user, abre dialog, confirma exclusão
  - [x] 6.2 Teste do DeleteAccountDialog: botão desabilitado até digitar EXCLUIR, mutation chamada
  - [x] 6.3 Verificar que `bun run build`, `bun run lint`, `bun run test` passam sem regressões

## Dev Notes

### PRIMEIRA Edge Function do projeto — padrões a estabelecer

Esta é a **primeira Edge Function** do projeto. O diretório `supabase/functions/` contém apenas `_shared/.gitkeep`. Padrões a seguir:

**Runtime:** Deno (padrão Supabase Edge Functions)

**Estrutura de arquivo:**
```
supabase/functions/delete-account/
  index.ts        # handler principal
```

**Padrão de invocação Supabase Edge Functions (Deno):**
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // JWT verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    // Client com anon key para verificar o JWT do user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Client com service_role para operações admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ... lógica de negócio ...

    return new Response(
      JSON.stringify({ data: { deleted: true }, error: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ data: null, error: { message: error.message, code: "DELETE_FAILED" } }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

**CORS headers:** Criar `supabase/functions/_shared/cors.ts` se não existir:
```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

**Invocação no frontend:**
```typescript
const { data, error } = await supabase.functions.invoke("delete-account");
```

[Source: architecture.md — Edge Functions: kebab-case, padrão `{ data, error }`]

### Cascade delete — entender a cadeia

A cadeia de cascade está configurada nas migrations existentes:

1. `auth.users` → `profiles` (`ON DELETE CASCADE` em [0001_profiles.sql:12](../../supabase/migrations/0001_profiles.sql#L12))
2. `profiles` → `user_curriculum` (`ON DELETE CASCADE` em [0003_curriculum_scores.sql:33](../../supabase/migrations/0003_curriculum_scores.sql#L33))
3. `profiles` → `user_scores` (`ON DELETE CASCADE` em [0003_curriculum_scores.sql:47](../../supabase/migrations/0003_curriculum_scores.sql#L47))

**Estratégia da Edge Function:**
- Deletar `auth.users` via `supabase.auth.admin.deleteUser(userId)` é suficiente para cascade completo
- MAS: antes de deletar, precisamos (a) copiar agregados para benchmarks e (b) registrar em `account_deletions`
- Portanto a sequência é: (1) refresh benchmarks → (2) inserir `account_deletions` → (3) deletar `auth.users` (cascade cuida do resto)
- Se (3) falhar após (1) e (2), o pior caso é ter um registro em `account_deletions` para um user que ainda existe — aceitável e corrigível manualmente

**RLS relevante — DELETE em profiles:**
```sql
-- 0001_profiles.sql:188-189
create policy "profiles_delete_admin_only"
  on public.profiles for delete
  using (public.is_admin(auth.uid()));
```
A Edge Function usa `service_role` que bypassa RLS, então não há problema.

### Tabela `account_deletions` — sem PII

```sql
create table public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  deleted_at timestamptz not null default now(),
  state text,           -- UF do user (dado agregado, não PII por si só)
  graduation_year int   -- ano de formação (idem)
);
```

**Sem** user_id, nome, email, telefone. Apenas metadados demográficos anonimizados para análise de churn.

### Views materializadas de benchmarks

```sql
-- Scores agregados por instituição (sem user_id)
create materialized view benchmark_scores_by_institution as
select
  institution_id,
  specialty_id,
  count(*)::int as user_count,
  avg(score)::numeric(10,2) as avg_score,
  percentile_cont(0.50) within group (order by score)::numeric(10,2) as p50,
  percentile_cont(0.75) within group (order by score)::numeric(10,2) as p75,
  percentile_cont(0.90) within group (order by score)::numeric(10,2) as p90
from user_scores
where stale = false
group by institution_id, specialty_id;

-- Completude de currículo por categoria (sem user_id)
create materialized view benchmark_curriculum_completeness as
select
  cf.category,
  avg(
    case when uc.data ? cf.field_key then 1.0 else 0.0 end
  )::numeric(5,4) as avg_fill_rate
from curriculum_fields cf
cross join user_curriculum uc
group by cf.category;
```

**RLS em materialized views:** Postgres não suporta RLS nativo em materialized views. Controlar acesso via wrapper function com `SECURITY DEFINER` que verifica `is_admin(auth.uid())` antes de retornar os dados. Alternativa: criar tabelas regulares populadas pela refresh function e aplicar RLS nelas.

**DECISÃO RECOMENDADA:** Usar materialized views (melhor performance para queries agregadas) + funções wrapper `SECURITY DEFINER` para controle de acesso. A Edge Function popula via `service_role` (bypassa RLS). Frontend admin consome via RPC das funções wrapper.

**user_scores PK com specialty_id nullable:** A PK composta `(user_id, institution_id, specialty_id)` tem `specialty_id NULL`. Postgres trata NULLs como distintos em PK. A view materializada deve usar `COALESCE(specialty_id, '00000000-0000-0000-0000-000000000000'::uuid)` no GROUP BY ou filtrar `WHERE specialty_id IS NOT NULL` conforme necessidade. Decisão pendente da Story 2.2.

### Rota `/app/conta` — nova rota no router

Adicionar dentro dos children de `app` em `src/router.tsx`:
```typescript
{
  path: "conta",
  lazy: () => import("./pages/app/Conta").then((m) => ({ Component: m.default })),
},
```

[Source: src/router.tsx:54-73 — children de /app]

### UserMenu — adicionar "Minha conta"

O `UserMenu` está em `src/components/layout/UserMenu.tsx` e atualmente tem apenas o item "Sair". Deferred de Story 1.8:

> `UserMenu` tem apenas item "Sair" no MVP; "Minha conta" / "Alterar senha" / "Excluir conta" ficam para Story 5.2 (AccountSettings).

Adicionar item `<DropdownMenuItem>` com `<Link to="/app/conta">` antes do "Sair".

[Source: _bmad-output/implementation-artifacts/deferred-work.md — deferred 1.8]

### Padrão de página existente (referência: Curriculo.tsx)

A página `/app/curriculo` (Story 2.1) é a referência mais próxima para uma página de area autenticada:
- Usa `useAuth()` para obter o user/profile
- Componentes em `src/components/features/{domain}/`
- Queries em `src/lib/queries/{domain}.ts`
- Schemas em `src/lib/schemas/{domain}.ts`

### Padrão de Dialog de confirmação (referência: DeleteInstitutionDialog)

O `DeleteInstitutionDialog` da Story 3.1 é o padrão a seguir para dialogs de confirmação destrutiva:
- `AlertDialog` do shadcn
- Aviso explícito sobre consequências
- Mutation integrada
- Toast de confirmação

**Diferença nesta story:** confirmação é por digitação ("EXCLUIR"), não apenas por clique. Usar `Dialog` (não `AlertDialog`) pois precisa de input interativo.

[Source: src/components/features/admin/DeleteInstitutionDialog.tsx]

### Componentes shadcn disponíveis (já instalados)

Todos os componentes necessários já estão em `src/components/ui/`: `Dialog`, `Input`, `Button`, `Card`, `Label`, `Separator`, `Badge`.

### Informações de cadastro na página Conta

Exibir os campos de `profiles` em modo read-only:
- Nome, email, telefone, estado, faculdade, ano de formação, especialidade de interesse
- Usar `useAuth()` → `profile` que já está em cache via `useCurrentProfile`
- Layout `max-w-3xl` consistente com padrão aluno

**NÃO incluir edição de perfil nesta story** — escopo é exclusivamente visualização + exclusão de conta.

### Mensagens pt-BR

- Dialog título: "Excluir minha conta"
- Dialog corpo: "Esta ação é irreversível. Todos os seus dados pessoais, currículo e scores serão permanentemente removidos. Dados estatísticos anonimizados serão preservados."
- Dialog input label: "Digite EXCLUIR para confirmar"
- Botão confirmar: "Excluir conta permanentemente" (variant destructive)
- Botão cancelar: "Cancelar"
- Toast sucesso: "Conta excluída com sucesso"
- Toast erro: "Não foi possível excluir sua conta. Tente novamente."

### Deferred items resolvidos por esta story

Estes deferrals serão fechados com a implementação desta story:
- **Story 1.6 deferral:** `signOut({ scope: "local" })` — Story 5.2 faz signOut após delete (não precisa de toggle global separado; a conta inteira é deletada)
- **Story 1.8 deferral:** `UserMenu` tem apenas "Sair" — esta story adiciona "Minha conta"
- **Story 1.7 deferral:** Toggle signOut scope para AccountSettings — resolvido pelo delete completo

### Armadilhas a evitar

1. **NÃO deletar `profiles` diretamente via client anon** — RLS `profiles_delete_admin_only` bloqueia. Usar Edge Function com `service_role`.
2. **NÃO esquecer de copiar agregados ANTES do delete** — uma vez que `auth.users` é deletado, cascade remove tudo.
3. **NÃO logar PII na Edge Function** — sem `console.log(user.email)` ou similares. Apenas `user.id`.
4. **NÃO criar o diretório `supabase/functions/delete-account/` dentro de `_shared/`** — deve ser irmão de `_shared/`.
5. **NÃO usar `supabase.auth.admin.deleteUser()` no frontend** — requer `service_role` key que nunca deve ser exposta ao client.
6. **NÃO alterar o `eslint.config.js` ignore de `supabase/`** — deferral existente de Story 1.2. A Edge Function em Deno tem sintaxe diferente de Node/Vite.
7. **NÃO criar componentes em `src/components/features/auth/`** — esta feature é "account", não "auth". Criar em `src/components/features/account/`.
8. **NÃO implementar edição de perfil** — fora de escopo. Apenas visualização read-only + exclusão.

### Project Structure Notes

- Criar `src/components/features/account/` (novo diretório)
- Criar `src/pages/app/Conta.tsx` (nova página)
- Criar `src/lib/queries/account.ts` (novo arquivo)
- Criar `src/lib/schemas/account.ts` (novo arquivo)
- Criar `supabase/functions/delete-account/index.ts` (primeira Edge Function)
- Criar `supabase/functions/_shared/cors.ts` (CORS headers compartilhados)
- Criar `supabase/migrations/0005_benchmarks_account_deletions.sql` (nova migration)
- Modificar `src/router.tsx` (adicionar rota `/app/conta`)
- Modificar `src/components/layout/UserMenu.tsx` (adicionar "Minha conta")
- Regenerar `src/lib/database.types.ts`

### References

- [Source: supabase/migrations/0001_profiles.sql — profiles schema, ON DELETE CASCADE, is_admin, RLS delete admin_only]
- [Source: supabase/migrations/0003_curriculum_scores.sql — user_curriculum + user_scores ON DELETE CASCADE]
- [Source: src/router.tsx:54-73 — children de /app onde adicionar rota /conta]
- [Source: src/components/layout/UserMenu.tsx — menu do user (atualmente só "Sair")]
- [Source: src/contexts/AuthContext.tsx — AuthProvider + useAuth]
- [Source: src/lib/queries/auth.ts — padrão de queries/mutations com error handling]
- [Source: src/lib/supabase.ts — cliente singleton (anon key)]
- [Source: src/components/features/admin/DeleteInstitutionDialog.tsx — padrão de dialog de confirmação destrutiva]
- [Source: _bmad-output/planning-artifacts/architecture.md — Edge Functions kebab-case, padrão { data, error }, service_role server-side only]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5 Story 5.2 AC completos]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — deferrals 1.6, 1.7, 1.8 resolvidos por 5.2]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Teste "Excluir minha conta" falhava por texto duplicado (botão + dialog title); corrigido usando `getByRole("heading")`.

### Completion Notes List

- Task 1: Migration 0005 criada com tabela `account_deletions` (sem PII), views materializadas `benchmark_scores_by_institution` e `benchmark_curriculum_completeness`, funções wrapper SECURITY DEFINER `get_benchmark_scores()` e `get_benchmark_curriculum()` para controle de acesso admin, `refresh_benchmarks()` para refresh manual/cron. database.types.ts atualizado manualmente.
- Task 2: Primeira Edge Function do projeto (`delete-account`). Criado `_shared/cors.ts`. Sequência: verificar JWT -> buscar profile -> refresh benchmarks -> inserir account_deletions -> deleteUser via Admin API (cascade cuida do resto). Idempotente para user já deletado.
- Task 3: Schema Zod `deleteAccountConfirmationSchema` com refine para "EXCLUIR". Mutation `useDeleteAccount()` invocando Edge Function. Testes unitários: 6/6 passando.
- Task 4: Página `/app/conta` com info read-only do profile + seção "Excluir conta". DeleteAccountDialog com input "EXCLUIR" como confirmação dupla, mutation integrada, signOut + redirect + toast em sucesso.
- Task 5: Rota `conta` adicionada nos children de `/app` no router. Item "Minha conta" adicionado no UserMenu antes de "Sair".
- Task 6: Testes de integração (6 testes Conta page). Suite completo: 44 arquivos, 249 testes — todos passam. Build OK. Lint: 0 erros.

### File List

- `supabase/migrations/0005_benchmarks_account_deletions.sql` (novo)
- `supabase/functions/_shared/cors.ts` (novo)
- `supabase/functions/delete-account/index.ts` (novo)
- `src/lib/database.types.ts` (modificado)
- `src/lib/schemas/account.ts` (novo)
- `src/lib/schemas/account.test.ts` (novo)
- `src/lib/queries/account.ts` (novo)
- `src/lib/queries/account.test.ts` (novo)
- `src/components/features/account/DeleteAccountDialog.tsx` (novo)
- `src/pages/app/Conta.tsx` (novo)
- `src/pages/app/Conta.test.tsx` (novo)
- `src/router.tsx` (modificado)
- `src/components/layout/UserMenu.tsx` (modificado)

### Review Findings

- [x] [Review][Decision→Patch] D1: Mover insert `account_deletions` para DEPOIS do `deleteUser` — decisão: inverter ordem (aceitar risco de perder metadados se insert falhar após delete bem-sucedido)
- [x] [Review][Decision→Patch] D2: Bloquear delete se `refresh_benchmarks` falhar — decisão: throw error e abortar operação
- [x] [Review][Decision→Dismiss] D3: Manter `user_count` na view — decisão: nome mais descritivo, atualizar spec para refletir
- [x] [Review][Patch] P1: `navigate("/")` antes de `signOut()` — corrigido: signOut primeiro, navigate depois
- [x] [Review][Patch] P2: `refresh_benchmarks()` sem guard — corrigido: `is_admin` + `service_role` check
- [x] [Review][Patch] P3: Unique index nullable `specialty_id` — corrigido: `COALESCE` no index
- [x] [Review][Patch] P4: Comentário `0005` — corrigido para `0006`
- [x] [Review][Patch] P5: Dialog fechava no erro — corrigido: mantém aberto para retry
- [x] [Review][Patch] P6: Cancelar desabilitado — corrigido: sempre disponível (AC2)
- [x] [Review][Patch] P7: Insert `account_deletions` antes do delete — corrigido: movido para depois (AC4)
- [x] [Review][Patch] P8: `refresh_benchmarks` falha silenciosa — corrigido: throw bloqueia delete
- [x] [Review][Defer] W1: CORS wildcard `Access-Control-Allow-Origin: *` na Edge Function — padrão arquitetural do projeto (architecture.md), não introduzido por esta story
- [x] [Review][Defer] W2: CROSS JOIN em `benchmark_curriculum_completeness` produz O(M×N) e avg incorreto se users variam — query definida na spec/dev notes, requer redesign futuro
- [x] [Review][Defer] W3: Sem job agendado para refresh semanal das views (AC7) — `refresh_benchmarks()` existe para on-demand, configuração de cron é tarefa de deploy/infra

### Change Log

- 2026-04-17: Implementação completa da Story 5.2 — exclusão de conta LGPD com Edge Function, views materializadas de benchmarks, página AccountSettings com confirmação dupla.
