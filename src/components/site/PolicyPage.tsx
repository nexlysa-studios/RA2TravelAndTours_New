import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react";
import { CONTACT } from "@/lib/site";

export type PolicySection = { id: string; title: string; content: ReactNode };

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
  related,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
  related: "privacy" | "terms";
}) {
  return (
    <>
      <section className="border-b border-gold/25 bg-forest py-14 text-ivory md:py-20">
        <div className="container-site">
          <Link
            to="/"
            className="mb-10 inline-flex min-h-11 items-center gap-2 text-sm text-ivory/80 hover:text-gold"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to RA2
          </Link>
          <p className="eyebrow mb-4">{eyebrow}</p>
          <h1 className="text-5xl md:text-7xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ivory/80 md:text-lg">
            {intro}
          </p>
          <p className="mt-7 text-xs uppercase tracking-widest text-ivory/65">
            Last updated <time dateTime="2026-11-08">8 November 2026</time>
          </p>
        </div>
      </section>
      <div className="container-site grid items-start gap-10 py-12 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-20 lg:py-20">
        <aside className="lg:sticky lg:top-40">
          <nav aria-label="On this page" className="rounded-sm border border-border bg-card p-6">
            <p className="eyebrow mb-4">On this page</p>
            <ol className="space-y-1">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-baseline gap-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <span className="text-xs text-gold">{String(index + 1).padStart(2, "0")}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-5 rounded-sm bg-secondary p-6">
            <p className="font-serif text-2xl text-primary">Let’s clear things up.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Questions about your details or your booking? Speak to the RA2 team.
            </p>
            <a
              href={`mailto:${CONTACT.email}`}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline decoration-gold underline-offset-4"
            >
              <Mail aria-hidden="true" className="size-4" /> Email RA2
            </a>
          </div>
        </aside>
        <article className="min-w-0 max-w-3xl">
          {sections.map((section, index) => (
            <section
              id={section.id}
              key={section.id}
              className="mb-9 scroll-mt-40 border-b border-border pb-9 last:mb-0"
            >
              <div className="mb-5 flex items-baseline gap-4">
                <span aria-hidden="true" className="text-sm text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="text-3xl text-primary sm:text-4xl">{section.title}</h2>
              </div>
              <div className="space-y-4 leading-relaxed text-muted-foreground [&_a]:break-words [&_a]:text-primary [&_a]:underline [&_a]:decoration-gold [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {section.content}
              </div>
            </section>
          ))}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-secondary p-5 text-sm">
            <p className="text-muted-foreground">
              {related === "privacy"
                ? "How we look after your information."
                : "What to expect when booking."}
            </p>
            {related === "privacy" ? (
              <Link
                to="/privacy-policy"
                className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
              >
                Privacy Policy <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <Link
                to="/terms"
                className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
              >
                Terms & Conditions <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            )}
          </div>
        </article>
      </div>
    </>
  );
}
