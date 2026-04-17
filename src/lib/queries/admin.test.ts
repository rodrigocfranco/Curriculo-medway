import { describe, it, expect, vi } from "vitest";

vi.mock("../supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: "1" }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: "1" }, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: "test.pdf" }, error: null }),
        remove: () => Promise.resolve({ error: null }),
      }),
    },
  },
}));

import { uploadEditalPdf, deleteEditalPdf } from "./admin";

describe("admin queries — module exports", () => {
  it("exporta hooks de query e mutation", async () => {
    const mod = await import("./admin");
    expect(mod.useInstitutions).toBeDefined();
    expect(mod.useInstitutionRuleCounts).toBeDefined();
    expect(mod.useCreateInstitution).toBeDefined();
    expect(mod.useUpdateInstitution).toBeDefined();
    expect(mod.useDeleteInstitution).toBeDefined();
  });
});

describe("uploadEditalPdf", () => {
  it("rejeita arquivo não-PDF", async () => {
    const file = new File(["content"], "doc.txt", { type: "text/plain" });
    await expect(uploadEditalPdf("inst-1", file)).rejects.toThrow(
      "Apenas arquivos PDF são aceitos.",
    );
  });

  it("rejeita arquivo acima de 10 MB", async () => {
    const bigContent = new ArrayBuffer(11 * 1024 * 1024);
    const file = new File([bigContent], "big.pdf", {
      type: "application/pdf",
    });
    await expect(uploadEditalPdf("inst-1", file)).rejects.toThrow(
      "Arquivo excede o limite de 10 MB.",
    );
  });

  it("retorna path no formato correto para arquivo válido", async () => {
    const file = new File(["pdf content"], "edital.pdf", {
      type: "application/pdf",
    });
    const path = await uploadEditalPdf("inst-1", file);
    expect(path).toMatch(/^inst-1\/\d+\.pdf$/);
  });
});

describe("deleteEditalPdf", () => {
  it("executa sem erro para path válido", async () => {
    await expect(deleteEditalPdf("inst-1/123.pdf")).resolves.toBeUndefined();
  });
});

describe("admin queries — scoring rules exports", () => {
  it("exporta hooks de scoring rules", async () => {
    const mod = await import("./admin");
    expect(mod.useScoringRules).toBeDefined();
    expect(mod.useSpecialties).toBeDefined();
    expect(mod.useCreateScoringRule).toBeDefined();
    expect(mod.useUpdateScoringRule).toBeDefined();
    expect(mod.useDeleteScoringRule).toBeDefined();
    expect(mod.previewRuleImpact).toBeDefined();
  });
});
