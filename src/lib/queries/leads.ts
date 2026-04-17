import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type {
  LeadsFilterValues,
  LeadRow,
  LeadDetail,
  LeadCurriculum,
  LeadScore,
  LeadMetrics,
} from "../schemas/leads";
import type { SortingState } from "@tanstack/react-table";

// ---------------------------------------------------------------------------
// Métricas (AC1)
// ---------------------------------------------------------------------------

async function fetchLeadMetrics(): Promise<LeadMetrics> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, last7Res, last30Res, withCurrRes, totalForCurrRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("user_curriculum")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student"),
  ]);

  for (const res of [totalRes, last7Res, last30Res, withCurrRes, totalForCurrRes]) {
    if (res.error) throw res.error;
  }

  const total = totalRes.count ?? 0;
  const withCurriculum = withCurrRes.count ?? 0;

  return {
    total,
    last7days: last7Res.count ?? 0,
    last30days: last30Res.count ?? 0,
    withCurriculum,
    withoutCurriculum: total - withCurriculum,
  };
}

export function useLeadMetrics(): UseQueryResult<LeadMetrics, Error> {
  return useQuery<LeadMetrics, Error>({
    queryKey: ["lead-metrics"],
    queryFn: fetchLeadMetrics,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Lista paginada (AC2 + AC3)
// ---------------------------------------------------------------------------

type LeadsResult = { data: LeadRow[]; totalCount: number };

const COLUMN_MAP: Record<string, string> = {
  name: "name",
  email: "email",
  phone: "phone",
  state: "state",
  university: "university",
  graduation_year: "graduation_year",
  specialty_interest: "specialty_interest",
  created_at: "created_at",
};

async function fetchLeads(
  filters: LeadsFilterValues,
  page: number,
  pageSize: number,
  sorting: SortingState,
): Promise<LeadsResult> {
  const sortCol = sorting[0]?.id ? (COLUMN_MAP[sorting[0].id] ?? "created_at") : "created_at";
  const ascending = sorting[0] ? !sorting[0].desc : false;

  let query = supabase
    .from("profiles")
    .select(
      "id, name, email, phone, state, university, graduation_year, specialty_interest, created_at",
      { count: "exact" },
    )
    .eq("role", "student")
    .order(sortCol, { ascending })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (filters.state) query = query.eq("state", filters.state);
  if (filters.specialty) query = query.eq("specialty_interest", filters.specialty);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to + "T23:59:59.999Z");

  if (filters.curriculum === "filled") {
    const { data: currIds } = await supabase
      .from("user_curriculum")
      .select("user_id");
    if (currIds && currIds.length > 0) {
      query = query.in(
        "id",
        currIds.map((c) => c.user_id),
      );
    } else {
      return { data: [], totalCount: 0 };
    }
  } else if (filters.curriculum === "empty") {
    const { data: currIds } = await supabase
      .from("user_curriculum")
      .select("user_id");
    if (currIds && currIds.length > 0) {
      query = query.not(
        "id",
        "in",
        `(${currIds.map((c) => c.user_id).join(",")})`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as LeadRow[],
    totalCount: count ?? 0,
  };
}

export function useLeads(
  filters: LeadsFilterValues,
  page: number,
  pageSize: number,
  sorting: SortingState,
): UseQueryResult<LeadsResult, Error> {
  return useQuery<LeadsResult, Error>({
    queryKey: ["leads", filters, page, pageSize, sorting],
    queryFn: () => fetchLeads(filters, page, pageSize, sorting),
  });
}

// ---------------------------------------------------------------------------
// Detalhe do lead (AC4)
// ---------------------------------------------------------------------------

type LeadDetailResult = {
  profile: LeadDetail;
  curriculum: LeadCurriculum;
  topScores: LeadScore[];
};

async function fetchLeadDetail(userId: string): Promise<LeadDetailResult> {
  const [profileRes, curriculumRes, scoresRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("user_curriculum")
      .select("data, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_scores")
      .select("score, max_score, institution:institutions(name, short_name)")
      .eq("user_id", userId)
      .order("score", { ascending: false })
      .limit(3),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (curriculumRes.error) throw curriculumRes.error;
  if (scoresRes.error) throw scoresRes.error;

  return {
    profile: profileRes.data as LeadDetail,
    curriculum: curriculumRes.data as LeadCurriculum,
    topScores: (scoresRes.data ?? []) as LeadScore[],
  };
}

export function useLeadDetail(
  userId: string | null,
): UseQueryResult<LeadDetailResult, Error> {
  return useQuery<LeadDetailResult, Error>({
    queryKey: ["lead-detail", userId],
    queryFn: () => fetchLeadDetail(userId!),
    enabled: !!userId,
  });
}
