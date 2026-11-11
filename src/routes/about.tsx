import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CarFront, ClipboardCheck, UsersRound } from "lucide-react";
import hero from "@/assets/peninsula.jpg";
import ra2Logo from "@/assets/Ra2logo.png";
import { CONTACT } from "@/lib/site";
import { GoldButton } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About RA2 — Rezah Payne & Team | RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Meet the Cape Town family behind RA2 Travel and Tours. Thoughtful planning, local guiding and personal care for journeys across South Africa.",
      },
      { property: "og:title", content: "About RA2 Travel and Tours" },
      { property: "og:description", content: "One family. A team behind your journey." },
    ],
  }),
  component: Page,
});

const people = [
  {
    name: "Aneesa Payne",
    role: "Planning & bookings",
    copy: "With more than 25 years working with luxury safari and hotel brands, Aneesa shapes your itinerary, coordinates bookings and adds the thoughtful finishing touches. She considers how each day flows so every arrangement fits together.",
  },
  {
    name: "Rezah Payne & our team",
    role: "Guiding & operations",
    copy: "Rezah is a registered Western Cape tourist guide. He and the team coordinate drivers, vehicles, pickups and tour schedules, bringing your plans to life on the ground with local knowledge and practical care.",
  },
  {
    name: "Raeez Payne",
    role: "Tours & adventure",
    copy: "At 22, Raeez brings fresh energy to our tours, with hiking and outdoor experiences adding another dimension. His youthful perspective connects naturally with younger travellers and welcomes guests across generations.",
  },
];

const promises = [
  {
    icon: CalendarDays,
    title: "Your interests. Your itinerary.",
    copy: "Experiences chosen around your dates, budget and preferred pace.",
  },
  {
    icon: CarFront,
    title: "Your comfort considered.",
    copy: "Routes, vehicles, luggage and group requirements planned together.",
  },
  {
    icon: ClipboardCheck,
    title: "Clear before you book.",
    copy: "A personalised quotation explains your proposed services and inclusions.",
  },
  {
    icon: UsersRound,
    title: "Personal attention throughout.",
    copy: "Aneesa shapes the plan. Rezah and the team bring it to life.",
  },
];

function Page() {
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-forest-deep text-ivory">
        <div className="absolute inset-0 -z-10 md:left-[43%]">
          <img
            src={hero}
            alt="The winding coastal road along Cape Town's Atlantic coast at sunset"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/65 to-forest-deep/20 md:bg-gradient-to-r md:from-forest-deep md:via-forest-deep/55 md:to-transparent" />
        </div>
        <div className="container-site grid min-h-[610px] items-end gap-10 pb-14 pt-20 md:min-h-[640px] md:grid-cols-[1fr_0.82fr] md:items-center md:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5 flex items-center gap-3 before:h-px before:w-10 before:bg-gold after:h-px after:w-10 after:bg-gold">
              About RA2 Travel and Tours
            </p>
            <h1 className="text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
              You get one holiday.
              <br />
              <em className="text-gold">We care how you remember it.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium text-ivory/95">
              Cape Town locals. Two generations. A family invested in your experience.
            </p>
            <div className="mt-5 max-w-xl space-y-3 text-sm leading-relaxed text-ivory/80 sm:text-base">
              <p>
                You’ve worked hard for this holiday. You deserve to enjoy it, knowing someone has
                thought through the details.
              </p>
              <p>
                We’re Rezah and Aneesa Payne, the husband-and-wife team behind RA2. Around ten years
                ago, we started our family business because sharing our home and arranging something
                special for others made us happy. It still does.
              </p>
              <p>
                Today, our son Raeez and our team share that purpose: helping you experience South
                Africa with personal care, from your first enquiry to the journey home.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <GoldButton to="/plan-my-trip">
                Plan My Trip <ArrowRight className="size-4" />
              </GoldButton>
              <a
                href={CONTACT.whatsapp}
                className="inline-flex items-center justify-center rounded-sm border border-ivory/60 px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-ivory hover:text-forest-deep"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
          <div className="hidden self-end justify-self-end rounded-sm border border-gold/60 bg-forest-deep/75 px-6 py-4 font-serif text-xl italic text-gold backdrop-blur-sm md:block">
            Your South Africa, beautifully personal.
          </div>
        </div>
      </section>

      <section className="bg-ivory py-16 sm:py-20">
        <div className="container-site">
          <div className="mb-10 flex items-center gap-5">
            <span className="hidden h-px flex-1 bg-gold md:block" />
            <h2 className="text-center text-4xl text-forest-deep sm:text-5xl">
              One family. A team behind you.
            </h2>
            <span className="hidden h-px flex-1 bg-gold md:block" />
          </div>
          <div className="grid gap-8 md:grid-cols-3 md:gap-0">
            {people.map((person, index) => (
              <article
                key={person.name}
                className={`py-2 md:px-7 ${index > 0 ? "md:border-l md:border-gold" : "md:pl-0"}`}
              >
                <p className="eyebrow mb-2">{person.role}</p>
                <h3 className="text-3xl text-forest-deep">{person.name}</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-charcoal/85">{person.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f1ece2] py-16 sm:py-20">
        <div className="container-site grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-gold/30 bg-card p-10 sm:p-16">
            <div
              aria-hidden="true"
              className="absolute inset-4 rounded-sm border border-gold/20 sm:inset-6"
            />
            <img
              src={ra2Logo}
              alt="RA2 Travel and Tours"
              width={500}
              height={500}
              loading="lazy"
              className="relative w-full max-w-sm object-contain"
            />
          </div>
          <div className="space-y-5 text-lg">
            <h2 className="text-4xl text-forest-deep">Hello, I’m Rezah.</h2>
            <p className="text-muted-foreground">
              RA2 Travel and Tours is a professional tour operator based in Cape Town, South Africa,
              offering unforgettable private tours, safaris, and travel experiences. We specialize
              in guided Cape Town day tours, Cape Peninsula tours, Table Mountain visits, Boulders
              Beach penguin tours, wine tasting experiences, and luxury helicopter flights. Our
              popular experiences include safaris to Aquila Game Reserve, Cape Point and Cape of
              Good Hope tours, Bo-Kaap cultural visits, and private city tours.
            </p>
            <p className="text-muted-foreground">
              We also provide reliable airport transfers and personalized multi-day travel packages
              across South Africa. At RA2 Travel and Tours, we focus on small groups and private
              experiences, ensuring every guest enjoys a comfortable, safe, and memorable journey.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f1ece2] py-16 sm:py-20">
        <div className="container-site">
          <div className="flex items-center justify-center gap-5">
            <span className="hidden h-px flex-1 bg-gold sm:block" />
            <h2 className="text-center text-4xl text-forest-deep sm:text-5xl">
              Less to organise. More to look forward to.
            </h2>
            <span className="hidden h-px flex-1 bg-gold sm:block" />
          </div>
          <p className="mx-auto mt-4 max-w-3xl text-center text-charcoal/80">
            First visit, family holiday, special celebration or an active escape—we begin with what
            matters to you.
          </p>
          <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {promises.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex gap-5">
                <div className="flex w-16 shrink-0 items-center justify-center border-r border-gold text-[#a57a27]">
                  <Icon aria-hidden="true" className="size-10" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-2xl text-forest-deep">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal/80">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ivory px-5 py-16 text-center sm:py-20">
        <div className="container-site">
          <p className="eyebrow">Made around you</p>
          <h2 className="mt-2 text-5xl text-forest-deep sm:text-6xl">
            Your South Africa. Your way.
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-charcoal/85">
            Private Cape Town tours, tailor-made South African journeys, hiking experiences, airport
            and private transfers, chauffeur services and safaris. From the Cape Peninsula and Cape
            Winelands to the Garden Route and a safari stay, we’ll help you choose what fits your
            journey.
          </p>
          <div className="mx-auto mt-12 max-w-5xl bg-forest px-6 py-9 text-ivory sm:px-10">
            <h2 className="text-4xl text-ivory sm:text-5xl">
              Make it a journey you’ll still talk about.
            </h2>
            <p className="mt-3 text-ivory/80">
              We respect the work, saving and planning behind your holiday. Our aim is to make that
              investment feel worthwhile.
            </p>
            <blockquote className="mx-auto mt-5 max-w-3xl font-serif text-2xl italic leading-tight text-gold sm:text-3xl">
              “Long after you’ve stopped thinking about what the journey cost, we want you to still
              love what it gave you.”
            </blockquote>
            <p className="mt-5 text-sm text-ivory/80">
              The photographs you return to. The stories you share. The moments that made everyone
              smile.
              <br />
              That is the experience we want our family’s name attached to.
            </p>
            <p className="mt-4 font-serif text-xl italic text-ivory">
              Rezah, Aneesa, Raeez &amp; the RA2 Team
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f1ece2] py-16 text-center sm:py-20">
        <div className="container-site">
          <h2 className="text-4xl text-forest-deep sm:text-5xl">
            Tell us what you’re dreaming of.
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-charcoal/80">
            Send your dates, group size and the experiences you have in mind. We’ll help shape the
            plan and prepare your personalised quote.
          </p>
          <p className="mt-3 font-semibold text-forest-deep">
            No payment to enquire. Just a conversation to get started.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <GoldButton to="/plan-my-trip">
              Plan My Trip <ArrowRight className="size-4" />
            </GoldButton>
            <a
              href={CONTACT.whatsapp}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-forest px-6 py-3 text-sm font-semibold tracking-wide text-forest transition-colors hover:bg-forest hover:text-ivory"
            >
              Chat on WhatsApp
            </a>
          </div>
          <p className="mt-5 text-sm text-charcoal/60">
            Want to explore first?{" "}
            <Link
              to="/tours"
              className="underline decoration-gold underline-offset-4 hover:text-forest"
            >
              Browse private tours
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
