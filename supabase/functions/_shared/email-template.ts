import type { BookingInput } from "./booking-schema.ts";
import { formatTravelDate, isTransferBooking } from "./booking-schema.ts";
import type { VehicleSnapshot } from "./fleet-schema.ts";

export type EmailBooking = Omit<BookingInput, "consent" | "travel_date"> & {
  id: string;
  reference: string;
  travel_date: string | null;
  created_at: string;
  vehicle_preference?: "specific" | "recommend" | null;
  vehicle_snapshot?: VehicleSnapshot | null;
};
export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export function bookingEmail(b: EmailBooking, audience: "guest" | "admin", siteUrl: string) {
  const isAdmin = audience === "admin";
  const title = isAdmin ? "A new journey starts here." : "Your journey starts here.";
  const intro = isAdmin
    ? `A new booking request has arrived from ${b.full_name}. Contact the guest to confirm availability and prepare a quote.`
    : `Hello ${b.full_name}, thank you for choosing RA2. We've received your booking request and will be in touch with availability and a personalised quote.`;
  const rows: [string, string][] = [
    ["Booking reference", b.reference],
    ["Experience", b.experience],
    [
      "Travel date",
      b.flexible_dates ? "Flexible / to be arranged" : formatTravelDate(b.travel_date),
    ],
    [
      "Travellers",
      `${b.adults} adult${b.adults === 1 ? "" : "s"}, ${b.children} child${b.children === 1 ? "" : "ren"}`,
    ],
    ["Guest", b.full_name],
    ["Email", b.email],
    ["Phone / WhatsApp", b.phone],
    ["Preferred contact", b.contact_preference],
  ];
  if (b.pickup_location) rows.push(["Pickup", b.pickup_location]);
  if (b.dropoff_location) rows.push(["Drop-off", b.dropoff_location]);
  if (b.pickup_time) rows.push(["Pickup time", `${b.pickup_time} (South African time, UTC+2)`]);
  if (b.flight_number) rows.push(["Flight", b.flight_number]);
  if (isTransferBooking(b)) rows.push(["Luggage", `${b.luggage} pieces`]);
  if (b.special_requests) rows.push(["Additional details", b.special_requests]);
  if (b.vehicle_preference === "specific" && b.vehicle_snapshot) {
    rows.push(
      ["Requested vehicle", b.vehicle_snapshot.name],
      ["Guest seating", b.vehicle_snapshot.capacity_label],
    );
    if (b.vehicle_snapshot.luggage_guide)
      rows.push(["Vehicle luggage guide", b.vehicle_snapshot.luggage_guide]);
    rows.push([
      "Vehicle availability",
      "Vehicle preference only. Availability, guest seats and luggage fit are confirmed with your quotation.",
    ]);
  } else if (b.vehicle_preference === "recommend")
    rows.push(["Vehicle preference", "Let RA2 recommend a suitable vehicle or group arrangement."]);
  const note =
    "This confirms receipt of your request. Your trip is only confirmed once RA2 has agreed availability, itinerary and pricing with you. No payment has been taken.";
  const actionUrl = isAdmin
    ? `${siteUrl.replace(/\/$/, "")}/admin?booking=${encodeURIComponent(b.id)}`
    : `mailto:rezah@ra2travelandtours.co.za?subject=${encodeURIComponent(`Booking request ${b.reference}`)}`;
  const action = isAdmin ? "Open booking in dashboard" : "Contact your travel team";
  return {
    subject: `${isAdmin ? "New booking request" : "We've received your booking request"} · ${b.reference}`,
    html: `<!doctype html><html><body style="margin:0;background:#f7f3ea;font-family:Arial,sans-serif;color:#24332e"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" style="max-width:620px;margin:auto;background:#fff;border:1px solid #e5dfd2" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px;background:#123d32;color:#f7f3ea"><p style="color:#d1b77b;font-size:11px;letter-spacing:3px">RA2 TRAVEL AND TOURS</p><h1 style="font-family:Georgia,serif;font-size:32px;font-weight:normal">${title}</h1></td></tr><tr><td style="padding:32px"><p style="line-height:1.7">${escapeHtml(intro)}</p><table role="presentation" width="100%" style="margin:24px 0;border-collapse:collapse">${rows.map(([label, value]) => `<tr><td style="padding:12px 8px;border-bottom:1px solid #eee8db;vertical-align:top;font-size:12px;width:35%;color:#59675f">${escapeHtml(label)}</td><td style="padding:12px 8px;border-bottom:1px solid #eee8db;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`).join("")}</table><p style="font-size:13px;line-height:1.7;background:#f7f3ea;padding:16px">${note}</p><p style="margin:28px 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#123d32;color:#fff;padding:14px 22px;text-decoration:none">${action}</a></p><p style="font-size:13px;line-height:1.8">Rezah & the RA2 team<br/>+27 78 815 8817<br/><a href="mailto:rezah@ra2travelandtours.co.za" style="color:#123d32">rezah@ra2travelandtours.co.za</a></p></td></tr></table><p style="text-align:center;color:#6d756c;font-size:11px">Private South African journeys, personally hosted.</p></td></tr></table></body></html>`,
    text: `${title}\n\n${intro}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${note}\n\n${action}: ${actionUrl}\n\nRA2 Travel and Tours\nrezah@ra2travelandtours.co.za\n+27 78 815 8817`,
  };
}
