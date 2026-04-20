export interface UserProfile {
  // Formação
  ranking_ruf_top35: string;
  faculdade_pos_grad_capes: string;
  internato_hospital_ensino: string;
  nivel_assistencial: string;
  media_geral: number | null;

  // Pesquisa e Publicações
  publicacoes: Array<{ posicao: string; veiculo: string; fi: number }>;
  capitulos_livro: number | null;
  ic_com_bolsa: number | null;
  ic_sem_bolsa: number | null;
  ic_horas_totais: number | null;

  // Atividades Acadêmicas
  monitoria_semestres: number | null;
  extensao_semestres: number | null;
  diretoria_ligas: number | null;
  membro_liga_anos: number | null;
  premios_academicos: number | null;
  cursinhos_preparatorios: number | null;

  // Congressos e Formação Complementar
  apresentacoes: Array<{ tipo: string; nivel: string }>;
  ouvinte_congresso: number | null;
  organizador_evento: number | null;
  cursos_temas_medicos: number | null;
  cursos_suporte: number | null;
  teste_progresso: number | null;

  // Representação Estudantil e Voluntariado
  voluntariado_horas: number | null;
  estagio_extracurricular_horas: number | null;
  trabalho_sus_meses: number | null;
  projeto_rondon: boolean;
  representante_turma_anos: number | null;
  colegiado_institucional_semestres: number | null;
  centro_academico_semestres: number | null;
  atletica_semestres: number | null;
  equipe_esportiva_semestres: number | null;

  // Qualificações
  ingles_fluente: string;
  mestrado_status: string;
  doutorado_status: string;
  residencia_medica_concluida: boolean;
  outro_curso_universitario: boolean;
  prova_proficiencia_medicina: boolean;
}

export interface DetailItem {
  label: string;
  value: number;
  max: number;
  rule?: string;
}

export interface InstitutionScore {
  name: string;
  score: number;
  base: number;
  details: DetailItem[];
}

export const defaultProfile: UserProfile = {
  publicacoes: [],
  capitulos_livro: null,
  ic_com_bolsa: null,
  ic_sem_bolsa: null,
  ic_horas_totais: null,
  monitoria_semestres: null,
  extensao_semestres: null,
  premios_academicos: null,
  cursinhos_preparatorios: null,
  voluntariado_horas: null,
  estagio_extracurricular_horas: null,
  trabalho_sus_meses: null,
  projeto_rondon: false,
  internato_hospital_ensino: "Não",
  diretoria_ligas: null,
  membro_liga_anos: null,
  representante_turma_anos: null,
  cursos_suporte: null,
  cursos_temas_medicos: null,
  apresentacoes: [],
  ouvinte_congresso: null,
  organizador_evento: null,
  teste_progresso: null,
  colegiado_institucional_semestres: null,
  centro_academico_semestres: null,
  atletica_semestres: null,
  equipe_esportiva_semestres: null,
  ingles_fluente: "Não tenho",
  media_geral: null,
  ranking_ruf_top35: "Demais faculdades",
  faculdade_pos_grad_capes: "Não possui",
  mestrado_status: "Não tenho",
  doutorado_status: "Não tenho",
  nivel_assistencial: "",
  residencia_medica_concluida: false,
  outro_curso_universitario: false,
  prova_proficiencia_medicina: false,
};
