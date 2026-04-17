import { describe, it, expect, vi, beforeEach } from "vitest";
import { curriculumKeys } from "./curriculum";

// Smoke tests for query key structure and module exports.
// Full integration tests with React Query require renderHook + QueryClientProvider
// which will be exercised in component-level tests (Task 6).

vi.mock("../supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          order: () =>
            Promise.resolve({
              data: [],
              error: null,
            }),
        }),
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
    }),
  },
}));

describe("curriculumKeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fields key é tupla estável", () => {
    expect(curriculumKeys.fields).toEqual(["curriculum-fields"]);
  });

  it("curriculum key inclui userId", () => {
    expect(curriculumKeys.curriculum("user-123")).toEqual([
      "curriculum",
      "user-123",
    ]);
  });

  it("curriculum keys são diferentes para userIds diferentes", () => {
    const k1 = curriculumKeys.curriculum("a");
    const k2 = curriculumKeys.curriculum("b");
    expect(k1).not.toEqual(k2);
  });
});

describe("module exports", () => {
  it("exporta hooks e tipos esperados", async () => {
    const mod = await import("./curriculum");
    expect(typeof mod.useCurriculumFields).toBe("function");
    expect(typeof mod.useCurriculum).toBe("function");
    expect(typeof mod.useUpdateCurriculum).toBe("function");
    expect(typeof mod.curriculumKeys).toBe("object");
  });
});
