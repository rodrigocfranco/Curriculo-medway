import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../database.types";
import type { InstitutionFormValues, ScoringRuleFormValues } from "../schemas/admin";

export type InstitutionRow =
  Database["public"]["Tables"]["institutions"]["Row"];

export type ScoringRuleRow =
  Database["public"]["Tables"]["scoring_rules"]["Row"];

export type SpecialtyRow =
  Database["public"]["Tables"]["specialties"]["Row"];

export interface ScoringRulesAuditRow {
  id: string;
  rule_id: string;
  changed_by: string | null;
  change_type: "INSERT" | "UPDATE" | "DELETE";
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_at: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useInstitutions(): UseQueryResult<InstitutionRow[], Error> {
  return useQuery<InstitutionRow[], Error>({
    queryKey: ["institutions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useInstitutionRuleCounts(): UseQueryResult<
  Record<string, number>,
  Error
> {
  return useQuery<Record<string, number>, Error>({
    queryKey: ["institution-rule-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_rules")
        .select("institution_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data) {
        counts[row.institution_id] = (counts[row.institution_id] ?? 0) + 1;
      }
      return counts;
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateInstitution(): UseMutationResult<
  InstitutionRow,
  Error,
  InstitutionFormValues & { id?: string; pdf_path?: string | null }
> {
  const queryClient = useQueryClient();
  return useMutation<
    InstitutionRow,
    Error,
    InstitutionFormValues & { id?: string; pdf_path?: string | null }
  >({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from("institutions")
        .insert({
          ...(values.id && { id: values.id }),
          name: values.name,
          short_name: values.short_name || null,
          state: values.state || null,
          edital_url: values.edital_url || null,
          pdf_path: values.pdf_path ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
    },
  });
}

export function useUpdateInstitution(): UseMutationResult<
  InstitutionRow,
  Error,
  { id: string } & InstitutionFormValues & { pdf_path?: string | null }
> {
  const queryClient = useQueryClient();
  return useMutation<
    InstitutionRow,
    Error,
    { id: string } & InstitutionFormValues & { pdf_path?: string | null }
  >({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from("institutions")
        .update({
          name: values.name,
          short_name: values.short_name || null,
          state: values.state || null,
          edital_url: values.edital_url || null,
          ...(values.pdf_path !== undefined && { pdf_path: values.pdf_path }),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
    },
  });
}

export function useDeleteInstitution(): UseMutationResult<
  void,
  Error,
  { id: string; pdf_path?: string | null }
> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; pdf_path?: string | null }>({
    mutationFn: async ({ id, pdf_path }) => {
      const { error } = await supabase
        .from("institutions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      // Best-effort: limpa PDF do Storage após sucesso do DB delete
      if (pdf_path) {
        await supabase.storage.from("editais").remove([pdf_path]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({ queryKey: ["institution-rule-counts"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Storage helpers — bucket "editais"
// ---------------------------------------------------------------------------

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MiB

export async function uploadEditalPdf(
  institutionId: string,
  file: File,
): Promise<string> {
  if (file.type !== "application/pdf") {
    throw new Error("Apenas arquivos PDF são aceitos.");
  }
  if (file.size > MAX_PDF_SIZE) {
    throw new Error("Arquivo excede o limite de 10 MB.");
  }
  const path = `${institutionId}/${Date.now()}.pdf`;
  const { error } = await supabase.storage
    .from("editais")
    .upload(path, file, { contentType: "application/pdf", upsert: false });
  if (error) throw error;
  return path;
}

export async function deleteEditalPdf(pdfPath: string): Promise<void> {
  const { error } = await supabase.storage
    .from("editais")
    .remove([pdfPath]);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Scoring Rules — Queries
// ---------------------------------------------------------------------------

export function useScoringRules(
  institutionId?: string | null,
  specialtyId?: string | null,
): UseQueryResult<ScoringRuleRow[], Error> {
  return useQuery<ScoringRuleRow[], Error>({
    queryKey: ["scoring-rules", institutionId ?? null, specialtyId ?? null],
    queryFn: async () => {
      let query = supabase
        .from("scoring_rules")
        .select("*")
        .order("category")
        .order("field_key");

      if (institutionId) {
        query = query.eq("institution_id", institutionId);
      }
      if (specialtyId) {
        query = query.eq("specialty_id", specialtyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useSpecialties(): UseQueryResult<SpecialtyRow[], Error> {
  return useQuery<SpecialtyRow[], Error>({
    queryKey: ["specialties"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("*")
        .neq("name", "__default__")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// ---------------------------------------------------------------------------
// Scoring Rules — Mutations
// ---------------------------------------------------------------------------

export function useCreateScoringRule(): UseMutationResult<
  ScoringRuleRow,
  Error,
  ScoringRuleFormValues
> {
  const queryClient = useQueryClient();
  return useMutation<ScoringRuleRow, Error, ScoringRuleFormValues>({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from("scoring_rules")
        .insert({
          institution_id: values.institution_id,
          specialty_id: values.specialty_id || null,
          category: values.category,
          field_key: values.field_key,
          weight: values.weight,
          max_points: values.max_points,
          description: values.description || null,
          formula: JSON.parse(values.formula),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-rules"] });
      queryClient.invalidateQueries({ queryKey: ["institution-rule-counts"] });
    },
  });
}

export function useUpdateScoringRule(): UseMutationResult<
  ScoringRuleRow,
  Error,
  { id: string } & ScoringRuleFormValues
> {
  const queryClient = useQueryClient();
  return useMutation<
    ScoringRuleRow,
    Error,
    { id: string } & ScoringRuleFormValues
  >({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from("scoring_rules")
        .update({
          institution_id: values.institution_id,
          specialty_id: values.specialty_id || null,
          category: values.category,
          field_key: values.field_key,
          weight: values.weight,
          max_points: values.max_points,
          description: values.description || null,
          formula: JSON.parse(values.formula),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-rules"] });
    },
  });
}

export function useDeleteScoringRule(): UseMutationResult<
  void,
  Error,
  { id: string }
> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from("scoring_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-rules"] });
      queryClient.invalidateQueries({ queryKey: ["institution-rule-counts"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Audit Log — Queries & Mutations
// ---------------------------------------------------------------------------

export function useAuditLog(): UseQueryResult<ScoringRulesAuditRow[], Error> {
  return useQuery<ScoringRulesAuditRow[], Error>({
    queryKey: ["audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_rules_audit")
        .select("*")
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ScoringRulesAuditRow[];
    },
  });
}

export function useAdminProfiles(): UseQueryResult<
  Array<{ id: string; name: string | null }>,
  Error
> {
  return useQuery({
    queryKey: ["admin-profiles"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "admin");
      if (error) throw error;
      return data;
    },
  });
}

export function useRevertRule(): UseMutationResult<
  void,
  Error,
  { auditEntry: ScoringRulesAuditRow }
> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { auditEntry: ScoringRulesAuditRow }>({
    mutationFn: async ({ auditEntry }) => {
      const { old_values, change_type, rule_id } = auditEntry;
      if (!old_values) throw new Error("Sem valores anteriores para reverter.");

      type ScoringRuleUpdate = Database["public"]["Tables"]["scoring_rules"]["Update"];
      type ScoringRuleInsert = Database["public"]["Tables"]["scoring_rules"]["Insert"];

      // Campos de metadados que não devem ser usados no revert
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } =
        old_values as Record<string, unknown>;
      const restoreValues = rest as ScoringRuleUpdate;

      if (change_type === "UPDATE") {
        const { error } = await supabase
          .from("scoring_rules")
          .update(restoreValues)
          .eq("id", rule_id);
        if (error) throw error;
      } else if (change_type === "DELETE") {
        const insertValues = {
          id: old_values.id as string,
          ...rest,
        } as ScoringRuleInsert;
        const { error } = await supabase
          .from("scoring_rules")
          .insert(insertValues);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["scoring-rules"] });
      queryClient.invalidateQueries({ queryKey: ["institution-rule-counts"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Impact Preview — client-side calculation for MVP
// ---------------------------------------------------------------------------

export interface ImpactPreviewResult {
  affectedCount: number;
  samples: Array<{
    name: string;
    currentScore: number;
    estimatedScore: number;
    delta: number;
  }>;
}

export async function previewRuleImpact(params: {
  institution_id: string;
  specialty_id: string | null;
  weight: number;
  max_points: number;
  field_key: string;
  current_weight?: number;
}): Promise<ImpactPreviewResult> {
  // 1. Count affected users with scores for this institution
  let countQuery = supabase
    .from("user_scores")
    .select("user_id", { count: "exact", head: true })
    .eq("institution_id", params.institution_id);

  if (params.specialty_id) {
    countQuery = countQuery.eq("specialty_id", params.specialty_id);
  }

  const { count, error: countError } = await countQuery;
  if (countError) throw countError;

  // 2. Get sample of 5 users with their scores and profiles
  let sampleQuery = supabase
    .from("user_scores")
    .select("user_id, score, profiles!inner(name)")
    .eq("institution_id", params.institution_id)
    .limit(5);

  if (params.specialty_id) {
    sampleQuery = sampleQuery.eq("specialty_id", params.specialty_id);
  }

  const { data: samples, error: sampleError } = await sampleQuery;
  if (sampleError) throw sampleError;

  // 3. Estimate delta for each sample user
  const weightDelta = params.weight - (params.current_weight ?? 0);
  const sampleResults = (samples ?? []).map((s) => {
    const profile = s.profiles as unknown as { name: string | null };
    const delta = weightDelta;
    return {
      name: profile?.name ?? "Aluno",
      currentScore: s.score,
      estimatedScore: s.score + delta,
      delta,
    };
  });

  return {
    affectedCount: count ?? 0,
    samples: sampleResults,
  };
}
