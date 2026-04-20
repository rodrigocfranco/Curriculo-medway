-- 0040_fix_ufpa_edital_rules.sql
-- Corrigir regras UFPA conforme Quadro 5 do edital (6 itens, total 100 pts)
-- Remove regras inventadas (pós-grad, monitoria, extensão separados)
-- Adiciona apresentação de trabalhos (20 pts) que estava faltando

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'UFPA');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- 1. Pesquisa / Extensão / IC / PET (≥180h por certificado) — 7pts × máx 3 = 21
  ('Pesquisa e Publicações', 'ic_projetos', 7, 21,
   'Projeto de pesquisa, extensão, IC ou PET com carga horária mín 180h. Certificado deve ser expedido pela instituição (não vale assinatura só do professor): 7 pontos por projeto. Máximo 3 projetos = 21 pontos.',
   '{"op": "count_articles", "field": "ic_projetos", "mult": 7, "caps": {"total": 21}}'),

  -- 2. Monitoria ou estágio não obrigatório (≥180h) — 9pts × máx 1 = 9
  ('Atividades Acadêmicas', 'estagio_extracurricular_horas', 9, 9,
   'Monitoria ou estágio não obrigatório em disciplina da área médica com carga horária mín 180h. Certificado expedido pela instituição: 9 pontos. Máximo 1 documento.',
   '{"op": "composite", "caps": {"total": 9}, "groups": [
     {"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 180, "pts": 9.0}]},
     {"op": "tiered", "field": "monitoria_semestres", "tiers": [{"gte": 1, "pts": 9.0}]}
   ]}'),

  -- 3. Artigo científico na íntegra em revista de saúde — 10pts × máx 3 = 30
  ('Pesquisa e Publicações', 'publicacoes', 10, 30,
   'Artigo científico completo publicado em revista da área de saúde de qualquer Qualis: 10 pontos por artigo. Máximo 3 artigos = 30 pontos. Não vale resumo, anais ou similar.',
   '{"op": "count_articles", "field": "publicacoes", "mult": 10, "caps": {"total": 30}}'),

  -- 4. Apresentação de trabalho em evento científico — 10pts × máx 2 = 20
  ('Congressos e Formação Complementar', 'apresentacoes', 10, 20,
   'Apresentação de trabalho em evento científico (oral ou poster): 10 pontos por trabalho. Máximo 2 trabalhos = 20 pontos.',
   '{"op": "count_articles", "field": "apresentacoes", "mult": 10, "caps": {"total": 20}}'),

  -- 5. Ouvinte/Organizador ou curso ≥30h — 1pt × máx 10 = 10
  ('Congressos e Formação Complementar', 'ouvinte_congresso', 1, 10,
   'Participação em evento científico como ouvinte ou organizador, ou curso com mín 30h emitido por instituição oficial: 1 ponto por documento. Máximo 10 documentos = 10 pontos.',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "ouvinte_congresso", "mult": 1}, {"field": "organizador_evento", "mult": 1}, {"field": "cursos_temas_medicos", "mult": 1}]}'),

  -- 6. Língua estrangeira (curso ≥150h ou proficiência) — 5pts × máx 2 = 10
  ('Qualificações', 'ingles_fluente', 5, 10,
   'Curso oficial de língua estrangeira com mais de 150h ou aprovação em teste de proficiência reconhecido: 5 pontos por certificado. Máximo 2 certificados = 10 pontos. Pontua apenas 1 vez por língua.',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 10}, {"field": "ingles_fluente", "when_value": "Intermediário", "pts": 5}]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'UFPA';

UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'UFPA');
