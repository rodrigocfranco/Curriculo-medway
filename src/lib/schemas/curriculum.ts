import { z } from "zod";

/**
 * Schema do currículo do aluno.
 * 40 campos: simples (number, boolean, select) + 1 lista dinâmica (article_list).
 * Fallback z.record() para campos adicionais futuros via admin.
 */

// ---------------------------------------------------------------------------
// Lista dinâmica — publicações com posição + fator de impacto
// ---------------------------------------------------------------------------

const articleSchema = z.object({
  posicao: z.string(),
  veiculo: z.string().default(""),
  fi: z.coerce.number().min(0).default(0),
});

export type Article = z.infer<typeof articleSchema>;

// ---------------------------------------------------------------------------
// Campos por categoria
// ---------------------------------------------------------------------------

// Publicações (2)
const publicacoesFields = {
  publicacoes: z.array(articleSchema).default([]),
  capitulos_livro: z.coerce.number().min(0).default(0),
};

// Acadêmico (7)
const academicoFields = {
  ic_com_bolsa: z.coerce.number().min(0).default(0),
  ic_sem_bolsa: z.coerce.number().min(0).default(0),
  ic_horas_totais: z.coerce.number().min(0).default(0),
  monitoria_semestres: z.coerce.number().min(0).default(0),
  extensao_semestres: z.coerce.number().min(0).default(0),
  premios_academicos: z.coerce.number().min(0).default(0),
  cursinhos_preparatorios: z.coerce.number().min(0).default(0),
};

// Prática/Social (5)
const praticaSocialFields = {
  voluntariado_horas: z.coerce.number().min(0).default(0),
  estagio_extracurricular_horas: z.coerce.number().min(0).default(0),
  trabalho_sus_meses: z.coerce.number().min(0).default(0),
  projeto_rondon: z.boolean().default(false),
  internato_hospital_ensino: z.string().default("Não"),
};

// Liderança/Eventos (12)
const apresentacaoSchema = z.object({
  tipo: z.string(),
  nivel: z.string().default(""),
});

export type Apresentacao = z.infer<typeof apresentacaoSchema>;

const liderancaEventosFields = {
  diretoria_ligas: z.coerce.number().min(0).default(0),
  membro_liga_anos: z.coerce.number().min(0).default(0),
  representante_turma_anos: z.coerce.number().min(0).default(0),
  cursos_suporte: z.coerce.number().min(0).default(0),
  cursos_temas_medicos: z.coerce.number().min(0).default(0),
  apresentacoes: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(apresentacaoSchema).default([]),
  ),
  ouvinte_congresso: z.coerce.number().min(0).default(0),
  organizador_evento: z.coerce.number().min(0).default(0),
  teste_progresso: z.coerce.number().min(0).default(0),
  colegiado_institucional_semestres: z.coerce.number().min(0).default(0),
  centro_academico_semestres: z.coerce.number().min(0).default(0),
  atletica_semestres: z.coerce.number().min(0).default(0),
  equipe_esportiva_semestres: z.coerce.number().min(0).default(0),
};

// Perfil (9)
const perfilFields = {
  ingles_fluente: z.string().default("Não tenho"),
  media_geral: z.coerce.number().min(0).default(0),
  ranking_ruf_top35: z.string().default("Demais faculdades"),
  faculdade_pos_grad_capes: z.string().default("Não possui"),
  mestrado_status: z.string().default("Não tenho"),
  doutorado_status: z.string().default("Não tenho"),
  nivel_assistencial: z.string().default(""),
  residencia_medica_concluida: z.boolean().default(false),
  outro_curso_universitario: z.boolean().default(false),
  prova_proficiencia_medicina: z.boolean().default(false),
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
