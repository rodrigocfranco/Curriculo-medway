import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

const BATCH_SIZE = 1000;

/** RFC 4180 escape + CSV injection guard (OWASP) */
function escapeCsv(value: string): string {
  const inject = value.length > 0 && "=+-@".includes(value[0]);
  if (value.includes(",") || value.includes('"') || value.includes("\n") || inject) {
    const prefix = inject ? "'" : "";
    return `"${prefix}${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** null/undefined → "" */
function safe(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

/** timestamptz → DD/MM/YYYY */
function formatDateBR(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Phone → E.164 (+55XXXXXXXXXXX) */
function formatE164(phone: string | null): string {
  if (!phone) return "";
  // Strip everything except digits and leading +
  const stripped = phone.replace(/(?!^\+)\D/g, "");
  if (!stripped) return "";
  if (stripped.startsWith("+55")) return stripped;
  if (stripped.startsWith("55") && stripped.length >= 12) return `+${stripped}`;
  // Remove leading + if present (non-55 prefix)
  const digits = stripped.replace(/^\+/, "");
  return `+55${digits}`;
}

/** Split full name into [firstName, lastName] at first space */
function splitName(name: string | null): [string, string] {
  if (!name) return ["", ""];
  const trimmed = name.trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return [trimmed, ""];
  return [trimmed.slice(0, idx), trimmed.slice(idx + 1)];
}

// ---------------------------------------------------------------------------
// CSV generation
// ---------------------------------------------------------------------------

type Lead = {
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

function generateCsvStandard(leads: Lead[]): string {
  const header = "nome,email,telefone,estado,faculdade,ano_formacao,especialidade,data_cadastro";
  const rows = leads.map((l) =>
    [
      escapeCsv(safe(l.name)),
      escapeCsv(safe(l.email)),
      escapeCsv(safe(l.phone)),
      escapeCsv(safe(l.state)),
      escapeCsv(safe(l.university)),
      escapeCsv(safe(l.graduation_year)),
      escapeCsv(safe(l.specialty_interest)),
      escapeCsv(formatDateBR(l.created_at)),
    ].join(","),
  );
  return "\uFEFF" + header + "\n" + rows.join("\n") + "\n";
}

function generateCsvHubspot(leads: Lead[]): string {
  const header =
    "First Name,Last Name,Email,Phone,State/Region,Company,Graduation Year,Specialty,Registration Date";
  const rows = leads.map((l) => {
    const [first, last] = splitName(l.name);
    return [
      escapeCsv(first),
      escapeCsv(last),
      escapeCsv(safe(l.email)),
      escapeCsv(formatE164(l.phone)),
      escapeCsv(safe(l.state)),
      escapeCsv(safe(l.university)),
      escapeCsv(safe(l.graduation_year)),
      escapeCsv(safe(l.specialty_interest)),
      escapeCsv(l.created_at ? l.created_at.slice(0, 10) : ""),
    ].join(",");
  });
  return "\uFEFF" + header + "\n" + rows.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw { message: "Unauthorized", code: "UNAUTHORIZED_ROLE" };
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      throw { message: "Unauthorized", code: "UNAUTHORIZED_ROLE" };
    }

    // 2. Admin client (service_role bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Verify admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      throw { message: "Unauthorized", code: "UNAUTHORIZED_ROLE" };
    }

    // 4. Parse request body
    const body = await req.json();
    const format: string = body.format ?? "csv";
    const filters = body.filters ?? {};

    if (format !== "csv" && format !== "hubspot") {
      throw { message: "Invalid format. Use 'csv' or 'hubspot'.", code: "INVALID_FORMAT" };
    }

    // 5. Resolve curriculum user IDs upfront if needed (paginated)
    let curriculumUserIds: string[] | null = null;
    if (filters.curriculum === "filled" || filters.curriculum === "empty") {
      curriculumUserIds = [];
      let curOffset = 0;
      while (true) {
        const { data: batch, error: curErr } = await supabaseAdmin
          .from("user_curriculum")
          .select("user_id")
          .range(curOffset, curOffset + BATCH_SIZE - 1);
        if (curErr) throw { message: curErr.message, code: "QUERY_ERROR" };
        if (!batch || batch.length === 0) break;
        curriculumUserIds.push(
          ...batch.map((u: { user_id: string }) => u.user_id),
        );
        if (batch.length < BATCH_SIZE) break;
        curOffset += BATCH_SIZE;
      }

      if (filters.curriculum === "filled" && curriculumUserIds.length === 0) {
        return new Response(
          JSON.stringify({ data: null, error: null, count: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 6. Paginated fetch of leads (avoids PostgREST default 1000-row limit)
    const leads: Lead[] = [];
    let offset = 0;
    while (true) {
      let q = supabaseAdmin
        .from("profiles")
        .select(
          "id, name, email, phone, state, university, graduation_year, specialty_interest, created_at",
        )
        .eq("role", "student")
        .order("created_at", { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (filters.state) q = q.eq("state", filters.state);
      if (filters.specialty) q = q.eq("specialty_interest", filters.specialty);
      if (filters.from) q = q.gte("created_at", filters.from);
      if (filters.to) q = q.lte("created_at", filters.to + "T23:59:59.999Z");

      if (curriculumUserIds !== null && filters.curriculum === "filled") {
        q = q.in("id", curriculumUserIds);
      }
      if (
        curriculumUserIds !== null &&
        filters.curriculum === "empty" &&
        curriculumUserIds.length > 0
      ) {
        q = q.not("id", "in", `(${curriculumUserIds.join(",")})`);
      }

      const { data: batch, error: batchErr } = await q;
      if (batchErr) throw { message: batchErr.message, code: "QUERY_ERROR" };
      if (!batch || batch.length === 0) break;
      leads.push(...(batch as Lead[]));
      if (batch.length < BATCH_SIZE) break;
      offset += BATCH_SIZE;
    }

    // 7. Handle 0 results — return JSON, not empty CSV
    if (leads.length === 0) {
      return new Response(
        JSON.stringify({ data: null, error: null, count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 8. Generate CSV
    const csv =
      format === "hubspot"
        ? generateCsvHubspot(leads)
        : generateCsvStandard(leads);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename =
      format === "hubspot"
        ? `leads-hubspot-${dateStr}.csv`
        : `leads-${dateStr}.csv`;

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Lead-Count": String(leads.length),
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    const message = err.message ?? "Unknown error";
    const code = err.code ?? "INTERNAL_ERROR";
    const status = code === "UNAUTHORIZED_ROLE" ? 403 : 400;

    return new Response(
      JSON.stringify({ data: null, error: { message, code } }),
      {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
