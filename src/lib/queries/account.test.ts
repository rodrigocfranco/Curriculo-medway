import { describe, it, expect, vi } from "vitest";

vi.mock("../supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("useDeleteAccount module", () => {
  it("exporta useDeleteAccount como função", async () => {
    const mod = await import("./account");
    expect(typeof mod.useDeleteAccount).toBe("function");
  });
});
