-- 0015_einstein_edital_rules.sql
-- Recriar regras Einstein baseado no edital oficial (Acesso Direto)
-- + Novos campos: mestrado_status/doutorado_status (select) + artigos por FI
-- + Novo operador: publication_matrix no evaluate_formula

-- =============================================================================
-- 0. Garantir que institutions existam (seeds não rodam no CI)
-- =============================================================================

INSERT INTO public.institutions (name, short_name, state) VALUES
  ('UNICAMP',  'UNICAMP',       'SP'),
  ('USP-SP',   'USP-SP',        'SP'),
  ('PSU-MG',   'PSU-MG',        'MG'),
  ('FMABC',    'FMABC',         'SP'),
  ('EINSTEIN', 'Einstein',      'SP'),
  ('SCMSP',    'Santa Casa SP', 'SP'),
  ('SES-PE',   'SES-PE',        'PE'),
  ('SES-DF',   'SES-DF',        'DF'),
  ('SCM-BH',   'Santa Casa BH', 'MG'),
  ('USP-RP',   'USP-RP',        'SP'),
  ('UFPA',     'UFPA',          'PA')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 1. Novos curriculum_fields: pós-graduação como select (substitui booleans)
-- =============================================================================

-- Substituir mestrado boolean por mestrado_status select
UPDATE curriculum_fields
SET field_key = 'mestrado_status',
    label = 'Mestrado',
    field_type = 'select',
    options = '["Não tenho", "Em curso", "Concluído"]'::jsonb
WHERE field_key = 'mestrado';

-- Substituir doutorado boolean por doutorado_status select
UPDATE curriculum_fields
SET field_key = 'doutorado_status',
    label = 'Doutorado',
    field_type = 'select',
    options = '["Não tenho", "Em curso", "Concluído"]'::jsonb
WHERE field_key = 'doutorado';

-- =============================================================================
-- 2. Novos curriculum_fields: artigos detalhados (3 artigos × 2 campos)
-- =============================================================================

-- Remover campos antigos de publicações simplificados
DELETE FROM curriculum_fields WHERE field_key IN (
  'artigos_high_impact', 'artigos_mid_impact', 'artigos_low_impact', 'artigos_nacionais'
);

-- Artigo 1
INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES
  ('artigo_1_posicao', 'Artigo 1 — Posição', 'Publicações', 'select', '["1º Autor / Último autor", "Coautor"]'::jsonb, 1),
  ('artigo_1_fi', 'Artigo 1 — Fator de Impacto (JCR)', 'Publicações', 'number', null, 2),
  ('artigo_2_posicao', 'Artigo 2 — Posição', 'Publicações', 'select', '["1º Autor / Último autor", "Coautor"]'::jsonb, 3),
  ('artigo_2_fi', 'Artigo 2 — Fator de Impacto (JCR)', 'Publicações', 'number', null, 4),
  ('artigo_3_posicao', 'Artigo 3 — Posição', 'Publicações', 'select', '["1º Autor / Último autor", "Coautor"]'::jsonb, 5),
  ('artigo_3_fi', 'Artigo 3 — Fator de Impacto (JCR)', 'Publicações', 'number', null, 6)
ON CONFLICT (field_key) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  field_type = EXCLUDED.field_type,
  options = EXCLUDED.options,
  display_order = EXCLUDED.display_order;

-- =============================================================================
-- 3. Migrar dados existentes: boolean → select no user_curriculum JSONB
-- =============================================================================

UPDATE user_curriculum
SET data = data
  -- mestrado: true → "Concluído", false/null → "Não tenho"
  || jsonb_build_object(
    'mestrado_status',
    CASE
      WHEN (data->>'mestrado')::boolean = true THEN 'Concluído'
      ELSE 'Não tenho'
    END
  )
  -- doutorado: true → "Concluído", false/null → "Não tenho"
  || jsonb_build_object(
    'doutorado_status',
    CASE
      WHEN (data->>'doutorado')::boolean = true THEN 'Concluído'
      ELSE 'Não tenho'
    END
  )
WHERE data ? 'mestrado' OR data ? 'doutorado';

-- Remover campos antigos do JSONB
UPDATE user_curriculum
SET data = data - 'mestrado' - 'doutorado'
WHERE data ? 'mestrado' OR data ? 'doutorado';

-- =============================================================================
-- 4. Atualizar fórmulas de outras instituições (UNICAMP: mestrado → mestrado_status)
-- =============================================================================

-- UNICAMP formacao: usa mestrado/doutorado booleans → precisa mudar para status selects
UPDATE scoring_rules
SET formula = '{
  "op": "sum",
  "caps": {"total": 25},
  "terms": [
    {"field": "internato_hospital_ensino", "when_true": 10},
    {"field": "mestrado_status", "when_value": "Concluído", "pts": 10, "override_by_field": "doutorado_status", "override_value": "Concluído"},
    {"field": "doutorado_status", "when_value": "Concluído", "pts": 15}
  ]
}'::jsonb
WHERE field_key = 'formacao'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

-- =============================================================================
-- 5. Novo operador: publication_matrix + when_value no evaluate_formula
-- =============================================================================

CREATE OR REPLACE FUNCTION public.evaluate_formula(p_formula jsonb, p_data jsonb)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_op text;
  v_result numeric := 0;
  v_field text;
  v_value numeric;
  v_bool_value boolean;
  v_cap numeric;
  -- sum
  v_term jsonb;
  v_term_score numeric;
  v_override_field text;
  v_override_value text;
  v_str_value text;
  -- threshold/tiered
  v_brackets jsonb;
  v_bracket jsonb;
  v_aggregate jsonb;
  v_agg_fields jsonb;
  v_agg_field text;
  -- composite
  v_group jsonb;
  v_group_score numeric;
  -- any_positive / any_true_or_positive
  v_fields jsonb;
  v_field_item text;
  v_found boolean;
  -- publication_matrix
  v_article jsonb;
  v_position text;
  v_fi numeric;
  v_tiers jsonb;
  v_tier jsonb;
  v_article_score numeric;
BEGIN
  v_op := p_formula->>'op';

  CASE v_op

  -- =========================================================================
  -- SUM: soma de termos com cap total
  -- =========================================================================
  WHEN 'sum' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);

    FOR v_term IN SELECT * FROM jsonb_array_elements(p_formula->'terms')
    LOOP
      v_field := v_term->>'field';
      v_term_score := 0;

      -- override_by: se campo referenciado é truthy, ignora este termo
      v_override_field := v_term->>'override_by';
      IF v_override_field IS NOT NULL THEN
        IF coalesce((p_data->>v_override_field)::boolean, false) THEN
          CONTINUE;
        END IF;
      END IF;

      -- override_by_field + override_value: se campo tem valor específico, ignora
      v_override_field := v_term->>'override_by_field';
      v_override_value := v_term->>'override_value';
      IF v_override_field IS NOT NULL AND v_override_value IS NOT NULL THEN
        IF p_data->>v_override_field = v_override_value THEN
          CONTINUE;
        END IF;
      END IF;

      -- when_value: string match (para campos select)
      IF v_term ? 'when_value' THEN
        v_str_value := p_data->>v_field;
        IF v_str_value = v_term->>'when_value' THEN
          v_term_score := (v_term->>'pts')::numeric;
        END IF;

      ELSIF v_term ? 'mult' THEN
        -- numeric field * mult
        v_value := coalesce((p_data->>v_field)::numeric, 0);
        v_term_score := v_value * (v_term->>'mult')::numeric;

      ELSIF v_term ? 'when_true' THEN
        -- boolean field → pts if true
        v_bool_value := coalesce((p_data->>v_field)::boolean, false);
        IF v_bool_value THEN
          v_term_score := (v_term->>'when_true')::numeric;
        END IF;

      ELSIF v_term ? 'when_gt0' THEN
        -- numeric field → pts if > 0
        v_value := coalesce((p_data->>v_field)::numeric, 0);
        IF v_value > 0 THEN
          v_term_score := (v_term->>'when_gt0')::numeric;
        END IF;
      END IF;

      v_result := v_result + v_term_score;
    END LOOP;

    v_result := least(v_result, v_cap);

  -- =========================================================================
  -- THRESHOLD / TIERED: faixas exclusivas (primeira match ganha)
  -- =========================================================================
  WHEN 'threshold', 'tiered' THEN
    v_field := p_formula->>'field';

    -- aggregate pre-processing
    v_aggregate := p_formula->'aggregate';
    IF v_aggregate IS NOT NULL AND v_aggregate ? 'sum_of' THEN
      v_value := 0;
      FOR v_agg_field IN SELECT jsonb_array_elements_text(v_aggregate->'sum_of')
      LOOP
        v_value := v_value + coalesce((p_data->>v_agg_field)::numeric, 0);
      END LOOP;
    ELSE
      v_value := coalesce((p_data->>v_field)::numeric, 0);
    END IF;

    v_brackets := coalesce(p_formula->'brackets', p_formula->'tiers');
    IF v_brackets IS NOT NULL THEN
      FOR v_bracket IN SELECT * FROM jsonb_array_elements(v_brackets)
      LOOP
        IF v_bracket ? 'gte' THEN
          IF v_value >= (v_bracket->>'gte')::numeric THEN
            v_result := (v_bracket->>'pts')::numeric;
            RETURN v_result;
          END IF;
        ELSIF v_bracket ? 'gt' THEN
          IF v_value > (v_bracket->>'gt')::numeric THEN
            v_result := (v_bracket->>'pts')::numeric;
            RETURN v_result;
          END IF;
        END IF;
      END LOOP;
    END IF;

  -- =========================================================================
  -- BOOL: flag booleana {field, pts_true}
  -- =========================================================================
  WHEN 'bool' THEN
    v_field := p_formula->>'field';
    v_bool_value := coalesce((p_data->>v_field)::boolean, false);
    IF v_bool_value THEN
      v_result := (p_formula->>'pts_true')::numeric;
    END IF;

  -- =========================================================================
  -- COMPOSITE: groups[] independentes com cap total externo
  -- =========================================================================
  WHEN 'composite' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);

    FOR v_group IN SELECT * FROM jsonb_array_elements(p_formula->'groups')
    LOOP
      v_group_score := public.evaluate_formula(v_group, p_data);
      v_result := v_result + v_group_score;
    END LOOP;

    v_result := least(v_result, v_cap);

  -- =========================================================================
  -- CUSTOM: despacho para sub-função PL/pgSQL nomeada
  -- =========================================================================
  WHEN 'custom' THEN
    v_field := p_formula->>'field';
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    v_value := coalesce((p_data->>v_field)::numeric, 0);

    CASE p_formula->>'fn'
      WHEN 'fmabc_monitoria' THEN
        v_result := public.fmabc_monitoria(v_value);
      ELSE
        RAISE WARNING 'Unknown custom function: %', p_formula->>'fn';
        v_result := 0;
    END CASE;

    v_result := least(v_result, v_cap);

  -- =========================================================================
  -- RUF_BRANCH: tri-state {field, pts_true, pts_false, pts_null}
  -- =========================================================================
  WHEN 'ruf_branch' THEN
    v_field := p_formula->>'field';

    IF p_data ? v_field AND p_data->>v_field IS NOT NULL THEN
      v_bool_value := (p_data->>v_field)::boolean;
      IF v_bool_value THEN
        v_result := coalesce((p_formula->>'pts_true')::numeric, 0);
      ELSE
        v_result := coalesce((p_formula->>'pts_false')::numeric, 0);
      END IF;
    ELSE
      v_result := coalesce((p_formula->>'pts_null')::numeric, 0);
    END IF;

  -- =========================================================================
  -- FLOOR_DIV: {field, divisor, mult} → floor(field/divisor) * mult
  -- =========================================================================
  WHEN 'floor_div' THEN
    v_field := p_formula->>'field';
    v_value := coalesce((p_data->>v_field)::numeric, 0);
    IF coalesce((p_formula->>'divisor')::numeric, 0) = 0 THEN
      v_result := 0;
    ELSE
      v_result := floor(v_value / (p_formula->>'divisor')::numeric) * (p_formula->>'mult')::numeric;
    END IF;

  -- =========================================================================
  -- ANY_POSITIVE: retorna pts se qualquer fields[] > 0
  -- =========================================================================
  WHEN 'any_positive' THEN
    v_fields := p_formula->'fields';
    v_found := false;

    FOR v_field_item IN SELECT jsonb_array_elements_text(v_fields)
    LOOP
      IF coalesce((p_data->>v_field_item)::numeric, 0) > 0 THEN
        v_found := true;
        EXIT;
      END IF;
    END LOOP;

    IF v_found THEN
      v_result := (p_formula->>'pts')::numeric;
    END IF;

  -- =========================================================================
  -- ANY_TRUE_OR_POSITIVE
  -- =========================================================================
  WHEN 'any_true_or_positive' THEN
    v_found := false;

    v_fields := p_formula->'fields_true';
    IF v_fields IS NOT NULL THEN
      FOR v_field_item IN SELECT jsonb_array_elements_text(v_fields)
      LOOP
        IF coalesce((p_data->>v_field_item)::boolean, false) THEN
          v_found := true;
          EXIT;
        END IF;
      END LOOP;
    END IF;

    IF NOT v_found THEN
      v_fields := p_formula->'fields_positive';
      IF v_fields IS NOT NULL THEN
        FOR v_field_item IN SELECT jsonb_array_elements_text(v_fields)
        LOOP
          IF coalesce((p_data->>v_field_item)::numeric, 0) > 0 THEN
            v_found := true;
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END IF;

    IF v_found THEN
      v_result := (p_formula->>'pts')::numeric;
    END IF;

  -- =========================================================================
  -- PUBLICATION_MATRIX: scoring por artigo com (posição × fator de impacto)
  -- =========================================================================
  WHEN 'publication_matrix' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);

    FOR v_article IN SELECT * FROM jsonb_array_elements(p_formula->'articles')
    LOOP
      v_position := p_data->>( v_article->>'position_field' );
      v_fi := coalesce((p_data->>( v_article->>'fi_field' ))::numeric, -1);

      -- Pular artigo não preenchido
      IF v_position IS NULL OR v_position = '' THEN
        CONTINUE;
      END IF;

      -- Selecionar tiers baseado na posição
      IF v_position = '1º Autor / Último autor' THEN
        v_tiers := p_formula->'first_author_tiers';
      ELSE
        v_tiers := p_formula->'coauthor_tiers';
      END IF;

      v_article_score := 0;

      IF v_tiers IS NOT NULL THEN
        -- Verificar tier "no_fi" primeiro (FI não informado / < 0)
        IF v_fi < 0 THEN
          FOR v_tier IN SELECT * FROM jsonb_array_elements(v_tiers)
          LOOP
            IF (v_tier->>'no_fi')::boolean = true THEN
              v_article_score := (v_tier->>'pts')::numeric;
              EXIT;
            END IF;
          END LOOP;
        ELSE
          -- Buscar tier por FI (primeira match ganha, ordem desc)
          FOR v_tier IN SELECT * FROM jsonb_array_elements(v_tiers)
          LOOP
            IF v_tier ? 'gte' AND v_fi >= (v_tier->>'gte')::numeric THEN
              v_article_score := (v_tier->>'pts')::numeric;
              EXIT;
            END IF;
          END LOOP;
        END IF;
      END IF;

      v_result := v_result + v_article_score;
    END LOOP;

    v_result := least(v_result, v_cap);

  ELSE
    RAISE WARNING 'Unknown formula operator: %', v_op;
    v_result := 0;
  END CASE;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- 6. Deletar regras atuais do Einstein e recriar
-- =============================================================================

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'Einstein');

-- A. Iniciação Científica — max 30 pts (threshold por horas)
INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
VALUES (
  (SELECT id FROM institutions WHERE short_name = 'Einstein'),
  'Acadêmico',
  'ic_horas_totais',
  30, 30,
  '>400h (30pts) | 301-400h (25pts) | 201-300h (20pts) | 101-200h (15pts) | 0-100h (5pts)',
  '{
    "op": "tiered",
    "field": "ic_horas_totais",
    "tiers": [
      {"gte": 401, "pts": 30},
      {"gte": 301, "pts": 25},
      {"gte": 201, "pts": 20},
      {"gte": 101, "pts": 15},
      {"gte": 0, "pts": 5}
    ]
  }'::jsonb
);

-- B. Pós-graduação — max 30 pts (select status)
INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
VALUES (
  (SELECT id FROM institutions WHERE short_name = 'Einstein'),
  'Perfil',
  'mestrado_status',
  30, 30,
  'Doutorado concluído (30pts) | Doutorado em curso (15pts) | Mestrado concluído (25pts) | Mestrado em curso (10pts)',
  '{
    "op": "sum",
    "caps": {"total": 30},
    "terms": [
      {"field": "doutorado_status", "when_value": "Concluído", "pts": 30},
      {"field": "doutorado_status", "when_value": "Em curso", "pts": 15, "override_by_field": "doutorado_status", "override_value": "Concluído"},
      {"field": "mestrado_status", "when_value": "Concluído", "pts": 25, "override_by_field": "doutorado_status", "override_value": "Concluído"},
      {"field": "mestrado_status", "when_value": "Em curso", "pts": 10, "override_by_field": "mestrado_status", "override_value": "Concluído"}
    ]
  }'::jsonb
);

-- C. Publicações — max 70 pts (publication_matrix, até 3 artigos)
INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
VALUES (
  (SELECT id FROM institutions WHERE short_name = 'Einstein'),
  'Publicações',
  'artigo_1_posicao',
  70, 70,
  'Até 3 artigos PubMed. Pontuação por posição de autoria × Fator de Impacto JCR.',
  '{
    "op": "publication_matrix",
    "articles": [
      {"position_field": "artigo_1_posicao", "fi_field": "artigo_1_fi"},
      {"position_field": "artigo_2_posicao", "fi_field": "artigo_2_fi"},
      {"position_field": "artigo_3_posicao", "fi_field": "artigo_3_fi"}
    ],
    "first_author_tiers": [
      {"gte": 3.0, "pts": 35},
      {"gte": 2.99, "pts": 28},
      {"gte": 2.5, "pts": 25},
      {"gte": 2.0, "pts": 20},
      {"gte": 1.99, "pts": 18},
      {"gte": 1.5, "pts": 14},
      {"gte": 0.91, "pts": 10},
      {"gte": 0.5, "pts": 8},
      {"gte": 0, "pts": 5},
      {"no_fi": true, "pts": 2}
    ],
    "coauthor_tiers": [
      {"gte": 3.0, "pts": 17.5},
      {"gte": 2.99, "pts": 14},
      {"gte": 2.5, "pts": 12.5},
      {"gte": 2.0, "pts": 10},
      {"gte": 1.99, "pts": 9},
      {"gte": 1.5, "pts": 7},
      {"gte": 0.91, "pts": 5},
      {"gte": 0.5, "pts": 4},
      {"gte": 0, "pts": 2.5},
      {"no_fi": true, "pts": 1}
    ],
    "caps": {"total": 70}
  }'::jsonb
);

-- =============================================================================
-- 7. Marcar scores stale para forçar recálculo
-- =============================================================================

UPDATE user_scores SET stale = true;
