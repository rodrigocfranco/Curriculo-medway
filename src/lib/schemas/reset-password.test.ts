import { describe, it, expect } from "vitest";
import { resetPasswordFormSchema } from "./reset-password";

describe("resetPasswordFormSchema", () => {
  it("aceita senha válida e confirmação igual", () => {
    const result = resetPasswordFormSchema.safeParse({
      password: "senhaForte1",
      confirmPassword: "senhaForte1",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita senhas diferentes com erro em confirmPassword", () => {
    const result = resetPasswordFormSchema.safeParse({
      password: "senhaForte1",
      confirmPassword: "outra",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "confirmPassword",
      );
      expect(issue?.message).toBe("Senhas não conferem");
    }
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    const result = resetPasswordFormSchema.safeParse({
      password: "1234567",
      confirmPassword: "1234567",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "password");
      expect(issue?.message).toBe("Mínimo 8 caracteres");
    }
  });

  it("rejeita senha com mais de 72 caracteres", () => {
    const longPass = "a".repeat(73);
    const result = resetPasswordFormSchema.safeParse({
      password: longPass,
      confirmPassword: longPass,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "password");
      expect(issue?.message).toBe("Máximo 72 caracteres");
    }
  });
});
