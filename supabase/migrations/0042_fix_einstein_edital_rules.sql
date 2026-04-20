-- 0042_fix_einstein_edital_rules.sql
-- Corrigir regras Einstein conforme edital (3 itens, total 130 pts)
-- Fix crítico: publication_matrix quebrada + tiers de FI deslocados

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'Einstein');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- A. Iniciação Científica — máx 30 pts
  ('Pesquisa e Publicações', 'ic_horas_totais', 30, 30,
   'Horas totais de Iniciação Científica (somatória de até 3 atividades comprovadas): mais de 400h (30pts) | 301 a 400h (25pts) | 201 a 300h (20pts) | 101 a 200h (15pts) | até 100h (5pts). Certificados devem ser chancelados pela instituição.',
   '{"op": "tiered", "field": "ic_horas_totais", "tiers": [{"gte": 401, "pts": 30}, {"gte": 301, "pts": 25}, {"gte": 201, "pts": 20}, {"gte": 101, "pts": 15}, {"gte": 0, "pts": 5}]}'),

  -- B. Pós-graduação Stricto Sensu — máx 30 pts
  ('Qualificações', 'mestrado_status', 30, 30,
   'Pós-graduação Stricto Sensu (somatória de até 2 cursos, teto 30pts): Doutorado concluído (30pts) | Doutorado em curso (15pts) | Mestrado concluído (25pts) | Mestrado em curso (10pts).',
   '{"op": "sum", "caps": {"total": 30}, "terms": [
     {"field": "doutorado_status", "when_value": "Concluído", "pts": 30},
     {"field": "doutorado_status", "when_value": "Em curso", "pts": 15, "override_by_field": "doutorado_status", "override_value": "Concluído"},
     {"field": "mestrado_status", "when_value": "Concluído", "pts": 25, "override_by_field": "doutorado_status", "override_value": "Concluído"},
     {"field": "mestrado_status", "when_value": "Em curso", "pts": 10, "override_by_field": "mestrado_status", "override_value": "Concluído"}
   ]}'),

  -- C. Publicações PubMed — máx 70 pts
  -- publication_matrix: posição × Fator de Impacto (JCR), até 3 artigos
  ('Pesquisa e Publicações', 'publicacoes', 70, 70,
   'Até 3 artigos publicados exclusivamente no PubMed. Pontuação por posição de autoria (1º autor/último autor vs coautor) × Fator de Impacto JCR da revista. Consulte a tabela completa no edital.',
   '{"op": "publication_matrix", "field": "publicacoes", "max_articles": 3,
     "first_author_tiers": [
       {"gte": 3.0, "pts": 35},
       {"gte": 2.99, "pts": 30},
       {"gte": 2.5, "pts": 28},
       {"gte": 2.0, "pts": 25},
       {"gte": 1.99, "pts": 20},
       {"gte": 1.5, "pts": 18},
       {"gte": 1.0, "pts": 14},
       {"gte": 0.91, "pts": 10},
       {"gte": 0.5, "pts": 8},
       {"gte": 0, "pts": 5},
       {"no_fi": true, "pts": 2}
     ],
     "coauthor_tiers": [
       {"gte": 3.0, "pts": 17.5},
       {"gte": 2.99, "pts": 15},
       {"gte": 2.5, "pts": 14},
       {"gte": 2.0, "pts": 12.5},
       {"gte": 1.99, "pts": 10},
       {"gte": 1.5, "pts": 9},
       {"gte": 1.0, "pts": 7},
       {"gte": 0.91, "pts": 5},
       {"gte": 0.5, "pts": 4},
       {"gte": 0, "pts": 2.5},
       {"no_fi": true, "pts": 1}
     ],
     "caps": {"total": 70}
   }'::jsonb)

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'Einstein';

UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'Einstein');
