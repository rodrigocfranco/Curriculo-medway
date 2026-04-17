import { z } from "zod";
import { BRAZIL_STATE_CODES } from "../brazil-states";

const currentYear = new Date().getFullYear();

// Letras (com acentos), espaço, hífen, apóstrofe. Min 2 chars + mínimo 1 letra.
const NAME_REGEX = /^[\p{L}][\p{L}\s'-]{1,}$/u;
// Exige TLD (rejeita user@localhost, user@host).
const EMAIL_TLD_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const signupFormBase = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo")
    .max(120, "Nome muito longo")
    .regex(NAME_REGEX, "Use apenas letras, espaços, hífen ou apóstrofe"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .regex(EMAIL_TLD_REGEX, "Email inválido"),
  phone: z
    .string()
    .regex(
      /^\(\d{2}\) \d{4,5}-\d{4}$/,
      "Telefone inválido — use (DD) 9XXXX-XXXX",
    ),
  state: z.enum(BRAZIL_STATE_CODES, {
    errorMap: () => ({ message: "Selecione um estado" }),
  }),
  university: z.string().trim().min(2, "Informe a faculdade").max(200),
  graduation_year: z
    .number({ invalid_type_error: "Selecione o ano de formação" })
    .int()
    .min(currentYear - 10, "Ano fora do intervalo permitido")
    .max(currentYear + 8, "Ano fora do intervalo permitido"),
  specialty_interest: z.string().min(1, "Selecione a especialidade desejada"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72 caracteres"),
  confirmPassword: z.string(),
  lgpd_accepted: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar os termos" }),
  }),
});

// snake_case end-to-end: espelha Postgres + options.data do trigger handle_new_user.
// Range de graduação alinhado com graduation-year.ts (-10 / +8).
export const signupFormSchema = signupFormBase.refine(
  (v) => v.password === v.confirmPassword,
  { message: "Senhas não conferem", path: ["confirmPassword"] },
);

export type SignupFormValues = z.infer<typeof signupFormSchema>;

export const signupMetadataSchema = signupFormBase.pick({
  name: true,
  phone: true,
  state: true,
  university: true,
  graduation_year: true,
  specialty_interest: true,
});

export type SignupMetadata = z.infer<typeof signupMetadataSchema>;
