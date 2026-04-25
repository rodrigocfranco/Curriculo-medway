-- 0047_media_geral_label_escala_0_10.sql
-- Label antigo aceitava ambas as escalas; a partir da 0046 a escala é única (0-10).

update public.curriculum_fields
set label = 'Média geral no histórico (escala 0 a 10)'
where field_key = 'media_geral';
