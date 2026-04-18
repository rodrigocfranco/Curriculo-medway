import { describe, it, expect } from "vitest";
import {
  institutionFormSchema,
  scoringRuleFormSchema,
  impactPreviewRequestSchema,
} from "./admin";

describe("institutionFormSchema", () => {
  it("aceita dados válidos completos", () => {
    const result = institutionFormSchema.safeParse({
      name: "UNICAMP",
      short_name: "UNICAMP",
      state: "SP",
      edital_url: "https://www.unicamp.br/edital.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("aceita apenas nome (campos opcionais vazios)", () => {
    const result = institutionFormSchema.safeParse({
      name: "UNICAMP",
      short_name: "",
      state: "",
      edital_url: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const result = institutionFormSchema.safeParse({
      name: "",
      short_name: "",
      state: "",
      edital_url: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita URL inválida", () => {
    const result = institutionFormSchema.safeParse({
      name: "UNICAMP",
      edital_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita estado inválido", () => {
    const result = institutionFormSchema.safeParse({
      name: "UNICAMP",
      state: "XX",
    });
    expect(result.success).toBe(false);
  });

  it("aceita estado válido", () => {
    const result = institutionFormSchema.safeParse({
      name: "UNICAMP",
      state: "MG",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// scoringRuleFormSchema
// ---------------------------------------------------------------------------

const validRule = {
  institution_id: "550e8400-e29b-41d4-a716-446655440000",
  specialty_id: null,
  category: "Publicações",
  field_key: "artigo_1_posicao",
  weight: 5,
  max_points: 10,
  description: "Pontuação para artigos de alto impacto",
  formula: "{}",
};

describe("scoringRuleFormSchema", () => {
  it("aceita dados válidos completos", () => {
    const result = scoringRuleFormSchema.safeParse(validRule);
    expect(result.success).toBe(true);
  });

  it("aceita sem specialty_id (null = default/Todas)", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      specialty_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("aceita specialty_id como string UUID", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      specialty_id: "660e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("aceita sem description (opcional)", () => {
    const { description: _, ...withoutDesc } = validRule;
    const result = scoringRuleFormSchema.safeParse(withoutDesc);
    expect(result.success).toBe(true);
  });

  it("aceita formula como string JSON válida", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      formula: '{"type":"linear","factor":2}',
    });
    expect(result.success).toBe(true);
  });

  it("rejeita institution_id vazio", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      institution_id: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita category vazia", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      category: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita field_key vazio", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      field_key: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita weight negativo", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      weight: -1,
    });
    expect(result.success).toBe(false);
  });

  it("aceita weight zero", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      weight: 0,
      max_points: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita weight maior que max_points", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      weight: 15,
      max_points: 10,
    });
    expect(result.success).toBe(false);
  });

  it("aceita weight igual a max_points", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      weight: 10,
      max_points: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita max_points negativo", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      weight: 0,
      max_points: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita formula JSON inválida", () => {
    const result = scoringRuleFormSchema.safeParse({
      ...validRule,
      formula: "not valid json {",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// impactPreviewRequestSchema
// ---------------------------------------------------------------------------

describe("impactPreviewRequestSchema", () => {
  it("aceita dados válidos", () => {
    const result = impactPreviewRequestSchema.safeParse({
      institution_id: "550e8400-e29b-41d4-a716-446655440000",
      specialty_id: null,
      weight: 5,
      max_points: 10,
      field_key: "artigo_1_posicao",
    });
    expect(result.success).toBe(true);
  });

  it("aceita com specialty_id", () => {
    const result = impactPreviewRequestSchema.safeParse({
      institution_id: "550e8400-e29b-41d4-a716-446655440000",
      specialty_id: "660e8400-e29b-41d4-a716-446655440000",
      weight: 5,
      max_points: 10,
      field_key: "artigo_1_posicao",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita sem institution_id", () => {
    const result = impactPreviewRequestSchema.safeParse({
      specialty_id: null,
      weight: 5,
      max_points: 10,
      field_key: "artigo_1_posicao",
    });
    expect(result.success).toBe(false);
  });
});
