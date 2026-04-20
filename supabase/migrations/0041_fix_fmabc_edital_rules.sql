-- 0041_fix_fmabc_edital_rules.sql
-- Corrigir regras FMABC conforme Anexo I do edital (14 sub-itens, 4 itens, total 10 pts)

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'FMABC');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- ===== Item 1: Estágio ou Atividades Extracurriculares (teto 4,0) =====

  -- 1a: Teste do Progresso Interinstitucional — até 3 = 0,5 | 4+ = 1,0
  ('Congressos e Formação Complementar', 'teste_progresso', 0.5, 1,
   'Teste do Progresso Interinstitucional (consórcios oficiais ou ABEM): até 3 participações (0,5pt) | 4 ou mais (1pt). Não vale teste apenas da própria faculdade.',
   '{"op": "tiered", "field": "teste_progresso", "tiers": [{"gte": 4, "pts": 1.0}, {"gte": 1, "pts": 0.5}]}'),

  -- 1b: Estágio/Eletivo extracurricular >120h, ≥20 dias — 1,0
  ('Representação Estudantil e Voluntariado', 'estagio_extracurricular_horas', 1, 1,
   'Estágio ou atividade prática extracurricular/eletivo em instituição de saúde associada ao ensino (Brasil ou exterior), com mais de 120h e pelo menos 20 dias: 1 ponto.',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 120, "pts": 1.0}]}'),

  -- 1c: Associações acadêmicas (CA, atlética, IFMSA, ligas) ≥6 meses — 0,5
  ('Atividades Acadêmicas', 'membro_liga_anos', 0.5, 0.5,
   'Participação em associações acadêmicas (CA, diretório, atlética, IFMSA ou ligas) por pelo menos 6 meses: 0,5 ponto.',
   '{"op": "any_positive", "pts": 0.5, "fields": ["membro_liga_anos", "diretoria_ligas", "centro_academico_semestres", "atletica_semestres"]}'),

  -- 1d: Atividades e projetos sociais — 0,5
  ('Representação Estudantil e Voluntariado', 'voluntariado_horas', 0.5, 0.5,
   'Participação em atividades e projetos sociais (feiras de saúde, mutirões, Projeto Rondon, atendimento em áreas remotas, projetos em hospitais/escolas/asilos): 0,5 ponto.',
   '{"op": "any_true_or_positive", "pts": 0.5, "fields_true": ["projeto_rondon"], "fields_positive": ["voluntariado_horas"]}'),

  -- 1e: Curso ACLS — 0,5
  ('Congressos e Formação Complementar', 'cursos_suporte', 0.5, 0.5,
   'Participação no curso ACLS (Advanced Cardiovascular Life Support) com certificado: 0,5 ponto.',
   '{"op": "threshold", "field": "cursos_suporte", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- 1f: Representante em órgãos colegiados — 0,5
  ('Representação Estudantil e Voluntariado', 'colegiado_institucional_semestres', 0.5, 0.5,
   'Representante em órgãos colegiados institucionais (Comissão de Internato, Conselho Universitário, Departamentos, etc.): 0,5 ponto.',
   '{"op": "threshold", "field": "colegiado_institucional_semestres", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- ===== Item 2: Monitorias (teto 1,5) =====

  -- 2g+2h: Monitoria — ≥40h e 1 ano (1,0) | 20-40h e 1 semestre (0,5)
  ('Atividades Acadêmicas', 'monitoria_semestres', 1, 1.5,
   'Monitoria: duração mín 1 ano e 40h (1pt) | duração 1 semestre e 20-40h (0,5pt). Máximo 1,5 ponto.',
   '{"op": "tiered", "field": "monitoria_semestres", "tiers": [{"gte": 2, "pts": 1.0}, {"gte": 1, "pts": 0.5}]}'),

  -- ===== Item 3: Produção Científica (teto 4,0) =====

  -- 3i: IC com ou sem bolsa, mín 1 ano — 1,0
  ('Pesquisa e Publicações', 'ic_projetos', 1, 1,
   'Participação em projeto de IC (com ou sem bolsa) com duração mín 1 ano, em grupo de pesquisa regular da instituição: 1 ponto.',
   '{"op": "count_tiered", "field": "ic_projetos", "tiers": [{"gte": 1, "pts": 1.0}]}'),

  -- 3j: Publicação artigo completo (PubMed/Lilacs) — 1 pub = 0,5 | 2+ = 1,0
  ('Pesquisa e Publicações', 'publicacoes', 0.5, 1,
   'Artigo completo publicado em revista indexada (PubMed ou Lilacs): 1 publicação (0,5pt) | 2 ou mais (1pt). Resumos em anais não contam.',
   '{"op": "count_tiered", "field": "publicacoes", "tiers": [{"gte": 2, "pts": 1.0}, {"gte": 1, "pts": 0.5}]}'),

  -- 3k: Apresentação trabalho (tema livre, poster, oral) — 1 = 0,5 | 2+ = 1,0
  ('Pesquisa e Publicações', 'apresentacoes', 0.5, 1,
   'Apresentação de trabalho em evento científico (tema livre, poster ou oral): 1 apresentação (0,5pt) | 2 ou mais (1pt).',
   '{"op": "count_tiered", "field": "apresentacoes", "tiers": [{"gte": 2, "pts": 1.0}, {"gte": 1, "pts": 0.5}]}'),

  -- 3l: Organizador de ligas, jornadas, cursos, congressos — 0,5
  ('Congressos e Formação Complementar', 'organizador_evento', 0.5, 0.5,
   'Participação como organizador(a) de ligas, jornadas acadêmicas, cursos, simpósios ou congressos: 0,5 ponto.',
   '{"op": "threshold", "field": "organizador_evento", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- 3m: Ouvinte/participante em eventos — até 3 = 0,25 | 4+ = 0,5
  ('Congressos e Formação Complementar', 'ouvinte_congresso', 0.25, 0.5,
   'Participação como ouvinte em jornadas, cursos, simpósios ou congressos: até 3 eventos (0,25pt) | 4 ou mais (0,5pt). Certificado deve mencionar "ouvinte" ou "participante".',
   '{"op": "tiered", "field": "ouvinte_congresso", "tiers": [{"gte": 4, "pts": 0.5}, {"gte": 1, "pts": 0.25}]}'),

  -- ===== Item 4: Língua Estrangeira (teto 0,5) =====

  -- 4n: Proficiência em inglês — 0,5
  ('Qualificações', 'ingles_fluente', 0.5, 0.5,
   'Fluência em inglês comprovada por teste de proficiência reconhecido (Michigan, Cambridge, TOEIC, IELTS, FCE ou TOEFL): 0,5 ponto.',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 0.5}]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'FMABC';

UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'FMABC');
