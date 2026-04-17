import { describe, it, expect } from "vitest";
import { curriculumDataSchema } from "./curriculum";

describe("curriculumDataSchema", () => {
  it("aceita dados válidos completos", () => {
    const result = curriculumDataSchema.safeParse({
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
      internato_hospital_ensino: false,
      diretoria_ligas: 1,
      membro_liga_anos: 2,
      representante_turma_anos: 1,
      cursos_suporte: 3,
      apresentacao_congresso: 2,
      ouvinte_congresso: 5,
      organizador_evento: 1,
      teste_progresso: 4,
      ingles_fluente: true,
      media_geral: 8.5,
      conceito_historico: "A",
      ranking_ruf_top35: true,
      mestrado: false,
      doutorado: false,
    });
    expect(result.success).toBe(true);
  });

  it("aplica defaults para campos ausentes", () => {
    const result = curriculumDataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.artigos_high_impact).toBe(0);
      expect(result.data.projeto_rondon).toBe(false);
      expect(result.data.conceito_historico).toBe("");
      expect(result.data.ingles_fluente).toBe(false);
      expect(result.data.media_geral).toBe(0);
    }
  });

  it("rejeita números negativos", () => {
    const result = curriculumDataSchema.safeParse({
      artigos_high_impact: -1,
    });
    expect(result.success).toBe(false);
  });

  it("coerce strings numéricas para number", () => {
    const result = curriculumDataSchema.safeParse({
      artigos_high_impact: "3",
      media_geral: "8.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.artigos_high_impact).toBe(3);
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

  it("aceita conceito_historico com valores válidos do select", () => {
    for (const conceito of ["A", "B", "C"]) {
      const result = curriculumDataSchema.safeParse({
        conceito_historico: conceito,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.conceito_historico).toBe(conceito);
      }
    }
  });

  it("valida todos os 29 campos com defaults", () => {
    const result = curriculumDataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      const knownFields = [
        "artigos_high_impact",
        "artigos_mid_impact",
        "artigos_low_impact",
        "artigos_nacionais",
        "capitulos_livro",
        "ic_com_bolsa",
        "ic_sem_bolsa",
        "ic_horas_totais",
        "monitoria_semestres",
        "extensao_semestres",
        "voluntariado_horas",
        "estagio_extracurricular_horas",
        "trabalho_sus_meses",
        "projeto_rondon",
        "internato_hospital_ensino",
        "diretoria_ligas",
        "membro_liga_anos",
        "representante_turma_anos",
        "cursos_suporte",
        "apresentacao_congresso",
        "ouvinte_congresso",
        "organizador_evento",
        "teste_progresso",
        "ingles_fluente",
        "media_geral",
        "conceito_historico",
        "ranking_ruf_top35",
        "mestrado",
        "doutorado",
      ];
      for (const field of knownFields) {
        expect(result.data).toHaveProperty(field);
      }
      expect(knownFields.length).toBe(29);
    }
  });
});
