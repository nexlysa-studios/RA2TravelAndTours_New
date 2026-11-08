import { createFileRoute } from "@tanstack/react-router";
import hero from "@/assets/peninsula.jpg";
import ra2Logo from "@/assets/Ra2logo.png";
import { CtaBand, PageHero } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About RA2 — Rezah Payne & Team | RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "RA2 Travel and Tours is a Cape Town tour operator offering private tours, safaris, airport transfers and personalized travel across South Africa.",
      },
      { property: "og:title", content: "About RA2 Travel and Tours" },
      { property: "og:description", content: "The people behind your journey." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero
        eyebrow="About RA2"
        title="The people behind your journey."
        intro="A personally hosted Cape Town tour company, led by Rezah Payne."
        image={hero}
      />
      <section className="py-20">
        <div className="container-site grid items-center gap-12 md:grid-cols-2">
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
            <h2 className="text-4xl">Hello, I'm Rezah.</h2>
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
      <CtaBand />
    </>
  );
}
