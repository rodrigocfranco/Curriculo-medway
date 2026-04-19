-- test_students.sql
-- Alunos de teste com currículos variados para validação

-- Criar usuários no auth.users primeiro (Supabase local)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES
  ('aaaaaaaa-0001-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000',
   'teste.completo@teste.com', crypt('Teste123!', gen_salt('bf')), now(),
   '{"name": "Teste Completo", "phone": "(11) 99999-0001", "state": "SP", "university": "USP", "graduation_year": 2025, "specialty_interest": "Clínica Médica"}'::jsonb,
   'authenticated', 'authenticated', now(), now()),

  ('aaaaaaaa-0002-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000',
   'teste.parcial@teste.com', crypt('Teste123!', gen_salt('bf')), now(),
   '{"name": "Teste Parcial", "phone": "(21) 99999-0002", "state": "RJ", "university": "UERJ", "graduation_year": 2026, "specialty_interest": "Cirurgia Geral"}'::jsonb,
   'authenticated', 'authenticated', now(), now()),

  ('aaaaaaaa-0003-4000-a000-000000000003', '00000000-0000-0000-0000-000000000000',
   'teste.minimo@teste.com', crypt('Teste123!', gen_salt('bf')), now(),
   '{"name": "Teste Mínimo", "phone": "(31) 99999-0003", "state": "MG", "university": "UFMG", "graduation_year": 2025}'::jsonb,
   'authenticated', 'authenticated', now(), now()),

  ('aaaaaaaa-0004-4000-a000-000000000004', '00000000-0000-0000-0000-000000000000',
   'teste.vazio@teste.com', crypt('Teste123!', gen_salt('bf')), now(),
   '{"name": "Teste Sem Currículo", "phone": "(41) 99999-0004", "state": "PR", "university": "UFPR", "graduation_year": 2027}'::jsonb,
   'authenticated', 'authenticated', now(), now()),

  ('aaaaaaaa-0005-4000-a000-000000000005', '00000000-0000-0000-0000-000000000000',
   'teste.publicacoes@teste.com', crypt('Teste123!', gen_salt('bf')), now(),
   '{"name": "Teste Publicações", "phone": "(71) 99999-0005", "state": "BA", "university": "UFBA", "graduation_year": 2025, "specialty_interest": "Dermatologia"}'::jsonb,
   'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Criar perfis (trigger handle_new_user cria automaticamente, mas vamos garantir)
INSERT INTO profiles (id, name, email, phone, state, university, graduation_year, specialty_interest, role)
VALUES
  ('aaaaaaaa-0001-4000-a000-000000000001', 'Teste Completo', 'teste.completo@teste.com', '(11) 99999-0001', 'SP', 'USP', 2025, 'Clínica Médica', 'student'),
  ('aaaaaaaa-0002-4000-a000-000000000002', 'Teste Parcial', 'teste.parcial@teste.com', '(21) 99999-0002', 'RJ', 'UERJ', 2026, 'Cirurgia Geral', 'student'),
  ('aaaaaaaa-0003-4000-a000-000000000003', 'Teste Mínimo', 'teste.minimo@teste.com', '(31) 99999-0003', 'MG', 'UFMG', 2025, null, 'student'),
  ('aaaaaaaa-0004-4000-a000-000000000004', 'Teste Sem Currículo', 'teste.vazio@teste.com', '(41) 99999-0004', 'PR', 'UFPR', 2027, null, 'student'),
  ('aaaaaaaa-0005-4000-a000-000000000005', 'Teste Publicações', 'teste.publicacoes@teste.com', '(71) 99999-0005', 'BA', 'UFBA', 2025, 'Dermatologia', 'student')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  state = EXCLUDED.state,
  university = EXCLUDED.university,
  graduation_year = EXCLUDED.graduation_year,
  specialty_interest = EXCLUDED.specialty_interest,
  role = EXCLUDED.role;

-- Currículo 1: Teste Completo — aluno top, tudo preenchido
INSERT INTO user_curriculum (user_id, data) VALUES
('aaaaaaaa-0001-4000-a000-000000000001', '{
  "publicacoes": [
    {"posicao": "1º Autor / Último autor", "veiculo": "PubMed", "fi": 3.5},
    {"posicao": "Coautor", "veiculo": "SCIELO/SCOPUS", "fi": 1.2},
    {"posicao": "1º Autor / Último autor", "veiculo": "Periódico nacional", "fi": 0}
  ],
  "capitulos_livro": 1,
  "ic_com_bolsa": 2,
  "ic_sem_bolsa": 1,
  "ic_horas_totais": 450,
  "monitoria_semestres": 4,
  "extensao_semestres": 3,
  "premios_academicos": 2,
  "cursinhos_preparatorios": 1,
  "voluntariado_horas": 120,
  "estagio_extracurricular_horas": 300,
  "trabalho_sus_meses": 12,
  "projeto_rondon": true,
  "internato_hospital_ensino": "Próprio",
  "diretoria_ligas": 2,
  "membro_liga_anos": 3,
  "representante_turma_anos": 2,
  "cursos_suporte": 3,
  "cursos_temas_medicos": 4,
  "apresentacao_congresso": 5,
  "ouvinte_congresso": 8,
  "organizador_evento": 2,
  "teste_progresso": 3,
  "colegiado_institucional_semestres": 2,
  "centro_academico_semestres": 4,
  "atletica_semestres": 2,
  "equipe_esportiva_semestres": 0,
  "ingles_fluente": "Avançado",
  "media_geral": 8.7,
  "ranking_ruf_top35": true,
  "mestrado_status": "Concluído",
  "doutorado_status": "Em curso",
  "nivel_assistencial": "Primário, secundário e terciário",
  "residencia_medica_concluida": false,
  "outro_curso_universitario": false,
  "prova_proficiencia_medicina": true
}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data;

-- Currículo 2: Teste Parcial — aluno médio, metade preenchido
INSERT INTO user_curriculum (user_id, data) VALUES
('aaaaaaaa-0002-4000-a000-000000000002', '{
  "publicacoes": [
    {"posicao": "Coautor", "veiculo": "Anais congresso nacional", "fi": 0}
  ],
  "capitulos_livro": 0,
  "ic_com_bolsa": 1,
  "ic_sem_bolsa": 0,
  "ic_horas_totais": 200,
  "monitoria_semestres": 2,
  "extensao_semestres": 1,
  "voluntariado_horas": 50,
  "estagio_extracurricular_horas": 180,
  "projeto_rondon": false,
  "internato_hospital_ensino": "Conveniado",
  "diretoria_ligas": 0,
  "membro_liga_anos": 2,
  "cursos_suporte": 1,
  "apresentacao_congresso": 2,
  "ouvinte_congresso": 4,
  "ingles_fluente": "Intermediário",
  "media_geral": 7.5,
  "ranking_ruf_top35": false,
  "mestrado_status": "Não tenho",
  "doutorado_status": "Não tenho"
}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data;

-- Currículo 3: Teste Mínimo — poucos dados
INSERT INTO user_curriculum (user_id, data) VALUES
('aaaaaaaa-0003-4000-a000-000000000003', '{
  "publicacoes": [],
  "ic_com_bolsa": 0,
  "monitoria_semestres": 1,
  "internato_hospital_ensino": "Não",
  "ingles_fluente": "Não tenho",
  "media_geral": 6.5,
  "mestrado_status": "Não tenho",
  "doutorado_status": "Não tenho"
}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data;

-- Currículo 4: Teste Sem Currículo — NÃO inserir (sem row em user_curriculum)

-- Currículo 5: Teste Publicações — forte em publicações, fraco no resto
INSERT INTO user_curriculum (user_id, data) VALUES
('aaaaaaaa-0005-4000-a000-000000000005', '{
  "publicacoes": [
    {"posicao": "1º Autor / Último autor", "veiculo": "PubMed", "fi": 5.2},
    {"posicao": "1º Autor / Último autor", "veiculo": "PubMed", "fi": 2.8},
    {"posicao": "1º Autor / Último autor", "veiculo": "SCIELO/SCOPUS", "fi": 1.5},
    {"posicao": "Coautor", "veiculo": "PubMed", "fi": 4.1},
    {"posicao": "Coautor", "veiculo": "Anais congresso internacional", "fi": 0}
  ],
  "capitulos_livro": 2,
  "ic_com_bolsa": 0,
  "monitoria_semestres": 0,
  "internato_hospital_ensino": "Não",
  "ingles_fluente": "Avançado",
  "media_geral": 7.0,
  "mestrado_status": "Em curso",
  "doutorado_status": "Não tenho"
}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data;

-- Marcar todos os scores como stale para forçar recálculo
UPDATE user_scores SET stale = true;
