import { z } from "zod";

export const leadsFilterSchema = z.object({
  state: z.string().optional(),
  specialty: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  curriculum: z.enum(["filled", "empty"]).optional(),
});

export type LeadsFilterValues = z.infer<typeof leadsFilterSchema>;

export type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  state: string | null;
  university: string | null;
  graduation_year: number | null;
  specialty_interest: string | null;
  created_at: string;
};

export type LeadDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  state: string | null;
  university: string | null;
  graduation_year: number | null;
  specialty_interest: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type LeadCurriculum = {
  data: Record<string, unknown>;
  updated_at: string;
} | null;

export type LeadScore = {
  score: number;
  max_score: number;
  institution: { name: string; short_name: string | null } | null;
};

export type LeadMetrics = {
  total: number;
  last7days: number;
  last30days: number;
  withCurriculum: number;
  withoutCurriculum: number;
};
