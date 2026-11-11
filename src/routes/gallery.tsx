import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import peninsula from "@/assets/peninsula.jpg";
import winelands from "@/assets/winelands.jpg";
import safari from "@/assets/safari.jpg";
import sabiSands from "@/assets/sabi-sands-safari.jpg";
import kruger from "@/assets/kruger-safari.jpg";
import aquila from "@/assets/aquila-safari-day.webp";
import hero from "@/assets/hero.jpg";
import sunsetView from "@/assets/gallery (1).webp";
import safariMoment from "@/assets/gallery (2).webp";
import coastalFriends from "@/assets/gallery (3).webp";
import kayakHarbour from "@/assets/gallery (4).webp";
import capeTownSunset from "@/assets/gallery (5).webp";
import privateTransfer from "@/assets/gallery (6).webp";
import capePointVisit from "@/assets/gallery (7).webp";
import { GoldButton } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery | RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Explore moments from Cape Town, the Winelands and South African safari experiences with RA2 Travel and Tours.",
      },
    ],
  }),
  component: GalleryPage,
});

const photos = [
  { src: peninsula, alt: "The dramatic Cape Peninsula coastline", title: "The Cape Peninsula", category: "Cape Town" },
  { src: winelands, alt: "Vineyards in the Cape Winelands", title: "Cape Winelands", category: "Cape Town" },
  { src: safari, alt: "A quiet safari moment in the South African bush", title: "Into the wild", category: "Safaris" },
  { src: sabiSands, alt: "Wildlife in the Sabi Sands reserve", title: "Sabi Sands", category: "Safaris" },
  { src: hero, alt: "A scenic view from a Cape Town journey", title: "The road ahead", category: "Cape Town" },
  { src: aquila, alt: "A safari day at Aquila Game Reserve", title: "Aquila safari day", category: "Safaris" },
  { src: kruger, alt: "A wildlife encounter in Kruger National Park", title: "Kruger National Park", category: "Safaris" },
  { src: sunsetView, alt: "Visitors enjoying sunset above Cape Town", title: "A sunset above the city", category: "Cape Town" },
  { src: safariMoment, alt: "A guest stepping out on a safari experience", title: "A close-up safari moment", category: "Safaris" },
  { src: coastalFriends, alt: "Friends enjoying the coastal views together", title: "Coastal moments together", category: "Experiences" },
  { src: kayakHarbour, alt: "A group setting out on kayaks from the harbour", title: "Harbour adventures", category: "Experiences" },
  { src: capeTownSunset, alt: "The last light over the Cape Town coastline", title: "Golden hour on the mountain", category: "Cape Town" },
  { src: privateTransfer, alt: "Guests boarding a private RA2 vehicle", title: "A comfortable ride", category: "Transfers" },
  { src: capePointVisit, alt: "Visitors arriving at the Cape Point entrance", title: "A visit to Cape Point", category: "Cape Town" },
];

const filters = ["All moments", "Cape Town", "Safaris", "Experiences", "Transfers"] as const;

function GalleryPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All moments");
  const [selected, setSelected] = useState<(typeof photos)[number] | null>(null);
  const visiblePhotos = filter === "All moments" ? photos : photos.filter((photo) => photo.category === filter);

  return (
    <main className="bg-ivory">
      <section className="relative isolate overflow-hidden bg-forest-deep text-ivory">
        <img src={peninsula} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-deep/90 via-forest-deep/65 to-forest-deep/20" />
        <div className="container-site flex min-h-[390px] items-end py-14 sm:min-h-[460px] sm:py-16">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm text-ivory/75"><Link to="/" className="hover:text-gold">Home</Link>&nbsp; / &nbsp;Gallery</p>
            <p className="eyebrow mb-3">A glimpse of South Africa</p>
            <h1 className="text-5xl leading-[1.02] sm:text-7xl">Moments made<br /><em className="text-gold">to stay with you.</em></h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/85">From the Cape coast to the open savannah, discover a few of the places and experiences we love sharing.</p>
          </div>
        </div>
      </section>

      <section className="container-site py-14 sm:py-20" aria-label="Photo gallery">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-2">The journey, in pictures</p>
            <h2 className="text-4xl text-forest-deep sm:text-5xl">A little inspiration.</h2>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filter gallery">
            {filters.map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${filter === item ? "border-forest bg-forest text-ivory" : "border-forest/25 text-forest hover:border-forest"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid auto-rows-[220px] gap-4 sm:grid-cols-2 sm:auto-rows-[260px] lg:grid-cols-3">
          {visiblePhotos.map((photo, index) => (
            <button key={photo.title} type="button" onClick={() => setSelected(photo)}
              className={`group relative overflow-hidden rounded-sm bg-forest-deep text-left ${index === 0 && filter === "All moments" ? "sm:row-span-2 sm:row-start-1" : ""}`}>
              <img src={photo.src} alt={photo.alt} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-transparent to-transparent" />
              <span className="absolute bottom-0 left-0 p-5 text-ivory">
                <span className="block text-xs uppercase tracking-[0.18em] text-gold">{photo.category}</span>
                <span className="mt-1 block font-serif text-2xl">{photo.title}</span>
              </span>
              <span className="sr-only">Open photo: {photo.alt}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-[#f1ece2] py-14 text-center sm:py-20">
        <div className="container-site">
          <p className="eyebrow">Your story starts here</p>
          <h2 className="mt-2 text-4xl text-forest-deep sm:text-5xl">Ready to make your own memories?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-charcoal/80">Tell us what you’d love to see and we’ll help shape a South African journey around you.</p>
          <div className="mt-7 flex justify-center"><GoldButton to="/plan-my-trip">Plan My Trip <ArrowRight className="size-4" /></GoldButton></div>
        </div>
      </section>

      {selected && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-forest-deep/95 p-4 sm:p-10"
          onKeyDown={(event) => { if (event.key === "Escape") setSelected(null); }}>
          <button type="button" onClick={() => setSelected(null)} aria-label="Close photo" className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full border border-ivory/30 text-ivory hover:bg-ivory/10"><X className="size-5" /></button>
          <figure className="max-h-full max-w-6xl">
            <img src={selected.src} alt={selected.alt} className="max-h-[78vh] w-auto max-w-full object-contain" />
            <figcaption className="mt-3 text-center font-serif text-xl text-ivory">{selected.title} <span className="font-sans text-sm text-gold">· {selected.category}</span></figcaption>
          </figure>
        </div>
      )}
    </main>
  );
}
