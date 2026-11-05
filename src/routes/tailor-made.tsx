import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import hero from "@/assets/winelands.jpg";
import { packageImage, publicPackagesOptions } from "@/lib/packages";
import { CtaBand, GoldButton, PageHero } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/tailor-made")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicPackagesOptions),
  head: () => ({
    meta: [
      { title: "Tailor-made South African Journeys — RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Multi-day journeys along the Garden Route, Cape coast and safari, planned around you.",
      },
      { property: "og:title", content: "Tailor-made Journeys — RA2" },
      { property: "og:description", content: "More time. More South Africa." },
    ],
  }),
  component: Page,
});

function Page() {
  const journeys = useSuspenseQuery({
    ...publicPackagesOptions,
    initialData: Route.useLoaderData(),
  }).data.filter((p) => p.package_type === "journey" && p.show_on_category_page);
  return (
    <>
      <PageHero
        eyebrow="Tailor-made Journeys"
        title={
          <>
            More time.
            <br />
            More South Africa.
          </>
        }
        intro="Curated journeys with seamless travel, handpicked stays and experiences shaped around you."
        image={hero}
      >
        <GoldButton to="/plan-my-trip">Request a Quote</GoldButton>
      </PageHero>
      <section className="py-20">
        <div className="container-site space-y-16">
          {journeys.map((j, i) => (
            <article
              key={j.id}
              className={`grid items-center gap-10 md:grid-cols-2 ${i % 2 ? "md:[&>img]:order-2" : ""}`}
            >
              <img
                src={packageImage(j)}
                alt={j.image_alt || j.name}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-md object-cover"
              />
              <div>
                <p className="eyebrow mb-2">{j.duration}</p>
                <h2 className="text-4xl">{j.name}</h2>
                <p className="mt-3 text-muted-foreground">{j.summary}</p>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  Sample itinerary — routes, stays and inclusions are confirmed in your proposal.
                </p>
                <Link to="/tours/$slug" params={{ slug: j.slug }} className="booking-button mt-6">
                  Explore this journey
                </Link>
              </div>
            </article>
          ))}
          {!journeys.length && (
            <p className="text-muted-foreground">
              We’re updating our journey ideas. Tell us what you have in mind and we’ll plan
              something personal.
            </p>
          )}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
