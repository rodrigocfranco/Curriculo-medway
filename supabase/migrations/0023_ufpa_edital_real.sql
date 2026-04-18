-- 0023_ufpa_edital_real.sql
-- UFPA — Quadro 5, total max 100 pts

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'UFPA');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- IC / extensão / PET (CH≥160h) — 7pts cada, max 3 = 21pts
  ('Acadêmico', 'ic_com_bolsa', 7, 21,
   'Projetos de pesquisa, extensão, IC ou PET com CH ≥ 160h (7pts cada, máx 3 projetos = 21pts)',
   '{"op": "sum", "caps": {"total": 21}, "terms": [{"field": "ic_com_bolsa", "mult": 7}, {"field": "ic_sem_bolsa", "mult": 7}]}'),

  -- Estágio extracurricular (CH≥160h) — 9pts, max 1 = 9pts
  ('Prática/Social', 'estagio_extracurricular_horas', 9, 9,
   'Estágio extracurricular com CH ≥ 160h (9pts)',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 160, "pts": 9.0}]}'),

  -- Artigo publicado na íntegra — 10pts cada, max 3 = 30pts
  ('Publicações', 'publicacoes', 10, 30,
   'Artigo publicado na íntegra em revista de saúde (10pts cada, máx 3 = 30pts)',
   '{"op": "sum", "caps": {"total": 30}, "terms": [{"field": "artigos_high_impact", "mult": 10}, {"field": "artigos_mid_impact", "mult": 10}, {"field": "artigos_low_impact", "mult": 10}, {"field": "artigos_nacionais", "mult": 10}]}'),

  -- Participação evento científico — 1pt cada, max 3 = 3pts
  ('Liderança/Eventos', 'ouvinte_congresso', 1, 3,
   'Participação em evento científico (1pt cada, máx 3pts)',
   '{"op": "sum", "caps": {"total": 3}, "terms": [{"field": "ouvinte_congresso", "mult": 1}]}'),

  -- Pós-graduação (≥30h) — 1pt por 30h equivalente, max 10pts
  ('Perfil', 'mestrado_status', 10, 10,
   'Pós-graduação ≥ 30h (1pt equiv por 30h). Doutorado/Mestrado pontua mais. Máx 10pts.',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "doutorado_status", "when_value": "Concluído", "pts": 10}, {"field": "mestrado_status", "when_value": "Concluído", "pts": 5, "override_by_field": "doutorado_status", "override_value": "Concluído"}, {"field": "residencia_medica_concluida", "when_true": 3}]}'),

  -- Proficiência língua estrangeira — 2pts
  ('Perfil', 'ingles_fluente', 2, 2,
   'Proficiência em língua estrangeira comprovada (2pts). Pontua uma vez.',
   '{"op": "sum", "caps": {"total": 2}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 2}, {"field": "ingles_fluente", "when_value": "Intermediário", "pts": 1}]}'),

  -- Monitoria — estimativa baseada no Quadro 5
  ('Acadêmico', 'monitoria_semestres', 5, 15,
   'Monitoria e/ou PID (5pts por semestre, máx 15pts)',
   '{"op": "sum", "caps": {"total": 15}, "terms": [{"field": "monitoria_semestres", "mult": 5}]}'),

  -- Extensão / PET-Saúde — 5pts/semestre, max 10
  ('Acadêmico', 'extensao_semestres', 5, 10,
   'Projetos de extensão e/ou PET-Saúde (5pts por semestre, máx 10pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "extensao_semestres", "mult": 5}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'UFPA';

UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'UFPA');
