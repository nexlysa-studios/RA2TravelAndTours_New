import { queryOptions } from "@tanstack/react-query";
import {
  packageRecordSchema,
  type TravelPackage,
} from "../../supabase/functions/_shared/package-schema";
import { SUPABASE_PROJECT_URL, SUPABASE_PUBLIC_KEY } from "./supabase-public";
import peninsula from "@/assets/peninsula.jpg";
import winelands from "@/assets/winelands.jpg";
import safari from "@/assets/safari.jpg";
import hero from "@/assets/hero.jpg";

export * from "../../supabase/functions/_shared/package-schema";
export const PACKAGE_TYPE_LABELS = {
  tour: "Private tour",
  safari: "Safari",
  journey: "Tailor-made journey",
  transfer: "Transfer / chauffeur",
  consultation: "Help choosing",
} as const;
export const PACKAGE_IMAGES = { peninsula, winelands, safari, hero };
export function packageImage(pkg: Pick<TravelPackage, "image_key" | "image_url">) {
  return pkg.image_url || PACKAGE_IMAGES[pkg.image_key];
}

export function packageLink(pkg: Pick<TravelPackage, "slug">) {
  return pkg.slug === "peninsula"
    ? { to: "/tours/peninsula" as const }
    : { to: "/tours/$slug" as const, params: { slug: pkg.slug } };
}

// Public queries deliberately use a stateless anon client, even when an admin is
// signed in. Draft packages must never enter SSR output or public query caches.
async function fetchPublishedPackages(signal?: AbortSignal): Promise<TravelPackage[]> {
  const url = import.meta.env["VITE_SUPABASE_URL"] || SUPABASE_PROJECT_URL;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || SUPABASE_PUBLIC_KEY;
  const response = await fetch(
    `${url}/rest/v1/packages?select=*&is_published=eq.true&order=sort_order.asc,name.asc&limit=1000`,
    { headers: { apikey: key }, ...(signal ? { signal } : {}) },
  );
  if (!response.ok)
    throw new Error("We couldn’t load our experiences. Please try again or contact RA2 directly.");
  return packageRecordSchema.array().parse(await response.json());
}

export const publicPackagesOptions = queryOptions({
  queryKey: ["public-packages"],
  queryFn: ({ signal }) => fetchPublishedPackages(signal),
  staleTime: 30000,
  refetchInterval: 60000,
});
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
