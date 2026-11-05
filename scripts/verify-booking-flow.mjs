// Live integration verification. Creates and cleans up only its own QA records.
// Run with ADMIN_BOOTSTRAP_PASSWORD in the environment. Requires Supabase CLI login.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_PROJECT_URL as url,
  SUPABASE_PUBLIC_KEY as key,
} from "../src/lib/supabase-public.ts";
const cli = process.platform === "win32" ? "supabase.exe" : "supabase";
const keys = JSON.parse(
  execFileSync(
    cli,
    [
      "projects",
      "api-keys",
      "--project-ref",
      new URL(url).hostname.split(".")[0],
      "--output",
      "json",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  ),
);
const serviceKey = keys.find((v) => v.name === "service_role").api_key;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(url, serviceKey, options);
const anon = createClient(url, key, options);
const admin = createClient(url, key, options);
const staff = createClient(url, key, options);
const runId = randomUUID();
const qaEmail = `ra2-qa-${runId}@example.com`;
let staffId;
let bookingId;
const check = (name) => console.log(`PASS ${name}`);
const call = async (name, body, token) => {
  const response = await fetch(`${url}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
};
try {
  assert(
    process.env.ADMIN_BOOTSTRAP_PASSWORD,
    "Set ADMIN_BOOTSTRAP_PASSWORD before running integration checks.",
  );
  const login = await admin.auth.signInWithPassword({
    email: "admin@gmail.com",
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
  });
  assert.equal(login.error, null, "admin sign-in");
  assert.equal((await admin.rpc("has_admin_role")).data, true);
  check("Admin login uses Supabase Auth and the database admin role");
  assert.equal((await call("booking-emails", {})).status, 401);
  assert.equal((await call("admin-team", {})).status, 401);
  check("Anonymous users cannot invoke staff tools or the email worker");
  assert((await anon.from("bookings").select("id")).error);
  assert((await anon.from("profiles").select("id")).error);
  assert((await anon.from("user_roles").select("user_id")).error);
  assert((await anon.from("booking_emails").select("id")).error);
  assert(
    (await anon.rpc("create_guest_booking", { p_request_id: runId, p_hash: "test", p_data: {} }))
      .error,
  );
  check("Guest database reads and direct booking RPC calls are denied");
  const invalid = await call("create-booking", { request_id: runId, booking: {} });
  assert.equal(invalid.status, 400);
  const b = {
    experience: "Transfer / Chauffeur",
    travel_date: "",
    flexible_dates: true,
    adults: 2,
    children: 1,
    pickup_location: "Cape Town International Airport",
    dropoff_location: "QA Hotel, Cape Town",
    pickup_time: "14:30",
    flight_number: "QA100",
    luggage: 3,
    special_requests: "Automated integration check; remove after testing.",
    full_name: "RA2 Integration QA",
    email: qaEmail,
    phone: "+27780000000",
    contact_preference: "email",
    consent: true,
  };
  const invalidTransfer = await call("create-booking", {
    request_id: runId,
    booking: { ...b, dropoff_location: "" },
  });
  assert.equal(invalidTransfer.status, 400);
  const missingConsent = await call("create-booking", {
    request_id: runId,
    booking: { ...b, consent: false },
  });
  assert.equal(missingConsent.status, 400);
  check("Server validates required fields, transfer details and contact consent");
  const first = await call("create-booking", { request_id: runId, booking: b });
  assert.equal(first.status, 201, JSON.stringify(first.data));
  assert.match(first.data.reference, /^RA2-[A-F0-9]{12}$/);
  const saved = await service
    .from("bookings")
    .select("*,booking_emails(*)")
    .eq("request_id", runId)
    .single();
  assert.equal(saved.error, null);
  bookingId = saved.data.id;
  assert.equal(saved.data.booking_emails.length, 2);
  assert.equal(saved.data.full_name, b.full_name);
  assert.equal(saved.data.dropoff_location, b.dropoff_location);
  assert.equal(saved.data.phone, b.phone);
  assert.equal(saved.data.status, "new");
  check("Guest Edge Function atomically saves all booking details and both email jobs");
  const duplicate = await call("create-booking", { request_id: runId, booking: b });
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.data.reference, first.data.reference);
  assert.equal(
    (await service.from("bookings").select("id", { count: "exact" }).eq("request_id", runId)).count,
    1,
  );
  const mismatch = await call("create-booking", {
    request_id: runId,
    booking: { ...b, full_name: "Changed QA Name" },
  });
  assert.equal(mismatch.status, 409);
  check("Retries cannot duplicate bookings or retrieve a receipt for changed details");
  const adminView = await admin
    .from("bookings")
    .select("*,booking_emails(*)")
    .eq("id", bookingId)
    .single();
  assert.equal(adminView.error, null);
  assert.equal(adminView.data.booking_emails.length, 2);
  const updated = await admin
    .from("bookings")
    .update({ status: "contacted", admin_notes: "QA admin note" })
    .eq("id", bookingId)
    .select("status,admin_notes")
    .single();
  assert.equal(updated.error, null);
  assert.equal(updated.data.status, "contacted");
  assert.equal(updated.data.admin_notes, "QA admin note");
  assert.equal(
    (await admin.from("bookings").update({ email: "tampered@example.com" }).eq("id", bookingId))
      .error?.code,
    "42501",
  );
  check(
    "Admin reads full booking data and saves status/notes; protected guest fields cannot be overwritten",
  );
  const staffPassword = `${randomUUID()}Aa1!`;
  const created = await call(
    "admin-team",
    { full_name: "QA Staff", email: `staff-${qaEmail}`, password: staffPassword },
    login.data.session.access_token,
  );
  assert.equal(created.status, 201, JSON.stringify(created.data));
  staffId = created.data.id;
  const profile = await service
    .from("profiles")
    .select("*,user_roles(*)")
    .eq("id", staffId)
    .single();
  assert.equal(profile.data.email, `staff-${qaEmail}`);
  assert.equal(profile.data.user_roles.role, "user");
  assert.equal(
    (await staff.auth.signInWithPassword({ email: `staff-${qaEmail}`, password: staffPassword }))
      .error,
    null,
  );
  assert.equal((await staff.rpc("has_admin_role")).data, false);
  assert((await staff.rpc("retry_booking_emails", { p_booking_id: bookingId })).error);
  assert.equal((await staff.from("bookings").select("id")).data.length, 0);
  assert.equal((await staff.from("profiles").select("id")).data.length, 1);
  assert.equal(
    (await staff.from("user_roles").update({ role: "admin" }).eq("user_id", staffId).select("role"))
      .data.length,
    0,
  );
  check(
    "Auth staff creation automatically syncs profiles/roles; standard staff cannot read bookings or promote themselves",
  );
  assert.equal(
    (await admin.from("user_roles").update({ role: "admin" }).eq("user_id", staffId)).error,
    null,
  );
  assert.equal((await staff.rpc("has_admin_role")).data, true);
  assert.equal((await staff.from("bookings").select("id").eq("id", bookingId)).data.length, 1);
  assert.equal(
    (await admin.from("user_roles").update({ role: "user" }).eq("user_id", staffId)).error,
    null,
  );
  assert.equal((await staff.rpc("has_admin_role")).data, false);
  assert.equal((await staff.from("bookings").select("id").eq("id", bookingId)).data.length, 0);
  check("Role toggles grant and revoke access immediately without a new login");
  const lastAdmin = await admin
    .from("user_roles")
    .update({ role: "user" })
    .eq("user_id", login.data.user.id);
  assert(lastAdmin.error?.message.includes("last administrator"));
  check("The last admin is protected from accidental removal");
  const queue = await call("booking-emails", { mode: "status" }, login.data.session.access_token);
  assert.equal(queue.status, 200);
  assert.equal(queue.data.admin_recipient, "rezah@ra2travelandtours.co.za");
  if (!queue.data.resend_configured) {
    const delivery = await call(
      "booking-emails",
      { booking_id: bookingId },
      login.data.session.access_token,
    );
    assert.equal(delivery.data.ready, false);
    const jobs = await service
      .from("booking_emails")
      .select("status,attempts")
      .eq("booking_id", bookingId);
    assert(jobs.data.every((job) => job.status === "pending" && job.attempts === 0));
    check("Missing Resend key preserves pending emails without burning retries");
  } else
    check("Resend key present; provider delivery must be verified with a real authorised inbox");
  assert.equal((await admin.rpc("retry_booking_emails", { p_booking_id: bookingId })).error, null);
  const claims = await Promise.all(
    [1, 2].map(() => service.rpc("claim_booking_emails", { p_booking_id: bookingId, p_limit: 1 })),
  );
  assert(claims.every((claim) => claim.error === null && claim.data.length === 1));
  assert.notEqual(claims[0].data[0].id, claims[1].data[0].id);
  assert.equal(
    (await service.rpc("claim_booking_emails", { p_booking_id: bookingId, p_limit: 1 })).data
      .length,
    0,
  );
  check("Concurrent email workers claim distinct jobs and respect active leases");
  await service
    .from("booking_emails")
    .update({ locked_at: "2020-01-01T00:00:00Z", attempts: 8 })
    .eq("booking_id", bookingId);
  assert.equal(
    (await service.rpc("claim_booking_emails", { p_booking_id: bookingId })).data.length,
    0,
  );
  assert(
    (await service.from("booking_emails").select("status").eq("booking_id", bookingId)).data.every(
      (job) => job.status === "failed",
    ),
  );
  assert.equal((await admin.rpc("retry_booking_emails", { p_booking_id: bookingId })).error, null);
  check("Expired final-attempt leases surface as failed and admins can requeue them");
  const limitKey = `qa-${runId}`;
  const limits = await Promise.all(
    Array.from({ length: 4 }, () =>
      service.rpc("consume_booking_limit", { p_key: limitKey, p_limit: 2 }),
    ),
  );
  assert.equal(limits.filter((v) => v.data === true).length, 2);
  check("Database rate limits are atomic across concurrent requests");
  console.log(
    "Live integration checks passed. Resend delivery is pending external setup if no key is configured.",
  );
} finally {
  // All cleanup is scoped to UUIDs created by this run; no existing records touched.
  if (!bookingId) {
    const { data } = await service
      .from("bookings")
      .select("id")
      .eq("request_id", runId)
      .maybeSingle();
    bookingId = data?.id;
  }
  if (bookingId) {
    const { error } = await service.from("bookings").delete().eq("id", bookingId);
    if (error) throw error;
  }
  if (staffId) {
    await service.from("user_roles").update({ role: "user" }).eq("user_id", staffId);
    const { error } = await service.auth.admin.deleteUser(staffId);
    if (error) throw error;
  }
  console.log("QA booking, email jobs and staff account cleaned up.");
}
