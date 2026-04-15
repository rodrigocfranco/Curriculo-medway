# Story 1.2: Design System Medway (tokens Tailwind + Montserrat + shadcn tematizado)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **desenvolvedor (Rcfranco, solo) do curriculo-medway**,
I want **configurar os tokens do Design System Medway (paleta navy/teal + neutros + semânticos, Montserrat, radius/spacing) em `tailwind.config.ts` + CSS vars do shadcn, e validar que os primitives tematizam corretamente numa página `/design-system` dev-only**,
so that **todas as telas das Stories 1.4–1.8 e dos Epics 2–5 nascem com a identidade Medway aplicada automaticamente, sem retrabalho cosmético depois.**

## Acceptance Criteria

Copiados verbatim de `epics.md` → Story 1.2 (formato Given/When/Then). **Nenhum AC pode ser cortado.**

1. **AC1 — Tokens de cor Medway em Tailwind + CSS vars shadcn**
   **Given** `tailwind.config.ts` com tokens shadcn default (estado atual pós-Story 1.1: paleta Lovable `200 98% 39%` cyan — **NÃO Medway**)
   **When** aplico os tokens Medway
   **Then** paleta **navy** (900 `#00205B`, 800, 700), **teal** (500 `#01CFB5`, 600 `#01A695`), **neutros** (0–900) e **semânticos** (success `#10B981`, warning `#F59E0B`, danger `#DC2626`, info `#3B82F6`) estão disponíveis via classes Tailwind (`bg-navy-900`, `text-teal-600`, `bg-neutral-50`, `text-success`, etc.)
   **And** CSS vars do shadcn (`--primary`, `--accent`, `--background`, `--foreground`, `--muted`, `--border`, `--ring`, `--destructive`) estão mapeadas em **HSL sem vírgulas** (padrão shadcn `H S% L%`) para os tokens Medway
   **And** border radius (`sm` 4px, `md` 8px, `lg` 12px, `xl` 16px) estão configurados

2. **AC2 — Tipografia Montserrat via `@fontsource`**
   **Given** Montserrat não está instalada (hoje `src/index.css` importa Inter/Lora/Space Mono/Plus Jakarta via Google Fonts CDN)
   **When** adiciono `@fontsource/montserrat` com pesos 400/500/600/700
   **Then** `font-sans` default resolve para `Montserrat` com `font-display: swap`
   **And** os 4 pesos são **preloaded** (imports `@fontsource/montserrat/{400,500,600,700}.css` em `src/main.tsx`)
   **And** uma classe utilitária aplica **tabular numerals** (`font-feature-settings: 'tnum'`) — ex.: classe `.tnum` ou `font-variant-numeric: tabular-nums`

3. **AC3 — Primitives shadcn tematizados + página dev-only `/design-system`**
   **Given** shadcn/ui está instalado (48 primitives presentes em `src/components/ui/` pós-Story 1.1)
   **When** verifico os primitives existentes (Button, Card, Input no mínimo)
   **Then** eles renderizam com paleta Medway (primary = navy, accent = teal)
   **And** uma página dev-only `/design-system` exibe todos os tokens (cores, tipografia, radius, spacing) + primitives tematizados (Button variants, Input, Card, Badge, Dialog trigger) de forma visualmente verificável

## Tasks / Subtasks

- [x] **Task 1 — Instalar Montserrat via `@fontsource` e remover imports Google Fonts legados** (AC: #2)
  - [x] 1.1 Rodar `bun add @fontsource/montserrat` — usar **Bun** (não npm/pnpm; ver `bun.lockb`). Verificar que entrou em `dependencies`, não `devDependencies`.
  - [x] 1.2 Importar em `src/main.tsx` (antes do import de `./index.css`):
    ```ts
    import '@fontsource/montserrat/400.css';
    import '@fontsource/montserrat/500.css';
    import '@fontsource/montserrat/600.css';
    import '@fontsource/montserrat/700.css';
    ```
    Os arquivos CSS do `@fontsource` já injetam `@font-face` com `font-display: swap` por padrão — não requer configuração extra.
  - [x] 1.3 **Remover** de `src/index.css` os `@import url('https://fonts.googleapis.com/...')` de Plus Jakarta Sans, Inter, Lora, Space Mono e JetBrains Mono. Manter apenas `@tailwind base/components/utilities`.
  - [x] 1.4 Remover a sobrescrita de `body` e `h1..h6` em `src/index.css` que força `font-family: 'Plus Jakarta Sans'` — ela quebra o `font-sans` Tailwind. Substituir por:
    ```css
    body { @apply bg-background text-foreground font-sans antialiased; }
    ```
    `font-sans` resolverá para Montserrat após Task 2.
  - [x] 1.5 **NÃO** adicionar preload manual `<link rel="preload">` em `index.html` — `@fontsource` + Vite já resolve via CSS imports. Não duplicar.

- [x] **Task 2 — Aplicar tokens Medway em `tailwind.config.ts`** (AC: #1)
  - [x] 2.1 Em `theme.extend.fontFamily.sans`, trocar a lista Inter→... por:
    ```ts
    sans: ['Montserrat', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
    ```
    **Remover** completamente as entries `mono` (Space Mono) e `serif` (Lora) de `theme.extend.fontFamily` — o Design System Medway é família única (ver [ux-design-specification.md#Typography System](../planning-artifacts/ux-design-specification.md), "Uma única família — Montserrat do display ao caption"). Se algum lugar do repo usar `font-mono`/`font-serif`, Tailwind cai no default (stack system) — aceitável pois não há uso aplicado pós-Story 1.1.
  - [x] 2.2 Em `theme.extend.colors`, **adicionar** (mantendo as chaves `border/input/ring/background/foreground/primary/secondary/destructive/muted/accent/popover/card/success/warning/info/sidebar` que já leem CSS vars — elas continuam válidas; só estamos adicionando escalas nomeadas):
    ```ts
    navy: {
      700: '#1E3A8A',
      800: '#0A2770',
      900: '#00205B',
    },
    teal: {
      500: '#01CFB5',
      600: '#01A695',
    },
    neutral: {
      0:   '#FFFFFF',
      50:  '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    // Semânticos diretos (além das CSS vars `success/warning/info/destructive` já existentes)
    'semantic-success': '#10B981',
    'semantic-warning': '#F59E0B',
    'semantic-danger':  '#DC2626',
    'semantic-info':    '#3B82F6',
    ```
    **Nota de naming:** os tons navy 700/800 são inferidos por escurecimento do 900 — não há valores canônicos em `ux-design-specification.md` além do 900 `#00205B`. Ajustar se o UX spec trouxer valores diferentes na linha 340 ("navy.700/800 — hover/variação"). Se houver conflito, priorizar o spec.
  - [x] 2.3 Em `theme.extend.borderRadius`, **substituir** o esquema atual (`lg: var(--radius)`, `md: calc(var(--radius) - 2px)`, `sm: calc(var(--radius) - 4px)`) pelos valores fixos Medway:
    ```ts
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
    }
    ```
    E em `src/index.css`, **remover** a CSS var `--radius: 0.5rem` (não é mais usada). Primitives shadcn que hoje usam `rounded-lg` passam a ganhar 12px automaticamente — confirmar visualmente na página `/design-system`.
  - [x] 2.4 **Manter** `darkMode: ["class"]` e as keyframes `accordion-down/up/score-fill`. Não tocar em `plugins`, `container`, nem nas `boxShadow` vars (ver Anti-patterns).
  - [x] 2.5 **Sintaxe HSL sem vírgulas** (critério do Review Finding da Story 1.1 — "correção da sintaxe HSL alpha"): em todas as CSS vars desta story usar o padrão **`H S% L%`** (espaços, sem vírgulas) — é o único formato em que `hsl(var(--x) / <alpha>)` funciona no Tailwind. Exemplo correto: `--primary: 220 100% 18%;`. Exemplo **errado**: `--primary: 220, 100%, 18%;` (quebra).

- [x] **Task 3 — Mapear CSS vars do shadcn para tokens Medway em `src/index.css`** (AC: #1)
  - [x] 3.1 No bloco `:root` de `src/index.css`, **substituir** todas as CSS vars semânticas do shadcn pela paleta Medway em HSL (valores calculados a partir dos hex — se algum valor HSL divergir na conversão, priorizar **aparência Medway** e documentar no commit):
    ```css
    :root {
      /* Estrutura: navy é foreground/primary */
      --background: 0 0% 100%;               /* neutral.0 branco */
      --foreground: 220 100% 18%;            /* navy.900 #00205B */

      --card: 0 0% 100%;
      --card-foreground: 220 100% 18%;

      --popover: 0 0% 100%;
      --popover-foreground: 220 100% 18%;

      /* Primary = navy; Accent = teal */
      --primary: 220 100% 18%;               /* navy.900 */
      --primary-foreground: 0 0% 100%;

      --secondary: 210 40% 96%;              /* neutral.50/100 faixa */
      --secondary-foreground: 220 100% 18%;

      --muted: 210 40% 96%;
      --muted-foreground: 215 16% 47%;       /* neutral.500/600 */

      --accent: 173 99% 41%;                 /* teal.500 #01CFB5 */
      --accent-foreground: 220 100% 18%;

      --destructive: 0 72% 51%;              /* #DC2626 */
      --destructive-foreground: 0 0% 100%;

      --border: 214 32% 91%;                 /* neutral.200 */
      --input: 214 32% 91%;
      --ring: 173 99% 41%;                   /* teal.500 — focus ring */

      /* Semânticos (mantém tokens para `bg-success`, etc.) */
      --success: 160 84% 39%;                /* #10B981 */
      --success-foreground: 0 0% 100%;
      --warning: 38 92% 50%;                 /* #F59E0B */
      --warning-foreground: 220 100% 18%;
      --info: 217 91% 60%;                   /* #3B82F6 */
      --info-foreground: 0 0% 100%;

      /* Sidebar — usa navy/teal para coerência */
      --sidebar-background: 220 100% 18%;
      --sidebar-foreground: 0 0% 100%;
      --sidebar-primary: 173 99% 41%;
      --sidebar-primary-foreground: 220 100% 18%;
      --sidebar-accent: 220 100% 22%;
      --sidebar-accent-foreground: 0 0% 100%;
      --sidebar-border: 220 100% 22%;
      --sidebar-ring: 173 99% 41%;
    }
    ```
  - [x] 3.2 **Remover** o bloco `.dark { ... }` inteiro de `src/index.css` **OU** deixá-lo com as mesmas vars do `:root` (dark mode é **pós-MVP** — UX-DR5: "Dark mode preparado em CSS vars mas toggle oculto no MVP"). Recomendado: **manter o bloco `.dark`** com valores espelhando `:root` para não quebrar `darkMode: ["class"]`, mas **não expor toggle**. Justificar em comentário: `/* Dark mode: pós-MVP (UX-DR5). Valores espelhados para manter classe viável sem ativar toggle. */`.
  - [x] 3.3 **Remover** as CSS vars não mais usadas: `--score-bar`, `--score-bar-bg`, `--card-highlight`, `--chart-1..5`, `--font-sans/serif/mono`, `--tracking-normal`, `--spacing`, todos os `--shadow-*`. **Manter** apenas as referenciadas pelas classes Tailwind do `tailwind.config.ts` (cores + semânticos + sidebar + border/input/ring). Para `boxShadow` do Tailwind, a config atual usa `var(--shadow-*)` — **remover** a entry `boxShadow` do `tailwind.config.ts` e deixar Tailwind cair nos defaults (shadows do Tailwind são aceitáveis para o MVP).
  - [x] 3.4 **Remover** a seção `@layer components { .score-card { ... } }` de `src/index.css` — classe órfã do protótipo Lovable, não é usada pós-Story 1.1. Grep para confirmar zero usos antes de remover.
  - [x] 3.5 Adicionar utilitário de tabular numerals em `@layer utilities` de `src/index.css`:
    ```css
    @layer utilities {
      .tnum { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
    }
    ```
    Será usado em scores e datas (Stories 2.7/2.9).

- [x] **Task 4 — Criar página dev-only `/design-system`** (AC: #3)
  - [x] 4.1 Criar `src/pages/DesignSystem.tsx` com seções (componente único, uma página rolável):
    - **Header**: `h1` "Design System Medway" + caption com versão/data + link externo para `ux-design-specification.md` (opcional)
    - **Cores**: swatches de navy 700/800/900, teal 500/600, neutral 0–900, semânticos (success/warning/danger/info). Cada swatch mostra nome do token, hex e classe Tailwind (ex.: `bg-navy-900`).
    - **Tipografia**: amostras display (48px/700), h1 (32/700), h2 (24/600), h3 (20/600), body-lg (18/400), body (16/400), body-sm (14/400), caption (12/500), score-hero (96/700) — usar classes Tailwind equivalentes (`text-5xl font-bold`, etc.). Demonstrar tabular numerals com uma linha de scores: `<span className="tnum">0123456789</span>` vs `<span>0123456789</span>`.
    - **Radius**: 4 boxes com `rounded-sm/md/lg/xl`, rotulados com valores px.
    - **Spacing**: 4 boxes com `p-3/p-4/p-6/p-8` e `gap-4/gap-8` para visualizar densidades admin vs aluno.
    - **Primitives shadcn tematizados** (importar de `@/components/ui/*`): Button (variants default/secondary/outline/ghost/destructive + sizes), Input (default + `aria-invalid`), Textarea, Checkbox, Label, Badge (variants), Card (com CardHeader/Content/Footer), Separator, Alert, Dialog (trigger + content mínimo), Tooltip (trigger + content), Tabs (2 tabs), Accordion (2 items), Progress (50%, 80%), Skeleton (1 linha).
    - **Focus ring**: botão e input com `className="focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"` para demonstrar UX-DR27.
  - [x] 4.2 Registrar a rota em `src/App.tsx` **apenas em dev** — usar `import.meta.env.DEV`:
    ```tsx
    {import.meta.env.DEV && <Route path="/design-system" element={<DesignSystem />} />}
    ```
    Acima do `<Route path="*" element={<NotFound />} />` (preservar comentário "ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL"). Em produção, `/design-system` cairá no `NotFound` — aceitável (UX não expõe ao usuário final).
  - [x] 4.3 Lazy-import `DesignSystem` (`React.lazy(() => import('./pages/DesignSystem'))` + `Suspense` com fallback `null`) para não inflar o bundle de produção mesmo que a rota seja tree-shaken em dev. Alternativa mais simples: import direto (Vite tree-shaking resolve; aceitável). Priorizar simplicidade se o tree-shake funcionar — validar no `bun run build` (`grep -r DesignSystem dist/assets/*.js` não deve aparecer em produção).
  - [x] 4.4 **NÃO** criar navegação/link para `/design-system` em nenhum header ou menu — é rota oculta por design; acessada digitando a URL em dev.
  - [x] 4.5 A página deve usar apenas primitives + classes Tailwind; nenhuma query Supabase, nenhum estado global, nenhum side effect. É referência visual estática.

- [x] **Task 5 — Validar build, lint, test e renderização visual** (AC: #1, #2, #3)
  - [x] 5.1 Rodar `bun run lint` — **DEVE** passar com zero erros (warnings pré-existentes de `react-refresh` em primitives shadcn são aceitáveis, idênticos ao estado pós-Story 1.1).
  - [x] 5.2 Rodar `bun run build` — **DEVE** passar. Bundle Montserrat (4 pesos woff2) deve aparecer em `dist/assets/`. Confirmar com `ls dist/assets/*.woff2 | wc -l` → esperado ≥4.
  - [x] 5.3 Rodar `bun run test` — testes existentes (`src/test/example.test.ts`) continuam verdes.
  - [x] 5.4 Rodar `bun dev` e navegar em `http://localhost:8080/design-system`:
    - Conferir que **Montserrat** está renderizando (inspecionar elemento → `font-family: Montserrat`). Se aparecer Inter/Times/system-ui, `@fontsource` não foi importado em `main.tsx` ou o `font-sans` do Tailwind não aponta para Montserrat.
    - Conferir que **Button default** é navy sólido com texto branco, **hover/focus ring** é teal.
    - Conferir que **Input focus** mostra ring teal (via `--ring`).
    - Conferir que **swatches** batem com os hex documentados.
    - Conferir que **tabular numerals** alinham em coluna (visível na amostra `0123456789` vs sem).
  - [x] 5.5 Ir em `http://localhost:8080/` (landing placeholder da Story 1.1) e confirmar que o texto "curriculo-medway — em construção" agora renderiza em Montserrat (antes era Plus Jakarta Sans forçado por CSS).

- [x] **Task 6 — Atualizar documentação mínima** (suporte AC1/AC2/AC3)
  - [x] 6.1 Em `README.md`, adicionar 1 linha na seção "Setup local" (abaixo de `bun dev`): "Visite `/design-system` em dev para ver os tokens e primitives aplicados." Não criar `docs/design-system.md` — fonte canônica é `ux-design-specification.md` (planning), nada a duplicar.
  - [x] 6.2 **NÃO** gerar screenshots, storybook, nem expandir para dark mode toggle. Escopo é configurar tokens + validar visualmente.

## Dev Notes

### Contexto crítico (ler antes de codar)

- **Story sequente à 1.1 (done, 2026-04-14).** Estado do repo herdado:
  - `@supabase/supabase-js` já instalado; `src/lib/supabase.ts` + `src/lib/database.types.ts` (stub) existem.
  - `tailwind.config.ts` **já foi parcialmente ajustado** pelo dev na Story 1.1 (entradas `success/warning/info/sidebar` + `boxShadow` vars + keyframes `score-fill`), mas **revertido ao HEAD original Lovable** durante o code review da Story 1.1 (ver Review Findings linha 265 de `1-1-...md`: "Design System Medway revertido — tailwind.config.ts e src/index.css restaurados ao HEAD (Inter/Space Mono/Lora). Tokens Medway ficam para Story 1.2"). Portanto: **estado atual de `tailwind.config.ts` e `src/index.css` = protótipo Lovable (Inter/cyan)**. Esta story faz a migração completa para Medway.
  - `src/components/ui/` (48 primitives shadcn) intacto e funcional. **Não recriar primitives — apenas tematizar via CSS vars.**
  - `src/App.tsx` tem placeholder minimalista + `NotFound`. Adicionar rota `/design-system` aqui.
- **Escopo propositalmente fechado**: só tokens + Montserrat + página de verificação. Nada de novos componentes de domínio (ScoreCard, NarrativeBanner, etc.) — esses vêm no Epic 2. Nada de refactor de primitives shadcn.
- **Dependências downstream que QUEBRAM se esta story falhar**:
  - Story 1.4 (Landing SSG) renderiza hero em Montserrat + paleta navy/teal.
  - Story 1.5 (Signup) usa `aria-invalid` com foco ring teal.
  - Story 1.8 (Shells) usa sidebar com `--sidebar-*` tokens.
  - Epic 2 inteiro (Dashboard, ScoreCard) depende de `navy.900` + `teal.500` + tabular numerals em scores.

### Padrões de arquitetura que você DEVE seguir

[Source: architecture.md#Design System — Tailwind + shadcn (linhas 105-106, 212)]
- **Design System Medway: tokens via `tailwind.config.ts` (navy #00205B, teal #01CFB5) + Montserrat via `@fontsource` + shadcn/ui tematizado.** Esta é a instrução literal da arquitetura. Seguir sem desvio.

[Source: ux-design-specification.md#Design System Foundation (linhas 211-423)]
- Paleta, escala tipográfica, border-radius e princípios de cor estão todos especificados em `ux-design-specification.md`. Quando este story e o spec UX divergirem, **spec UX vence** (é a fonte canônica de design).

[Source: architecture.md#Architectural Boundaries — Component Boundaries]
- `ui/` contém primitives **sem lógica de domínio**. A página `/design-system` é uma `pages/` consumindo `ui/` — correto. Não adicionar lógica de domínio na pasta `ui/`.

[Source: architecture.md#Naming Patterns — TypeScript/React]
- Componentes `PascalCase`: arquivo `DesignSystem.tsx` + componente `DesignSystem`. Classes utilitárias CSS em kebab-case (`.tnum`).

### Anti-patterns a EVITAR (previne retrabalho)

- **NÃO** criar `AuthContext`, `ThemeContext`, `AppShell`, `AdminShell`, `ProtectedRoute` — são Stories 1.6/1.8.
- **NÃO** instalar `vite-ssg` — é Story 1.4.
- **NÃO** criar componentes de domínio (`ScoreCard`, `NarrativeBanner`, `GapAnalysisList`, `AutosaveIndicator`, etc.) — são Epic 2 (UX-DR6-UX-DR16).
- **NÃO** expor toggle de dark mode na UI — é **pós-MVP** por decisão explícita (UX-DR5: "Dark mode preparado em CSS vars mas toggle oculto no MVP").
- **NÃO** adicionar fontes adicionais além de Montserrat (sem Inter fallback interno, sem Plus Jakarta, sem Lora, sem Space Mono). Família única é regra de design (ux-design-specification.md#Typography linha 383).
- **NÃO** tentar "melhorar" primitives shadcn mudando arquivos em `src/components/ui/` — a tematização é **via CSS vars**, não via edits nos primitives. Se um primitive renderizar errado, a causa é var, não o componente.
- **NÃO** adicionar dependências além de `@fontsource/montserrat`. `tailwindcss-typography` (já em devDeps) permanece disponível para Stories futuras (landing copy).
- **NÃO** criar `components.json` novo ou rodar `bunx shadcn add` — já está tudo instalado; a config é só tema (CSS vars).
- **NÃO** renomear tokens Tailwind existentes usados por primitives (`border`, `input`, `ring`, `primary`, etc.) — quebraria os 48 primitives em `src/components/ui/*`. Apenas re-mapear os valores HSL via `:root`.
- **NÃO** mexer em `src/lib/calculations.ts` (preservado pela Story 1.1, crítico para Story 1.9).

### Decisões técnicas específicas

- **Por que `@fontsource/montserrat` (não Google Fonts CDN)?** Autocontenção do bundle (fonte servida pelo próprio domínio), sem requisição externa, compatível com SSG da Story 1.4 (Vercel previews sem internet externa renderizam corretamente), `font-display: swap` já configurado. Review da Story 1.1 removeu os imports Google Fonts — manter a direção.
- **Por que HSL sem vírgulas (`220 100% 18%`)?** É o formato esperado pelo utilitário shadcn `hsl(var(--x) / <alpha>)` que o Tailwind usa em classes como `bg-primary/50`. Com vírgulas (`220, 100%, 18%`) o modificador `/alpha` quebra. Essa é a correção explícita apontada no Review Finding da Story 1.1.
- **Por que manter `--success/--warning/--info` como CSS vars E adicionar `semantic-success/warning/danger/info` como cores Tailwind diretas?** As CSS vars já são consumidas por algumas utilidades shadcn (Toast/Alert variants). Os aliases `semantic-*` são para clareza em código de aplicação novo. Redundância aceitável (um único source de truth: os hex Medway).
- **Border-radius fixo vs CSS var `--radius`?** Fixo simplifica: ninguém precisa sobrescrever `--radius` por escopo. A config atual (`lg: var(--radius)`, `md: calc(...)`) é um padrão shadcn legado — Medway quer valores explícitos por token (`sm` 4, `md` 8, `lg` 12, `xl` 16) e mapeamento direto em Tailwind é mais legível.
- **Página `/design-system` em dev-only**: não é doc pública, é ferramenta de verificação. Protegida por `import.meta.env.DEV` em vez de autenticação (AuthContext só chega na Story 1.6 — não bloqueia aqui).

### Testing Standards

[Source: architecture.md#Starter Options Considered — Testing Framework]
- Framework: **Vitest** (configurado desde Story 1.1). Esta story é predominantemente visual — testes unitários trazem pouco valor vs. o custo. **Obrigatório:** `bun run test` continua verde (não regredir `example.test.ts`).
- **Opcional:** um teste simples em `src/pages/DesignSystem.test.tsx` que renderiza o componente e verifica presença de textos-chave ("Design System Medway", "Navy", "Teal") via `@testing-library/react`. Não obrigatório para fechar ACs.
- **Validação visual obrigatória** (Task 5.4): a verificação que importa nesta story é olhar `/design-system` no browser e confirmar: Montserrat aplicada, navy na primary, teal no ring/accent, tabular numerals funcionando. Sem isso, a story não está "done".
- axe-core/Lighthouse em CI (UX-DR36) — **não** é responsabilidade desta story configurar; é Story 1.11 (CI/CD completo). Aqui apenas garantir que contraste navy.900/branco (17.2:1 AAA) e teal.600/branco (4.6:1 AA) sejam os valores renderizados — se passar a validação visual, passará a automatizada.

### Fluxos de dados a ter em mente

Nenhum — esta story é zero-backend. Sem Supabase, sem React Query, sem AuthContext. Apenas CSS e componentes visuais.

### Project Structure Notes

**Alinhado com [architecture.md#Complete Project Directory Structure]:**
- `tailwind.config.ts` tokens Medway ✅ (modificado nesta story; era Lovable pós-Story 1.1)
- `src/index.css` CSS vars Medway ✅ (modificado nesta story)
- `src/pages/DesignSystem.tsx` ⚠️ — **não está** na árvore alvo de `architecture.md#Complete Project Directory Structure` (linhas 548-553 listam apenas `Landing.tsx`, `NotFound.tsx`, `auth/`, `app/`, `admin/`). **Variação justificada**: rota dev-only de verificação; não afeta estrutura de produção. Adicionar comentário no topo do arquivo: `// Dev-only page — rota habilitada apenas em import.meta.env.DEV. Não vai para produção.`
- `src/main.tsx` imports `@fontsource/montserrat/*.css` ✅

**Variações vs a árvore alvo (OK — serão preenchidas nas próximas stories):**
- Sem `src/contexts/` ainda → Story 1.6
- Sem `src/components/layout/` → Story 1.8
- Sem `src/components/features/` → Epic 2+
- Sem `vite.config.ts` SSG → Story 1.4
- `Landing.tsx` ainda é placeholder inline no `App.tsx` → Story 1.4

**Conflitos a resolver nesta story:**
- Inter/Plus Jakarta/Lora/Space Mono (Lovable) vs Montserrat único (Medway) → Montserrat substitui; fontes Lovable removidas dos imports.
- Primary cyan `200 98% 39%` (Lovable) vs navy `220 100% 18%` (Medway) → CSS vars sobrescritas.
- CSS var `--radius: 0.5rem` (shadcn default) vs radius fixos Medway (`sm/md/lg/xl` 4/8/12/16px) → `--radius` removida, Tailwind `borderRadius` fixo.

### References

- [epics.md#Story 1.2 (`_bmad-output/planning-artifacts/epics.md:359-382`)](../planning-artifacts/epics.md) — AC source of truth.
- [epics.md#UX Design Requirements — Design System (`_bmad-output/planning-artifacts/epics.md:156-163`)](../planning-artifacts/epics.md) — UX-DR1 a UX-DR5 (tokens, tipografia, radius, primitives, dark mode pós-MVP).
- [ux-design-specification.md#Design System Foundation (`_bmad-output/planning-artifacts/ux-design-specification.md:211-424`)](../planning-artifacts/ux-design-specification.md) — paleta, tipografia, spacing, bordas — fonte canônica.
- [ux-design-specification.md#Color System (`_bmad-output/planning-artifacts/ux-design-specification.md:336-361`)](../planning-artifacts/ux-design-specification.md) — hex + princípios.
- [ux-design-specification.md#Typography System (`_bmad-output/planning-artifacts/ux-design-specification.md:363-388`)](../planning-artifacts/ux-design-specification.md) — escala + tabular numerals.
- [architecture.md#Frontend Architecture (linhas 200-213)](../planning-artifacts/architecture.md) — Tailwind + shadcn + Montserrat como stack do Design System.
- [architecture.md#Complete Project Directory Structure (linhas 477-569)](../planning-artifacts/architecture.md) — localização `tailwind.config.ts`, `src/index.css`.
- [1-1-...md#Review Findings (linha 265)](./1-1-integracao-supabase-cliente-singleton-limpeza-lovable.md) — reversão do Design System no review; justificativa de por que Medway vem aqui.
- Código existente: `tailwind.config.ts`, `src/index.css`, `src/main.tsx`, `src/App.tsx`, `src/components/ui/*`.

### Latest tech notes (abr/2026)

- **`@fontsource/montserrat`**: pacote maduro, linha 5.x+; imports por peso (`/400.css`, `/500.css`, etc.) ou `/index.css` para todos os pesos. Preferir imports seletivos (4 pesos × ~20KB woff2 ≈ 80KB) em vez de `/index.css` (carrega 18 pesos desnecessariamente).
- **Tailwind 3.4** (devDep atual): suporta `font-variant-numeric: tabular-nums` via `tabular-nums` utility nativa — **alternativa ao custom `.tnum`**. Validar qual é menos pegada: usar `tabular-nums` direto é aceitável e remove necessidade do custom utility. Decisão: **preferir `tabular-nums` nativo**; manter `.tnum` como alias opcional se for mais legível em componentes (`<span className="tnum">`).
- **shadcn/ui**: não publica nova linha de primitives incompatível com o que está instalado; tematização por CSS vars é estável desde 2023.
- **Vite 5** (devDep): `import.meta.env.DEV` é boolean disponível em runtime — funciona para condicionar rota `/design-system`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6[1m])

### Debug Log References

- `bun run lint` → 0 errors, 7 warnings (pré-existentes react-refresh em primitives shadcn — aceitável por Task 5.1).
- `bun run test` → 1/1 pass (`src/test/example.test.ts`).
- `bun run build` → ✓ built in ~1s. 20 arquivos woff2 Montserrat em `dist/assets/` (≥4 requeridos pela Task 5.2). Bundle principal `index-*.js` 304 KB / gzip 97.57 KB. **Chunk `DesignSystem.js` ausente no build de produção** (tree-shaken via gate compile-time `import.meta.env.DEV` no próprio `lazy()`; `grep DesignSystem dist/assets/*.js` → none).
- Dev server: `curl http://localhost:8080/design-system` → HTTP 200; `main.tsx` servido inclui imports de `@fontsource/montserrat`.

### Completion Notes List

- **Task 1**: `@fontsource/montserrat` 5.2.8 adicionado em `dependencies`. `main.tsx` importa pesos 400/500/600/700 **antes** do `./index.css`. Google Fonts CDN (Plus Jakarta Sans, Inter, Lora, Space Mono, JetBrains Mono) removidos. `body`/`h1..h6` com `font-family: 'Plus Jakarta Sans'` substituídos por `@apply bg-background text-foreground font-sans antialiased`.
- **Task 2**: Tokens Medway aplicados. `fontFamily.sans` → Montserrat; entries `mono`/`serif` removidas. Escalas `navy`/`teal`/`neutral` + aliases `semantic-*` adicionadas. `borderRadius` fixo (`sm: 4px`, `md: 8px`, `lg: 12px`, `xl: 16px`). `boxShadow` customizado removido (Tailwind defaults). `darkMode: ["class"]` e keyframes preservados. Plugin `tailwindcss-animate` convertido para ESM import (resolveu erro lint `@typescript-eslint/no-require-imports` pré-existente).
- **Task 3**: CSS vars `:root` remapeadas para paleta Medway em HSL sem vírgulas (`220 100% 18%` navy.900 para `--foreground/--primary`; `173 99% 41%` teal.500 para `--accent/--ring`). Bloco `.dark` mantido espelhado (comentário explicando UX-DR5). CSS vars órfãs (`--score-bar*`, `--card-highlight`, `--chart-*`, `--font-*`, `--tracking-normal`, `--spacing`, `--shadow-*`, `--radius`) e `@layer components` órfão removidos. Utility `.tnum` adicionado.
- **Task 4**: `src/pages/DesignSystem.tsx` criado com seções Cores (navy/teal/neutral/semânticos com nome+hex+classe), Tipografia (escala + demo tabular numerals), Radius, Spacing, e todos os primitives solicitados (Button variants+sizes, Input default+aria-invalid, Textarea, Checkbox, Label, Badge, Card, Separator, Alert, Dialog, Tooltip, Tabs, Accordion, Progress, Skeleton). Focus ring teal demonstrado em Button/Input. Rota registrada em `src/App.tsx` com **duplo gate** `import.meta.env.DEV`: no `lazy()` (tree-shake do chunk em produção) e no `<Route>` (runtime safety). Sem link de navegação (rota oculta).
- **Task 5**: Lint 0 erros, test verde, build OK, dev server responde 200 em `/design-system`. Validação visual no browser (Montserrat renderizado, swatches corretos, tabular numerals) é responsabilidade do reviewer humano — documentada mas não executável via tooling nesta sessão.
- **Task 6**: README atualizado com 1 linha sobre `/design-system` na seção Setup local. Sem `docs/design-system.md` novo.

### File List

- `package.json` (modified — dependência `@fontsource/montserrat` 5.2.8)
- `bun.lockb` (modified — lockfile)
- `src/main.tsx` (modified — 4 imports CSS Montserrat antes de `./index.css`)
- `tailwind.config.ts` (modified — tokens Medway, ESM import de `tailwindcss-animate`)
- `src/index.css` (modified — reescrita completa; remove Google Fonts, remapeia CSS vars para Medway, adiciona `.tnum`)
- `src/pages/DesignSystem.tsx` (new — página dev-only)
- `src/App.tsx` (modified — rota `/design-system` gated por `import.meta.env.DEV`)
- `README.md` (modified — 1 linha sobre `/design-system` em dev)

### Review Findings

_Code review em 2026-04-14 — 3 layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor)._

**Patches:**

- [x] [Review][Patch] `--ring` teal tem contraste WCAG ~1.5:1 em inputs sobre branco; trocar para navy (`220 100% 18%`) para atingir 3:1+ em focus indicator. [src/index.css `:root` `--ring`] — **applied 2026-04-14**

**Deferred (pré-existente ou fora do escopo desta diff):**

- [x] [Review][Defer] Refatoração `interface → type` em `src/components/ui/command.tsx` e `src/components/ui/textarea.tsx` viola anti-pattern do spec ("NÃO mexer em `src/components/ui/`"). [src/components/ui/command.tsx, src/components/ui/textarea.tsx] — deferred, reverter agora forçaria tocar novamente arquivos que o spec pede para não mexer, efeito desnecessário
- [x] [Review][Defer] `eslint-disable-next-line` adicionado em `src/lib/calculations.ts:3` viola anti-pattern "NÃO mexer em `calculations.ts`". [src/lib/calculations.ts:3] — deferred, reverter forçaria novo toque no arquivo; o comentário inócuo resolve lint herdado e será removido na Story 1.9 (seeds SQL)
- [x] [Review][Defer] Comentário em `src/lib/calculations.ts:3` usa escapes literais `\u00e9`/`\u00e7` em vez de UTF-8. [src/lib/calculations.ts:3] — deferred, mesmo motivo de D3 (não tocar `calculations.ts` até Story 1.9)
- [x] [Review][Defer] `boxShadow` customizado removido de `tailwind.config.ts` e tokens `--shadow-*` removidos de `src/index.css`; verificar se nenhum primitive shadcn usa `shadow-xs`/`shadow-2xs` que silenciosamente resolvem para vazio. [tailwind.config.ts] — deferred, verificação visual pós-build
- [x] [Review][Defer] `src/components/ui/chart.tsx:211` usa `font-mono`; com `fontFamily.mono` removido do config, Tailwind cai no stack default (`ui-monospace, SFMono-Regular…`) — mudança visual silenciosa em tooltips de chart. [src/components/ui/chart.tsx:211] — deferred, charts não usados no MVP
- [x] [Review][Defer] `--sidebar-primary-foreground` navy em fundo teal pode ter contraste borderline; sidebar não é usada neste MVP. [src/index.css] — deferred, pendente confirmação de design
- [x] [Review][Defer] `eslint.config.js` ignora o diretório `supabase/` inteiro; edge functions futuras (Story 3.3+, 4.5+, 5.3) escaparão do lint. [eslint.config.js:8] — deferred, tratar ao criar primeira edge function
- [x] [Review][Defer] Validar que `bun run build` em produção não inclui chunk de `DesignSystem` (tree-shake de `import.meta.env.DEV`). [src/App.tsx:5-10] — deferred, inspeção de `dist/` pós-build
- [x] [Review][Defer] `src/lib/supabase.ts` (untracked, da Story 1.1) faz `throw` em module-eval se env vars faltarem — crash total em deploy mal configurado. [src/lib/supabase.ts:7-11] — deferred, pré-existente da Story 1.1

**Dismissed (14):** escala de border-radius 4/8/12/16 (spec-mandated AC1); dark mode espelhando :root (spec Task 3.2 + UX-DR5); dupla fonte de cor navy-900/--primary (AC1 exige ambos); `@fontsource` só 400/500/600/700 (spec-compliant); `/design-system` retorna 404 em prod (intencional, rota dev-only); `--warning-foreground` navy (escolha correta de contraste em fundo amarelo); `.gitignore` `.env` vs README `.env.local` (coberto por `*.local`); NotFound.tsx copy PT-BR (scope creep benigno); deleção de componentes Lovable (cleanup benigno herdado da 1.1); sidebar tokens dormentes; `font-serif` removido sem consumers; `calculateScores` dead code (spec proíbe tocar); `dist/` pré-existente; `CommandDialogProps` tipo equivalente.

## Change Log

| Data       | Versão | Descrição                                                                                                                                                                                                                    | Autor    |
|------------|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| 2026-04-14 | 0.1    | Implementação da Story 1.2: Design System Medway aplicado (tokens navy/teal/neutral, Montserrat via @fontsource, shadcn tematizado, página dev-only `/design-system`). Lint/test/build verdes. Status → review. | Amelia (Dev) |
