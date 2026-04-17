# Story 4.2: Edge Function export-leads — CSV + formato Hubspot

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **admin (Rcfranco) do curriculo-medway**,
I want **exportar leads para CSV padrão ou formato compatível com Hubspot a partir da página de leads, respeitando os filtros ativos**,
so that **uso os dados fora da plataforma para análise e importo diretamente no CRM Hubspot sem manipulação manual de colunas**.

## Acceptance Criteria

Baseados em [epics.md#Story 4.2](../planning-artifacts/epics.md) — seção "Story 4.2: Edge Function export-leads — CSV + formato Hubspot". **Nenhum AC pode ser cortado.**

### AC1 — Edge Function `export-leads` aceita formato CSV padrão

**Given** `supabase/functions/export-leads/index.ts` deployada
**When** invoco com `{ filters: {...}, format: "csv" }` e JWT admin válido
**Then** retorna stream CSV com encoding UTF-8 + BOM (`\uFEFF`) para compatibilidade Excel
**And** headers HTTP: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="leads-YYYY-MM-DD.csv"`
**And** colunas: `nome,email,telefone,estado,faculdade,ano_formacao,especialidade,data_cadastro`
**And** valores de data em formato `DD/MM/YYYY` (padrão brasileiro)
**And** campos nulos renderizados como string vazia (não "null")
**And** processa 10.000 registros em <10s (NFR4)

### AC2 — Edge Function `export-leads` aceita formato Hubspot

**Given** invoco com `{ filters: {...}, format: "hubspot" }` e JWT admin válido
**When** processa
**Then** retorna CSV com headers compatíveis com importação Hubspot (NFR19): `First Name,Last Name,Email,Phone,State/Region,Company,Graduation Year,Specialty,Registration Date`
**And** telefone formatado em E.164 (`+55XXXXXXXXXXX`) — se já tem +55 não duplica; se não tem, prepend +55; se vazio, string vazia
**And** nome quebrado em First Name / Last Name pelo primeiro espaço (se não tem espaço, tudo em First Name, Last Name vazio)
**And** `Company` mapeado de `university`
**And** encoding UTF-8 com BOM
**And** filename: `leads-hubspot-YYYY-MM-DD.csv`

### AC3 — Verificação JWT admin server-side

**Given** request sem Authorization header ou com JWT de role `student`
**When** invoco a Edge Function
**Then** retorna `{ data: null, error: { message: "Unauthorized", code: "UNAUTHORIZED_ROLE" } }` com status 403
**And** nunca expõe dados de leads

### AC4 — Filtros aplicados na exportação

**Given** página de leads com filtros ativos (estado, especialidade, período, status currículo)
**When** clico "Exportar CSV" ou "Exportar para Hubspot"
**Then** Edge Function recebe os mesmos filtros e aplica na query
**And** CSV exportado contém apenas os leads que correspondem aos filtros ativos
**And** sem filtros, exporta todos os leads

### AC5 — Botões de export na página de leads

**Given** rota `/admin/leads`
**When** admin autenticado acessa
**Then** vejo botões "Exportar CSV" e "Exportar para Hubspot" posicionados entre filtros e tabela
**And** botões desabilitados durante export com texto "Exportando..." e spinner inline
**And** download inicia automaticamente ao receber resposta
**And** toast de sucesso "CSV exportado com {N} leads" após download
**And** toast de erro em caso de falha, com mensagem acionável em pt-BR

### AC6 — Exportação sem leads

**Given** filtros que resultam em 0 leads
**When** clico exportar
**Then** toast informativo "Nenhum lead encontrado com os filtros atuais" (não exporta arquivo vazio)

## Tasks / Subtasks

- [x] Task 1 — Criar Edge Function `supabase/functions/export-leads/index.ts` (AC: #1, #2, #3, #4)
  - [x] 1.1 Criar pasta `supabase/functions/export-leads/`
  - [x] 1.2 Implementar handler com preflight CORS + verificação JWT admin
  - [x] 1.3 Implementar query de leads com filtros (replicar lógica de `fetchLeads` server-side)
  - [x] 1.4 Implementar gerador CSV padrão (formato `csv`)
  - [x] 1.5 Implementar gerador CSV Hubspot (formato `hubspot`)
  - [x] 1.6 Implementar formatações: E.164, split first/last name, data DD/MM/YYYY, BOM UTF-8
  - [x] 1.7 Tratar caso 0 resultados (retornar JSON informativo, não CSV vazio)

- [x] Task 2 — Botões de export na página Leads (AC: #5, #6)
  - [x] 2.1 Adicionar botões "Exportar CSV" e "Exportar para Hubspot" em `src/pages/admin/Leads.tsx`
  - [x] 2.2 Implementar lógica de invocação via `supabase.functions.invoke`
  - [x] 2.3 Implementar download automático (criar Blob → Object URL → anchor click → revoke)
  - [x] 2.4 Estados de loading nos botões (disabled + spinner + "Exportando...")
  - [x] 2.5 Toast de sucesso com contagem / toast de erro / toast informativo para 0 leads

- [x] Task 3 — Testes (AC: todos)
  - [x] 3.1 Testes unitários das funções de formatação (E.164, split name, CSV escape, date format)
  - [x] 3.2 Teste de renderização dos botões de export na página
  - [x] 3.3 Teste do fluxo de export (mock `supabase.functions.invoke`)

- [x] Task 4 — Verificação final
  - [x] 4.1 `bun run lint` passa
  - [x] 4.2 `bunx tsc --noEmit` passa
  - [x] 4.3 `bun run test` passa (todos os testes, inclusive novos)
  - [x] 4.4 `bun run build` passa
  - [ ] 4.5 Testar manualmente: deploy local da Edge Function com `supabase functions serve` + export via browser

### Review Findings

- [x] [Review][Decision] **AC5: Toast de sucesso sem contagem de leads** — Resolvido: frontend conta linhas do CSV e exibe `"CSV exportado com {N} leads"`. Header `X-Lead-Count` adicionado na Edge Function para consumidores futuros.
- [x] [Review][Patch] **PostgREST default 1000-row limit trunca export silenciosamente** — Corrigido: queries paginadas com `.range()` em batches de 1000 para leads e `user_curriculum`.
- [x] [Review][Patch] **AC3: Código de erro UNAUTHORIZED vs UNAUTHORIZED_ROLE** — Corrigido: todos os throws usam `UNAUTHORIZED_ROLE` conforme spec.
- [x] [Review][Patch] **CSV injection — células com `=`, `+`, `-`, `@` não sanitizadas** — Corrigido: `escapeCsv` prefixado com `'` (OWASP). 4 testes adicionados.
- [x] [Review][Defer] **Sem validação de filtros na Edge Function** — Frontend valida; PostgREST parameteriza. Risco é resultado errado, não injection. [export-leads/index.ts:171-174] — deferred, pre-existing pattern
- [x] [Review][Defer] **Formatadores duplicados no test file** — Limitação Deno/Node impede import direto. Documentado no código. [export-leads-formatters.test.ts:6] — deferred, architectural constraint
- [x] [Review][Defer] **formatE164 corrompe números internacionais** — Sistema exclusivamente brasileiro; fora de escopo. [export-leads/index.ts:34-44] — deferred, out of scope
- [x] [Review][Defer] **formatE164 ambíguo com DDD 55** — Inerente a números sem prefixo de país; heurística razoável para escala atual. [export-leads/index.ts:40] — deferred, acceptable tradeoff

## Dev Notes

### Padrões Estabelecidos no Projeto (OBRIGATÓRIO seguir)

Todos os padrões da Story 4.1 continuam válidos. Adicionalmente:

**Edge Function Pattern (referência: `supabase/functions/delete-account/index.ts`):**

```typescript
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // 1. Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. User client (JWT do request)
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw { message: "Unauthorized", code: "UNAUTHORIZED" };

    // 3. Admin client (service_role para bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 4. Verificar role admin
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw { message: "Unauthorized", code: "UNAUTHORIZED_ROLE" };

    // 5. Lógica de negócio...

    return new Response(JSON.stringify({ data: {...}, error: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ data: null, error: { message: error.message, code: error.code ?? "INTERNAL_ERROR" } }), {
      status: error.code === "UNAUTHORIZED_ROLE" ? 403 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

**CORS headers (`supabase/functions/_shared/cors.ts`):**
```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

### Invocação via Frontend

```typescript
// Em src/pages/admin/Leads.tsx — NÃO criar hook separado em queries/
// A invocação é simples e direta, não justifica abstração
import { supabase } from "@/lib/supabase";

const exportLeads = async (format: "csv" | "hubspot", filters: LeadsFilterValues) => {
  const { data, error } = await supabase.functions.invoke("export-leads", {
    body: { filters, format },
  });
  if (error) throw error;
  // ATENÇÃO: supabase.functions.invoke retorna data como Blob por default
  // quando Content-Type da resposta NÃO é application/json.
  // Se a Edge Function retorna text/csv, data já é Blob — usar direto.
  // Se retorna JSON (caso 0 leads ou erro), data é object parseado.
  return data;
};
```

**Lógica de tratamento da resposta:**
```typescript
const handleExport = async (format: "csv" | "hubspot") => {
  setExporting(format);
  try {
    const result = await exportLeads(format, filters);

    // Se resultado é JSON (0 leads), mostrar toast informativo
    if (result && typeof result === "object" && !(result instanceof Blob) && result.count === 0) {
      toast.info("Nenhum lead encontrado com os filtros atuais");
      return;
    }

    // Se resultado é Blob (CSV), iniciar download
    if (result instanceof Blob) {
      const url = URL.createObjectURL(result);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${format === "hubspot" ? "hubspot-" : ""}${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`CSV exportado com sucesso`);
    }
  } catch (err) {
    toast.error("Erro ao exportar leads. Tente novamente.");
  } finally {
    setExporting(null);
  }
};
```

**Download automático (padrão para CSV):**
```typescript
const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `leads-${format === "hubspot" ? "hubspot-" : ""}${new Date().toISOString().slice(0, 10)}.csv`;
document.body.appendChild(a);
a.click();
a.remove();
URL.revokeObjectURL(url);
```

### Geração de CSV — Regras

**CSV padrão (format = "csv"):**
- Colunas: `nome,email,telefone,estado,faculdade,ano_formacao,especialidade,data_cadastro`
- Mapeamento direto dos campos de `profiles`
- Datas formatadas como `DD/MM/YYYY`
- Campos null → string vazia
- Campos com vírgula ou aspas → escape com aspas duplas (RFC 4180)
- Primeira linha: BOM (`\uFEFF`) + header row

**CSV Hubspot (format = "hubspot"):**
- Colunas: `First Name,Last Name,Email,Phone,State/Region,Company,Graduation Year,Specialty,Registration Date`
- `name` → split no primeiro espaço: antes = First Name, resto = Last Name (se sem espaço: tudo First Name, Last Name = "")
- `phone` → E.164: se já começa com `+55`, manter; se não, prepend `+55`; remover tudo que não é dígito (exceto `+` inicial); se vazio, ""
- `university` → `Company`
- `graduation_year` → `Graduation Year` (número direto)
- `specialty_interest` → `Specialty`
- `created_at` → `Registration Date` no formato ISO `YYYY-MM-DD` (Hubspot prefere ISO)

### Query Server-Side — Replicar Filtros do Frontend

A Edge Function DEVE replicar a mesma lógica de filtros de `src/lib/queries/leads.ts`:

```typescript
// Dentro da Edge Function, usando supabaseAdmin
let query = supabaseAdmin
  .from("profiles")
  .select("id, name, email, phone, state, university, graduation_year, specialty_interest, created_at")
  .eq("role", "student")
  .order("created_at", { ascending: false });

// Aplicar filtros recebidos no body
const { filters } = body;
if (filters?.state) query = query.eq("state", filters.state);
if (filters?.specialty) query = query.eq("specialty_interest", filters.specialty);
if (filters?.from) query = query.gte("created_at", filters.from);
if (filters?.to) query = query.lte("created_at", filters.to + "T23:59:59.999Z");

// Filtro de currículo — requer subquery
if (filters?.curriculum === "filled" || filters?.curriculum === "empty") {
  const { data: curriculumUsers } = await supabaseAdmin
    .from("user_curriculum").select("user_id");
  const userIds = (curriculumUsers ?? []).map(u => u.user_id);
  if (filters.curriculum === "filled") {
    query = query.in("id", userIds.length > 0 ? userIds : ["__none__"]);
  } else {
    // "empty" = sem linha em user_curriculum
    // Nota: PostgREST não tem NOT IN direto para arrays grandes
    // Alternativa: filtrar em memória após fetch (aceitável para <10k)
  }
}

const { data: leads, error } = await query;
```

**ATENÇÃO sobre filtro `curriculum=empty`:** PostgREST não suporta `NOT IN` para arrays grandes de forma performática. Duas opções:
1. Filtrar em memória após fetch (aceitável para <10k leads — NFR12/NFR13)
2. Usar raw SQL via `supabaseAdmin.rpc()` com LEFT JOIN

Opção 1 é mais simples e adequada para a escala atual. Documentar em código com comentário.

### Tabela `profiles` — Colunas Relevantes

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `string (uuid)` | PK |
| `name` | `string` | Nome completo |
| `email` | `string` | Único |
| `phone` | `string \| null` | Pode ter formato variado |
| `state` | `string \| null` | UF (2 letras) |
| `university` | `string \| null` | Faculdade |
| `graduation_year` | `number \| null` | Ano |
| `specialty_interest` | `string \| null` | Especialidade |
| `created_at` | `string (timestamptz)` | Data de cadastro |

### Posição dos Botões na Página

Os botões de export devem ser inseridos em `src/pages/admin/Leads.tsx`, entre `<LeadFilters>` e `<LeadTable>`, alinhados à direita:

```tsx
{/* Após LeadFilters, antes de LeadTable */}
<div className="flex justify-end gap-2">
  <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={exporting}>
    {exporting === "csv" ? (
      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportando...</>
    ) : (
      <><Download className="mr-2 h-4 w-4" /> Exportar CSV</>
    )}
  </Button>
  <Button variant="outline" size="sm" onClick={() => handleExport("hubspot")} disabled={exporting}>
    {exporting === "hubspot" ? (
      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportando...</>
    ) : (
      <><Download className="mr-2 h-4 w-4" /> Exportar para Hubspot</>
    )}
  </Button>
</div>
```

Ícones: `Download` e `Loader2` de `lucide-react` (já instalado).

### Dependências

**Nenhuma nova dependência necessária.** Tudo já está instalado:
- `@supabase/supabase-js` — client singleton + `functions.invoke`
- `lucide-react` — ícones Download, Loader2
- shadcn `Button`, `toast` (Sonner) — já disponíveis
- Deno runtime para Edge Functions (Supabase nativo)

### Estrutura de Arquivos Esperada

```
supabase/
└── functions/
    └── export-leads/
        └── index.ts                          # Edge Function principal

src/
└── pages/
    └── admin/
        └── Leads.tsx                         # Modificado — adicionar botões de export
```

**Nota:** NÃO criar arquivo separado de queries para export. A invocação é inline em `Leads.tsx` — é um `supabase.functions.invoke` simples, não justifica hook React Query (é ação one-shot, não data fetching).

### Anti-Patterns a Evitar

1. **NÃO criar hook React Query para export** — é ação one-shot com download, não data fetching com cache
2. **NÃO usar `fetch()` direto** — usar `supabase.functions.invoke` que já inclui auth headers
3. **NÃO gerar CSV no frontend** — a Edge Function é quem consulta e gera (server-side, sem expor service_role)
4. **NÃO esquecer BOM UTF-8** — sem BOM, Excel interpreta como Latin-1 e acentos quebram
5. **NÃO usar `service_role` key no frontend** — apenas na Edge Function
6. **NÃO criar componente separado para botões de export** — são 2 botões simples inline na página
7. **NÃO editar componentes em `src/components/ui/`** — intocáveis (shadcn pristine)
8. **NÃO esquecer escape de CSV** — campos com vírgula, aspas ou quebra de linha devem ser escaped (RFC 4180)
9. **NÃO retornar CSV vazio quando 0 leads** — retornar JSON com mensagem informativa

### Acessibilidade

- Botões de export com texto descritivo (não só ícone)
- Estado disabled durante export comunicado via `aria-disabled`
- Toast de resultado anunciado via Sonner (já tem `role="status"`)

### Performance (NFRs)

- **NFR4:** Export de 10k registros em <10s — a Edge Function faz SELECT direto sem paginação; geração de CSV em memória é O(n) linear
- **NFR19:** Formato Hubspot compatível com importação — headers mapeados conforme documentação Hubspot

### Previous Story Intelligence (4.1)

**Learnings da Story 4.1 aplicáveis:**
- RLS admin SELECT em `user_curriculum` e `user_scores` já resolvido (migration 0005) — Edge Function usa `service_role` que bypassa RLS, mas é bom saber que policies existem
- Filtro `curriculum` (filled/empty) requer subquery em `user_curriculum` — a mesma lógica se aplica na Edge Function
- Paginação não se aplica ao export (queremos todos os registros)
- `LeadFilters` já expõe `filters` e `hasFilters` — usar diretamente para passar ao export
- Task 11.5 da story anterior (teste manual) ficou pendente — lembrar de testar esta story manualmente com `supabase functions serve`

**Arquivos criados na 4.1 que esta story modifica:**
- `src/pages/admin/Leads.tsx` — adicionar botões de export (não reescrever; apenas adicionar)

**Arquivos da 4.1 que NÃO devem ser modificados:**
- `src/components/features/admin/LeadTable.tsx`
- `src/components/features/admin/LeadFilters.tsx`
- `src/components/features/admin/LeadMetricsCards.tsx`
- `src/components/features/admin/LeadDetailDrawer.tsx`
- `src/lib/queries/leads.ts`
- `src/lib/schemas/leads.ts`
- `src/hooks/use-lead-filters.ts`

### Git Intelligence

Últimos commits relevantes:
- `bd3b79b` — test: smoke test CI pipeline
- `ca22e45` — ci: CI/CD completo + Sentry + Railway + observabilidade (Story 1.11)

Pattern de commit: `feat(scope): descrição` ou `fix(scope): descrição`. Para esta story: `feat(admin): Edge Function export-leads CSV + Hubspot (Story 4.2)`

### Project Structure Notes

- Alinhado com estrutura definida na arquitetura: Edge Functions em `supabase/functions/export-leads/`
- CORS compartilhado via `supabase/functions/_shared/cors.ts` (já existe)
- Frontend segue padrão inline para ações one-shot (sem hook dedicado)

### References

- [Source: epics.md#Epic 4, Story 4.2](../planning-artifacts/epics.md)
- [Source: architecture.md — Edge Functions pattern, API boundaries](../planning-artifacts/architecture.md)
- [Source: supabase/functions/delete-account/index.ts — padrão JWT + CORS](../../supabase/functions/delete-account/index.ts)
- [Source: supabase/functions/_shared/cors.ts — CORS headers](../../supabase/functions/_shared/cors.ts)
- [Source: src/pages/admin/Leads.tsx — página a modificar](../../src/pages/admin/Leads.tsx)
- [Source: src/hooks/use-lead-filters.ts — filtros a passar ao export](../../src/hooks/use-lead-filters.ts)
- [Source: src/lib/queries/leads.ts — lógica de filtros a replicar server-side](../../src/lib/queries/leads.ts)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Nenhum debug necessário — implementação direta sem bloqueios.

### Completion Notes List

- **Task 1:** Edge Function `export-leads` criada seguindo padrão `delete-account`. Suporta CSV padrão e Hubspot com formatações E.164, split nome, BOM UTF-8, datas DD/MM/YYYY (padrão) e ISO (Hubspot). Verifica JWT admin server-side (403 se não-admin). Filtros replicados da lógica de `fetchLeads`. Retorna JSON informativo quando 0 leads.
- **Task 2:** Botões "Exportar CSV" e "Exportar para Hubspot" adicionados entre filtros e tabela em `Leads.tsx`. Download automático via Blob/ObjectURL com normalização (Blob/string/ArrayBuffer) e delay cleanup para compatibilidade Safari. Loading state com spinner + disabled. Toast sucesso/erro/info.
- **Task 3:** 22 testes unitários para formatadores (escapeCsv, safe, formatDateBR, formatE164, splitName). 5 testes de renderização/integração na página Leads (botões presentes, invocação mock, toast 0 leads, toast erro).
- **Task 4:** lint (0 errors), tsc (clean), test (279/279 pass), build (success). Task 4.5 (teste manual com `supabase functions serve`) pendente — requer ambiente Supabase local.

### Change Log

- 2026-04-17: Implementação completa da Story 4.2 — Edge Function export-leads + botões na página Leads + 27 novos testes

### File List

- `supabase/functions/export-leads/index.ts` — **NOVO** — Edge Function principal
- `src/pages/admin/Leads.tsx` — **MODIFICADO** — Adicionados botões de export + lógica de invocação
- `src/pages/admin/Leads.test.tsx` — **MODIFICADO** — Adicionados 5 testes para export
- `src/lib/__tests__/export-leads-formatters.test.ts` — **NOVO** — 22 testes unitários de formatação
