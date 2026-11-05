import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  fleetSchema,
  fleetRecordSchema,
  vehicleFits,
  vehicleSelectionSchema,
  newVehicle,
} from "../../supabase/functions/_shared/fleet-schema";
import { bookingSchema, bookingStepSchemas, initialBooking, STEP_FIELDS } from "@/lib/bookings";
import { bookingEmail } from "../../supabase/functions/_shared/email-template";

const seed = JSON.parse(
  readFileSync("supabase/migrations/20261105130100_seed_fleet.sql", "utf8").split(
    "$fleet_seed$",
  )[1]!,
);
describe("Fleet catalogue and vehicle preferences (offline)", () => {
  it("preserves all ten supplied vehicles and their stated guest counts", () => {
    expect(seed).toHaveLength(10);
    const expected: Record<string, number | null> = {
      "Standard Sedan": 3,
      "Mercedes-Benz C180": 3,
      "Toyota Rumion": 6,
      "Mercedes-Benz V-Class": 6,
      "Hyundai Staria": 8,
      "Toyota Quantum": 10,
      "Toyota Quantum GL": 13,
      "Toyota Hiace GL": 13,
      "Mercedes-Benz Sprinter": 20,
      "30-Seater Bus": null,
    };
    for (const v of seed) {
      expect(fleetSchema.safeParse(v).success).toBe(true);
      expect(
        fleetRecordSchema.safeParse({
          ...v,
          archived_at: null,
          created_at: "2026-11-05T12:00:00Z",
          updated_at: "2026-11-05T12:00:00Z",
        }).success,
      ).toBe(true);
      expect(v.passenger_capacity).toBe(expected[v.name]);
      expect(v.image_url).toContain("/fleet-images/seed/");
    }
    expect(seed.find((v: { name: string }) => v.name === "Mercedes-Benz C180").model_year).toBe(
      2020,
    );
    expect(seed.find((v: { name: string }) => v.name === "30-Seater Bus").capacity_label).toContain(
      "Confirm",
    );
  });
  it("counts children as guests and rejects known vehicles that are too small", () => {
    expect(vehicleFits({ passenger_capacity: 3 }, 2, 1)).toBe(true);
    expect(vehicleFits({ passenger_capacity: 3 }, 2, 2)).toBe(false);
    expect(vehicleFits({ passenger_capacity: 8 }, 6, 2)).toBe(true);
    expect(vehicleFits({ passenger_capacity: 8 }, 6, 3)).toBe(false);
    // A request for an unconfirmed configuration is allowed for manual review.
    expect(vehicleFits({ passenger_capacity: null }, 20, 0)).toBe(true);
  });
  it("requires a valid specific vehicle ID and keeps recommendation mutually exclusive", () => {
    expect(vehicleSelectionSchema.safeParse({ vehicle_choice: "specific" }).success).toBe(false);
    expect(
      vehicleSelectionSchema.safeParse({ vehicle_choice: "specific", vehicle_id: "fake" }).success,
    ).toBe(false);
    expect(
      vehicleSelectionSchema.safeParse({ vehicle_choice: "specific", vehicle_id: seed[0].id })
        .success,
    ).toBe(true);
    expect(
      vehicleSelectionSchema.safeParse({ vehicle_choice: "recommend", vehicle_id: seed[0].id })
        .success,
    ).toBe(false);
    expect(vehicleSelectionSchema.safeParse({ vehicle_choice: "recommend" }).success).toBe(true);
    expect(bookingStepSchemas).toHaveLength(5);
    expect(STEP_FIELDS[2]).toEqual(["vehicle_choice", "vehicle_id"]);
  });
  it("retains compatibility for older requests and strips client-supplied vehicle snapshots", () => {
    const valid = {
      ...initialBooking,
      experience: "Private Cape Peninsula Tour",
      flexible_dates: true,
      full_name: "Test Guest",
      email: "guest@example.com",
      phone: "+27780000000",
      consent: true,
    };
    const legacy = { ...valid };
    delete legacy.vehicle_choice;
    const parsed = bookingSchema.parse(legacy);
    expect(parsed).not.toHaveProperty("vehicle_choice");
    expect(bookingSchema.safeParse({ ...valid, vehicle_choice: "specific" }).success).toBe(false);
    expect(
      bookingSchema.parse({
        ...valid,
        vehicle_choice: "specific",
        vehicle_id: seed[0].id,
        vehicle_snapshot: { name: "Forged vehicle", passenger_capacity: 100 },
      }),
    ).not.toHaveProperty("vehicle_snapshot");
  });
  it("includes the immutable preference in both email templates without claiming confirmed availability", () => {
    const b = {
      ...bookingSchema.parse({
        ...initialBooking,
        experience: "Transfer / Chauffeur",
        flexible_dates: true,
        pickup_location: "Airport",
        dropoff_location: "Hotel",
        pickup_time: "12:00",
        full_name: "Test Guest",
        email: "guest@example.com",
        phone: "+27780000000",
        consent: true,
      }),
      id: "test",
      reference: "RA2-TEST",
      travel_date: null,
      created_at: "2026-11-05T12:00:00Z",
      vehicle_preference: "specific" as const,
      vehicle_snapshot: seed.find((v: { name: string }) => v.name === "Hyundai Staria"),
    };
    for (const audience of ["guest", "admin"] as const) {
      const email = bookingEmail(b, audience, "https://ra2travelandtours.co.za");
      expect(email.text).toContain("Hyundai Staria");
      expect(email.text).toContain("Up to 8 guests + driver");
      expect(email.text).toContain("Trailer available by arrangement");
      expect(email.text).toContain("Vehicle preference only");
      expect(
        bookingEmail(
          { ...b, vehicle_preference: "recommend", vehicle_snapshot: null },
          audience,
          "https://ra2travelandtours.co.za",
        ).text,
      ).toContain("Let RA2 recommend");
    }
  });
  it("requires complete published vehicles while permitting private drafts", () => {
    const draft = { ...newVehicle(), name: "New minibus" };
    expect(fleetSchema.safeParse(draft).success).toBe(true);
    expect(fleetSchema.safeParse({ ...draft, is_published: true }).success).toBe(false);
    expect(fleetSchema.safeParse({ ...seed[0], passenger_capacity: 0 }).success).toBe(false);
    expect(fleetSchema.safeParse({ ...seed[0], image_url: "javascript:alert(1)" }).success).toBe(
      false,
    );
  });
});
