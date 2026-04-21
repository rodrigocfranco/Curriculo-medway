-- 0044_fix_description_parsing.sql
-- Corrigir descrições que não parsam corretamente no "Como Pontuar"
-- Regra: usar "Texto introdutório: critério1 (Xpt) | critério2 (Ypt)"
-- Evitar parênteses descritivos que confundam o parser

-- =============================================================================
-- EINSTEIN
-- =============================================================================

-- ic_horas_totais: remover parênteses descritivos
UPDATE scoring_rules
SET description = 'Horas totais de IC, somatória de até 3 atividades comprovadas: mais de 400h (30pts) | 301 a 400h (25pts) | 201 a 300h (20pts) | 101 a 200h (15pts) | até 100h (5pts)'
WHERE field_key = 'ic_horas_totais'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Einstein');

-- =============================================================================
-- SES-DF — reescrever para formato estruturado
-- =============================================================================

UPDATE scoring_rules
SET description = 'Monitoria em disciplinas regulares da graduação, 0,5pt por semestre completo: 1 semestre (0,5pt) | 2 semestres (1pt)'
WHERE field_key = 'monitoria_semestres'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules
SET description = 'Extensão extracurricular, teto compartilhado: Cursos médicos ≥20h — 0,1pt cada | Projeto extensão — 0,5pt por semestre | Estágio em hospital com residência — 0,1pt a cada 40h. Máximo 1 ponto.'
WHERE field_key = 'estagio_extracurricular_horas'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules
SET description = 'Participação como ouvinte em congressos, simpósios ou jornadas: 1 a 9 eventos (0,1pt cada) | 10 eventos (1pt)'
WHERE field_key = 'ouvinte_congresso'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules
SET description = 'Apresentação de trabalho em congressos, oral ou poster: 1 trabalho (0,2pt) | 2 trabalhos (0,4pt) | 3 trabalhos (0,6pt) | 4 trabalhos (0,8pt) | 5 trabalhos (1pt)'
WHERE field_key = 'apresentacoes'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules
SET description = 'Artigos científicos, teto compartilhado: Artigo em revista indexada com DOI (0,5pt) | Artigo em revista não indexada (0,2pt). Máximo 1 ponto.'
WHERE field_key = 'publicacoes'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules
SET description = 'IC, PET ou Ciências sem Fronteiras, 0,5pt por semestre: 1 semestre (0,5pt) | 2 semestres (1pt)'
WHERE field_key = 'ic_projetos'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules
SET description = 'Premiação na área médica: 1 premiação (0,25pt) | 2 premiações (0,5pt)'
WHERE field_key = 'premios_academicos'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules
SET description = 'Experiência profissional no SUS, mín 20h/semana: 5 meses (0,5pt) | 10 meses (1pt) | 15 meses (1,5pt) | 20 meses (2pt)'
WHERE field_key = 'trabalho_sus_meses'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE scoring_rules
SET description = 'Histórico acadêmico do internato: conceito A ou superior, nota ≥8, ou aproveitamento ≥80% (0,5pt)'
WHERE field_key = 'media_geral'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

-- =============================================================================
-- PSU-MG — remover parênteses descritivos
-- =============================================================================

UPDATE scoring_rules
SET description = 'Cursos de temas médicos por entidades filiadas à AMB, mín 8h cada, diferentes entre si: 3 cursos (0,7pt) | 2 cursos (0,5pt) | 1 curso (0,3pt)'
WHERE field_key = 'cursos_temas_medicos'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-MG');

-- =============================================================================
-- Marcar stale para atualizar breakdown
-- =============================================================================

UPDATE user_scores SET stale = true;
