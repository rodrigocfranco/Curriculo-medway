import { z } from "zod";
import { BRAZIL_STATE_CODES } from "../brazil-states";

export const institutionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome da instituição é obrigatório")
    .max(200, "Nome muito longo"),
  short_name: z
    .string()
    .trim()
    .max(20, "Sigla muito longa")
    .optional()
    .or(z.literal("")),
  state: z
    .enum(BRAZIL_STATE_CODES, {
      errorMap: () => ({ message: "Selecione um estado" }),
    })
    .optional()
    .or(z.literal("")),
  edital_url: z
    .string()
    .trim()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
});

export type InstitutionFormValues = z.infer<typeof institutionFormSchema>;

// ---------------------------------------------------------------------------
// Scoring Rules
// ---------------------------------------------------------------------------

const jsonStringSchema = z.string().refine(
  (val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: "JSON inválido" },
);

export const scoringRuleFormSchema = z
  .object({
    institution_id: z.string().uuid("Selecione uma instituição"),
    specialty_id: z.string().uuid().nullable().default(null),
    category: z.string().min(1, "Selecione uma categoria"),
    field_key: z.string().min(1, "Selecione um campo"),
    weight: z.number({ required_error: "Peso é obrigatório" }).finite("Valor inválido").min(0, "Peso não pode ser negativo"),
    max_points: z.number({ required_error: "Pontuação máxima é obrigatória" }).finite("Valor inválido").min(0, "Pontuação máxima não pode ser negativa"),
    description: z.string().optional().or(z.literal("")),
    formula: jsonStringSchema.default("{}"),
  })
  .refine((data) => data.weight <= data.max_points, {
    message: "Peso não pode ser maior que a pontuação máxima",
    path: ["weight"],
  });

export type ScoringRuleFormValues = z.infer<typeof scoringRuleFormSchema>;

export const impactPreviewRequestSchema = z.object({
  institution_id: z.string().uuid(),
  specialty_id: z.string().uuid().nullable().default(null),
  weight: z.number(),
  max_points: z.number(),
  field_key: z.string(),
});

export type ImpactPreviewRequest = z.infer<typeof impactPreviewRequestSchema>;
