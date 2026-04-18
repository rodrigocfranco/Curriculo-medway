-- 0022_proficiencia_nivel_scbh_fmabc.sql
-- 1. ingles_fluente: boolean → select com nível (Santa Casa BH diferencia avançado/intermediário)
-- 2. Regras: Santa Casa BH, FMABC (edital real)
-- 3. SES-PE: já criada na migration 0021, pular

-- =============================================================================
-- 1. ingles_fluente: boolean → select
-- =============================================================================

UPDATE curriculum_fields
SET field_type = 'select',
    options = '["Não tenho", "Intermediário", "Avançado"]'::jsonb
WHERE field_key = 'ingles_fluente';

-- Migrar dados JSONB: true → "Avançado", false → "Não tenho"
UPDATE user_curriculum
SET data = data || jsonb_build_object(
  'ingles_fluente',
  CASE
    WHEN (data->>'ingles_fluente')::boolean = true THEN 'Avançado'
    ELSE 'Não tenho'
  END
)
WHERE data ? 'ingles_fluente'
  AND jsonb_typeof(data->'ingles_fluente') = 'boolean';

-- =============================================================================
-- 2. Atualizar regras existentes que usam ingles_fluente como boolean
-- =============================================================================

-- Santa Casa SP: ingles_fluente bool → when_value "Avançado"
UPDATE scoring_rules
SET formula = '{"op": "sum", "caps": {"total": 6}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 6}]}'::jsonb
WHERE field_key = 'ingles_fluente'
  AND institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa SP');

-- =============================================================================
-- 3. Santa Casa BH — 3 blocos, total max 10 pts
-- =============================================================================

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa BH');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- Bloco 1: Formação — cap 4,0
  -- 1A: Aproveitamento curricular (50% notas ≥80 = 1pt)
  ('Perfil', 'media_geral', 1, 1,
   'Aproveitamento curricular — 50% das notas acima de 80 pontos (1pt)',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 8, "pts": 1.0}]}'),

  -- 1B: Proficiência língua — avançado 1,5 / intermediário 0,5
  ('Perfil', 'ingles_fluente', 1.5, 1.5,
   'Proficiência língua estrangeira: Avançado (1,5pts) | Intermediário (0,5pt)',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 1.5}, {"field": "ingles_fluente", "when_value": "Intermediário", "pts": 0.5}]}'),

  -- 1C: Pós-grad lato sensu / Residência / Especialização — 1pt
  ('Perfil', 'residencia_medica_concluida', 1, 1,
   'Pós-graduação lato sensu / Residência médica / Especialização (1pt)',
   '{"op": "sum", "caps": {"total": 1}, "terms": [{"field": "residencia_medica_concluida", "when_true": 1}]}'),

  -- 1D: Mestrado 0,5 + Doutorado 0,5
  ('Perfil', 'mestrado_status', 0.5, 1,
   'Mestrado (0,5pt) + Doutorado (0,5pt)',
   '{"op": "sum", "caps": {"total": 1}, "terms": [{"field": "mestrado_status", "when_value": "Concluído", "pts": 0.5}, {"field": "doutorado_status", "when_value": "Concluído", "pts": 0.5}]}'),

  -- Bloco 2: Exp. Acadêmica — cap 4,0
  -- 2A: Monitoria (CH≥80h ou ≥4 meses) — 1pt
  ('Acadêmico', 'monitoria_semestres', 1, 1,
   'Monitoria (CH mín 80h ou 4 meses) — 1pt',
   '{"op": "threshold", "field": "monitoria_semestres", "brackets": [{"gte": 1, "pts": 1.0}]}'),

  -- 2B: Estágio extracurricular / PET-Saúde (≥6m ou ≥180h) — 1pt
  ('Prática/Social', 'estagio_extracurricular_horas', 1, 1,
   'Estágio extracurricular ou PET-Saúde (mín 180h ou 6 meses) — 1pt',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 180, "pts": 1.0}]}'),

  -- 2C: Projetos extensão (CH≥120h) — 0,5pt
  ('Acadêmico', 'extensao_semestres', 0.5, 0.5,
   'Projetos de extensão (CH mín 120h) — 0,5pt',
   '{"op": "threshold", "field": "extensao_semestres", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- 2D: Organização eventos / palestrante — 0,5pt
  ('Liderança/Eventos', 'organizador_evento', 0.5, 0.5,
   'Organização de eventos científicos ou palestrante — 0,5pt',
   '{"op": "threshold", "field": "organizador_evento", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- 2E: Liga acadêmica — 0,5pt
  ('Liderança/Eventos', 'membro_liga_anos', 0.5, 0.5,
   'Participação em liga acadêmica — 0,5pt',
   '{"op": "any_positive", "pts": 0.5, "fields": ["diretoria_ligas", "membro_liga_anos"]}'),

  -- 2F: Participação eventos (congressos etc.) — 0,5pt
  ('Liderança/Eventos', 'ouvinte_congresso', 0.5, 0.5,
   'Participação em eventos (congressos, seminários, simpósios) — 0,5pt',
   '{"op": "threshold", "field": "ouvinte_congresso", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- Bloco 3: Pesquisa — cap 2,0
  -- 3A: Capítulos de livro — 0,75pt
  ('Publicações', 'capitulos_livro', 0.75, 0.75,
   'Publicação de capítulo de livro — 0,75pt',
   '{"op": "threshold", "field": "capitulos_livro", "brackets": [{"gte": 1, "pts": 0.75}]}'),

  -- 3B: Artigo completo — 0,5pt
  ('Publicações', 'artigos_high_impact', 0.5, 0.5,
   'Publicação de artigo completo em periódico indexado — 0,5pt',
   '{"op": "any_positive", "pts": 0.5, "fields": ["artigos_high_impact", "artigos_mid_impact", "artigos_low_impact"]}'),

  -- 3C: Resumo em anais — 0,25pt
  ('Publicações', 'artigos_nacionais', 0.25, 0.25,
   'Publicação de resumo em anais ou revistas indexadas — 0,25pt',
   '{"op": "threshold", "field": "artigos_nacionais", "brackets": [{"gte": 1, "pts": 0.25}]}'),

  -- 3E: IC com bolsa (min 1 ano) — 0,25pt
  ('Acadêmico', 'ic_com_bolsa', 0.25, 0.25,
   'Atuação em pesquisa com bolsa de IC (mín 1 ano) — 0,25pt',
   '{"op": "threshold", "field": "ic_com_bolsa", "brackets": [{"gte": 1, "pts": 0.25}]}'),

  -- 3F: Apresentação trabalhos eventos — 0,25pt
  ('Liderança/Eventos', 'apresentacao_congresso', 0.25, 0.25,
   'Apresentação de trabalhos em eventos científicos — 0,25pt',
   '{"op": "threshold", "field": "apresentacao_congresso", "brackets": [{"gte": 1, "pts": 0.25}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'Santa Casa BH';

-- =============================================================================
-- 4. FMABC — edital real
-- =============================================================================

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'FMABC');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- IC/extensão/PET (CH≥160h, 7pts cada, max 3 = 21)
  ('Acadêmico', 'ic_com_bolsa', 7, 21,
   'IC / extensão / PET com CH ≥ 160h (7pts cada, máx 3 projetos = 21pts)',
   '{"op": "sum", "caps": {"total": 21}, "terms": [{"field": "ic_com_bolsa", "mult": 7}, {"field": "ic_sem_bolsa", "mult": 7}]}'),

  -- Estágio extracurricular (CH≥160h, 9pts)
  ('Prática/Social', 'estagio_extracurricular_horas', 9, 9,
   'Estágio extracurricular com CH ≥ 160h (9pts)',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 160, "pts": 9.0}]}'),

  -- Artigos publicados na íntegra (10pts cada, max 3 = 30)
  ('Publicações', 'publicacoes', 10, 30,
   'Artigo publicado na íntegra em revista de saúde (10pts cada, máx 3 = 30pts)',
   '{"op": "sum", "caps": {"total": 30}, "terms": [{"field": "artigos_high_impact", "mult": 10}, {"field": "artigos_mid_impact", "mult": 10}, {"field": "artigos_low_impact", "mult": 10}, {"field": "artigos_nacionais", "mult": 10}]}'),

  -- Participação evento científico (1pt, max 3)
  ('Liderança/Eventos', 'ouvinte_congresso', 1, 3,
   'Participação em evento científico (1pt cada, máx 3pts)',
   '{"op": "sum", "caps": {"total": 3}, "terms": [{"field": "ouvinte_congresso", "mult": 1}]}'),

  -- Pós-graduação (≥30h = 1pt equiv, max 10)
  ('Perfil', 'mestrado_status', 1, 10,
   'Pós-graduação ≥ 30h (1pt por 30h, máx 10pts). Doutorado/Mestrado concluído pontua mais.',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "doutorado_status", "when_value": "Concluído", "pts": 10}, {"field": "mestrado_status", "when_value": "Concluído", "pts": 5, "override_by_field": "doutorado_status", "override_value": "Concluído"}, {"field": "residencia_medica_concluida", "when_true": 3}]}'),

  -- Proficiência língua estrangeira (5pts)
  ('Perfil', 'ingles_fluente', 5, 5,
   'Proficiência em língua estrangeira comprovada (5pts)',
   '{"op": "sum", "caps": {"total": 5}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 5}, {"field": "ingles_fluente", "when_value": "Intermediário", "pts": 3}]}'),

  -- Monitoria (2pts)
  ('Acadêmico', 'monitoria_semestres', 2, 2,
   'Monitoria comprovada (2pts)',
   '{"op": "threshold", "field": "monitoria_semestres", "brackets": [{"gte": 1, "pts": 2}]}'),

  -- Congressos — trabalhos apresentados
  ('Liderança/Eventos', 'apresentacao_congresso', 5, 10,
   'Trabalhos apresentados em congressos (5pts cada, máx 10pts)',
   '{"op": "sum", "caps": {"total": 10}, "terms": [{"field": "apresentacao_congresso", "mult": 5}]}'),

  -- Liga acadêmica (diretoria / membro)
  ('Liderança/Eventos', 'diretoria_ligas', 5, 5,
   'Liga acadêmica: diretoria (5pts) | membro (2pts)',
   '{"op": "sum", "caps": {"total": 5}, "terms": [{"field": "diretoria_ligas", "when_gt0": 5}, {"field": "membro_liga_anos", "when_gt0": 2}]}'),

  -- Cursos suporte vida
  ('Liderança/Eventos', 'cursos_suporte', 5, 5,
   'Cursos de suporte de vida — ACLS, ATLS, PALS (5pts)',
   '{"op": "threshold", "field": "cursos_suporte", "brackets": [{"gte": 1, "pts": 5}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'FMABC';

-- =============================================================================
-- 5. Marcar scores stale
-- =============================================================================

UPDATE user_scores SET stale = true;
