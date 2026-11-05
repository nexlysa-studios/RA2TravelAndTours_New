// One-time project bootstrap. Never writes a service-role key to the checkout.
// Set ADMIN_BOOTSTRAP_PASSWORD in the process environment before running.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const project = readFileSync("supabase/.temp/project-ref", "utf8").trim();
const url = `https://${project}.supabase.co`;
const cli = process.platform === "win32" ? "supabase.exe" : "supabase";
const run = (args) =>
  execFileSync(cli, args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const keys = JSON.parse(
  run(["projects", "api-keys", "--project-ref", project, "--output", "json"]),
);
const publicKey = keys.find((key) => key.name === "anon")?.api_key;
const serviceKey = keys.find((key) => key.name === "service_role")?.api_key;
if (!publicKey || !serviceKey) throw new Error("Project API keys were not available");
writeFileSync(
  "src/lib/supabase-public.ts",
  `// Public browser connection settings. This key is intentionally public; RLS protects all data.\nexport const SUPABASE_PROJECT_URL = ${JSON.stringify(url)};\nexport const SUPABASE_PUBLIC_KEY = ${JSON.stringify(publicKey)};\n`,
);
writeFileSync(
  ".env.example",
  `# Public browser settings only. Never put service-role or Resend keys here.\nVITE_SUPABASE_URL=${url}\nVITE_SUPABASE_PUBLISHABLE_KEY=${publicKey}\n`,
);
const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
if (process.env.ADMIN_BOOTSTRAP_PASSWORD) {
  const { data: existing, error: listError } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  let admin = existing.users.find((user) => user.email === "admin@gmail.com");
  if (!admin) {
    const { data, error } = await db.auth.admin.createUser({
      email: "admin@gmail.com",
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "RA2 Administrator" },
    });
    if (error) throw error;
    admin = data.user;
  }
  const { error } = await db.from("user_roles").update({ role: "admin" }).eq("user_id", admin.id);
  if (error) throw error;
  console.log("Administrator account and database role are ready.");
}

const tempDir = "supabase/.temp";
mkdirSync(tempDir, { recursive: true });
const envFile = `${tempDir}/booking-secrets.local`;
const sqlFile = `${tempDir}/booking-vault.local`;
const token = randomBytes(32).toString("hex");
try {
  writeFileSync(
    envFile,
    [
      "EMAIL_FROM=RA2 Travel and Tours <bookings@ra2travelandtours.co.za>",
      "ADMIN_NOTIFICATION_EMAIL=rezah@ra2travelandtours.co.za",
      "SITE_URL=https://ra2travelandtours.co.za",
      "ALLOWED_ORIGINS=https://ra2travelandtours.co.za,https://www.ra2travelandtours.co.za,http://localhost:5173,http://localhost:3000",
      `BOOKING_EMAIL_WORKER_TOKEN=${token}`,
    ].join("\n"),
  );
  run(["secrets", "set", "--project-ref", project, "--env-file", envFile]);
  writeFileSync(
    sqlFile,
    `do $setup$ declare secret_id uuid; begin
    select id into secret_id from vault.secrets where name = 'booking_email_worker_token' limit 1;
    if secret_id is null then perform vault.create_secret('${token}', 'booking_email_worker_token');
    else perform vault.update_secret(secret_id, '${token}'); end if;
  end; $setup$;`,
  );
  run(["db", "query", "--linked", "--file", sqlFile, "--output", "json"]);
  console.log("Email sender, notification inbox and scheduler secrets configured in Supabase.");
} finally {
  rmSync(envFile, { force: true });
  rmSync(sqlFile, { force: true });
}
