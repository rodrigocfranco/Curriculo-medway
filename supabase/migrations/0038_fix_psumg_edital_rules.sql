-- 0038_fix_psumg_edital_rules.sql
-- Corrigir regras PSU-MG conforme edital AREMG 2026 (12 itens, total 14 pts)
-- Principais ajustes: unificar itens 6 e 11, corrigir vigilância tiered, descrições claras

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-MG');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- Item 1: Aproveitamento Curricular — máx 3,0
  -- Edital separa 4 primeiros anos (máx 1,5) e 2 últimos anos (máx 1,5)
  -- Aproximação: média geral única com faixas equivalentes
  ('Formação', 'media_geral', 3, 3,
   'Aproveitamento curricular (4 primeiros + 2 últimos anos). Pelo menos 50% das notas: ≥85 (1,5pt por período) | ≥80 (1pt) | ≥75 (0,5pt) | Demais (0,25pt). Máximo 3 pontos.',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 8.5, "pts": 3.0}, {"gte": 8.0, "pts": 2.0}, {"gte": 7.5, "pts": 1.0}, {"gte": 0, "pts": 0.5}]}'),

  -- Item 2: Inglês ou outra língua — máx 1,0
  ('Qualificações', 'ingles_fluente', 1, 1,
   'Proficiência em língua estrangeira (apenas 1 opção, sem somatório): Inglês avançado — TOEFL ≥550/IBT ≥79, IELTS ≥6.5, Cambridge CAE/CPE (1pt) | Inglês intermediário (0,5pt) | Outra língua avançado (0,5pt)',
   '{"op": "sum", "caps": {"total": 1.0}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 1.0}, {"field": "ingles_fluente", "when_value": "Intermediário", "pts": 0.5}]}'),

  -- Item 3a: Estágio extracurricular / PET-Saúde — 1,0
  ('Representação Estudantil e Voluntariado', 'estagio_extracurricular_horas', 1, 1,
   'Estágio extracurricular em instituição com residência médica (mín 6 meses/180h) ou PET-Saúde (mín 6 meses): 1 ponto.',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 180, "pts": 1.0}]}'),

  -- Item 3b: Monitoria/PID — 1,0
  ('Atividades Acadêmicas', 'monitoria_semestres', 1, 1,
   'Monitoria ou Programa de Iniciação à Docência (PID) na instituição de origem por 1 semestre letivo (mín 16 semanas, 80h): 1 ponto.',
   '{"op": "threshold", "field": "monitoria_semestres", "brackets": [{"gte": 1, "pts": 1.0}]}'),

  -- Item 4: IC e Pesquisa — máx 1,30
  ('Pesquisa e Publicações', 'ic_projetos', 0.5, 1.3,
   'Iniciação Científica: Bolsa IC com duração mín 6 meses (0,5pt) | IC voluntária mín 6 meses (0,3pt) | Projeto de pesquisa com publicação, mín 1 ano (0,5pt). Máximo 1,3 pontos.',
   '{"op": "composite", "caps": {"total": 1.3}, "groups": [
     {"op": "count_tiered", "field": "ic_projetos", "filter": {"tipo": "Com bolsa"}, "tiers": [{"gte": 1, "pts": 0.5}]},
     {"op": "count_tiered", "field": "ic_projetos", "filter": {"tipo": "Sem bolsa"}, "tiers": [{"gte": 1, "pts": 0.3}]}
   ]}'),

  -- Item 5: Residência / Mestrado / Doutorado / Título — máx 0,50
  ('Qualificações', 'mestrado_status', 0.5, 0.5,
   'Pós-graduação (apenas 1 opção, sem somatório): Residência Médica concluída (0,5pt) | Mestrado em saúde (0,5pt) | Doutorado em saúde (0,5pt) | Título de Especialista ou RQE (0,5pt). Máximo 0,5 ponto.',
   '{"op": "sum", "caps": {"total": 0.5}, "terms": [{"field": "doutorado_status", "when_value": "Concluído", "pts": 0.5}, {"field": "mestrado_status", "when_value": "Concluído", "pts": 0.5}, {"field": "residencia_medica_concluida", "when_true": 0.5}]}'),

  -- Item 6: Congressos — máx 0,80 (teto compartilhado)
  -- 6a: organizador = 0,3 | 6b: palestrante = 0,3 | 6c: 2 ouvinte = 0,2
  ('Congressos e Formação Complementar', 'organizador_evento', 0.3, 0.8,
   'Participação em congressos (teto 0,8pt): Organizador de evento científico (0,3pt) | Palestrante em evento diferente (0,3pt) | 2 participações como ouvinte em congressos estaduais/nacionais (0,2pt). Eventos devem ser distintos entre si.',
   '{"op": "composite", "caps": {"total": 0.8}, "groups": [
     {"op": "threshold", "field": "organizador_evento", "brackets": [{"gte": 1, "pts": 0.3}]},
     {"op": "count_tiered", "field": "apresentacoes", "tiers": [{"gte": 1, "pts": 0.3}]},
     {"op": "tiered", "field": "ouvinte_congresso", "tiers": [{"gte": 2, "pts": 0.2}]}
   ]}'),

  -- Item 7: Ligas + Representação — máx 1,10
  ('Atividades Acadêmicas', 'membro_liga_anos', 0.8, 1.1,
   'Ligas e representação: Participação em até 2 ligas por 2 semestres (0,8pt) | Cargo de presidente/diretor/secretário/tesoureiro de DA ou representação discente oficial por mín 1 ano (0,3pt). Máximo 1,1 ponto.',
   '{"op": "sum", "caps": {"total": 1.1}, "terms": [{"field": "membro_liga_anos", "when_gt0": 0.8}, {"field": "centro_academico_semestres", "when_gt0": 0.3}, {"field": "colegiado_institucional_semestres", "when_gt0": 0.3}]}'),

  -- Item 8: Suporte avançado à vida — máx 0,70
  ('Congressos e Formação Complementar', 'cursos_suporte', 0.7, 0.7,
   'Aprovação em curso teórico-prático de suporte avançado à vida (mín 16h, entidade internacional reconhecida, dentro da validade). Exige carteira de aprovação: 0,7 ponto.',
   '{"op": "threshold", "field": "cursos_suporte", "brackets": [{"gte": 1, "pts": 0.7}]}'),

  -- Item 9: Cursos temas médicos AMB — máx 0,70
  ('Congressos e Formação Complementar', 'cursos_temas_medicos', 0.7, 0.7,
   'Cursos de temas médicos por entidades filiadas à AMB (mín 8h cada, diferentes entre si): 3 cursos (0,7pt) | 2 cursos (0,5pt) | 1 curso (0,3pt).',
   '{"op": "tiered", "field": "cursos_temas_medicos", "tiers": [{"gte": 3, "pts": 0.7}, {"gte": 2, "pts": 0.5}, {"gte": 1, "pts": 0.3}]}'),

  -- Item 10: Extensão + Voluntariado + Vigilância — máx 1,50 (teto compartilhado)
  ('Representação Estudantil e Voluntariado', 'extensao_semestres', 0.7, 1.5,
   'Extensão e voluntariado (teto 1,5pt): Projeto de extensão 1 semestre/80h (0,7pt) | 2 projetos voluntários junto à comunidade com mín 16h total (0,3pt) | Estágio em vigilância à saúde — 6 meses (0,5pt) ou 3 meses (0,3pt).',
   '{"op": "composite", "caps": {"total": 1.5}, "groups": [
     {"op": "threshold", "field": "extensao_semestres", "brackets": [{"gte": 1, "pts": 0.7}]},
     {"op": "tiered", "field": "voluntariado_horas", "tiers": [{"gte": 16, "pts": 0.3}]},
     {"op": "tiered", "field": "trabalho_sus_meses", "tiers": [{"gte": 6, "pts": 0.5}, {"gte": 3, "pts": 0.3}]}
   ]}'),

  -- Item 11: Apresentação/Publicação — máx 1,50 (teto compartilhado)
  -- 11a: apresentação trabalho = 0,3 | 11b: apresentação + publicação anais = 0,5 | 11c: artigo indexado = 0,7
  ('Pesquisa e Publicações', 'publicacoes', 0.7, 1.5,
   'Apresentação e publicação científica (teto 1,5pt): Apresentação de trabalho em evento científico (0,3pt) | Trabalho publicado em anais de revista indexada Qualis ≥B2 (0,5pt) | Artigo completo em revista indexada Qualis ≥B2 (0,7pt).',
   '{"op": "composite", "caps": {"total": 1.5}, "groups": [
     {"op": "count_tiered", "field": "apresentacoes", "tiers": [{"gte": 1, "pts": 0.3}]},
     {"op": "composite", "caps": {"total": 0.5}, "groups": [
       {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "Anais congresso nacional"}, "mult": 0.5, "caps": {"total": 0.5}},
       {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "Anais congresso internacional"}, "mult": 0.5, "caps": {"total": 0.5}}
     ]},
     {"op": "composite", "caps": {"total": 0.7}, "groups": [
       {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "PubMed"}, "mult": 0.7, "caps": {"total": 0.7}},
       {"op": "count_articles", "field": "publicacoes", "filter": {"veiculo": "SCIELO/SCOPUS"}, "mult": 0.7, "caps": {"total": 0.7}}
     ]}
   ]}'),

  -- Item 12: Livro ou capítulo de livro — máx 0,50
  ('Pesquisa e Publicações', 'capitulos_livro', 0.5, 0.5,
   'Autor ou coautor de livro técnico ou capítulo de livro da área médica (máx 1 autor + 4 coautores, com médico orientador): 0,5 ponto.',
   '{"op": "threshold", "field": "capitulos_livro", "brackets": [{"gte": 1, "pts": 0.5}]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'PSU-MG';

-- Marcar scores stale
UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'PSU-MG');
