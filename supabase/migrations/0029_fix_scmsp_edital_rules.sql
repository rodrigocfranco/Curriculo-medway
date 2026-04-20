-- 0029_fix_scmsp_edital_rules.sql
-- Corrigir regras Santa Casa SP conforme edital real (10 itens, total 100 pts)
-- Regras anteriores (migration 0021 + 0022) estavam com valores e fórmulas incorretos

-- =============================================================================
-- 1. Deletar todas as regras atuais da Santa Casa SP
-- =============================================================================

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

-- =============================================================================
-- 2. Inserir regras corretas conforme edital
-- =============================================================================

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- Item 1: Faculdade (RUF Folha SP 2024) — max 20 pts
  -- Edital: 1ª-35ª = 20pts | 36ª-45ª = 15pts | Demais (incl. não classificadas) = 5pts
  -- NOTA: campo ranking_ruf_top35 é boolean, não suporta faixa 36-45.
  -- Mapeamento atual: top35=20, demais=5. Faixa intermediária requer campo novo.
  ('Perfil', 'ranking_ruf_top35', 20, 20,
   '1ª-35ª posição RUF (20pts) | Demais faculdades (5pts)',
   '{"op": "ruf_branch", "field": "ranking_ruf_top35", "pts_true": 20, "pts_false": 5, "pts_null": 5}'),

  -- Item 2: Internato em hospital escola próprio — max 10 pts
  ('Perfil', 'internato_hospital_ensino', 10, 10,
   'Internato em hospital escola próprio (10pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 10}]}'),

  -- Item 3: Publicação artigo em revista indexada — max 10 pts (Sim/Não)
  ('Publicações', 'publicacoes', 10, 10,
   'Publicação de artigo em revista indexada (10pts)',
   '{"op": "count_articles", "field": "publicacoes", "mult": 10, "caps": {"total": 10}}'),

  -- Item 4: Apresentação de trabalho em evento médico — max 10 pts (faixas)
  -- 0 = 0 | 1 = 2,5 | 2 = 5,0 | 3+ = 10,0
  ('Liderança/Eventos', 'apresentacao_congresso', 10, 10,
   'Nenhum (0pts) | Um (2,5pts) | Dois (5pts) | Três ou mais (10pts)',
   '{"op": "tiered", "field": "apresentacao_congresso", "tiers": [{"gte": 3, "pts": 10}, {"gte": 2, "pts": 5}, {"gte": 1, "pts": 2.5}]}'),

  -- Item 5: Participação em evento médico (como ouvinte) — max 5 pts (faixas)
  -- 0 = 0 | 1 = 2,5 | 2+ = 5,0
  ('Liderança/Eventos', 'ouvinte_congresso', 5, 5,
   'Nenhum (0pts) | Um (2,5pts) | Dois ou mais (5pts)',
   '{"op": "tiered", "field": "ouvinte_congresso", "tiers": [{"gte": 2, "pts": 5}, {"gte": 1, "pts": 2.5}]}'),

  -- Item 6: Certificado de curso ou proficiência em língua inglesa — max 10 pts
  ('Perfil', 'ingles_fluente', 10, 10,
   'Certificado de proficiência em língua inglesa (10pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 10}, {"field": "ingles_fluente", "when_value": "Intermediário", "pts": 10}]}'),

  -- Item 7: Participação em ligas durante a graduação — max 10 pts (Sim/Não)
  ('Liderança/Eventos', 'membro_liga_anos', 10, 10,
   'Participação em ligas durante a graduação (10pts)',
   '{"op": "any_positive", "pts": 10, "fields": ["diretoria_ligas", "membro_liga_anos"]}'),

  -- Item 8: Participação em atividades de monitoria — max 10 pts (Sim/Não)
  ('Acadêmico', 'monitoria_semestres', 10, 10,
   'Participação em atividades de monitoria (10pts)',
   '{"op": "threshold", "field": "monitoria_semestres", "brackets": [{"gte": 1, "pts": 10}]}'),

  -- Item 9: Atividade científica contemplada com bolsa auxílio — max 10 pts (Sim/Não)
  ('Acadêmico', 'ic_com_bolsa', 10, 10,
   'Atividade científica contemplada com bolsa (10pts)',
   '{"op": "threshold", "field": "ic_com_bolsa", "brackets": [{"gte": 1, "pts": 10}]}'),

  -- Item 10: Atividades de interesse não contempladas acima — max 5 pts
  -- Projetos voluntários, organização de cursos, etc.
  ('Prática/Social', 'voluntariado_horas', 5, 5,
   'Atividades de interesse — voluntariado, projetos, extensão (5pts)',
   '{"op": "any_true_or_positive", "pts": 5, "fields_true": ["projeto_rondon"], "fields_positive": ["voluntariado_horas", "extensao_semestres"]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'Santa Casa SP';

-- =============================================================================
-- 3. Marcar scores stale para recálculo
-- =============================================================================

UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');
