-- 0043_fix_uspsp_edital_rules.sql
-- Corrigir regras USP-SP conforme edital Acesso Direto (13 itens, total 100 pts)

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-SP');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- Item 1: Pós-grad CAPES da faculdade — máx 13
  -- Doutorado: 3pts/programa (max 4=12) | Mestrado: 2pts/programa (max 3=6)
  -- Aproximação: tem doutorado → 12pts | só mestrado → 6pts
  ('Formação', 'faculdade_tem_doutorado', 12, 13,
   'Sua faculdade possui programas de Pós-graduação em Medicina credenciados pela CAPES? Doutorado stricto sensu — 3pts por programa, máx 4 programas (12pts) | Mestrado stricto sensu — 2pts por programa, máx 3 programas (6pts). Teto 13 pontos.',
   '{"op": "composite", "caps": {"total": 13}, "groups": [
     {"op": "sum", "caps": {"total": 12}, "terms": [{"field": "faculdade_tem_doutorado", "when_true": 12}]},
     {"op": "sum", "caps": {"total": 6}, "terms": [{"field": "faculdade_tem_mestrado", "when_true": 6, "override_by": "faculdade_tem_doutorado"}]}
   ]}'),

  -- Item 2: Hospital de ensino — máx 12
  ('Formação', 'internato_hospital_ensino', 12, 12,
   'Sua faculdade possui hospital de ensino? Próprio (12pts) | Conveniado com governo ou hospitais privados (3pts)',
   '{"op": "sum", "caps": {"total": 12}, "terms": [
     {"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 12},
     {"field": "internato_hospital_ensino", "when_value": "Conveniado", "pts": 3}
   ]}'),

  -- Item 3: Centro assistencial — máx 8
  ('Formação', 'nivel_assistencial', 8, 8,
   'Sua instituição de formação é centro assistencial em quais níveis? Primário + Secundário + Terciário (8pts) | Primário + Secundário (2pts)',
   '{"op": "sum", "caps": {"total": 8}, "terms": [
     {"field": "nivel_assistencial", "when_value": "Primário, secundário e terciário", "pts": 8},
     {"field": "nivel_assistencial", "when_value": "Primário e secundário", "pts": 2}
   ]}'),

  -- Item 4: Monitoria — máx 3
  ('Atividades Acadêmicas', 'monitoria_semestres', 3, 3,
   'Monitoria na mesma disciplina: mais de 2 semestres com mín 192h (3pts) | 2 semestres com mín 128h (2pts) | 1 semestre com mín 64h (1pt)',
   '{"op": "tiered", "field": "monitoria_semestres", "tiers": [{"gte": 3, "pts": 3}, {"gte": 2, "pts": 2}, {"gte": 1, "pts": 1}]}'),

  -- Item 5: IC com/sem bolsa — máx 12
  -- Com bolsa + publicação = 6pts/proj | Com bolsa sem pub = 2pts/proj
  -- Sem bolsa + publicação = 4pts/proj | Sem bolsa sem pub = 1pt/proj
  -- Máx 2 projetos cada. Aproximação: pontua valor máximo (com publicação)
  ('Pesquisa e Publicações', 'ic_projetos', 6, 12,
   'Iniciação Científica (máx 2 projetos cada tipo): Com bolsa + publicação (6pts/proj) | Com bolsa sem publicação (2pts/proj) | Sem bolsa + publicação (4pts/proj) | Sem bolsa sem publicação (1pt/proj). Teto 12 pontos.',
   '{"op": "composite", "caps": {"total": 12}, "groups": [
     {"op": "count_articles", "field": "ic_projetos", "filter": {"tipo": "Com bolsa"}, "mult": 6, "caps": {"total": 12}},
     {"op": "count_articles", "field": "ic_projetos", "filter": {"tipo": "Sem bolsa"}, "mult": 4, "caps": {"total": 8}}
   ]}'),

  -- Item 6: Publicações (diferentes do item 5) — máx 10
  ('Pesquisa e Publicações', 'publicacoes', 10, 10,
   'Publicação científica (diferente da IC): PubMed — máx 1 artigo (10pts) | SCIELO — máx 1 artigo (8pts) | Anais congresso internacional — máx 1 (2pts) | Anais congresso nacional — máx 1 (1pt). Teto 10 pontos.',
   '{"op": "composite", "caps": {"total": 10}, "groups": [
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "PubMed"}, "mult": 10, "caps": {"total": 10}},
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "SCIELO/SCOPUS"}, "mult": 8, "caps": {"total": 8}},
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "Anais congresso internacional"}, "mult": 2, "caps": {"total": 2}},
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "Anais congresso nacional"}, "mult": 1, "caps": {"total": 1}}
   ]}'),

  -- Item 7: Organização congressos — máx 6
  ('Congressos e Formação Complementar', 'organizador_evento', 4, 6,
   'Organização de eventos: Congresso estadual/nacional/internacional de entidade profissional — máx 1 (4pts) | Jornada/liga/estudantil — máx 2 (2pts cada). Teto 6 pontos.',
   '{"op": "sum", "caps": {"total": 6}, "terms": [{"field": "organizador_evento", "mult": 4}]}'),

  -- Item 8: Apresentação oral — máx 10
  -- Simplificação: oral internacional (8pts) | oral nacional (7pts) | oral sociedade (4pts) | oral acadêmico (1pt)
  ('Congressos e Formação Complementar', 'apresentacoes', 10, 10,
   'Apresentação ORAL de trabalho científico (1º autor): Congresso internacional (8pts) | Congresso nacional (7pts) | Jornada de sociedade médica (4pts) | Jornada acadêmica/liga como 1º autor (2pts) | Jornada acadêmica/liga (1pt). Premiação pode aumentar a nota. Teto 10 pontos.',
   '{"op": "composite", "caps": {"total": 10}, "groups": [
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Apresentação oral", "abrangencia": "Internacional"}, "mult": 8, "caps": {"total": 10}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Apresentação oral", "abrangencia": "Nacional"}, "mult": 7, "caps": {"total": 10}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Apresentação oral", "abrangencia": "Regional"}, "mult": 4, "caps": {"total": 10}}
   ]}'),

  -- Item 9: Poster — máx 6
  ('Congressos e Formação Complementar', 'ouvinte_congresso', 6, 6,
   'Apresentação de POSTER como 1º autor: Congresso internacional (6pts) | Congresso nacional (4pts) | Jornada/evento acadêmico (1pt). Teto 6 pontos.',
   '{"op": "composite", "caps": {"total": 6}, "groups": [
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "abrangencia": "Internacional"}, "mult": 6, "caps": {"total": 6}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "abrangencia": "Nacional"}, "mult": 4, "caps": {"total": 4}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "abrangencia": "Regional"}, "mult": 1, "caps": {"total": 1}}
   ]}'),

  -- Item 10: Liga acadêmica — máx 5
  ('Atividades Acadêmicas', 'membro_liga_anos', 5, 5,
   'Liga acadêmica comprovada: Diretoria por 1 ano (5pts) | Membro por 2+ anos (2pts) | Membro por 1 ano (1pt). Certificado deve conter tempo de participação.',
   '{"op": "sum", "caps": {"total": 5}, "terms": [
     {"field": "diretoria_ligas", "when_gt0": 5},
     {"field": "membro_liga_anos", "when_gt0": 2}
   ]}'),

  -- Item 11: Pós-graduação pessoal — máx 8
  ('Qualificações', 'mestrado_status', 8, 8,
   'Aprimoramento profissional: Doutorado concluído em Medicina I/II/III (8pts) | Mestrado concluído (4pts) | Residência concluída em outra área (2pts) | Outro curso universitário concluído (1pt). Apenas o maior valor é considerado.',
   '{"op": "sum", "caps": {"total": 8}, "terms": [
     {"field": "doutorado_status", "when_value": "Concluído", "pts": 8},
     {"field": "mestrado_status", "when_value": "Concluído", "pts": 4, "override_by_field": "doutorado_status", "override_value": "Concluído"},
     {"field": "residencia_medica_concluida", "when_true": 2},
     {"field": "outro_curso_universitario", "when_true": 1}
   ]}'),

  -- Item 12: Cursos suporte vida — máx 4
  ('Congressos e Formação Complementar', 'cursos_suporte', 2, 4,
   'Cursos de suporte de vida atualizados (ACLS, ATLS, PALS, Reanimação Neonatal, BLS, SAVIC, PHTLS): 2 pontos por curso. Máximo 2 cursos = 4 pontos.',
   '{"op": "sum", "caps": {"total": 4}, "terms": [{"field": "cursos_suporte", "mult": 2}]}'),

  -- Item 13: Representação estudantil — máx 3
  ('Representação Estudantil e Voluntariado', 'representante_turma_anos', 3, 3,
   'Representação estudantil (exceto Liga): CA, DA, colegiados, representante de turma, diretórios, atléticas ou equipe esportiva. Mínimo 2 anos / 4 semestres (3pts) | Mínimo 1 ano / 2 semestres (1pt).',
   '{"op": "composite", "caps": {"total": 3}, "groups": [
     {"op": "tiered", "field": "centro_academico_semestres", "tiers": [{"gte": 4, "pts": 3}, {"gte": 2, "pts": 1}]},
     {"op": "tiered", "field": "colegiado_institucional_semestres", "tiers": [{"gte": 4, "pts": 3}, {"gte": 2, "pts": 1}]},
     {"op": "tiered", "field": "atletica_semestres", "tiers": [{"gte": 4, "pts": 3}, {"gte": 2, "pts": 1}]},
     {"op": "tiered", "field": "representante_turma_anos", "tiers": [{"gte": 2, "pts": 3}, {"gte": 1, "pts": 1}]}
   ]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'USP-SP';

UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-SP');
