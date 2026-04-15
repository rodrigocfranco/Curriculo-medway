---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
completedAt: '2026-04-13'
inputDocuments: []
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: web_app
  domain: edtech
  complexity: medium
  projectContext: brownfield
---

# Product Requirements Document - Medway Currículo

**Author:** Rcfranco
**Date:** 2026-04-13

## Índice

1. [Executive Summary](#executive-summary)
2. [Classificação do Projeto](#classificação-do-projeto)
3. [Critérios de Sucesso](#critérios-de-sucesso)
4. [Jornadas do Usuário](#jornadas-do-usuário)
5. [Requisitos Específicos de Domínio](#requisitos-específicos-de-domínio)
6. [Requisitos Específicos de Web App](#requisitos-específicos-de-web-app)
7. [Escopo do Projeto e Desenvolvimento Faseado](#escopo-do-projeto-e-desenvolvimento-faseado)
8. [Requisitos Funcionais](#requisitos-funcionais)
9. [Requisitos Não-Funcionais](#requisitos-não-funcionais)

## Executive Summary

O **Medway Currículo** é uma plataforma web de diagnóstico e acompanhamento curricular para candidatos a programas de residência médica no Brasil. A ferramenta permite que estudantes de medicina — do ciclo básico ao recém-formado — insiram dados do seu currículo e recebam scores calculados conforme os critérios reais dos editais de cada instituição, para múltiplas especialidades.

O produto é uma ferramenta de captação de leads da Medway, posicionada como primeiro ponto de contato com alunos que buscam clareza sobre sua competitividade curricular. O cadastro (nome, email, telefone, estado, faculdade, ano de formação, especialidade desejada) é obrigatório para acesso aos resultados, alimentando o funil comercial da Medway.

A visão de longo prazo evolui em 3 fases: **Fase 1** — calculadora profissional com persistência, histórico de evolução e gap analysis por instituição; **Fase 2** — IA gerando planos de ação personalizados baseados no tempo disponível do aluno até a prova; **Fase 3** — marketplace conectando alunos a oportunidades reais (congressos, ligas, trabalhos científicos) via parcerias, com notificações proativas.

O uso esperado é periódico (aproximadamente mensal), funcionando como um farol de orientação, não como ferramenta de uso diário.

### O Que Torna Este Produto Especial

Não há ferramenta consolidada neste espaço. Existem planilhas avulsas e calculadoras informais, mas nenhum produto profissional que centralize cálculos de múltiplas instituições com dados reais de editais. A Medway ocupa este vácuo com três vantagens competitivas: **marca de confiança** consolidada entre estudantes de medicina, **conhecimento profundo dos editais** de residência, e **visão de produto** que transforma uma calculadora passiva em um assistente proativo de construção de carreira.

O diferencial estrutural é o motor de regras dinâmico — editais mudam anualmente, pontuações variam por especialidade dentro da mesma instituição, e o sistema precisa absorver essas mudanças sem depender de deploys complexos. Isso cria uma barreira de entrada significativa para competidores.

## Classificação do Projeto

| Dimensão | Valor |
|----------|-------|
| **Tipo de Projeto** | Web App (SPA) — React + TypeScript + Tailwind CSS |
| **Domínio** | EdTech — Educação médica e preparação para residência |
| **Complexidade** | Média — LGPD, motor de regras dinâmico, dados pessoais de estudantes |
| **Contexto** | Brownfield — Evolução de protótipo existente (Lovable) para produto profissional |
| **Hospedagem** | Railway (inicial) → Google Cloud (produção) |
| **Design System** | Medway Design System — Navy #00205B, Teal #01CFB5, Montserrat, mobile-friendly desktop-first |

## Critérios de Sucesso

### Sucesso do Usuário

- O aluno vê seus scores por instituição na primeira sessão após preencher o currículo — **"agora sei onde estou"**
- O aluno entende exatamente onde pode ganhar mais pontos em cada instituição — **"agora sei o que me falta"**
- O aluno retorna à plataforma (~1x/mês) para reavaliar seu progresso após investir em atividades curriculares
- Dados persistem entre sessões — nenhum preenchimento é perdido

### Sucesso do Negócio

- **Métrica principal:** Milhares de cadastros (leads) nos primeiros meses pós-lançamento
- **Lead qualificado:** Qualquer cadastro é útil, mesmo sem preenchimento completo do currículo
- **Dados de cadastro captados:** nome, email, telefone, estado, ano de formação, faculdade, especialidade desejada — alimentando o funil comercial Medway
- Taxa de preenchimento completo do currículo como métrica secundária de engajamento

### Sucesso Técnico

- Plataforma estável e funcional até final de abril/2026
- Cálculos de score refletindo fielmente os editais das 11 instituições atuais
- Backend com motor de regras editável, preparado para atualizações de editais (temporada jul-nov)
- Design System Medway aplicado consistentemente
- Desktop-first com experiência mobile funcional

### Resultados Mensuráveis

| Métrica | Alvo | Prazo |
|---------|------|-------|
| Cadastros (leads) | Milhares | 3 meses pós-lançamento |
| Instituições cobertas | 11 (atuais) | Lançamento |
| Uptime | 99%+ | Contínuo |
| Tempo de carregamento | < 3s | Lançamento |

## Jornadas do Usuário

### Jornada 1 — Lucas, o candidato estratégico

**Persona:** Lucas, 24 anos, 5º ano de Medicina na UFMG. Sonha com Dermatologia na USP-SP. Sabe que são poucas vagas e que currículo pesa muito. Tem 2 anos pela frente e quer usar esse tempo de forma inteligente.

**Cena de abertura:** Lucas está numa roda de conversa com colegas após uma aula. Um amigo comenta: "tu viu que tem uma plataforma da Medway que mostra como tá seu currículo pra cada instituição?" Lucas já conhece a Medway dos cursos, então a confiança é imediata. Naquela mesma noite, abre o link no notebook.

**Ação crescente:**
1. Chega na landing page — vê a proposta: "Descubra como está seu currículo para as maiores instituições de residência do Brasil"
2. Clica em "Começar" — cai na tela de cadastro. Preenche nome, email, telefone, estado (MG), faculdade (UFMG), ano de formação (2028), especialidade desejada (Dermatologia)
3. Entra no formulário de currículo — começa a preencher. Tem 1 artigo publicado em revista nacional, fez 2 semestres de IC com bolsa, é membro de uma liga há 1 ano, foi a 2 congressos como ouvinte, fala inglês fluente
4. Vai preenchendo seção por seção. Alguns campos ele deixa zerado — nunca fez monitoria, não tem voluntariado, não organizou evento

**Clímax:** Lucas termina de preencher e vê o dashboard de resultados. USP-SP: **32/100**. O número é um soco no estômago. Mas ele clica nos detalhes e vê o **gap analysis**: "Publicações: 2/30 — você pode ganhar até 28 pontos publicando artigos de maior impacto." "Monitoria: 0/10 — qualquer semestre de monitoria já soma pontos." "IC: 8/15 — continuar a IC por mais horas te leva ao máximo." Ele começa a entender **exatamente** onde investir.

**Resolução:** Lucas sai da plataforma com um mapa mental claro. Nos próximos dias, se inscreve como monitor e começa a buscar publicações com orientador. Um mês depois, volta ao Medway Currículo, atualiza os dados e vê o score subir para 38/100. O farol está funcionando.

### Jornada 1b — Lucas, cenário de erro e retorno

**Cenário:** Lucas começa a preencher o currículo no celular durante um intervalo de aula. Preenche metade e precisa voltar pra aula. Fecha o navegador.

**Recuperação:** No dia seguinte, abre no notebook, faz login, e encontra tudo salvo exatamente onde parou. Termina o preenchimento sem refazer nada.

### Jornada 2 — Rcfranco, o Admin operador

**Persona:** Rcfranco, responsável pelo produto e única pessoa gerenciando a plataforma inicialmente. Acumula dev, produto e operação.

**Cena de abertura:** Agosto de 2026. Começaram a sair os editais de residência. A USP-SP publicou o edital novo e mudou a pontuação de publicações — agora artigos de alto impacto valem mais. Rcfranco precisa atualizar isso antes que os alunos vejam scores desatualizados.

**Ação crescente:**
1. Acessa o sistema de gestão de regras (backend/admin ou via Claude Code)
2. Localiza a instituição USP-SP e a regra de publicações
3. Atualiza os valores de pontuação conforme o novo edital
4. Salva — os scores de todos os alunos que têm USP-SP como instituição de interesse são recalculados automaticamente

**Clímax:** Verifica que os scores foram atualizados corretamente. O Lucas, que tinha 32/100, agora mostra 35/100 porque a nova regra favorece o tipo de publicação que ele tem.

**Resolução:** Rcfranco segue para a aba de leads. Vê que na última semana entraram 180 novos cadastros. Exporta o lote para o Hubspot para o time comercial trabalhar. Rotina que acontece ao longo do ano todo.

### Jornada 2b — Admin, cenário de edital com especialidade

**Cenário:** O edital da UNICAMP sai com pontuações **diferentes por especialidade** — Cirurgia Geral pontua IC diferente de Clínica Médica.

**Ação:** Rcfranco acessa o motor de regras, seleciona UNICAMP, e configura variações por especialidade. O sistema agora calcula scores distintos para o mesmo aluno dependendo da especialidade escolhida.

### Resumo de Requisitos por Jornada

| Jornada | Capacidades reveladas |
|---------|----------------------|
| **Lucas — happy path** | Landing page, cadastro, formulário de currículo, cálculo de scores, gap analysis, dashboard, persistência |
| **Lucas — erro/retorno** | Autenticação/login, persistência entre sessões, experiência mobile funcional |
| **Admin — atualização de regras** | Motor de regras editável, recálculo automático de scores, gestão por instituição |
| **Admin — gestão de leads** | Visualização de leads, exportação para Hubspot/CRM, filtros e métricas |
| **Admin — regras por especialidade** | Motor de regras com granularidade instituição x especialidade |


## Requisitos Específicos de Domínio

### Compliance e Regulatório

- **LGPD:** Termo de aceite obrigatório no cadastro ("ao continuar, você aceita nossos Termos de Uso e Política de Privacidade") com links para os documentos jurídicos
- **Direito ao esquecimento:** Funcionalidade de exclusão de conta/dados deve existir (requisito LGPD)
- **Transparência de dados:** Informar que dados podem ser utilizados de forma agregada e anonimizada para benchmarks

### Validade do Conteúdo

- **Disclaimer obrigatório:** Aviso visível de que os cálculos são estimativas baseadas em editais públicos e não constituem garantia de pontuação real — a instituição é a autoridade final
- **Fonte vinculada:** Cada instituição deve ter link para o edital original (upload do PDF em drive público ou link direto para o documento)
- **Notificação de atualização:** Quando regras de uma instituição são atualizadas, alunos que têm aquela instituição como interesse devem ser notificados (email ou notificação in-app)

### Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Regra de edital interpretada incorretamente | Alunos tomam decisões com base em dados errados | Link direto para edital original disponível ao aluno; upload do PDF para consulta |
| Edital publicado e plataforma desatualizada | Scores defasados geram desconfiança | SLA de **72h** para atualização após publicação do edital |
| Dados pessoais vazados ou mal utilizados | Perda de confiança, risco jurídico | Compliance LGPD, dados agregados/anonimizados, termos claros |
| Aluno toma decisão irreversível baseado apenas no score | Responsabilidade percebida sobre a Medway | Disclaimer claro, link para edital, linguagem de "estimativa" |

## Requisitos Específicos de Web App

### Visão Geral do Tipo de Projeto

Aplicação web com duas camadas distintas: páginas públicas (landing page, SEO) e aplicação autenticada (dashboard, formulário, resultados). Recomendação de framework: **Next.js** (SSG para páginas públicas + SPA para área logada) — sujeito a validação na fase de arquitetura.

### Considerações de Arquitetura Técnica

- **Renderização:** SSG/SSR para páginas públicas (landing, SEO); CSR para área autenticada (dashboard, formulário, resultados)
- **Roteamento:** Páginas públicas vs. protegidas (autenticação como barreira)
- **Cálculo de scores:** Migrar do client-side (atual) para backend — necessário para persistência, recálculo automático por mudança de regras, e integridade dos dados
- **Recálculo por mudança de regras:** Assíncrono, aplicado na próxima sessão do aluno (sem real-time push)
- **API/Backend:** Necessário para autenticação, persistência, motor de regras, gestão de leads, exportação Hubspot

### Suporte a Browsers

- Chrome, Safari, Firefox, Edge (versões atuais e uma anterior)
- Mobile browsers: Chrome Mobile, Safari iOS
- Sem suporte a IE

### Performance

- Tempo de carregamento landing page: < 2s (SSG)
- Tempo de carregamento app logado: < 3s
- Cálculo de scores: < 1s após preenchimento

### SEO

- Landing page com meta tags, Open Graph, sitemap
- SEO básico no lançamento, otimização avançada pós-MVP
- Conteúdo público indexável (landing), área logada não indexada

### Acessibilidade

- Nível básico funcional: contraste adequado, navegação por teclado, labels em formulários, textos legíveis
- Design System Medway já fornece contraste adequado (navy sobre branco)
- Aprofundamento WCAG 2.1 AA como melhoria futura

## Escopo do Projeto e Desenvolvimento Faseado

### Estratégia e Filosofia do MVP

**Abordagem:** MVP de resolução de problema — entregar a menor coisa que faz o aluno dizer "agora sei onde estou e o que me falta".

**Recursos:** 1 desenvolvedor (Rcfranco), prazo até final de abril/2026.

**Stack aceleradora:** Supabase (Postgres + Auth + Storage + API) para minimizar tempo em infraestrutura e maximizar tempo em valor de produto.

### Feature Set do MVP (Fase 1)

**Jornadas suportadas:**
- Lucas (aluno) — happy path completo: landing → cadastro → formulário → scores → gap analysis
- Lucas — retorno: login → dados salvos → atualização
- Admin — atualização de regras de editais via motor de regras
- Admin — visualização e exportação de leads

**Capacidades inegociáveis:**

| # | Capacidade | Justificativa |
|---|-----------|---------------|
| 1 | Landing page com proposta de valor | Porta de entrada, SEO básico |
| 2 | Cadastro de lead (nome, email, telefone, estado, faculdade, ano, especialidade) | Core da captação — razão de existir do produto |
| 3 | Autenticação (login/logout) | Retorno do aluno, persistência |
| 4 | Formulário de currículo | Input de dados do aluno |
| 5 | Motor de regras dinâmico (instituição x especialidade) | Diferencial técnico, escalabilidade de editais |
| 6 | Cálculo de scores por instituição | Proposta de valor principal |
| 7 | Gap analysis — o que falta por instituição | Diferencial de produto, segundo "aha moment" |
| 8 | Dashboard do aluno | Visão consolidada dos resultados |
| 9 | Persistência de dados (Supabase/Postgres) | Aluno não perde dados |
| 10 | Link/upload de edital por instituição | Credibilidade, mitigação de risco |
| 11 | Disclaimer de estimativa | Requisito de domínio |
| 12 | Termos de uso e privacidade (LGPD) | Compliance |
| 13 | Painel admin — gestão de regras | Atualização de editais sem deploy |
| 14 | Painel admin — visualização de leads | Acompanhamento de captação |
| 15 | Exportação de leads (CSV/Hubspot) | Alimentar funil comercial |
| 16 | Design System Medway aplicado | Credibilidade da marca |

**Desejável (entra se o prazo permitir):**

| # | Capacidade | Prioridade |
|---|-----------|-----------|
| D1 | Histórico de evolução do score | Alta |
| D2 | Exportação de resultados por email | Média |
| D3 | Dark mode | Baixa |
| D4 | SEO otimizado avançado | Média |
| D5 | Mobile polido | Média |
| D6 | Notificação ao aluno quando regras mudam | Média |

### Pós-MVP

**Fase 1.5 / Fase 2:**
- Comparação com benchmarks (dados de aprovados Medway)
- Comparação com dados agregados de outros usuários
- IA gerando planos de ação personalizados
- SEO avançado e otimização de conversão
- Mobile totalmente polido

**Fase 3:**
- Marketplace de oportunidades (congressos, ligas, trabalhos científicos)
- Notificações proativas de oportunidades
- Parcerias com instituições e organizadores
- Base de dados real em escala para comparações

### Estratégia de Mitigação de Riscos

| Risco | Mitigação |
|-------|-----------|
| **Técnico — prazo apertado pra 1 dev** | Supabase acelera auth/banco/storage; manter regras existentes como seed inicial; desejáveis podem ser cortados |
| **Técnico — motor de regras complexo** | Começar com estrutura simples (JSON/tabelas Postgres), evoluir conforme necessidade; Claude Code como ferramenta de apoio |
| **Mercado — alunos não adotam** | Landing page com proposta clara; captação via canais Medway existentes; produto gratuito reduz barreira |
| **Operacional — editais em temporada concentrada (jul-nov)** | Motor de regras pronto antes de julho; SLA 72h documentado; processo definido |

## Requisitos Funcionais

### Acesso Público e Captação

- **FR1:** Visitante pode visualizar landing page com proposta de valor do produto
- **FR2:** Visitante pode se cadastrar fornecendo nome, email, telefone, estado, faculdade, ano de formação e especialidade desejada
- **FR3:** Visitante deve aceitar termos de uso e política de privacidade antes de concluir cadastro
- **FR4:** Usuário cadastrado pode fazer login para acessar a área autenticada
- **FR5:** Usuário cadastrado pode fazer logout
- **FR6:** Usuário cadastrado pode recuperar senha

### Gestão de Currículo

- **FR7:** Aluno pode preencher formulário de currículo com dados de publicações, acadêmico, prática/social, liderança/eventos e perfil de formação
- **FR8:** Aluno pode editar dados do currículo a qualquer momento
- **FR9:** Dados do currículo são persistidos automaticamente (sem perda ao fechar navegador)
- **FR10:** Aluno pode visualizar um resumo dos dados preenchidos no currículo

### Cálculo e Resultados

- **FR11:** Sistema calcula scores do aluno para cada instituição com base nas regras do motor de regras
- **FR12:** Aluno pode visualizar scores de todas as 11 instituições disponíveis
- **FR13:** Aluno pode visualizar detalhes do score por categoria dentro de cada instituição
- **FR14:** Aluno pode visualizar gap analysis — pontos possíveis de ganhar por categoria em cada instituição
- **FR15:** Aluno pode visualizar disclaimer informando que scores são estimativas baseadas em editais públicos
- **FR16:** Aluno pode acessar o edital original de cada instituição (link ou PDF)

### Dashboard do Aluno

- **FR17:** Aluno pode visualizar dashboard consolidado com visão geral de todos os scores
- **FR18:** Aluno pode identificar rapidamente instituições onde tem melhor e pior desempenho
- **FR19:** Aluno pode expandir detalhes de cada instituição a partir do dashboard

### Motor de Regras

- **FR20:** Sistema suporta regras de cálculo configuráveis por instituição
- **FR21:** Sistema suporta variações de regras por especialidade dentro da mesma instituição
- **FR22:** Alteração de regras recalcula scores dos alunos na próxima sessão
- **FR23:** Cada regra define: campo do currículo, peso/pontuação, valor máximo e descrição da regra
- **FR24:** Sistema suporta adição de novas instituições sem alteração de código

### Painel Administrativo

- **FR25:** Admin pode criar, editar e remover instituições
- **FR26:** Admin pode criar, editar e remover regras de cálculo por instituição e especialidade
- **FR27:** Admin pode fazer upload ou vincular PDF de edital por instituição
- **FR28:** Admin pode visualizar lista de leads cadastrados com filtros
- **FR29:** Admin pode exportar leads em formato CSV
- **FR30:** Admin pode exportar leads para integração com Hubspot
- **FR31:** Admin pode visualizar métricas básicas de captação (total de cadastros, cadastros por período)

### Compliance e Privacidade

- **FR32:** Sistema exibe termos de uso e política de privacidade no fluxo de cadastro
- **FR33:** Usuário pode solicitar exclusão de seus dados (direito ao esquecimento — LGPD)
- **FR34:** Dados utilizados em comparações futuras são agregados e anonimizados

## Requisitos Não-Funcionais

### Performance

- **NFR1:** Landing page carrega em menos de 2 segundos (SSG)
- **NFR2:** Área autenticada carrega em menos de 3 segundos
- **NFR3:** Cálculo de scores completa em menos de 1 segundo após preenchimento
- **NFR4:** Exportação de leads (CSV) processa até 10.000 registros em menos de 10 segundos
- **NFR5:** Formulário de currículo salva dados com feedback visual em menos de 500ms

### Segurança

- **NFR6:** Dados pessoais armazenados com criptografia em repouso (Supabase Postgres)
- **NFR7:** Comunicação entre cliente e servidor via HTTPS (TLS 1.2+)
- **NFR8:** Autenticação gerenciada pelo Supabase Auth com tokens JWT
- **NFR9:** Painel administrativo acessível apenas por usuários com role admin
- **NFR10:** Senhas armazenadas com hash seguro (bcrypt via Supabase Auth)
- **NFR11:** Dados de leads acessíveis apenas por admin, nunca expostos a alunos

### Escalabilidade

- **NFR12:** Sistema suporta até 1.000 usuários cadastrados no primeiro trimestre sem degradação
- **NFR13:** Sistema suporta até 10.000 usuários cadastrados no primeiro ano sem necessidade de reescrita
- **NFR14:** Banco de dados dimensionado para crescimento (Supabase plano gratuito → Pro conforme demanda)

### Acessibilidade

- **NFR15:** Contraste de cores adequado para leitura (ratio mínimo 4.5:1 para texto)
- **NFR16:** Formulários com labels associadas a inputs
- **NFR17:** Navegação por teclado funcional em todas as telas
- **NFR18:** Textos com tamanho mínimo legível (14px corpo, 12px secundário)

### Integração

- **NFR19:** Exportação de leads compatível com formato de importação do Hubspot
- **NFR20:** Upload de PDFs de editais via Supabase Storage com limite de 10MB por arquivo
- **NFR21:** Links externos para editais abrem em nova aba

### Disponibilidade

- **NFR22:** Uptime mínimo de 99% (dependente de SLA Supabase e Railway/GCloud)
- **NFR23:** Backups automáticos do banco de dados (Supabase nativo)
