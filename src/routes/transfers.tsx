import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publicPackagesOptions } from "@/lib/packages";
import { TourCardView } from "@/components/site/TourCardView";
import hero from "@/assets/hero.jpg";
import sedan from "@/assets/Fleet (9).JPG";
import mercedesC180 from "@/assets/Fleet (2).JPG";
import toyotaRumion from "@/assets/Fleet (4).JPG";
import mercedesVClass from "@/assets/Fleet (10).JPG";
import hyundaiStaria from "@/assets/Fleet (3).JPG";
import toyotaQuantum from "@/assets/Fleet (1).JPG";
import toyotaQuantumGl from "@/assets/Fleet (6).JPG";
import toyotaHiace from "@/assets/Fleet (8).JPG";
import mercedesSprinter from "@/assets/Fleet (5).JPG";
import bus from "@/assets/Fleet (7).JPG";
import { CONTACT } from "@/lib/site";
import { GoldButton, PageHero } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/transfers")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicPackagesOptions),
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

const FLEET = [
  {
    name: "Standard Sedan",
    capacity: "Recommended for 1–3 guests",
    description: "Everyday comfort for private transfers and smaller journeys.",
    image: sedan,
  },
  {
    name: "Mercedes-Benz C180",
    capacity: "Private travel for 1–3 guests",
    description: "A refined sedan option for a comfortable private trip.",
    image: mercedesC180,
  },
  {
    name: "Toyota Rumion",
    capacity: "Up to 6 guests",
    description: "A compact MPV suited to families and small groups.",
    image: toyotaRumion,
  },
  {
    name: "Mercedes-Benz V-Class",
    capacity: "Up to 6 guests",
    description: "Premium passenger travel with a spacious cabin.",
    image: mercedesVClass,
  },
  {
    name: "Hyundai Staria",
    capacity: "Up to 8 guests + driver",
    description: "An executive-style people mover for small groups.",
    image: hyundaiStaria,
  },
  {
    name: "Toyota Quantum",
    capacity: "Up to 10 guests + driver",
    description: "A roomy option for airport transfers and group travel.",
    image: toyotaQuantum,
  },
  {
    name: "Toyota Quantum GL",
    capacity: "13 passengers + driver",
    description: "Extra capacity for group transfers and private tours.",
    image: toyotaQuantumGl,
  },
  {
    name: "Toyota Hiace GL",
    capacity: "13 guests + driver",
    description: "Classic group transport with a spacious passenger cabin.",
    image: toyotaHiace,
  },
  {
    name: "Mercedes-Benz Sprinter",
    capacity: "20 guests + driver",
    description: "A larger vehicle for group journeys and transfers.",
    image: mercedesSprinter,
  },
  {
    name: "30-Seater Bus",
    capacity: "Confirm available guest seats when booking",
    description: "A coach option for larger groups and shared journeys.",
    image: bus,
  },
];

function Page() {
  const packages = useSuspenseQuery({
    ...publicPackagesOptions,
    initialData: Route.useLoaderData(),
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
            {FLEET.map((vehicle) => (
              <article
                key={vehicle.name}
                className="overflow-hidden rounded-md bg-card ring-1 ring-border"
              >
                <div className="aspect-[2/3] bg-muted">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.name} vehicle and seating information`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="space-y-3 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                    {vehicle.capacity}
                  </p>
                  <h3 className="font-serif text-2xl text-foreground">{vehicle.name}</h3>
                  <p className="text-sm text-muted-foreground">{vehicle.description}</p>
                </div>
              </article>
            ))}
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
