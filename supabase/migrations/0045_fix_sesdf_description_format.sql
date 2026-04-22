-- 0045_fix_sesdf_description_format.sql
-- Corrigir formato da descrição do estágio extracurricular SES-DF
-- Usar (Xpt) ao invés de — Xpt para o parser reconhecer

UPDATE scoring_rules
SET description = 'Extensão extracurricular, teto compartilhado de 1 ponto: Cursos médicos ≥20h (0,1pt cada) | Projeto de extensão (0,5pt por semestre) | Estágio em hospital com residência (0,1pt a cada 40h)'
WHERE field_key = 'estagio_extracurricular_horas'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');
