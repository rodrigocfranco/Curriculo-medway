# Story 5.1: Páginas públicas Termos de Uso + Política de Privacidade

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **visitante ou usuário do curriculo-medway**,
I want **ler os termos de uso e a política de privacidade em páginas dedicadas e acessíveis**,
so that **entendo os compromissos da plataforma e meus direitos antes de me cadastrar, conforme exigido pela LGPD, e os links já presentes no formulário de cadastro (Story 1.5) levam a conteúdo real em vez de 404**.

## Acceptance Criteria

Baseados em [epics.md#Story 5.1](../planning-artifacts/epics.md) — seção "Story 5.1: Páginas públicas Termos de Uso + Política de Privacidade". **Nenhum AC pode ser cortado.**

### AC1 — Rotas públicas `/termos` e `/privacidade`

**Given** as rotas `/termos` e `/privacidade` não existem no router
**When** registro ambas como rotas públicas em `src/router.tsx`
**Then** ambas são lazy-loaded seguindo o padrão existente (`lazy: () => import(...)`)
**And** acessíveis sem autenticação (fora de `/app` e `/admin`)
**And** `bun run build` passa sem erros

### AC2 — Página de Termos de Uso (`/termos`)

**Given** acesso `/termos`
**When** a página renderiza
**Then** vejo conteúdo jurídico estruturado com título "Termos de Uso" em `<h1>`
**And** layout `max-w-3xl mx-auto`, Montserrat, fundo `bg-background`
**And** títulos hierárquicos (`h2`, `h3`) para seções: Definições, Aceitação, Cadastro e Conta, Uso da Plataforma, Propriedade Intelectual, Limitação de Responsabilidade, Modificação dos Termos, Lei Aplicável, Contato
**And** listas (`<ul>`/`<ol>`) onde aplicável
**And** data de última atualização visível no topo ("Última atualização: abril de 2026")
**And** link "Voltar" ou breadcrumb para `/` no topo

### AC3 — Página de Política de Privacidade (`/privacidade`)

**Given** acesso `/privacidade`
**When** a página renderiza
**Then** vejo conteúdo jurídico estruturado com título "Política de Privacidade" em `<h1>`
**And** mesmo layout `max-w-3xl mx-auto`
**And** seções: Dados Coletados, Finalidade do Tratamento, Base Legal (LGPD), Compartilhamento de Dados, Armazenamento e Segurança, Direitos do Titular (acesso, correção, exclusão, portabilidade), Cookies e Tecnologias, Retenção de Dados, Alterações nesta Política, Contato do Encarregado (DPO)
**And** menção explícita ao direito de exclusão (Art. 18 LGPD) com referência à funcionalidade de exclusão de conta (Story 5.2)
**And** data de última atualização visível

### AC4 — Consistência com links do cadastro (Story 1.5)

**Given** o formulário de cadastro (`SignupForm`) já aponta para `/termos` e `/privacidade` com `target="_blank"`
**When** clico em "Termos de Uso" ou "Política de Privacidade" no cadastro
**Then** a página correspondente abre em nova aba com conteúdo (não 404)
**And** os testes existentes em `SignupForm.test.tsx` continuam passando sem alteração

### AC5 — Responsividade e acessibilidade

**Given** viewport mobile
**When** renderizo `/termos` ou `/privacidade`
**Then** sem overflow horizontal, body 16px+, padding adequado (`px-4` mobile, `px-6` desktop)
**And** links internos e externos acessíveis via teclado
**And** heading hierarchy correta (h1 → h2 → h3, sem pular níveis)
**And** `lang="pt-BR"` já presente no HTML (configurado no projeto)

## Tasks / Subtasks

- [x] Task 1: Criar componente de layout compartilhado para páginas jurídicas (AC: #2, #3, #5)
  - [x] 1.1 Criar `src/components/features/legal/LegalPageLayout.tsx` — wrapper com `max-w-3xl mx-auto`, padding responsivo, link "← Voltar ao início" para `/`, slot para conteúdo
  - [x] 1.2 Tipografia: `prose`-like styling via Tailwind — `h2` com `text-2xl font-semibold mt-10 mb-4`, `h3` com `text-xl font-medium mt-8 mb-3`, `p` com `text-base leading-relaxed mb-4`, `ul`/`ol` com `list-disc`/`list-decimal ml-6 space-y-2`

- [x] Task 2: Criar página de Termos de Uso (AC: #2)
  - [x] 2.1 Criar `src/pages/legal/TermosDeUso.tsx` com conteúdo placeholder editável cobrindo todas as seções do AC2
  - [x] 2.2 Conteúdo em pt-BR, tom profissional, referência a "Medway Currículo" como produto e "Medway Educação Médica" como empresa
  - [x] 2.3 Data de atualização como constante no topo do arquivo para fácil edição futura

- [x] Task 3: Criar página de Política de Privacidade (AC: #3)
  - [x] 3.1 Criar `src/pages/legal/PoliticaPrivacidade.tsx` com conteúdo placeholder editável cobrindo todas as seções do AC3
  - [x] 3.2 Incluir menção ao Art. 18 da LGPD (direitos do titular) e referência à funcionalidade de exclusão de conta
  - [x] 3.3 Mencionar dados coletados (nome, email, telefone, estado, faculdade, ano formação, especialidade, dados curriculares) e finalidades

- [x] Task 4: Registrar rotas no router (AC: #1)
  - [x] 4.1 Adicionar rotas `termos` e `privacidade` em `src/router.tsx` como filhas do layout raiz, antes do catch-all `*`
  - [x] 4.2 Usar padrão lazy-load: `lazy: () => import("./pages/legal/TermosDeUso").then(m => ({ Component: m.default }))`

- [x] Task 5: Testes (AC: #1, #4, #5)
  - [x] 5.1 Criar `src/pages/legal/TermosDeUso.test.tsx` — smoke test: renderiza título, heading hierarchy, data de atualização
  - [x] 5.2 Criar `src/pages/legal/PoliticaPrivacidade.test.tsx` — smoke test: renderiza título, menção LGPD, heading hierarchy
  - [x] 5.3 Verificar que `SignupForm.test.tsx` existente passa sem alteração (não criar novos testes lá, apenas rodar)

## Dev Notes

### Padrões obrigatórios do projeto

- **Lazy loading em rotas** — toda página usa `lazy: () => import(...)` no router (ver padrão em `src/router.tsx`)
- **Componentes de domínio em features/** — colocar em `src/components/features/legal/`; páginas em `src/pages/legal/`
- **Testes co-localizados** — `Component.tsx` + `Component.test.tsx` no mesmo diretório
- **Mensagens em pt-BR** — todo conteúdo visível ao usuário em português
- **Componentes shadcn disponíveis** — `Separator`, `Button`, `ScrollArea` já instalados se necessários
- **Imports com alias `@/`** — ex: `import { Button } from "@/components/ui/button"`

### Links existentes que apontam para estas páginas

O `SignupForm` (Story 1.5) já tem links com `target="_blank"`:
```tsx
// src/components/features/auth/SignupForm.tsx:430-444
<a href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</a>
<a href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>
```

Os testes em `SignupForm.test.tsx:167-174` verificam que estes links existem e apontam para `/termos` e `/privacidade`. **Não altere esses links nem esses testes.**

### Conteúdo jurídico

O conteúdo é **placeholder editável** — será revisado por jurídico posteriormente. Estruture como se fosse definitivo (seções completas, tom profissional, referências à LGPD), mas marque com um comentário HTML `<!-- PLACEHOLDER: revisar com jurídico -->` no topo de cada página para facilitar busca futura.

Dados que a plataforma coleta (para mencionar na Política de Privacidade):
- **Cadastro:** nome, email, telefone, estado, faculdade, ano de formação, especialidade desejada
- **Currículo:** publicações, dados acadêmicos, prática/social, liderança/eventos, perfil de formação
- **Uso:** scores calculados, histórico de acesso
- **Técnicos:** IP, user-agent, cookies de sessão (Supabase Auth)

Base legal principal: **consentimento** (Art. 7, I da LGPD) — via checkbox no cadastro.

### Estrutura de arquivos a criar

```
src/
├── components/features/legal/
│   └── LegalPageLayout.tsx        # Layout wrapper compartilhado
├── pages/legal/
│   ├── TermosDeUso.tsx            # Página de termos
│   ├── TermosDeUso.test.tsx       # Teste smoke
│   ├── PoliticaPrivacidade.tsx    # Página de privacidade
│   └── PoliticaPrivacidade.test.tsx # Teste smoke
```

### Padrão de rota no router.tsx

Adicionar ANTES do catch-all `{ path: "*", Component: NotFound }`:
```tsx
{
  path: "termos",
  lazy: () =>
    import("./pages/legal/TermosDeUso").then((m) => ({ Component: m.default })),
},
{
  path: "privacidade",
  lazy: () =>
    import("./pages/legal/PoliticaPrivacidade").then((m) => ({ Component: m.default })),
},
```

### Versão dos termos LGPD

Em `src/lib/queries/auth.ts:134` existe `LGPD_TERMS_VERSION = "1.0"`. A data de atualização nas páginas jurídicas deve ser consistente com esta versão. Quando o conteúdo jurídico for revisado no futuro, ambos devem ser atualizados juntos.

### Project Structure Notes

- Alinhado com estrutura `src/components/features/{feature}/` para componentes de domínio
- Alinhado com `src/pages/{contexto}/` para páginas (auth, app, admin, legal)
- Sem conflitos com rotas existentes (nenhuma rota `/termos` ou `/privacidade` registrada)
- Sem dependência de dados do Supabase — conteúdo puramente estático

### Git Intelligence

Commits recentes mostram padrões consolidados:
- Lazy loading em todas as rotas novas
- Testes co-localizados com componentes
- Schemas Zod para validação (não necessário nesta story — conteúdo estático)
- Componentes shadcn reutilizados extensivamente

### References

- [Source: epics.md#Story 5.1](../planning-artifacts/epics.md) — Acceptance criteria originais
- [Source: epics.md#Story 1.5](../planning-artifacts/epics.md) — Links LGPD no cadastro
- [Source: architecture.md#Frontend Architecture](../planning-artifacts/architecture.md) — Estrutura de rotas e componentes
- [Source: ux-design-specification.md](../planning-artifacts/ux-design-specification.md) — UX-DR20 (max-w-3xl para formulários/conteúdo), UX-DR29 (touch targets, 16px corpo), UX-DR33 (pt-BR, sem jargão)
- [Source: src/router.tsx](../../src/router.tsx) — Padrão de registro de rotas
- [Source: src/components/features/auth/SignupForm.tsx:430-444](../../src/components/features/auth/SignupForm.tsx) — Links existentes para /termos e /privacidade

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

Nenhum issue encontrado durante implementação.

### Completion Notes List

- LegalPageLayout criado como wrapper compartilhado com `max-w-3xl mx-auto`, padding responsivo (`px-4` mobile / `px-6` desktop), link "← Voltar ao início" usando lucide-react ArrowLeft, e tipografia prose-like via Tailwind utility selectors
- TermosDeUso com 9 seções completas: Definições, Aceitação, Cadastro e Conta, Uso da Plataforma, Propriedade Intelectual, Limitação de Responsabilidade, Modificação dos Termos, Lei Aplicável, Contato. Constante `ULTIMA_ATUALIZACAO` no topo para fácil edição. Comentário `// PLACEHOLDER: revisar com jurídico`
- PoliticaPrivacidade com 10 seções: Dados Coletados (com sub-seções h3), Finalidade, Base Legal (Art. 7 I LGPD), Compartilhamento, Armazenamento, Direitos do Titular (Art. 18 LGPD com menção a exclusão de conta), Cookies, Retenção, Alterações, Contato DPO. Todos os dados coletados listados conforme Dev Notes
- Rotas `/termos` e `/privacidade` registradas com lazy-load antes do catch-all `*`
- 10 testes novos passando (4 TermosDeUso + 6 PoliticaPrivacidade): smoke render, heading hierarchy, data atualização, link voltar, menção LGPD
- SignupForm.test.tsx (10 testes) continua passando sem alteração
- Build (`bun run build`) passa, páginas geradas como SSG estático
- Falha pré-existente em Landing.ssg.test.ts (não relacionada a esta story)

### Change Log

- 2026-04-17: Implementação completa da Story 5.1 — páginas jurídicas Termos de Uso e Política de Privacidade

### File List

- `src/components/features/legal/LegalPageLayout.tsx` (novo)
- `src/pages/legal/TermosDeUso.tsx` (novo)
- `src/pages/legal/TermosDeUso.test.tsx` (novo)
- `src/pages/legal/PoliticaPrivacidade.tsx` (novo)
- `src/pages/legal/PoliticaPrivacidade.test.tsx` (novo)
- `src/router.tsx` (modificado — adicionadas rotas /termos e /privacidade)

### Review Findings

- [x] [Review][Patch] Páginas jurídicas não definem `<title>` nem `<meta description>` — SSG indexa sem título descritivo [LegalPageLayout.tsx / TermosDeUso.tsx / PoliticaPrivacidade.tsx] ✅ Fixed: props `title`/`description` em LegalPageLayout + useEffect para document.title e meta tag
- [x] [Review][Patch] Back-link em LegalPageLayout não tem classe `focus-visible:ring` para navegação por teclado (AC5) [src/components/features/legal/LegalPageLayout.tsx:12] ✅ Fixed: adicionado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm
- [x] [Review][Patch] `ULTIMA_ATUALIZACAO` duplicada como constante local em 2 arquivos sem constante compartilhada [src/pages/legal/TermosDeUso.tsx:4, src/pages/legal/PoliticaPrivacidade.tsx:4] ✅ Fixed: constante exportada de LegalPageLayout.tsx, importada em ambas as páginas
- [x] [Review][Defer] Nenhum teste SSG smoke para páginas jurídicas (só Landing tem test SSG) — deferred, pre-existing
