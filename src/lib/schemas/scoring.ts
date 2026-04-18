import { z } from "zod";

// ---------------------------------------------------------------------------
// ScoreBreakdown — JSONB { [field_key]: { score, max, description } }
// ---------------------------------------------------------------------------

export const scoreBreakdownItemSchema = z.object({
  score: z.number(),
  max: z.number(),
  description: z.string(),
  category: z.string().optional(),
});

export const scoreBreakdownSchema = z.record(z.string(), scoreBreakdownItemSchema);

export type ScoreBreakdownItem = z.infer<typeof scoreBreakdownItemSchema>;
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;

// ---------------------------------------------------------------------------
// UserScore — baseado em user_scores Row type
// ---------------------------------------------------------------------------

export const userScoreSchema = z.object({
  user_id: z.string().uuid(),
  institution_id: z.string().uuid(),
  specialty_id: z.string().uuid(),
  score: z.number().min(0),
  max_score: z.number().min(0),
  breakdown: scoreBreakdownSchema,
  stale: z.boolean(),
  calculated_at: z.string().nullable(),
});

export type UserScore = z.infer<typeof userScoreSchema>;

// ---------------------------------------------------------------------------
// Institution — baseado em institutions Row type
// ---------------------------------------------------------------------------

export const institutionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  short_name: z.string().nullable(),
  state: z.string().nullable(),
  edital_url: z.string().nullable(),
  pdf_path: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Institution = z.infer<typeof institutionSchema>;
