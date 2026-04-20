-- 0036_fix_psugo_edital_rules.sql
-- Corrigir regras PSU-GO conforme edital real (12 itens, total 10 pts)

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- 1. Diploma/CRM — 0,1 pt (constante para todo aluno)
  ('Formação', 'media_geral', 0.1, 0.1,
   'Diploma de medicina ou registro no CRM (0,1pt)',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 0, "pts": 0.1}]}'),

  -- 2. Monitoria — 0,25/semestre, máx 0,5
  ('Atividades Acadêmicas', 'monitoria_semestres', 0.25, 0.5,
   'Monitoria (0,25pt por semestre, mín 4 meses, máx 0,5pt)',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [{"field": "monitoria_semestres", "mult": 0.25}]}'),

  -- 3. IC com bolsa — 0,45/pesquisa, máx 0,9
  ('Pesquisa e Publicações', 'ic_projetos', 0.45, 0.9,
   'Bolsa IC, PET, PIBIC, PROEXT (0,45pt por pesquisa com bolsa, máx 0,9pt)',
   '{"op": "count_articles", "field": "ic_projetos", "filter": {"tipo": "Com bolsa"}, "mult": 0.45, "caps": {"total": 0.9}}'),

  -- 4. Trabalhos científicos — 0,25/trabalho, máx 1,0
  ('Congressos e Formação Complementar', 'apresentacoes', 0.25, 1,
   'Apresentação trabalho científico em congresso (0,25pt por trabalho, máx 1pt)',
   '{"op": "count_articles", "field": "apresentacoes", "mult": 0.25, "caps": {"total": 1.0}}'),

  -- 5. Publicações artigos + capítulos livro — 0,5/publicação, máx 1,5
  ('Pesquisa e Publicações', 'publicacoes', 0.5, 1.5,
   'Artigo ou capítulo de livro em periódico com corpo editorial (0,5pt, máx 1,5pt)',
   '{"op": "composite", "caps": {"total": 1.5}, "groups": [
     {"op": "count_articles", "field": "publicacoes", "mult": 0.5, "caps": {"total": 1.5}},
     {"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "capitulos_livro", "mult": 0.5}]}
   ]}'),

  -- 6. Participação congressos/jornadas — 0,1/evento, máx 1,0
  ('Congressos e Formação Complementar', 'ouvinte_congresso', 0.1, 1,
   'Participação em congressos/jornadas área de saúde (0,1pt por evento, máx 1pt)',
   '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "ouvinte_congresso", "mult": 0.1}]}'),

  -- 7. Ligas acadêmicas — 0,25/ano, máx 0,5
  ('Atividades Acadêmicas', 'membro_liga_anos', 0.25, 0.5,
   'Liga acadêmica (0,25pt por ano, máx 2 ligas, máx 0,5pt)',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [{"field": "membro_liga_anos", "mult": 0.25}]}'),

  -- 8. Representação estudantil — 0,25/representação, máx 0,5
  -- Inclui: presidente/diretor/secretário/tesoureiro de DA, diretoria ligas, representação discente
  ('Representação Estudantil e Voluntariado', 'centro_academico_semestres', 0.25, 0.5,
   'Representação estudantil: DA, diretoria liga, representação institucional (0,25pt, máx 0,5pt)',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [
     {"field": "centro_academico_semestres", "when_gt0": 0.25},
     {"field": "diretoria_ligas", "when_gt0": 0.25},
     {"field": "colegiado_institucional_semestres", "when_gt0": 0.25}
   ]}'),

  -- 9. Teste de Progresso — 0,5/participação (máx 3 = 1,5)
  -- ENADE é automático (não tem campo), bonificação separada
  ('Congressos e Formação Complementar', 'teste_progresso', 0.5, 1.5,
   'Teste de Progresso (0,5pt por participação, máx 3 participações = 1,5pt)',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "teste_progresso", "mult": 0.5}]}'),

  -- 10. Curso suporte vida — 0,5/curso, máx 1,0
  ('Congressos e Formação Complementar', 'cursos_suporte', 0.5, 1,
   'Curso suporte avançado — ATLS, ACLS, BLS, PALS, PHTLS (0,5pt por curso, máx 1pt)',
   '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "cursos_suporte", "mult": 0.5}]}'),

  -- 11. Prova proficiência medicina — 1,0 pt
  ('Qualificações', 'prova_proficiencia_medicina', 1, 1,
   'Prova de proficiência em Medicina — AMB/CRM (1pt)',
   '{"op": "bool", "field": "prova_proficiencia_medicina", "pts_true": 1.0}'),

  -- 12. Estágio exterior/Brasil — 0,5 pt (mín 1 mês)
  ('Representação Estudantil e Voluntariado', 'estagio_extracurricular_horas', 0.5, 0.5,
   'Estágio supervisionado exterior ou Brasil (mín 1 mês, 0,5pt)',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 160, "pts": 0.5}]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'PSU-GO';

-- Marcar scores stale
UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');
