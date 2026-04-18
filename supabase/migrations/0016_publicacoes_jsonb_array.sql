-- 0016_publicacoes_jsonb_array.sql
-- Publicações: 6 campos flat → 1 campo JSONB array
-- Formato: [{ "posicao": "1º Autor / Último autor", "fi": 2.5 }, ...]

-- =============================================================================
-- 0. Adicionar 'article_list' ao check constraint de field_type
-- =============================================================================

ALTER TABLE curriculum_fields DROP CONSTRAINT curriculum_fields_field_type_check;
ALTER TABLE curriculum_fields ADD CONSTRAINT curriculum_fields_field_type_check
  CHECK (field_type = ANY (ARRAY['number', 'boolean', 'select', 'text', 'article_list']));

ALTER TABLE curriculum_fields DROP CONSTRAINT curriculum_fields_options_consistency;
ALTER TABLE curriculum_fields ADD CONSTRAINT curriculum_fields_options_consistency
  CHECK (
    ((field_type IN ('select', 'article_list')) AND (options IS NOT NULL))
    OR ((field_type NOT IN ('select', 'article_list')) AND (options IS NULL))
  );

-- =============================================================================
-- 1. Substituir 6 campos por 1 campo "publicacoes" (article_list)
-- =============================================================================

DELETE FROM curriculum_fields WHERE field_key IN (
  'artigo_1_posicao', 'artigo_1_fi',
  'artigo_2_posicao', 'artigo_2_fi',
  'artigo_3_posicao', 'artigo_3_fi'
);

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES (
  'publicacoes',
  'Publicações em periódicos indexados',
  'Publicações',
  'article_list',
  '["1º Autor / Último autor", "Coautor"]'::jsonb,
  1
)
ON CONFLICT (field_key) DO UPDATE SET
  label = EXCLUDED.label,
  field_type = EXCLUDED.field_type,
  options = EXCLUDED.options;

-- =============================================================================
-- 2. Migrar dados de artigos flat → array (se existirem)
-- =============================================================================

UPDATE user_curriculum
SET data = (
  data
  - 'artigo_1_posicao' - 'artigo_1_fi'
  - 'artigo_2_posicao' - 'artigo_2_fi'
  - 'artigo_3_posicao' - 'artigo_3_fi'
) || jsonb_build_object('publicacoes', (
  SELECT coalesce(jsonb_agg(article), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'posicao', data->>pos_key,
      'fi', coalesce((data->>fi_key)::numeric, 0)
    ) AS article
    FROM (VALUES
      ('artigo_1_posicao', 'artigo_1_fi'),
      ('artigo_2_posicao', 'artigo_2_fi'),
      ('artigo_3_posicao', 'artigo_3_fi')
    ) AS pairs(pos_key, fi_key)
    WHERE data->>pos_key IS NOT NULL AND data->>pos_key != ''
  ) sub
))
WHERE data ? 'artigo_1_posicao' OR data ? 'artigo_2_posicao' OR data ? 'artigo_3_posicao';

-- =============================================================================
-- 3. Atualizar regra Einstein publicações: field array → field único
-- =============================================================================

UPDATE scoring_rules
SET field_key = 'publicacoes',
    formula = '{
      "op": "publication_matrix",
      "field": "publicacoes",
      "max_articles": 3,
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
WHERE field_key = 'artigo_1_posicao'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Einstein');

-- =============================================================================
-- 4. Atualizar evaluate_formula: publication_matrix lê de array
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
  v_term jsonb;
  v_term_score numeric;
  v_override_field text;
  v_override_value text;
  v_str_value text;
  v_brackets jsonb;
  v_bracket jsonb;
  v_aggregate jsonb;
  v_agg_fields jsonb;
  v_agg_field text;
  v_group jsonb;
  v_group_score numeric;
  v_fields jsonb;
  v_field_item text;
  v_found boolean;
  -- publication_matrix
  v_articles jsonb;
  v_article jsonb;
  v_position text;
  v_fi numeric;
  v_tiers jsonb;
  v_tier jsonb;
  v_article_score numeric;
  v_article_count int;
  v_max_articles int;
BEGIN
  v_op := p_formula->>'op';

  CASE v_op

  WHEN 'sum' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    FOR v_term IN SELECT * FROM jsonb_array_elements(p_formula->'terms')
    LOOP
      v_field := v_term->>'field';
      v_term_score := 0;
      v_override_field := v_term->>'override_by';
      IF v_override_field IS NOT NULL THEN
        IF coalesce((p_data->>v_override_field)::boolean, false) THEN
          CONTINUE;
        END IF;
      END IF;
      v_override_field := v_term->>'override_by_field';
      v_override_value := v_term->>'override_value';
      IF v_override_field IS NOT NULL AND v_override_value IS NOT NULL THEN
        IF p_data->>v_override_field = v_override_value THEN
          CONTINUE;
        END IF;
      END IF;
      IF v_term ? 'when_value' THEN
        v_str_value := p_data->>v_field;
        IF v_str_value = v_term->>'when_value' THEN
          v_term_score := (v_term->>'pts')::numeric;
        END IF;
      ELSIF v_term ? 'mult' THEN
        v_value := coalesce((p_data->>v_field)::numeric, 0);
        v_term_score := v_value * (v_term->>'mult')::numeric;
      ELSIF v_term ? 'when_true' THEN
        v_bool_value := coalesce((p_data->>v_field)::boolean, false);
        IF v_bool_value THEN
          v_term_score := (v_term->>'when_true')::numeric;
        END IF;
      ELSIF v_term ? 'when_gt0' THEN
        v_value := coalesce((p_data->>v_field)::numeric, 0);
        IF v_value > 0 THEN
          v_term_score := (v_term->>'when_gt0')::numeric;
        END IF;
      END IF;
      v_result := v_result + v_term_score;
    END LOOP;
    v_result := least(v_result, v_cap);

  WHEN 'threshold', 'tiered' THEN
    v_field := p_formula->>'field';
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

  WHEN 'bool' THEN
    v_field := p_formula->>'field';
    v_bool_value := coalesce((p_data->>v_field)::boolean, false);
    IF v_bool_value THEN
      v_result := (p_formula->>'pts_true')::numeric;
    END IF;

  WHEN 'composite' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    FOR v_group IN SELECT * FROM jsonb_array_elements(p_formula->'groups')
    LOOP
      v_group_score := public.evaluate_formula(v_group, p_data);
      v_result := v_result + v_group_score;
    END LOOP;
    v_result := least(v_result, v_cap);

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

  WHEN 'floor_div' THEN
    v_field := p_formula->>'field';
    v_value := coalesce((p_data->>v_field)::numeric, 0);
    IF coalesce((p_formula->>'divisor')::numeric, 0) = 0 THEN
      v_result := 0;
    ELSE
      v_result := floor(v_value / (p_formula->>'divisor')::numeric) * (p_formula->>'mult')::numeric;
    END IF;

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
  -- PUBLICATION_MATRIX: lê array JSONB de artigos do campo "field"
  -- Formato: [{"posicao": "...", "fi": 2.5}, ...]
  -- =========================================================================
  WHEN 'publication_matrix' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    v_max_articles := coalesce((p_formula->>'max_articles')::int, 999);
    v_field := p_formula->>'field';
    v_articles := p_data->v_field;

    IF v_articles IS NOT NULL AND jsonb_typeof(v_articles) = 'array' THEN
      v_article_count := 0;

      FOR v_article IN SELECT * FROM jsonb_array_elements(v_articles)
      LOOP
        v_article_count := v_article_count + 1;
        IF v_article_count > v_max_articles THEN
          EXIT;
        END IF;

        v_position := v_article->>'posicao';
        v_fi := coalesce((v_article->>'fi')::numeric, -1);

        IF v_position IS NULL OR v_position = '' THEN
          CONTINUE;
        END IF;

        IF v_position = '1º Autor / Último autor' THEN
          v_tiers := p_formula->'first_author_tiers';
        ELSE
          v_tiers := p_formula->'coauthor_tiers';
        END IF;

        v_article_score := 0;

        IF v_tiers IS NOT NULL THEN
          IF v_fi < 0 THEN
            FOR v_tier IN SELECT * FROM jsonb_array_elements(v_tiers)
            LOOP
              IF (v_tier->>'no_fi')::boolean = true THEN
                v_article_score := (v_tier->>'pts')::numeric;
                EXIT;
              END IF;
            END LOOP;
          ELSE
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
    END IF;

    v_result := least(v_result, v_cap);

  ELSE
    RAISE WARNING 'Unknown formula operator: %', v_op;
    v_result := 0;
  END CASE;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- 5. Marcar scores stale
-- =============================================================================
UPDATE user_scores SET stale = true;
