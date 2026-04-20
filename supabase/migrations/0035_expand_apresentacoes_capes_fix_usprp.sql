-- 0035_expand_apresentacoes_capes_fix_usprp.sql
-- 1. Apresentações: adicionar campo abrangencia (Regional/Nacional/Internacional)
-- 2. CAPES: separar em 3 campos (doutorado, mestrado, qtd programas)
-- 3. Novo campo: comissao_avaliacao_semestres
-- 4. Reescrever regras USP-RP conforme edital (5 itens composites, 10 pts)
-- 5. Ajustar UNICAMP (filtros apresentacoes + CAPES)

-- =============================================================================
-- 1. Apresentações: adicionar abrangência
-- =============================================================================

-- Atualizar options para incluir abrangência
UPDATE curriculum_fields
SET options = '{
  "tipo": ["Apresentação oral", "Poster"],
  "nivel": ["Congresso de Sociedade Médica", "Congresso acadêmico", "Outro"],
  "abrangencia": ["Regional", "Nacional", "Internacional"]
}'::jsonb
WHERE field_key = 'apresentacoes';

-- Migrar dados: renomear valores antigos de nivel e adicionar abrangencia
UPDATE user_curriculum
SET data = jsonb_set(
  data,
  '{apresentacoes}',
  (
    SELECT coalesce(jsonb_agg(
      CASE
        WHEN item->>'nivel' = 'Congresso de Sociedade Médica (nacional/internacional)' THEN
          item - 'nivel' || '{"nivel": "Congresso de Sociedade Médica", "abrangencia": "Nacional"}'::jsonb
        WHEN item->>'nivel' = 'Congresso acadêmico local/regional' THEN
          item - 'nivel' || '{"nivel": "Congresso acadêmico", "abrangencia": "Regional"}'::jsonb
        ELSE
          item || '{"abrangencia": "Nacional"}'::jsonb
      END
    ), '[]'::jsonb)
    FROM jsonb_array_elements(data->'apresentacoes') AS item
  )
)
WHERE data ? 'apresentacoes'
  AND jsonb_typeof(data->'apresentacoes') = 'array'
  AND jsonb_array_length(data->'apresentacoes') > 0;

-- =============================================================================
-- 2. CAPES: separar em 3 campos
-- =============================================================================

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES
  ('faculdade_tem_doutorado', 'Faculdade tem Doutorado stricto sensu', 'Formação', 'boolean', null, 42),
  ('faculdade_tem_mestrado', 'Faculdade tem Mestrado stricto sensu', 'Formação', 'boolean', null, 43),
  ('faculdade_programas_capes', 'Programas de pós-graduação CAPES da faculdade', 'Formação', 'number', null, 44)
ON CONFLICT (field_key) DO NOTHING;

-- Migrar dados do campo antigo
UPDATE user_curriculum
SET data = data
  || jsonb_build_object(
    'faculdade_tem_doutorado',
    CASE WHEN data->>'faculdade_pos_grad_capes' = 'Doutorado stricto sensu' THEN true ELSE false END
  )
  || jsonb_build_object(
    'faculdade_tem_mestrado',
    CASE WHEN data->>'faculdade_pos_grad_capes' IN ('Doutorado stricto sensu', 'Mestrado stricto sensu') THEN true ELSE false END
  )
  || jsonb_build_object(
    'faculdade_programas_capes',
    CASE
      WHEN data->>'faculdade_pos_grad_capes' = 'Doutorado stricto sensu' THEN 5
      WHEN data->>'faculdade_pos_grad_capes' = 'Mestrado stricto sensu' THEN 1
      ELSE 0
    END
  )
WHERE data ? 'faculdade_pos_grad_capes';

-- Remover campo antigo
UPDATE user_curriculum SET data = data - 'faculdade_pos_grad_capes' WHERE data ? 'faculdade_pos_grad_capes';
DELETE FROM curriculum_fields WHERE field_key = 'faculdade_pos_grad_capes';

-- =============================================================================
-- 3. Novo campo: comissao_avaliacao_semestres
-- =============================================================================

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES (
  'comissao_avaliacao_semestres',
  'Semestres em comissão de avaliação ou reforma curricular',
  'Representação Estudantil e Voluntariado',
  'number',
  null,
  76
)
ON CONFLICT (field_key) DO NOTHING;

-- =============================================================================
-- 4. Ajustar UNICAMP: novos campos CAPES + filtros apresentacoes
-- =============================================================================

-- UNICAMP: faculdade_pos_grad_capes → faculdade_tem_doutorado/mestrado
UPDATE scoring_rules
SET field_key = 'faculdade_tem_doutorado',
    description = 'Faculdade com Doutorado stricto sensu (15pts) | Mestrado stricto sensu (10pts)',
    formula = '{"op": "sum", "caps": {"total": 15}, "terms": [
      {"field": "faculdade_tem_doutorado", "when_true": 15},
      {"field": "faculdade_tem_mestrado", "when_true": 10, "override_by": "faculdade_tem_doutorado"}
    ]}'::jsonb
WHERE field_key = 'faculdade_pos_grad_capes'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

-- UNICAMP: apresentacoes — atualizar filtros (remover "(nacional/internacional)" e "local/regional")
UPDATE scoring_rules
SET formula = '{"op": "composite", "caps": {"total": 10}, "groups": [
      {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Apresentação oral", "nivel": "Congresso de Sociedade Médica"}, "mult": 10, "caps": {"total": 10}},
      {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "nivel": "Congresso de Sociedade Médica"}, "mult": 6, "caps": {"total": 10}},
      {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Apresentação oral", "nivel": "Congresso acadêmico"}, "mult": 2, "caps": {"total": 10}},
      {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "nivel": "Congresso acadêmico"}, "mult": 2, "caps": {"total": 10}}
    ]}'::jsonb
WHERE field_key = 'apresentacoes'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

-- =============================================================================
-- 5. Reescrever regras USP-RP conforme edital (5 itens, 10 pts)
-- =============================================================================

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-RP');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- Item 1: Histórico acadêmico — máx 1,5
  -- Hospital próprio = 1,0 | CAPES 5+=0,5 | 2-4=0,3 | 1=0,2
  ('Formação', 'internato_hospital_ensino', 1, 1.5,
   'Hospital próprio (1pt) | CAPES 5+ programas (0,5) | 2-4 (0,3) | 1 (0,2) — máx 1,5',
   '{"op": "composite", "caps": {"total": 1.5}, "groups": [
     {"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 1.0}]},
     {"op": "tiered", "field": "faculdade_programas_capes", "tiers": [{"gte": 5, "pts": 0.5}, {"gte": 2, "pts": 0.3}, {"gte": 1, "pts": 0.2}]}
   ]}'),

  -- Item 2: Atividades assistenciais extracurriculares — máx 2,0
  -- Plantão ≥120h (0,5/120h, máx 1) + Liga ≥1 ano (0,5/ano, máx 1) + Voluntário ≥120h (0,5/120h, máx 1)
  ('Representação Estudantil e Voluntariado', 'estagio_extracurricular_horas', 0.5, 2,
   'Plantão voluntário (0,5/120h, máx 1) | Liga ≥1 ano (0,5/ano, máx 1) | Voluntário (0,5/120h, máx 1) — máx 2',
   '{"op": "composite", "caps": {"total": 2.0}, "groups": [
     {"op": "floor_div", "field": "estagio_extracurricular_horas", "divisor": 120, "mult": 0.5},
     {"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "membro_liga_anos", "mult": 0.5}]},
     {"op": "floor_div", "field": "voluntariado_horas", "divisor": 120, "mult": 0.5}
   ]}'),

  -- Item 3: Atividades científicas — máx 3,0
  -- Artigo indexado 1pt/artigo (máx 3) + IC bolsa 0,7/ano (máx 1,4) + IC sem bolsa 0,5/ano (máx 1)
  -- + Oral congresso 0,5/apres (máx 1) + Poster regional 0,1 | nacional 0,15 | internacional 0,3 (máx 0,6)
  ('Pesquisa e Publicações', 'publicacoes', 1, 3,
   'Artigo indexado (1pt) | IC bolsa (0,7/ano) | IC sem bolsa (0,5/ano) | Oral (0,5) | Poster (0,1-0,3) — máx 3',
   '{"op": "composite", "caps": {"total": 3.0}, "groups": [
     {"op": "count_articles", "field": "publicacoes", "mult": 1.0, "caps": {"total": 3.0}},
     {"op": "sum_array", "field": "ic_projetos", "sum_key": "semestres", "filter": {"tipo": "Com bolsa"}, "mult": 0.35, "caps": {"total": 1.4}},
     {"op": "sum_array", "field": "ic_projetos", "sum_key": "semestres", "filter": {"tipo": "Sem bolsa"}, "mult": 0.25, "caps": {"total": 1.0}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Apresentação oral"}, "mult": 0.5, "caps": {"total": 1.0}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "abrangencia": "Regional"}, "mult": 0.1, "caps": {"total": 0.6}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "abrangencia": "Nacional"}, "mult": 0.15, "caps": {"total": 0.6}},
     {"op": "count_articles", "field": "apresentacoes", "filter": {"tipo": "Poster", "abrangencia": "Internacional"}, "mult": 0.3, "caps": {"total": 0.6}}
   ]}'),

  -- Item 4: Atividades de ensino extracurriculares — máx 1,5
  -- Monitoria bolsa 0,5/ano (máx 1) + Prof cursinho 0,5/ano (máx 1)
  -- + Org evento 0,3/evento (máx 0,6) + Teste Progresso 0,5/prova (máx 1)
  -- + Prêmios 0,2/prêmio (máx 0,4)
  ('Atividades Acadêmicas', 'monitoria_semestres', 0.5, 1.5,
   'Monitoria (0,5/ano) | Prof cursinho (0,5/ano) | Org evento (0,3) | Teste Progresso (0,5) | Prêmios (0,2) — máx 1,5',
   '{"op": "composite", "caps": {"total": 1.5}, "groups": [
     {"op": "floor_div", "field": "monitoria_semestres", "divisor": 2, "mult": 0.5},
     {"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "cursinhos_preparatorios", "mult": 0.5}]},
     {"op": "sum", "caps": {"total": 0.6}, "terms": [{"field": "organizador_evento", "mult": 0.3}]},
     {"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "teste_progresso", "mult": 0.5}]},
     {"op": "sum", "caps": {"total": 0.4}, "terms": [{"field": "premios_academicos", "mult": 0.2}]}
   ]}'),

  -- Item 5: Atividades estudantis — máx 2,0
  -- CA/Atlética ≥1 ano 0,5/ano (máx 1) + Colegiado oficial 0,5/ano (máx 1)
  -- + Comissão avaliação/reforma 0,5/ano (máx 1)
  ('Representação Estudantil e Voluntariado', 'centro_academico_semestres', 0.5, 2,
   'CA/Atlética (0,5/ano, máx 1) | Colegiado oficial (0,5/ano, máx 1) | Comissão avaliação (0,5/ano, máx 1) — máx 2',
   '{"op": "composite", "caps": {"total": 2.0}, "groups": [
     {"op": "composite", "caps": {"total": 1.0}, "groups": [
       {"op": "floor_div", "field": "centro_academico_semestres", "divisor": 2, "mult": 0.5},
       {"op": "floor_div", "field": "atletica_semestres", "divisor": 2, "mult": 0.5}
     ]},
     {"op": "floor_div", "field": "colegiado_institucional_semestres", "divisor": 2, "mult": 0.5},
     {"op": "floor_div", "field": "comissao_avaliacao_semestres", "divisor": 2, "mult": 0.5}
   ]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'USP-RP';

-- =============================================================================
-- 6. Marcar scores stale
-- =============================================================================

UPDATE user_scores SET stale = true;
