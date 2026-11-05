import { Link } from "@tanstack/react-router";
import { Check, Clock, MapPin, Minus, MessageCircle, ArrowRight, ShieldCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CONTACT } from "@/lib/site";
import { packageImage, PACKAGE_TYPE_LABELS, type TravelPackage } from "@/lib/packages";
import { TourCardView } from "./TourCardView";

export function PackagePage({
  pkg,
  related = [],
  preview = false,
}: {
  pkg: TravelPackage;
  related?: TravelPackage[];
  preview?: boolean;
}) {
  const bookLink = (
    <Link
      to="/plan-my-trip"
      search={{ package: pkg.id, experience: pkg.name }}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3.5 text-center text-sm font-semibold text-forest-deep hover:bg-ivory"
    >
      {pkg.cta_label || "Request a Quote"}
      <ArrowRight className="size-4" />
    </Link>
  );
  const whatsapp = `${CONTACT.whatsapp}?text=${encodeURIComponent(`Hi RA2, I'd like to enquire about ${pkg.name}.`)}`;
  return (
    <>
      <section className="relative isolate flex min-h-[34rem] items-end overflow-hidden bg-forest-deep">
        <img
          src={packageImage(pkg)}
          alt={pkg.image_alt || pkg.name}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority={preview ? "auto" : "high"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/55 to-forest-deep/20" />
        <div className="container-site relative py-12 pt-24 text-ivory md:pb-16">
          <p className="eyebrow mb-4">
            {PACKAGE_TYPE_LABELS[pkg.package_type]}
            {pkg.badge ? ` · ${pkg.badge}` : ""}
          </p>
          <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-7xl">
            {pkg.name || "Your package name"}
          </h1>
          {pkg.subtitle && (
            <p className="mt-3 font-serif text-3xl text-gold md:text-4xl">{pkg.subtitle}</p>
          )}
          {pkg.tagline && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ivory/90 md:text-lg">
              {pkg.tagline}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ivory/85">
            {pkg.duration && (
              <span className="flex items-center gap-2">
                <Clock className="size-4 text-gold" />
                {pkg.duration}
              </span>
            )}
            {pkg.location && (
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-gold" />
                {pkg.location}
              </span>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {bookLink}
            <a
              href={whatsapp}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-ivory/60 px-6 py-3 text-sm font-medium text-ivory hover:bg-ivory/10"
            >
              <MessageCircle className="size-4" />
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </section>
      <section className="py-12 md:py-20">
        <div className="container-site grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-16">
          <div className="min-w-0 space-y-12 md:space-y-16">
            {pkg.description && (
              <div className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
                <Paragraphs text={pkg.description} />
              </div>
            )}
            {pkg.facts.length > 0 && (
              <section>
                <p className="eyebrow mb-3">The essentials</p>
                <h2 className="mb-6 text-3xl md:text-4xl">Your day at a glance.</h2>
                <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {pkg.facts.map((fact, i) => (
                    <div
                      key={i}
                      className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5"
                    >
                      <dt className="text-sm font-semibold text-primary">{fact.label}</dt>
                      <dd className="min-w-0 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            {pkg.overview_text && (
              <section>
                <h2 className="mb-5 text-3xl md:text-4xl">
                  {pkg.overview_title || "A little more about your journey."}
                </h2>
                <Paragraphs text={pkg.overview_text} className="text-muted-foreground" />
              </section>
            )}
            {pkg.highlights.length > 0 && (
              <section>
                <h2 className="mb-6 text-3xl md:text-4xl">Your tour highlights.</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {pkg.highlights.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-lg border border-border bg-card p-4 text-sm"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {pkg.itinerary.length > 0 && (
              <section id="itinerary" className="scroll-mt-40">
                <p className="eyebrow mb-3">The route</p>
                <h2 className="mb-8 text-3xl md:text-4xl">Your day, stop by stop.</h2>
                <ol className="ml-4 space-y-9 border-l border-gold/50 pl-8">
                  {pkg.itinerary.map((stop, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-12 top-0 flex size-8 items-center justify-center rounded-full border border-gold bg-background text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      {stop.label && (
                        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gold">
                          {stop.label}
                        </p>
                      )}
                      <h3 className="mb-3 text-2xl md:text-3xl">{stop.title}</h3>
                      <Paragraphs
                        text={stop.body}
                        className="text-sm leading-relaxed text-muted-foreground md:text-base"
                      />
                    </li>
                  ))}
                </ol>
                {pkg.itinerary_note && (
                  <p className="mt-8 rounded-lg bg-secondary p-4 text-sm italic text-muted-foreground">
                    {pkg.itinerary_note}
                  </p>
                )}
              </section>
            )}
            {(pkg.included.length > 0 || pkg.excluded.length > 0) && (
              <div className="grid gap-5 md:grid-cols-2">
                {(
                  [
                    ["What’s included", pkg.included, true],
                    ["What’s excluded", pkg.excluded, false],
                  ] as const
                ).map(
                  ([title, items, included]) =>
                    items.length > 0 && (
                      <section
                        key={title}
                        className={`rounded-xl border p-5 sm:p-6 ${included ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
                      >
                        <h2 className="mb-5 text-2xl">{title}</h2>
                        <ul className="space-y-3">
                          {items.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="mt-0.5 shrink-0">
                                {included ? (
                                  <Check className="size-4 text-primary" />
                                ) : (
                                  <Minus className="size-4 text-muted-foreground" />
                                )}
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ),
                )}
              </div>
            )}
            {(pkg.customisation_intro || pkg.customisation_options.length > 0) && (
              <section>
                <h2 className="mb-5 text-3xl md:text-4xl">Make the day your own.</h2>
                <Paragraphs text={pkg.customisation_intro} className="text-muted-foreground" />
                {pkg.customisation_options.length > 0 && (
                  <ul className="mt-5 space-y-3">
                    {pkg.customisation_options.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <Check className="mt-1 size-4 shrink-0 text-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            {pkg.before_you_go && (
              <section className="rounded-xl bg-secondary p-6 sm:p-8">
                <p className="eyebrow mb-3">Good to know</p>
                <h2 className="mb-5 text-3xl">Before you travel.</h2>
                <Paragraphs
                  text={pkg.before_you_go}
                  className="text-sm leading-relaxed text-muted-foreground"
                />
              </section>
            )}
            {pkg.faqs.length > 0 && (
              <section id="faq" className="scroll-mt-40">
                <h2 className="mb-6 text-3xl md:text-4xl">Frequently asked questions.</h2>
                <Accordion type="single" collapsible>
                  {pkg.faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left text-base">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Paragraphs
                          text={faq.answer}
                          className="text-sm leading-relaxed text-muted-foreground"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
            {pkg.booking_terms && (
              <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-2xl">Booking information</h2>
                <Paragraphs
                  text={pkg.booking_terms}
                  className="text-sm leading-relaxed text-muted-foreground"
                />
              </section>
            )}
          </div>
          <aside className="lg:sticky lg:top-40 lg:self-start">
            <div className="overflow-hidden rounded-xl bg-forest text-ivory">
              <img
                src={packageImage(pkg)}
                alt=""
                loading="lazy"
                className="h-36 w-full object-cover"
              />
              <div className="space-y-5 p-6">
                <p className="eyebrow">Personalised quotation</p>
                <h2 className="text-3xl">A day that’s yours.</h2>
                <p className="text-sm leading-relaxed text-ivory/80">
                  Tell us your date, group size and accommodation. We’ll check availability and
                  prepare your personal quote.
                </p>
                <div className="flex flex-col gap-3">
                  {bookLink}
                  <a
                    href={whatsapp}
                    className="flex items-center justify-center gap-2 py-2 text-sm text-ivory/85"
                  >
                    <MessageCircle className="size-4 text-gold" />
                    Chat with the RA2 team
                  </a>
                </div>
                <p className="flex gap-2 border-t border-ivory/15 pt-4 text-xs text-ivory/70">
                  <ShieldCheck className="size-4 shrink-0 text-gold" />
                  No payment is taken when you request a quote.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
      {related.length > 0 && (
        <section className="bg-secondary py-14">
          <div className="container-site">
            <p className="eyebrow mb-3">Keep exploring</p>
            <h2 className="mb-8 text-4xl">More ways to discover.</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((tour) => (
                <TourCardView key={tour.id} tour={tour} />
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="bg-forest py-16 text-ivory">
        <div className="container-site text-center">
          <p className="eyebrow mb-3">Your South Africa. Beautifully personal.</p>
          <h2 className="mx-auto max-w-3xl text-4xl md:text-5xl">
            {pkg.cta_title || "Your journey starts here."}
          </h2>
          {pkg.cta_text && (
            <Paragraphs text={pkg.cta_text} className="mx-auto mt-5 max-w-2xl text-ivory/80" />
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {bookLink}
            <a
              href={whatsapp}
              className="rounded-lg border border-ivory/50 px-6 py-3 text-sm font-semibold hover:bg-ivory/10"
            >
              WhatsApp RA2
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`space-y-4 break-words ${className}`}>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
    </div>
  );
}
