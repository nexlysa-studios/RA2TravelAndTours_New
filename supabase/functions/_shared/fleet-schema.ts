import { z } from "zod";

export const VEHICLE_CATEGORIES = ["sedan", "mpv", "van", "minibus", "coach"] as const;
const text = (max: number) => z.string().trim().max(max);
export const fleetFieldsSchema = z.object({
  name: text(140).min(2, "Enter the vehicle name."),
  category: z.enum(VEHICLE_CATEGORIES),
  model_year: z.number().int().min(1950).max(2100).nullable(),
  description: text(2000),
  passenger_capacity: z.number().int().min(1).max(100).nullable(),
  capacity_label: text(240).min(2, "Describe the guest seating, excluding the driver."),
  seating_notes: text(2000),
  luggage_guide: text(2000),
  features: z.array(text(300).min(1)).max(20),
  image_url: text(2048).refine((value) => {
    if (!value) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Upload a photo or use an HTTPS image URL."),
  image_alt: text(240),
  is_published: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});
export const fleetSchema = fleetFieldsSchema.superRefine((vehicle, ctx) => {
  if (vehicle.is_published) {
    if (!vehicle.image_url)
      ctx.addIssue({
        code: "custom",
        path: ["image_url"],
        message: "Upload a photo before publishing.",
      });
    if (!vehicle.description)
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "Add a description before publishing.",
      });
  }
});
export const fleetRecordSchema = fleetFieldsSchema.extend({
  id: z.string().uuid(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type FleetFields = z.infer<typeof fleetFieldsSchema>;
export type FleetVehicle = z.infer<typeof fleetRecordSchema>;
export type VehicleSnapshot = Pick<
  FleetVehicle,
  | "id"
  | "name"
  | "category"
  | "model_year"
  | "passenger_capacity"
  | "capacity_label"
  | "seating_notes"
  | "luggage_guide"
  | "image_url"
>;
export const vehicleSelectionSchema = z
  .object({
    vehicle_choice: z.enum(["specific", "recommend"], {
      errorMap: () => ({ message: "Choose a vehicle or let RA2 recommend one." }),
    }),
    vehicle_id: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.vehicle_choice === "specific" && !value.vehicle_id)
      ctx.addIssue({
        code: "custom",
        path: ["vehicle_id"],
        message: "Select a vehicle for your request.",
      });
    if (value.vehicle_choice === "recommend" && value.vehicle_id)
      ctx.addIssue({
        code: "custom",
        path: ["vehicle_id"],
        message: "Choose a specific vehicle or ask RA2 to recommend one.",
      });
  });
export function vehicleFits(
  vehicle: Pick<FleetVehicle, "passenger_capacity">,
  adults: number,
  children: number,
) {
  return vehicle.passenger_capacity === null || vehicle.passenger_capacity >= adults + children;
}
export function newVehicle(): FleetFields {
  return {
    name: "",
    category: "van",
    model_year: null,
    description: "",
    passenger_capacity: null,
    capacity_label: "Guest seats to be confirmed",
    seating_notes: "",
    luggage_guide: "Luggage fit confirmed with your quotation.",
    features: [],
    image_url: "",
    image_alt: "",
    is_published: false,
    sort_order: 100,
  };
}
