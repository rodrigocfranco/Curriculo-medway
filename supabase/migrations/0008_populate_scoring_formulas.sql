-- 0008_populate_scoring_formulas.sql
-- Fix: populate empty scoring_rules.formula with correct JSONB formulas
-- Based on calculations.ts logic (legacy frontend calculator)

-- Helper: update formula by institution short_name + field_key
-- Uses subquery to resolve institution_id from short_name

-- =============================================================================
-- UNICAMP (Base 100)
-- =============================================================================

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":10}],"caps":{"total":15}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_mid_impact","mult":5}],"caps":{"total":15}}'::jsonb
where field_key = 'artigos_mid_impact' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_com_bolsa","mult":20}],"caps":{"total":20}}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_sem_bolsa","mult":10}],"caps":{"total":20}}'::jsonb
where field_key = 'ic_sem_bolsa' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"tiered","field":"monitoria_semestres","tiers":[{"gte":3,"pts":5},{"gte":1,"pts":2}]}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"diretoria_ligas","mult":5}],"caps":{"total":5}}'::jsonb
where field_key = 'diretoria_ligas' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"membro_liga_anos","mult":2}],"caps":{"total":5}}'::jsonb
where field_key = 'membro_liga_anos' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"tiered","field":"voluntariado_horas","tiers":[{"gte":96,"pts":5},{"gte":48,"pts":2}]}'::jsonb
where field_key = 'voluntariado_horas' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"cursos_suporte","mult":2.5}],"caps":{"total":5}}'::jsonb
where field_key = 'cursos_suporte' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"bool","field":"internato_hospital_ensino","pts_true":10}'::jsonb
where field_key = 'internato_hospital_ensino' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"bool","field":"doutorado","pts_true":15}'::jsonb
where field_key = 'doutorado' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"bool","field":"mestrado","pts_true":10}'::jsonb
where field_key = 'mestrado' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"bool","field":"ingles_fluente","pts_true":10}'::jsonb
where field_key = 'ingles_fluente' and institution_id = (select id from institutions where short_name = 'UNICAMP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"apresentacao_congresso","mult":2.5}],"caps":{"total":10}}'::jsonb
where field_key = 'apresentacao_congresso' and institution_id = (select id from institutions where short_name = 'UNICAMP');

-- =============================================================================
-- USP-SP (Base 100)
-- =============================================================================

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":10}],"caps":{"total":15}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_low_impact","mult":2}],"caps":{"total":15}}'::jsonb
where field_key = 'artigos_low_impact' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_com_bolsa","mult":7}],"caps":{"total":14}}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_sem_bolsa","mult":3}],"caps":{"total":14}}'::jsonb
where field_key = 'ic_sem_bolsa' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"monitoria_semestres","mult":2}],"caps":{"total":4}}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"diretoria_ligas","mult":3},{"field":"representante_turma_anos","mult":4}],"caps":{"total":10}}'::jsonb
where field_key = 'diretoria_ligas' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"representante_turma_anos","mult":3}],"caps":{"total":10}}'::jsonb
where field_key = 'representante_turma_anos' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"cursos_suporte","mult":2}],"caps":{"total":4}}'::jsonb
where field_key = 'cursos_suporte' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"bool","field":"internato_hospital_ensino","pts_true":10}'::jsonb
where field_key = 'internato_hospital_ensino' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"bool","field":"ranking_ruf_top35","pts_true":5}'::jsonb
where field_key = 'ranking_ruf_top35' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"bool","field":"ingles_fluente","pts_true":10}'::jsonb
where field_key = 'ingles_fluente' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"apresentacao_congresso","mult":3}],"caps":{"total":10}}'::jsonb
where field_key = 'apresentacao_congresso' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ouvinte_congresso","mult":1}],"caps":{"total":10}}'::jsonb
where field_key = 'ouvinte_congresso' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"threshold","field":"media_geral","brackets":[{"gte":80,"pts":8}]}'::jsonb
where field_key = 'media_geral' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"bool","field":"projeto_rondon","pts_true":4}'::jsonb
where field_key = 'projeto_rondon' and institution_id = (select id from institutions where short_name = 'USP-SP');

update scoring_rules set formula = '{"op":"any_positive","fields":["voluntariado_horas"],"pts":4}'::jsonb
where field_key = 'voluntariado_horas' and institution_id = (select id from institutions where short_name = 'USP-SP');

-- =============================================================================
-- PSU-MG (Base 10)
-- =============================================================================

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":0.7},{"field":"artigos_mid_impact","mult":0.7},{"field":"artigos_low_impact","mult":0.7},{"field":"artigos_nacionais","mult":0.7}],"caps":{"total":2.0}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_com_bolsa","mult":0.5}],"caps":{"total":2.0}}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_sem_bolsa","mult":0.3}],"caps":{"total":2.0}}'::jsonb
where field_key = 'ic_sem_bolsa' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"threshold","field":"monitoria_semestres","brackets":[{"gte":1,"pts":1.0}]}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"membro_liga_anos","mult":0.8}],"caps":{"total":4.0}}'::jsonb
where field_key = 'membro_liga_anos' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"diretoria_ligas","mult":0.3}],"caps":{"total":4.0}}'::jsonb
where field_key = 'diretoria_ligas' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"extensao_semestres","mult":0.7}],"caps":{"total":4.0}}'::jsonb
where field_key = 'extensao_semestres' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"tiered","field":"estagio_extracurricular_horas","tiers":[{"gte":180,"pts":1.0},{"gte":90,"pts":0.5}]}'::jsonb
where field_key = 'estagio_extracurricular_horas' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"composite","groups":[{"op":"bool","field":"ingles_fluente","pts_true":1.5},{"op":"sum","terms":[{"field":"cursos_suporte","mult":0.7}],"caps":{"total":2.5}}],"caps":{"total":2.5}}'::jsonb
where field_key = 'ingles_fluente' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"cursos_suporte","mult":0.7}],"caps":{"total":2.5}}'::jsonb
where field_key = 'cursos_suporte' and institution_id = (select id from institutions where short_name = 'PSU-MG');

update scoring_rules set formula = '{"op":"tiered","field":"media_geral","tiers":[{"gte":85,"pts":1.5},{"gte":80,"pts":1.0},{"gte":1,"pts":0.5}]}'::jsonb
where field_key = 'conceito_historico' and institution_id = (select id from institutions where short_name = 'PSU-MG');

-- =============================================================================
-- FMABC (Base 10)
-- =============================================================================

update scoring_rules set formula = '{"op":"threshold","field":"artigos_high_impact","aggregate":{"sum_of":["artigos_high_impact","artigos_mid_impact","artigos_low_impact","artigos_nacionais"]},"brackets":[{"gte":2,"pts":1.0},{"gte":1,"pts":0.5}]}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'FMABC');

update scoring_rules set formula = '{"op":"threshold","field":"apresentacao_congresso","brackets":[{"gte":2,"pts":1.0},{"gte":1,"pts":0.5}]}'::jsonb
where field_key = 'apresentacao_congresso' and institution_id = (select id from institutions where short_name = 'FMABC');

update scoring_rules set formula = '{"op":"threshold","field":"ouvinte_congresso","brackets":[{"gte":4,"pts":0.5},{"gte":1,"pts":0.25}]}'::jsonb
where field_key = 'ouvinte_congresso' and institution_id = (select id from institutions where short_name = 'FMABC');

update scoring_rules set formula = '{"op":"any_positive","fields":["ic_com_bolsa","ic_sem_bolsa"],"pts":1.0}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'FMABC');

update scoring_rules set formula = '{"op":"custom","fn":"fmabc_monitoria","field":"monitoria_semestres","caps":{"total":1.5}}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'FMABC');

update scoring_rules set formula = '{"op":"threshold","field":"teste_progresso","brackets":[{"gte":4,"pts":1.0},{"gte":1,"pts":0.5}]}'::jsonb
where field_key = 'teste_progresso' and institution_id = (select id from institutions where short_name = 'FMABC');

update scoring_rules set formula = '{"op":"threshold","field":"estagio_extracurricular_horas","brackets":[{"gte":120,"pts":1.0}]}'::jsonb
where field_key = 'estagio_extracurricular_horas' and institution_id = (select id from institutions where short_name = 'FMABC');

update scoring_rules set formula = '{"op":"any_positive","fields":["diretoria_ligas","membro_liga_anos"],"pts":0.5}'::jsonb
where field_key = 'membro_liga_anos' and institution_id = (select id from institutions where short_name = 'FMABC');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"cursos_suporte","when_gt0":0.5}],"caps":{"total":4.0}}'::jsonb
where field_key = 'cursos_suporte' and institution_id = (select id from institutions where short_name = 'FMABC');

update scoring_rules set formula = '{"op":"bool","field":"ingles_fluente","pts_true":0.5}'::jsonb
where field_key = 'ingles_fluente' and institution_id = (select id from institutions where short_name = 'FMABC');

-- =============================================================================
-- EINSTEIN (Base 100)
-- =============================================================================

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":35}],"caps":{"total":70}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'Einstein');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_mid_impact","mult":15}],"caps":{"total":70}}'::jsonb
where field_key = 'artigos_mid_impact' and institution_id = (select id from institutions where short_name = 'Einstein');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_low_impact","mult":5}],"caps":{"total":70}}'::jsonb
where field_key = 'artigos_low_impact' and institution_id = (select id from institutions where short_name = 'Einstein');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_nacionais","mult":2}],"caps":{"total":70}}'::jsonb
where field_key = 'artigos_nacionais' and institution_id = (select id from institutions where short_name = 'Einstein');

update scoring_rules set formula = '{"op":"tiered","field":"ic_horas_totais","tiers":[{"gte":400,"pts":30},{"gte":300,"pts":25},{"gte":200,"pts":20},{"gte":100,"pts":15},{"gte":1,"pts":5}]}'::jsonb
where field_key = 'ic_horas_totais' and institution_id = (select id from institutions where short_name = 'Einstein');

update scoring_rules set formula = '{"op":"bool","field":"doutorado","pts_true":30}'::jsonb
where field_key = 'doutorado' and institution_id = (select id from institutions where short_name = 'Einstein');

update scoring_rules set formula = '{"op":"bool","field":"mestrado","pts_true":25,"override_by":"doutorado"}'::jsonb
where field_key = 'mestrado' and institution_id = (select id from institutions where short_name = 'Einstein');

-- =============================================================================
-- Santa Casa SP (Base 100)
-- =============================================================================

update scoring_rules set formula = '{"op":"composite","groups":[{"op":"bool","field":"internato_hospital_ensino","pts_true":10},{"op":"ruf_branch","field":"ranking_ruf_top35","pts_true":20,"pts_false":5,"pts_null":0}],"caps":{"total":30}}'::jsonb
where field_key = 'internato_hospital_ensino' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

update scoring_rules set formula = '{"op":"ruf_branch","field":"ranking_ruf_top35","pts_true":20,"pts_false":5,"pts_null":0}'::jsonb
where field_key = 'ranking_ruf_top35' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":10},{"field":"artigos_mid_impact","mult":10},{"field":"artigos_low_impact","mult":10}],"caps":{"total":10}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

update scoring_rules set formula = '{"op":"any_positive","fields":["ic_com_bolsa"],"pts":10}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

update scoring_rules set formula = '{"op":"any_positive","fields":["monitoria_semestres"],"pts":10}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

update scoring_rules set formula = '{"op":"any_positive","fields":["diretoria_ligas","membro_liga_anos"],"pts":10}'::jsonb
where field_key = 'membro_liga_anos' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

update scoring_rules set formula = '{"op":"any_positive","fields":["voluntariado_horas"],"pts":5}'::jsonb
where field_key = 'voluntariado_horas' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

update scoring_rules set formula = '{"op":"bool","field":"ingles_fluente","pts_true":10}'::jsonb
where field_key = 'ingles_fluente' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"apresentacao_congresso","mult":5}],"caps":{"total":10}}'::jsonb
where field_key = 'apresentacao_congresso' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"cursos_suporte","mult":5}],"caps":{"total":5}}'::jsonb
where field_key = 'cursos_suporte' and institution_id = (select id from institutions where short_name = 'Santa Casa SP');

-- =============================================================================
-- SES-PE (Base 100)
-- =============================================================================

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":5},{"field":"artigos_mid_impact","mult":5},{"field":"artigos_low_impact","mult":5},{"field":"artigos_nacionais","mult":5},{"field":"apresentacao_congresso","mult":2.5}],"caps":{"total":10}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'SES-PE');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_com_bolsa","mult":5},{"field":"ic_sem_bolsa","mult":5}],"caps":{"total":15}}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'SES-PE');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"monitoria_semestres","mult":5}],"caps":{"total":15}}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'SES-PE');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"extensao_semestres","mult":5},{"field":"projeto_rondon","when_true":10}],"caps":{"total":20}}'::jsonb
where field_key = 'extensao_semestres' and institution_id = (select id from institutions where short_name = 'SES-PE');

update scoring_rules set formula = '{"op":"tiered","field":"media_geral","tiers":[{"gte":85,"pts":30},{"gte":80,"pts":25},{"gte":75,"pts":20},{"gte":70,"pts":15},{"gte":1,"pts":10}]}'::jsonb
where field_key = 'media_geral' and institution_id = (select id from institutions where short_name = 'SES-PE');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"membro_liga_anos","mult":2.5}],"caps":{"total":5}}'::jsonb
where field_key = 'membro_liga_anos' and institution_id = (select id from institutions where short_name = 'SES-PE');

update scoring_rules set formula = '{"op":"bool","field":"ingles_fluente","pts_true":5}'::jsonb
where field_key = 'ingles_fluente' and institution_id = (select id from institutions where short_name = 'SES-PE');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"apresentacao_congresso","mult":2.5}],"caps":{"total":10}}'::jsonb
where field_key = 'apresentacao_congresso' and institution_id = (select id from institutions where short_name = 'SES-PE');

-- =============================================================================
-- SES-DF (Base 10)
-- =============================================================================

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":0.5},{"field":"artigos_mid_impact","mult":0.5},{"field":"artigos_low_impact","mult":0.5}],"caps":{"total":1.0}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"apresentacao_congresso","mult":0.2}],"caps":{"total":1.0}}'::jsonb
where field_key = 'apresentacao_congresso' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_com_bolsa","mult":0.5},{"field":"ic_sem_bolsa","mult":0.5}],"caps":{"total":1.0}}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"monitoria_semestres","mult":0.5}],"caps":{"total":1.0}}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"extensao_semestres","mult":0.5}],"caps":{"total":1.0}}'::jsonb
where field_key = 'extensao_semestres' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"composite","groups":[{"op":"bool","field":"projeto_rondon","pts_true":1.0},{"op":"floor_div","field":"trabalho_sus_meses","divisor":5,"mult":0.5}],"caps":{"total":2.0}}'::jsonb
where field_key = 'projeto_rondon' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"floor_div","field":"trabalho_sus_meses","divisor":5,"mult":0.5}'::jsonb
where field_key = 'trabalho_sus_meses' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"threshold","field":"media_geral","brackets":[{"gte":80,"pts":0.5}]}'::jsonb
where field_key = 'media_geral' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ouvinte_congresso","mult":0.1},{"field":"cursos_suporte","mult":0.1}],"caps":{"total":1.0}}'::jsonb
where field_key = 'ouvinte_congresso' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"membro_liga_anos","mult":0.5}],"caps":{"total":1.5}}'::jsonb
where field_key = 'membro_liga_anos' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"any_positive","fields":["representante_turma_anos"],"pts":0.5}'::jsonb
where field_key = 'representante_turma_anos' and institution_id = (select id from institutions where short_name = 'SES-DF');

update scoring_rules set formula = '{"op":"bool","field":"ingles_fluente","pts_true":0.5}'::jsonb
where field_key = 'ingles_fluente' and institution_id = (select id from institutions where short_name = 'SES-DF');

-- =============================================================================
-- Santa Casa BH (Base 10)
-- =============================================================================

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":0.5},{"field":"artigos_mid_impact","mult":0.5},{"field":"artigos_low_impact","mult":0.5},{"field":"artigos_nacionais","mult":0.5}],"caps":{"total":2.0}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'Santa Casa BH');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"apresentacao_congresso","mult":0.25}],"caps":{"total":2.0}}'::jsonb
where field_key = 'apresentacao_congresso' and institution_id = (select id from institutions where short_name = 'Santa Casa BH');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_com_bolsa","mult":0.5}],"caps":{"total":2.0}}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'Santa Casa BH');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_sem_bolsa","mult":0.25}],"caps":{"total":2.0}}'::jsonb
where field_key = 'ic_sem_bolsa' and institution_id = (select id from institutions where short_name = 'Santa Casa BH');

update scoring_rules set formula = '{"op":"threshold","field":"monitoria_semestres","brackets":[{"gte":1,"pts":1.0}]}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'Santa Casa BH');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"extensao_semestres","mult":0.5},{"field":"membro_liga_anos","mult":0.5}],"caps":{"total":4.0}}'::jsonb
where field_key = 'extensao_semestres' and institution_id = (select id from institutions where short_name = 'Santa Casa BH');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"membro_liga_anos","mult":0.5}],"caps":{"total":4.0}}'::jsonb
where field_key = 'membro_liga_anos' and institution_id = (select id from institutions where short_name = 'Santa Casa BH');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ouvinte_congresso","mult":0.5}],"caps":{"total":1.0}}'::jsonb
where field_key = 'ouvinte_congresso' and institution_id = (select id from institutions where short_name = 'Santa Casa BH');

update scoring_rules set formula = '{"op":"threshold","field":"media_geral","brackets":[{"gte":80,"pts":1.0}]}'::jsonb
where field_key = 'media_geral' and institution_id = (select id from institutions where short_name = 'Santa Casa BH');

-- =============================================================================
-- USP-RP (Base 10)
-- =============================================================================

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":1.0},{"field":"artigos_mid_impact","mult":1.0},{"field":"artigos_low_impact","mult":1.0},{"field":"artigos_nacionais","mult":1.0}],"caps":{"total":3.0}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'USP-RP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"apresentacao_congresso","mult":0.5}],"caps":{"total":3.0}}'::jsonb
where field_key = 'apresentacao_congresso' and institution_id = (select id from institutions where short_name = 'USP-RP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_com_bolsa","mult":0.7},{"field":"ic_sem_bolsa","mult":0.7}],"caps":{"total":3.0}}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'USP-RP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"monitoria_semestres","mult":0.5}],"caps":{"total":1.5}}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'USP-RP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"membro_liga_anos","mult":0.5}],"caps":{"total":2.0}}'::jsonb
where field_key = 'membro_liga_anos' and institution_id = (select id from institutions where short_name = 'USP-RP');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"representante_turma_anos","mult":0.5}],"caps":{"total":2.0}}'::jsonb
where field_key = 'representante_turma_anos' and institution_id = (select id from institutions where short_name = 'USP-RP');

update scoring_rules set formula = '{"op":"threshold","field":"voluntariado_horas","brackets":[{"gte":120,"pts":0.5}]}'::jsonb
where field_key = 'voluntariado_horas' and institution_id = (select id from institutions where short_name = 'USP-RP');

update scoring_rules set formula = '{"op":"bool","field":"internato_hospital_ensino","pts_true":1.0}'::jsonb
where field_key = 'internato_hospital_ensino' and institution_id = (select id from institutions where short_name = 'USP-RP');

-- =============================================================================
-- UFPA (Base 100)
-- =============================================================================

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"artigos_high_impact","mult":10},{"field":"artigos_mid_impact","mult":10},{"field":"artigos_low_impact","mult":10},{"field":"artigos_nacionais","mult":10}],"caps":{"total":30}}'::jsonb
where field_key = 'artigos_high_impact' and institution_id = (select id from institutions where short_name = 'UFPA');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"apresentacao_congresso","mult":10}],"caps":{"total":20}}'::jsonb
where field_key = 'apresentacao_congresso' and institution_id = (select id from institutions where short_name = 'UFPA');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_com_bolsa","mult":6}],"caps":{"total":21}}'::jsonb
where field_key = 'ic_com_bolsa' and institution_id = (select id from institutions where short_name = 'UFPA');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ic_sem_bolsa","mult":5}],"caps":{"total":21}}'::jsonb
where field_key = 'ic_sem_bolsa' and institution_id = (select id from institutions where short_name = 'UFPA');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"monitoria_semestres","mult":9}],"caps":{"total":9}}'::jsonb
where field_key = 'monitoria_semestres' and institution_id = (select id from institutions where short_name = 'UFPA');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"extensao_semestres","mult":6}],"caps":{"total":21}}'::jsonb
where field_key = 'extensao_semestres' and institution_id = (select id from institutions where short_name = 'UFPA');

update scoring_rules set formula = '{"op":"composite","groups":[{"op":"bool","field":"ingles_fluente","pts_true":5},{"op":"sum","terms":[{"field":"ouvinte_congresso","mult":1}],"caps":{"total":10}}],"caps":{"total":10}}'::jsonb
where field_key = 'ingles_fluente' and institution_id = (select id from institutions where short_name = 'UFPA');

update scoring_rules set formula = '{"op":"sum","terms":[{"field":"ouvinte_congresso","mult":1}],"caps":{"total":10}}'::jsonb
where field_key = 'ouvinte_congresso' and institution_id = (select id from institutions where short_name = 'UFPA');

-- =============================================================================
-- Verify: no empty formulas remain
-- =============================================================================
do $$
declare
  v_empty_count int;
begin
  select count(*) into v_empty_count from scoring_rules where formula = '{}'::jsonb or formula is null;
  if v_empty_count > 0 then
    raise warning '% scoring rules still have empty formulas', v_empty_count;
  else
    raise notice 'All scoring rules have formulas populated';
  end if;
end $$;

-- Force recalculation for all users by marking all scores stale
update user_scores set stale = true;
