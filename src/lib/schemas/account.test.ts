import { describe, it, expect } from "vitest";
import { deleteAccountConfirmationSchema } from "./account";

describe("deleteAccountConfirmationSchema", () => {
  it("aceita 'EXCLUIR' como confirmação válida", () => {
    const result = deleteAccountConfirmationSchema.safeParse({
      confirmation: "EXCLUIR",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita string vazia", () => {
    const result = deleteAccountConfirmationSchema.safeParse({
      confirmation: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita texto diferente de EXCLUIR", () => {
    const result = deleteAccountConfirmationSchema.safeParse({
      confirmation: "excluir",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita 'EXCLUIR ' com espaço", () => {
    const result = deleteAccountConfirmationSchema.safeParse({
      confirmation: "EXCLUIR ",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita campo ausente", () => {
    const result = deleteAccountConfirmationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
