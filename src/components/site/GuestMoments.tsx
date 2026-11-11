import { ArrowUpRight, Instagram } from "lucide-react";
import peninsula from "@/assets/peninsula.jpg";
import winelands from "@/assets/winelands.jpg";
import safari from "@/assets/safari.jpg";
import { CONTACT } from "@/lib/site";

const MOMENTS = [
  {
    image: peninsula,
    alt: "Coastal scenery along the Cape Peninsula",
    label: "Along the coast",
    title: "Take the scenic route.",
    className: "aspect-[4/3] md:aspect-auto md:col-span-7 md:row-span-2",
    headingClass: "text-3xl sm:text-4xl lg:text-5xl",
  },
  {
    image: winelands,
    alt: "Vineyards and mountain scenery in the Cape Winelands",
    label: "In the Winelands",
    title: "Linger a little longer.",
    className: "aspect-[4/5] sm:aspect-[4/3] md:aspect-auto md:col-span-5",
    headingClass: "text-2xl lg:text-3xl",
  },
  {
    image: safari,
    alt: "South African safari scenery",
    label: "Out in the wild",
    title: "Make room for wonder.",
    className: "aspect-[4/5] sm:aspect-[4/3] md:aspect-auto md:col-span-5",
    headingClass: "text-2xl lg:text-3xl",
  },
];

export function GuestMoments() {
  return (
    <section aria-labelledby="guest-moments-title" className="py-20 md:py-28">
      <div className="container-site">
        <div className="mb-9 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-3">Guest moments</p>
            <h2 id="guest-moments-title" className="text-4xl md:text-6xl">
              Follow our journeys.
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Coastal detours, slow afternoons and a little wild wonder. A glimpse of the places
              your next journey could take you.
            </p>
          </div>
          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 self-start items-center gap-3 rounded-sm border border-border px-4 py-3 text-sm font-semibold text-primary transition-colors hover:border-gold hover:bg-secondary md:shrink-0"
          >
            <Instagram aria-hidden="true" className="size-5" /> Follow on Instagram{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 md:h-[620px] md:grid-cols-12 md:grid-rows-2 md:gap-4">
          {MOMENTS.map((moment, index) => (
            <div
              key={moment.label}
              className={`relative isolate overflow-hidden rounded-sm bg-forest-deep text-ivory ${index === 0 ? "col-span-2" : ""} ${moment.className}`}
            >
              <img
                src={moment.image}
                alt={moment.alt}
                loading="lazy"
                className="absolute inset-0 -z-20 h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-deep/95 via-forest-deep/10 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ivory/80 sm:text-xs">
                  {moment.label}
                </p>
                <h3 className={moment.headingClass}>{moment.title}</h3>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-4 border-b border-border pb-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">More places. More stories. Meet us on Instagram.</p>
          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline"
          >
            <Instagram aria-hidden="true" className="size-4" /> {CONTACT.instagramHandle}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
