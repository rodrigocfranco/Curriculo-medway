import { describe, it, expect } from "vitest";
import { getGraduationYearOptions } from "./graduation-year";

describe("getGraduationYearOptions", () => {
  it("returns 19 years in descending order for 2026", () => {
    const years = getGraduationYearOptions(new Date("2026-06-15"));
    expect(years[0]).toBe(2034);
    expect(years[years.length - 1]).toBe(2016);
    expect(years).toHaveLength(19);
  });

  it("anchors range on currentYear when no date provided (now: +8 / -10)", () => {
    const years = getGraduationYearOptions();
    const currentYear = new Date().getFullYear();
    expect(years[0]).toBe(currentYear + 8);
    expect(years[years.length - 1]).toBe(currentYear - 10);
    expect(years).toContain(currentYear);
  });

  it("is strictly decreasing", () => {
    const years = getGraduationYearOptions(new Date("2026-06-15"));
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBeLessThan(years[i - 1]);
    }
  });

  it("respects different anchor years (2030)", () => {
    const years = getGraduationYearOptions(new Date(2030, 5, 15));
    expect(years[0]).toBe(2038);
    expect(years[years.length - 1]).toBe(2020);
  });
});
