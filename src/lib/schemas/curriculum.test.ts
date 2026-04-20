import { describe, it, expect } from "vitest";
import { curriculumDataSchema } from "./curriculum";

describe("curriculumDataSchema", () => {
  it("aceita dados válidos completos", () => {
    const result = curriculumDataSchema.safeParse({
      publicacoes: [
        { posicao: "1º Autor / Último autor", fi: 2.5 },
        { posicao: "Coautor", fi: 0.8 },
      ],
      artigos_high_impact: 2,
      artigos_mid_impact: 1,
      artigos_low_impact: 0,
      artigos_nacionais: 3,
      capitulos_livro: 1,
      ic_com_bolsa: 2,
      ic_sem_bolsa: 0,
      ic_horas_totais: 120,
      monitoria_semestres: 2,
      extensao_semestres: 1,
      voluntariado_horas: 80,
      estagio_extracurricular_horas: 200,
      trabalho_sus_meses: 6,
      projeto_rondon: true,
      internato_hospital_ensino: "Próprio",
      diretoria_ligas: 1,
      membro_liga_anos: 2,
      representante_turma_anos: 1,
      cursos_suporte: 3,
      apresentacoes: [
        { tipo: "Apresentação oral", nivel: "Congresso de Sociedade Médica (nacional/internacional)" },
        { tipo: "Poster", nivel: "Congresso acadêmico local/regional" },
      ],
      ouvinte_congresso: 5,
      organizador_evento: 1,
      teste_progresso: 4,
      ingles_fluente: "Avançado",
      media_geral: 8.5,
      conceito_historico: "A",
      ranking_ruf_top35: "1ª-35ª posição",
      mestrado_status: "Concluído",
      doutorado_status: "Em curso",
      nivel_assistencial: "Primário, secundário e terciário",
      residencia_medica_concluida: false,
      outro_curso_universitario: false,
    });
    expect(result.success).toBe(true);
  });

  it("aplica defaults para campos ausentes", () => {
    const result = curriculumDataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publicacoes).toEqual([]);
      expect(result.data.capitulos_livro).toBe(0);
      expect(result.data.projeto_rondon).toBe(false);
      expect(result.data.mestrado_status).toBe("Não tenho");
      expect(result.data.doutorado_status).toBe("Não tenho");
    }
  });

  it("rejeita artigos com FI negativo", () => {
    const result = curriculumDataSchema.safeParse({
      publicacoes: [{ posicao: "Coautor", fi: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("coerce strings numéricas para number", () => {
    const result = curriculumDataSchema.safeParse({
      capitulos_livro: "3",
      media_geral: "8.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capitulos_livro).toBe(3);
      expect(result.data.media_geral).toBe(8.5);
    }
  });

  it("aceita campos extras via catchall (futuras adições admin)", () => {
    const result = curriculumDataSchema.safeParse({
      campo_futuro: "valor",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.campo_futuro).toBe("valor");
    }
  });

  it("aceita mestrado_status e doutorado_status com valores select", () => {
    for (const status of ["Não tenho", "Em curso", "Concluído"]) {
      const result = curriculumDataSchema.safeParse({
        mestrado_status: status,
        doutorado_status: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("valida publicacoes como array de artigos", () => {
    const result = curriculumDataSchema.safeParse({
      publicacoes: [
        { posicao: "1º Autor / Último autor", fi: 3.5 },
        { posicao: "Coautor", fi: 1.2 },
        { posicao: "Coautor", fi: 0 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publicacoes).toHaveLength(3);
      expect(result.data.publicacoes[0].fi).toBe(3.5);
    }
  });

  it("valida todos os campos conhecidos com defaults", () => {
    const result = curriculumDataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      const knownFields = [
        "publicacoes", "capitulos_livro",
        "ic_com_bolsa", "ic_sem_bolsa", "ic_horas_totais",
        "monitoria_semestres", "extensao_semestres",
        "premios_academicos", "cursinhos_preparatorios",
        "voluntariado_horas", "estagio_extracurricular_horas",
        "trabalho_sus_meses", "projeto_rondon", "internato_hospital_ensino",
        "diretoria_ligas", "membro_liga_anos", "representante_turma_anos",
        "cursos_suporte", "cursos_temas_medicos",
        "apresentacoes", "ouvinte_congresso",
        "organizador_evento", "teste_progresso",
        "colegiado_institucional_semestres", "centro_academico_semestres",
        "atletica_semestres", "equipe_esportiva_semestres",
        "ingles_fluente", "media_geral",
        "ranking_ruf_top35", "faculdade_pos_grad_capes",
        "mestrado_status", "doutorado_status",
        "nivel_assistencial", "residencia_medica_concluida",
        "outro_curso_universitario", "prova_proficiencia_medicina",
      ];
      for (const field of knownFields) {
        expect(result.data).toHaveProperty(field);
      }
    }
  });
});
