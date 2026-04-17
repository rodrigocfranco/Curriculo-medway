import { z } from "zod";

export const deleteAccountConfirmationSchema = z.object({
  confirmation: z
    .string()
    .refine((v) => v === "EXCLUIR", {
      message: 'Digite "EXCLUIR" para confirmar',
    }),
});

export type DeleteAccountConfirmation = z.infer<
  typeof deleteAccountConfirmationSchema
>;
