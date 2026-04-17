import { describe, it, expect, vi, beforeEach } from "vitest";
import { scoringKeys } from "./scoring";

// Smoke tests for query key structure and module exports.
// Full integration tests com renderHook + QueryClientProvider
// serão exercitados nos testes de componente (Story 2.3).

vi.mock("../supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () =>
          Promise.resolve({ data: [], error: null }),
        eq: () => ({
          eq: () => ({
            order: () =>
              Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
    rpc: () => Promise.resolve({ error: null }),
  },
}));

describe("scoringKeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scores key inclui userId e specialtyId", () => {
    expect(scoringKeys.scores("user-1", "spec-1")).toEqual([
      "scores",
      "user-1",
      "spec-1",
    ]);
  });

  it("scores key usa sentinel quando specialtyId não fornecido", () => {
    expect(scoringKeys.scores("user-1")).toEqual([
      "scores",
      "user-1",
      "00000000-0000-0000-0000-000000000000",
    ]);
  });

  it("scores keys são diferentes para specialtyIds diferentes", () => {
    const k1 = scoringKeys.scores("u1", "s1");
    const k2 = scoringKeys.scores("u1", "s2");
    expect(k1).not.toEqual(k2);
  });

  it("institutions key é tupla estável", () => {
    expect(scoringKeys.institutions).toEqual(["institutions"]);
  });
});

describe("module exports", () => {
  it("exporta hooks e tipos esperados", async () => {
    const mod = await import("./scoring");
    expect(typeof mod.useInstitutions).toBe("function");
    expect(typeof mod.useScores).toBe("function");
    expect(typeof mod.useRecalculateScores).toBe("function");
    expect(typeof mod.scoringKeys).toBe("object");
  });
});
