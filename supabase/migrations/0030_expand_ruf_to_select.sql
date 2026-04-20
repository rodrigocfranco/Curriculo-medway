-- 0030_expand_ruf_to_select.sql
-- Expandir ranking_ruf_top35: boolean → select com 3 faixas
-- Necessário para SCMSP (edital: 1-35=20, 36-45=15, demais=5)
-- Impacto: Santa Casa SP e USP-SP (únicas com regra neste campo)

-- =============================================================================
-- 1. Alterar curriculum_fields: boolean → select
-- =============================================================================

UPDATE curriculum_fields
SET field_type = 'select',
    label = 'Faixa RUF da faculdade',
    options = '["1ª-35ª posição", "36ª-45ª posição", "Demais faculdades"]'::jsonb
WHERE field_key = 'ranking_ruf_top35';

-- =============================================================================
-- 2. Migrar dados JSONB: true → "1ª-35ª posição", false → "Demais faculdades"
-- =============================================================================

UPDATE user_curriculum
SET data = data || jsonb_build_object(
  'ranking_ruf_top35',
  CASE
    WHEN (data->>'ranking_ruf_top35')::boolean = true THEN '1ª-35ª posição'
    ELSE 'Demais faculdades'
  END
)
WHERE data ? 'ranking_ruf_top35'
  AND jsonb_typeof(data->'ranking_ruf_top35') = 'boolean';

-- =============================================================================
-- 3. Atualizar fórmula Santa Casa SP (ruf_branch → sum com when_value, 3 faixas)
-- =============================================================================

UPDATE scoring_rules
SET description = '1ª-35ª posição RUF (20pts) | 36ª-45ª posição (15pts) | Demais faculdades (5pts)',
    formula = '{
      "op": "sum",
      "caps": {"total": 20},
      "terms": [
        {"field": "ranking_ruf_top35", "when_value": "1ª-35ª posição", "pts": 20},
        {"field": "ranking_ruf_top35", "when_value": "36ª-45ª posição", "pts": 15},
        {"field": "ranking_ruf_top35", "when_value": "Demais faculdades", "pts": 5}
      ]
    }'::jsonb
WHERE field_key = 'ranking_ruf_top35'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

-- =============================================================================
-- 4. Atualizar fórmula USP-SP (bool → sum com when_value)
-- Edital USP-SP: top35 = 5pts, demais = 0pts (mantém mesma lógica)
-- =============================================================================

UPDATE scoring_rules
SET formula = '{
      "op": "sum",
      "caps": {"total": 5},
      "terms": [
        {"field": "ranking_ruf_top35", "when_value": "1ª-35ª posição", "pts": 5}
      ]
    }'::jsonb
WHERE field_key = 'ranking_ruf_top35'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'USP-SP');

-- =============================================================================
-- 5. Marcar scores stale para recálculo
-- =============================================================================

UPDATE user_scores SET stale = true
WHERE institution_id IN (
  SELECT id FROM institutions WHERE short_name IN ('Santa Casa SP', 'USP-SP')
);
