import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CONTACT } from "@/lib/site";

export function ServiceBookingLink({
  pkg,
  service,
  className,
  children,
}: {
  pkg: { id: string; name: string } | undefined;
  service: "transfer" | "chauffeur";
  className: string;
  children: ReactNode;
}) {
  return pkg ? (
    <Link
      to="/plan-my-trip"
      search={{ package: pkg.id, experience: pkg.name }}
      className={className}
    >
      {children}
    </Link>
  ) : (
    <a href={CONTACT.whatsapp} className={className}>
      Ask about {service === "chauffeur" ? "chauffeur services" : "transfers"} on WhatsApp
    </a>
  );
}
