import { describe, it, expect } from "vitest";
import { formatPhone, stripPhoneMask } from "./phone";

describe("formatPhone", () => {
  it("formats 11 digits to (DD) 9XXXX-XXXX", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("handles partial input", () => {
    expect(formatPhone("1")).toBe("(1");
    expect(formatPhone("11")).toBe("(11");
    expect(formatPhone("119")).toBe("(11) 9");
  });

  it("strips non-digits", () => {
    expect(formatPhone("abc11987654321xyz")).toBe("(11) 98765-4321");
  });

  it("truncates to 11 digits", () => {
    expect(formatPhone("119876543210000")).toBe("(11) 98765-4321");
  });

  it("returns empty for empty input", () => {
    expect(formatPhone("")).toBe("");
  });
});

describe("stripPhoneMask", () => {
  it("returns only digits", () => {
    expect(stripPhoneMask("(11) 98765-4321")).toBe("11987654321");
  });
});
