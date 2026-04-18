-- 0017_expand_curriculum_fields.sql
-- Expandir curriculum_fields para cobrir editais Einstein + USP
-- Estratégia: ADICIONAR campos, NÃO remover — backward compatible

-- =============================================================================
-- 0. Expandir constraints para novos field_types
-- =============================================================================

ALTER TABLE curriculum_fields DROP CONSTRAINT curriculum_fields_field_type_check;
ALTER TABLE curriculum_fields ADD CONSTRAINT curriculum_fields_field_type_check
  CHECK (field_type = ANY (ARRAY[
    'number', 'boolean', 'select', 'text',
    'article_list', 'event_list', 'project_list'
  ]));

ALTER TABLE curriculum_fields DROP CONSTRAINT curriculum_fields_options_consistency;
ALTER TABLE curriculum_fields ADD CONSTRAINT curriculum_fields_options_consistency
  CHECK (
    ((field_type IN ('select', 'article_list', 'event_list', 'project_list')) AND (options IS NOT NULL))
    OR ((field_type NOT IN ('select', 'article_list', 'event_list', 'project_list')) AND (options IS NULL))
  );

-- =============================================================================
-- 1. Restaurar campos de publicações simples (removidos na 0015, usados por 10+ instituições)
-- =============================================================================

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES
  ('artigos_high_impact', 'Artigos de alto impacto (1º autor, indexado)', 'Publicações', 'number', null, 10),
  ('artigos_mid_impact', 'Artigos de médio impacto / coautoria indexada', 'Publicações', 'number', null, 11),
  ('artigos_low_impact', 'Artigos de baixo impacto', 'Publicações', 'number', null, 12),
  ('artigos_nacionais', 'Artigos em periódicos nacionais', 'Publicações', 'number', null, 13)
ON CONFLICT (field_key) DO NOTHING;

-- =============================================================================
-- 2. Ajustar internato_hospital_ensino: boolean → select
-- =============================================================================

UPDATE curriculum_fields
SET field_type = 'select',
    label = 'Hospital de ensino de formação',
    options = '["Não", "Próprio", "Conveniado"]'::jsonb
WHERE field_key = 'internato_hospital_ensino';

-- Migrar dados JSONB: true → "Próprio", false/null → "Não"
UPDATE user_curriculum
SET data = data || jsonb_build_object(
  'internato_hospital_ensino',
  CASE
    WHEN (data->>'internato_hospital_ensino')::boolean = true THEN 'Próprio'
    ELSE 'Não'
  END
)
WHERE data ? 'internato_hospital_ensino'
  AND jsonb_typeof(data->'internato_hospital_ensino') = 'boolean';

-- =============================================================================
-- 3. Novos campos simples
-- =============================================================================

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES
  -- Perfil
  ('nivel_assistencial', 'Nível assistencial da instituição de formação', 'Perfil', 'select',
   '["Primário, secundário e terciário", "Primário e secundário", "Apenas primário"]'::jsonb, 30),
  ('residencia_medica_concluida', 'Residência médica concluída em outra área', 'Perfil', 'boolean', null, 31),
  ('outro_curso_universitario', 'Outro curso universitário concluído', 'Perfil', 'boolean', null, 32),
  -- Acadêmico
  ('monitoria_horas_totais', 'Carga horária total de monitoria', 'Acadêmico', 'number', null, 15)
ON CONFLICT (field_key) DO NOTHING;

-- =============================================================================
-- 4. Lista dinâmica: congressos/eventos
-- =============================================================================

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES (
  'congressos',
  'Atividades em congressos e eventos',
  'Liderança/Eventos',
  'event_list',
  '{
    "tipo": ["Apresentação oral", "Pôster", "Organização"],
    "nivel": ["Internacional", "Nacional", "Jornada sociedade médica", "Jornada liga/diretório acadêmico"],
    "extras": ["Prêmio", "1º autor"]
  }'::jsonb,
  1
)
ON CONFLICT (field_key) DO NOTHING;

-- =============================================================================
-- 5. Lista dinâmica: projetos de IC
-- =============================================================================

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES (
  'ic_projetos',
  'Projetos de Iniciação Científica',
  'Acadêmico',
  'project_list',
  '{
    "bolsa": ["Com bolsa", "Sem bolsa"],
    "extras": ["Publicação aceita/submetida"]
  }'::jsonb,
  5
)
ON CONFLICT (field_key) DO NOTHING;

-- =============================================================================
-- 6. Atualizar regras que usam internato_hospital_ensino (agora é select)
-- =============================================================================

-- UNICAMP: formacao usa internato_hospital_ensino com when_true → mudar para when_value
UPDATE scoring_rules
SET formula = jsonb_set(
  formula,
  '{terms,0}',
  '{"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 10}'::jsonb
)
WHERE field_key = 'formacao'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

-- Santa Casa SP: formacao usa bool internato_hospital_ensino
UPDATE scoring_rules
SET formula = '{
  "op": "composite",
  "caps": {"total": 30},
  "groups": [
    {"op": "sum", "caps": {"total": 10}, "terms": [{"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 10}]},
    {"op": "ruf_branch", "field": "ranking_ruf_top35", "pts_null": 0, "pts_true": 20, "pts_false": 5}
  ]
}'::jsonb
WHERE field_key = 'formacao'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

-- USP-RP: formacao usa bool internato_hospital_ensino
UPDATE scoring_rules
SET formula = '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 1.0}]}'::jsonb
WHERE field_key = 'formacao'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-RP');

-- USP-SP: instituicao_origem usa internato_hospital_ensino com when_true
UPDATE scoring_rules
SET formula = '{"op": "sum", "caps": {"total": 15}, "terms": [{"field": "internato_hospital_ensino", "when_value": "Próprio", "pts": 10}, {"field": "ranking_ruf_top35", "when_true": 5}]}'::jsonb
WHERE field_key = 'instituicao_origem'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-SP');

-- =============================================================================
-- 7. Marcar scores stale
-- =============================================================================

UPDATE user_scores SET stale = true;
