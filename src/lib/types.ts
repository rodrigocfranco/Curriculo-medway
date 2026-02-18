export interface CurriculumData {
  // Publicações e Pesquisa
  artigos_pub_high_impact: number;
  artigos_pub_mid_impact: number;
  artigos_pub_low_impact: number;
  artigos_nacionais: number;
  capitulos_livro: number;
  ic_com_bolsa: number;
  ic_sem_bolsa: number;
  ic_horas_totais: number;

  // Acadêmico e Ensino
  monitoria_semestres: number;
  extensao_semestres: number;
  voluntariado_horas: number;
  diretor_ligas: number;
  membro_liga: number;
  representante_turma: number;
  cursos_suporte: number;
  estagio_extracurricular: number;

  // Eventos
  apresentacao_congresso: number;
  ouvinte_congresso: number;
  organizador_evento: number;

  // Perfil e Formação
  ingles_fluente: boolean;
  media_geral_notas: number;
  conceito_historico: number; // 1=A, 2=B, 3=C
  ranking_ruf_top35: boolean;
  mestrado_concluido: boolean;
  doutorado_concluido: boolean;
  internato_hospital_ensino: boolean;
  tempo_trabalho_sus: number;
  projeto_rondon: boolean;
  testes_progresso: number;
}

export interface CategoryScore {
  label: string;
  score: number;
  max: number;
}

export interface InstitutionResult {
  name: string;
  total: number;
  maxTotal: number;
  categories: CategoryScore[];
  isDecimal: boolean;
}

export const defaultData: CurriculumData = {
  artigos_pub_high_impact: 0,
  artigos_pub_mid_impact: 0,
  artigos_pub_low_impact: 0,
  artigos_nacionais: 0,
  capitulos_livro: 0,
  ic_com_bolsa: 0,
  ic_sem_bolsa: 0,
  ic_horas_totais: 0,
  monitoria_semestres: 0,
  extensao_semestres: 0,
  voluntariado_horas: 0,
  diretor_ligas: 0,
  membro_liga: 0,
  representante_turma: 0,
  cursos_suporte: 0,
  estagio_extracurricular: 0,
  apresentacao_congresso: 0,
  ouvinte_congresso: 0,
  organizador_evento: 0,
  ingles_fluente: false,
  media_geral_notas: 0,
  conceito_historico: 1,
  ranking_ruf_top35: false,
  mestrado_concluido: false,
  doutorado_concluido: false,
  internato_hospital_ensino: false,
  tempo_trabalho_sus: 0,
  projeto_rondon: false,
  testes_progresso: 0,
};
