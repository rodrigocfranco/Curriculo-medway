-- 0019_representacao_estudantil.sql
-- Novos campos para cobrir UNICAMP itens 10 e 11

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES
  ('colegiado_institucional_semestres', 'Semestres em colegiados institucionais (conselhos, congregação, diretórios)', 'Liderança/Eventos', 'number', null, 20),
  ('centro_academico_semestres', 'Semestres em centro acadêmico / diretório acadêmico', 'Liderança/Eventos', 'number', null, 21),
  ('atletica_semestres', 'Semestres em atlética', 'Liderança/Eventos', 'number', null, 22),
  ('equipe_esportiva_semestres', 'Semestres em equipe esportiva universitária', 'Liderança/Eventos', 'number', null, 23)
ON CONFLICT (field_key) DO NOTHING;
