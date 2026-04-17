import { describe, expect, it } from "vitest";
import {
  institutionSchema,
  scoreBreakdownSchema,
  userScoreSchema,
} from "./scoring";

describe("scoring schemas", () => {
  describe("scoreBreakdownSchema", () => {
    it("valida breakdown JSONB válido", () => {
      const valid = {
        ic: { score: 20, max: 20, description: "Bolsa Oficial: 20 pts" },
        publicacoes: { score: 15, max: 15, description: "Artigos" },
      };
      expect(scoreBreakdownSchema.parse(valid)).toEqual(valid);
    });

    it("rejeita item sem campo score", () => {
      const invalid = {
        ic: { max: 20, description: "test" },
      };
      expect(() => scoreBreakdownSchema.parse(invalid)).toThrow();
    });

    it("aceita breakdown vazio", () => {
      expect(scoreBreakdownSchema.parse({})).toEqual({});
    });
  });

  describe("userScoreSchema", () => {
    const validScore = {
      user_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      institution_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      specialty_id: "00000000-0000-0000-0000-000000000000",
      score: 95,
      max_score: 100,
      breakdown: {
        ic: { score: 20, max: 20, description: "IC" },
      },
      stale: false,
      calculated_at: "2026-04-17T12:00:00Z",
    };

    it("valida user score completo", () => {
      expect(userScoreSchema.parse(validScore)).toEqual(validScore);
    });

    it("aceita calculated_at null", () => {
      const withNull = { ...validScore, calculated_at: null };
      expect(userScoreSchema.parse(withNull).calculated_at).toBeNull();
    });

    it("rejeita score negativo", () => {
      expect(() =>
        userScoreSchema.parse({ ...validScore, score: -1 }),
      ).toThrow();
    });

    it("rejeita user_id não-uuid", () => {
      expect(() =>
        userScoreSchema.parse({ ...validScore, user_id: "not-a-uuid" }),
      ).toThrow();
    });
  });

  describe("institutionSchema", () => {
    const validInstitution = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "UNICAMP",
      short_name: "UNICAMP",
      state: "SP",
      edital_url: null,
      pdf_path: null,
      created_at: "2026-04-17T12:00:00Z",
      updated_at: "2026-04-17T12:00:00Z",
    };

    it("valida institution completa", () => {
      expect(institutionSchema.parse(validInstitution)).toEqual(
        validInstitution,
      );
    });

    it("aceita campos nullable como null", () => {
      const result = institutionSchema.parse({
        ...validInstitution,
        short_name: null,
        state: null,
      });
      expect(result.short_name).toBeNull();
      expect(result.state).toBeNull();
    });

    it("rejeita sem name", () => {
      const { name, ...noName } = validInstitution;
      expect(() => institutionSchema.parse(noName)).toThrow();
    });
  });
});
