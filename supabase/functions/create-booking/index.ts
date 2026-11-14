import { z } from "zod";
import { bookingSchema } from "../_shared/booking-schema.ts";
import { corsHeaders, json, readBody, serviceClient, sha256 } from "../_shared/http.ts";
import { deliverEmails } from "../_shared/deliver-emails.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };
const submissionSchema = z.object({
  request_id: z.string().uuid(),
  booking: bookingSchema,
  website: z.string().max(200).optional(),
});

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (!cors) return json({ error: "This website is not allowed to submit requests." }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, cors);
  try {
    const result = submissionSchema.safeParse(await readBody(req));
    if (!result.success)
      return json(
        { error: "Please check your booking details.", fields: result.error.flatten() },
        400,
        cors,
      );
    if (result.data.website)
      return json(
        { error: "We couldn't submit this request. Please contact RA2 directly." },
        400,
        cors,
      );
    const { request_id, booking } = result.data;
    if (booking.flexible_dates) booking.travel_date = "";
    const db = serviceClient();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    for (const [scope, value, limit] of [
      ["ip", ip, 8],
      ["email", booking.email, 4],
    ] as const) {
      const key = await sha256(`${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}:${scope}:${value}`);
      const { data: allowed, error } = await db.rpc("consume_booking_limit", {
        p_key: key,
        p_limit: limit,
      });
      if (error) throw new Error("RATE_LIMIT_UNAVAILABLE");
      if (!allowed)
        return json(
          {
            error:
              "You've sent several requests recently. Please wait 15 minutes or contact us directly.",
          },
          429,
          { ...cors, "Retry-After": "900" },
        );
    }
    const { data: receipt, error } = await db.rpc("create_guest_booking", {
      p_request_id: request_id,
      p_hash: await sha256(JSON.stringify(booking)),
      p_data: booking,
    });
    if (error) {
      if (error.message.includes("CHAUFFEUR_DETAILS_REQUIRED"))
        return json(
          {
            error:
              "Please check your chauffeur duration, planned stops, pickup time and multi-day dates.",
          },
          400,
          cors,
        );
      if (error.message.includes("SERVICE_CHANGED"))
        return json(
          {
            error:
              "This service was updated. Refresh the page and choose your experience again before sending your request.",
          },
          409,
          cors,
        );
      if (error.message.includes("VEHICLE_UNAVAILABLE"))
        return json(
          {
            error:
              "This vehicle is no longer available. Choose another vehicle or ask RA2 to recommend one.",
          },
          409,
          cors,
        );
      if (error.message.includes("VEHICLE_CAPACITY"))
        return json(
          {
            error:
              "Your group exceeds this vehicle’s guest capacity. Choose a larger vehicle or let RA2 recommend an arrangement.",
          },
          400,
          cors,
        );
      if (error.message.includes("VEHICLE_SELECTION_INVALID"))
        return json({ error: "Select a vehicle or choose ‘Let RA2 recommend’." }, 400, cors);
      if (
        error.message.includes("PACKAGE_UNAVAILABLE") ||
        error.message.includes("PACKAGE_CHANGED")
      )
        return json(
          {
            error:
              "This package has changed or is no longer available. Refresh the page to choose a current experience, or contact RA2 directly.",
          },
          409,
          cors,
        );
      if (error.message.includes("TRANSFER_DETAILS_REQUIRED"))
        return json(
          { error: "Please add your pickup, drop-off and pickup time for this transfer." },
          400,
          cors,
        );
      if (error.message.includes("REQUEST_CONFLICT"))
        return json(
          {
            error:
              "This request was already submitted with different details. Start a new request or contact RA2 with your reference.",
          },
          409,
          cors,
        );
      throw new Error("BOOKING_SAVE_FAILED");
    }
    EdgeRuntime.waitUntil(
      deliverEmails(receipt.id).catch(() =>
        console.error("Email worker deferred to scheduled retry"),
      ),
    );
    return json(
      { reference: receipt.reference, email_status: "queued" },
      receipt.duplicate ? 200 : 201,
      cors,
    );
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.message === "BODY_TOO_LARGE")
    )
      return json({ error: "Invalid or oversized request." }, 400, cors);
    console.error("Booking submission failed", {
      code: error instanceof Error ? error.message : "UNKNOWN",
    });
    return json(
      {
        error:
          "We couldn't save your request. Please try again. Your details are still in the form.",
      },
      503,
      cors,
    );
  }
});
