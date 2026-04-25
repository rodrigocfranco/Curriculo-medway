-- 0046_normalize_media_geral_scale.sql
-- Unifica a escala de `media_geral` em 0-10 no payload `user_curriculum.data`.
-- Valores > 10 são tratados como entrada na escala 0-100 (legado/erro de digitação)
-- e divididos por 10 (com cap em 10). Marca user_scores como stale para recálculo.

update public.user_curriculum
set data = jsonb_set(
      data,
      '{media_geral}',
      to_jsonb(least(10, round(((data->>'media_geral')::numeric / 10)::numeric, 1)))
    ),
    updated_at = now()
where (data->>'media_geral')::numeric > 10;

update public.user_scores set stale = true
where exists (
  select 1 from public.user_curriculum uc
  where uc.user_id = user_scores.user_id
);
