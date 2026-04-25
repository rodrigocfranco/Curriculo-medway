import { supabase } from "./supabase";

export type Role = "admin" | "student";

export const ADMIN_ROUTE = "/admin";
export const STUDENT_DASHBOARD_ROUTE = "/app";
export const STUDENT_CURRICULUM_ROUTE = "/app/curriculo";

function isFilledCurriculum(data: unknown): boolean {
  return (
    !!data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    Object.keys(data as Record<string, unknown>).length > 0
  );
}

export async function resolvePostLoginRoute(
  userId: string,
  role: Role | string,
): Promise<string> {
  if (role === "admin") return ADMIN_ROUTE;

  const { data, error } = await supabase
    .from("user_curriculum")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  // Em caso de erro (rede, RLS) cai no fluxo padrão de currículo —
  // melhor pedir pra preencher do que jogar em dashboard com 0 dados.
  if (error || !data) return STUDENT_CURRICULUM_ROUTE;

  return isFilledCurriculum(data.data)
    ? STUDENT_DASHBOARD_ROUTE
    : STUDENT_CURRICULUM_ROUTE;
}
