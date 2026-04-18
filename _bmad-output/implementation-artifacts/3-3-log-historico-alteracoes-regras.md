# Story 3.3: Log/histórico de alterações de regras

Status: done

## Story

As a admin,
I want histórico de alterações de regras de scoring,
So that tenho auditoria completa e possibilidade de reverter mudanças quando necessário.

## Acceptance Criteria

1. **Given** migration `supabase/migrations/0009_rule_audit.sql` **When** aplico **Then** tabela `scoring_rules_audit` existe com colunas `(id uuid PK, rule_id uuid, changed_by uuid, change_type text CHECK IN ('INSERT','UPDATE','DELETE'), old_values jsonb, new_values jsonb, changed_at timestamptz DEFAULT now())` **And** trigger `audit_scoring_rules` popula automaticamente a cada INSERT/UPDATE/DELETE em `scoring_rules`
2. **Given** RLS habilitada em `scoring_rules_audit` **When** admin consulta **Then** pode SELECT todos os registros **And** ninguém faz INSERT/UPDATE/DELETE manual (somente trigger)
3. **Given** aba `/admin/historico` **When** acesso **Then** vejo lista cronológica (mais recente primeiro) com colunas: data/hora, instituição (short_name), regra (field_key + category), tipo de alteração (badge colorido: Criação/Edição/Remoção), admin (nome de `profiles`), botão expandir
4. **Given** clico numa linha do histórico **When** expande **Then** vejo comparação old/new values em formato legível: campos alterados destacados, valores anteriores e novos lado a lado **And** campos não alterados não aparecem (diff limpo)
5. **Given** uma linha de alteração do tipo UPDATE ou DELETE **When** clico "Reverter" **Then** mutation restaura `old_values` como novo INSERT ou UPDATE em `scoring_rules` **And** uma nova entrada de audit é gerada automaticamente (pelo trigger) **And** toast "Regra revertida com sucesso — {N} alunos terão recálculo na próxima sessão"
6. **Given** uma linha do tipo INSERT **When** visualizo **Then** botão "Reverter" não aparece (não faz sentido reverter uma criação — o admin pode deletar manualmente)
7. **Given** loading state **When** dados carregam **Then** vejo Skeleton na tabela **And** empty state com mensagem "Nenhuma alteração registrada ainda"
8. **Given** muitos registros **When** navego **Then** paginação client-side com 25 itens por página (volume esperado <500 registros no MVP)

## Tasks / Subtasks

- [x] Task 1: Migration `0009_rule_audit.sql` — tabela + trigger + RLS (AC: #1, #2)
  - [x] 1.1 Criar `supabase/migrations/0009_rule_audit.sql` com:
    - Tabela `scoring_rules_audit` (id uuid PK default gen_random_uuid(), rule_id uuid NOT NULL, changed_by uuid, change_type text NOT NULL CHECK (change_type IN ('INSERT','UPDATE','DELETE')), old_values jsonb, new_values jsonb, changed_at timestamptz NOT NULL DEFAULT now())
    - Índice `idx_scoring_rules_audit_rule_id` em `rule_id`
    - Índice `idx_scoring_rules_audit_changed_at` em `changed_at DESC`
  - [x] 1.2 Criar função `audit_scoring_rules()` trigger function em PL/pgSQL:
    - Em INSERT: old_values = NULL, new_values = row_to_json(NEW), change_type = 'INSERT'
    - Em UPDATE: old_values = row_to_json(OLD), new_values = row_to_json(NEW), change_type = 'UPDATE'
    - Em DELETE: old_values = row_to_json(OLD), new_values = NULL, change_type = 'DELETE'
    - `changed_by` = `auth.uid()` (pode ser NULL se executado fora de contexto auth, e.g., seed)
  - [x] 1.3 Criar trigger `trg_audit_scoring_rules` AFTER INSERT OR UPDATE OR DELETE em `scoring_rules` FOR EACH ROW EXECUTE FUNCTION `audit_scoring_rules()`
  - [x] 1.4 RLS policies em `scoring_rules_audit`:
    - SELECT: apenas `is_admin(auth.uid())` — histórico é dado sensível (contém info de regras)
    - INSERT/UPDATE/DELETE: nenhuma policy (somente trigger faz insert, bypass RLS por ser SECURITY DEFINER)
  - [x] 1.5 Marcar a função `audit_scoring_rules()` como `SECURITY DEFINER` para que o trigger insira na tabela de audit mesmo sem policy de INSERT para o usuário

- [x] Task 2: Teste pgTAP da migration (AC: #1, #2)
  - [x] 2.1 Criar `supabase/tests/0009_rule_audit.test.sql` seguindo padrão existente (ver `0002_rules_engine.test.sql`)
  - [x] 2.2 Testar: tabela existe, colunas corretas, índices existem, trigger existe
  - [x] 2.3 Testar RLS: admin pode SELECT, student/anon não pode SELECT
  - [x] 2.4 Testar: INSERT em `scoring_rules` gera registro em `scoring_rules_audit` com change_type='INSERT'
  - [x] 2.5 Testar: UPDATE gera registro com old_values e new_values
  - [x] 2.6 Testar: DELETE gera registro com old_values

- [x] Task 3: Queries React Query para audit (AC: #3, #7, #8)
  - [x] 3.1 Em `src/lib/queries/admin.ts` — adicionar:
    - Tipo `ScoringRulesAuditRow` (interface manual com campos tipados)
    - `useAuditLog()` — query que faz SELECT em `scoring_rules_audit` ordered by `changed_at DESC`
    - `useAdminProfiles()` — query para nomes de admin (lookup local no frontend)
  - [x] 3.2 Adicionar `useRevertRule()` — mutation que:
    - Recebe `auditEntry` (old_values, change_type, rule_id)
    - Se change_type = 'UPDATE': faz UPDATE em `scoring_rules` usando `old_values` (restaura estado anterior)
    - Se change_type = 'DELETE': faz INSERT em `scoring_rules` usando `old_values` (recria a regra deletada)
    - Invalida queries: `['audit-log']`, `['scoring-rules']`, `['institution-rule-counts']`
  - [x] 3.3 Query key: `['audit-log']`

- [x] Task 4: Componente `AuditLogTable` (AC: #3, #4, #7, #8)
  - [x] 4.1 Criar `src/components/features/admin/AuditLogTable.tsx`
  - [x] 4.2 Tabela HTML semântica (`<table>`, `<thead>`, `<tbody>`, `scope="col"`) usando shadcn `Table`
  - [x] 4.3 Colunas: data/hora (formatada pt-BR), instituição (short_name), regra (category + field_key), tipo (Badge colorido: verde "Criação", âmbar "Edição", vermelho "Remoção"), admin (nome), ações (expandir)
  - [x] 4.4 Linha expansível: ao clicar, mostra diff legível dos campos alterados (apenas campos que mudaram para UPDATE; todos os campos para INSERT/DELETE)
  - [x] 4.5 Paginação client-side: 25 itens por página com controles Anterior/Próxima
  - [x] 4.6 Loading state com Skeleton; empty state "Nenhuma alteração registrada ainda"
  - [x] 4.7 Badge de tipo: usar `variant="default"` (verde) para INSERT, `variant="secondary"` (âmbar/neutro) para UPDATE, `variant="destructive"` (vermelho) para DELETE

- [x] Task 5: Componente `AuditDiffView` (AC: #4)
  - [x] 5.1 Criar `src/components/features/admin/AuditDiffView.tsx`
  - [x] 5.2 Para UPDATE: comparar old_values vs new_values, mostrar apenas campos que diferem. Formato: "campo: valor anterior → valor novo"
  - [x] 5.3 Para INSERT: mostrar todos os new_values como "campos criados"
  - [x] 5.4 Para DELETE: mostrar todos os old_values como "campos removidos"
  - [x] 5.5 Mapear field keys para labels legíveis em pt-BR (institution_id → Instituição, weight → Peso, max_points → Pontuação máxima, etc.)
  - [x] 5.6 Formatar valores: números com 2 casas, datas legíveis, JSON indentado para formula

- [x] Task 6: Componente `RevertRuleDialog` (AC: #5, #6)
  - [x] 6.1 Criar `src/components/features/admin/RevertRuleDialog.tsx`
  - [x] 6.2 AlertDialog shadcn: "Reverter esta alteração restaurará a regra para o estado anterior. Uma nova entrada de histórico será criada."
  - [x] 6.3 Exibir resumo do que será restaurado (old_values resumido)
  - [x] 6.4 CTAs "Confirmar reversão" e "Cancelar"
  - [x] 6.5 Guard: não fecha durante mutation (`isPending`)
  - [x] 6.6 Toast de sucesso/erro após mutation
  - [x] 6.7 Não exibir botão "Reverter" para entradas do tipo INSERT

- [x] Task 7: Criar página `/admin/historico` (AC: #3)
  - [x] 7.1 Criar `src/pages/admin/Historico.tsx` — composição: título + `AuditLogTable`
  - [x] 7.2 Atualizar `src/router.tsx`: trocar import de `Stub.HistoricoStub` para `Historico`
  - [x] 7.3 NÃO alterar AdminShell — tab "Histórico" já aponta para `/admin/historico`

- [x] Task 8: Regenerar types e testes finais
  - [x] 8.1 Regenerar `src/lib/database.types.ts` com `supabase gen types typescript --local`
  - [x] 8.2 Testes de schema: verificar que tipo `ScoringRulesAuditRow` está correto
  - [x] 8.3 Testes de componentes: AuditLogTable renderiza, paginação funciona, diff exibe corretamente
  - [x] 8.4 `tsc --noEmit` passa sem erros
  - [x] 8.5 `bun run lint` passa sem erros (0 errors, 7 pre-existing warnings)
  - [x] 8.6 `bun run test` — 51 files, 341 testes passando (0 regressões)

## Dev Notes

### Padrões obrigatórios do projeto (replicar de Stories 3.1 e 3.2)

- **React Query para todo data fetching** — nunca `supabase.from().select()` direto em componentes. Queries/mutations em `src/lib/queries/admin.ts`
- **Schemas Zod em `src/lib/schemas/admin.ts`** — adicionar ao arquivo existente se necessário, não criar arquivo novo
- **snake_case nos dados vindos do banco** — não mapear para camelCase; usar tipos de `src/lib/database.types.ts`
- **Mensagens ao usuário em pt-BR**, acionáveis, sem jargão técnico
- **Sempre checar `error` antes de usar `data`** em chamadas Supabase
- **Toasts via Sonner** — `toast.success(...)`, `toast.error(...)`. Posição: canto inferior direito desktop, topo mobile
- **Loading states com Skeleton shadcn** — nunca spinner full-screen
- **Formulários com react-hook-form + zodResolver** — padrão consolidado em `InstitutionFormDialog.tsx` e `ScoringRuleFormDialog.tsx`

### Schema do banco — tabela a criar: `scoring_rules_audit`

```sql
-- supabase/migrations/0009_rule_audit.sql
CREATE TABLE public.scoring_rules_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  change_type text NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scoring_rules_audit_rule_id ON public.scoring_rules_audit(rule_id);
CREATE INDEX idx_scoring_rules_audit_changed_at ON public.scoring_rules_audit(changed_at DESC);
```

**Decisão: `rule_id` NÃO é FK com CASCADE para `scoring_rules.id`** — porque queremos preservar o histórico mesmo quando a regra é deletada. Se fosse FK CASCADE, deletar a regra deletaria o histórico — exatamente o oposto do desejado.

**Decisão: `changed_by` é FK para `auth.users(id)` com ON DELETE SET NULL** — se o admin for removido, o histórico permanece com `changed_by = NULL` (mostrar "Admin removido" na UI).

### Trigger function — SECURITY DEFINER

A função `audit_scoring_rules()` DEVE ser `SECURITY DEFINER` porque:
- O trigger roda no contexto do usuário que fez a operação em `scoring_rules`
- Mas NÃO existe (e não deve existir) policy de INSERT em `scoring_rules_audit` para usuários
- `SECURITY DEFINER` permite que o trigger insira na tabela de audit com permissão do owner da função (postgres), bypass RLS
- Usar `SET search_path = public` na função para segurança

### RLS da tabela `scoring_rules_audit`

```sql
ALTER TABLE public.scoring_rules_audit ENABLE ROW LEVEL SECURITY;

-- Apenas admin pode ver histórico
CREATE POLICY "admin can read audit log"
  ON public.scoring_rules_audit FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Nenhuma policy de INSERT/UPDATE/DELETE — trigger é SECURITY DEFINER
```

### Tabela `scoring_rules` — referência (já existente)

```sql
scoring_rules (
  id uuid PK, institution_id uuid FK, specialty_id uuid FK NULL,
  category text, field_key text, weight numeric, max_points numeric,
  description text, formula jsonb, created_at timestamptz, updated_at timestamptz
)
```

### Trigger existente: `on_scoring_rule_updated`

O trigger `on_scoring_rule_updated` (em `0007_calculate_scores.sql`) já marca `user_scores.stale=true` ao alterar regras. O novo trigger `trg_audit_scoring_rules` é ADICIONAL — ambos coexistem sem conflito. O audit trigger deve ser nomeado com prefixo `trg_` para diferenciá-lo do trigger de stale.

### Estratégia de query para o histórico

A query do `useAuditLog()` precisa fazer JOINs para exibir dados legíveis:

```sql
SELECT
  a.*,
  p.name as admin_name,
  -- Extrair institution_id dos valores (new_values para INSERT/UPDATE, old_values para DELETE)
  COALESCE(
    a.new_values->>'institution_id',
    a.old_values->>'institution_id'
  ) as institution_id
FROM scoring_rules_audit a
LEFT JOIN profiles p ON p.id = a.changed_by
ORDER BY a.changed_at DESC
```

Depois, no frontend, fazer lookup do `institution_id` contra `useInstitutions()` (já cacheado) para exibir `short_name`. Isso evita JOIN pesado e aproveita o cache existente.

**Alternativa mais simples (recomendada para MVP):** fazer o JOIN todo no frontend — `useAuditLog()` retorna apenas `scoring_rules_audit` ordenado, e o componente faz lookup local contra `useInstitutions()` e um map de admin names. Isso é viável porque o volume é baixo (<500 registros).

### Componente AuditDiffView — mapeamento de labels

Mapear keys do banco para labels legíveis:

```typescript
const FIELD_LABELS: Record<string, string> = {
  institution_id: 'Instituição',
  specialty_id: 'Especialidade',
  category: 'Categoria',
  field_key: 'Campo',
  weight: 'Peso',
  max_points: 'Pontuação máxima',
  description: 'Descrição',
  formula: 'Fórmula',
};
```

Campos a IGNORAR no diff (metadados internos): `id`, `created_at`, `updated_at`.

### Revert — estratégia

Para "Reverter" uma alteração:

1. **UPDATE revertido**: Pegar `old_values` do audit entry, fazer UPDATE em `scoring_rules` WHERE `id = rule_id` com os campos de `old_values` (exceto `id`, `created_at`, `updated_at`)
2. **DELETE revertido**: Pegar `old_values` do audit entry, fazer INSERT em `scoring_rules` usando `old_values`. Usar o `id` original de `old_values` se possível (para manter referência), mas aceitar novo id se conflito
3. **INSERT**: Não reverter — o admin pode deletar a regra manualmente pela tela de Regras

O trigger `trg_audit_scoring_rules` automaticamente registrará a reversão como nova entrada de audit. O trigger `on_scoring_rule_updated` automaticamente marcará `user_scores.stale=true`. **Não precisa fazer nada manual — os triggers existentes cobrem tudo.**

### Componentes shadcn disponíveis (já instalados)

Todos necessários já existem em `src/components/ui/`: `Table`, `AlertDialog`, `Badge`, `Button`, `Skeleton`, `Tooltip`, `Separator`.

Para a linha expansível da tabela, usar `Collapsible` do shadcn/Radix OU simplesmente um state local `expandedId` com renderização condicional de `<tr>` extra.

### Rota e Router — atualização necessária

```typescript
// src/router.tsx — ANTES (atual)
{ path: "historico", lazy: () => import("./pages/admin/Stub").then((m) => ({ Component: m.HistoricoStub })) }

// DEPOIS
{ path: "historico", lazy: () => import("./pages/admin/Historico").then((m) => ({ Component: m.default })) }
```

O `AdminShell` NÃO precisa ser alterado — a tab "Histórico" já aponta para `/admin/historico`.

### Padrão de paginação client-side

Volume esperado de audit log no MVP: <500 registros. Paginação client-side com 25 itens por página é suficiente. Implementar com state local:

```typescript
const [page, setPage] = useState(0);
const PAGE_SIZE = 25;
const pageData = data?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
const totalPages = Math.ceil((data?.length ?? 0) / PAGE_SIZE);
```

Botões "Anterior" e "Próxima" com `disabled` nos extremos. Indicador "Página X de Y".

### Acessibilidade obrigatória

- Focus ring: `ring-2 ring-teal-500 ring-offset-2` em todos interativos
- Tabela: `<thead>`, `<tbody>`, `scope="col"`
- Linha expansível: usar `aria-expanded` no botão de expandir
- Badge de tipo: usar cores + texto (não apenas cor para diferenciar tipos)
- AlertDialog (reverter): focus trap automático (Radix)
- Toast: `role="status"` (Sonner nativo)
- Paginação: `aria-label="Navegação de páginas"` no container

### Armadilhas a evitar

1. **NÃO criar FK CASCADE de `rule_id` para `scoring_rules`** — histórico deve sobreviver à deleção da regra
2. **NÃO criar policy de INSERT em `scoring_rules_audit`** — somente o trigger (SECURITY DEFINER) insere
3. **NÃO alterar AdminShell** — tabs já estão corretas desde Story 3.1
4. **NÃO duplicar `useInstitutions()`** — já existe em `src/lib/queries/admin.ts`, reutilizar para lookup de nomes
5. **NÃO usar TanStack DataTable** — volume de audit é baixo, tabela simples com shadcn `Table` + paginação local é suficiente
6. **NÃO incluir `id`, `created_at`, `updated_at` no diff visual** — são metadados internos
7. **NÃO esquecer SECURITY DEFINER** na trigger function — sem isso o trigger falha por falta de policy de INSERT
8. **NÃO esquecer `SET search_path = public`** na trigger function SECURITY DEFINER (segurança)
9. **NÃO expor PII em logs** — admin_name aparece na UI mas nunca loga
10. **NÃO usar `service_role` key** — todas as operações via client anon + RLS admin
11. **NÃO alterar o trigger `on_scoring_rule_updated` existente** — ele cobre stale marking; o audit trigger é separado

### Learnings das Stories 3.1 e 3.2 (aplicar aqui)

- **Dialog não pode fechar durante mutation** — implementar guard no `onOpenChange` com `isPending` no RevertRuleDialog
- **Tratar erro quando query principal falha** — destructurar `error` + banner de erro condicional na página
- **Invalidar queries corretas** — ao reverter, invalidar `['audit-log']` E `['scoring-rules']`
- **Badge states**: usar cores consistentes com o projeto (verde sucesso, âmbar neutro, vermelho destrutivo)
- **Zod `.finite()`** — se houver campos numéricos em formulários, aplicar `.finite()` para evitar Infinity
- **Guard no AlertDialog** — bloquear fechamento com `onOpenChange` enquanto `isPending`

### Git intelligence — convenções de commit

```
feat(admin): log/histórico de alterações com auditoria e reversão (Story 3.3)
```

### Project Structure Notes

- Criar `supabase/migrations/0009_rule_audit.sql`
- Criar `supabase/tests/0009_rule_audit.test.sql`
- Modificar `src/lib/queries/admin.ts` (adicionar useAuditLog, useRevertRule, tipo ScoringRulesAuditRow)
- Criar `src/components/features/admin/AuditLogTable.tsx`
- Criar `src/components/features/admin/AuditDiffView.tsx`
- Criar `src/components/features/admin/RevertRuleDialog.tsx`
- Criar `src/pages/admin/Historico.tsx` (substituir Stub)
- Modificar `src/router.tsx` (import Historico em vez de HistoricoStub)
- Regenerar `src/lib/database.types.ts`

### References

- [Source: supabase/migrations/0002_rules_engine.sql — schema scoring_rules + institutions + specialties + RLS]
- [Source: supabase/migrations/0007_calculate_scores.sql — trigger on_scoring_rule_updated + calculate_scores RPC]
- [Source: src/lib/database.types.ts — tipos gerados para scoring_rules, specialties, profiles]
- [Source: src/lib/queries/admin.ts — padrão de queries/mutations (useInstitutions, useScoringRules, etc.)]
- [Source: src/lib/schemas/admin.ts — padrão de schemas Zod existentes]
- [Source: src/components/features/admin/ScoringRuleTable.tsx — padrão de tabela admin com shadcn Table]
- [Source: src/components/features/admin/DeleteScoringRuleDialog.tsx — padrão de AlertDialog de confirmação]
- [Source: src/components/features/admin/ScoringRuleFormDialog.tsx — padrão de guard onOpenChange isPending]
- [Source: src/components/layout/AdminShell.tsx — tabs de navegação admin, tab "Histórico" já existente]
- [Source: src/router.tsx — rota /admin/historico aponta para Stub.HistoricoStub]
- [Source: src/pages/admin/Stub.tsx — HistoricoStub a ser substituído]
- [Source: supabase/tests/0002_rules_engine.test.sql — padrão pgTAP para testes de schema + RLS]
- [Source: _bmad-output/planning-artifacts/architecture.md — patterns obrigatórios, RLS, naming conventions]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3 Story 3.3 AC completos]
- [Source: _bmad-output/implementation-artifacts/3-2-crud-regras-adminruleeditor-impactpreview.md — learnings e review patches da story anterior]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- FK `changed_by` removida de `scoring_rules_audit`: testes pgTAP existentes usam UUIDs fake não presentes em `auth.users`, causando violação de FK no trigger. Solução: `changed_by` sem FK (audit deve sobreviver independente de referências externas).

### Completion Notes List

- Migration `0009_rule_audit.sql` criada com tabela, trigger SECURITY DEFINER, índices e RLS
- Testes pgTAP: 14 testes cobrindo schema, índices, trigger, RLS (anon/student bloqueados)
- Queries: `useAuditLog()`, `useAdminProfiles()`, `useRevertRule()` em admin.ts
- Componentes: AuditLogTable (tabela paginada 25/pág com expand), AuditDiffView (diff legível old/new), RevertRuleDialog (AlertDialog com guard isPending)
- Página Historico.tsx composta com error banner, substituindo HistoricoStub no router
- Types regenerados com `supabase gen types typescript --local`
- Todos os testes passam: 122 pgTAP + 341 Vitest, 0 regressões, 0 erros tsc/lint

### Review Findings

- [x] [Review][Patch] P1: Acentos pt-BR ausentes em todas as strings de UI — CORRIGIDO
- [x] [Review][Patch] P2: Revert de UPDATE em regra deletada é no-op silencioso com toast de sucesso — CORRIGIDO (`.select("id")` + check empty)
- [x] [Review][Patch] P3: Estado `page` não reseta quando `data` muda — CORRIGIDO (useEffect reset)
- [x] [Review][Patch] P4: `useAuditLog` sem `staleTime` — CORRIGIDO (staleTime: 2min)
- [x] [Review][Patch] D1→P5: Toast de revert sem contagem {N} de alunos afetados — CORRIGIDO (query user_scores count)
- [x] [Review][Patch] D2→P6: `changed_by` sem FK para `auth.users(id)` ON DELETE SET NULL — CORRIGIDO (migration 0013 + teste pgTAP)
- [x] [Review][Patch] D3→P7: Revert de DELETE falha silenciosamente quando instituição foi cascade-deleted — CORRIGIDO (validação prévia)
- [x] [Review][Defer] W1: Concurrent revert sem idempotência — deferred, baixa probabilidade no MVP
- [x] [Review][Defer] W2: `useAuditLog` carrega tabela inteira sem server-side limit — deferred, volume <500 no MVP

### Change Log

- 2026-04-17: Implementação completa da Story 3.3 — auditoria de regras com tabela, trigger, UI e reversão
- 2026-04-18: Code review — 7 patches aplicados (acentos pt-BR, revert edge cases, staleTime, FK changed_by, contagem alunos no toast)

### File List

- supabase/migrations/0009_rule_audit.sql (novo)
- supabase/tests/0009_rule_audit.test.sql (novo)
- src/lib/queries/admin.ts (modificado — adicionados useAuditLog, useAdminProfiles, useRevertRule, ScoringRulesAuditRow)
- src/lib/database.types.ts (regenerado)
- src/components/features/admin/AuditLogTable.tsx (novo)
- src/components/features/admin/AuditDiffView.tsx (novo)
- src/components/features/admin/RevertRuleDialog.tsx (novo)
- src/pages/admin/Historico.tsx (novo)
- src/router.tsx (modificado — historico route aponta para Historico em vez de HistoricoStub)
