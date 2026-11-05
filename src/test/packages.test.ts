import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  newPackage,
  packageSchema,
  packageRecordSchema,
} from "../../supabase/functions/_shared/package-schema";
import {
  bookingSchema,
  bookingStepSchemas,
  initialBooking,
  isTransferBooking,
} from "@/lib/bookings";

const sql = readFileSync("supabase/migrations/20261105120100_seed_packages.sql", "utf8");
const seed = JSON.parse(sql.split("$package_seed$")[1]!);
describe("Editable package catalogue (offline)", () => {
  it("seeds valid unique packages covering every original booking option", () => {
    expect(seed).toHaveLength(13);
    for (const item of seed) {
      expect(packageSchema.safeParse(item).success).toBe(true);
      expect(
        packageRecordSchema.safeParse({
          ...item,
          created_at: "2026-11-05T12:00:00Z",
          updated_at: "2026-11-05T12:00:00Z",
        }).success,
      ).toBe(true);
    }
    expect(new Set(seed.map((item: { slug: string }) => item.slug)).size).toBe(13);
    expect(new Set(seed.map((item: { name: string }) => item.name)).size).toBe(13);
    for (const name of [
      "Private Cape Peninsula Tour",
      "Private Cape Winelands Tour",
      "City & Table Mountain",
      "Aquila Safari Day",
      "Tailor-made Journey",
      "Safari (Kruger / Sabi Sands)",
      "Transfer / Chauffeur",
      "Not sure yet",
    ])
      expect(seed.some((item: { name: string }) => item.name === name)).toBe(true);
  });
  it("preserves the supplied Peninsula stops, entrance-fee inclusions and booking terms", () => {
    const peninsula = seed.find((item: { slug: string }) => item.slug === "peninsula");
    expect(peninsula.subtitle).toBe("Penguins & Coastal Wonders");
    expect(peninsula.itinerary).toHaveLength(8);
    expect(peninsula.faqs).toHaveLength(9);
    expect(peninsula.included).toEqual(
      expect.arrayContaining([
        "Cape Point / Cape of Good Hope entrance fee.",
        "Boulders penguin-viewing entrance fee.",
      ]),
    );
    expect(peninsula.booking_terms).toContain("50% deposit");
    expect(peninsula.booking_terms).toContain("seven days");
    expect(peninsula.excluded.join(" ")).not.toMatch(
      /Cape Point.*entrance fee|Boulders.*entrance fee/,
    );
  });
  it("allows private drafts but requires clear content before publishing", () => {
    const draft = { ...newPackage(), name: "A new journey", slug: "new-journey" };
    expect(packageSchema.safeParse(draft).success).toBe(true);
    const result = packageSchema.safeParse({ ...draft, is_published: true });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["summary", "description", "location", "duration"]),
      );
  });
  it("rejects unsafe photo URLs, malformed addresses and incomplete repeatable rows", () => {
    const valid = seed[0];
    for (const change of [
      { image_url: "javascript:alert(1)" },
      { image_url: "http://example.com/photo.jpg" },
      { slug: "../../admin" },
      { itinerary: [{ title: "", label: "", body: "" }] },
      { faqs: [{ question: "Question", answer: "" }] },
    ])
      expect(packageSchema.safeParse({ ...valid, ...change }).success).toBe(false);
    expect(
      packageSchema.safeParse({ ...valid, image_url: "https://example.com/photo.webp" }).success,
    ).toBe(true);
  });
  it("keeps transfer validation after renaming and supports legacy bookings", () => {
    const renamed = {
      ...initialBooking,
      experience: "Airport Executive Transfer",
      package_type: "transfer",
      package_id: seed[6].id,
      flexible_dates: true,
    };
    const missing = bookingStepSchemas[1].safeParse(renamed);
    expect(missing.success).toBe(false);
    if (!missing.success)
      expect(missing.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["pickup_location", "dropoff_location", "pickup_time"]),
      );
    expect(
      bookingSchema.safeParse({
        ...renamed,
        pickup_location: "Airport",
        dropoff_location: "Hotel",
        pickup_time: "14:30",
        full_name: "Test Guest",
        email: "guest@example.com",
        phone: "+27780000000",
        consent: true,
      }).success,
    ).toBe(true);
    expect(isTransferBooking({ experience: "Transfer / Chauffeur" })).toBe(true);
    expect(isTransferBooking({ experience: "Transfer / Chauffeur", package_type: "tour" })).toBe(
      false,
    );
  });
});
