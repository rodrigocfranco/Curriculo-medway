import { describe, it, expect } from "vitest";
import { signupFormSchema } from "./signup";

const validBase = {
  name: "Lucas Medway",
  email: "lucas@example.com",
  phone: "(11) 98765-4321",
  state: "SP" as const,
  university: "USP-SP - Universidade de São Paulo",
  graduation_year: new Date().getFullYear() + 2,
  specialty_interest: "Clínica Médica" as const,
  password: "senhaForte1",
  confirmPassword: "senhaForte1",
  lgpd_accepted: true as const,
};

describe("signupFormSchema", () => {
  it("accepts a valid payload", () => {
    const r = signupFormSchema.safeParse(validBase);
    expect(r.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = signupFormSchema.safeParse({ ...validBase, email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rejects unmasked phone", () => {
    const r = signupFormSchema.safeParse({ ...validBase, phone: "11987654321" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid state code", () => {
    const r = signupFormSchema.safeParse({ ...validBase, state: "XX" });
    expect(r.success).toBe(false);
  });

  it("rejects password shorter than 8", () => {
    const r = signupFormSchema.safeParse({
      ...validBase,
      password: "short",
      confirmPassword: "short",
    });
    expect(r.success).toBe(false);
  });

  it("rejects password mismatch", () => {
    const r = signupFormSchema.safeParse({
      ...validBase,
      confirmPassword: "diferente123",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects lgpd_accepted=false", () => {
    const r = signupFormSchema.safeParse({ ...validBase, lgpd_accepted: false });
    expect(r.success).toBe(false);
  });

  it("lowercases email", () => {
    const r = signupFormSchema.safeParse({ ...validBase, email: "LUCAS@EXAMPLE.COM" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("lucas@example.com");
  });

  it("rejects graduation year far outside the window", () => {
    const r = signupFormSchema.safeParse({ ...validBase, graduation_year: 1900 });
    expect(r.success).toBe(false);
  });
});
