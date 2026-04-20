-- 0037_improve_descriptions.sql
-- Melhorar descrições das regras para serem claras para o aluno
-- Princípio: ao ler "Como Pontuar", o aluno sabe O QUE PRECISA e QUANTO VALE

-- =============================================================================
-- EINSTEIN
-- =============================================================================
UPDATE scoring_rules SET description = 'Horas totais de Iniciação Científica: mais de 400h (30pts) | 301 a 400h (25pts) | 201 a 300h (20pts) | 101 a 200h (15pts) | até 100h (5pts)'
WHERE field_key = 'ic_horas_totais' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Einstein');

UPDATE scoring_rules SET description = 'Pós-graduação: Doutorado concluído (30pts) | Doutorado em curso (15pts) | Mestrado concluído (25pts) | Mestrado em curso (10pts)'
WHERE field_key = 'mestrado_status' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Einstein');

UPDATE scoring_rules SET description = 'Até 3 artigos publicados no PubMed. A pontuação depende da sua posição de autoria (1º autor ou coautor) e do Fator de Impacto (JCR) da revista.'
WHERE field_key = 'artigo_1_posicao' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Einstein');

-- =============================================================================
-- SES-PE
-- =============================================================================
UPDATE scoring_rules SET description = 'Aproveitamento curricular do histórico escolar. Média ≥9 (30pts) | ≥8 (25pts) | ≥7 (20pts) | ≥6 (15pts) | ≥5 (10pts)'
WHERE field_key = 'media_geral' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-PE');

UPDATE scoring_rules SET description = 'Monitoria e/ou PID: 5 pontos por cada semestre. Máximo 15 pontos.'
WHERE field_key = 'monitoria_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-PE');

UPDATE scoring_rules SET description = 'Iniciação Científica (PIBIC, PIC): 5 pontos por projeto. Conta projetos com e sem bolsa. Máximo 15 pontos.'
WHERE field_key = 'ic_projetos' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-PE');

UPDATE scoring_rules SET description = 'Projetos de extensão e/ou PET-Saúde: 5 pontos por semestre de participação. Máximo 20 pontos.'
WHERE field_key = 'extensao_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-PE');

UPDATE scoring_rules SET description = 'Artigos publicados em periódicos: 5 pontos por artigo. Máximo 10 pontos.'
WHERE field_key = 'publicacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-PE');

UPDATE scoring_rules SET description = 'Trabalhos apresentados em eventos científicos: 2,5 pontos por trabalho. Máximo 10 pontos.'
WHERE field_key = 'apresentacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-PE');

-- =============================================================================
-- SES-DF
-- =============================================================================
UPDATE scoring_rules SET description = 'Monitoria em disciplinas regulares da graduação: 0,5 ponto por semestre completo (mín 90 dias). Máximo 1 ponto.'
WHERE field_key = 'monitoria_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules SET description = 'Extensão extracurricular (teto compartilhado de 1 ponto): Cursos na área médica ≥20h (0,1pt cada) | Projeto de extensão (0,5pt por semestre) | Estágio em hospital com residência (0,1pt a cada 40h)'
WHERE field_key = 'estagio_extracurricular_horas' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules SET description = 'Participação como ouvinte em congressos, simpósios, fóruns e jornadas na área médica: 0,1 ponto por evento. Máximo 1 ponto.'
WHERE field_key = 'ouvinte_congresso' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules SET description = 'Apresentação de trabalho (oral ou poster) em congressos, simpósios ou jornadas: 0,2 ponto por trabalho. Máximo 1 ponto.'
WHERE field_key = 'apresentacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules SET description = 'Artigos científicos (teto compartilhado de 1 ponto): Artigo em revista indexada com DOI (0,5pt cada) | Artigo em revista não indexada (0,2pt cada)'
WHERE field_key = 'publicacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules SET description = 'Iniciação Científica, PET ou Ciências sem Fronteiras: 0,5 ponto por semestre de participação. Máximo 1 ponto.'
WHERE field_key = 'ic_projetos' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules SET description = 'Premiação na área médica: 0,25 ponto por premiação recebida. Máximo 0,5 ponto.'
WHERE field_key = 'premios_academicos' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules SET description = 'Participação no Projeto Rondon: 1 ponto.'
WHERE field_key = 'projeto_rondon' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules SET description = 'Experiência profissional no SUS com carga horária mín 20h/semana: 0,5 ponto a cada 5 meses de atuação. Máximo 2 pontos.'
WHERE field_key = 'trabalho_sus_meses' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules SET description = 'Histórico acadêmico do internato com conceito A (ou superior), nota ≥8 ou aproveitamento ≥80%: 0,5 ponto.'
WHERE field_key = 'media_geral' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

-- =============================================================================
-- SANTA CASA SP
-- =============================================================================
UPDATE scoring_rules SET description = 'Classificação da faculdade no Ranking Universitário Folha de São Paulo 2024: 1ª a 35ª posição (20pts) | 36ª a 45ª posição (15pts) | Demais faculdades (5pts)'
WHERE field_key = 'ranking_ruf_top35' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

UPDATE scoring_rules SET description = 'Internato realizado em hospital escola próprio da faculdade: Sim (10pts) | Não (0pts)'
WHERE field_key = 'internato_hospital_ensino' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

UPDATE scoring_rules SET description = 'Publicou artigo em revista indexada durante a graduação? Sim (10pts) | Não (0pts)'
WHERE field_key = 'publicacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

UPDATE scoring_rules SET description = 'Trabalhos apresentados em eventos médicos durante a graduação: Nenhum (0pts) | 1 trabalho (2,5pts) | 2 trabalhos (5pts) | 3 ou mais (10pts)'
WHERE field_key = 'apresentacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

UPDATE scoring_rules SET description = 'Participação em eventos médicos durante a graduação (como ouvinte): Nenhum (0pts) | 1 evento (2,5pts) | 2 ou mais (5pts)'
WHERE field_key = 'ouvinte_congresso' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

UPDATE scoring_rules SET description = 'Possui certificado de curso ou proficiência em língua inglesa? Sim (10pts) | Não (0pts)'
WHERE field_key = 'ingles_fluente' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

UPDATE scoring_rules SET description = 'Participou de ligas acadêmicas durante a graduação? Sim (10pts) | Não (0pts)'
WHERE field_key = 'membro_liga_anos' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

UPDATE scoring_rules SET description = 'Participou de atividades de monitoria durante a graduação? Sim (10pts) | Não (0pts)'
WHERE field_key = 'monitoria_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

UPDATE scoring_rules SET description = 'Possui atividade científica contemplada com bolsa auxílio? Sim (10pts) | Não (0pts)'
WHERE field_key = 'ic_projetos' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

UPDATE scoring_rules SET description = 'Atividades de interesse não contempladas nos itens anteriores (voluntariado, projetos sociais, extensão): 1 ou mais atividades (5pts) | Nenhuma (0pts)'
WHERE field_key = 'voluntariado_horas' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

-- =============================================================================
-- UNICAMP
-- =============================================================================
UPDATE scoring_rules SET description = 'Sua faculdade possui programa de pós-graduação credenciado pela CAPES? Com Doutorado stricto sensu (15pts) | Só Mestrado stricto sensu (10pts) | Não possui (0pts)'
WHERE field_key = 'faculdade_tem_doutorado' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Tipo de hospital de ensino da sua faculdade: Hospital próprio (10pts) | Hospital conveniado (5pts) | Não possui (0pts)'
WHERE field_key = 'internato_hospital_ensino' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Iniciação Científica: Com bolsa por mais de 2 semestres (20pts) | Com bolsa até 2 semestres (15pts) | Sem bolsa por mais de 2 semestres (10pts) | Sem bolsa até 2 semestres (5pts)'
WHERE field_key = 'ic_projetos' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Artigo completo publicado em periódico indexado: PubMed (10pts por artigo) | SCIELO/SCOPUS (5pts por artigo). Máximo 15 pontos.'
WHERE field_key = 'publicacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Trabalho apresentado em congresso: Oral em Sociedade Médica (10pts) | Poster em Sociedade Médica (6pts) | Oral em congresso acadêmico (2pts) | Poster em congresso acadêmico (2pts). Máximo 10 pontos.'
WHERE field_key = 'apresentacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Liga acadêmica comprovada: Diretoria (5pts) | Membro ligante (2pts). Máximo 5 pontos.'
WHERE field_key = 'membro_liga_anos' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Cursos de aprimoramento: Curso em área de saúde com mais de 12h (1pt cada) | Curso de suporte de vida — ACLS, ATLS, PALS (2pts cada). Máximo 5 pontos.'
WHERE field_key = 'cursos_suporte' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Monitoria ou estágio PAD: Mais de 2 semestres (5pts) | Até 2 semestres (2pts)'
WHERE field_key = 'monitoria_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Trabalho voluntário social: Mais de 96 horas (5pts) | Entre 48 e 96 horas (2pts) | Menos de 48 horas (0pts)'
WHERE field_key = 'voluntariado_horas' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Representante discente em colegiados institucionais (conselhos, congregação, diretórios nacionais) por pelo menos 1 semestre: 5 pontos.'
WHERE field_key = 'colegiado_institucional_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

UPDATE scoring_rules SET description = 'Representação estudantil (mín 2 semestres): Centro acadêmico / Diretório (2pts) | Atlética (2pts) | Equipe esportiva universitária (1pt). Máximo 5 pontos.'
WHERE field_key = 'centro_academico_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

-- =============================================================================
-- USP-RP
-- =============================================================================
UPDATE scoring_rules SET description = 'Histórico acadêmico (teto 1,5pt): Sua faculdade tem hospital próprio? (1pt) | Programas CAPES: 5 ou mais (0,5pt) | 2 a 4 (0,3pt) | 1 programa (0,2pt)'
WHERE field_key = 'internato_hospital_ensino' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-RP');

UPDATE scoring_rules SET description = 'Atividades assistenciais (teto 2pts): Plantão voluntário — 0,5pt a cada 120h (máx 1pt) | Liga estudantil — 0,5pt por ano (máx 1pt) | Trabalho voluntário social — 0,5pt a cada 120h (máx 1pt)'
WHERE field_key = 'estagio_extracurricular_horas' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-RP');

UPDATE scoring_rules SET description = 'Atividades científicas (teto 3pts): Artigo indexado — 1pt por artigo (máx 3pts) | IC com bolsa — 0,7pt por ano (máx 1,4pt) | IC sem bolsa — 0,5pt por ano (máx 1pt) | Apresentação oral — 0,5pt (máx 1pt) | Poster regional (0,1pt) | nacional (0,15pt) | internacional (0,3pt) — máx 0,6pt'
WHERE field_key = 'publicacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-RP');

UPDATE scoring_rules SET description = 'Atividades de ensino (teto 1,5pt): Monitoria com bolsa — 0,5pt por ano (máx 1pt) | Professor de cursinho — 0,5pt por ano (máx 1pt) | Organização de eventos — 0,3pt cada (máx 0,6pt) | Teste de Progresso — 0,5pt por prova (máx 1pt) | Prêmios acadêmicos — 0,2pt cada (máx 0,4pt)'
WHERE field_key = 'monitoria_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-RP');

UPDATE scoring_rules SET description = 'Atividades estudantis (teto 2pts): CA ou Atlética — 0,5pt por ano (máx 1pt) | Representante em colegiado oficial — 0,5pt por ano (máx 1pt) | Comissão de avaliação ou reforma curricular — 0,5pt por ano (máx 1pt)'
WHERE field_key = 'centro_academico_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-RP');

-- =============================================================================
-- PSU-GO
-- =============================================================================
UPDATE scoring_rules SET description = 'Possui diploma de medicina ou registro no CRM: 0,1 ponto.'
WHERE field_key = 'media_geral' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Monitoria oficial com duração mínima de 4 meses: 0,25 ponto por semestre. Máximo 0,5 ponto.'
WHERE field_key = 'monitoria_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Bolsa de pesquisa (PIBIC, PIVIC, PET, PROBEC, PROEXT ou agências de fomento): 0,45 ponto por pesquisa com bolsa. Máximo 0,9 ponto.'
WHERE field_key = 'ic_projetos' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Apresentação de trabalho científico em congresso médico (autor ou coautor): 0,25 ponto por trabalho. Máximo 1 ponto.'
WHERE field_key = 'apresentacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Publicação de artigo completo ou capítulo de livro em periódico com corpo editorial: 0,5 ponto por publicação. Máximo 1,5 pontos.'
WHERE field_key = 'publicacoes' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Participação em congressos, jornadas ou atividades de extensão na área de saúde (mín 8h ou 2 dias): 0,1 ponto por evento. Máximo 1 ponto.'
WHERE field_key = 'ouvinte_congresso' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Participação em liga acadêmica por pelo menos 2 semestres: 0,25 ponto por ano. Máximo 0,5 ponto (até 2 ligas).'
WHERE field_key = 'membro_liga_anos' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Cargo de presidente, diretor, secretário ou tesoureiro em Diretório Acadêmico, liga ou representação discente em órgão oficial: 0,25 ponto por representação. Máximo 0,5 ponto.'
WHERE field_key = 'centro_academico_semestres' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Teste de Progresso: 0,5 ponto por participação (até 3). Bonificação ENADE aplicada automaticamente. Máximo 1,5 ponto.'
WHERE field_key = 'teste_progresso' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Aprovação em curso de suporte avançado à vida (ATLS, ACLS, BLS, PALS ou PHTLS) dentro do prazo de validade: 0,5 ponto por curso. Máximo 1 ponto.'
WHERE field_key = 'cursos_suporte' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Aprovação em Prova de Proficiência em Medicina realizada por Associação Médica ou CRM: 1 ponto.'
WHERE field_key = 'prova_proficiencia_medicina' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

UPDATE scoring_rules SET description = 'Estágio supervisionado no exterior ou no Brasil com no mínimo 1 mês de duração e certificado assinado: 0,5 ponto.'
WHERE field_key = 'estagio_extracurricular_horas' AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

-- =============================================================================
-- Marcar scores stale para recalcular breakdown com novas descrições
-- =============================================================================
UPDATE user_scores SET stale = true;
