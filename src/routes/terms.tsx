import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage, type PolicySection } from "@/components/site/PolicyPage";
import { CONTACT } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Booking requests, quotations, vehicle preferences, payments and changes for private tours, safaris and transfers with RA2 Travel and Tours.",
      },
    ],
  }),
  component: Terms,
});

const SECTIONS: PolicySection[] = [
  {
    id: "about",
    title: "About these terms",
    content: (
      <>
        <p>
          These terms describe using this website and requesting travel services from RA2 Travel and
          Tours, a Cape Town-based operator of private tours, safaris, transfers, chauffeur services
          and tailor-made journeys.
        </p>
        <p>
          Your written quotation and the booking conditions supplied with it set out the specific
          services and arrangements offered to you. Read those alongside these terms and ask us
          about anything unclear before accepting. Nothing here excludes rights or remedies that
          cannot lawfully be excluded under South African law.
        </p>
      </>
    ),
  },
  {
    id: "requests",
    title: "Requests and confirmation",
    content: (
      <>
        <p>
          The Plan My Trip form sends an enquiry or booking request. It does not take payment or
          reserve a confirmed place, vehicle, guide or itinerary. No guest account is required.
        </p>
        <p>
          Your automated email receipt acknowledges that your request has been received. The RA2
          team will check availability and contact you using your preferred contact method to
          discuss a personalised quote. Confirmation follows acceptance of the quote, the required
          payment arrangements and our written confirmation of availability.
        </p>
        <p>
          Please check your details on the review step before submitting. If a receipt does not
          arrive, check your spam folder or contact us before sending duplicate requests.
        </p>
      </>
    ),
  },
  {
    id: "quotes",
    title: "Quotes and payment",
    content: (
      <>
        <p>
          The agreed price, currency, itinerary, inclusions, exclusions, deposit, payment dates and
          cancellation conditions are set out in your quotation. Optional activities, meals,
          admission charges and other extras are included only where your package or quotation
          expressly says so. Changes to your plans may require a revised quote.
        </p>
        <p>
          For the Private Cape Peninsula Tour, the published booking information states that
          quotations are valid for seven days, a 50% deposit confirms an accepted quotation subject
          to availability, and full payment is required before the tour. Other experiences may have
          different conditions; check the terms supplied for your specific booking.
        </p>
        <p>
          This website has no online checkout. Follow the payment instructions supplied directly by
          RA2, and contact us using the details on this website if you need to verify them. Do not
          send payment card information through the booking form.
        </p>
      </>
    ),
  },
  {
    id: "vehicles",
    title: "Vehicles and pickups",
    content: (
      <>
        <p>
          A vehicle selected in the form is a preference, subject to availability and suitability
          for your group. You can also ask us to recommend one. The RA2 team will confirm the
          vehicle arrangements with you; a selection alone is not a guarantee of a particular model.
        </p>
        <p>
          Published guest capacities exclude the driver. Where capacity is marked for confirmation,
          check the available guest seats with us. Luggage space depends on seating configuration
          and bag sizes, so tell us about suitcases, bulky items, child seats, accessibility
          requirements or a possible trailer before confirming.
        </p>
        <p>
          Provide accurate pickup and drop-off addresses, travel dates, times, contact numbers and
          flight details where relevant. Tell us promptly if any of these change. Road vehicle
          preferences do not select an aircraft or a lodge’s game-drive vehicle.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes and cancellations",
    content: (
      <>
        <p>
          To change or cancel a request or confirmed booking, email{" "}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or{" "}
          <a href={CONTACT.whatsapp}>message us on WhatsApp</a> with your name and reference. A form
          submission cannot be edited online after it has been sent. Changes depend on availability
          and may affect the price.
        </p>
        <p>
          The cancellation conditions supplied with your quotation apply subject to applicable law.
          Where section 17 of South Africa’s Consumer Protection Act applies, advance bookings can
          be cancelled and any cancellation charge must be reasonable in the circumstances. The Act
          also provides exceptions, including certain cancellations caused by death or
          hospitalisation of the person for whom the booking was made. See the{" "}
          <a
            href="https://www.gov.za/sites/default/files/32186_467.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consumer Protection Act, section 17
          </a>
          .
        </p>
        <p>
          There is no single refund percentage or cancellation timetable for every experience on
          this website. Ask us to explain the conditions for your selected trip before accepting the
          quote.
        </p>
      </>
    ),
  },
  {
    id: "travel",
    title: "Your travel arrangements",
    content: (
      <>
        <p>
          Tell us about relevant mobility needs, dietary requirements and child travel arrangements
          so we can discuss suitable options. Any special arrangement must be agreed with us; adding
          a note to the form does not by itself confirm it.
        </p>
        <p>
          Attractions, routes and activities may be affected by weather, road conditions, safety
          requirements, opening times or third-party availability. Any necessary changes and their
          effect on your arrangements will be discussed with you. Wildlife sightings and
          weather-dependent activities cannot be guaranteed.
        </p>
        <p>
          Please follow reasonable safety instructions from your guide, driver and activity
          providers. Check any passports, visas, health requirements and travel insurance relevant
          to your own journey. Terms of third-party activities or accommodation will be shared where
          applicable before you agree to them.
        </p>
      </>
    ),
  },
  {
    id: "website",
    title: "Website and personal details",
    content: (
      <>
        <p>
          Package descriptions and fleet guidance help you plan, while your agreed quotation
          confirms the services being supplied. Contact us about any apparent error or inconsistency
          before booking. Do not submit false requests, misuse other people’s contact details or
          attempt to interfere with the website.
        </p>
        <p>
          Our <Link to="/privacy-policy">Privacy Policy</Link> explains how booking and contact
          information is used. The contact permission in the request form allows us to respond to
          and arrange your trip; it is not a newsletter subscription. External links, including
          social media and reviews, have their own terms.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Questions or concerns",
    content: (
      <>
        <p>
          If something about your booking or experience needs attention, please contact RA2 with
          your name, booking reference and a description of the issue so we can address it.
        </p>
        <ul>
          <li>
            Email: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </li>
          <li>
            Phone: <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          </li>
          <li>
            WhatsApp: <a href={CONTACT.whatsapp}>{CONTACT.phone}</a>
          </li>
        </ul>
        <p>
          South African law applies, subject to any mandatory consumer protections that apply to
          you. Updates to these website terms will show a revised date above; changes do not
          retrospectively replace the arrangements already agreed for a confirmed booking.
        </p>
      </>
    ),
  },
];

function Terms() {
  return (
    <PolicyPage
      eyebrow="Clear plans. Confident journeys."
      title="Terms & Conditions"
      intro="From your first enquiry to your confirmed trip, here’s how planning with RA2 works and what to check before you travel."
      sections={SECTIONS}
      related="privacy"
    />
  );
}
