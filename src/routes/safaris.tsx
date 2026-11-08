import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import hero from "@/assets/safari.jpg";
import aquilaSafariDay from "@/assets/aquila-safari-day.webp";
import krugerSafari from "@/assets/kruger-safari.jpg";
import sabiSandsSafari from "@/assets/sabi-sands-safari.jpg";
import { CtaBand, PageHero } from "@/components/site/SiteChrome";
import { TourCardView } from "@/components/site/TourCardView";
import { publicPackagesOptions } from "@/lib/packages";

export const Route = createFileRoute("/safaris")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicPackagesOptions),
  head: () => ({
    meta: [
      { title: "Safaris: Aquila, Kruger & Sabi Sands — RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Compare Aquila day safaris with Kruger and Sabi Sands stays, and how RA2 arranges travel.",
      },
      { property: "og:title", content: "Safaris with RA2" },
      { property: "og:description", content: "Aquila, Kruger and Sabi Sands, clearly explained." },
    ],
  }),
  component: Page,
});

function Page() {
  const safaris = useSuspenseQuery({
    ...publicPackagesOptions,
    initialData: Route.useLoaderData(),
  }).data.filter((p) => p.package_type === "safari" && p.show_on_category_page);
  return (
    <>
      <PageHero
        eyebrow="Safaris"
        title="Find your kind of wild."
        intro="Each safari has its own location, travel and stay. Explore the options and let us arrange your journey."
        image={hero}
      />
      <section className="py-20">
        <div className="container-site grid gap-6 md:grid-cols-3">
          {safaris.map((s) => {
            const tour =
              s.slug === "aquila"
                ? {
                    ...s,
                    image_url: aquilaSafariDay,
                    image_alt: "Aquila safari vehicle near rhinos in the reserve",
                  }
                : s.slug === "kruger"
                  ? {
                      ...s,
                      image_url: krugerSafari,
                      image_alt: "Elephants beside a waterhole in Kruger National Park",
                    }
                  : s.slug === "sabi-sands"
                    ? {
                        ...s,
                        image_url: sabiSandsSafari,
                        image_alt: "Safari lodge dining deck beside a river in Sabi Sands",
                      }
                  : s;
            return <TourCardView key={s.id} tour={tour} />;
          })}
          {!safaris.length && (
            <p className="text-muted-foreground md:col-span-3">
              We’re updating our safari options. Contact us to plan your stay.
            </p>
          )}
        </div>
        <p className="container-site mt-8 text-sm text-muted-foreground">
          Wildlife sightings cannot be guaranteed. Lodges, prices and availability are confirmed
          with your quote.
        </p>
      </section>
      <CtaBand />
    </>
  );
}
