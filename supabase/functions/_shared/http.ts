import { createClient } from "@supabase/supabase-js";

const defaultOrigins = [
  "https://ra2travelandtours.co.za",
  "https://www.ra2travelandtours.co.za",
  "http://localhost:5173",
  "http://localhost:3000",
];
export function corsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") || defaultOrigins.join(","))
    .split(",")
    .map((s) => s.trim());
  if (origin && !allowed.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin || allowed[0]!,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-worker-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}
export function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function readBody(req: Request) {
  if (Number(req.headers.get("content-length")) > 16000) throw new Error("BODY_TOO_LARGE");
  const text = await req.text();
  if (new TextEncoder().encode(text).length > 16000) throw new Error("BODY_TOO_LARGE");
  return JSON.parse(text);
}
export async function sha256(text: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))),
    (v) => v.toString(16).padStart(2, "0"),
  ).join("");
}
