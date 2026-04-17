import { describe, it, expect } from "vitest";

// Since the formatters live inside a Deno Edge Function, we re-implement them
// here for unit testing. The source of truth is supabase/functions/export-leads/index.ts.
// Keep these in sync.

function escapeCsv(value: string): string {
  const inject = value.length > 0 && "=+-@".includes(value[0]);
  if (value.includes(",") || value.includes('"') || value.includes("\n") || inject) {
    const prefix = inject ? "'" : "";
    return `"${prefix}${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function safe(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function formatDateBR(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatE164(phone: string | null): string {
  if (!phone) return "";
  const stripped = phone.replace(/(?!^\+)\D/g, "");
  if (!stripped) return "";
  if (stripped.startsWith("+55")) return stripped;
  if (stripped.startsWith("55") && stripped.length >= 12) return `+${stripped}`;
  const digits = stripped.replace(/^\+/, "");
  return `+55${digits}`;
}

function splitName(name: string | null): [string, string] {
  if (!name) return ["", ""];
  const trimmed = name.trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return [trimmed, ""];
  return [trimmed.slice(0, idx), trimmed.slice(idx + 1)];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("escapeCsv", () => {
  it("returns plain value as-is", () => {
    expect(escapeCsv("hello")).toBe("hello");
  });

  it("wraps field with comma in double quotes", () => {
    expect(escapeCsv("São Paulo, SP")).toBe('"São Paulo, SP"');
  });

  it("escapes double quotes inside value", () => {
    expect(escapeCsv('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps field with newline", () => {
    expect(escapeCsv("line1\nline2")).toBe('"line1\nline2"');
  });

  it("guards against formula injection with =", () => {
    expect(escapeCsv("=CMD()")).toBe("\"'=CMD()\"");
  });

  it("guards against formula injection with +", () => {
    expect(escapeCsv("+1234")).toBe("\"'+1234\"");
  });

  it("guards against formula injection with -", () => {
    expect(escapeCsv("-1234")).toBe("\"'-1234\"");
  });

  it("guards against formula injection with @", () => {
    expect(escapeCsv("@SUM(A1)")).toBe("\"'@SUM(A1)\"");
  });
});

describe("safe", () => {
  it("converts null to empty string", () => {
    expect(safe(null)).toBe("");
  });

  it("converts undefined to empty string", () => {
    expect(safe(undefined)).toBe("");
  });

  it("converts number to string", () => {
    expect(safe(2026)).toBe("2026");
  });

  it("passes strings through", () => {
    expect(safe("test")).toBe("test");
  });
});

describe("formatDateBR", () => {
  it("formats ISO date to DD/MM/YYYY", () => {
    expect(formatDateBR("2026-04-01T10:00:00Z")).toBe("01/04/2026");
  });

  it("returns empty string for null", () => {
    expect(formatDateBR(null)).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDateBR("not-a-date")).toBe("");
  });

  it("handles midnight UTC correctly", () => {
    expect(formatDateBR("2026-01-15T00:00:00Z")).toBe("15/01/2026");
  });
});

describe("formatE164", () => {
  it("returns empty for null", () => {
    expect(formatE164(null)).toBe("");
  });

  it("returns empty for empty string", () => {
    expect(formatE164("")).toBe("");
  });

  it("preserves existing +55 prefix", () => {
    expect(formatE164("+5511999990000")).toBe("+5511999990000");
  });

  it("does not duplicate +55 when already present", () => {
    expect(formatE164("+55 (11) 99999-0000")).toBe("+5511999990000");
  });

  it("prepends +55 to bare digits", () => {
    expect(formatE164("11999990000")).toBe("+5511999990000");
  });

  it("strips formatting chars", () => {
    expect(formatE164("(11) 99999-0000")).toBe("+5511999990000");
  });

  it("handles 55 prefix without +", () => {
    expect(formatE164("5511999990000")).toBe("+5511999990000");
  });
});

describe("splitName", () => {
  it("splits at first space", () => {
    expect(splitName("Maria Silva")).toEqual(["Maria", "Silva"]);
  });

  it("puts everything in first name when no space", () => {
    expect(splitName("Maria")).toEqual(["Maria", ""]);
  });

  it("handles multiple spaces (last name keeps all)", () => {
    expect(splitName("Maria da Silva")).toEqual(["Maria", "da Silva"]);
  });

  it("returns empty strings for null", () => {
    expect(splitName(null)).toEqual(["", ""]);
  });

  it("trims whitespace", () => {
    expect(splitName("  Maria Silva  ")).toEqual(["Maria", "Silva"]);
  });
});
