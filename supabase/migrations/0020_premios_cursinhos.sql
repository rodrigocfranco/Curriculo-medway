-- 0020_premios_cursinhos.sql
-- Campos faltantes para cobertura 100% dos editais (USP-RP)

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES
  ('premios_academicos', 'Prêmios acadêmicos recebidos', 'Acadêmico', 'number', null, 25),
  ('cursinhos_preparatorios', 'Participações como professor em cursinhos preparatórios para residência', 'Acadêmico', 'number', null, 26)
ON CONFLICT (field_key) DO NOTHING;
