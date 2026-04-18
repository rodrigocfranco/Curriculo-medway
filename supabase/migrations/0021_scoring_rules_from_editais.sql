-- 0021_scoring_rules_from_editais.sql
-- Recriar scoring_rules de 6 instituições baseado nos editais reais
-- Ordem: SES-PE, SES-DF, Santa Casa SP, UNICAMP, USP-RP, USP-SP

-- ============================================================================
-- 1. SES-PE — 6 itens, total max 100 pts
-- ============================================================================

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-PE');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- Item 1: Aproveitamento Curricular (Histórico Escolar) — max 30
  ('Perfil', 'media_geral', 30, 30,
   'Pontuação de acordo com quadro de aproveitamento curricular (histórico escolar)',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 9, "pts": 30}, {"gte": 8, "pts": 25}, {"gte": 7, "pts": 20}, {"gte": 6, "pts": 15}, {"gte": 5, "pts": 10}]}'),

  -- Item 2: Monitoria e/ou PID — 5 pts/semestre, max 15
  ('Acadêmico', 'monitoria_semestres', 5, 15,
   'Monitoria e/ou PID (5pts por semestre, máx 15pts)',
   '{"op": "sum", "caps": {"total": 15}, "terms": [{"field": "monitoria_semestres", "mult": 5}]}'),

  -- Item 3: IC — PIBIC, PIC — 5 pts/projeto, max 15
  ('Acadêmico', 'ic_com_bolsa', 5, 15,
   'Iniciação Científica — PIBIC, PIC (5pts por projeto, máx 15pts)',
   '{"op": "sum", "caps": {"total": 15}, "terms": [{"field": "ic_com_bolsa", "mult": 5}, {"field": "ic_sem_bolsa", "mult": 5}]}'),

  -- Item 4: Projetos de extensão e/ou PET-Saúde — 5 pts/semestre, max 20
  ('Acadêmico', 'extensao_semestres', 5, 20,
   'Projetos de extensão e/ou PET-Saúde (5pts por semestre, máx 20pts)',
   '{"op": "sum", "caps": {"total": 20}, "terms": [{"field": "extensao_semestres", "mult": 5}]}'),

  -- Item 5: Artigos publicados — 5 pts/artigo, max 10
  ('Publicações', 'publicacoes', 5, 10,
   'Artigos publicados (5pts por artigo, máx 10pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "artigos_high_impact", "mult": 5}, {"field": "artigos_mid_impact", "mult": 5}, {"field": "artigos_low_impact", "mult": 5}, {"field": "artigos_nacionais", "mult": 5}]}'),

  -- Item 6: Trabalhos em eventos científicos — 2,5 pts/trabalho, max 10
  ('Liderança/Eventos', 'apresentacao_congresso', 2.5, 10,
   'Trabalhos apresentados em eventos científicos (2,5pts por trabalho, máx 10pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "apresentacao_congresso", "mult": 2.5}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'SES-PE';

-- ============================================================================
-- 2. SES-DF — Quadro A-M, total max 10 pts
-- ============================================================================

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- A: Monitoria — 0,5/semestre, max Pontuação máxima
  ('Acadêmico', 'monitoria_semestres', 0.5, 2,
   'Monitoria em disciplinas regulares (0,5pt por semestre)',
   '{"op": "sum", "caps": {"total": 2}, "terms": [{"field": "monitoria_semestres", "mult": 0.5}]}'),

  -- B+C+D: Estágio extracurricular — tiered por horas
  ('Prática/Social', 'estagio_extracurricular_horas', 1, 2,
   'Estágio extracurricular (extensão 0,5pt | residência 1,0pt | biociências 0,5pt)',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 200, "pts": 2.0}, {"gte": 100, "pts": 1.5}, {"gte": 20, "pts": 0.5}]}'),

  -- E: Participação trabalhos científicos, ligas, jornada — 0,5
  ('Liderança/Eventos', 'membro_liga_anos', 0.5, 0.5,
   'Participação em trabalhos científicos, ligas, jornada (0,5pt)',
   '{"op": "any_positive", "pts": 0.5, "fields": ["membro_liga_anos", "diretoria_ligas"]}'),

  -- F: Comunicação em congressos — 0,5/apresentação
  ('Liderança/Eventos', 'apresentacao_congresso', 0.5, 1,
   'Comunicação em congressos e simpósios (0,5pt por apresentação)',
   '{"op": "sum", "caps": {"total": 1}, "terms": [{"field": "apresentacao_congresso", "mult": 0.5}]}'),

  -- G: Artigo científico nacional — 0,5
  ('Publicações', 'artigos_nacionais', 0.5, 0.5,
   'Artigo científico publicado em periódico nacional (0,5pt)',
   '{"op": "threshold", "field": "artigos_nacionais", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- H: Artigo internacional — 2,0/artigo
  ('Publicações', 'artigos_high_impact', 2, 2,
   'Artigo publicado em periódico internacional (2,0pts por artigo)',
   '{"op": "sum", "caps": {"total": 2}, "terms": [{"field": "artigos_high_impact", "mult": 2.0}, {"field": "artigos_mid_impact", "mult": 2.0}]}'),

  -- I: Promoção na área médica — 0,5
  ('Liderança/Eventos', 'organizador_evento', 0.5, 0.5,
   'Promoção de evento na área médica (0,5pt)',
   '{"op": "threshold", "field": "organizador_evento", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- J: Projeto Rondon — 1,0
  ('Prática/Social', 'projeto_rondon', 1, 1,
   'Participação no Projeto Rondon (1,0pt)',
   '{"op": "bool", "field": "projeto_rondon", "pts_true": 1.0}'),

  -- K: Experiência SUS — 0,5 por cada 5 meses
  ('Prática/Social', 'trabalho_sus_meses', 0.5, 1,
   'Experiência profissional comprovada no SUS (0,5pt por cada 5 meses)',
   '{"op": "floor_div", "field": "trabalho_sus_meses", "divisor": 5, "mult": 0.5}'),

  -- M: Histórico acadêmico conceito A ou nota ≥8 — 0,5
  ('Perfil', 'media_geral', 0.5, 0.5,
   'Histórico acadêmico com conceito A ou superior, nota ≥ 8, ou aproveitamento ≥ 80% (0,5pt)',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 8, "pts": 0.5}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'SES-DF';

-- ============================================================================
-- 3. Santa Casa SP — editai recebido
-- ============================================================================

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- Faculdade RUF: 1ª-30ª = 2pts, demais = 0,5pts
  ('Perfil', 'ranking_ruf_top35', 2, 2,
   'Faculdade RUF 1ª-30ª posição (2pts) | Demais (0,5pts)',
   '{"op": "ruf_branch", "field": "ranking_ruf_top35", "pts_true": 2.0, "pts_false": 0.5, "pts_null": 0.5}'),

  -- Publicação artigo revista indexada — max 3
  ('Publicações', 'publicacoes', 3, 3,
   'Publicação de artigo em revista indexada (máx 3pts)',
   '{"op": "sum", "caps": {"total": 3}, "terms": [{"field": "artigos_high_impact", "mult": 1.5}, {"field": "artigos_mid_impact", "mult": 1.5}, {"field": "artigos_low_impact", "mult": 1.0}, {"field": "artigos_nacionais", "mult": 0.5}]}'),

  -- Apresentação trabalho evento médico — max 1,5
  ('Liderança/Eventos', 'apresentacao_congresso', 0.5, 1.5,
   'Apresentação de trabalho em evento médico (0,5pt cada, máx 1,5pts)',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "apresentacao_congresso", "mult": 0.5}]}'),

  -- Proficiência língua — 6pts
  ('Perfil', 'ingles_fluente', 6, 6,
   'Curso de proficiência em língua estrangeira concluído (6pts)',
   '{"op": "bool", "field": "ingles_fluente", "pts_true": 6.0}'),

  -- Ligas — max 10pts (estimativa baseada no edital)
  ('Liderança/Eventos', 'membro_liga_anos', 2, 10,
   'Participação em ligas durante a graduação (máx 10pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "diretoria_ligas", "mult": 4}, {"field": "membro_liga_anos", "mult": 2}]}'),

  -- Monitoria — max pontos
  ('Acadêmico', 'monitoria_semestres', 2, 6,
   'Participação em atividades de monitoria (máx 6pts)',
   '{"op": "sum", "caps": {"total": 6}, "terms": [{"field": "monitoria_semestres", "mult": 2}]}'),

  -- IC com bolsa
  ('Acadêmico', 'ic_com_bolsa', 6, 6,
   'Atividade científica contemplada com bolsa (6pts)',
   '{"op": "threshold", "field": "ic_com_bolsa", "brackets": [{"gte": 1, "pts": 6}]}'),

  -- Atividades de interesse (voluntariado, extensão, etc)
  ('Prática/Social', 'voluntariado_horas', 3, 3,
   'Atividades de interesse — voluntariado, projetos sociais (1 a 3: 3pts)',
   '{"op": "any_positive", "pts": 3, "fields": ["voluntariado_horas", "extensao_semestres", "projeto_rondon"]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'Santa Casa SP';

-- ============================================================================
-- 4. UNICAMP — 6 itens principais + 5 complementares
-- ============================================================================

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- Item 1: Aproveitamento Curricular — max 30
  ('Perfil', 'media_geral', 30, 30,
   'Aproveitamento curricular — histórico escolar (máx 30pts)',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 9, "pts": 30}, {"gte": 8, "pts": 25}, {"gte": 7, "pts": 20}, {"gte": 6, "pts": 15}, {"gte": 5, "pts": 10}]}'),

  -- Item 2: Monitoria e/ou PID — 5pts/semestre, max 15
  ('Acadêmico', 'monitoria_semestres', 5, 15,
   'Monitoria e/ou PID (5pts por semestre, máx 15pts)',
   '{"op": "sum", "caps": {"total": 15}, "terms": [{"field": "monitoria_semestres", "mult": 5}]}'),

  -- Item 3: IC — 5pts/projeto, max 15
  ('Acadêmico', 'ic_com_bolsa', 5, 15,
   'Iniciação Científica — PIBIC, PIC (5pts por projeto, máx 15pts)',
   '{"op": "sum", "caps": {"total": 15}, "terms": [{"field": "ic_com_bolsa", "mult": 5}, {"field": "ic_sem_bolsa", "mult": 5}]}'),

  -- Item 4: Extensão / PET-Saúde — 5pts/semestre, max 20
  ('Acadêmico', 'extensao_semestres', 5, 20,
   'Projetos de extensão e/ou PET-Saúde (5pts por semestre, máx 20pts)',
   '{"op": "sum", "caps": {"total": 20}, "terms": [{"field": "extensao_semestres", "mult": 5}]}'),

  -- Item 5: Artigos publicados — 5pts/artigo, max 10
  ('Publicações', 'publicacoes', 5, 10,
   'Artigos publicados (5pts por artigo, máx 10pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "artigos_high_impact", "mult": 5}, {"field": "artigos_mid_impact", "mult": 5}, {"field": "artigos_low_impact", "mult": 5}, {"field": "artigos_nacionais", "mult": 5}]}'),

  -- Item 6: Trabalhos em eventos — 2,5pts/trabalho, max 10
  ('Liderança/Eventos', 'apresentacao_congresso', 2.5, 10,
   'Trabalhos apresentados em eventos científicos (2,5pts por trabalho, máx 10pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "apresentacao_congresso", "mult": 2.5}]}'),

  -- Item 9: Trabalho voluntário — >96h=5, 48-96h=2, max 5
  ('Prática/Social', 'voluntariado_horas', 5, 5,
   'Trabalho voluntário social (>96h: 5pts | 48-96h: 2pts)',
   '{"op": "tiered", "field": "voluntariado_horas", "tiers": [{"gte": 97, "pts": 5}, {"gte": 48, "pts": 2}]}'),

  -- Item 10: Representação colegiados institucionais — max 5
  ('Liderança/Eventos', 'colegiado_institucional_semestres', 5, 5,
   'Representação em colegiados institucionais — conselhos, congregação (5pts se ≥1 semestre)',
   '{"op": "threshold", "field": "colegiado_institucional_semestres", "brackets": [{"gte": 1, "pts": 5}]}'),

  -- Item 11: Representação discente — CA=2, atlética=2, esporte=1, max 5
  ('Liderança/Eventos', 'centro_academico_semestres', 5, 5,
   'Representação discente: CA/diretório (2pts) | Atlética (2pts) | Equipe esportiva (1pt) — máx 5pts',
   '{"op": "sum", "caps": {"total": 5}, "terms": [{"field": "centro_academico_semestres", "when_gt0": 2}, {"field": "atletica_semestres", "when_gt0": 2}, {"field": "equipe_esportiva_semestres", "when_gt0": 1}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'UNICAMP';

-- ============================================================================
-- 5. USP-RP — seção 5.2 (1,5 + 2,0 + 3,0 pts) + HC FMRP
-- ============================================================================

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-RP');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- 5.2.1: Histórico acadêmico — hospital próprio 1pt + programa residência 0,5pt, max 1,5
  ('Perfil', 'internato_hospital_ensino', 1, 1.5,
   'Hospital universitário próprio (1pt) | Programa residência na instituição (0,5pt)',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 1.0}, {"field": "internato_hospital_ensino", "when_value": "Conveniado", "pts": 0.5}]}'),

  -- 5.2.2: Atividades assistenciais extracurriculares — max 2
  ('Prática/Social', 'estagio_extracurricular_horas', 0.5, 2,
   'Estágio extracurricular atenção primária (0,5pt por 120h) | Trabalho voluntário (0,5pt por 120h)',
   '{"op": "sum", "caps": {"total": 2}, "terms": [{"field": "estagio_extracurricular_horas", "mult": 0.004167}, {"field": "voluntariado_horas", "mult": 0.004167}]}'),

  -- 5.2.3: Atividades científicas — artigos 1º autor/coautor, max 3
  ('Publicações', 'publicacoes', 1, 3,
   'Artigo completo PubMed/SCIELO/SCOPUS: 1º autor (1pt) | Coautor (0,5pt) — máx 3pts',
   '{"op": "sum", "caps": {"total": 3}, "terms": [{"field": "artigos_high_impact", "mult": 1.0}, {"field": "artigos_mid_impact", "mult": 0.5}, {"field": "artigos_nacionais", "mult": 0.5}]}'),

  -- HC FMRP: Eventos científicos — 3,3pts/evento
  ('Liderança/Eventos', 'apresentacao_congresso', 3.3, 6,
   'Participação em eventos científicos (3,3pts por evento, máx 6pts)',
   '{"op": "sum", "caps": {"total": 6}, "terms": [{"field": "apresentacao_congresso", "mult": 3.3}]}'),

  -- HC FMRP: Teste de Progresso / habilidades
  ('Acadêmico', 'teste_progresso', 0.5, 1,
   'Teste de Progresso e provas de habilidades clínicas (0,5pt)',
   '{"op": "threshold", "field": "teste_progresso", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- HC FMRP: Prêmios acadêmicos — 2,3pts cada, max 6,4
  ('Acadêmico', 'premios_academicos', 2.3, 6.4,
   'Prêmios acadêmicos (2,3pts cada, máx 6,4pts)',
   '{"op": "sum", "caps": {"total": 6.4}, "terms": [{"field": "premios_academicos", "mult": 2.3}]}'),

  -- HC FMRP: Cursinhos preparatórios — 1pt
  ('Acadêmico', 'cursinhos_preparatorios', 1, 1,
   'Participação como professor em cursinhos preparatórios para residência (1pt)',
   '{"op": "threshold", "field": "cursinhos_preparatorios", "brackets": [{"gte": 1, "pts": 1}]}'),

  -- Item 5: Atividades estudantil — CA, atlética, representante, max 2
  ('Liderança/Eventos', 'centro_academico_semestres', 1, 2,
   'CA/atlética (1pt cada) | Representante discente em colegiado (1pt) — máx 2pts',
   '{"op": "sum", "caps": {"total": 2}, "terms": [{"field": "centro_academico_semestres", "when_gt0": 1}, {"field": "atletica_semestres", "when_gt0": 1}, {"field": "representante_turma_anos", "when_gt0": 1}]}'),

  -- Ligas — membro/diretoria
  ('Liderança/Eventos', 'membro_liga_anos', 0.5, 2,
   'Liga acadêmica: diretoria (1pt) | membro ligante (0,5pt por ano)',
   '{"op": "sum", "caps": {"total": 2}, "terms": [{"field": "diretoria_ligas", "mult": 1.0}, {"field": "membro_liga_anos", "mult": 0.5}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'USP-RP';

-- ============================================================================
-- 6. USP-SP — 13 itens do edital acesso direto
-- ============================================================================

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-SP');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- Item 1: Pós-graduação — doutorado 3pts/prog (max 4=12), mestrado 2pts/prog (max 3=6), cap 13
  ('Perfil', 'mestrado_status', 13, 13,
   'Doutorado estrito senso (12pts) | Mestrado estrito senso (6pts) — máx 13pts',
   '{"op": "sum", "caps": {"total": 13}, "terms": [{"field": "doutorado_status", "when_value": "Concluído", "pts": 12}, {"field": "mestrado_status", "when_value": "Concluído", "pts": 6, "override_by_field": "doutorado_status", "override_value": "Concluído"}]}'),

  -- Item 2: Hospital de ensino — próprio 12, conveniado 3, max 12
  ('Perfil', 'internato_hospital_ensino', 12, 12,
   'Hospital de ensino próprio (12pts) | Conveniado (3pts)',
   '{"op": "sum", "caps": {"total": 12}, "terms": [{"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 12}, {"field": "internato_hospital_ensino", "when_value": "Conveniado", "pts": 3}]}'),

  -- Item 3: Centro assistencial — primário+sec+terciário 8, primário+sec 2, max 8
  ('Perfil', 'nivel_assistencial', 8, 8,
   'Centro assistencial: Primário+Secundário+Terciário (8pts) | Primário+Secundário (2pts)',
   '{"op": "sum", "caps": {"total": 8}, "terms": [{"field": "nivel_assistencial", "when_value": "Primário, secundário e terciário", "pts": 8}, {"field": "nivel_assistencial", "when_value": "Primário e secundário", "pts": 2}]}'),

  -- Item 4: Monitoria — >2 sem (3pts), 2 sem (2pts), 1 sem (1pt), max 3
  ('Acadêmico', 'monitoria_semestres', 3, 3,
   'Monitoria: >2 semestres CH≥192h (3pts) | 2 semestres CH≥128h (2pts) | 1 semestre CH≥64h (1pt)',
   '{"op": "tiered", "field": "monitoria_semestres", "tiers": [{"gte": 3, "pts": 3}, {"gte": 2, "pts": 2}, {"gte": 1, "pts": 1}]}'),

  -- Item 5: IC — com bolsa + publicação 6pts/proj max 2 = 12; com bolsa 2pts; sem bolsa + pub 4pts; sem bolsa 1pt
  ('Acadêmico', 'ic_com_bolsa', 6, 12,
   'IC com bolsa + publicação (6pts/proj) | Com bolsa (2pts/proj) | Sem bolsa + pub (4pts/proj) | Sem bolsa (1pt/proj) — max 2 projetos, máx 12pts',
   '{"op": "sum", "caps": {"total": 12}, "terms": [{"field": "ic_com_bolsa", "mult": 6}]}'),

  -- Item 6: Publicação científica — PubMed 10, SCIELO 8, anais intern 2, anais nac 1, max 10
  ('Publicações', 'publicacoes', 10, 10,
   'PubMed (10pts) | SCIELO (8pts) | Anais congresso internacional (2pts) | Anais nacional (1pt) — máx 10pts',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "artigos_high_impact", "mult": 10}, {"field": "artigos_mid_impact", "mult": 8}, {"field": "artigos_low_impact", "mult": 2}, {"field": "artigos_nacionais", "mult": 1}]}'),

  -- Item 7: Organização congressos — estadual/nacional/internacional 4, encontros/jornadas 2, max 6
  ('Liderança/Eventos', 'organizador_evento', 4, 6,
   'Organização de congressos estaduais/nacionais/internacionais (4pts) | Encontros/jornadas (2pts cada, máx 2) — máx 6pts',
   '{"op": "sum", "caps": {"total": 6}, "terms": [{"field": "organizador_evento", "mult": 2}]}'),

  -- Item 8: Apresentação oral congressos — tiered por nível, max 10
  ('Liderança/Eventos', 'apresentacao_congresso', 10, 10,
   'Apresentação oral: internacional c/ prêmio (10pts) | internacional (8pts) | nacional c/ prêmio (8pts) | nacional (7pts) | jornada (4pts) — máx 10pts',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "apresentacao_congresso", "mult": 5}]}'),

  -- Item 9: Pôster em congresso — internacional 6, nacional 4, jornada 1, max 6
  ('Liderança/Eventos', 'ouvinte_congresso', 6, 6,
   'Pôster: internacional (6pts) | nacional (4pts) | jornada/liga 1º autor (1pt) — máx 6pts',
   '{"op": "sum", "caps": {"total": 6}, "terms": [{"field": "ouvinte_congresso", "mult": 2}]}'),

  -- Item 10: Liga acadêmica — diretoria 5, membro 2+ anos 2, membro 1 ano 1, max 5
  ('Liderança/Eventos', 'diretoria_ligas', 5, 5,
   'Liga: Diretoria 1 ano (5pts) | Membro ≥2 anos (2pts) | Membro 1 ano (1pt) — máx 5pts',
   '{"op": "sum", "caps": {"total": 5}, "terms": [{"field": "diretoria_ligas", "when_gt0": 5}, {"field": "membro_liga_anos", "when_gt0": 1}]}'),

  -- Item 11: Aprimoramento profissional — doutorado 8, mestrado 4, residência 2, outro curso 1, max 8
  ('Perfil', 'doutorado_status', 8, 8,
   'Doutorado concluído Med I/II/III (8pts) | Mestrado concluído (4pts) | Residência outra área (2pts) | Outro curso (1pt) — máx 8pts',
   '{"op": "sum", "caps": {"total": 8}, "terms": [{"field": "doutorado_status", "when_value": "Concluído", "pts": 8}, {"field": "mestrado_status", "when_value": "Concluído", "pts": 4, "override_by_field": "doutorado_status", "override_value": "Concluído"}, {"field": "residencia_medica_concluida", "when_true": 2}, {"field": "outro_curso_universitario", "when_true": 1}]}'),

  -- Item 12: Cursos suporte vida — 2pts/curso, max 2 cursos = 4
  ('Liderança/Eventos', 'cursos_suporte', 2, 4,
   'Cursos suporte de vida — ACLS, ATLS, PALS, etc (2pts por curso, máx 2 cursos = 4pts)',
   '{"op": "sum", "caps": {"total": 4}, "terms": [{"field": "cursos_suporte", "mult": 2}]}'),

  -- Item 13: Representação estudantil — 2+ anos 3pts, 1 ano 1pt, max 3
  ('Liderança/Eventos', 'representante_turma_anos', 3, 3,
   'Representação estudantil: ≥2 anos (3pts) | 1 ano (1pt) — máx 3pts',
   '{"op": "tiered", "field": "representante_turma_anos", "tiers": [{"gte": 2, "pts": 3}, {"gte": 1, "pts": 1}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'USP-SP';

-- ============================================================================
-- 7. Marcar todos os scores stale para recálculo
-- ============================================================================

UPDATE user_scores SET stale = true;
