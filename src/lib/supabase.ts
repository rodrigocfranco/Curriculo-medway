import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (import.meta.env.MODE !== "test" && (!url || !anonKey)) {
  throw new Error(
    "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios — configure em .env.local (dev) ou nas env vars do Railway (Preview/Production).",
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  url,
  anonKey,
);
