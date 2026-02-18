export interface UserProfile {
  // Publicações
  artigos_high_impact: number;
  artigos_mid_impact: number;
  artigos_low_impact: number;
  artigos_nacionais: number;
  capitulos_livro: number;

  // Acadêmico
  ic_com_bolsa: number;
  ic_sem_bolsa: number;
  ic_horas_totais: number;
  monitoria_semestres: number;
  extensao_semestres: number;

  // Prática / Social
  voluntariado_horas: number;
  estagio_extracurricular_horas: number;
  trabalho_sus_meses: number;
  projeto_rondon: boolean;
  internato_hospital_ensino: boolean;

  // Liderança / Eventos
  diretoria_ligas: number;
  membro_liga_anos: number;
  representante_turma_anos: number;
  cursos_suporte: number;
  apresentacao_congresso: number;
  ouvinte_congresso: number;
  organizador_evento: number;
  teste_progresso: number;

  // Perfil
  ingles_fluente: boolean;
  media_geral: number;
  conceito_historico: 'A' | 'B' | 'C' | null;
  ranking_ruf_top35: boolean;
  mestrado: boolean;
  doutorado: boolean;
}

export interface InstitutionScore {
  name: string;
  score: number;
  base: number;
}

export const defaultProfile: UserProfile = {
  artigos_high_impact: 0,
  artigos_mid_impact: 0,
  artigos_low_impact: 0,
  artigos_nacionais: 0,
  capitulos_livro: 0,
  ic_com_bolsa: 0,
  ic_sem_bolsa: 0,
  ic_horas_totais: 0,
  monitoria_semestres: 0,
  extensao_semestres: 0,
  voluntariado_horas: 0,
  estagio_extracurricular_horas: 0,
  trabalho_sus_meses: 0,
  projeto_rondon: false,
  internato_hospital_ensino: false,
  diretoria_ligas: 0,
  membro_liga_anos: 0,
  representante_turma_anos: 0,
  cursos_suporte: 0,
  apresentacao_congresso: 0,
  ouvinte_congresso: 0,
  organizador_evento: 0,
  teste_progresso: 0,
  ingles_fluente: false,
  media_geral: 0,
  conceito_historico: null,
  ranking_ruf_top35: false,
  mestrado: false,
  doutorado: false,
};
