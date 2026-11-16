import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, CalendarDays, Clock3, Compass, ShieldCheck, Sun } from "lucide-react";
import { GoldButton } from "@/components/site/SiteChrome";
import cape from "@/assets/peninsula.jpg";
import winelands from "@/assets/winelands.jpg";
import safari from "@/assets/safari.jpg";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Cape Town Travel Journal & Guides | RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Helpful Cape Town travel guides from RA2: when to visit, local safety tips, hiking preparation and ideas for planning your South African holiday.",
      },
      { property: "og:title", content: "Cape Town Travel Blog | RA2 Travel and Tours" },
      {
        property: "og:description",
        content: "Seasonal advice and thoughtful planning tips for your Cape Town journey.",
      },
    ],
  }),
  component: BlogPage,
});

const articles = [
  {
    id: "best-time",
    category: "When to visit",
    title: "When is the best time to visit Cape Town?",
    summary: "Choose the season that suits your plans, from long, sunny beach days to quieter winter escapes.",
    image: cape,
    icon: Sun,
    minutes: "5 min read",
  },
  {
    id: "travel-safety",
    category: "Travel well",
    title: "A practical guide to staying safe in Cape Town",
    summary: "Simple city, transport and arrival habits to help you explore with more confidence.",
    image: winelands,
    icon: ShieldCheck,
    minutes: "6 min read",
  },
  {
    id: "mountain-days",
    category: "Outdoors",
    title: "Plan a safer day on Table Mountain",
    summary: "What to check, carry and consider before setting out on a Cape Town hike.",
    image: cape,
    icon: Compass,
    minutes: "4 min read",
  },
  {
    id: "pack-for-cape-town",
    category: "Before you go",
    title: "What to pack for Cape Town’s changeable weather",
    summary: "A simple packing list for sun, wind, sudden showers and cool evenings.",
    image: winelands,
    icon: CalendarDays,
    minutes: "3 min read",
  },
  {
    id: "make-time",
    category: "Trip planning",
    title: "How many days should you spend in Cape Town?",
    summary: "Give the city and its surrounding landscapes enough breathing room.",
    image: safari,
    icon: Clock3,
    minutes: "4 min read",
  },
];

function BlogPage() {
  return (
    <main className="bg-ivory">
      <section className="relative isolate overflow-hidden bg-forest-deep text-ivory">
        <img src={cape} alt="A coastal road along the Cape Peninsula" className="absolute inset-0 z-0 size-full object-cover" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-forest-deep/95 via-forest-deep/75 to-forest-deep/35" />
        <div className="container-site relative z-20 flex min-h-[430px] items-center py-14 sm:min-h-[520px] sm:py-16">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm text-ivory/75"><Link to="/" className="hover:text-gold">Home</Link>&nbsp; / &nbsp;Blog</p>
            <p className="eyebrow mb-3">The RA2 Cape Town travel blog</p>
            <h1 className="text-5xl leading-[1.02] sm:text-7xl">Plan with confidence.<br /><em className="text-gold">Travel with wonder.</em></h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/90">Local insight for your South African journey: when to visit, how to prepare and what to know before you go.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#latest-guides" className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-gold px-6 py-3 text-sm font-semibold text-forest-deep transition-colors hover:bg-ivory">
                Browse travel guides <ArrowDown aria-hidden="true" className="size-4" />
              </a>
              <Link to="/plan-my-trip" className="inline-flex min-h-12 items-center rounded-sm border border-ivory/70 px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-ivory hover:text-forest-deep">
                Plan your trip
              </Link>
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-ivory/70">Seasonal advice · Local know-how · Thoughtful itineraries</p>
          </div>
        </div>
      </section>

      <section id="latest-guides" className="container-site py-14 sm:py-20">
        <div className="mb-9 max-w-2xl">
          <p className="eyebrow mb-2">The travel journal</p>
          <h2 className="text-4xl text-forest-deep sm:text-5xl">Helpful reading for the road ahead.</h2>
          <p className="mt-3 text-charcoal/75">Start with the questions guests ask us most. Each guide links to trusted local or official information where you can check the latest details.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {articles.map(({ id, category, title, summary, image, icon: Icon, minutes }, index) => (
            <article key={id} className={`group flex flex-col overflow-hidden rounded-md border border-border bg-card ${index === 0 ? "xl:col-span-2 xl:grid xl:grid-cols-2" : ""}`}>
              <div className={`overflow-hidden ${index === 0 ? "min-h-56 xl:min-h-full" : "aspect-[16/9]"}`}>
                <img src={image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#967332]">
                  <span>{category}</span><span className="flex items-center gap-1.5 normal-case tracking-normal text-charcoal/60"><Icon aria-hidden="true" className="size-3.5" />{minutes}</span>
                </div>
                <h3 className="mt-3 text-3xl text-forest-deep">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal/75">{summary}</p>
                <a href={`#${id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-[#967332]">
                  Read this guide <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="border-t border-gold/25 bg-[#f1ece2]">
        <section id="best-time" className="container-site scroll-mt-32 py-14 sm:py-16">
          <GuideHeader category="When to visit" title="When is the best time to visit Cape Town?" intro="There isn’t one perfect month for everyone. Cape Town’s seasons each bring a different rhythm, so choose around the experiences you care about most." />
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <Season title="Summer · November to March" note="For beaches and long days" copy="Expect warmer, drier weather and plenty of daylight for coastal drives, outdoor meals and time at the beach. This is also a popular period, especially around the festive season, so book accommodation and favourite activities early. The south-easter can make some days breezy, and conditions can change between the coast and the mountains." />
            <Season title="Autumn · April and May" note="For a gentler pace" copy="The busy summer period eases, days are often pleasant for exploring, and the early hints of winter may bring cooler evenings or rain. It can be a lovely time to combine city days with the Winelands, while keeping a flexible plan for the weather." />
            <Season title="Winter · June to August" note="For cosy stays and quieter sights" copy="Cape Town’s winter is cooler and wetter, with passing fronts that can change outdoor plans. In return, you may find fewer visitors and seasonal dining or accommodation offers. Leave room for indoor experiences, check mountain and cableway conditions before you go, and pack a proper rain layer." />
            <Season title="Spring · September and October" note="For flowers and outdoor days" copy="As the rainy season tapers off, the days gradually warm and the region’s wildflowers can be a highlight. Spring is still changeable, so bring layers and keep a flexible schedule for hikes, viewpoints and day trips." />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-charcoal/75">For many visitors, April–May and September–October are a good balance of milder weather and fewer peak-season crowds. If warm beach weather and long evenings matter most, consider summer instead. These are seasonal patterns, not a forecast—check the local forecast close to your travel dates.</p>
          <Sources links={[
            ["Cape Town Tourism: Best time of year to visit", "https://www.capetown.travel/the-best-time-of-year-to-visit-cape-town/"],
            ["South African Tourism: Best times to visit", "https://www.southafrica.net/za/en/travel/category/what-you-need-to-know/best-times-to-visit-south-africa"],
          ]} />
        </section>
      </div>

      <section id="travel-safety" className="container-site scroll-mt-32 py-14 sm:py-16">
        <GuideHeader category="Travel well" title="A practical guide to staying safe in Cape Town" intro="Cape Town is a welcoming city, and like any large destination it rewards a little awareness. A few straightforward habits can help your days run more smoothly." />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div className="space-y-4 text-charcoal/85">
            <SafetyTip title="Plan your transport" copy="Use a reputable transport provider, especially after dark or when arriving with luggage. If driving, plan your route before setting off, stick to well-used main roads and keep valuables out of sight. Follow current advice from your accommodation or a trusted local contact." />
            <SafetyTip title="Keep your belongings close" copy="Carry only what you need for the outing. Avoid displaying large amounts of cash or expensive items, don’t leave bags visible in a parked car, and stay attentive at busy intersections and public areas." />
            <SafetyTip title="Choose busy, well-lit routes" copy="Ask your host or accommodation team which areas and routes suit your plans, particularly in the evening. Avoid deserted places after dark and use arranged transport if you’re unsure about the way back." />
            <SafetyTip title="Be calm if something goes wrong" copy="If you are threatened, prioritise your safety and do not resist. Contact local emergency services and your accommodation or tour operator once you are somewhere safe." />
          </div>
          <aside className="rounded-md bg-forest-deep p-6 text-ivory sm:p-8">
            <p className="eyebrow">Before you leave</p>
            <h3 className="mt-2 text-3xl">A few small checks.</h3>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-ivory/85">
              <li>✓ Save your accommodation address and local contact details.</li>
              <li>✓ Keep your phone charged and share your plan with someone you trust.</li>
              <li>✓ Check your route and local travel advice before airport journeys.</li>
              <li>✓ Ask a local host if you’re unsure about transport or an area.</li>
            </ul>
          </aside>
        </div>
        <Sources links={[
          ["Cape Town Tourism: Safety in Cape Town", "https://www.capetown.travel/travelwise/safety-in-cape-town/"],
          ["UK FCDO: South Africa safety and security advice", "https://www.gov.uk/foreign-travel-advice/south-africa/safety-and-security"],
        ]} />
      </section>

      <div className="bg-[#f1ece2]">
        <section id="mountain-days" className="container-site scroll-mt-32 py-14 sm:py-16">
          <GuideHeader category="Outdoors" title="Plan a safer day on Table Mountain" intro="The mountain’s weather and terrain can be very different from the city below. Treat a hike as a proper outing, even on a sunny day." />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <AdviceCard title="Go prepared" copy="Choose a route that matches your group’s experience. Wear suitable shoes, take water, sun protection and warm or waterproof layers, and carry a charged phone and a map." />
            <AdviceCard title="Stay together" copy="SANParks recommends doing activities in Table Mountain National Park in groups of four or more. Tell someone your route and expected return time, and stay on marked paths." />
            <AdviceCard title="Check before setting out" copy="Look at the weather, trail notices and cableway status on the day. Turn back if conditions worsen, visibility drops or your timing is slipping. Don’t rely on the cableway as your only way down." />
          </div>
          <Sources links={[
            ["SANParks: Safe hiking in Table Mountain National Park", "https://www.sanparks.org/parks/table-mountain/useful-information/safe-hiking"],
            ["SANParks: Visitor safety tips", "https://www.sanparks.org/parks/table-mountain/useful-information/visitor-tips"],
          ]} />
        </section>
      </div>

      <section id="pack-for-cape-town" className="container-site scroll-mt-32 py-14 sm:py-16">
        <GuideHeader category="Before you go" title="What to pack for Cape Town’s changeable weather" intro="The Cape is known for bright sun, coastal wind and quick weather changes. Pack for layers so one day’s forecast doesn’t dictate your whole trip." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdviceCard title="Sun protection" copy="Bring sunscreen, sunglasses and a hat for summer sightseeing and outdoor days." />
          <AdviceCard title="A warm layer" copy="Even after a sunny afternoon, evenings and exposed viewpoints can feel cool." />
          <AdviceCard title="Wind and rain" copy="A light windproof jacket works year-round; add a waterproof layer in winter." />
          <AdviceCard title="Comfortable shoes" copy="Choose shoes you can walk in for city streets, viewpoints and day trips." />
        </div>
        <p className="mt-5 text-sm text-charcoal/75">South Africa is in the Southern Hemisphere, so its summer falls around November to March. If your plans include the mountain or a longer drive, check the forecast for that area too—the conditions may differ from central Cape Town.</p>
        <Sources links={[["South African Tourism: Know before you go", "https://www.southafrica.net/uk/en/travel/article/know-before-you-go"]]} />
      </section>

      <div className="bg-[#f1ece2]">
        <section id="make-time" className="container-site scroll-mt-32 py-14 sm:py-16">
          <GuideHeader category="Trip planning" title="How many days should you spend in Cape Town?" intro="Cape Town can fill a short stop or a full week. The more time you have, the easier it is to enjoy the city without rushing every day trip." />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <AdviceCard title="2–3 days" copy="Focus on the city’s highlights: the Waterfront or city centre, a viewpoint if conditions allow, and one carefully planned Peninsula outing." />
            <AdviceCard title="5–7 days" copy="Add time for the Cape Peninsula, the Winelands, a slower city day and space to adapt to weather or opening hours." />
            <AdviceCard title="A longer stay" copy="Consider adding an overnight in the Winelands or extending your route toward the Garden Route or a safari destination, with travel time built in." />
          </div>
          <p className="mt-5 text-sm text-charcoal/75">Cape Town Tourism suggests five to seven days to fully enjoy the city, though a shorter visit can still work with a focused plan. Group nearby stops together and keep one flexible slot for a weather change or a favourite place you want to revisit.</p>
          <Sources links={[["Cape Town Tourism: Visitor FAQs", "https://www.capetown.travel/cape-town-faqs-what-you-need-to-know-before-you-visit/"], ["South African Tourism: Cape Town and the Winelands", "https://www.southafrica.net/gl/en/travel/article/cape-town-feel-the-beat-of-the-mother-city"]]} />
        </section>
      </div>

      <section className="bg-forest py-14 text-ivory sm:py-16">
        <div className="container-site flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className="eyebrow mb-2">Made around you</p>
            <h2 className="text-4xl sm:text-5xl">Want a local hand with the planning?</h2>
            <p className="mt-3 max-w-xl text-ivory/80">Tell us when you’re coming and what you’d like to see. We’ll help shape a private Cape Town day or a wider South African journey.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <GoldButton to="/plan-my-trip">Plan My Trip <ArrowRight className="size-4" /></GoldButton>
            <GoldButton to="/tours" variant="outline">Browse Tours</GoldButton>
          </div>
        </div>
      </section>
    </main>
  );
}

function GuideHeader({ category, title, intro }: { category: string; title: string; intro: string }) {
  return (
    <header className="max-w-3xl">
      <p className="eyebrow mb-2">{category}</p>
      <h2 className="text-4xl text-forest-deep sm:text-5xl">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-charcoal/75">{intro}</p>
    </header>
  );
}

function Season({ title, note, copy }: { title: string; note: string; copy: string }) {
  return (
    <article className="rounded-md border border-gold/30 bg-card p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#967332]">{note}</p>
      <h3 className="mt-2 text-2xl text-forest-deep">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/80">{copy}</p>
    </article>
  );
}

function SafetyTip({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="border-l-2 border-gold pl-5">
      <h3 className="text-2xl text-forest-deep">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed">{copy}</p>
    </article>
  );
}

function AdviceCard({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="rounded-md border border-border bg-card p-5">
      <h3 className="text-2xl text-forest-deep">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/80">{copy}</p>
    </article>
  );
}

function Sources({ links }: { links: [string, string][] }) {
  return (
    <aside className="mt-6 border-t border-gold/25 pt-4 text-xs text-charcoal/65">
      <span className="font-semibold text-forest-deep">Further reading: </span>
      {links.map(([label, href], index) => (
        <span key={href}>
          {index > 0 && <span aria-hidden="true"> · </span>}
          <a href={href} target="_blank" rel="noreferrer" className="underline decoration-gold underline-offset-2 hover:text-forest">{label}</a>
        </span>
      ))}
    </aside>
  );
}
