import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publicPackagesOptions } from "@/lib/packages";
import { TourCardView } from "@/components/site/TourCardView";
import { publicFleetOptions } from "@/lib/fleet";
import { FleetCard } from "@/components/site/FleetCards";
import hero from "@/assets/hero.jpg";
import { CONTACT } from "@/lib/site";
import { GoldButton, PageHero } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/transfers")({
  loader: async ({ context }) => {
    const [packages, fleet] = await Promise.all([
      context.queryClient.ensureQueryData(publicPackagesOptions),
      context.queryClient.ensureQueryData(publicFleetOptions),
    ]);
    return { packages, fleet };
  },
  head: () => ({
    meta: [
      { title: "Our Fleet — Transfers & Chauffeur Service | RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Explore RA2's sedan, van and coach options for private Cape Town transfers and group travel.",
      },
      { property: "og:title", content: "Our Fleet — RA2 Travel and Tours" },
      {
        property: "og:description",
        content: "Find a comfortable ride for your Cape Town transfer or group journey.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const loaderData = Route.useLoaderData();
  const fleet = useSuspenseQuery({ ...publicFleetOptions, initialData: loaderData.fleet }).data;
  const packages = useSuspenseQuery({
    ...publicPackagesOptions,
    initialData: loaderData.packages,
  }).data.filter((p) => p.package_type === "transfer" && p.show_on_category_page);
  const primary = packages[0];
  return (
    <>
      <PageHero
        eyebrow="Transfers & Chauffeur"
        title="The right ride for the road ahead."
        intro="From a private sedan to a spacious group vehicle, explore the fleet for your Cape Town transfer or journey."
        image={hero}
      >
        {primary && (
          <Link
            to="/plan-my-trip"
            search={{ package: primary.id, experience: primary.name }}
            className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-forest-deep hover:bg-ivory"
          >
            {primary.cta_label || "Request a Transfer Quote"}
          </Link>
        )}
      </PageHero>
      {packages.length > 0 && (
        <section className="py-14">
          <div className="container-site">
            <p className="eyebrow mb-3">Travel your way</p>
            <h2 className="mb-8 text-4xl">Your private transfer.</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <TourCardView key={pkg.id} tour={pkg} />
              ))}
            </div>
          </div>
        </section>
      )}
      <section id="fleet" className="scroll-mt-24 py-20">
        <div className="container-site">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Our Fleet</p>
            <h2 className="text-4xl md:text-5xl">Find your seat.</h2>
            <p className="mt-4 text-muted-foreground">
              Browse the vehicles and their illustrated seating information. Tell us about your
              group and luggage when you enquire, and we can help find the right fit.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {fleet.map((vehicle) => (
              <FleetCard key={vehicle.id} vehicle={vehicle} package={primary} />
            ))}
            {!fleet.length && (
              <p className="text-muted-foreground sm:col-span-2">
                Our team can recommend a suitable vehicle. Contact RA2 with your group and luggage
                details.
              </p>
            )}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Vehicle and seating visuals are illustrative. Vehicle availability, seating
            configuration and luggage fit are confirmed when booking.
          </p>
        </div>
      </section>
      <section className="bg-forest py-20 text-ivory">
        <div className="container-site text-center">
          <p className="eyebrow mb-3">Transfers & chauffeur</p>
          <h2 className="text-4xl md:text-5xl">Ready to plan your journey?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ivory/80">
            Share your travel date, passenger count and luggage details for a tailored quote.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {primary && (
              <Link
                to="/plan-my-trip"
                search={{ package: primary.id, experience: primary.name }}
                className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-forest-deep hover:bg-ivory"
              >
                {primary.cta_label || "Request a Quote"}
              </Link>
            )}
            <GoldButton href={CONTACT.whatsapp} variant="outline">
              WhatsApp {CONTACT.phone}
            </GoldButton>
          </div>
        </div>
      </section>
    </>
  );
}
