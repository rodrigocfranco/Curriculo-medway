import { z } from "zod";

/**
 * Schema estático baseado nos 29 campos seedados em curriculum_fields.sql.
 * Tipos mapeados: number → z.coerce.number().min(0).default(0),
 * boolean → z.boolean().default(false), select → z.string().default(''),
 * text → z.string().default('').
 *
 * Fallback z.record() para campos adicionais futuros via admin.
 */

// Publicações
const articleSchema = z.object({
  posicao: z.string(),
  fi: z.coerce.number().min(0).default(0),
});

export type Article = z.infer<typeof articleSchema>;

const publicacoesFields = {
  publicacoes: z.array(articleSchema).default([]),
  capitulos_livro: z.coerce.number().min(0).default(0),
};

// Acadêmico (5)
const academicoFields = {
  ic_com_bolsa: z.coerce.number().min(0).default(0),
  ic_sem_bolsa: z.coerce.number().min(0).default(0),
  ic_horas_totais: z.coerce.number().min(0).default(0),
  monitoria_semestres: z.coerce.number().min(0).default(0),
  extensao_semestres: z.coerce.number().min(0).default(0),
};

// Prática/Social (5)
const praticaSocialFields = {
  voluntariado_horas: z.coerce.number().min(0).default(0),
  estagio_extracurricular_horas: z.coerce.number().min(0).default(0),
  trabalho_sus_meses: z.coerce.number().min(0).default(0),
  projeto_rondon: z.boolean().default(false),
  internato_hospital_ensino: z.boolean().default(false),
};

// Liderança/Eventos (8)
const liderancaEventosFields = {
  diretoria_ligas: z.coerce.number().min(0).default(0),
  membro_liga_anos: z.coerce.number().min(0).default(0),
  representante_turma_anos: z.coerce.number().min(0).default(0),
  cursos_suporte: z.coerce.number().min(0).default(0),
  apresentacao_congresso: z.coerce.number().min(0).default(0),
  ouvinte_congresso: z.coerce.number().min(0).default(0),
  organizador_evento: z.coerce.number().min(0).default(0),
  teste_progresso: z.coerce.number().min(0).default(0),
};

// Perfil (6)
const perfilFields = {
  ingles_fluente: z.boolean().default(false),
  media_geral: z.coerce.number().min(0).default(0),
  conceito_historico: z.string().default(""),
  ranking_ruf_top35: z.boolean().default(false),
  mestrado_status: z.string().default("Não tenho"),
  doutorado_status: z.string().default("Não tenho"),
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
