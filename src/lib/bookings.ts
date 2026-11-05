import type { BookingStatus } from "../../supabase/functions/_shared/booking-schema";
export * from "../../supabase/functions/_shared/booking-schema";

export type EmailJob = {
  id: string;
  audience: "guest" | "admin";
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  provider_id: string | null;
};

export type Booking = {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  experience: string;
  travel_date: string | null;
  flexible_dates: boolean;
  adults: number;
  children: number;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  flight_number: string;
  luggage: number;
  special_requests: string;
  full_name: string;
  email: string;
  phone: string;
  contact_preference: string;
  status: BookingStatus;
  admin_notes: string;
  booking_emails: EmailJob[];
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  user_roles: { role: "admin" | "user" } | null;
};
