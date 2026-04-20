-- 0039_fix_scbh_edital_rules.sql
-- Corrigir regras Santa Casa BH conforme edital Acesso Direto (3 blocos, total 10 pts)
-- Principais ajustes: publicações boolean, teto Bloco 1, descrições claras

DELETE FROM scoring_rules
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa BH');

INSERT INTO scoring_rules (institution_id, category, field_key, weight, max_points, description, formula)
SELECT id, v.category, v.field_key, v.weight, v.max_points, v.description, v.formula::jsonb
FROM institutions, (VALUES

  -- ===== BLOCO 1: Formação (teto 4,0 pts) =====

  -- 1A: Aproveitamento Curricular — 1,0
  ('Formação', 'media_geral', 1, 1,
   'Histórico escolar com 50% das notas acima de 80 pontos: 1 ponto.',
   '{"op": "tiered", "field": "media_geral", "tiers": [{"gte": 8, "pts": 1.0}]}'),

  -- 1B: Proficiência em língua estrangeira — máx 1,5
  ('Qualificações', 'ingles_fluente', 1.5, 1.5,
   'Proficiência em inglês ou espanhol (apenas 1 certificado): Avançado — TOEFL ≥533, IELTS ≥6.5, Cambridge CAE/CPE (1,5pt) | Intermediário — TOEFL 437-530, IELTS 4.0-6.0 (0,5pt)',
   '{"op": "sum", "caps": {"total": 1.5}, "terms": [{"field": "ingles_fluente", "when_value": "Avançado", "pts": 1.5}, {"field": "ingles_fluente", "when_value": "Intermediário", "pts": 0.5}]}'),

  -- 1C: Pós-graduação lato sensu / Residência — 1,0
  ('Qualificações', 'residencia_medica_concluida', 1, 1,
   'Pós-graduação lato sensu, Residência ou Especialização Médica concluída (diploma com carga horária ≥360h): 1 ponto.',
   '{"op": "sum", "caps": {"total": 1}, "terms": [{"field": "residencia_medica_concluida", "when_true": 1}]}'),

  -- 1D: Pós-graduação stricto sensu — Mestrado 0,5 + Doutorado 0,5
  ('Qualificações', 'mestrado_status', 0.5, 1,
   'Pós-graduação stricto sensu: Mestrado concluído (0,5pt) + Doutorado concluído (0,5pt). Ambos podem somar.',
   '{"op": "sum", "caps": {"total": 1}, "terms": [{"field": "mestrado_status", "when_value": "Concluído", "pts": 0.5}, {"field": "doutorado_status", "when_value": "Concluído", "pts": 0.5}]}'),

  -- ===== BLOCO 2: Experiência Acadêmica/Profissional (teto 4,0 pts) =====

  -- 2A: Monitoria — 1,0
  ('Atividades Acadêmicas', 'monitoria_semestres', 1, 1,
   'Monitoria ou PID com carga horária mín 80h ou pelo menos 4 meses: 1 ponto.',
   '{"op": "threshold", "field": "monitoria_semestres", "brackets": [{"gte": 1, "pts": 1.0}]}'),

  -- 2B: Estágio extracurricular / PET-Saúde — 1,0
  ('Representação Estudantil e Voluntariado', 'estagio_extracurricular_horas', 1, 1,
   'Estágio extracurricular ou PET-Saúde com mín 6 meses ou 180h (estágio obrigatório não conta): 1 ponto.',
   '{"op": "tiered", "field": "estagio_extracurricular_horas", "tiers": [{"gte": 180, "pts": 1.0}]}'),

  -- 2C: Projetos de extensão — 0,5
  ('Atividades Acadêmicas', 'extensao_semestres', 0.5, 0.5,
   'Participação em projeto de extensão com carga horária mín 120h: 0,5 ponto.',
   '{"op": "threshold", "field": "extensao_semestres", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- 2D: Organização de eventos / palestrante — 0,5
  ('Congressos e Formação Complementar', 'organizador_evento', 0.5, 0.5,
   'Organização de evento científico ou participação como palestrante (não vale como ouvinte): 0,5 ponto.',
   '{"op": "threshold", "field": "organizador_evento", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- 2E: Liga acadêmica — 0,5
  ('Atividades Acadêmicas', 'membro_liga_anos', 0.5, 0.5,
   'Participação em liga acadêmica (como organizador, diretor ou participante): 0,5 ponto.',
   '{"op": "any_positive", "pts": 0.5, "fields": ["diretoria_ligas", "membro_liga_anos"]}'),

  -- 2F: Participação em eventos — 0,5
  ('Congressos e Formação Complementar', 'ouvinte_congresso', 0.5, 0.5,
   'Participação como ouvinte em congressos, simpósios, seminários ou fóruns na área médica (comprovação diferente do item 2D): 0,5 ponto.',
   '{"op": "threshold", "field": "ouvinte_congresso", "brackets": [{"gte": 1, "pts": 0.5}]}'),

  -- ===== BLOCO 3: Experiências de Pesquisa (teto 2,0 pts) =====

  -- 3A: Capítulos de livro — 0,75
  ('Pesquisa e Publicações', 'capitulos_livro', 0.75, 0.75,
   'Publicação de capítulo de livro com referenciamento bibliográfico ABNT: 0,75 ponto.',
   '{"op": "threshold", "field": "capitulos_livro", "brackets": [{"gte": 1, "pts": 0.75}]}'),

  -- 3B+3C: Publicações — artigo indexado (0,5) + resumo em anais (0,25)
  ('Pesquisa e Publicações', 'publicacoes', 0.5, 0.75,
   'Artigo completo em periódico indexado (0,5pt) | Resumo publicado em anais ou suplemento de revista indexada (0,25pt). Máximo 0,75 ponto.',
   '{"op": "composite", "caps": {"total": 0.75}, "groups": [
     {"op": "count_tiered", "field": "publicacoes", "tiers": [{"gte": 1, "pts": 0.5}]},
     {"op": "composite", "caps": {"total": 0.25}, "groups": [
       {"op": "count_tiered", "field": "publicacoes", "filter": {"veiculo": "Anais congresso nacional"}, "tiers": [{"gte": 1, "pts": 0.25}]},
       {"op": "count_tiered", "field": "publicacoes", "filter": {"veiculo": "Anais congresso internacional"}, "tiers": [{"gte": 1, "pts": 0.25}]}
     ]}
   ]}'),

  -- 3E: IC com bolsa (mín 1 ano) — 0,25
  ('Pesquisa e Publicações', 'ic_projetos', 0.25, 0.25,
   'Bolsa de Iniciação Científica com duração mín 1 ano (institucional, CNPq ou fundações estaduais): 0,25 ponto.',
   '{"op": "count_tiered", "field": "ic_projetos", "filter": {"tipo": "Com bolsa"}, "tiers": [{"gte": 1, "pts": 0.25}]}'),

  -- 3F: Apresentação de trabalhos em eventos — 0,25
  ('Congressos e Formação Complementar', 'apresentacoes', 0.25, 0.25,
   'Apresentou trabalho (oral ou poster) em evento acadêmico/científico na área médica? Sim (0,25pt) | Não (0pt). Comprovação diferente do item 3C.',
   '{"op": "count_tiered", "field": "apresentacoes", "tiers": [{"gte": 1, "pts": 0.25}]}')

) AS v(category, field_key, weight, max_points, description, formula)
WHERE short_name = 'Santa Casa BH';

UPDATE user_scores SET stale = true
WHERE institution_id = (SELECT id FROM institutions WHERE short_name = 'Santa Casa BH');
