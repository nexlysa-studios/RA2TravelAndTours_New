import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PROJECT_URL, SUPABASE_PUBLIC_KEY } from "./supabase-public";

let browserClient: SupabaseClient | undefined;
export function getSupabase() {
  if (typeof window === "undefined")
    throw new Error("Supabase browser client is only available in the browser.");
  if (!browserClient) {
    browserClient = createClient(
      import.meta.env["VITE_SUPABASE_URL"] || SUPABASE_PROJECT_URL,
      import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || SUPABASE_PUBLIC_KEY,
      {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      },
    );
  }
  return browserClient;
}

export async function functionError(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "context" in error &&
    error.context instanceof Response
  ) {
    try {
      const payload = await error.context.json();
      if (typeof payload.error === "string") return payload.error;
    } catch {
      /* Use the safe fallback for non-JSON gateway errors. */
    }
  }
  return fallback;
}
