-- 0032_fix_unicamp_edital_rules.sql
-- Reescrever regras UNICAMP conforme edital real (11 itens, total 100 pts)
-- Remove regras inventadas (media_geral, extensao) e corrige todas as existentes

-- =============================================================================
-- 1. Deletar todas as regras atuais da UNICAMP
-- =============================================================================

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

-- =============================================================================
-- 2. Inserir regras corretas conforme edital (11 itens)
-- =============================================================================

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- Item 1: Faculdade com pós-grad CAPES — max 15 pts
  -- Doutorado stricto sensu = 15 | Mestrado stricto sensu = 10
  ('Perfil', 'faculdade_pos_grad_capes', 15, 15,
   'Doutorado stricto sensu (15pts) | Mestrado stricto sensu (10pts)',
   '{"op": "sum", "caps": {"total": 15}, "terms": [
     {"field": "faculdade_pos_grad_capes", "when_value": "Doutorado stricto sensu", "pts": 15},
     {"field": "faculdade_pos_grad_capes", "when_value": "Mestrado stricto sensu", "pts": 10}
   ]}'),

  -- Item 2: Hospital de ensino — max 10 pts
  -- Próprio = 10 | Conveniado = 5
  ('Perfil', 'internato_hospital_ensino', 10, 10,
   'Hospital de ensino próprio (10pts) | Conveniado (5pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [
     {"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 10},
     {"field": "internato_hospital_ensino", "when_value": "Conveniado", "pts": 5}
   ]}'),

  -- Item 3: Iniciação científica — max 20 pts
  -- Com bolsa: >2 sem = 20, ≤2 sem = 15
  -- Sem bolsa: >2 sem = 10, ≤2 sem = 5
  -- Usando composite: avalia com_bolsa e sem_bolsa separadamente, soma com cap
  ('Acadêmico', 'ic_com_bolsa', 20, 20,
   'Com bolsa >2sem (20pts) | Com bolsa ≤2sem (15pts) | Sem bolsa >2sem (10pts) | Sem bolsa ≤2sem (5pts)',
   '{"op": "composite", "caps": {"total": 20}, "groups": [
     {"op": "tiered", "field": "ic_com_bolsa", "tiers": [{"gte": 3, "pts": 20}, {"gte": 1, "pts": 15}]},
     {"op": "tiered", "field": "ic_sem_bolsa", "tiers": [{"gte": 3, "pts": 10}, {"gte": 1, "pts": 5}]}
   ]}'),

  -- Item 4: Publicação artigo científico — max 15 pts
  -- PubMed = 10pts | Scielo/SCOPUS = 5pts
  -- Aceita múltiplos até atingir max
  ('Publicações', 'publicacoes', 15, 15,
   'Artigo PubMed (10pts) | Artigo SCIELO/SCOPUS (5pts) — máx 15pts',
   '{"op": "composite", "caps": {"total": 15}, "groups": [
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "PubMed"}, "mult": 10, "caps": {"total": 15}},
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "SCIELO/SCOPUS"}, "mult": 5, "caps": {"total": 15}}
   ]}'),

  -- Item 5: Trabalho apresentado em congresso — max 10 pts
  -- Oral sociedade = 10 | Poster sociedade = 6
  -- Oral acadêmico = 2 | Poster acadêmico = 2
  ('Liderança/Eventos', 'apresentacoes', 10, 10,
   'Oral sociedade (10pts) | Poster sociedade (6pts) | Oral acadêmico (2pts) | Poster acadêmico (2pts)',
   '{"op": "composite", "caps": {"total": 10}, "groups": [
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Apresentação oral", "nivel": "Congresso de Sociedade Médica (nacional/internacional)"}, "mult": 10, "caps": {"total": 10}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "nivel": "Congresso de Sociedade Médica (nacional/internacional)"}, "mult": 6, "caps": {"total": 10}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Apresentação oral", "nivel": "Congresso acadêmico local/regional"}, "mult": 2, "caps": {"total": 10}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "nivel": "Congresso acadêmico local/regional"}, "mult": 2, "caps": {"total": 10}}
   ]}'),

  -- Item 6: Liga acadêmica — max 5 pts
  -- Diretoria = 5 | Membro = 2
  ('Liderança/Eventos', 'membro_liga_anos', 5, 5,
   'Diretoria de liga (5pts) | Membro ligante (2pts)',
   '{"op": "sum", "caps": {"total": 5}, "terms": [
     {"field": "diretoria_ligas", "when_gt0": 5},
     {"field": "membro_liga_anos", "when_gt0": 2}
   ]}'),

  -- Item 7: Cursos de aprimoramento profissional — max 5 pts
  -- Cursos saúde >12h = 1pt cada | Suporte vida = 2pts cada
  ('Liderança/Eventos', 'cursos_suporte', 5, 5,
   'Cursos em área de saúde >12h (1pt cada) | Suporte de vida — ACLS, ATLS, PALS (2pts cada) — máx 5pts',
   '{"op": "sum", "caps": {"total": 5}, "terms": [
     {"field": "cursos_temas_medicos", "mult": 1},
     {"field": "cursos_suporte", "mult": 2}
   ]}'),

  -- Item 8: Monitoria / estágio PAD — max 5 pts
  -- >2 semestres = 5 | ≤2 semestres = 2
  ('Acadêmico', 'monitoria_semestres', 5, 5,
   'Monitoria >2 semestres (5pts) | ≤2 semestres (2pts)',
   '{"op": "tiered", "field": "monitoria_semestres", "tiers": [{"gte": 3, "pts": 5}, {"gte": 1, "pts": 2}]}'),

  -- Item 9: Trabalho voluntário social — max 5 pts
  -- >96h = 5 | 48-96h = 2
  ('Prática/Social', 'voluntariado_horas', 5, 5,
   'Voluntariado >96h (5pts) | 48-96h (2pts)',
   '{"op": "tiered", "field": "voluntariado_horas", "tiers": [{"gte": 97, "pts": 5}, {"gte": 48, "pts": 2}]}'),

  -- Item 10: Representação em colegiados institucionais — max 5 pts
  -- ≥1 semestre como representante discente = 5
  ('Liderança/Eventos', 'colegiado_institucional_semestres', 5, 5,
   'Representante discente em colegiado institucional ≥1 semestre (5pts)',
   '{"op": "threshold", "field": "colegiado_institucional_semestres", "brackets": [{"gte": 1, "pts": 5}]}'),

  -- Item 11: Representação discente — max 5 pts
  -- CA/diretório = 2 | Atlética = 2 | Equipe esportiva = 1
  ('Liderança/Eventos', 'centro_academico_semestres', 5, 5,
   'Centro/diretório acadêmico (2pts) | Atlética (2pts) | Equipe esportiva (1pt) — máx 5pts',
   '{"op": "sum", "caps": {"total": 5}, "terms": [
     {"field": "centro_academico_semestres", "when_gt0": 2},
     {"field": "atletica_semestres", "when_gt0": 2},
     {"field": "equipe_esportiva_semestres", "when_gt0": 1}
   ]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'UNICAMP';

-- =============================================================================
-- 3. Marcar scores stale
-- =============================================================================

UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');
