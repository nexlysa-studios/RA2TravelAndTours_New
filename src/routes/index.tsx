import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Compass, MapPinned, HeartHandshake } from "lucide-react";
import hero from "@/assets/hero.jpg";
import mobileHeroVideo from "@/assets/hero-mobile.mp4";
import heroVideo from "@/assets/herovid.mp4";
import safari from "@/assets/safari.jpg";
import google from "@/assets/google.svg";
import { CONTACT } from "@/lib/site";
import { publicPackagesOptions } from "@/lib/packages";
import { CtaBand, GoldButton } from "@/components/site/SiteChrome";
import { TourCardView } from "@/components/site/TourCardView";
import { GuestMoments } from "@/components/site/GuestMoments";
import { HomeFaq } from "@/components/site/HomeFaq";

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

const REVIEWS = [
  {
    name: "Henry King",
    text: "Rezah arranged a driver for the morning to take 6 of us from Cape Town to Boulders Beach, and then out later in the evening. 5* service throughout with quick WhatsApp responses. The van was very comfortable and Allie was exceptional all day. Will be using Ra2 whenever I am back in Cape Town!!",
  },
  {
    name: "Asma",
    text: "Pleasant guide, he did his best explaining facts of South africa and was generally in a good mood. Which can make ur experience better, thanks a lot",
  },
  {
    name: "nada essam",
    text: "We are a group of 3 adults and 1 child and we a had successful trip in capetown with Rezah, we enjoyed our time alot, the car is comfy and clean.. Rezah was a super guide provided amazing information. I highly recommend him",
  },
  {
    name: "Marlize White",
    text: "I've used them for many years and not once did they disappoint. Exceptional service and will always make a plan on short notice. Keep up the greatness",
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
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={hero}
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full object-cover md:hidden"
        >
          <source src={mobileHeroVideo} type="video/mp4" />
        </video>
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

      <section className="bg-forest-deep py-20 text-ivory md:py-24">
        <div className="container-site grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Your trip starts here</p>
            <h2 className="text-4xl md:text-5xl">Have a date in mind? Let’s make it a journey.</h2>
            <p className="mt-5 max-w-xl text-ivory/80">
              Tell Rezah what you’d love to see. The RA2 team will personally help shape your plans
              and prepare a quote around your trip.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-ivory/85 sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-gold" />A plan shaped around you
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-gold" />
                No payment to get started
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row md:flex-col">
            <GoldButton to="/plan-my-trip">
              Start planning your trip
              <ArrowRight className="size-4" />
            </GoldButton>
            <GoldButton href={CONTACT.whatsapp} variant="outline">
              Prefer to chat? WhatsApp us
            </GoldButton>
          </div>
        </div>
      </section>

      <section className="bg-forest-deep py-24 text-ivory">
        <div className="container-site">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-3">Guest reviews</p>
              <h2 className="text-4xl md:text-5xl">Good journeys, remembered.</h2>
            </div>
            <a
              href="https://share.google/Ea76q5olCfRNVfVcp"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-ivory underline decoration-gold underline-offset-4 transition-colors hover:text-gold"
            >
              Read more on Google
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {REVIEWS.map((review) => (
              <article
                key={review.name}
                className="flex h-full flex-col rounded-md bg-card p-5 text-card-foreground shadow-sm sm:p-6"
              >
                <div
                  role="img"
                  aria-label="5 out of 5 stars"
                  className="mb-4 text-xl leading-none tracking-[0.16em] text-yellow-500"
                >
                  ★★★★★
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  “{review.text}”
                </blockquote>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm font-semibold">{review.name}</p>
                  <img src={google} alt="Google" className="size-5" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <GuestMoments />
      <CtaBand />
      <HomeFaq />
    </>
  );
}
