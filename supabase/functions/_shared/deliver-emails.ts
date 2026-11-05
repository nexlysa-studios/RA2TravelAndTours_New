import { serviceClient } from "./http.ts";
import { bookingEmail, type EmailBooking } from "./email-template.ts";

export function emailConfiguration() {
  return {
    ready: Boolean(
      Deno.env.get("RESEND_API_KEY") &&
      Deno.env.get("EMAIL_FROM") &&
      Deno.env.get("ADMIN_NOTIFICATION_EMAIL") &&
      Deno.env.get("SITE_URL"),
    ),
    resend_configured: Boolean(Deno.env.get("RESEND_API_KEY")),
    sender: Deno.env.get("EMAIL_FROM") || "Not configured",
    admin_recipient: Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "Not configured",
  };
}

export async function deliverEmails(bookingId?: string) {
  const configuration = emailConfiguration();
  if (!configuration.ready) return { ...configuration, processed: 0, sent: 0, failed: 0 };
  const db = serviceClient();
  const { data: jobs, error } = await db.rpc("claim_booking_emails", {
    p_booking_id: bookingId || null,
    p_limit: 10,
  });
  if (error) throw new Error("QUEUE_UNAVAILABLE");
  let sent = 0;
  let failed = 0;
  for (const job of jobs || []) {
    try {
      const { data: b, error: bookingError } = await db
        .from("bookings")
        .select("*")
        .eq("id", job.booking_id)
        .single();
      if (bookingError || !b) throw new Error("BOOKING_UNAVAILABLE");
      const email = bookingEmail(b as EmailBooking, job.audience, Deno.env.get("SITE_URL")!);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `ra2-booking/${job.id}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("EMAIL_FROM"),
          to: [job.audience === "guest" ? b.email : Deno.env.get("ADMIN_NOTIFICATION_EMAIL")],
          reply_to: job.audience === "guest" ? Deno.env.get("ADMIN_NOTIFICATION_EMAIL") : b.email,
          ...email,
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error(`RESEND_HTTP_${response.status}`);
      const result = await response.json();
      if (typeof result.id !== "string") throw new Error("RESEND_INVALID_RESPONSE");
      const { error: saveError } = await db
        .from("booking_emails")
        .update({
          status: "sent",
          provider_id: result.id,
          sent_at: new Date().toISOString(),
          last_error: null,
          locked_at: null,
          lock_token: null,
        })
        .eq("id", job.id)
        .eq("lock_token", job.lock_token);
      if (saveError) throw new Error("EMAIL_STATUS_SAVE_FAILED");
      sent++;
    } catch (error) {
      failed++;
      const safeCodes =
        /^(RESEND_HTTP_\d{3}|BOOKING_UNAVAILABLE|RESEND_INVALID_RESPONSE|EMAIL_STATUS_SAVE_FAILED)$/;
      const message =
        error instanceof Error && safeCodes.test(error.message)
          ? error.message
          : "EMAIL_SEND_FAILED";
      const delay = Math.min(21600, 60 * 2 ** Math.min(job.attempts, 8));
      await db
        .from("booking_emails")
        .update({
          status: job.attempts >= 8 ? "failed" : "pending",
          available_at: new Date(Date.now() + delay * 1000).toISOString(),
          last_error: message,
          locked_at: null,
          lock_token: null,
        })
        .eq("id", job.id)
        .eq("lock_token", job.lock_token);
      console.error("Booking email attempt failed", { job_id: job.id, code: message });
    }
    // Stay below Resend's default request rate, including batches of retries.
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return { ...configuration, processed: (jobs || []).length, sent, failed };
}
