-- 0028_fix_jsonb_operator.sql
-- Fix: "operator does not exist: jsonb ->> jsonb"
-- p_data->>p_formula->>'field' → p_data->>(p_formula->>'field')

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
  v_articles jsonb;
  v_article jsonb;
  v_position text;
  v_fi numeric;
  v_tiers jsonb;
  v_tier jsonb;
  v_article_score numeric;
  v_article_count int;
  v_max_articles int;
  v_filter jsonb;
  v_filter_key text;
  v_filter_value text;
  v_match boolean;
  v_count int;
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
        IF coalesce((p_data->>v_override_field)::boolean, false) THEN CONTINUE; END IF;
      END IF;
      v_override_field := v_term->>'override_by_field';
      v_override_value := v_term->>'override_value';
      IF v_override_field IS NOT NULL AND v_override_value IS NOT NULL THEN
        IF p_data->>v_override_field = v_override_value THEN CONTINUE; END IF;
      END IF;
      IF v_term ? 'when_value' THEN
        IF p_data->>v_field = v_term->>'when_value' THEN
          v_term_score := (v_term->>'pts')::numeric;
        END IF;
      ELSIF v_term ? 'mult' THEN
        v_value := public.safe_numeric(p_data->>v_field);
        v_term_score := v_value * (v_term->>'mult')::numeric;
      ELSIF v_term ? 'when_true' THEN
        IF coalesce((p_data->>v_field)::boolean, false) THEN
          v_term_score := (v_term->>'when_true')::numeric;
        END IF;
      ELSIF v_term ? 'when_gt0' THEN
        v_value := public.safe_numeric(p_data->>v_field);
        IF v_value > 0 THEN v_term_score := (v_term->>'when_gt0')::numeric; END IF;
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
      LOOP v_value := v_value + public.safe_numeric(p_data->>v_agg_field); END LOOP;
    ELSE
      v_value := public.safe_numeric(p_data->>v_field);
    END IF;
    v_brackets := coalesce(p_formula->'brackets', p_formula->'tiers');
    IF v_brackets IS NOT NULL THEN
      FOR v_bracket IN SELECT * FROM jsonb_array_elements(v_brackets)
      LOOP
        IF v_bracket ? 'gte' AND v_value >= (v_bracket->>'gte')::numeric THEN
          RETURN (v_bracket->>'pts')::numeric;
        ELSIF v_bracket ? 'gt' AND v_value > (v_bracket->>'gt')::numeric THEN
          RETURN (v_bracket->>'pts')::numeric;
        END IF;
      END LOOP;
    END IF;

  WHEN 'bool' THEN
    v_field := p_formula->>'field';
    IF coalesce((p_data->>v_field)::boolean, false) THEN
      v_result := (p_formula->>'pts_true')::numeric;
    END IF;

  WHEN 'composite' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    FOR v_group IN SELECT * FROM jsonb_array_elements(p_formula->'groups')
    LOOP v_result := v_result + public.evaluate_formula(v_group, p_data); END LOOP;
    v_result := least(v_result, v_cap);

  WHEN 'custom' THEN
    v_field := p_formula->>'field';
    v_value := public.safe_numeric(p_data->>v_field);
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    CASE p_formula->>'fn'
      WHEN 'fmabc_monitoria' THEN v_result := public.fmabc_monitoria(v_value);
      ELSE v_result := 0;
    END CASE;
    v_result := least(v_result, v_cap);

  WHEN 'ruf_branch' THEN
    v_field := p_formula->>'field';
    v_str_value := p_data->>v_field;
    IF v_str_value = 'true' THEN v_result := coalesce((p_formula->>'pts_true')::numeric, 0);
    ELSIF v_str_value = 'false' THEN v_result := coalesce((p_formula->>'pts_false')::numeric, 0);
    ELSE v_result := coalesce((p_formula->>'pts_null')::numeric, 0);
    END IF;

  WHEN 'floor_div' THEN
    v_field := p_formula->>'field';
    v_value := public.safe_numeric(p_data->>v_field);
    IF coalesce((p_formula->>'divisor')::numeric, 0) = 0 THEN v_result := 0;
    ELSE v_result := floor(v_value / (p_formula->>'divisor')::numeric) * (p_formula->>'mult')::numeric;
    END IF;

  WHEN 'any_positive' THEN
    v_found := false;
    FOR v_field_item IN SELECT jsonb_array_elements_text(p_formula->'fields')
    LOOP IF public.safe_numeric(p_data->>v_field_item) > 0 THEN v_found := true; EXIT; END IF; END LOOP;
    IF v_found THEN v_result := (p_formula->>'pts')::numeric; END IF;

  WHEN 'any_true_or_positive' THEN
    v_found := false;
    v_fields := p_formula->'fields_true';
    IF v_fields IS NOT NULL THEN
      FOR v_field_item IN SELECT jsonb_array_elements_text(v_fields)
      LOOP IF coalesce((p_data->>v_field_item)::boolean, false) THEN v_found := true; EXIT; END IF; END LOOP;
    END IF;
    IF NOT v_found THEN
      v_fields := p_formula->'fields_positive';
      IF v_fields IS NOT NULL THEN
        FOR v_field_item IN SELECT jsonb_array_elements_text(v_fields)
        LOOP IF public.safe_numeric(p_data->>v_field_item) > 0 THEN v_found := true; EXIT; END IF; END LOOP;
      END IF;
    END IF;
    IF v_found THEN v_result := (p_formula->>'pts')::numeric; END IF;

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
        IF v_article_count > v_max_articles THEN EXIT; END IF;
        v_position := v_article->>'posicao';
        v_fi := coalesce(public.safe_numeric(v_article->>'fi'), -1);
        IF v_position IS NULL OR v_position = '' THEN CONTINUE; END IF;
        IF v_position = '1º Autor / Último autor' THEN v_tiers := p_formula->'first_author_tiers';
        ELSE v_tiers := p_formula->'coauthor_tiers'; END IF;
        v_article_score := 0;
        IF v_tiers IS NOT NULL THEN
          IF v_fi < 0 THEN
            FOR v_tier IN SELECT * FROM jsonb_array_elements(v_tiers)
            LOOP IF (v_tier->>'no_fi')::boolean = true THEN v_article_score := (v_tier->>'pts')::numeric; EXIT; END IF; END LOOP;
          ELSE
            FOR v_tier IN SELECT * FROM jsonb_array_elements(v_tiers)
            LOOP IF v_tier ? 'gte' AND v_fi >= (v_tier->>'gte')::numeric THEN v_article_score := (v_tier->>'pts')::numeric; EXIT; END IF; END LOOP;
          END IF;
        END IF;
        v_result := v_result + v_article_score;
      END LOOP;
    END IF;
    v_result := least(v_result, v_cap);

  WHEN 'count_articles' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    v_field := p_formula->>'field';
    v_articles := p_data->v_field;
    v_filter := p_formula->'filter';
    v_count := 0;
    IF v_articles IS NOT NULL AND jsonb_typeof(v_articles) = 'array' THEN
      FOR v_article IN SELECT * FROM jsonb_array_elements(v_articles)
      LOOP
        v_match := true;
        IF v_filter IS NOT NULL THEN
          FOR v_filter_key, v_filter_value IN SELECT * FROM jsonb_each_text(v_filter)
          LOOP
            IF v_article->>v_filter_key IS DISTINCT FROM v_filter_value THEN
              v_match := false; EXIT;
            END IF;
          END LOOP;
        END IF;
        IF v_match THEN v_count := v_count + 1; END IF;
      END LOOP;
    END IF;
    v_result := v_count * coalesce((p_formula->>'mult')::numeric, 1);
    v_result := least(v_result, v_cap);

  ELSE
    RAISE WARNING 'Unknown formula operator: %', v_op;
    v_result := 0;
  END CASE;

  RETURN v_result;
END;
$$;
