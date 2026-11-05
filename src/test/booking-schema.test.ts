import { describe, expect, it, vi, afterEach } from "vitest";
import {
  bookingSchema,
  bookingStepSchemas,
  initialBooking,
  todayInSouthAfrica,
} from "@/lib/bookings";
import { bookingEmail } from "../../supabase/functions/_shared/email-template";

const valid = {
  ...initialBooking,
  experience: "Transfer / Chauffeur",
  travel_date: "2030-12-15",
  pickup_location: "Cape Town Airport",
  dropoff_location: "Waterfront Hotel",
  pickup_time: "14:30",
  full_name: "Test Guest",
  email: "guest@example.com",
  phone: "+27780000000",
  consent: true,
};
afterEach(() => vi.useRealTimers());
describe("Guest booking validation", () => {
  it("validates travel before contact details or consent have been entered", () => {
    const emptyTravel = { ...initialBooking, experience: "Transfer / Chauffeur" };
    const result = bookingStepSchemas[1].safeParse(emptyTravel);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          "travel_date",
          "pickup_location",
          "dropoff_location",
          "pickup_time",
        ]),
      );
    expect(
      bookingStepSchemas[1].safeParse({
        ...emptyTravel,
        flexible_dates: true,
        pickup_location: "Airport",
        dropoff_location: "Hotel",
        pickup_time: "12:00",
      }).success,
    ).toBe(true);
  });
  it("requires email, international phone, at least one adult and consent", () => {
    for (const change of [
      { email: "invalid" },
      { phone: "0781234567" },
      { adults: 0 },
      { adults: 1.5 },
      { children: -1 },
      { consent: false },
    ])
      expect(bookingSchema.safeParse({ ...valid, ...change }).success).toBe(false);
    expect(bookingSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects invalid calendar dates and past dates, and accepts explicitly flexible dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T22:30:00Z"));
    expect(todayInSouthAfrica()).toBe("2026-11-06");
    for (const date of ["2026-11-05", "2030-02-30", "2030-13-01", ""])
      expect(bookingSchema.safeParse({ ...valid, travel_date: date }).success).toBe(false);
    expect(
      bookingSchema.safeParse({ ...valid, flexible_dates: true, travel_date: "" }).success,
    ).toBe(true);
  });
  it("normalises guest email and whitespace and excludes untrusted admin fields", () => {
    const parsed = bookingSchema.parse({
      ...valid,
      full_name: "  Test Guest  ",
      email: "  GUEST@EXAMPLE.COM  ",
      status: "confirmed",
      admin_notes: "forged",
    });
    expect(parsed.full_name).toBe("Test Guest");
    expect(parsed.email).toBe("guest@example.com");
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("admin_notes");
  });
});
describe("Booking receipt emails", () => {
  it("includes all guest and transfer details and distinguishes a request from a confirmed trip", () => {
    const booking = {
      ...bookingSchema.parse(valid),
      id: "abc",
      reference: "RA2-TEST12345678",
      created_at: "2026-11-05T12:00:00Z",
      flight_number: "FA101",
      luggage: 4,
      special_requests: "Child seat please",
    };
    for (const audience of ["guest", "admin"] as const) {
      const email = bookingEmail(booking, audience, "https://ra2travelandtours.co.za");
      for (const value of [
        booking.reference,
        booking.email,
        booking.phone,
        booking.pickup_location,
        booking.dropoff_location,
        "14:30",
        "FA101",
        "Child seat please",
      ])
        expect(email.text).toContain(value);
      expect(email.text).toContain("Your trip is only confirmed once RA2");
    }
    expect(bookingEmail(booking, "admin", "https://ra2travelandtours.co.za").html).toContain(
      "/admin?booking=abc",
    );
  });
  it("escapes guest input in HTML email templates", () => {
    const email = bookingEmail(
      {
        ...bookingSchema.parse(valid),
        id: "abc",
        reference: "RA2-TEST",
        created_at: "2026-11-05T12:00:00Z",
        full_name: '<img src=x onerror="alert(1)">',
        special_requests: "<script>alert('x')</script>",
      },
      "guest",
      "https://ra2travelandtours.co.za",
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
