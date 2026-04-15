import { z } from "zod";

export const forgotPasswordFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
