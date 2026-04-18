import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../database.types";
import type { UserScore, Institution } from "../schemas/scoring";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserScoreRow = Database["public"]["Tables"]["user_scores"]["Row"];
export type InstitutionRow = Database["public"]["Tables"]["institutions"]["Row"];

// Sentinel UUID para "sem especialidade" (PK user_scores)
const DEFAULT_SPECIALTY_ID = "00000000-0000-0000-0000-000000000000";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const scoringKeys = {
  scores: (userId: string, specialtyId?: string) =>
    ["scores", userId, specialtyId ?? DEFAULT_SPECIALTY_ID] as const,
  institutions: ["institutions"] as const,
  specialties: ["specialties"] as const,
};

// ---------------------------------------------------------------------------
// useInstitutions — lista todas as instituições
// ---------------------------------------------------------------------------

export function useInstitutions(): UseQueryResult<Institution[], Error> {
  return useQuery<Institution[], Error>({
    queryKey: scoringKeys.institutions,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutions")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Institution[];
    },
  });
}

// ---------------------------------------------------------------------------
// useScores — scores do usuário com auto-recálculo quando stale
// ---------------------------------------------------------------------------

export function useScores(
  userId: string | null,
  specialtyId?: string,
): UseQueryResult<UserScore[], Error> {
  const effectiveSpecialty = specialtyId ?? DEFAULT_SPECIALTY_ID;

  return useQuery<UserScore[], Error>({
    queryKey: scoringKeys.scores(userId ?? "", effectiveSpecialty),
    enabled: !!userId,
    staleTime: 0,
    queryFn: async () => {
      // (a) Buscar scores
      const { data, error } = await supabase
        .from("user_scores")
        .select("*")
        .eq("user_id", userId!)
        .eq("specialty_id", effectiveSpecialty)
        .order("score", { ascending: false });

      if (error) throw error;

      // (b) Se algum score stale OU nenhum score existe (primeiro acesso),
      //     recalcular e re-buscar (uma única tentativa para evitar loop)
      const needsCalc =
        data?.some((s) => s.stale) || (data?.length ?? 0) === 0;
      if (needsCalc) {
        const { error: rpcError } = await supabase.rpc("calculate_scores", {
          p_user_id: userId!,
          p_specialty_id: specialtyId ?? null,
        });

        if (rpcError) throw rpcError;

        // Re-fetch após recálculo (sem re-check de stale — evita loop infinito)
        const { data: freshData, error: freshError } = await supabase
          .from("user_scores")
          .select("*")
          .eq("user_id", userId!)
          .eq("specialty_id", effectiveSpecialty)
          .order("score", { ascending: false });

        if (freshError) throw freshError;
        return (freshData ?? []) as UserScore[];
      }

      // (c) Retorna array ordenado score desc
      return (data ?? []) as UserScore[];
    },
  });
}

// ---------------------------------------------------------------------------
// useRecalculateScores — mutation manual para forçar recálculo
// ---------------------------------------------------------------------------

export function useRecalculateScores(
  userId: string,
  specialtyId?: string,
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase.rpc("calculate_scores", {
        p_user_id: userId,
        p_specialty_id: specialtyId ?? null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: scoringKeys.scores(userId, specialtyId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Specialty types
// ---------------------------------------------------------------------------

export type SpecialtyRow = Database["public"]["Tables"]["specialties"]["Row"];

// ---------------------------------------------------------------------------
// useSpecialties — lista especialidades (exclui sentinel __default__)
// ---------------------------------------------------------------------------

export function useSpecialties(): UseQueryResult<SpecialtyRow[], Error> {
  return useQuery<SpecialtyRow[], Error>({
    queryKey: scoringKeys.specialties,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("*")
        .neq("name", "__default__")
        .order("name");

      if (error) throw error;
      return data as SpecialtyRow[];
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateSpecialty — mutation para trocar especialidade do perfil
// ---------------------------------------------------------------------------

export function useUpdateSpecialty(
  userId: string,
): UseMutationResult<void, Error, string | null> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string | null>({
    mutationFn: async (newSpecialtyId) => {
      const { error } = await supabase
        .from("profiles")
        .update({ specialty_interest: newSpecialtyId })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Prefix match: invalida cache de TODAS as specialties deste user
      queryClient.invalidateQueries({ queryKey: ["scores", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// ---------------------------------------------------------------------------
// useInstitutionScore — score filtrado para uma instituição específica
// ---------------------------------------------------------------------------

export function useInstitutionScore(
  userId: string | null,
  institutionId: string | undefined,
  specialtyId?: string,
): {
  score: UserScore | null;
  institution: Institution | null;
  isLoading: boolean;
  isError: boolean;
} {
  const {
    data: scores,
    isLoading: scoresLoading,
    isError: scoresError,
  } = useScores(userId, specialtyId);

  const {
    data: institutions,
    isLoading: instLoading,
    isError: instError,
  } = useInstitutions();

  const score = useMemo(
    () => scores?.find((s) => s.institution_id === institutionId) ?? null,
    [scores, institutionId],
  );

  const institution = useMemo(
    () => institutions?.find((i) => i.id === institutionId) ?? null,
    [institutions, institutionId],
  );

  return {
    score,
    institution,
    isLoading: scoresLoading || instLoading,
    isError: scoresError || instError,
  };
}

// ---------------------------------------------------------------------------
// useEditalUrl — retorna URL do edital (direta ou signed do Storage)
// ---------------------------------------------------------------------------

export function useEditalUrl(
  institution: Institution | null,
): string | null {
  const pdfPath = institution?.pdf_path;
  const directUrl = institution?.edital_url;

  const { data: signedUrl } = useQuery<string | null, Error>({
    queryKey: ["edital-signed-url", pdfPath],
    enabled: !!pdfPath && !directUrl,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("editais")
        .createSignedUrl(pdfPath!, 3600);

      if (error) throw error;
      return data.signedUrl;
    },
  });

  if (directUrl) return directUrl;
  if (signedUrl) return signedUrl;
  return null;
}
