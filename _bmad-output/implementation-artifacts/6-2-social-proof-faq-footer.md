# Story 6.2: Social proof + FAQ + footer

Status: done

## Story

As a **visitante da landing page**,
I want **ver validação social (depoimentos), respostas rápidas para dúvidas comuns e links de rodapé completos**,
So that **tenho confiança para me cadastrar, encontro respostas sem sair e percebo profissionalismo e transparência**.

## Acceptance Criteria

Extraídos de [epics.md#Story 6.2](../planning-artifacts/epics.md). **Nenhum AC pode ser cortado.**

1. **AC1 — Seção social proof / depoimentos**
   **Given** seção `#social-proof` abaixo da preview
   **When** visualizo
   **Then** vejo 2–4 depoimentos em cards com: avatar placeholder (iniciais ou ícone genérico, sem foto real), nome (pode ser fictício no MVP), especialidade/residência e quote curta (1–2 frases)
   **And** tom dos depoimentos segue princípio UX de "pertencimento silencioso" — sem ranking, sem comparação social agressiva, foco na experiência positiva de uso
   **And** layout: carousel horizontal (desktop) ou cards empilhados (mobile); sem auto-rotate (acessibilidade)

2. **AC2 — Fallback para MVP (sem depoimentos reais)**
   **Given** não existem depoimentos reais de usuários no MVP
   **When** implemento
   **Then** depoimentos são hardcoded como dados mock no componente (array de objetos)
   **And** arquivo `deferred-work.md` registra pendência para coletar depoimentos reais pós-lançamento
   **And** estrutura do componente facilita troca futura por dados dinâmicos (prop `testimonials: Testimonial[]`)

3. **AC3 — Seção FAQ**
   **Given** seção `#faq` abaixo do social proof
   **When** visualizo
   **Then** vejo accordion (shadcn `Accordion`) com 5–7 perguntas frequentes cobrindo: o que é o currículo Medway, como o score é calculado, quais instituições, preço/gratuidade, LGPD/dados, posso atualizar depois
   **And** respostas são concisas (2–3 frases cada)
   **And** accordion inicia colapsado; apenas um item aberto por vez (`type="single"`)

4. **AC4 — Seção footer**
   **Given** seção `<footer>` no final da página
   **When** visualizo
   **Then** footer tem: logo Medway (ou texto "Medway"), links para Termos de Uso (`/termos`) e Política de Privacidade (`/privacidade`), ano corrente (`© {year} Medway`), link para site institucional Medway (externo, `target="_blank"` com `rel="noopener"`)
   **And** footer é `<footer>` semântico com `role="contentinfo"`
   **And** layout responsivo: links inline (desktop), empilhados (mobile)

5. **AC5 — CTA final antes do footer**
   **Given** entre FAQ e footer há CTA de fechamento
   **When** visualizo
   **Then** vejo faixa com background accent/teal, headline "Pronto para descobrir seu score?" e CTA "Começar agora" → `/signup`
   **And** CTA usa `Button` primário com tamanho `lg`

6. **AC6 — Acessibilidade geral**
   **Given** acessibilidade das novas seções
   **When** valido
   **Then** todos os avatars placeholder têm `aria-hidden="true"` (decorativos); accordion tem `aria-controls`/`aria-expanded` (automático pelo shadcn); footer landmarks corretos; contraste AA em todos os textos

7. **AC7 — Testes atualizados**
   **Given** landing com seções adicionais
   **When** rodo testes
   **Then** `Landing.test.tsx` cobre: social-proof (presença de depoimentos), FAQ (accordion abre/fecha), footer (links termos/privacidade, ano), CTA final
   **And** `Landing.ssg.test.ts` verifica que HTML pré-renderizado contém seções social-proof, faq, footer
   **And** `bun run build && bun run test && bun run lint` = 0 erros novos

## Tasks / Subtasks

- [x] Task 1: Criar componente `SocialProofSection.tsx` (AC: #1, #2)
  - [x] 1.1 Criar `src/components/features/landing/SocialProofSection.tsx`
  - [x] 1.2 Definir tipo `Testimonial = { name: string; specialty: string; quote: string; initials: string }` e array `TESTIMONIALS` com 3–4 depoimentos mock (nomes fictícios, especialidades reais, quotes focadas em experiência positiva)
  - [x] 1.3 Seção `<section id="social-proof">` com título "O que dizem nossos alunos"
  - [x] 1.4 Cards de depoimento: avatar com iniciais (shadcn `Avatar` + `AvatarFallback`), nome, especialidade, quote com aspas estilizadas
  - [x] 1.5 Layout: scroll horizontal nativo (`overflow-x-auto`, `scroll-snap-type: x mandatory`, `scroll-snap-align: start`) em desktop; cards empilhados (`space-y-6`) em mobile. Sem auto-rotate.
  - [x] 1.6 Avatars placeholder com `aria-hidden="true"` (decorativos)
  - [x] 1.7 Aceitar prop `testimonials?: Testimonial[]` com fallback para `TESTIMONIALS` default — facilita troca futura por dados dinâmicos
  - [x] 1.8 Registrar pendência em `deferred-work.md`: "Coletar depoimentos reais de alunos pós-lançamento para substituir mock data em SocialProofSection"

- [x] Task 2: Criar componente `FaqSection.tsx` (AC: #3)
  - [x] 2.1 Criar `src/components/features/landing/FaqSection.tsx`
  - [x] 2.2 Definir array `FAQ_ITEMS` com 6 perguntas e respostas cobrindo: (1) O que é o Currículo Medway?, (2) É gratuito?, (3) Como o score é calculado?, (4) Quais instituições estão disponíveis?, (5) Meus dados estão seguros?, (6) Posso atualizar meu currículo depois?
  - [x] 2.3 Usar `Accordion` do shadcn com `type="single"` e `collapsible` — já instalado em `src/components/ui/accordion.tsx`
  - [x] 2.4 Cada `AccordionItem` com `AccordionTrigger` (pergunta) e `AccordionContent` (resposta concisa, 2–3 frases)
  - [x] 2.5 Linkar `/termos` e `/privacidade` nas respostas relevantes (dados, LGPD) — rotas já existem (Story 5.1 done)
  - [x] 2.6 Seção `<section id="faq">` com título "Perguntas frequentes"

- [x] Task 3: Criar componente `CtaBannerSection.tsx` (AC: #5)
  - [x] 3.1 Criar `src/components/features/landing/CtaBannerSection.tsx`
  - [x] 3.2 Faixa com background accent (`bg-accent text-accent-foreground` ou gradiente teal)
  - [x] 3.3 Headline: "Pronto para descobrir seu score?"
  - [x] 3.4 CTA: `<Button asChild size="lg"><Link to="/signup">Começar agora</Link></Button>` — usar variante que contraste com background teal (ex: `variant="default"` que é navy, ou `variant="outline"` com texto branco)
  - [x] 3.5 Layout centralizado com padding generoso (`py-16 text-center`)

- [x] Task 4: Criar componente `FooterSection.tsx` (AC: #4)
  - [x] 4.1 Criar `src/components/features/landing/FooterSection.tsx`
  - [x] 4.2 `<footer role="contentinfo">` semântico
  - [x] 4.3 Conteúdo: logo/texto "Medway", links internos para `/termos` e `/privacidade` (usar `Link` do react-router), link externo para site Medway (`target="_blank"` com `rel="noopener noreferrer"`)
  - [x] 4.4 Ano corrente via `new Date().getFullYear()` — em SSG será o valor do build-time (aceitável no MVP)
  - [x] 4.5 Linha com `© {year} Medway`
  - [x] 4.6 Layout responsivo: links inline em desktop, empilhados em mobile; touch targets ≥44px nos links

- [x] Task 5: Compor seções no `Landing.tsx` (AC: todos)
  - [x] 5.1 Importar `SocialProofSection`, `FaqSection`, `CtaBannerSection`, `FooterSection`
  - [x] 5.2 Adicionar na ordem: `<SocialProofSection />`, `<FaqSection />`, `<CtaBannerSection />`, `<FooterSection />`
  - [x] 5.3 Manter `<main>` wrapper existente; footer fica fora do `<main>` (semântica HTML) ou dentro com role="contentinfo"

- [x] Task 6: Atualizar testes (AC: #7)
  - [x] 6.1 `Landing.test.tsx` — adicionar testes: seção social-proof (título + presença de pelo menos 1 depoimento com nome e quote), FAQ (título + accordion abre ao clicar + resposta aparece), footer (links termos/privacidade + ano corrente), CTA banner (headline + botão → /signup)
  - [x] 6.2 `Landing.ssg.test.ts` — adicionar testes: HTML contém `id="social-proof"`, `id="faq"`, `<footer`, headline do CTA banner
  - [x] 6.3 Rodar `bun run build && bun run test && bun run lint` — zero erros novos, zero regressões

## Dev Notes

### Contexto do projeto

Story final do Epic 6 (Landing & Marketing Polish). A Story 6.1 (hero + como funciona + preview) está concluída. O objetivo é completar a landing com social proof, FAQ e footer para criar uma experiência completa de conversão. Todas as features do produto (Epics 1–5) estão prontas.

### Componentes existentes que DEVEM ser reutilizados

- **`Accordion`** — já instalado em `src/components/ui/accordion.tsx` (Radix UI). Exporta `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`. **NÃO instalar novamente nem criar accordion custom.**
- **`Avatar`** — já instalado em `src/components/ui/avatar.tsx` (Radix UI). Exporta `Avatar`, `AvatarImage`, `AvatarFallback`. Usar para avatares dos depoimentos.
- **`Button`** — `src/components/ui/button.tsx`. Variantes: default (navy), destructive, outline, secondary, ghost, link. Tamanhos: default, sm, lg, icon.
- **`Card`** — `src/components/ui/card.tsx`. Usar para cards de depoimentos (consistência com HowItWorksSection).

### Patterns obrigatórios da Story 6.1 (manter consistência)

- **Extração de componentes**: cada seção em arquivo separado em `src/components/features/landing/`
- **Composição no Landing.tsx**: importar e compor seções — Landing.tsx é apenas composição
- **Espacamento**: `max-w-5xl mx-auto px-6` em todas as seções (consistência com hero, como-funciona, preview)
- **Paleta**: `bg-background`, `text-foreground`, `text-muted-foreground`, `primary` (navy), `accent` (teal)
- **Tipografia**: Montserrat já configurada como `font-sans`. `text-3xl font-bold` para títulos de seção (como HowItWorksSection/PreviewSection usam)
- **Card pattern**: `border-border/50 bg-card transition-shadow hover:shadow-md` (usado em HowItWorksSection e PreviewSection)
- **Ícones**: `lucide-react` para ícones — já importado nos componentes existentes
- **Responsive**: mobile-first, breakpoint `md:` para layout desktop

### SSG — cuidados críticos (iguais à Story 6.1)

- **NÃO importar** `supabase.ts`, `useAuth`, `useQuery` ou qualquer hook que dependa de runtime — SSG quebra
- `new Date().getFullYear()` é seguro em SSG (roda em build-time, retorna ano do build)
- Componentes devem ser puramente estáticos — sem `useState`, `useEffect` ou side effects
- Links internos com `Link` do react-router-dom; links externos com `<a>` + `target="_blank"` + `rel="noopener noreferrer"`

### Carousel de depoimentos — implementação recomendada

Usar scroll horizontal nativo em vez de biblioteca de carousel (evitar nova dependência):
```
<div className="flex gap-6 overflow-x-auto scroll-snap-x-mandatory pb-4 md:grid md:grid-cols-3">
  {testimonials.map(t => <Card className="min-w-[280px] scroll-snap-start flex-shrink-0 md:min-w-0" />)}
</div>
```
**Em mobile**: cards empilham com `space-y-6` (sem scroll horizontal — UX melhor em telas pequenas).
**Em desktop**: grid 3 colunas (sem scroll) se ≤3 depoimentos; scroll horizontal se >3.

**Alternativa mais simples (recomendada para MVP com 3-4 depoimentos)**: grid `md:grid-cols-2 lg:grid-cols-3` em desktop, `space-y-6` em mobile. Scroll horizontal é overengineering para 3-4 cards.

### FAQ — conteúdo sugerido

| # | Pergunta | Resposta (resumo) |
|---|----------|-------------------|
| 1 | O que é o Currículo Medway? | Ferramenta gratuita que analisa seu currículo e calcula seu score para programas de residência médica das maiores instituições do Brasil. |
| 2 | É gratuito? | Sim, 100% gratuito. Sem cobrança, sem plano premium. |
| 3 | Como o score é calculado? | Baseado nas regras oficiais dos editais de cada instituição. Cada categoria (formação, experiência, publicações, etc.) tem peso definido pelo edital. |
| 4 | Quais instituições estão disponíveis? | Cobrimos as maiores instituições de residência médica do Brasil. A lista é atualizada conforme novos editais são publicados. |
| 5 | Meus dados estão seguros? | Sim. Usamos criptografia e seguimos a LGPD. Você pode excluir seus dados a qualquer momento. Veja nossa [Política de Privacidade](/privacidade). |
| 6 | Posso atualizar meu currículo depois? | Sim. Seu currículo é salvo automaticamente e você pode editar sempre que quiser. |

### Rotas que já existem (NÃO criar)

- `/termos` — página de Termos de Uso (Story 5.1, done)
- `/privacidade` — página de Política de Privacidade (Story 5.1, done)
- `/signup` — cadastro público (Story 1.5, done)

### O que NÃO fazer

- **NÃO instalar bibliotecas novas** — shadcn/ui (Accordion, Avatar, Card, Button) + Lucide + Tailwind são suficientes
- **NÃO usar carousel library** (embla, swiper, etc.) — scroll nativo ou grid simples
- **NÃO criar API routes** — tudo é estático/SSG
- **NÃO usar animações complexas** (framer-motion, GSAP) — CSS transitions simples, respeitar `prefers-reduced-motion`
- **NÃO modificar** `vite.config.ts`, `src/router.tsx`, `src/main.tsx` — nenhuma mudança de infra necessária
- **NÃO tocar em componentes de features** (scoring, curriculum, admin) — esta story é isolada na landing
- **NÃO usar `useState`/`useEffect`** nos componentes de seção — SSG exige componentes estáticos

### Testes — patterns da Story 6.1 a seguir

**Unit tests** (`Landing.test.tsx`):
- Wrapper com `MemoryRouter`
- `screen.getByRole("heading", { level: 2, name: "..." })` para títulos de seção
- `screen.getByRole("link", { name: "..." }).toHaveAttribute("href", "...")` para links
- `screen.getByText(...)` para conteúdo textual
- Para FAQ accordion: `fireEvent.click(trigger)` + `expect(content).toBeVisible()` ou `waitFor`

**SSG tests** (`Landing.ssg.test.ts`):
- Lê `dist/index.html` com `fs.readFileSync`
- `expect(html).toMatch(/id="social-proof"/)` para presença de seções
- Skip se `dist/index.html` não existe

### Project Structure Notes

- Novos componentes em `src/components/features/landing/` (consistência com HeroSection, HowItWorksSection, PreviewSection)
- Landing.tsx continua como page compositor em `src/pages/Landing.tsx`
- Sem conflitos com outras rotas — Epic 6 é isolado
- Footer pode ser extraído para `src/components/layout/` se for reutilizado em outras páginas no futuro, mas no MVP fica em `features/landing/` (princípio YAGNI)

### References

- [Source: planning-artifacts/epics.md#Story 6.2] — acceptance criteria e escopo consolidado
- [Source: planning-artifacts/architecture.md#Frontend Architecture] — SSG via vite-ssg, shadcn/ui, React Router v6
- [Source: planning-artifacts/architecture.md#Structure Patterns] — organização por feature em `src/components/features/`
- [Source: planning-artifacts/ux-design-specification.md#UX-DR17] — Landing via SSG; max-w-5xl
- [Source: planning-artifacts/ux-design-specification.md] — "pertencimento silencioso", sem comparação social agressiva
- [Source: planning-artifacts/ux-design-specification.md#UX-DR33] — Microcopy pt-BR, 2ª pessoa direta, imperativo afirmativo
- [Source: implementation-artifacts/6-1-*.md] — patterns de implementação, composição, testes, SSG cuidados
- [Source: src/components/ui/accordion.tsx] — Accordion shadcn já instalado (Radix UI)
- [Source: src/components/ui/avatar.tsx] — Avatar shadcn já instalado (Radix UI)
- [Source: src/components/features/landing/HowItWorksSection.tsx] — referência de card pattern e layout grid
- [Source: src/components/features/landing/PreviewSection.tsx] — referência de card pattern com ícones

### Learnings da Story 6.1

- HeroSection usa gradiente `from-primary via-primary to-accent/20` — CTA banner deve usar paleta complementar (accent/teal) para contraste visual
- PreviewSection foi alterada de screenshots para cards de benefícios durante review — desvios do spec são aceitos se comunicam valor melhor
- CTA "Criar minha conta" foi mantido em vez de "Começar" por ser mais persuasivo — manter consistência de tom
- Build SSG: 368/368 testes passando, lint com 1 erro pré-existente (GapAnalysisList.tsx) e 8 warnings pré-existentes em ui/ — não introduzir novos
- Número "11 instituições" removido do hero microcopy por ser hardcode frágil — no FAQ, usar linguagem genérica ("maiores instituições") em vez de número fixo

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

Nenhum blocker ou debug significativo durante implementação.

### Completion Notes List

- Task 1: SocialProofSection criado com 3 depoimentos mock, tipo `Testimonial` exportado, prop `testimonials?` para troca futura por dados dinâmicos. Avatar com `aria-hidden="true"`. Layout grid responsivo (1 col mobile, 2 md, 3 lg). Pendência registrada em deferred-work.md.
- Task 2: FaqSection com 6 perguntas usando Accordion shadcn `type="single" collapsible`. Link para `/privacidade` na resposta sobre dados/LGPD.
- Task 3: CtaBannerSection com background accent, headline persuasivo e CTA Button lg → `/signup`.
- Task 4: FooterSection semântico (`<footer role="contentinfo">`), links internos via `Link` react-router, link externo medway.com.br com `target="_blank" rel="noopener noreferrer"`, ano dinâmico, touch targets ≥44px.
- Task 5: Landing.tsx refatorado de `<main>` para `<div>` wrapper com `<main>` interno + `<FooterSection />` fora do main (semântica HTML).
- Task 6: 8 testes unitários adicionados (social-proof, FAQ accordion, CTA banner, footer) + 4 testes SSG. 381/381 testes passam, zero regressões. Lint com 1 erro pré-existente (GapAnalysisList.tsx) e 8 warnings pré-existentes — nenhum novo.

### Review Findings

- [x] [Review][Decision] CTA Banner: alinhado com spec AC5 — background teal (`bg-gradient-to-br from-accent via-accent to-accent/80`), Button primário (`variant="default"`), texto `text-accent-foreground`
- [x] [Review][Decision] Social proof: carousel horizontal em desktop (`md:overflow-x-auto md:snap-x md:snap-mandatory`), cards empilhados em mobile — alinhado com spec AC1
- [x] [Review][Patch] Footer `<nav>` com `aria-label="Links do rodapé"` [FooterSection.tsx:11]
- [x] [Review][Patch] Link externo `medway.com.br` com `<span className="sr-only"> (abre em nova aba)</span>` [FooterSection.tsx:30]
- [x] [Review][Patch] `key={index}` em vez de `key={t.name}` [SocialProofSection.tsx:49]
- [x] [Review][Defer] Sem skip-to-content link na landing page (WCAG 2.4.1) — deferred, pre-existing concern para toda a landing

### Change Log

- 2026-04-19: Story 6.2 implementada — social proof, FAQ, CTA banner e footer adicionados à landing page. 4 componentes criados, Landing.tsx atualizado, 12 testes adicionados (8 unit + 4 SSG).

### File List

- `src/components/features/landing/SocialProofSection.tsx` (novo)
- `src/components/features/landing/FaqSection.tsx` (novo)
- `src/components/features/landing/CtaBannerSection.tsx` (novo)
- `src/components/features/landing/FooterSection.tsx` (novo)
- `src/pages/Landing.tsx` (modificado)
- `src/pages/Landing.test.tsx` (modificado)
- `src/pages/Landing.ssg.test.ts` (modificado)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modificado)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modificado)
