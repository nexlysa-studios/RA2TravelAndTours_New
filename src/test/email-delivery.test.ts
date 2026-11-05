/// <reference types="@types/deno" />
// Exercise the deployed worker's delivery logic with a simulated Resend API.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialBooking } from "@/lib/bookings";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  updates: [] as Record<string, unknown>[],
  fetch: vi.fn(),
  secrets: {} as Record<string, string>,
}));
vi.mock("../../supabase/functions/_shared/http.ts", () => ({
  serviceClient: () => ({ rpc: mocks.rpc, from: mocks.from }),
}));
import { deliverEmails } from "../../supabase/functions/_shared/deliver-emails";

const booking = {
  ...initialBooking,
  experience: "Transfer / Chauffeur",
  id: "booking-1",
  reference: "RA2-TEST",
  created_at: "2026-11-05T12:00:00Z",
  full_name: "Test Guest",
  email: "guest@example.com",
  phone: "+27780000000",
  pickup_location: "Airport",
  dropoff_location: "Hotel",
  pickup_time: "12:00",
};
beforeEach(() => {
  vi.useFakeTimers();
  mocks.secrets = {
    RESEND_API_KEY: "fake-unit-test-key",
    EMAIL_FROM: "RA2 <bookings@ra2travelandtours.co.za>",
    ADMIN_NOTIFICATION_EMAIL: "rezah@ra2travelandtours.co.za",
    SITE_URL: "https://ra2travelandtours.co.za",
  };
  vi.stubGlobal("Deno", { env: { get: (name: string) => mocks.secrets[name] } });
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.updates.length = 0;
  mocks.rpc.mockResolvedValue({
    data: [
      {
        id: "job-1",
        booking_id: booking.id,
        audience: "guest",
        attempts: 1,
        lock_token: "lease-1",
      },
    ],
    error: null,
  });
  mocks.from.mockImplementation((table: string) =>
    table === "bookings"
      ? { select: () => ({ eq: () => ({ single: async () => ({ data: booking, error: null }) }) }) }
      : {
          update: (value: Record<string, unknown>) => {
            mocks.updates.push(value);
            return { eq: () => ({ eq: async () => ({ error: null }) }) };
          },
        },
  );
  mocks.fetch.mockResolvedValue(
    new Response(JSON.stringify({ id: "resend-message-1" }), { status: 200 }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function finish<T>(promise: Promise<T>) {
  await vi.runAllTimersAsync();
  return promise;
}
describe("Resend delivery worker", () => {
  it("leaves jobs untouched until the Resend key is configured", async () => {
    delete mocks.secrets["RESEND_API_KEY"];
    expect(await deliverEmails()).toMatchObject({ ready: false, processed: 0 });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("sends guest and admin receipts with stable idempotency keys and saves provider IDs", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          id: "job-guest",
          booking_id: booking.id,
          audience: "guest",
          attempts: 1,
          lock_token: "lease-a",
        },
        {
          id: "job-admin",
          booking_id: booking.id,
          audience: "admin",
          attempts: 1,
          lock_token: "lease-b",
        },
      ],
      error: null,
    });
    mocks.fetch.mockImplementation(
      async () => new Response(JSON.stringify({ id: "resend-id" }), { status: 200 }),
    );
    expect(await finish(deliverEmails(booking.id))).toMatchObject({
      ready: true,
      sent: 2,
      failed: 0,
    });
    const calls = mocks.fetch.mock.calls;
    const guest = JSON.parse(calls[0]![1].body);
    const admin = JSON.parse(calls[1]![1].body);
    expect(guest.to).toEqual(["guest@example.com"]);
    expect(guest.reply_to).toBe("rezah@ra2travelandtours.co.za");
    expect(admin.to).toEqual(["rezah@ra2travelandtours.co.za"]);
    expect(admin.reply_to).toBe("guest@example.com");
    expect(calls[0]![1].headers["Idempotency-Key"]).toBe("ra2-booking/job-guest");
    expect(
      mocks.updates.every(
        (update) => update["status"] === "sent" && update["provider_id"] === "resend-id",
      ),
    ).toBe(true);
  });
  it("reschedules provider failures without marking emails sent", async () => {
    mocks.fetch.mockResolvedValue(new Response("unavailable", { status: 503 }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await finish(deliverEmails())).toMatchObject({ sent: 0, failed: 1 });
    expect(mocks.updates[0]).toMatchObject({
      status: "pending",
      last_error: "RESEND_HTTP_503",
      lock_token: null,
    });
    expect(Date.parse(mocks.updates[0]!["available_at"] as string)).toBeGreaterThan(Date.now());
    log.mockRestore();
  });
  it("shows exhausted retries as failed for an administrator to retry", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          id: "job-1",
          booking_id: booking.id,
          audience: "admin",
          attempts: 8,
          lock_token: "lease-1",
        },
      ],
      error: null,
    });
    mocks.fetch.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await finish(deliverEmails())).toMatchObject({ sent: 0, failed: 1 });
    expect(mocks.updates[0]).toMatchObject({ status: "failed", last_error: "RESEND_HTTP_403" });
    log.mockRestore();
  });
});
