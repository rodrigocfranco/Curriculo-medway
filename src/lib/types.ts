export interface UserProfile {
  // Publicações
  publicacoes: Array<{ posicao: string; fi: number }>;
  artigos_high_impact: number | null;
  artigos_mid_impact: number | null;
  artigos_low_impact: number | null;
  artigos_nacionais: number | null;
  capitulos_livro: number | null;

  // Acadêmico
  ic_projetos: Array<{ bolsa: string; semestres: number; publicacao: boolean }>;
  ic_com_bolsa: number | null;
  ic_sem_bolsa: number | null;
  ic_horas_totais: number | null;
  monitoria_semestres: number | null;
  monitoria_horas_totais: number | null;
  extensao_semestres: number | null;

  // Prática / Social
  voluntariado_horas: number | null;
  estagio_extracurricular_horas: number | null;
  trabalho_sus_meses: number | null;
  projeto_rondon: boolean;
  internato_hospital_ensino: string;

  // Liderança / Eventos
  congressos: Array<{ tipo: string; nivel: string; premio: boolean; primeiro_autor: boolean }>;
  diretoria_ligas: number | null;
  membro_liga_anos: number | null;
  representante_turma_anos: number | null;
  cursos_suporte: number | null;
  apresentacao_congresso: number | null;
  ouvinte_congresso: number | null;
  organizador_evento: number | null;
  teste_progresso: number | null;

  // Perfil
  ingles_fluente: string;
  media_geral: number | null;
  conceito_historico: 'A' | 'B' | 'C' | null;
  ranking_ruf_top35: boolean;
  mestrado_status: string;
  doutorado_status: string;
  nivel_assistencial: string;
  residencia_medica_concluida: boolean;
  outro_curso_universitario: boolean;
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
  artigos_high_impact: null,
  artigos_mid_impact: null,
  artigos_low_impact: null,
  artigos_nacionais: null,
  capitulos_livro: null,
  ic_projetos: [],
  ic_com_bolsa: null,
  ic_sem_bolsa: null,
  ic_horas_totais: null,
  monitoria_semestres: null,
  monitoria_horas_totais: null,
  extensao_semestres: null,
  voluntariado_horas: null,
  estagio_extracurricular_horas: null,
  trabalho_sus_meses: null,
  projeto_rondon: false,
  internato_hospital_ensino: "Não",
  congressos: [],
  diretoria_ligas: null,
  membro_liga_anos: null,
  representante_turma_anos: null,
  cursos_suporte: null,
  apresentacao_congresso: null,
  ouvinte_congresso: null,
  organizador_evento: null,
  teste_progresso: null,
  ingles_fluente: "Não tenho",
  media_geral: null,
  conceito_historico: null,
  ranking_ruf_top35: false,
  mestrado_status: "Não tenho",
  doutorado_status: "Não tenho",
  nivel_assistencial: "",
  residencia_medica_concluida: false,
  outro_curso_universitario: false,
};
