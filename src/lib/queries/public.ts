import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../database.types";

export type MedicalSchoolRow =
  Database["public"]["Tables"]["medical_schools"]["Row"];

// ---------------------------------------------------------------------------
// Specialties — public list for signup/selects
// ---------------------------------------------------------------------------

export type SpecialtyRow = Database["public"]["Tables"]["specialties"]["Row"];

export function useSpecialtiesPublic(): UseQueryResult<SpecialtyRow[], Error> {
  return useQuery<SpecialtyRow[], Error>({
    queryKey: ["specialties-public"],
    staleTime: 30 * 60 * 1000,
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
// Medical Schools — public list for signup combobox
// ---------------------------------------------------------------------------

export function useMedicalSchools(): UseQueryResult<MedicalSchoolRow[], Error> {
  return useQuery<MedicalSchoolRow[], Error>({
    queryKey: ["medical-schools"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_schools")
        .select("*")
        .order("abbreviation");
      if (error) throw error;
      return data;
    },
  });
}
