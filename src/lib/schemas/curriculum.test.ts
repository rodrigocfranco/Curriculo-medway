import { describe, it, expect } from "vitest";
import { curriculumDataSchema } from "./curriculum";

describe("curriculumDataSchema", () => {
  it("aceita dados válidos completos", () => {
    const result = curriculumDataSchema.safeParse({
      artigo_1_posicao: "1º Autor / Último autor",
      artigo_1_fi: 2.5,
      artigo_2_posicao: "Coautor",
      artigo_2_fi: 0.8,
      artigo_3_posicao: "",
      artigo_3_fi: 0,
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
      mestrado_status: "Concluído",
      doutorado_status: "Em curso",
    });
    expect(result.success).toBe(true);
  });

  it("aplica defaults para campos ausentes", () => {
    const result = curriculumDataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.artigo_1_posicao).toBe("");
      expect(result.data.artigo_1_fi).toBe(0);
      expect(result.data.projeto_rondon).toBe(false);
      expect(result.data.conceito_historico).toBe("");
      expect(result.data.mestrado_status).toBe("Não tenho");
      expect(result.data.doutorado_status).toBe("Não tenho");
    }
  });

  it("rejeita números negativos", () => {
    const result = curriculumDataSchema.safeParse({
      artigo_1_fi: -1,
    });
    expect(result.success).toBe(false);
  });

  it("coerce strings numéricas para number", () => {
    const result = curriculumDataSchema.safeParse({
      artigo_1_fi: "2.5",
      media_geral: "8.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.artigo_1_fi).toBe(2.5);
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

  it("valida todos os campos conhecidos com defaults", () => {
    const result = curriculumDataSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      const knownFields = [
        "artigo_1_posicao", "artigo_1_fi",
        "artigo_2_posicao", "artigo_2_fi",
        "artigo_3_posicao", "artigo_3_fi",
        "capitulos_livro",
        "ic_com_bolsa", "ic_sem_bolsa", "ic_horas_totais",
        "monitoria_semestres", "extensao_semestres",
        "voluntariado_horas", "estagio_extracurricular_horas",
        "trabalho_sus_meses", "projeto_rondon", "internato_hospital_ensino",
        "diretoria_ligas", "membro_liga_anos", "representante_turma_anos",
        "cursos_suporte", "apresentacao_congresso", "ouvinte_congresso",
        "organizador_evento", "teste_progresso",
        "ingles_fluente", "media_geral", "conceito_historico",
        "ranking_ruf_top35", "mestrado_status", "doutorado_status",
      ];
      for (const field of knownFields) {
        expect(result.data).toHaveProperty(field);
      }
    }
  });
});
