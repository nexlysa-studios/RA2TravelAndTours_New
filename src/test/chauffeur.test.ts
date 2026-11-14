import { describe, expect, it } from "vitest";
import { bookingSchema, bookingStepSchemas, initialBooking } from "@/lib/bookings";
import { bookingEmail } from "../../supabase/functions/_shared/email-template";

const chauffeur = {
  ...initialBooking,
  experience: "Private Chauffeur Service",
  package_type: "transfer" as const,
  transport_service: "chauffeur" as const,
  chauffeur_duration: "multi_day" as const,
  travel_date: "2030-12-15",
  service_end_date: "2030-12-17",
  pickup_location: "Cape Town Hotel",
  pickup_time: "09:00",
  planned_stops: "Hotel → meeting at 10:00\nWinelands → hotel",
  full_name: "Test Guest",
  email: "guest@example.com",
  phone: "+27780000000",
  consent: true,
};

describe("Transport service details", () => {
  it("requires chauffeur duration, stops and pickup time, with an optional final destination", () => {
    expect(bookingSchema.safeParse(chauffeur).success).toBe(true);
    for (const change of [
      { chauffeur_duration: undefined },
      { planned_stops: "" },
      { pickup_time: "" },
      { pickup_location: "" },
    ])
      expect(bookingStepSchemas[1].safeParse({ ...chauffeur, ...change }).success).toBe(false);
    expect(
      bookingSchema.safeParse({
        ...chauffeur,
        chauffeur_duration: "half_day",
        service_end_date: undefined,
      }).success,
    ).toBe(true);
  });
  it("validates multi-day dates and supports genuinely flexible date ranges", () => {
    for (const service_end_date of ["", "2030-12-14", "2030-02-30"])
      expect(bookingSchema.safeParse({ ...chauffeur, service_end_date }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...chauffeur, service_end_date: "2030-12-15" }).success).toBe(
      true,
    );
    expect(
      bookingSchema.safeParse({
        ...chauffeur,
        flexible_dates: true,
        travel_date: "",
        service_end_date: undefined,
      }).success,
    ).toBe(true);
    expect(bookingSchema.safeParse({ ...chauffeur, chauffeur_duration: "full_day" }).success).toBe(
      false,
    );
  });
  it("does not accept chauffeur fields on tours or point-to-point transfers", () => {
    expect(
      bookingSchema.safeParse({
        ...chauffeur,
        transport_service: "transfer",
        dropoff_location: "Airport",
      }).success,
    ).toBe(false);
    expect(bookingSchema.safeParse({ ...chauffeur, package_type: "tour" }).success).toBe(false);
    const legacy = {
      ...initialBooking,
      experience: "Transfer / Chauffeur",
      flexible_dates: true,
      pickup_location: "Airport",
      dropoff_location: "Hotel",
      pickup_time: "12:00",
      full_name: "Guest Name",
      email: "guest@example.com",
      phone: "+27780000000",
      consent: true,
    };
    const parsed = bookingSchema.parse(legacy);
    expect(parsed).not.toHaveProperty("transport_service");
    expect(parsed).not.toHaveProperty("chauffeur_duration");
    expect(parsed).not.toHaveProperty("service_end_date");
    expect(parsed).not.toHaveProperty("planned_stops");
    expect(bookingSchema.safeParse({ ...legacy, dropoff_location: "" }).success).toBe(false);
  });
  it("includes all chauffeur details in both emails and escapes route text", () => {
    for (const audience of ["guest", "admin"] as const) {
      const email = bookingEmail(
        {
          ...chauffeur,
          planned_stops: "<script>alert(1)</script>\nHotel to meeting",
          id: "test",
          reference: "RA2-TEST",
          created_at: "2026-11-14T00:00:00Z",
        },
        audience,
        "https://ra2travelandtours.co.za",
      );
      for (const value of [
        "Private chauffeur service",
        "Multi-day",
        "17 December 2030",
        "09:00",
        "Hotel to meeting",
        "mileage",
      ])
        expect(email.text).toContain(value);
      expect(email.html).not.toContain("<script>");
      expect(email.html).toContain("&lt;script&gt;");
    }
  });
});
