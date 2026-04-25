-- supabase/seeds/curriculum_fields.sql
-- Story 1.10: Catálogo de campos do currículo (29 fields, 5 categorias).
-- Fonte canônica: src/lib/types.ts (UserProfile). Labels curados a partir de
-- src/lib/calculations.ts + significado semântico das chaves.
-- Idempotente: rodar 2x não duplica, atualiza label/category/type/options/order.
--
-- Carregado por `supabase db reset` via config.toml [db.seed]
-- sql_paths = ["./seeds/rules_engine.sql", "./seeds/curriculum_fields.sql"] (ordem explícita).

insert into public.curriculum_fields (category, field_key, label, field_type, options, display_order) values
  -- Publicações (5)
  ('Publicações','artigos_high_impact','Artigos de alto impacto (1º autor, indexado)','number',null,10),
  ('Publicações','artigos_mid_impact','Artigos de médio impacto / coautoria indexada','number',null,20),
  ('Publicações','artigos_low_impact','Artigos de baixo impacto','number',null,30),
  ('Publicações','artigos_nacionais','Artigos em periódicos nacionais','number',null,40),
  ('Publicações','capitulos_livro','Capítulos de livro publicados','number',null,50),
  -- Acadêmico (5)
  ('Acadêmico','ic_com_bolsa','Iniciações científicas com bolsa (anos)','number',null,10),
  ('Acadêmico','ic_sem_bolsa','Iniciações científicas sem bolsa (anos)','number',null,20),
  ('Acadêmico','ic_horas_totais','Horas totais de IC','number',null,30),
  ('Acadêmico','monitoria_semestres','Semestres de monitoria oficial','number',null,40),
  ('Acadêmico','extensao_semestres','Semestres de extensão universitária','number',null,50),
  -- Prática/Social (5)
  ('Prática/Social','voluntariado_horas','Horas de voluntariado','number',null,10),
  ('Prática/Social','estagio_extracurricular_horas','Horas de estágio extracurricular','number',null,20),
  ('Prática/Social','trabalho_sus_meses','Meses de trabalho no SUS','number',null,30),
  ('Prática/Social','projeto_rondon','Participou do Projeto Rondon','boolean',null,40),
  ('Prática/Social','internato_hospital_ensino','Internato em hospital de ensino próprio','boolean',null,50),
  -- Liderança/Eventos (8)
  ('Liderança/Eventos','diretoria_ligas','Cargos em diretoria de ligas','number',null,10),
  ('Liderança/Eventos','membro_liga_anos','Anos como membro de liga','number',null,20),
  ('Liderança/Eventos','representante_turma_anos','Anos como representante de turma','number',null,30),
  ('Liderança/Eventos','cursos_suporte','Cursos de suporte de vida (ACLS, ATLS, PALS)','number',null,40),
  ('Liderança/Eventos','apresentacao_congresso','Apresentações em congressos','number',null,50),
  ('Liderança/Eventos','ouvinte_congresso','Participações como ouvinte em congressos','number',null,60),
  ('Liderança/Eventos','organizador_evento','Eventos organizados','number',null,70),
  ('Liderança/Eventos','teste_progresso','Testes de progresso realizados','number',null,80),
  -- Perfil (6)
  ('Perfil','ingles_fluente','Inglês fluente (certificação oficial)','boolean',null,10),
  ('Perfil','media_geral','Média geral no histórico (escala 0 a 10)','number',null,20),
  ('Perfil','conceito_historico','Conceito global do histórico','select','["A","B","C"]'::jsonb,30),
  ('Perfil','ranking_ruf_top35','Faculdade no Top 35 RUF','boolean',null,40),
  ('Perfil','mestrado','Mestrado concluído','boolean',null,50),
  ('Perfil','doutorado','Doutorado concluído','boolean',null,60)
on conflict (field_key) do update set
  label = excluded.label,
  category = excluded.category,
  field_type = excluded.field_type,
  options = excluded.options,
  display_order = excluded.display_order;
