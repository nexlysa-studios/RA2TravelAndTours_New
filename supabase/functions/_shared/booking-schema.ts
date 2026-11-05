import { z } from "zod";
import { PACKAGE_TYPES } from "./package-schema.ts";
import { vehicleSelectionSchema } from "./fleet-schema.ts";

export function todayInSouthAfrica() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const optionalText = (max: number) => z.string().trim().max(max);
export function isTransferBooking(data: {
  experience: string;
  package_type?: string | null | undefined;
}) {
  return data.package_type
    ? data.package_type === "transfer"
    : data.experience === "Transfer / Chauffeur";
}
const bookingFields = {
  experience: z.string().trim().min(2, "Choose an experience to continue.").max(140),
  package_id: z.string().uuid().optional(),
  package_type: z.enum(PACKAGE_TYPES).optional(),
  vehicle_choice: z.enum(["specific", "recommend"]).optional(),
  vehicle_id: z.string().uuid().optional(),
  travel_date: z
    .string()
    .refine(
      (v) =>
        v === "" ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
          !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) &&
          new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v &&
          v >= todayInSouthAfrica()),
      "Choose today or a future travel date.",
    ),
  flexible_dates: z.boolean(),
  adults: z
    .number()
    .int()
    .min(1, "At least one adult is required.")
    .max(100, "For groups larger than 100, please contact us."),
  children: z.number().int().min(0).max(100),
  pickup_location: optionalText(300),
  dropoff_location: optionalText(300),
  pickup_time: z
    .string()
    .refine((v) => v === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "Enter a valid pickup time."),
  flight_number: optionalText(30),
  luggage: z.number().int().min(0).max(200),
  special_requests: optionalText(3000),
  full_name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  phone: z
    .string()
    .trim()
    .min(7, "Enter your phone number with country code.")
    .max(30)
    .regex(/^\+[\d\s().-]+$/, "Include your country code, for example +27 78 815 8817.")
    .refine((v) => {
      const digits = v.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }, "Enter a valid international phone number."),
  contact_preference: z.enum(["email", "phone", "whatsapp"]),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please agree that we may contact you about this request." }),
  }),
};

function validateTravel(
  data: {
    flexible_dates: boolean;
    travel_date: string;
    experience: string;
    package_type?: string | undefined;
    pickup_location: string;
    dropoff_location: string;
    pickup_time: string;
  },
  ctx: z.RefinementCtx,
) {
  if (!data.flexible_dates && !data.travel_date)
    ctx.addIssue({
      code: "custom",
      path: ["travel_date"],
      message: "Choose a travel date or select flexible dates.",
    });
  if (isTransferBooking(data)) {
    for (const key of ["pickup_location", "dropoff_location"] as const) {
      if (data[key].length < 2)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `Enter your ${key === "pickup_location" ? "pickup" : "drop-off"} location.`,
        });
    }
    if (!data.pickup_time)
      ctx.addIssue({
        code: "custom",
        path: ["pickup_time"],
        message: "Choose your pickup time (South African time).",
      });
  }
}

export const bookingSchema = z.object(bookingFields).superRefine((data, ctx) => {
  validateTravel(data, ctx);
  // Previously deployed four-step clients omit these fields. Keep their retry
  // payloads intact; new clients make the preference explicit in step three.
  if (data.vehicle_choice !== undefined || data.vehicle_id !== undefined) {
    const choice = vehicleSelectionSchema.safeParse(data);
    if (!choice.success) for (const issue of choice.error.issues) ctx.addIssue(issue);
  }
});
export const bookingStepSchemas = [
  z.object({ experience: bookingFields.experience }),
  z
    .object({
      experience: bookingFields.experience,
      package_type: bookingFields.package_type,
      travel_date: bookingFields.travel_date,
      flexible_dates: bookingFields.flexible_dates,
      adults: bookingFields.adults,
      children: bookingFields.children,
      pickup_location: bookingFields.pickup_location,
      dropoff_location: bookingFields.dropoff_location,
      pickup_time: bookingFields.pickup_time,
      flight_number: bookingFields.flight_number,
      luggage: bookingFields.luggage,
      special_requests: bookingFields.special_requests,
    })
    .superRefine(validateTravel),
  vehicleSelectionSchema,
  z.object({
    full_name: bookingFields.full_name,
    email: bookingFields.email,
    phone: bookingFields.phone,
    contact_preference: bookingFields.contact_preference,
  }),
  bookingSchema,
] as const;

export type BookingInput = z.infer<typeof bookingSchema>;
export type BookingDraft = Omit<BookingInput, "experience" | "consent"> & {
  experience: string;
  consent: boolean;
};
export const initialBooking: BookingDraft = {
  experience: "",
  vehicle_choice: "recommend",
  travel_date: "",
  flexible_dates: false,
  adults: 2,
  children: 0,
  pickup_location: "",
  dropoff_location: "",
  pickup_time: "",
  flight_number: "",
  luggage: 0,
  special_requests: "",
  full_name: "",
  email: "",
  phone: "",
  contact_preference: "email",
  consent: false,
};
export const STEP_FIELDS = [
  ["experience"],
  [
    "travel_date",
    "flexible_dates",
    "adults",
    "children",
    "pickup_location",
    "dropoff_location",
    "pickup_time",
    "flight_number",
    "luggage",
    "special_requests",
  ],
  ["vehicle_choice", "vehicle_id"],
  ["full_name", "email", "phone", "contact_preference"],
  ["consent"],
] as const;

export const BOOKING_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "confirmed",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New request",
  contacted: "Contacted",
  quoted: "Quote sent",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function formatTravelDate(value: string | null) {
  if (!value) return "Dates to be arranged";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(`${value}T12:00:00Z`));
}
