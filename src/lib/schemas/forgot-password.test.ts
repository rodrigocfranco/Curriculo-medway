import { describe, it, expect } from "vitest";
import { forgotPasswordFormSchema } from "./forgot-password";

describe("forgotPasswordFormSchema", () => {
  it("aceita email válido e normaliza (trim + lowercase)", () => {
    const result = forgotPasswordFormSchema.safeParse({
      email: "  LUCAS@EXAMPLE.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("lucas@example.com");
    }
  });

  it("rejeita email inválido", () => {
    const result = forgotPasswordFormSchema.safeParse({ email: "nope" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Email inválido");
    }
  });
});
