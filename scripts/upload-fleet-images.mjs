// Uploads the existing unmodified fleet assets. No service credential is written
// to disk, source or logs; existing storage objects are never overwritten.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const project = readFileSync("supabase/.temp/project-ref", "utf8").trim();
const keys = JSON.parse(
  execFileSync(
    process.platform === "win32" ? "supabase.exe" : "supabase",
    ["projects", "api-keys", "--project-ref", project, "--output", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  ),
);
const serviceKey = keys.find((key) => key.name === "service_role")?.api_key;
if (!serviceKey) throw new Error("Project service credential unavailable.");
const db = createClient(`https://${project}.supabase.co`, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
for (let n = 1; n <= 10; n++) {
  const path = `seed/fleet-${n}.jpg`;
  const bytes = readFileSync(`src/assets/Fleet (${n}).JPG`);
  const { error } = await db.storage
    .from("fleet-images")
    .upload(path, bytes, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (error && String(error.statusCode) !== "409" && error.error !== "Duplicate") throw error;
  const url = db.storage.from("fleet-images").getPublicUrl(path).data.publicUrl;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fleet image ${n} is not publicly readable.`);
  const hash = (value) => createHash("sha256").update(value).digest("hex");
  if (hash(Buffer.from(await response.arrayBuffer())) !== hash(bytes))
    throw new Error(`Existing image ${n} differs; it has been left unchanged.`);
  console.log(`Fleet (${n}).JPG uploaded/verified in fleet-images.`);
}
