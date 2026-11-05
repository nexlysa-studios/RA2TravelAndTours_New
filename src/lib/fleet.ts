import { queryOptions } from "@tanstack/react-query";
import { fleetRecordSchema } from "../../supabase/functions/_shared/fleet-schema";
import { SUPABASE_PROJECT_URL, SUPABASE_PUBLIC_KEY } from "./supabase-public";
export * from "../../supabase/functions/_shared/fleet-schema";
export const VEHICLE_CATEGORY_LABELS = {
  sedan: "Sedan",
  mpv: "MPV",
  van: "Passenger van",
  minibus: "Minibus",
  coach: "Coach / bus",
} as const;
export const publicFleetOptions = queryOptions({
  queryKey: ["public-fleet"],
  queryFn: async ({ signal }) => {
    const url = import.meta.env["VITE_SUPABASE_URL"] || SUPABASE_PROJECT_URL;
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || SUPABASE_PUBLIC_KEY;
    const response = await fetch(
      `${url}/rest/v1/fleet_vehicles?select=*&is_published=eq.true&archived_at=is.null&order=sort_order.asc,name.asc&limit=1000`,
      { headers: { apikey: key }, signal },
    );
    if (!response.ok)
      throw new Error(
        "We couldn’t load the fleet. Please try again or ask RA2 to recommend a vehicle.",
      );
    return fleetRecordSchema.array().parse(await response.json());
  },
  staleTime: 30000,
  refetchInterval: 60000,
});
