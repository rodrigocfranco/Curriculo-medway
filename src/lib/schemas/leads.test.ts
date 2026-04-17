import { describe, it, expect } from "vitest";
import { leadsFilterSchema } from "./leads";

describe("leadsFilterSchema", () => {
  it("accepts empty object", () => {
    const r = leadsFilterSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("accepts valid filters", () => {
    const r = leadsFilterSchema.safeParse({
      state: "SP",
      specialty: "Cardiologia",
      from: "2026-01-01",
      to: "2026-03-31",
      curriculum: "filled",
    });
    expect(r.success).toBe(true);
  });

  it("accepts curriculum = empty", () => {
    const r = leadsFilterSchema.safeParse({ curriculum: "empty" });
    expect(r.success).toBe(true);
  });

  it("rejects invalid curriculum value", () => {
    const r = leadsFilterSchema.safeParse({ curriculum: "invalid" });
    expect(r.success).toBe(false);
  });

  it("allows partial filters", () => {
    const r = leadsFilterSchema.safeParse({ state: "RJ" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.state).toBe("RJ");
      expect(r.data.specialty).toBeUndefined();
    }
  });
});
