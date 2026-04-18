-- 0018_label_proficiencia_lingua.sql
-- Ajuste de label: inglês → proficiência em língua estrangeira (Santa Casa aceita qualquer língua)

UPDATE curriculum_fields
SET label = 'Proficiência em língua estrangeira (certificação oficial)'
WHERE field_key = 'ingles_fluente';
