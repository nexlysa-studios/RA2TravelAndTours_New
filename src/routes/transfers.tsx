import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, CarFront, FileText, Luggage, MapPin, Plane, UsersRound } from "lucide-react";
import { publicFleetOptions } from "@/lib/fleet";
import { publicPackagesOptions } from "@/lib/packages";
import { FleetCard } from "@/components/site/FleetCards";
import airport from "@/assets/Airport-hotel.webp";
import lodge from "@/assets/safari-lodge.webp";
import coast from "@/assets/city-city.webp";
import van from "@/assets/right-details.webp";

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
      { title: "Private Transfers in Cape Town | RA2 Travel and Tours" },
      { name: "description", content: "Private airport, hotel, safari lodge and city-to-city transfers across Cape Town and South Africa." },
      { property: "og:title", content: "Private Transfers | RA2 Travel and Tours" },
      { property: "og:description", content: "Arrive ready for what’s next with a private RA2 transfer." },
    ],
  }),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  const fleet = useSuspenseQuery({ ...publicFleetOptions, initialData: data.fleet }).data;
  const primary = useSuspenseQuery({ ...publicPackagesOptions, initialData: data.packages }).data
    .find((pkg) => pkg.package_type === "transfer" && pkg.show_on_category_page);
  const quoteSearch = primary ? { package: primary.id, experience: primary.name } : {};

  return (
    <main className="bg-ivory">
      <section className="relative isolate overflow-hidden bg-forest-deep text-ivory">
        <img src={airport} alt="The coastal road to a new Cape Town adventure" className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-deep/95 via-forest-deep/75 to-forest-deep/10" />
        <div className="container-site flex min-h-[390px] items-center py-14 sm:min-h-[440px]">
          <div className="max-w-xl">
            <p className="mb-5 text-sm text-ivory/75">Home&nbsp; / &nbsp;Transfers</p>
            <p className="eyebrow mb-3">Private transfers</p>
            <h1 className="text-5xl leading-[1.02] sm:text-6xl">Arrive ready for<br /><em>what’s next.</em></h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-ivory/85">Private airport, hotel, safari lodge and city-to-city transfers, arranged around your journey.</p>
            <Link to="/plan-my-trip" search={quoteSearch} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-md bg-gold px-6 py-3 font-semibold text-forest-deep shadow-sm transition hover:bg-ivory">
              Request My Transfer Quote <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Transfer benefits" className="bg-forest-deep text-ivory">
        <div className="container-site grid gap-4 py-5 text-sm font-medium sm:grid-cols-3 sm:gap-0">
          <div className="flex items-center justify-center gap-3 sm:border-r sm:border-gold"><Plane className="size-6 text-gold" />Private travel</div>
          <div className="flex items-center justify-center gap-3 sm:border-r sm:border-gold"><UsersRound className="size-6 text-gold" />Vehicle matched to your group</div>
          <div className="flex items-center justify-center gap-3"><FileText className="size-6 text-gold" />Clear quotation</div>
        </div>
      </section>

      <section className="container-site py-12 sm:py-16">
        <h2 className="mb-7 text-4xl text-forest-deep sm:text-5xl">Where can we take you?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Destination image={airport} alt="Coastal road in Cape Town" title="Airport & hotel" copy="Start or finish your trip with an arranged pickup." />
          <Destination image={lodge} alt="A safari lodge surrounded by greenery" title="Safari lodge" copy="Connect your stay with your next safari destination." />
          <Destination image={coast} alt="The Cape Peninsula coastline" title="City-to-city" copy="Plan a comfortable journey between destinations." />
        </div>
      </section>

      <section className="container-site grid gap-5 pb-16 lg:grid-cols-[1.55fr_0.95fr]">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <p className="eyebrow mb-2">Start with the details</p>
          <h2 className="text-3xl text-forest-deep sm:text-4xl">Tell us about your transfer.</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">Share your pickup, destination, date and group details. Our secure enquiry takes a few steps and gives our team what they need to prepare your quote.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MiniDetail icon={MapPin} title="Your route" copy="Pickup and drop-off" />
            <MiniDetail icon={CalendarDays} title="Your timing" copy="Date and pickup time" />
            <MiniDetail icon={Luggage} title="Your group" copy="Passengers and luggage" />
          </div>
          <Link to="/plan-my-trip" search={quoteSearch} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-gold px-5 py-3 font-semibold text-forest-deep transition hover:bg-[#c5a452]">
            Request My Transfer Quote <ArrowRight className="size-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">Submitting an enquiry does not confirm your booking. We’ll confirm availability and arrangements with your quotation.</p>
        </div>

        <aside className="space-y-5">
          <div className="relative overflow-hidden rounded-xl bg-forest p-6 text-ivory">
            <div className="absolute -bottom-10 -right-2 h-24 w-40 -rotate-12 rounded-[50%] border-t-8 border-gold/20" />
            <p className="eyebrow mb-2">More than a pickup</p>
            <h2 className="max-w-xs text-3xl">Need a driver for several stops?</h2>
            <p className="mt-2 text-sm text-ivory/80">Explore our private chauffeur services for flexible travel throughout the day.</p>
            <Link to="/chauffeurs" className="mt-4 inline-flex items-center gap-2 font-semibold text-gold underline decoration-gold/60 underline-offset-4">View Chauffeur Services <ArrowRight className="size-4" /></Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-2xl text-forest-deep">Frequently asked questions</h2>
            <Faq question="Can I arrange a return transfer?" answer="Yes. Include both journeys and timings in your request and we’ll confirm the arrangements in your quote." />
            <Faq question="What if my flight time changes?" answer="Send us your updated flight details as soon as you can so the team can review the pickup plan." />
            <Faq question="Can I request a child seat?" answer="Yes. Let us know your child’s age and seat requirements when you enquire so we can confirm availability." />
          </div>
        </aside>
      </section>

      <section id="fleet" className="container-site scroll-mt-24 pb-14 sm:pb-16">
        <h2 className="mb-7 text-4xl leading-tight text-forest-deep sm:text-5xl">The right vehicle starts with the right details.</h2>
        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
          <img src={van} alt="RA2 vehicles beside the Cape Town coast at sunset" className="h-52 w-full rounded-lg object-cover object-center sm:h-64" />
          <div className="border-l-2 border-gold py-2 pl-6 text-lg leading-relaxed text-charcoal/85">
            <CarFront className="mb-3 size-8 text-forest" />
            Tell us your passenger numbers, luggage and any child-seat or mobility requirements. We’ll confirm a suitable vehicle and what is included in your quote.
          </div>
        </div>
        {fleet.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {fleet.map((vehicle) => (
              <FleetCard key={vehicle.id} vehicle={vehicle} package={primary} />
            ))}
          </div>
        )}
        {!fleet.length && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Our team can recommend a suitable vehicle with your quotation.
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-border px-4 py-4 text-sm font-semibold text-forest-deep sm:gap-7 sm:text-base">
          <Step icon={MapPin} label="Share your route" /><ArrowRight className="hidden size-5 text-gold sm:block" />
          <Step icon={FileText} label="Receive your quote" /><ArrowRight className="hidden size-5 text-gold sm:block" />
          <Step icon={CalendarDays} label="Confirm your booking" />
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Vehicle availability, seating and luggage fit are confirmed with your quotation.</p>
      </section>
    </main>
  );
}

function Destination({ image, alt, title, copy }: { image: string; alt: string; title: string; copy: string }) {
  return <article className="overflow-hidden rounded-xl border border-border bg-card p-1.5"><img src={image} alt={alt} className="h-40 w-full rounded-lg object-cover sm:h-44" /><div className="px-3 pb-4 pt-3"><h3 className="text-2xl text-forest-deep">{title}</h3><p className="mt-1 text-sm text-charcoal/80">{copy}</p></div></article>;
}

function Step({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return <div className="flex items-center gap-2"><Icon className="size-7 text-[#a57a27]" strokeWidth={1.7} />{label}</div>;
}

function MiniDetail({ icon: Icon, title, copy }: { icon: typeof MapPin; title: string; copy: string }) {
  return <div className="flex items-center gap-3 rounded-lg bg-secondary/55 p-3"><Icon className="size-5 shrink-0 text-[#a57a27]" /><div><p className="text-sm font-semibold text-forest-deep">{title}</p><p className="text-xs text-muted-foreground">{copy}</p></div></div>;
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return <details className="group border-t border-border py-3"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-forest-deep">{question}<span className="transition-transform group-open:rotate-180">⌄</span></summary><p className="pt-2 text-sm leading-relaxed text-muted-foreground">{answer}</p></details>;
}
