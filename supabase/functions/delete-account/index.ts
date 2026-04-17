import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verificar JWT — extrair user_id do token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client com anon key para verificar o JWT do user
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;

    // Client com service_role para operações admin (bypassa RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Buscar dados demográficos do profile ANTES de deletar (para account_deletions)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("state, graduation_year")
      .eq("id", userId)
      .single();

    // 3. Refresh das views materializadas de benchmarks (preserva agregados)
    const { error: refreshError } = await supabaseAdmin.rpc(
      "refresh_benchmarks"
    );
    if (refreshError) {
      throw new Error(`Failed to refresh benchmarks: ${refreshError.message}`);
    }

    // 4. Deletar auth.users via Admin API — cascade cuida de profiles → user_curriculum → user_scores
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      // Idempotência: se user já não existir, tratar como sucesso
      if (
        deleteError.message?.includes("not found") ||
        deleteError.message?.includes("User not found")
      ) {
        return new Response(
          JSON.stringify({ data: { deleted: true }, error: null }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    // 5. Registrar em account_deletions (sem PII) — após delete bem-sucedido
    const { error: insertError } = await supabaseAdmin
      .from("account_deletions")
      .insert({
        state: profile?.state ?? null,
        graduation_year: profile?.graduation_year ?? null,
      });

    if (insertError) {
      console.error("[delete-account] account_deletions insert failed:", insertError.message);
      // Não bloqueia — user já foi deletado, registro é best-effort
    }

    return new Response(
      JSON.stringify({ data: { deleted: true }, error: null }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        data: null,
        error: { message, code: "DELETE_FAILED" },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
