import { Link, type LinkProps } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, MessageCircle, Phone, Mail, Instagram } from "lucide-react";
import { CONTACT, NAV } from "@/lib/site";
import ra2Logo from "@/assets/Ra2logo.png";
import heroVideo from "@/assets/herovid.mp4";

export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center" aria-label="RA2 Travel and Tours home">
      <img src={ra2Logo} alt="" className="size-28 object-contain" />
    </Link>
  );
}

export function GoldButton({ children, href, to, variant = "solid" }: { children: ReactNode; href?: string; to?: LinkProps["to"]; variant?: "solid" | "outline" | "dark" }) {
  const cls = {
    solid: "bg-gold text-forest-deep hover:bg-ivory",
    outline: "border border-ivory/70 text-ivory hover:bg-ivory hover:text-forest-deep",
    dark: "bg-forest text-ivory hover:bg-forest-deep",
  }[variant];
  const base = `inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-sm font-semibold tracking-wide transition-colors ${cls}`;
  if (to) return <Link to={to} className={base}>{children}</Link>;
  return <a href={href} className={base}>{children}</a>;
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-forest">
      <div className="container-site flex h-32 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm text-ivory/85 transition-colors hover:text-gold" activeProps={{ className: "text-gold" }}>
              {n.label}
            </Link>
          ))}
          <GoldButton to="/plan-my-trip">Plan My Trip</GoldButton>
        </nav>
        <div className="flex items-center gap-3 lg:hidden">
          <Link to="/plan-my-trip" className="rounded-sm bg-gold px-3 py-2 text-xs font-semibold text-forest-deep">Plan My Trip</Link>
          <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="text-ivory">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-ivory/10 bg-forest-deep lg:hidden">
          <div className="container-site flex flex-col py-4">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="border-b border-ivory/10 py-3 text-base text-ivory">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-forest-deep text-ivory/80">
      <div className="container-site grid gap-10 py-16 md:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm">Private Cape Town tours, safaris and tailor-made journeys, personally hosted.</p>
        </div>
        <div>
          <h4 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">Experiences</h4>
          <ul className="space-y-2 text-sm">
            {NAV.slice(0, 4).map((n) => <li key={n.to}><Link to={n.to} className="hover:text-gold">{n.label}</Link></li>)}
            <li><Link to="/transfers" hash="fleet" className="hover:text-gold">Our Fleet</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-gold">About RA2</Link></li>
            <li><Link to="/plan-my-trip" className="hover:text-gold">Contact</Link></li>
            <li><Link to="/tours/peninsula" hash="faq" className="hover:text-gold">FAQs</Link></li>
            <li><Link to="/admin" className="hover:text-gold">Staff sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">Get in touch</h4>
          <ul className="space-y-3 text-sm">
            <li><a href={CONTACT.whatsapp} className="flex items-center gap-2 hover:text-gold"><MessageCircle className="size-4" /> WhatsApp {CONTACT.phone}</a></li>
            <li><a href={CONTACT.phoneHref} className="flex items-center gap-2 hover:text-gold"><Phone className="size-4" /> {CONTACT.phone}</a></li>
            <li><a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 break-all hover:text-gold"><Mail className="size-4 shrink-0" /> {CONTACT.email}</a></li>
            <li><a href={CONTACT.instagram} className="flex items-center gap-2 hover:text-gold"><Instagram className="size-4" /> {CONTACT.instagramHandle}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-site py-6 text-xs text-ivory/60">© {new Date().getFullYear()} RA2 Travel and Tours · www.ra2travelandtours.co.za</div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  return (
    <a href={CONTACT.whatsapp} aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-whatsapp text-ivory shadow-lg transition-transform hover:scale-105">
      <MessageCircle className="size-6" />
    </a>
  );
}

export function PageHero({ eyebrow, title, intro, image, children }: { eyebrow: string; title: ReactNode; intro: string; image: string; children?: ReactNode }) {
  return (
    <section className="relative isolate flex min-h-[60vh] items-end overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 z-0 h-full w-full object-cover md:hidden" />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={image}
        aria-hidden="true"
        className="absolute inset-0 z-0 hidden h-full w-full object-cover md:block"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      <div className="hero-scrim absolute inset-0 z-10" />
      <div className="container-site relative z-20 pb-16 pt-32 text-ivory">
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="max-w-3xl text-5xl md:text-7xl">{title}</h1>
        <p className="mt-5 max-w-xl text-lg text-ivory/90">{intro}</p>
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="bg-forest py-20 text-ivory">
      <div className="container-site flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <p className="eyebrow mb-3">Start planning</p>
          <h2 className="text-4xl md:text-5xl">Tell us how you'd like to travel.</h2>
          <p className="mt-3 max-w-lg text-ivory/80">Share a few details and Rezah will reply with a personalised quote.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <GoldButton to="/plan-my-trip">Request a Quote</GoldButton>
          <GoldButton href={CONTACT.whatsapp} variant="outline">WhatsApp us</GoldButton>
        </div>
      </div>
    </section>
  );
}
