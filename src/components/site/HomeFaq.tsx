import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CONTACT } from "@/lib/site";

const FAQS = [
  {
    question: "How do I book a trip with RA2?",
    answer:
      "Start with Plan My Trip. Choose an experience, tell us about your dates and group, select a vehicle preference, add your contact details, and review your request. You’ll receive a receipt by email, and the RA2 team will follow up with availability and a personalised quote. No guest account is needed.",
  },
  {
    question: "Is my trip confirmed when I submit the form?",
    answer:
      "The form sends a booking request. Your receipt confirms that we have received your details; your trip is confirmed separately once availability, your quotation, and the required payment arrangements have been agreed. There is no payment step on this website.",
  },
  {
    question: "Can you help if I’m not sure what to choose?",
    answer:
      "Absolutely. Select the option for help choosing an experience and share what you enjoy, your group size, and your preferred dates. If your dates are flexible, you can say so in the form. We’ll help shape a journey around you.",
  },
  {
    question: "Can I choose my vehicle?",
    answer:
      "Yes. The Choose vehicle step shows our fleet with seating and luggage guidance. You can request a suitable vehicle or ask RA2 to recommend one. Your choice is a preference, subject to availability. Please mention large suitcases, child seats, or mobility needs so we can confirm the right arrangement.",
  },
  {
    question: "Do you offer airport transfers and hotel pickups?",
    answer:
      "We offer transfers and chauffeur services as well as private tours. For a transfer, include your pickup and drop-off locations, time, flight number if relevant, and luggage details. For tours, tell us where you’re staying so we can agree on pickup arrangements in your quote.",
  },
  {
    question: "What is included in the price?",
    answer:
      "Inclusions depend on your experience. Each package page lists its inclusions, exclusions, and booking information. Your personalised quotation sets out the agreed itinerary, price, and payment terms, so please check these before accepting.",
  },
  {
    question: "How do I change or cancel my request?",
    answer:
      "Before submitting, use Edit on the review step to change your details. Afterwards, reply to your booking email or contact us by WhatsApp with your reference. Changes depend on availability; cancellation conditions are supplied with your quotation and remain subject to applicable consumer rights.",
  },
];

export function HomeFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="home-faq-title"
      className="scroll-mt-36 border-b border-border py-20 md:py-28"
    >
      <div className="container-site grid gap-10 lg:grid-cols-[0.85fr_1.4fr] lg:gap-20">
        <div>
          <p className="eyebrow mb-4">A little clarity before you go</p>
          <h2 id="home-faq-title" className="max-w-sm text-4xl md:text-5xl">
            Good questions.
            <br />
            <em className="font-normal">Personal answers.</em>
          </h2>
          <p className="mt-5 max-w-sm text-muted-foreground">
            From your first idea to your pickup, here’s what to expect when planning with RA2.
          </p>
          <a
            href={CONTACT.whatsapp}
            className="mt-7 inline-flex min-h-11 items-center gap-3 border-b border-gold py-2 text-sm font-semibold text-primary transition-colors hover:text-muted-foreground"
          >
            <MessageCircle aria-hidden="true" className="size-5" /> Ask us on WhatsApp{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
        <div className="min-w-0">
          <Accordion type="single" collapsible className="border-t border-border">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`home-faq-${index}`}>
                <AccordionTrigger className="gap-5 py-5 text-base leading-relaxed text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl pr-5 text-base leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-6 text-sm text-muted-foreground">
            For more detail, read our{" "}
            <Link to="/terms" className="text-primary underline decoration-gold underline-offset-4">
              booking terms
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              className="text-primary underline decoration-gold underline-offset-4"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
