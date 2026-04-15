import { z } from "zod";

const resetPasswordBase = z.object({
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
  confirmPassword: z.string(),
});

export const resetPasswordFormSchema = resetPasswordBase.refine(
  (v) => v.password === v.confirmPassword,
  { message: "Senhas não conferem", path: ["confirmPassword"] },
);

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
