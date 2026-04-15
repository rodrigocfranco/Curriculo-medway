import { describe, it, expect } from "vitest";
import { getGraduationYearOptions } from "./graduation-year";

describe("getGraduationYearOptions", () => {
  it("returns 19 years in descending order for 2026", () => {
    const years = getGraduationYearOptions(new Date("2026-06-15"));
    expect(years[0]).toBe(2034);
    expect(years[years.length - 1]).toBe(2016);
    expect(years).toHaveLength(19);
  });

  it("defaults to now() when no date provided", () => {
    const years = getGraduationYearOptions();
    expect(years.length).toBe(19);
  });

  it("is strictly decreasing", () => {
    const years = getGraduationYearOptions(new Date("2026-06-15"));
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBeLessThan(years[i - 1]);
    }
  });
});
