import { z } from "zod";
import { corsHeaders, json, readBody, serviceClient } from "../_shared/http.ts";

const staffSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});
Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (!cors) return json({ error: "Origin not allowed." }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, cors);
  try {
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
    if (role?.role !== "admin") return json({ error: "Administrator access required." }, 403, cors);
    const result = staffSchema.safeParse(await readBody(req));
    if (!result.success)
      return json(
        { error: "Enter a name, valid email and a password of at least 8 characters." },
        400,
        cors,
      );
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email: result.data.email,
      password: result.data.password,
      email_confirm: true,
      user_metadata: { full_name: result.data.full_name },
    });
    if (createError)
      return json(
        {
          error:
            createError.status === 422
              ? "This email already has an account. Check the team list."
              : "Unable to create this staff account. Please try again.",
        },
        400,
        cors,
      );
    return json({ id: created.user.id }, 201, cors);
  } catch {
    return json({ error: "Staff account creation is temporarily unavailable." }, 503, cors);
  }
});
