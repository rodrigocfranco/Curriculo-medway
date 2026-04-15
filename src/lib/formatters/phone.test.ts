import { describe, it, expect } from "vitest";
import { formatPhone, stripPhoneMask } from "./phone";

describe("formatPhone", () => {
  it("formats 11 digits to (DD) 9XXXX-XXXX", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formats 10 digits (fixed line) to (DD) XXXX-XXXX", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("handles partial input progressively", () => {
    expect(formatPhone("1")).toBe("(1");
    expect(formatPhone("11")).toBe("(11");
    expect(formatPhone("119")).toBe("(11) 9");
    expect(formatPhone("11987")).toBe("(11) 987");
    expect(formatPhone("119876")).toBe("(11) 9876");
  });

  it("strips non-digits", () => {
    expect(formatPhone("abc11987654321xyz")).toBe("(11) 98765-4321");
  });

  it("strips the +55 country code prefix", () => {
    expect(formatPhone("+5511987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("+55 (11) 98765-4321")).toBe("(11) 98765-4321");
  });

  it("truncates to 11 digits", () => {
    expect(formatPhone("119876543210000")).toBe("(11) 98765-4321");
  });

  it("returns empty for empty input", () => {
    expect(formatPhone("")).toBe("");
  });

  it("returns empty when input is only non-digits", () => {
    expect(formatPhone("abc")).toBe("");
    expect(formatPhone("---")).toBe("");
  });
});

describe("stripPhoneMask", () => {
  it("returns only digits", () => {
    expect(stripPhoneMask("(11) 98765-4321")).toBe("11987654321");
  });

  it("removes unicode whitespace and symbols", () => {
    expect(stripPhoneMask("+55\u200B (11) 9-8765-4321")).toBe("5511987654321");
  });
});
