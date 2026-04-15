import { describe, it, expect } from "vitest";
import { BRAZIL_STATES } from "./brazil-states";

describe("BRAZIL_STATES", () => {
  it("has 27 UFs including DF", () => {
    expect(BRAZIL_STATES).toHaveLength(27);
    expect(BRAZIL_STATES.some((s) => s.code === "DF")).toBe(true);
  });

  it("has unique 2-letter uppercase codes", () => {
    const codes = BRAZIL_STATES.map((s) => s.code);
    expect(new Set(codes).size).toBe(27);
    for (const c of codes) {
      expect(c).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("is sorted alphabetically by name", () => {
    const names = BRAZIL_STATES.map((s) => s.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
    expect(names).toEqual(sorted);
  });
});
