-- supabase/seeds/rules_engine.sql
-- Story 1.9: seed idempotente das 11 instituições + scoring_rules extraídas
-- verbatim de src/lib/calculations.ts (Lovable legacy).
--
-- Executado como role `postgres` via `supabase db reset`.
-- RLS está "forced" nas 3 tabelas (migration 0002) — `set local row_security = off`
-- bypassa RLS apenas nesta transação (requer privilégio BYPASSRLS do postgres).
--
-- formula JSONB shape — ver Story 1.9 Dev Notes (decodificado por calculate_scores
-- em Story 2.5). Contrato completo (ops + flags) usados neste seed:
--   Operadores:
--     sum                      — soma de termos com cap total
--     threshold                — faixas exclusivas {gte|gt, pts} sobre um field numérico
--     tiered                   — sinônimo de threshold com múltiplas tiers
--     bool                     — flag booleana {field, pts_true}
--     composite                — groups[] independentes (cada um com próprio op e cap)
--     custom                   — função PL/pgSQL nomeada {fn:"..."} — implementar em Story 2.5
--     ruf_branch               — tri-state {field, pts_true, pts_false, pts_null}
--     floor_div                — {field, divisor, mult} → floor(field/divisor) * mult
--     any_positive             — retorna pts se qualquer fields[] > 0
--     any_true_or_positive     — retorna pts se qualquer fields_true[] true OU fields_positive[] > 0
--   Flags em sum.terms[]:
--     mult                     — field * mult
--     when_true                — +mult se field true
--     when_gt0                 — +mult se field > 0
--     override_by              — ignora este termo se o field referenciado é truthy
--   Flags em threshold:
--     null_policy:"zero"       — field null conta como 0 (default: skip → 0 pts implícito)
--     aggregate:{sum_of:[...]} — campo sintético: field avaliado como soma de outros fields
-- Bypass de RLS: `set local row_security = off` dentro da transação, dependendo de
-- BYPASSRLS do role executor (postgres em `supabase db reset`). Service_role também
-- tem BYPASSRLS e passaria; student authenticated não executa seeds.

begin;
set local row_security = off;

-- =============================================================================
-- 1. Instituições (upsert por name)
-- =============================================================================

insert into public.institutions (name, short_name, state) values
  ('UNICAMP',  'UNICAMP',       'SP'),
  ('USP-SP',   'USP-SP',        'SP'),
  ('PSU-MG',   'PSU-MG',        'MG'),
  ('FMABC',    'FMABC',         'SP'),
  ('EINSTEIN', 'Einstein',      'SP'),
  ('SCMSP',    'Santa Casa SP', 'SP'),
  ('SES-PE',   'SES-PE',        'PE'),
  ('SES-DF',   'SES-DF',        'DF'),
  ('SCM-BH',   'Santa Casa BH', 'MG'),
  ('USP-RP',   'USP-RP',        'SP'),
  ('UFPA',     'UFPA',          'PA')
on conflict (name) do update
  set short_name = excluded.short_name,
      state      = excluded.state;

-- =============================================================================
-- 2. Scoring rules — upsert por (institution_id, field_key) WHERE specialty_id IS NULL
-- =============================================================================

-- -----------------------------------------------------------------------------
-- UNICAMP (base 100) — 9 regras
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'UNICAMP')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Pesquisa', 'ic', 20, 20,
    'Bolsa Oficial: 20 pts | Voluntária: 10 pts',
    '{"op":"sum","caps":{"total":20},"terms":[{"field":"ic_com_bolsa","mult":20},{"field":"ic_sem_bolsa","mult":10}]}'::jsonb),
  ((select id from inst), null, 'Publicações', 'publicacoes', 15, 15,
    'Autor principal indexado: 10 pts | Coautor/Nacional: 2 a 5 pts',
    '{"op":"sum","caps":{"total":15},"terms":[{"field":"artigos_high_impact","mult":10},{"field":"artigos_mid_impact","mult":5},{"field":"artigos_nacionais","mult":2}]}'::jsonb),
  ((select id from inst), null, 'Eventos', 'apresentacao_congresso', 10, 10,
    'Apresentação oral ou Pôster (2,5 pts cada)',
    '{"op":"sum","caps":{"total":10},"terms":[{"field":"apresentacao_congresso","mult":2.5}]}'::jsonb),
  ((select id from inst), null, 'Extensão', 'voluntariado', 5, 5,
    'Carga horária > 96h (5 pts) | > 48h (2 pts)',
    '{"op":"threshold","field":"voluntariado_horas","brackets":[{"gte":96,"pts":5},{"gte":48,"pts":2}]}'::jsonb),
  ((select id from inst), null, 'Ligas', 'ligas', 5, 5,
    'Cargo de Gestão/Diretoria (5 pts) | Membro (2 pts)',
    '{"op":"sum","caps":{"total":5},"terms":[{"field":"diretoria_ligas","mult":5},{"field":"membro_liga_anos","mult":2}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'monitoria', 5, 5,
    'Duração > 2 semestres (5 pts) | 1 a 2 semestres (2 pts)',
    '{"op":"threshold","field":"monitoria_semestres","brackets":[{"gt":2,"pts":5},{"gt":0,"pts":2}]}'::jsonb),
  ((select id from inst), null, 'Cursos', 'cursos_suporte', 5, 5,
    'Cursos de Suporte (2,5 pts cada)',
    '{"op":"sum","caps":{"total":5},"terms":[{"field":"cursos_suporte","mult":2.5}]}'::jsonb),
  ((select id from inst), null, 'Idiomas', 'ingles_fluente', 10, 10,
    'Certificado de Proficiência em Inglês (10 pts)',
    '{"op":"bool","field":"ingles_fluente","pts_true":10}'::jsonb),
  ((select id from inst), null, 'Formação', 'formacao', 25, 25,
    'Internato Próprio (10 pts) | Mestrado (10 pts) | Doutorado (15 pts)',
    '{"op":"sum","caps":{"total":25},"terms":[{"field":"internato_hospital_ensino","when_true":10},{"field":"mestrado","when_true":10,"override_by":"doutorado"},{"field":"doutorado","when_true":15}]}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- USP-SP (base 100) — 10 regras
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'USP-SP')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Instituição', 'instituicao_origem', 15, 15,
    'Hospital de Ensino Próprio (10 pts) | Top 35 RUF (5 pts)',
    '{"op":"sum","caps":{"total":15},"terms":[{"field":"internato_hospital_ensino","when_true":10},{"field":"ranking_ruf_top35","when_true":5}]}'::jsonb),
  ((select id from inst), null, 'Publicações', 'publicacoes', 15, 15,
    'Alto impacto: 10 pts | Baixo impacto: 2 pts',
    '{"op":"sum","caps":{"total":15},"terms":[{"field":"artigos_high_impact","mult":10},{"field":"artigos_mid_impact","mult":5},{"field":"artigos_low_impact","mult":2}]}'::jsonb),
  ((select id from inst), null, 'Pesquisa', 'ic', 14, 14,
    'Com bolsa Oficial: 7 pts/ano | Sem bolsa: 3 pts/ano',
    '{"op":"sum","caps":{"total":14},"terms":[{"field":"ic_com_bolsa","mult":7},{"field":"ic_sem_bolsa","mult":3}]}'::jsonb),
  ((select id from inst), null, 'Eventos', 'congressos', 10, 10,
    'Apresentação (3 pts) | Ouvinte (1 pt)',
    '{"op":"sum","caps":{"total":10},"terms":[{"field":"apresentacao_congresso","mult":3},{"field":"ouvinte_congresso","mult":1}]}'::jsonb),
  ((select id from inst), null, 'Extensão', 'extensao', 10, 10,
    'Voluntariado (4 pts) | Projeto Rondon (4 pts)',
    '{"op":"sum","caps":{"total":10},"terms":[{"field":"extensao_semestres","mult":2},{"field":"voluntariado_horas","when_gt0":4},{"field":"projeto_rondon","when_true":4}]}'::jsonb),
  ((select id from inst), null, 'Representação', 'ligas_rep', 10, 10,
    'Centro Acadêmico (4 pts) | Diretoria de Ligas (3 pts)',
    '{"op":"sum","caps":{"total":10},"terms":[{"field":"diretoria_ligas","mult":3},{"field":"representante_turma_anos","mult":4}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'monitoria', 4, 4,
    'Monitoria Oficial (2 pts por semestre)',
    '{"op":"sum","caps":{"total":4},"terms":[{"field":"monitoria_semestres","mult":2}]}'::jsonb),
  ((select id from inst), null, 'Cursos', 'cursos_suporte', 4, 4,
    'ACLS, ATLS ou PALS (2 pts por curso validado)',
    '{"op":"sum","caps":{"total":4},"terms":[{"field":"cursos_suporte","mult":2}]}'::jsonb),
  ((select id from inst), null, 'Idiomas', 'ingles_fluente', 10, 10,
    'Certificação Oficial de Proficiência (10 pts)',
    '{"op":"bool","field":"ingles_fluente","pts_true":10}'::jsonb),
  ((select id from inst), null, 'Histórico', 'media_geral', 8, 8,
    'Média Global Ponderada >= 8,0 ou 80% (8 pts)',
    '{"op":"threshold","field":"media_geral","null_policy":"zero","brackets":[{"gte":80,"pts":8}]}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- PSU-MG (base 10.0) — 7 regras
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'PSU-MG')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Histórico', 'historico', 1.5, 1.5,
    'Conceito A ou >85% (1.5) | B ou >80% (1.0) | C ou >70% (0.5)',
    '{"op":"threshold","field":"media_geral","null_policy":"zero","brackets":[{"gte":85,"pts":1.5},{"gte":80,"pts":1.0},{"gt":0,"pts":0.5}]}'::jsonb),
  ((select id from inst), null, 'Pesquisa', 'ic', 2.0, 2.0,
    'Com bolsa (0.5/ano) | Sem bolsa (0.3/ano)',
    '{"op":"sum","caps":{"total":2.0},"terms":[{"field":"ic_com_bolsa","mult":0.5},{"field":"ic_sem_bolsa","mult":0.3}]}'::jsonb),
  ((select id from inst), null, 'Publicações', 'publicacoes', 2.0, 2.0,
    'Artigos em revistas indexadas (0.7 por publicação)',
    '{"op":"sum","caps":{"total":2.0},"terms":[{"field":"artigos_high_impact","mult":0.7},{"field":"artigos_mid_impact","mult":0.7},{"field":"artigos_low_impact","mult":0.7},{"field":"artigos_nacionais","mult":0.7}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'monitoria', 1.0, 1.0,
    'Mínimo 1 semestre oficial (1.0 pt)',
    '{"op":"threshold","field":"monitoria_semestres","brackets":[{"gte":1,"pts":1.0}]}'::jsonb),
  ((select id from inst), null, 'Extensão', 'ligas_ext', 4.0, 4.0,
    'Projetos (0.7) | Membro Liga (0.8) | Diretoria (0.3)',
    '{"op":"sum","caps":{"total":4.0},"terms":[{"field":"membro_liga_anos","mult":0.8},{"field":"diretoria_ligas","mult":0.3},{"field":"extensao_semestres","mult":0.7}]}'::jsonb),
  ((select id from inst), null, 'Estágio', 'estagio', 1.0, 1.0,
    'Carga horária >180h (1.0) | Carga horária >90h (0.5)',
    '{"op":"threshold","field":"estagio_extracurricular_horas","brackets":[{"gte":180,"pts":1.0},{"gte":90,"pts":0.5}]}'::jsonb),
  ((select id from inst), null, 'Idiomas', 'idiomas', 2.5, 2.5,
    'Inglês/Espanhol (1.5) | Cursos Suporte (0.7)',
    '{"op":"sum","caps":{"total":2.5},"terms":[{"field":"ingles_fluente","when_true":1.5},{"field":"cursos_suporte","mult":0.7}]}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- FMABC (base 10.0) — 4 regras (blocos compostos — ver calculations.ts)
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'FMABC')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Extracurriculares', 'bloco_extra', 4.0, 4.0,
    'Teste Progresso (1.0) | Estágio >120h (1.0) | Ligas/Social/Rep/ACLS (0.5 cada)',
    '{"op":"composite","caps":{"total":4.0},"groups":[{"op":"threshold","field":"teste_progresso","brackets":[{"gte":4,"pts":1.0},{"gte":1,"pts":0.5}]},{"op":"threshold","field":"estagio_extracurricular_horas","brackets":[{"gte":120,"pts":1.0}]},{"op":"any_positive","fields":["diretoria_ligas","membro_liga_anos"],"pts":0.5},{"op":"any_true_or_positive","fields_true":["projeto_rondon"],"fields_positive":["voluntariado_horas"],"pts":0.5},{"op":"threshold","field":"representante_turma_anos","brackets":[{"gte":1,"pts":0.5}]},{"op":"threshold","field":"cursos_suporte","brackets":[{"gte":1,"pts":0.5}]}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'bloco_monitoria', 1.5, 1.5,
    'Duração de 1 ano: 1.0 pt | Duração 1 semestre: 0.5 pt',
    '{"op":"custom","fn":"fmabc_monitoria","caps":{"total":1.5},"field":"monitoria_semestres","description":"floor(sem/2)*1.0 + (sem%2)*0.5, cap 1.5"}'::jsonb),
  ((select id from inst), null, 'Científico', 'bloco_cientifico', 4.0, 4.0,
    'Artigos/Apresentações: até 1.0 pt | IC > 1 ano: 1.0 pt | Ouvinte: 0.5 pt',
    '{"op":"composite","caps":{"total":4.0},"groups":[{"op":"threshold","field":"artigos_total","brackets":[{"gte":2,"pts":1.0},{"gte":1,"pts":0.5}],"aggregate":{"sum_of":["artigos_high_impact","artigos_mid_impact","artigos_low_impact","artigos_nacionais"]}},{"op":"threshold","field":"apresentacao_congresso","brackets":[{"gte":2,"pts":1.0},{"gte":1,"pts":0.5}]},{"op":"threshold","field":"organizador_evento","brackets":[{"gte":1,"pts":0.5}]},{"op":"threshold","field":"ouvinte_congresso","brackets":[{"gte":4,"pts":0.5},{"gte":1,"pts":0.25}]},{"op":"any_positive","fields":["ic_com_bolsa","ic_sem_bolsa"],"pts":1.0}]}'::jsonb),
  ((select id from inst), null, 'Idiomas', 'bloco_idioma', 0.5, 0.5,
    'Fluência comprovada (Inglês): 0.5 pt',
    '{"op":"bool","field":"ingles_fluente","pts_true":0.5}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- EINSTEIN (base 100) — 3 regras
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'EINSTEIN')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Publicações', 'publicacoes', 70, 70,
    '1º Autor Qualis A/JCR>3.0 (35pts) | JCR 0.5-3.0 (15pts) | Outros (5pts) | Nacionais (2pts)',
    '{"op":"sum","caps":{"total":70},"terms":[{"field":"artigos_high_impact","mult":35},{"field":"artigos_mid_impact","mult":15},{"field":"artigos_low_impact","mult":5},{"field":"artigos_nacionais","mult":2}]}'::jsonb),
  ((select id from inst), null, 'Pesquisa', 'ic_horas_totais', 30, 30,
    'CH >400h (30pts) | >300h (25pts) | >200h (20pts) | >100h (15pts)',
    '{"op":"tiered","field":"ic_horas_totais","tiers":[{"gte":400,"pts":30},{"gte":300,"pts":25},{"gte":200,"pts":20},{"gte":100,"pts":15},{"gt":0,"pts":5}]}'::jsonb),
  ((select id from inst), null, 'Pós-Graduação', 'pos_graduacao', 30, 30,
    'Doutorado concluído (30 pts) | Mestrado concluído (25 pts)',
    '{"op":"sum","caps":{"total":30},"terms":[{"field":"doutorado","when_true":30},{"field":"mestrado","when_true":25,"override_by":"doutorado"}]}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- SCMSP (base 100) — 9 regras
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'SCMSP')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Formação', 'formacao', 30, 30,
    'Top 35 RUF: 20pts (Outras 5pts) | Internato próprio: 10pts',
    '{"op":"composite","caps":{"total":30},"groups":[{"op":"bool","field":"internato_hospital_ensino","pts_true":10},{"op":"ruf_branch","field":"ranking_ruf_top35","pts_true":20,"pts_false":5,"pts_null":0}]}'::jsonb),
  ((select id from inst), null, 'Publicações', 'publicacoes', 10, 10,
    '10 pts por artigo publicado',
    '{"op":"sum","caps":{"total":10},"terms":[{"field":"artigos_high_impact","mult":10},{"field":"artigos_mid_impact","mult":10},{"field":"artigos_low_impact","mult":10}]}'::jsonb),
  ((select id from inst), null, 'Pesquisa', 'ic', 10, 10,
    '10 pts se possuir IC com bolsa',
    '{"op":"threshold","field":"ic_com_bolsa","brackets":[{"gt":0,"pts":10}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'monitoria', 10, 10,
    '10 pts se possui histórico',
    '{"op":"threshold","field":"monitoria_semestres","brackets":[{"gt":0,"pts":10}]}'::jsonb),
  ((select id from inst), null, 'Ligas', 'ligas', 10, 10,
    '10 pts se participou ativamente',
    '{"op":"any_positive","fields":["diretoria_ligas","membro_liga_anos"],"pts":10}'::jsonb),
  ((select id from inst), null, 'Extensão', 'voluntariado', 5, 5,
    '5 pts se possui horas',
    '{"op":"threshold","field":"voluntariado_horas","brackets":[{"gt":0,"pts":5}]}'::jsonb),
  ((select id from inst), null, 'Idiomas', 'ingles_fluente', 10, 10,
    'Inglês Fluente: 10 pts',
    '{"op":"bool","field":"ingles_fluente","pts_true":10}'::jsonb),
  ((select id from inst), null, 'Eventos', 'apresentacao_congresso', 10, 10,
    'Apresentações: 5 pts cada',
    '{"op":"sum","caps":{"total":10},"terms":[{"field":"apresentacao_congresso","mult":5}]}'::jsonb),
  ((select id from inst), null, 'Cursos', 'cursos_suporte', 5, 5,
    '5 pts se possui',
    '{"op":"sum","caps":{"total":5},"terms":[{"field":"cursos_suporte","mult":5}]}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- SES-PE (base 100) — 7 regras
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'SES-PE')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Publicações', 'publicacoes', 10, 10,
    'Artigo: 5 pts | Apresentação: 2,5 pts',
    '{"op":"sum","caps":{"total":10},"terms":[{"field":"artigos_high_impact","mult":5},{"field":"artigos_mid_impact","mult":5},{"field":"artigos_low_impact","mult":5},{"field":"artigos_nacionais","mult":5},{"field":"apresentacao_congresso","mult":2.5}]}'::jsonb),
  ((select id from inst), null, 'Pesquisa', 'ic', 15, 15,
    '5 pts por projeto/ano',
    '{"op":"sum","caps":{"total":15},"terms":[{"field":"ic_com_bolsa","mult":5},{"field":"ic_sem_bolsa","mult":5}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'monitoria', 15, 15,
    '5 pts por semestre',
    '{"op":"sum","caps":{"total":15},"terms":[{"field":"monitoria_semestres","mult":5}]}'::jsonb),
  ((select id from inst), null, 'Extensão', 'extensao', 20, 20,
    '5 pts/semestre | Rondon: 10 pts',
    '{"op":"sum","caps":{"total":20},"terms":[{"field":"extensao_semestres","mult":5},{"field":"projeto_rondon","when_true":10}]}'::jsonb),
  ((select id from inst), null, 'Histórico', 'media_geral', 30, 30,
    '>=85: 30pts | >=80: 25pts | <70: 10pts',
    '{"op":"threshold","field":"media_geral","null_policy":"zero","brackets":[{"gte":85,"pts":30},{"gte":80,"pts":25},{"gte":75,"pts":20},{"gte":70,"pts":15},{"gt":0,"pts":10}]}'::jsonb),
  ((select id from inst), null, 'Ligas', 'ligas', 5, 5,
    '2,5 pts por ano',
    '{"op":"sum","caps":{"total":5},"terms":[{"field":"membro_liga_anos","mult":2.5}]}'::jsonb),
  ((select id from inst), null, 'Idiomas', 'ingles_fluente', 5, 5,
    'Inglês Fluente: 5 pts',
    '{"op":"bool","field":"ingles_fluente","pts_true":5}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- SES-DF (base 10.0) — 10 regras
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'SES-DF')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Publicações', 'publicacoes', 1.0, 1.0,
    'Artigo: 0.5 | Apres: 0.2',
    '{"op":"sum","caps":{"total":1.0},"terms":[{"field":"artigos_high_impact","mult":0.5},{"field":"artigos_mid_impact","mult":0.5},{"field":"artigos_low_impact","mult":0.5},{"field":"apresentacao_congresso","mult":0.2}]}'::jsonb),
  ((select id from inst), null, 'Pesquisa', 'ic', 1.0, 1.0,
    '0.5 por projeto',
    '{"op":"sum","caps":{"total":1.0},"terms":[{"field":"ic_com_bolsa","mult":0.5},{"field":"ic_sem_bolsa","mult":0.5}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'monitoria', 1.0, 1.0,
    '0.5 por semestre',
    '{"op":"sum","caps":{"total":1.0},"terms":[{"field":"monitoria_semestres","mult":0.5}]}'::jsonb),
  ((select id from inst), null, 'Extensão', 'extensao', 1.0, 1.0,
    '0.5 por projeto',
    '{"op":"sum","caps":{"total":1.0},"terms":[{"field":"extensao_semestres","mult":0.5}]}'::jsonb),
  ((select id from inst), null, 'Social', 'social', 2.0, 2.0,
    'Rondon: 1.0 | Trab. SUS: 0.5 a cada 5m',
    '{"op":"composite","caps":{"total":2.0},"groups":[{"op":"bool","field":"projeto_rondon","pts_true":1.0},{"op":"floor_div","field":"trabalho_sus_meses","divisor":5,"mult":0.5}]}'::jsonb),
  ((select id from inst), null, 'Histórico', 'media_geral', 0.5, 0.5,
    '>= 80: 0.5 pts',
    '{"op":"threshold","field":"media_geral","null_policy":"zero","brackets":[{"gte":80,"pts":0.5}]}'::jsonb),
  ((select id from inst), null, 'Eventos', 'eventos', 1.0, 1.0,
    'Ouvinte: 0.1 | Curso: 0.1',
    '{"op":"sum","caps":{"total":1.0},"terms":[{"field":"ouvinte_congresso","mult":0.1},{"field":"cursos_suporte","mult":0.1}]}'::jsonb),
  ((select id from inst), null, 'Ligas', 'ligas', 1.5, 1.5,
    '0.5 por ano',
    '{"op":"sum","caps":{"total":1.5},"terms":[{"field":"membro_liga_anos","mult":0.5}]}'::jsonb),
  ((select id from inst), null, 'Representação', 'representante', 0.5, 0.5,
    'Se possui: 0.5 pts',
    '{"op":"threshold","field":"representante_turma_anos","brackets":[{"gt":0,"pts":0.5}]}'::jsonb),
  ((select id from inst), null, 'Idiomas', 'ingles_fluente', 0.5, 0.5,
    'Inglês Fluente: 0.5 pts',
    '{"op":"bool","field":"ingles_fluente","pts_true":0.5}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- SCM-BH (base 10.0) — 6 regras
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'SCM-BH')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Publicações', 'publicacoes', 2.0, 2.0,
    'Artigos (0.5 cada) | Apresentações (0.25 cada)',
    '{"op":"sum","caps":{"total":2.0},"terms":[{"field":"artigos_high_impact","mult":0.5},{"field":"artigos_mid_impact","mult":0.5},{"field":"artigos_low_impact","mult":0.5},{"field":"artigos_nacionais","mult":0.5},{"field":"apresentacao_congresso","mult":0.25}]}'::jsonb),
  ((select id from inst), null, 'Pesquisa', 'ic', 2.0, 2.0,
    'Com bolsa (0.5/ano) | Sem bolsa (0.25/ano)',
    '{"op":"sum","caps":{"total":2.0},"terms":[{"field":"ic_com_bolsa","mult":0.5},{"field":"ic_sem_bolsa","mult":0.25}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'monitoria', 1.0, 1.0,
    'Mínimo de 1 semestre concluído (1.0 pt)',
    '{"op":"threshold","field":"monitoria_semestres","brackets":[{"gte":1,"pts":1.0}]}'::jsonb),
  ((select id from inst), null, 'Extensão', 'extensao', 4.0, 4.0,
    'Projeto Extensão (0.5/sem) | Liga (0.5/ano)',
    '{"op":"sum","caps":{"total":4.0},"terms":[{"field":"extensao_semestres","mult":0.5},{"field":"membro_liga_anos","mult":0.5}]}'::jsonb),
  ((select id from inst), null, 'Eventos', 'eventos', 1.0, 1.0,
    'Ouvinte em Congresso (0.5 por evento)',
    '{"op":"sum","caps":{"total":1.0},"terms":[{"field":"ouvinte_congresso","mult":0.5}]}'::jsonb),
  ((select id from inst), null, 'Histórico', 'media_geral', 1.0, 1.0,
    'Média Global >= 80% (1.0 pt)',
    '{"op":"threshold","field":"media_geral","null_policy":"zero","brackets":[{"gte":80,"pts":1.0}]}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- USP-RP (base 10.0) — 5 regras
-- -----------------------------------------------------------------------------
with inst as (select id from public.institutions where name = 'USP-RP')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Científico', 'bloco_cientifico', 3.0, 3.0,
    'Artigo (1.0) | Apresentação (0.5) | IC (0.7/ano)',
    '{"op":"sum","caps":{"total":3.0},"terms":[{"field":"artigos_high_impact","mult":1.0},{"field":"artigos_mid_impact","mult":1.0},{"field":"artigos_low_impact","mult":1.0},{"field":"artigos_nacionais","mult":1.0},{"field":"apresentacao_congresso","mult":0.5},{"field":"ic_com_bolsa","mult":0.7},{"field":"ic_sem_bolsa","mult":0.7}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'monitoria', 1.5, 1.5,
    '0.5 pt por semestre de monitoria',
    '{"op":"sum","caps":{"total":1.5},"terms":[{"field":"monitoria_semestres","mult":0.5}]}'::jsonb),
  ((select id from inst), null, 'Representação', 'ligas_rep', 4.0, 4.0,
    'Membro Liga (Max 2.0 - 0.5/ano) | Rep (Max 2.0 - 0.5/ano)',
    '{"op":"composite","caps":{"total":4.0},"groups":[{"op":"sum","caps":{"total":2.0},"terms":[{"field":"membro_liga_anos","mult":0.5}]},{"op":"sum","caps":{"total":2.0},"terms":[{"field":"representante_turma_anos","mult":0.5}]}]}'::jsonb),
  ((select id from inst), null, 'Extensão', 'voluntariado', 0.5, 0.5,
    'Carga horária mínima de 120h (0.5 pt)',
    '{"op":"threshold","field":"voluntariado_horas","brackets":[{"gte":120,"pts":0.5}]}'::jsonb),
  ((select id from inst), null, 'Formação', 'formacao', 1.0, 1.0,
    'Internato em Hospital Próprio/Conveniado (1.0 pt)',
    '{"op":"bool","field":"internato_hospital_ensino","pts_true":1.0}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

-- -----------------------------------------------------------------------------
-- UFPA (base 100) — 5 regras
-- -----------------------------------------------------------------------------
-- Observação: pubs agrega caps independentes (artigos cap 30 + apresentações cap 20);
-- `max_points` da regra = 50 (soma dos caps dos dois grupos), sem cap total externo.
with inst as (select id from public.institutions where name = 'UFPA')
insert into public.scoring_rules
  (institution_id, specialty_id, category, field_key, weight, max_points, description, formula)
values
  ((select id from inst), null, 'Publicações', 'publicacoes', 50, 50,
    'Artigo (10 pts, Max 30) | Apresentação (10 pts, Max 20)',
    '{"op":"composite","caps":{"total":50},"groups":[{"op":"sum","caps":{"total":30},"terms":[{"field":"artigos_high_impact","mult":10},{"field":"artigos_mid_impact","mult":10},{"field":"artigos_low_impact","mult":10},{"field":"artigos_nacionais","mult":10}]},{"op":"sum","caps":{"total":20},"terms":[{"field":"apresentacao_congresso","mult":10}]}]}'::jsonb),
  ((select id from inst), null, 'Pesquisa', 'ic', 21, 21,
    'Com bolsa (6 pts/projeto) | Sem bolsa (5 pts/projeto)',
    '{"op":"sum","caps":{"total":21},"terms":[{"field":"ic_com_bolsa","mult":6},{"field":"ic_sem_bolsa","mult":5}]}'::jsonb),
  ((select id from inst), null, 'Monitoria', 'monitoria', 9, 9,
    '9 pts por semestre de monitoria (Teto 9)',
    '{"op":"sum","caps":{"total":9},"terms":[{"field":"monitoria_semestres","mult":9}]}'::jsonb),
  ((select id from inst), null, 'Extensão', 'extensao', 21, 21,
    '6 pts por semestre de extensão',
    '{"op":"sum","caps":{"total":21},"terms":[{"field":"extensao_semestres","mult":6}]}'::jsonb),
  ((select id from inst), null, 'Idiomas', 'idiomas', 10, 10,
    'Inglês Fluente (5 pts) | Ouvinte em Congresso (1 pt/evento)',
    '{"op":"sum","caps":{"total":10},"terms":[{"field":"ingles_fluente","when_true":5},{"field":"ouvinte_congresso","mult":1}]}'::jsonb)
on conflict (institution_id, field_key) where specialty_id is null do update
  set weight      = excluded.weight,
      max_points  = excluded.max_points,
      description = excluded.description,
      formula     = excluded.formula;

commit;

-- Sanity (comentado — validação formal nos testes pgTAP 0002_rules_engine.test.sql):
-- select count(*) from public.institutions; -- expect 11
-- select count(*) from public.scoring_rules; -- expect 75
-- select i.name, count(sr.id) from public.institutions i
--   left join public.scoring_rules sr on sr.institution_id = i.id
--   group by i.name order by i.name;
