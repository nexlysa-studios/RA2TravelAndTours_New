import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Compass, MapPinned, HeartHandshake, Instagram } from "lucide-react";
import hero from "@/assets/hero.jpg";
import heroVideo from "@/assets/herovid.mp4";
import peninsula from "@/assets/peninsula.jpg";
import winelands from "@/assets/winelands.jpg";
import safari from "@/assets/safari.jpg";
import { CONTACT } from "@/lib/site";
import { publicPackagesOptions } from "@/lib/packages";
import { CtaBand, GoldButton } from "@/components/site/SiteChrome";
import { TourCardView } from "@/components/site/TourCardView";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicPackagesOptions),
  head: () => ({
    meta: [
      { title: "RA2 Travel and Tours — Your South Africa. Beautifully personal." },
      {
        name: "description",
        content:
          "Private Cape Town tours, safaris and tailor-made journeys, personally hosted by Rezah Payne and the RA2 team.",
      },
      { property: "og:title", content: "RA2 Travel and Tours" },
      {
        property: "og:description",
        content: "Private Cape Town tours, safaris and tailor-made journeys.",
      },
    ],
  }),
  component: Home,
});

const WHY = [
  {
    icon: Compass,
    title: "Private by design",
    text: "Your own vehicle and guide, with a pace set around you rather than a group timetable.",
  },
  {
    icon: MapPinned,
    title: "Local knowledge",
    text: "Cape Town-based hosts who know the routes, the weather and the quieter viewpoints.",
  },
  {
    icon: HeartHandshake,
    title: "Personal planning",
    text: "Every enquiry is answered by a person, with a quote shaped to your dates and interests.",
  },
];

function Home() {
  const featured = useSuspenseQuery({
    ...publicPackagesOptions,
    initialData: Route.useLoaderData(),
  }).data.filter((p) => p.featured);
  return (
    <>
      <section className="relative isolate flex min-h-[88vh] items-end overflow-hidden">
        <img
          src={hero}
          alt="Chapman's Peak Drive at sunset"
          width={1920}
          height={1088}
          className="absolute inset-0 z-0 h-full w-full object-cover md:hidden"
        />
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={hero}
          aria-hidden="true"
          className="absolute inset-0 z-0 hidden h-full w-full object-cover md:block"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-scrim absolute inset-0 z-10" />
        <div className="container-site relative z-20 pb-20 pt-40 text-ivory">
          <p className="eyebrow mb-5">RA2 Travel and Tours · Cape Town</p>
          <h1 className="max-w-4xl text-5xl md:text-8xl">
            Your South Africa.
            <br />
            <em className="font-normal">Beautifully personal.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ivory/90">
            Private Cape Town tours, safaris and tailor-made journeys.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <GoldButton to="/tours">Explore Tours</GoldButton>
            <GoldButton to="/plan-my-trip" variant="outline">
              Plan My Trip
            </GoldButton>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-site">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow mb-3">Signature experiences</p>
              <h2 className="text-4xl md:text-6xl">Iconic places. Meaningful moments.</h2>
              <p className="mt-4 text-muted-foreground">
                From coastal drives to world-class wine regions and unforgettable safaris, discover
                South Africa with your own private guide.
              </p>
            </div>
            <Link to="/tours" className="text-sm font-semibold text-primary hover:underline">
              View all private tours →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((t) => (
              <TourCardView key={t.id} tour={t} />
            ))}
            <article className="group flex flex-col overflow-hidden rounded-md bg-card shadow-sm ring-1 ring-border">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={safari}
                  alt="Elephants in the bushveld"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="eyebrow mb-2">Day trip or stay</p>
                <h3 className="text-2xl">Safaris</h3>
                <p className="mt-2 flex-1 text-muted-foreground">
                  Aquila, Kruger and Sabi Sands — each with its own location and travel
                  arrangements.
                </p>
                <Link
                  to="/safaris"
                  className="mt-6 text-sm font-semibold text-primary hover:underline"
                >
                  Compare safaris →
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-24">
        <div className="container-site">
          <p className="eyebrow mb-3">Why RA2</p>
          <h2 className="mb-14 max-w-2xl text-4xl md:text-5xl">
            Travel that feels like it was planned just for you — because it was.
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.title} className="border-t border-gold pt-6">
                <w.icon className="mb-4 size-7 text-gold" strokeWidth={1.5} />
                <h3 className="text-2xl">{w.title}</h3>
                <p className="mt-2 text-muted-foreground">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-site grid items-center gap-12 md:grid-cols-2">
          <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-muted p-8 text-center text-muted-foreground ring-1 ring-border">
            Photograph of Rezah and the RA2 team — to be supplied
          </div>
          <div>
            <p className="eyebrow mb-3">The people behind RA2</p>
            <h2 className="text-4xl md:text-5xl">Personally hosted by Rezah Payne.</h2>
            <p className="mt-5 text-muted-foreground">
              RA2 is a Cape Town tour company built around one idea: the person who plans your trip
              should care how it feels. Rezah and the team handle every enquiry, route and pickup
              personally.
            </p>
            <div className="mt-8">
              <GoldButton to="/about" variant="dark">
                Meet the team
              </GoldButton>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest-deep py-24 text-ivory">
        <div className="container-site text-center">
          <p className="eyebrow mb-3">Guest reviews</p>
          <blockquote className="mx-auto max-w-3xl font-serif text-3xl italic leading-snug md:text-4xl">
            "Verified guest reviews will appear here, each linked to its original source."
          </blockquote>
          <p className="mt-6 text-sm text-ivory/60">Awaiting approved reviews from RA2</p>
        </div>
      </section>

      <section className="py-24">
        <div className="container-site">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-3">Guest moments</p>
              <h2 className="text-4xl md:text-5xl">Follow our journeys.</h2>
            </div>
            <a
              href={CONTACT.instagram}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Instagram className="size-4" />
              {CONTACT.instagramHandle}
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[peninsula, winelands, safari, hero].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded-sm object-cover"
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Guest photographs shared with permission.
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
