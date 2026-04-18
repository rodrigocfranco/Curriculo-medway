import { z } from "zod";

/**
 * Schema do currículo do aluno.
 * Inclui campos simples (number, boolean, select) e listas dinâmicas
 * (article_list, event_list, project_list).
 * Fallback z.record() para campos adicionais futuros via admin.
 */

// ---------------------------------------------------------------------------
// Listas dinâmicas — schemas reutilizáveis
// ---------------------------------------------------------------------------

// Publicações: artigos com posição + fator de impacto
const articleSchema = z.object({
  posicao: z.string(),
  fi: z.coerce.number().min(0).default(0),
});

export type Article = z.infer<typeof articleSchema>;

// Congressos/eventos: tipo + nível + extras
const eventSchema = z.object({
  tipo: z.string(),
  nivel: z.string(),
  premio: z.boolean().default(false),
  primeiro_autor: z.boolean().default(false),
});

export type CongressEvent = z.infer<typeof eventSchema>;

// Projetos de IC: bolsa + semestres + publicação
const projectSchema = z.object({
  bolsa: z.string(),
  semestres: z.coerce.number().min(0).default(0),
  publicacao: z.boolean().default(false),
});

export type ICProject = z.infer<typeof projectSchema>;

// ---------------------------------------------------------------------------
// Campos por categoria
// ---------------------------------------------------------------------------

// Publicações
const publicacoesFields = {
  publicacoes: z.array(articleSchema).default([]),
  artigos_high_impact: z.coerce.number().min(0).default(0),
  artigos_mid_impact: z.coerce.number().min(0).default(0),
  artigos_low_impact: z.coerce.number().min(0).default(0),
  artigos_nacionais: z.coerce.number().min(0).default(0),
  capitulos_livro: z.coerce.number().min(0).default(0),
};

// Acadêmico
const academicoFields = {
  ic_projetos: z.array(projectSchema).default([]),
  ic_com_bolsa: z.coerce.number().min(0).default(0),
  ic_sem_bolsa: z.coerce.number().min(0).default(0),
  ic_horas_totais: z.coerce.number().min(0).default(0),
  monitoria_semestres: z.coerce.number().min(0).default(0),
  monitoria_horas_totais: z.coerce.number().min(0).default(0),
  extensao_semestres: z.coerce.number().min(0).default(0),
};

// Prática/Social
const praticaSocialFields = {
  voluntariado_horas: z.coerce.number().min(0).default(0),
  estagio_extracurricular_horas: z.coerce.number().min(0).default(0),
  trabalho_sus_meses: z.coerce.number().min(0).default(0),
  projeto_rondon: z.boolean().default(false),
  internato_hospital_ensino: z.string().default("Não"),
};

// Liderança/Eventos
const liderancaEventosFields = {
  congressos: z.array(eventSchema).default([]),
  diretoria_ligas: z.coerce.number().min(0).default(0),
  membro_liga_anos: z.coerce.number().min(0).default(0),
  representante_turma_anos: z.coerce.number().min(0).default(0),
  cursos_suporte: z.coerce.number().min(0).default(0),
  apresentacao_congresso: z.coerce.number().min(0).default(0),
  ouvinte_congresso: z.coerce.number().min(0).default(0),
  organizador_evento: z.coerce.number().min(0).default(0),
  teste_progresso: z.coerce.number().min(0).default(0),
  colegiado_institucional_semestres: z.coerce.number().min(0).default(0),
  centro_academico_semestres: z.coerce.number().min(0).default(0),
  atletica_semestres: z.coerce.number().min(0).default(0),
  equipe_esportiva_semestres: z.coerce.number().min(0).default(0),
};

// Perfil
const perfilFields = {
  ingles_fluente: z.boolean().default(false),
  media_geral: z.coerce.number().min(0).default(0),
  conceito_historico: z.string().default(""),
  ranking_ruf_top35: z.boolean().default(false),
  mestrado_status: z.string().default("Não tenho"),
  doutorado_status: z.string().default("Não tenho"),
  nivel_assistencial: z.string().default(""),
  residencia_medica_concluida: z.boolean().default(false),
  outro_curso_universitario: z.boolean().default(false),
};

export const curriculumDataSchema = z
  .object({
    ...publicacoesFields,
    ...academicoFields,
    ...praticaSocialFields,
    ...liderancaEventosFields,
    ...perfilFields,
  })
  .catchall(z.unknown());

export type CurriculumData = z.infer<typeof curriculumDataSchema>;
