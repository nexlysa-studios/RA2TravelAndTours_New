import { z } from "zod";
import { corsHeaders, json, readBody, serviceClient } from "../_shared/http.ts";
import { deliverEmails, emailConfiguration } from "../_shared/deliver-emails.ts";

const bodySchema = z.object({
  mode: z.enum(["status", "send"]).default("send"),
  booking_id: z.string().uuid().optional(),
});
async function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const a = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(left)));
  const b = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(right)));
  return a.reduce((diff, value, i) => diff | (value ^ b[i]!), 0) === 0;
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (!cors) return json({ error: "Origin not allowed." }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, cors);
  try {
    const workerToken = req.headers.get("x-worker-token");
    const expected = Deno.env.get("BOOKING_EMAIL_WORKER_TOKEN");
    const isWorker = Boolean(
      workerToken && expected && (await constantTimeEqual(workerToken, expected)),
    );
    if (!isWorker) {
      const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "Sign in as an administrator." }, 401, cors);
      const db = serviceClient();
      const { data, error } = await db.auth.getUser(token);
      if (error || !data.user)
        return json({ error: "Your session has expired. Please sign in again." }, 401, cors);
      const { data: role } = await db
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();
      if (role?.role !== "admin")
        return json({ error: "Administrator access required." }, 403, cors);
    }
    const parsed = bodySchema.safeParse(await readBody(req));
    if (!parsed.success) return json({ error: "Invalid request." }, 400, cors);
    if (parsed.data.mode === "status") return json(emailConfiguration(), 200, cors);
    return json(await deliverEmails(parsed.data.booking_id), 200, cors);
  } catch {
    return json(
      { error: "Email processing is temporarily unavailable. Saved bookings are safe." },
      503,
      cors,
    );
  }
});
