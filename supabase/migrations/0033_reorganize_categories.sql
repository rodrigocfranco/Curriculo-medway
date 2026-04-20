-- 0033_reorganize_categories.sql
-- Reorganizar de 5 categorias para 6 categorias mais claras
-- Antigas: Perfil, Acadêmico, Publicações, Prática/Social, Liderança/Eventos
-- Novas: Formação, Pesquisa e Publicações, Atividades Acadêmicas,
--        Congressos e Formação Complementar, Representação Estudantil e Voluntariado, Qualificações

-- =============================================================================
-- 1. curriculum_fields — atualizar categoria de cada campo
-- =============================================================================

-- Formação (atributos da faculdade/instituição)
UPDATE curriculum_fields SET category = 'Formação' WHERE field_key IN (
  'ranking_ruf_top35', 'faculdade_pos_grad_capes',
  'internato_hospital_ensino', 'nivel_assistencial', 'media_geral'
);

-- Pesquisa e Publicações (output científico + IC)
UPDATE curriculum_fields SET category = 'Pesquisa e Publicações' WHERE field_key IN (
  'publicacoes', 'capitulos_livro',
  'ic_com_bolsa', 'ic_sem_bolsa', 'ic_horas_totais'
);

-- Atividades Acadêmicas (curriculares/extracurriculares)
UPDATE curriculum_fields SET category = 'Atividades Acadêmicas' WHERE field_key IN (
  'monitoria_semestres', 'extensao_semestres',
  'diretoria_ligas', 'membro_liga_anos',
  'premios_academicos', 'cursinhos_preparatorios'
);

-- Congressos e Formação Complementar
UPDATE curriculum_fields SET category = 'Congressos e Formação Complementar' WHERE field_key IN (
  'apresentacoes', 'ouvinte_congresso', 'organizador_evento',
  'cursos_temas_medicos', 'cursos_suporte', 'teste_progresso'
);

-- Representação Estudantil e Voluntariado
UPDATE curriculum_fields SET category = 'Representação Estudantil e Voluntariado' WHERE field_key IN (
  'voluntariado_horas', 'estagio_extracurricular_horas',
  'trabalho_sus_meses', 'projeto_rondon',
  'representante_turma_anos', 'colegiado_institucional_semestres',
  'centro_academico_semestres', 'atletica_semestres', 'equipe_esportiva_semestres'
);

-- Qualificações (títulos e certificações pessoais)
UPDATE curriculum_fields SET category = 'Qualificações' WHERE field_key IN (
  'ingles_fluente', 'mestrado_status', 'doutorado_status',
  'residencia_medica_concluida', 'outro_curso_universitario', 'prova_proficiencia_medicina'
);

-- =============================================================================
-- 2. scoring_rules — atualizar categoria por field_key (todas as instituições)
-- =============================================================================

-- Formação
UPDATE scoring_rules SET category = 'Formação' WHERE field_key IN (
  'ranking_ruf_top35', 'faculdade_pos_grad_capes',
  'internato_hospital_ensino', 'nivel_assistencial', 'media_geral'
);

-- Pesquisa e Publicações
UPDATE scoring_rules SET category = 'Pesquisa e Publicações' WHERE field_key IN (
  'publicacoes', 'capitulos_livro', 'artigo_1_posicao',
  'ic_com_bolsa', 'ic_sem_bolsa', 'ic_horas_totais',
  'artigos_high_impact', 'artigos_nacionais'
);

-- Atividades Acadêmicas
UPDATE scoring_rules SET category = 'Atividades Acadêmicas' WHERE field_key IN (
  'monitoria_semestres', 'extensao_semestres',
  'diretoria_ligas', 'membro_liga_anos',
  'premios_academicos', 'cursinhos_preparatorios'
);

-- Congressos e Formação Complementar
UPDATE scoring_rules SET category = 'Congressos e Formação Complementar' WHERE field_key IN (
  'apresentacoes', 'apresentacao_congresso', 'ouvinte_congresso',
  'organizador_evento', 'cursos_temas_medicos', 'cursos_suporte',
  'teste_progresso'
);

-- Representação Estudantil e Voluntariado
UPDATE scoring_rules SET category = 'Representação Estudantil e Voluntariado' WHERE field_key IN (
  'voluntariado_horas', 'estagio_extracurricular_horas',
  'trabalho_sus_meses', 'projeto_rondon',
  'representante_turma_anos', 'colegiado_institucional_semestres',
  'centro_academico_semestres', 'atletica_semestres', 'equipe_esportiva_semestres'
);

-- Qualificações
UPDATE scoring_rules SET category = 'Qualificações' WHERE field_key IN (
  'ingles_fluente', 'mestrado_status', 'doutorado_status',
  'residencia_medica_concluida', 'outro_curso_universitario', 'prova_proficiencia_medicina'
);

-- =============================================================================
-- 3. Marcar todos os scores stale (breakdown contém category)
-- =============================================================================

UPDATE user_scores SET stale = true;
