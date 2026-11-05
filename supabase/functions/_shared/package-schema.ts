import { z } from "zod";

export const PACKAGE_TYPES = ["tour", "safari", "journey", "transfer", "consultation"] as const;
export const PACKAGE_CATEGORIES = ["Coast", "Wine", "Wildlife", "City", "Adventure"] as const;
export const IMAGE_KEYS = ["peninsula", "winelands", "safari", "hero"] as const;
const text = (max: number) => z.string().trim().max(max);
const lines = z.array(text(1000).min(1, "Remove empty list items.")).max(60);
const imageUrl = text(2048).refine((value) => {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "Use an HTTPS image URL or upload a photo.");

export const packageFieldsSchema = z.object({
  name: text(140).min(2, "Enter the package name."),
  slug: text(80)
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  package_type: z.enum(PACKAGE_TYPES),
  subtitle: text(180),
  tagline: text(300),
  summary: text(500),
  description: text(12000),
  overview_title: text(180),
  overview_text: text(8000),
  location: text(200),
  duration: text(120),
  badge: text(80),
  image_key: z.enum(IMAGE_KEYS),
  image_url: imageUrl,
  image_alt: text(240),
  categories: z.array(z.enum(PACKAGE_CATEGORIES)).max(5),
  facts: z.array(z.object({ label: text(100).min(1), value: text(1000).min(1) })).max(20),
  highlights: lines,
  itinerary: z
    .array(
      z.object({
        title: text(180).min(1, "Give each stop a title."),
        label: text(100),
        body: text(6000).min(1, "Describe each stop."),
      }),
    )
    .max(30),
  itinerary_note: text(1500),
  included: lines,
  excluded: lines,
  customisation_intro: text(3000),
  customisation_options: lines,
  before_you_go: text(6000),
  booking_terms: text(4000),
  faqs: z
    .array(
      z.object({
        question: text(240).min(1, "Enter the question."),
        answer: text(5000).min(1, "Enter the answer."),
      }),
    )
    .max(30),
  cta_title: text(180),
  cta_text: text(1500),
  cta_label: text(80),
  seo_title: text(180),
  seo_description: text(500),
  is_published: z.boolean(),
  show_in_tours: z.boolean(),
  show_on_category_page: z.boolean(),
  featured: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

export const packageSchema = packageFieldsSchema.superRefine((value, ctx) => {
  if (value.is_published) {
    for (const key of ["summary", "description", "location", "duration"] as const) {
      if (!value[key])
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `Add ${key.replaceAll("_", " ")} before publishing.`,
        });
    }
  }
});
export type PackageFields = z.infer<typeof packageFieldsSchema>;
export type TravelPackage = PackageFields & { id: string; created_at: string; updated_at: string };
export const packageRecordSchema = packageFieldsSchema.extend({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export function newPackage(): PackageFields {
  return {
    name: "",
    slug: "",
    package_type: "tour",
    subtitle: "",
    tagline: "",
    summary: "",
    description: "",
    overview_title: "",
    overview_text: "",
    location: "",
    duration: "",
    badge: "Private",
    image_key: "peninsula",
    image_url: "",
    image_alt: "",
    categories: [],
    facts: [],
    highlights: [],
    itinerary: [],
    itinerary_note: "",
    included: [],
    excluded: [],
    customisation_intro: "",
    customisation_options: [],
    before_you_go: "",
    booking_terms: "",
    faqs: [],
    cta_title: "",
    cta_text: "",
    cta_label: "Request a Quote",
    seo_title: "",
    seo_description: "",
    is_published: false,
    show_in_tours: true,
    show_on_category_page: true,
    featured: false,
    sort_order: 100,
  };
}
