import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import hero from "@/assets/peninsula.jpg";
import { publicPackagesOptions, type TravelPackage } from "@/lib/packages";
import { CtaBand, PageHero } from "@/components/site/SiteChrome";
import { TourCardView } from "@/components/site/TourCardView";

export const Route = createFileRoute("/tours/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicPackagesOptions),
  head: () => ({
    meta: [
      { title: "Private Tours from Cape Town — RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Private day tours: Cape Peninsula, Winelands, City & Table Mountain and safari days.",
      },
      { property: "og:title", content: "Private Tours — RA2 Travel and Tours" },
      {
        property: "og:description",
        content: "Private day tours from Cape Town with your own guide.",
      },
    ],
  }),
  component: Tours,
});

const FILTERS: ("All" | TravelPackage["categories"][number])[] = [
  "All",
  "Coast",
  "Wine",
  "Wildlife",
  "City",
  "Adventure",
];

function Tours() {
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const tours = useSuspenseQuery({
    ...publicPackagesOptions,
    initialData: Route.useLoaderData(),
  }).data.filter((p) => p.show_in_tours);
  const list = f === "All" ? tours : tours.filter((t) => t.categories.includes(f));
  return (
    <>
      <PageHero
        eyebrow="Private Tours"
        title="Day tours, entirely your own."
        intro="Choose a route, then let us shape the timings, stops and pace around you."
        image={hero}
      />
      <section className="py-20">
        <div className="container-site">
          <div className="mb-10 flex flex-wrap gap-2">
            {FILTERS.map((x) => (
              <button
                key={x}
                onClick={() => setF(x)}
                className={`rounded-full border px-5 py-2 text-sm transition-colors ${f === x ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-gold"}`}
              >
                {x}
              </button>
            ))}
          </div>
          {list.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <TourCardView key={t.slug} tour={t} />
              ))}
            </div>
          ) : (
            <p className="rounded-md bg-secondary p-10 text-center text-muted-foreground">
              No published tours in this category yet — tell us what you have in mind and we'll
              suggest a route.
            </p>
          )}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
