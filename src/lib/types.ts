export interface UserProfile {
  artigos_high_impact: number | null;
  artigos_mid_impact: number | null;
  artigos_low_impact: number | null;
  artigos_nacionais: number | null;
  capitulos_livro: number | null;

  ic_com_bolsa: number | null;
  ic_sem_bolsa: number | null;
  ic_horas_totais: number | null;
  monitoria_semestres: number | null;
  extensao_semestres: number | null;

  voluntariado_horas: number | null;
  estagio_extracurricular_horas: number | null;
  trabalho_sus_meses: number | null;
  projeto_rondon: boolean;
  internato_hospital_ensino: boolean;

  diretoria_ligas: number | null;
  membro_liga_anos: number | null;
  representante_turma_anos: number | null;
  cursos_suporte: number | null;
  apresentacao_congresso: number | null;
  ouvinte_congresso: number | null;
  organizador_evento: number | null;
  teste_progresso: number | null;

  ingles_fluente: boolean;
  media_geral: number | null;
  conceito_historico: 'A' | 'B' | 'C' | null;
  ranking_ruf_top35: boolean;
  mestrado: boolean;
  doutorado: boolean;
}

export interface ScoreBreakdown {
  label: string;
  score: number;
  max: number;
  rule?: string;
}

export interface InstitutionScore {
  name: string;
  score: number;
  base: number;
  breakdown: ScoreBreakdown[];
}

export const defaultProfile: UserProfile = {
  artigos_high_impact: null,
  artigos_mid_impact: null,
  artigos_low_impact: null,
  artigos_nacionais: null,
  capitulos_livro: null,
  ic_com_bolsa: null,
  ic_sem_bolsa: null,
  ic_horas_totais: null,
  monitoria_semestres: null,
  extensao_semestres: null,
  voluntariado_horas: null,
  estagio_extracurricular_horas: null,
  trabalho_sus_meses: null,
  projeto_rondon: false,
  internato_hospital_ensino: false,
  diretoria_ligas: null,
  membro_liga_anos: null,
  representante_turma_anos: null,
  cursos_suporte: null,
  apresentacao_congresso: null,
  ouvinte_congresso: null,
  organizador_evento: null,
  teste_progresso: null,
  ingles_fluente: false,
  media_geral: null,
  conceito_historico: null,
  ranking_ruf_top35: false,
  mestrado: false,
  doutorado: false,
};
