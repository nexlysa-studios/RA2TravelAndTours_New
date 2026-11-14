import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, CalendarRange, Clock3, MapPinned, Sparkles } from "lucide-react";
import { GoldButton } from "@/components/site/SiteChrome";
import { FleetCard } from "@/components/site/FleetCards";
import { publicFleetOptions } from "@/lib/fleet";
import { CONTACT } from "@/lib/site";
import chauffeur from "@/assets/Fleet (5).JPG";
import businessMeetings from "@/assets/Business & Meetings.webp";
import shoppingDining from "@/assets/Shopping & Dining.webp";
import eventsSpecialOccasions from "@/assets/Events & Special Occasions.webp";
import coast from "@/assets/peninsula.jpg";

export const Route = createFileRoute("/chauffeurs")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicFleetOptions),
  head: () => ({
    meta: [
      { title: "Private Chauffeur Services | RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Arrange a private driver for flexible, multi-stop travel in Cape Town and across South Africa.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const initialFleet = Route.useLoaderData();
  const fleet = useSuspenseQuery({ ...publicFleetOptions, initialData: initialFleet }).data;

  return (
    <main className="bg-ivory">
      <section className="relative isolate overflow-hidden bg-forest-deep text-ivory">
        <img
          src={businessMeetings}
          alt="A private chauffeur welcoming guests at an evening event"
          className="absolute inset-0 -z-20 size-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-deep/95 via-forest-deep/70 to-forest-deep/10" />
        <div className="container-site flex min-h-[360px] items-center py-14 sm:min-h-[420px]">
          <div className="max-w-xl">
            <p className="eyebrow mb-4">Private chauffeur services</p>
            <h1 className="text-5xl leading-[1.02] sm:text-6xl">
              Your schedule.
              <br />
              Your space.
              <br />
              <em>Your driver.</em>
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-ivory/85">
              A dedicated vehicle and driver for the time you book, around the day you have planned.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <GoldButton to="/plan-my-trip">
                Plan My Chauffeur Service <ArrowRight className="size-4" />
              </GoldButton>
              <GoldButton href={CONTACT.whatsapp} variant="outline">
                Ask us on WhatsApp
              </GoldButton>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Chauffeur service benefits" className="bg-forest-deep text-ivory">
        <div className="container-site flex flex-wrap items-center justify-center gap-x-7 gap-y-2 py-4 text-sm font-medium sm:gap-x-10 sm:text-base">
          <span>Agreed duration</span>
          <span aria-hidden="true" className="text-gold">
            •
          </span>
          <span>Planned stops</span>
          <span aria-hidden="true" className="text-gold">
            •
          </span>
          <span>Personal arrangements</span>
        </div>
      </section>

      <section className="container-site py-10 sm:py-12">
        <p className="mb-4 text-xs text-charcoal/75">
          <Link to="/" className="hover:text-forest">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/transfers" className="hover:text-forest">
            Transfers &amp; Chauffeur
          </Link>
          <span className="mx-2">/</span>
          <span aria-current="page">Chauffeur Services</span>
        </p>
        <h2 className="text-4xl text-forest-deep sm:text-5xl">
          Make room for everything your day holds.
        </h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <ServiceCard
            image={businessMeetings}
            alt="A chauffeur arriving with guests for an evening event"
            title="Business & Meetings"
            copy="Reliable, comfortable transport for meetings, site visits and business arrangements around the city."
          />
          <ServiceCard
            image={shoppingDining}
            alt="Guests enjoying chauffeur transport while shopping and dining"
            title="Shopping & Dining"
            copy="A flexible, convenient way to enjoy shopping, restaurants and other personal plans at your own pace."
          />
          <ServiceCard
            image={eventsSpecialOccasions}
            alt="A chauffeur assisting guests at a hotel"
            title="Events & Special Occasions"
            copy="Stylish, door-to-door transport for events, celebrations and memorable occasions."
          />
        </div>
      </section>

      <section className="container-site pb-10 sm:pb-14">
        <h2 className="mb-5 text-4xl text-forest-deep sm:text-5xl">Choose the time you need.</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <DurationCard
            icon={Clock3}
            title="Half Day"
            copy="For a shorter schedule with planned stops."
          />
          <DurationCard
            icon={CalendarDays}
            title="Full Day"
            copy="For a day with several places to be."
          />
          <DurationCard
            icon={CalendarRange}
            title="Multi-Day"
            copy="For travel that continues beyond one day."
          />
        </div>
        <p className="mt-3 text-center text-xs italic text-charcoal/75">
          Hours, route, mileage, waiting time and any overtime are agreed in your quotation.
        </p>
      </section>

      <section className="container-site grid items-center gap-6 pb-12 sm:pb-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <img
            src={coast}
            alt="A winding Cape Peninsula road beside the ocean"
            className="h-52 w-full rounded-lg object-cover sm:h-64"
            loading="lazy"
          />
          <h2 className="mt-5 text-4xl text-forest-deep sm:text-5xl">
            Tell us the day you have in mind. We’ll arrange the drive.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
            Share your appointments, preferred vehicle and any special requirements. We’ll help
            bring the transport arrangements together.
          </p>
          <Link
            to="/transfers"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-forest underline decoration-gold underline-offset-4"
          >
            Looking for a point-to-point transfer?
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div
          id="enquiry"
          className="scroll-mt-28 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <p className="eyebrow mb-2">Made around your plans</p>
          <h2 className="text-3xl text-forest-deep sm:text-4xl">Plan your chauffeur service.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Send us your date, preferred duration, pickup location, planned stops and passenger
            count. You can share your vehicle preference and any other details in your enquiry.
          </p>
          <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <EnquiryDetail icon={CalendarDays} label="Service date & duration" />
            <EnquiryDetail icon={MapPinned} label="Pickup & planned stops" />
            <EnquiryDetail icon={Sparkles} label="Personal arrangements" />
            <EnquiryDetail icon={Clock3} label="Hours & timing" />
          </ul>
          <Link
            to="/plan-my-trip"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-gold px-5 py-3 font-semibold text-forest-deep transition hover:bg-[#c5a452]"
          >
            Start your enquiry <ArrowRight className="size-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Your enquiry starts a conversation. Availability and final arrangements are confirmed
            with your quotation.
          </p>
        </div>
      </section>

      <section id="fleet" className="container-site scroll-mt-24 pb-14 sm:pb-16">
        <p className="eyebrow mb-3">Choose your vehicle</p>
        <h2 className="text-4xl text-forest-deep sm:text-5xl">Find the right fit for your day.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal/80 sm:text-base">
          Browse our available vehicles, then share your group and luggage details so we can confirm
          the best fit for your plans.
        </p>
        {fleet.length > 0 ? (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {fleet.map((vehicle) => (
              <FleetCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <p className="mt-7 text-sm text-muted-foreground">
            Our team can recommend a suitable vehicle with your quotation.
          </p>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Vehicle availability, seating and luggage fit are confirmed with your quotation.
        </p>
      </section>

      <section className="bg-forest-deep text-ivory">
        <div className="container-site flex flex-col items-center justify-between gap-4 py-6 text-center sm:flex-row sm:text-left">
          <h2 className="text-3xl sm:text-4xl">Only need a transfer from A to B?</h2>
          <Link
            to="/transfers"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-forest-deep transition hover:bg-ivory"
          >
            Explore Transfers <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function ServiceCard({
  image,
  alt,
  title,
  copy,
}: {
  image: string;
  alt: string;
  title: string;
  copy: string;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <img src={image} alt={alt} className="h-40 w-full object-cover sm:h-44" loading="lazy" />
      <div className="px-4 pb-4 pt-3">
        <h3 className="text-2xl text-forest-deep">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-charcoal/80">{copy}</p>
      </div>
    </article>
  );
}

function DurationCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Clock3;
  title: string;
  copy: string;
}) {
  return (
    <article className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 sm:p-5">
      <Icon className="mt-1 size-8 shrink-0 text-[#a57a27]" strokeWidth={1.7} />
      <div>
        <h3 className="text-2xl text-forest-deep">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-charcoal/80">{copy}</p>
      </div>
    </article>
  );
}

function EnquiryDetail({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-[#a57a27]" />
      <span>{label}</span>
    </li>
  );
}
