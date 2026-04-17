import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database, Json } from "../database.types";
import type { CurriculumData } from "../schemas/curriculum";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CurriculumFieldRow =
  Database["public"]["Tables"]["curriculum_fields"]["Row"];

export type CurriculumFieldsByCategory = Record<string, CurriculumFieldRow[]>;

export type UserCurriculumRow =
  Database["public"]["Tables"]["user_curriculum"]["Row"];

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const curriculumKeys = {
  fields: ["curriculum-fields"] as const,
  curriculum: (userId: string) => ["curriculum", userId] as const,
};

// ---------------------------------------------------------------------------
// useCurriculumFields — campos agrupados por categoria
// ---------------------------------------------------------------------------

export function useCurriculumFields(): UseQueryResult<
  CurriculumFieldsByCategory,
  Error
> {
  return useQuery<CurriculumFieldsByCategory, Error>({
    queryKey: curriculumKeys.fields,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_fields")
        .select("*")
        .order("category")
        .order("display_order");

      if (error) throw error;

      const grouped: CurriculumFieldsByCategory = {};
      for (const field of data) {
        if (!grouped[field.category]) {
          grouped[field.category] = [];
        }
        grouped[field.category].push(field);
      }
      return grouped;
    },
  });
}

// ---------------------------------------------------------------------------
// useCurriculum — dados do currículo do usuário
// ---------------------------------------------------------------------------

export function useCurriculum(
  userId: string | null,
): UseQueryResult<UserCurriculumRow | null, Error> {
  return useQuery<UserCurriculumRow | null, Error>({
    queryKey: curriculumKeys.curriculum(userId ?? ""),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_curriculum")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateCurriculum — upsert dados do currículo
// ---------------------------------------------------------------------------

export function useUpdateCurriculum(
  userId: string,
): UseMutationResult<void, Error, Partial<CurriculumData>> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Partial<CurriculumData>>({
    mutationFn: async (curriculumData) => {
      const { error } = await supabase.from("user_curriculum").upsert({
        user_id: userId,
        data: curriculumData as unknown as Json,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: curriculumKeys.curriculum(userId),
      });
    },
  });
}
