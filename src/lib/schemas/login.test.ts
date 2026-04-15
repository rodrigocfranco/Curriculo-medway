import { describe, it, expect } from "vitest";
import { loginFormSchema } from "./login";

describe("loginFormSchema", () => {
  it("aceita email + senha válidos", () => {
    const result = loginFormSchema.safeParse({
      email: "lucas@example.com",
      password: "senhaForte1",
    });
    expect(result.success).toBe(true);
  });

  it("normaliza email (trim + lowercase)", () => {
    const result = loginFormSchema.safeParse({
      email: "  LUCAS@EXAMPLE.COM  ",
      password: "s",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("lucas@example.com");
    }
  });

  it("rejeita email inválido", () => {
    const result = loginFormSchema.safeParse({
      email: "not-an-email",
      password: "senhaForte1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Email inválido");
    }
  });

  it("rejeita senha vazia (não re-valida força — Supabase é fonte de verdade)", () => {
    const result = loginFormSchema.safeParse({
      email: "lucas@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Informe sua senha");
    }
  });
});
