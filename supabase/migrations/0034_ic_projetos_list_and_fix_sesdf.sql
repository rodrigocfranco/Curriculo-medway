-- 0034_ic_projetos_list_and_fix_sesdf.sql
-- 1. Novo campo: ic_projetos (lista dinâmica: tipo + semestres)
-- 2. Novos operadores: sum_array, sum_array_tiered
-- 3. Migrar ic_com_bolsa/ic_sem_bolsa → array ic_projetos
-- 4. Atualizar fórmulas de TODAS as instituições (exceto Einstein que usa ic_horas_totais)
-- 5. Reescrever regras SES-DF conforme edital (10 regras, 10 pts)

-- =============================================================================
-- 1. Novo campo: ic_projetos
-- =============================================================================

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES (
  'ic_projetos',
  'Projetos de Iniciação Científica',
  'Pesquisa e Publicações',
  'event_list',
  '{
    "tipo": ["Com bolsa", "Sem bolsa"],
    "semestres": "number"
  }'::jsonb,
  12
)
ON CONFLICT (field_key) DO UPDATE
SET label = EXCLUDED.label, options = EXCLUDED.options;

-- =============================================================================
-- 2. Novos operadores: sum_array e sum_array_tiered
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
  -- sum_array
  v_sum_key text;
  v_sum_total numeric;
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
    IF coalesce((p_data->>(p_formula->>'field'))::boolean, false) THEN
      v_result := (p_formula->>'pts_true')::numeric;
    END IF;

  WHEN 'composite' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    FOR v_group IN SELECT * FROM jsonb_array_elements(p_formula->'groups')
    LOOP v_result := v_result + public.evaluate_formula(v_group, p_data); END LOOP;
    v_result := least(v_result, v_cap);

  WHEN 'custom' THEN
    v_value := public.safe_numeric(p_data->>(p_formula->>'field'));
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    CASE p_formula->>'fn'
      WHEN 'fmabc_monitoria' THEN v_result := public.fmabc_monitoria(v_value);
      ELSE v_result := 0;
    END CASE;
    v_result := least(v_result, v_cap);

  WHEN 'ruf_branch' THEN
    v_str_value := p_data->>(p_formula->>'field');
    IF v_str_value = 'true' THEN v_result := coalesce((p_formula->>'pts_true')::numeric, 0);
    ELSIF v_str_value = 'false' THEN v_result := coalesce((p_formula->>'pts_false')::numeric, 0);
    ELSE v_result := coalesce((p_formula->>'pts_null')::numeric, 0);
    END IF;

  WHEN 'floor_div' THEN
    v_value := public.safe_numeric(p_data->>(p_formula->>'field'));
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
    v_articles := p_data->(p_formula->>'field');
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

  WHEN 'count_tiered' THEN
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
    v_brackets := coalesce(p_formula->'tiers', p_formula->'brackets');
    IF v_brackets IS NOT NULL THEN
      FOR v_bracket IN SELECT * FROM jsonb_array_elements(v_brackets)
      LOOP
        IF v_bracket ? 'gte' AND v_count >= (v_bracket->>'gte')::int THEN
          v_result := (v_bracket->>'pts')::numeric;
          v_result := least(v_result, v_cap);
          RETURN v_result;
        END IF;
      END LOOP;
    END IF;

  -- =========================================================================
  -- SUM_ARRAY: soma um campo numérico de itens do array (com filtro opcional)
  -- {"op":"sum_array","field":"ic_projetos","sum_key":"semestres",
  --  "filter":{"tipo":"Com bolsa"},"mult":0.5,"caps":{"total":1.0}}
  -- =========================================================================
  WHEN 'sum_array' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    v_field := p_formula->>'field';
    v_sum_key := p_formula->>'sum_key';
    v_articles := p_data->v_field;
    v_filter := p_formula->'filter';
    v_sum_total := 0;

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
        IF v_match THEN
          v_sum_total := v_sum_total + coalesce(public.safe_numeric(v_article->>v_sum_key), 0);
        END IF;
      END LOOP;
    END IF;

    v_result := v_sum_total * coalesce((p_formula->>'mult')::numeric, 1);
    v_result := least(v_result, v_cap);

  -- =========================================================================
  -- SUM_ARRAY_TIERED: soma um campo numérico do array, aplica faixas
  -- {"op":"sum_array_tiered","field":"ic_projetos","sum_key":"semestres",
  --  "filter":{"tipo":"Com bolsa"},"tiers":[{"gte":3,"pts":20}]}
  -- =========================================================================
  WHEN 'sum_array_tiered' THEN
    v_cap := coalesce((p_formula->'caps'->>'total')::numeric, 999999);
    v_field := p_formula->>'field';
    v_sum_key := p_formula->>'sum_key';
    v_articles := p_data->v_field;
    v_filter := p_formula->'filter';
    v_sum_total := 0;

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
        IF v_match THEN
          v_sum_total := v_sum_total + coalesce(public.safe_numeric(v_article->>v_sum_key), 0);
        END IF;
      END LOOP;
    END IF;

    v_brackets := coalesce(p_formula->'tiers', p_formula->'brackets');
    IF v_brackets IS NOT NULL THEN
      FOR v_bracket IN SELECT * FROM jsonb_array_elements(v_brackets)
      LOOP
        IF v_bracket ? 'gte' AND v_sum_total >= (v_bracket->>'gte')::numeric THEN
          v_result := (v_bracket->>'pts')::numeric;
          v_result := least(v_result, v_cap);
          RETURN v_result;
        END IF;
      END LOOP;
    END IF;

  ELSE
    RAISE WARNING 'Unknown formula operator: %', v_op;
    v_result := 0;
  END CASE;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- 3. Migrar dados: ic_com_bolsa/ic_sem_bolsa → array ic_projetos
-- Cada unidade vira 1 projeto com 2 semestres (aproximação: 1 ano = 2 sem)
-- =============================================================================

UPDATE user_curriculum
SET data = data || jsonb_build_object('ic_projetos', (
  SELECT coalesce(jsonb_agg(projeto), '[]'::jsonb)
  FROM (
    -- Projetos com bolsa
    SELECT jsonb_build_object('tipo', 'Com bolsa', 'semestres', 2) AS projeto
    FROM generate_series(1, greatest(0, coalesce((data->>'ic_com_bolsa')::int, 0)))
    UNION ALL
    -- Projetos sem bolsa
    SELECT jsonb_build_object('tipo', 'Sem bolsa', 'semestres', 2)
    FROM generate_series(1, greatest(0, coalesce((data->>'ic_sem_bolsa')::int, 0)))
  ) sub
))
WHERE (coalesce((data->>'ic_com_bolsa')::int, 0) > 0
    OR coalesce((data->>'ic_sem_bolsa')::int, 0) > 0)
  AND (NOT data ? 'ic_projetos' OR jsonb_array_length(data->'ic_projetos') = 0);

-- Remover campos antigos do JSONB
UPDATE user_curriculum
SET data = data - 'ic_com_bolsa' - 'ic_sem_bolsa'
WHERE data ? 'ic_com_bolsa' OR data ? 'ic_sem_bolsa';

-- Remover campos antigos do curriculum_fields
DELETE FROM curriculum_fields WHERE field_key IN ('ic_com_bolsa', 'ic_sem_bolsa');

-- =============================================================================
-- 4. Atualizar fórmulas IC de TODAS as instituições (exceto Einstein)
-- =============================================================================

-- UNICAMP: tiered por semestres com/sem bolsa, max 20
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "composite", "caps": {"total": 20}, "groups": [
      {"op": "sum_array_tiered", "field": "ic_projetos", "sum_key": "semestres", "filter": {"tipo": "Com bolsa"}, "tiers": [{"gte": 3, "pts": 20}, {"gte": 1, "pts": 15}]},
      {"op": "sum_array_tiered", "field": "ic_projetos", "sum_key": "semestres", "filter": {"tipo": "Sem bolsa"}, "tiers": [{"gte": 3, "pts": 10}, {"gte": 1, "pts": 5}]}
    ]}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UNICAMP');

-- SES-PE: 5 pts por projeto, max 15
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "count_articles", "field": "ic_projetos", "mult": 5, "caps": {"total": 15}}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-PE');

-- Santa Casa SP: tem algum projeto = 10 pts
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "count_articles", "field": "ic_projetos", "mult": 10, "caps": {"total": 10}}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

-- Santa Casa BH: tem algum projeto = 0.25 pts
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "count_articles", "field": "ic_projetos", "mult": 0.25, "caps": {"total": 0.25}}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa BH');

-- USP-SP: 6 pts por projeto, max 12
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "count_articles", "field": "ic_projetos", "mult": 6, "caps": {"total": 12}}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-SP');

-- USP-RP: 0.7 pts por projeto, max 3
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "count_articles", "field": "ic_projetos", "mult": 0.7, "caps": {"total": 3}}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-RP');

-- FMABC: 7 pts por projeto, max 21
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "count_articles", "field": "ic_projetos", "mult": 7, "caps": {"total": 21}}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'FMABC');

-- UFPA: 7 pts por projeto, max 21
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "count_articles", "field": "ic_projetos", "mult": 7, "caps": {"total": 21}}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'UFPA');

-- PSU-MG: com bolsa → 0.5, sem bolsa → 0.3, max 1.3
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "composite", "caps": {"total": 1.3}, "groups": [
      {"op": "count_tiered", "field": "ic_projetos", "filter": {"tipo": "Com bolsa"}, "tiers": [{"gte": 1, "pts": 0.5}]},
      {"op": "count_tiered", "field": "ic_projetos", "filter": {"tipo": "Sem bolsa"}, "tiers": [{"gte": 1, "pts": 0.3}]}
    ]}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-MG');

-- PSU-GO: 0.5 pts por projeto, max 1.5
UPDATE scoring_rules
SET field_key = 'ic_projetos',
    formula = '{"op": "count_articles", "field": "ic_projetos", "mult": 0.5, "caps": {"total": 1.5}}'::jsonb
WHERE field_key = 'ic_com_bolsa'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-GO');

-- SES-DF: será reescrito abaixo (DELETE + INSERT)

-- =============================================================================
-- 5. Reescrever regras SES-DF conforme edital (10 regras, total 10 pts)
-- =============================================================================

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'SES-DF');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- A: Monitoria — 0.5/semestre, máx 1.0
  ('Atividades Acadêmicas', 'monitoria_semestres', 0.5, 1,
   'Monitoria em disciplinas regulares (0,5pt por semestre, máx 1pt)',
   '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "monitoria_semestres", "mult": 0.5}]}'),

  -- B+C+D: Extensão extracurricular (grupo) — máx 1.0
  -- B: cursos ≥20h (0.1 cada) + C: extensão (0.5/sem) + D: estágio (0.1/40h)
  ('Representação Estudantil e Voluntariado', 'estagio_extracurricular_horas', 1, 1,
   'Extensão: cursos ≥20h (0,1) | Projeto extensão (0,5/sem) | Estágio (0,1/40h) — máx 1pt',
   '{"op": "composite", "caps": {"total": 1.0}, "groups": [
     {"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "cursos_temas_medicos", "mult": 0.1}]},
     {"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "extensao_semestres", "mult": 0.5}]},
     {"op": "floor_div", "field": "estagio_extracurricular_horas", "divisor": 40, "mult": 0.1}
   ]}'),

  -- E: Participação em congressos (ouvinte) — 0.1/evento, máx 1.0
  ('Congressos e Formação Complementar', 'ouvinte_congresso', 0.1, 1,
   'Participação em congressos, simpósios, jornadas (0,1pt por evento, máx 1pt)',
   '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "ouvinte_congresso", "mult": 0.1}]}'),

  -- F: Comunicação em congressos — 0.2/trabalho, máx 1.0
  ('Congressos e Formação Complementar', 'apresentacoes', 0.2, 1,
   'Comunicação em congressos — oral ou poster (0,2pt por trabalho, máx 1pt)',
   '{"op": "count_articles", "field": "apresentacoes", "mult": 0.2, "caps": {"total": 1.0}}'),

  -- G+H: Artigos (grupo) — máx 1.0
  -- G: indexado (DOI, ISSN, base internacional) = 0.5/artigo
  -- H: não indexado = 0.2/artigo
  ('Pesquisa e Publicações', 'publicacoes', 0.5, 1,
   'Artigo indexado (0,5pt) | Artigo não indexado (0,2pt) — máx 1pt',
   '{"op": "composite", "caps": {"total": 1.0}, "groups": [
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "PubMed"}, "mult": 0.5, "caps": {"total": 1.0}},
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "SCIELO/SCOPUS"}, "mult": 0.5, "caps": {"total": 1.0}},
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "Periódico nacional"}, "mult": 0.2, "caps": {"total": 1.0}},
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "Anais congresso internacional"}, "mult": 0.2, "caps": {"total": 1.0}},
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "Anais congresso nacional"}, "mult": 0.2, "caps": {"total": 1.0}},
     {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "Outro"}, "mult": 0.2, "caps": {"total": 1.0}}
   ]}'),

  -- I: IC/PET — 0.5/semestre, máx 1.0
  ('Pesquisa e Publicações', 'ic_projetos', 0.5, 1,
   'IC, PET ou Ciências sem Fronteiras (0,5pt por semestre, máx 1pt)',
   '{"op": "sum_array", "field": "ic_projetos", "sum_key": "semestres", "mult": 0.5, "caps": {"total": 1.0}}'),

  -- J: Premiação — 0.25/premiação, máx 0.5
  ('Atividades Acadêmicas', 'premios_academicos', 0.25, 0.5,
   'Premiação na área médica (0,25pt por premiação, máx 0,5pt)',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [{"field": "premios_academicos", "mult": 0.25}]}'),

  -- K: Projeto Rondon — 1.0, máx 1.0
  ('Representação Estudantil e Voluntariado', 'projeto_rondon', 1, 1,
   'Participação no Projeto Rondon (1pt)',
   '{"op": "bool", "field": "projeto_rondon", "pts_true": 1.0}'),

  -- L: Experiência SUS — 0.5/5 meses, máx 2.0
  ('Representação Estudantil e Voluntariado', 'trabalho_sus_meses', 0.5, 2,
   'Experiência profissional no SUS (0,5pt por cada 5 meses, máx 2pts)',
   '{"op": "floor_div", "field": "trabalho_sus_meses", "divisor": 5, "mult": 0.5}'),

  -- M: Histórico conceito A / nota ≥ 8 — 0.5, máx 0.5
  ('Formação', 'media_geral', 0.5, 0.5,
   'Histórico com conceito A, nota ≥ 8 ou aproveitamento ≥ 80% (0,5pt)',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 8, "pts": 0.5}]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'SES-DF';

-- =============================================================================
-- 6. Marcar todos os scores stale
-- =============================================================================

UPDATE user_scores SET stale = true;
