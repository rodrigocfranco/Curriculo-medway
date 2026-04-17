# Story 3.1: Navegação admin + CRUD de instituições + upload de edital

Status: done

## Story

As a admin,
I want tabs de navegação no painel admin, poder criar/editar/remover instituições e anexar PDF ou link do edital,
So that a base de instituições é gerenciável sem deploy e o aluno consulta a fonte oficial.

## Acceptance Criteria

1. **Given** admin autenticado em `/admin` **When** carrega **Then** `AdminShell` exibe tabs (Instituições, Regras, Leads, Histórico) com tab ativa destacada e densidade compacta (`p-3`/`p-4`)
2. **Given** aba `/admin` (index = Instituições) **When** acesso **Then** vejo tabela compacta com colunas: nome, sigla, estado, edital (link/ícone), qtd de regras, ações (editar, remover)
3. **Given** clico "Nova instituição" **When** preencho formulário (name, short_name, state, edital_url) **Then** mutation cria registro em `institutions` e tabela atualiza via `invalidateQueries(['institutions'])`
4. **Given** clico "Editar" numa linha **When** altero e salvo **Then** mutation atualiza o registro
5. **Given** clico "Remover" **When** confirmo em dialog de segurança **Then** mutation deleta (cascade para `scoring_rules` explicitado ao user) e toast "Instituição removida"
6. **Given** estou editando uma instituição **When** vejo a seção "Edital" **Then** posso escolher "Link externo (URL)" ou "Upload de PDF"
7. **Given** seleciono upload **When** escolho arquivo **Then** validação: `application/pdf`, tamanho ≤ 10MB (NFR20); upload para bucket `editais` com path `{institution_id}/{timestamp}.pdf`; `institutions.pdf_path` atualizado; feedback visual durante upload
8. **Given** havia upload anterior **When** faço novo upload **Then** PDF antigo é removido do Storage antes de salvar o novo

## Tasks / Subtasks

- [x] Task 1: Criar schemas Zod e queries React Query para institutions (AC: #2, #3, #4, #5)
  - [x] 1.1 Schema Zod `institutionFormSchema` em `src/lib/schemas/admin.ts`
  - [x] 1.2 Queries e mutations em `src/lib/queries/admin.ts`: `useInstitutions()`, `useInstitutionRuleCounts()`, `useCreateInstitution()`, `useUpdateInstitution()`, `useDeleteInstitution()`
- [x] Task 2: Criar helper de upload/delete no Storage para bucket `editais` (AC: #7, #8)
  - [x] 2.1 Função `uploadEditalPdf(institutionId, file)` em `src/lib/queries/admin.ts`
  - [x] 2.2 Função `deleteEditalPdf(pdfPath)` que remove o arquivo anterior do Storage
- [x] Task 3: Criar componente `InstitutionTable` (AC: #2)
  - [x] 3.1 Componente em `src/components/features/admin/InstitutionTable.tsx`
  - [x] 3.2 Tabela HTML semântica (`<table>`, `<thead>`, `<tbody>`, `scope="col"`) usando shadcn `Table`
  - [x] 3.3 Colunas: nome, sigla, estado, edital (ícone link/pdf), qtd regras, ações
  - [x] 3.4 Loading state com `Skeleton`
- [x] Task 4: Criar componente `InstitutionFormDialog` (AC: #3, #4, #6, #7, #8)
  - [x] 4.1 Componente em `src/components/features/admin/InstitutionFormDialog.tsx`
  - [x] 4.2 Dialog shadcn com formulário react-hook-form + Zod
  - [x] 4.3 Campos: name (Input), short_name (Input), state (Select 27 UFs), edital_url (Input)
  - [x] 4.4 Seção "Edital": toggle entre "Link externo" (Input URL) e "Upload PDF" (file input)
  - [x] 4.5 Upload com validação (PDF, ≤10MB), progress visual, remoção de PDF anterior
  - [x] 4.6 Modo criação e edição (prefill com dados existentes)
- [x] Task 5: Criar componente `DeleteInstitutionDialog` (AC: #5)
  - [x] 5.1 Componente em `src/components/features/admin/DeleteInstitutionDialog.tsx`
  - [x] 5.2 AlertDialog shadcn com aviso sobre cascade (regras vinculadas serão removidas)
  - [x] 5.3 Mutation de delete + toast de confirmação
- [x] Task 6: Reescrever página `/admin` (Home) integrando os componentes (AC: #1, #2)
  - [x] 6.1 Substituir conteúdo de `src/pages/admin/Home.tsx` por composição: header + botão "Nova instituição" + `InstitutionTable`
  - [x] 6.2 Manter AdminShell tabs como estão (já funcionam)

## Dev Notes

### Padrões obrigatórios do projeto

- **React Query para todo data fetching** — nunca `supabase.from().select()` direto em componentes. Queries/mutations em `src/lib/queries/admin.ts`
- **Schemas Zod em `src/lib/schemas/admin.ts`** — reutilizáveis para validação client-side
- **snake_case nos dados vindos do banco** — não mapear para camelCase; usar tipos de `src/lib/database.types.ts`
- **Mensagens ao usuário em pt-BR**, acionáveis, sem jargão técnico
- **Sempre checar `error` antes de usar `data`** em chamadas Supabase
- **Toasts via Sonner** — `toast.success(...)`, `toast.error(...)`. Posição: canto inferior direito desktop, topo mobile
- **Loading states com Skeleton shadcn** — nunca spinner full-screen

### Componentes shadcn disponíveis (já instalados)

Todos os componentes necessários já estão em `src/components/ui/`: `Table`, `Dialog`, `AlertDialog`, `Form`, `Input`, `Select`, `Button`, `Badge`, `Skeleton`, `Tooltip`, `DropdownMenu`, `Label`, `Separator`, `ScrollArea`, `Progress`.

### Schema do banco — tabela `institutions`

```sql
-- supabase/migrations/0002_rules_engine.sql
create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text,
  state text,
  edital_url text,
  pdf_path text,      -- path no bucket editais (ex: "{id}/{timestamp}.pdf")
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**RLS policies (já ativas):**
- SELECT: público (anon + authenticated)
- INSERT/UPDATE/DELETE: apenas `is_admin(auth.uid())`

**Tipo TypeScript gerado** (`src/lib/database.types.ts`):
```typescript
institutions: {
  Row: {
    created_at: string; edital_url: string | null; id: string;
    name: string; pdf_path: string | null; short_name: string | null;
    state: string | null; updated_at: string;
  }
  Insert: { name: string; /* demais opcionais */ }
  Update: { /* todos opcionais */ }
}
```

### Storage bucket `editais` (já configurado)

```sql
-- supabase/migrations/0004_storage_editais.sql
-- Bucket: editais (private, 10 MiB, PDF-only)
-- READ: authenticated
-- WRITE (insert/update/delete): admin only via is_admin()
```

**Padrão de upload Supabase Storage:**
```typescript
// Upload
const { data, error } = await supabase.storage
  .from('editais')
  .upload(`${institutionId}/${Date.now()}.pdf`, file, {
    contentType: 'application/pdf',
    upsert: false, // nunca sobrescrever — delete antigo + upload novo
  });

// Delete anterior
await supabase.storage.from('editais').remove([oldPdfPath]);

// URL assinada para download
const { data: { signedUrl } } = await supabase.storage
  .from('editais')
  .createSignedUrl(pdfPath, 3600); // 1h
```

### Contagem de regras por instituição

Para exibir "qtd de regras" na tabela, usar query agregada:
```typescript
const { data, error } = await supabase
  .from('scoring_rules')
  .select('institution_id', { count: 'exact', head: true })
  .eq('institution_id', institutionId);
```

Ou, mais eficiente, uma query única agrupada:
```typescript
const { data } = await supabase
  .from('scoring_rules')
  .select('institution_id')
  .then(({ data }) => {
    // agrupar e contar client-side (11 instituições, volume pequeno)
  });
```

**Alternativa recomendada:** usar `.rpc()` com uma view ou fazer o count na mesma query que lista institutions via join lateral. Para o MVP com 11 instituições, count client-side é aceitável.

### Padrão de formulário existente (referência: SignupForm)

O projeto já tem um padrão consolidado em `src/components/features/auth/SignupForm.tsx`:
- `react-hook-form` com `zodResolver`
- Componentes `FormField`, `FormControl`, `FormItem`, `FormLabel`, `FormMessage` do shadcn
- Custom error classes com campo `field` tipado para mapping server → form
- `Select` com 27 UFs já implementado (reutilizar a mesma lista de UFs)
- `toast` via Sonner para feedback

### Lista de UFs (reutilizar — já extraída)

A lista de 27 UFs já existe em `src/lib/brazil-states.ts` como `BRAZIL_STATES` (array de `{ code, name }`). Tipo `BrazilStateCode` também exportado. Importar diretamente — **não duplicar**.

```typescript
import { BRAZIL_STATES } from "@/lib/brazil-states";
```

[Source: src/lib/brazil-states.ts]

### Cascade na deleção de instituição

`scoring_rules.institution_id` referencia `institutions.id` com `ON DELETE CASCADE` (confirmado em migration 0002, linha 38). Deleção da instituição remove automaticamente todas as `scoring_rules` vinculadas — **não é necessário delete manual das regras**.

**Importante**: O dialog de confirmação DEVE avisar o admin que "Todas as regras vinculadas a esta instituição serão removidas permanentemente." Também deletar o PDF do bucket `editais` se `pdf_path` existir.

[Source: supabase/migrations/0002_rules_engine.sql:38 — `on delete cascade` confirmado]

### AdminShell — tabs já implementadas

O `AdminShell` (`src/components/layout/AdminShell.tsx`) já tem as 4 tabs com `NavLink`:
- `/admin` → Instituições (index, `end: true`)
- `/admin/regras` → Regras
- `/admin/leads` → Leads
- `/admin/historico` → Histórico

**Nenhuma alteração necessária no AdminShell.** A tab "Instituições" já aponta para o index route que esta story vai implementar.

### Rotas admin existentes

```typescript
// src/router.tsx — admin routes
{
  path: "admin",
  lazy: () => import("./components/layout/AdminLayout"),
  children: [
    { index: true, lazy: () => import("./pages/admin/Home") },
    { path: "regras", lazy: () => import("./pages/admin/Stub") },
    { path: "leads", lazy: () => import("./pages/admin/Stub") },
    { path: "historico", lazy: () => import("./pages/admin/Stub") },
  ]
}
```

Apenas `pages/admin/Home.tsx` precisa ser reescrito. As demais rotas (stubs) NÃO são escopo desta story.

### Dados existentes (seed)

11 instituições já existem via seed (`supabase/seeds/rules_engine.sql`):
UNICAMP, USP-SP, PSU-MG, FMABC, EINSTEIN, SCMSP, SES-PE, SES-DF, SCM-BH, USP-RP, UFPA.

Nenhuma tem `edital_url` ou `pdf_path` preenchidos no seed — isso será adicionado via CRUD admin.

### Git intelligence — padrões recentes

Commits recentes seguem o padrão:
- `feat(scope): descrição` para features
- `fix(scope): descrição` para correções
- Componentes layout em `src/components/layout/`
- Features em `src/components/features/{domain}/`
- Queries em `src/lib/queries/`
- Schemas em `src/lib/schemas/`

### Project Structure Notes

- Criar `src/components/features/admin/` (diretório ainda não existe)
- Criar `src/lib/queries/admin.ts` (arquivo ainda não existe)
- Criar `src/lib/schemas/admin.ts` (arquivo ainda não existe)
- Manter `src/pages/admin/Home.tsx` como page (composição, lógica mínima)

### Armadilhas a evitar

1. **NÃO usar TanStack Table** para esta tabela — 11 instituições não justificam a complexidade. Tabela simples com shadcn `Table` é suficiente. TanStack Table será necessário apenas na LeadTable (Story 4.1) com paginação server-side e 10k+ registros.
2. **NÃO criar rotas novas** — a index route `/admin` já existe e aponta para `Home.tsx`.
3. **NÃO tocar no AdminShell** — tabs já estão corretas.
4. **NÃO duplicar a lista de UFs** — reutilizar do signup ou extrair para constante compartilhada.
5. **NÃO esquecer de deletar PDF antigo** do Storage ao fazer novo upload ou ao deletar instituição.
6. **NÃO usar `service_role` key** — todas as operações via client anon + RLS admin.

### References

- [Source: supabase/migrations/0002_rules_engine.sql — schema institutions + scoring_rules + RLS]
- [Source: supabase/migrations/0004_storage_editais.sql — bucket editais + policies]
- [Source: src/components/layout/AdminShell.tsx — tabs de navegação admin]
- [Source: src/components/layout/AdminLayout.tsx — ProtectedRoute role=admin wrapper]
- [Source: src/pages/admin/Home.tsx — página atual (placeholder)]
- [Source: src/router.tsx:68-104 — rotas admin]
- [Source: src/components/features/auth/SignupForm.tsx — padrão de formulário com react-hook-form + Zod + Select UFs]
- [Source: src/lib/queries/auth.ts — padrão de queries/mutations React Query]
- [Source: src/lib/database.types.ts:71-103 — tipos gerados para institutions]
- [Source: _bmad-output/planning-artifacts/architecture.md — patterns obrigatórios]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3 Story 3.1 AC completos]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Home.test.tsx precisou de TooltipProvider wrapper (Tooltip requer provider no test env)
- Dados de teste ajustados: name e short_name iguais causavam "multiple elements" no testing-library

### Completion Notes List

- Schema Zod `institutionFormSchema` criado com validação de nome obrigatório, UF via enum, URL opcional
- 5 hooks React Query: useInstitutions, useInstitutionRuleCounts, useCreateInstitution, useUpdateInstitution, useDeleteInstitution
- Storage helpers `uploadEditalPdf` e `deleteEditalPdf` com validação de tipo (PDF) e tamanho (10MB)
- InstitutionTable com tabela semântica, colunas conforme AC, loading skeleton, indicadores de edital (PDF/Link/—)
- InstitutionFormDialog com react-hook-form + Zod, Select de 27 UFs, toggle link/upload, progress visual, modo criar/editar
- DeleteInstitutionDialog com AlertDialog, aviso de cascade, deleção de PDF do Storage
- Página /admin reescrita com composição de componentes, botão "Nova instituição"
- AdminShell não foi alterado (tabs já estavam corretas)
- 13 novos testes: 6 para schema Zod, 5 para queries/storage, 2 para página Home
- Todos os 33 arquivos de teste passam (193 testes), zero regressões
- TypeScript strict: compilação limpa sem erros
- ESLint: todos os novos arquivos passam sem warnings

### Review Findings

- [x] [Review][Patch] **CRITICAL — PDF uploadado com path errado na criação (UUID mismatch)** — Fix: `generatedId` passado como `id` ao `createMutation`, garantindo que o path no Storage coincida com o ID no banco.
- [x] [Review][Patch] **HIGH — PDF antigo deletado antes do novo upload ter sucesso (edição)** — Fix: upload novo primeiro, delete do antigo somente após mutation com sucesso (best-effort).
- [x] [Review][Patch] **HIGH — PDF antigo deletado antes da mutation de update (troca para modo link)** — Fix: `oldPdfToDelete` agendado; delete executado somente após mutation com sucesso.
- [x] [Review][Patch] **HIGH — Delete mutation: storage delete antes do DB delete + erro ignorado** — Fix: DB delete primeiro, storage cleanup best-effort depois.
- [x] [Review][Patch] **HIGH — Dialog pode ser fechado durante upload (Escape/overlay)** — Fix: guard no `onOpenChange` bloqueia fechamento quando `isPending`.
- [x] [Review][Patch] **MEDIUM — Sem tratamento de erro quando `useInstitutions` falha** — Fix: `error` destructurado + banner de erro condicional no Home.tsx.
- [x] [Review][Patch] **LOW — File input não é resetado após rejeição de arquivo** — Fix: `e.target.value = ""` imediatamente após ler o arquivo.
- [x] [Review][Defer] **Stale closure no `onSubmit` — sem optimistic locking** — Se outro usuário alterar a instituição entre abrir o dialog e submeter, o `onSubmit` usa dados desatualizados. Padrão pré-existente no projeto. — deferred, pre-existing
- [x] [Review][Defer] **Select de estado não pode ser limpo após seleção** — Não há opção "Nenhum" no Select de UF. Uma vez selecionado, o usuário não consegue voltar para vazio. — deferred, UX enhancement
- [x] [Review][Defer] **Schema `edital_url` aceita URLs non-http(s)** — Zod `.url()` aceita `javascript:`, `data:`, `file:`. Risco mínimo (admin-only, self-XSS). — deferred, security hardening

### Change Log

- 2026-04-16: Implementação completa da Story 3.1 — navegação admin + CRUD instituições + upload edital

### File List

**Novos:**
- src/lib/schemas/admin.ts
- src/lib/schemas/admin.test.ts
- src/lib/queries/admin.ts
- src/lib/queries/admin.test.ts
- src/components/features/admin/InstitutionTable.tsx
- src/components/features/admin/InstitutionFormDialog.tsx
- src/components/features/admin/DeleteInstitutionDialog.tsx

**Modificados:**
- src/pages/admin/Home.tsx (reescrito com composição de componentes)
- src/pages/admin/Home.test.tsx (atualizado para mockar queries admin)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status → in-progress → review)
- _bmad-output/implementation-artifacts/3-1-navegacao-admin-crud-instituicoes-upload-edital.md (tasks, status, record)
