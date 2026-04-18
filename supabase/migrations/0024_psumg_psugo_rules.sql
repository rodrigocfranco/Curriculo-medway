-- 0024_psumg_psugo_rules.sql
-- PSU-MG: regras do edital real (12 itens, max 10 pts)
-- PSU-GO: nova instituição + regras do edital real (12 itens, max 10 pts)

-- =============================================================================
-- 1. Novos campos
-- =============================================================================

INSERT INTO curriculum_fields (field_key, label, category, field_type, options, display_order)
VALUES
  ('cursos_temas_medicos', 'Cursos de temas médicos (sociedades/AMB, ≥8h)', 'Liderança/Eventos', 'number', null, 30),
  ('prova_proficiencia_medicina', 'Prova de proficiência em Medicina (AMB/CRM)', 'Perfil', 'boolean', null, 35)
ON CONFLICT (field_key) DO NOTHING;

-- =============================================================================
-- 2. Nova instituição PSU-GO
-- =============================================================================

INSERT INTO institutions (name, short_name, state)
VALUES ('Processo Seletivo Unificado de Goiás', 'PSU-GO', 'GO')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 3. PSU-MG — 12 itens, total max ~10 pts
-- =============================================================================

DELETE FROM scoring_rules WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-MG');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- Item 1: Aproveitamento curricular — max 3.0 (1.5 primeiros 4 anos + 1.5 últimos 2 anos)
  ('Perfil', 'media_geral', 3, 3,
   '50% notas ≥85 (1,5pt) | ≥80 (1pt) | ≥75 (0,5pt) | demais (0,25pt) — 4 primeiros anos + 2 últimos anos',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 8.5, "pts": 3.0}, {"gte": 8.0, "pts": 2.0}, {"gte": 7.5, "pts": 1.0}, {"gte": 0, "pts": 0.5}]}'),

  -- Item 2: Língua estrangeira — max 1.0
  ('Perfil', 'ingles_fluente', 1, 1,
   'Inglês avançado (1pt) | Inglês intermediário (0,5pt) | Outra língua avançado (0,5pt) | Outra intermediário (0,25pt)',
   '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 1.0}, {"field": "ingles_fluente", "when_value": "Intermediário", "pts": 0.5}]}'),

  -- Item 3a: Estágio extracurricular (6m, 180h) — 1.0pt
  ('Prática/Social', 'estagio_extracurricular_horas', 1, 1,
   'Estágio extracurricular em inst. com residência (mín 6m/180h) ou PET-Saúde (1pt)',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 180, "pts": 1.0}]}'),

  -- Item 3b: Monitoria/PID (1 sem, 80h) — 1.0pt
  ('Acadêmico', 'monitoria_semestres', 1, 1,
   'Monitoria / PID na instituição de origem (1 semestre, mín 80h) — 1pt',
   '{"op": "threshold", "field": "monitoria_semestres", "brackets": [{"gte": 1, "pts": 1.0}]}'),

  -- Item 4: IC / pesquisa — max 1.3 (4a BIC 0.5, 4b IC vol 0.3, 4c projeto pesq 0.5)
  ('Acadêmico', 'ic_com_bolsa', 0.5, 1.3,
   'BIC 6m (0,5pt) | IC voluntária 6m (0,3pt) | Projeto pesquisa 12m com publicação (0,5pt) — máx 1,3pts',
   '{"op": "sum", "caps": {"total": 1.3}, "terms": [{"field": "ic_com_bolsa", "when_gt0": 0.5}, {"field": "ic_sem_bolsa", "when_gt0": 0.3}]}'),

  -- Item 5: Residência / Mestrado / Doutorado / Título — max 0.5
  ('Perfil', 'mestrado_status', 0.5, 0.5,
   'Residência médica (0,5pt) | Mestrado (0,5pt) | Doutorado (0,5pt) | Título especialista (0,5pt) — máx 0,5pt',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [{"field": "doutorado_status", "when_value": "Concluído", "pts": 0.5}, {"field": "mestrado_status", "when_value": "Concluído", "pts": 0.5}, {"field": "residencia_medica_concluida", "when_true": 0.5}]}'),

  -- Item 6: Congressos (organizador 0.3, palestrante 0.3, ouvinte 0.2) — max 0.8
  ('Liderança/Eventos', 'apresentacao_congresso', 0.3, 0.8,
   'Organizador evento (0,3pt) | Palestrante (0,3pt) | 2 participações ouvinte (0,2pt) — máx 0,8pt',
   '{"op": "sum", "caps": {"total": 0.8}, "terms": [{"field": "organizador_evento", "when_gt0": 0.3}, {"field": "apresentacao_congresso", "when_gt0": 0.3}, {"field": "ouvinte_congresso", "when_gt0": 0.2}]}'),

  -- Item 7: Ligas (7a 0.8) + representação (7b 0.3) — max 1.1
  ('Liderança/Eventos', 'membro_liga_anos', 0.8, 1.1,
   'Participação em ligas 2 semestres (0,8pt) | Diretório acadêmico/representante discente 1 ano (0,3pt) — máx 1,1pt',
   '{"op": "sum", "caps": {"total": 1.1}, "terms": [{"field": "membro_liga_anos", "when_gt0": 0.8}, {"field": "centro_academico_semestres", "when_gt0": 0.3}, {"field": "colegiado_institucional_semestres", "when_gt0": 0.3}]}'),

  -- Item 8: Curso suporte avançado vida (16h) — max 0.7
  ('Liderança/Eventos', 'cursos_suporte', 0.7, 0.7,
   'Aprovação em curso suporte avançado à vida (mín 16h, entidade internacional) — 0,7pt',
   '{"op": "threshold", "field": "cursos_suporte", "brackets": [{"gte": 1, "pts": 0.7}]}'),

  -- Item 9: Cursos temas médicos AMB (3=0.7, 2=0.5, 1=0.3) — max 0.7
  ('Liderança/Eventos', 'cursos_temas_medicos', 0.7, 0.7,
   'Cursos temas médicos AMB ≥8h: 3 cursos (0,7pt) | 2 cursos (0,5pt) | 1 curso (0,3pt)',
   '{"op": "tiered", "field": "cursos_temas_medicos", "tiers": [{"gte": 3, "pts": 0.7}, {"gte": 2, "pts": 0.5}, {"gte": 1, "pts": 0.3}]}'),

  -- Item 10: Extensão + voluntariado + vigilância — max 1.5
  ('Prática/Social', 'extensao_semestres', 0.7, 1.5,
   'Extensão 1 sem/80h (0,7pt) | Voluntariado 2 projetos (0,3pt) | Vigilância 6m (0,5pt) ou 3m (0,3pt) — máx 1,5pts',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "extensao_semestres", "when_gt0": 0.7}, {"field": "voluntariado_horas", "when_gt0": 0.3}, {"field": "trabalho_sus_meses", "when_gt0": 0.3}]}'),

  -- Item 11: Apresentação/publicação trabalhos — max 1.5
  ('Publicações', 'artigos_high_impact', 0.7, 1.5,
   'Apresentação trabalho (0,3pt) | Apresentação + publicação anais (0,5pt) | Artigo completo revista indexada (0,7pt) — máx 1,5pts',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "apresentacao_congresso", "when_gt0": 0.3}, {"field": "artigos_nacionais", "when_gt0": 0.5}, {"field": "artigos_high_impact", "when_gt0": 0.7}]}'),

  -- Item 12: Livro ou capítulo — max 0.5
  ('Publicações', 'capitulos_livro', 0.5, 0.5,
   'Publicação livro ou capítulo de livro técnico médico (0,5pt)',
   '{"op": "threshold", "field": "capitulos_livro", "brackets": [{"gte": 1, "pts": 0.5}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'PSU-MG';

-- =============================================================================
-- 4. PSU-GO — 12 itens, total max 10 pts
-- =============================================================================

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES
  -- 1. Diploma/CRM — 0.1pt
  ('Perfil', 'media_geral', 0.1, 0.1,
   'Diploma de medicina ou registro no CRM (0,1pt)',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 0, "pts": 0.1}]}'),

  -- 2. Monitoria — 0.25/semestre
  ('Acadêmico', 'monitoria_semestres', 0.25, 1.5,
   'Monitoria: 0,25pt por semestre',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "monitoria_semestres", "mult": 0.25}]}'),

  -- 3. Bolsa IC / PET / PIBIC — 0.45-0.65 por pesquisa
  ('Acadêmico', 'ic_com_bolsa', 0.5, 1.5,
   'Bolsa IC, PET, PIBIC, PROEXT (0,5pt por projeto)',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "ic_com_bolsa", "mult": 0.5}, {"field": "ic_sem_bolsa", "mult": 0.5}]}'),

  -- 4. Trabalhos científicos — apresentação congressos
  ('Liderança/Eventos', 'apresentacao_congresso', 0.25, 1,
   'Apresentação trabalho científico: autor (0,25pt) | coautor (0,15pt) — atividades 2019-2025',
   '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "apresentacao_congresso", "mult": 0.25}]}'),

  -- 5. Publicações artigos + capítulos livro — 0.5pt
  ('Publicações', 'artigos_high_impact', 0.5, 1,
   'Artigo publicado em periódico com corpo editorial (0,5pt por publicação)',
   '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "artigos_high_impact", "mult": 0.5}, {"field": "artigos_mid_impact", "mult": 0.5}, {"field": "artigos_nacionais", "mult": 0.5}, {"field": "capitulos_livro", "mult": 0.5}]}'),

  -- 6. Participação congressos/jornadas — 0.1/evento
  ('Liderança/Eventos', 'ouvinte_congresso', 0.1, 0.5,
   'Participação em congressos/jornadas (0,1pt por evento, atividades 2019-2025)',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [{"field": "ouvinte_congresso", "mult": 0.1}]}'),

  -- 7. Ligas acadêmicas — 0.25/ano, max 2 ligas
  ('Liderança/Eventos', 'membro_liga_anos', 0.25, 0.5,
   'Liga acadêmica: 0,25pt por ano (máx 2 ligas)',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [{"field": "membro_liga_anos", "mult": 0.25}]}'),

  -- 8. Representação estudantil — 0.25pt
  ('Liderança/Eventos', 'centro_academico_semestres', 0.25, 0.5,
   'Representação estudantil / representação na instituição de ensino (0,25pt)',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [{"field": "centro_academico_semestres", "when_gt0": 0.25}, {"field": "colegiado_institucional_semestres", "when_gt0": 0.25}]}'),

  -- 9. Teste de progresso — por ano 0.5pt (notas >0.4, 3→0.2, 1→0.1)
  ('Acadêmico', 'teste_progresso', 0.5, 1.5,
   'Teste de progresso: nota >5 (0,4pt) | nota 3-5 (0,2pt) | nota 1-3 (0,1pt) — por participação',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "teste_progresso", "mult": 0.3}]}'),

  -- 10. Curso suporte avançado vida — 0.5/curso
  ('Liderança/Eventos', 'cursos_suporte', 0.5, 1,
   'Aprovação em curso suporte avançado (ATLS, ACLS, BLS, PALS, PHTLS) — 0,5pt por curso',
   '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "cursos_suporte", "mult": 0.5}]}'),

  -- 11. Prova proficiência em Medicina — 0.5pt
  ('Perfil', 'prova_proficiencia_medicina', 0.5, 0.5,
   'Prova de proficiência em Medicina por Associações Médicas/CRM (0,5pt)',
   '{"op": "bool", "field": "prova_proficiencia_medicina", "pts_true": 0.5}'),

  -- 12. Estágio Exterior ou Brasil — 0.5pt
  ('Prática/Social', 'estagio_extracurricular_horas', 0.5, 0.5,
   'Estágio supervisionado no Exterior ou Brasil (mín 1 mês, certificado registrado) — 0,5pt',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 160, "pts": 0.5}]}')
) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'PSU-GO';

-- =============================================================================
-- 5. Marcar scores stale
-- =============================================================================
UPDATE user_scores SET stale = true;
