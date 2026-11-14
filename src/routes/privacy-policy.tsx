import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage, type PolicySection } from "@/components/site/PolicyPage";
import { CONTACT } from "@/lib/site";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "How RA2 Travel and Tours uses and protects your personal information when you enquire about private tours, safaris, transfers and tailor-made journeys.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

const SECTIONS: PolicySection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    content: (
      <>
        <p>
          RA2 Travel and Tours is a Cape Town-based tour operator offering private tours, safaris,
          transfers, chauffeur services and tailor-made journeys in South Africa. This policy
          explains how we handle information collected through this website and related booking
          conversations.
        </p>
        <p>
          For privacy questions or requests, contact us at{" "}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or{" "}
          <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>.
        </p>
      </>
    ),
  },
  {
    id: "information",
    title: "Information we collect",
    content: (
      <>
        <p>
          You can browse and request a trip without creating a guest account. When you send a
          request, we collect the details you provide, including:
        </p>
        <ul>
          <li>Your name, email address, phone number and preferred way to be contacted.</li>
          <li>
            Your selected experience, dates or date flexibility, numbers of adults and children, and
            chauffeur duration, end date and planned stops where relevant.
          </li>
          <li>
            Pickup and drop-off locations, pickup time, flight number and luggage details where
            relevant.
          </li>
          <li>Your vehicle preference and any special requests you choose to share.</li>
          <li>
            Your permission to be contacted about the request, your booking reference, and related
            correspondence and booking updates.
          </li>
        </ul>
        <p>
          Our hosting, database and email services also process technical information needed to
          operate the site, such as request logs and email sending status. To limit repeated
          submissions and abuse, the booking service uses short-lived rate-limit records derived
          from your IP address and email address.
        </p>
        <p>
          Please share only what we need to plan your trip. Avoid including passport numbers,
          payment card details or detailed medical records in the request form. If you are arranging
          travel for others, make sure you have authority to share their information. For children,
          a parent or guardian should provide any necessary details.
        </p>
      </>
    ),
  },
  {
    id: "purpose",
    title: "How we use your details",
    content: (
      <>
        <p>
          We use your information to respond to enquiries, check availability, prepare quotations,
          arrange pickups and vehicles, coordinate your itinerary, and manage changes or
          cancellations. We also use it to send your request receipt and booking communications,
          notify our team of new requests, keep booking records, and protect the service from abuse.
        </p>
        <p>
          Depending on the circumstances, this processing supports steps you ask us to take before a
          booking, performance of agreed travel arrangements, legal obligations, legitimate
          operational interests, or your consent. The contact permission in the form relates to your
          trip request; submitting it does not subscribe you to a marketing newsletter.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who receives information",
    content: (
      <>
        <p>
          Authorised RA2 staff can access booking details to handle your request. Where needed to
          arrange an agreed service, relevant details may be shared with your driver, guide,
          accommodation provider or activity operator. We do not sell your personal information.
        </p>
        <p>
          The website uses Netlify for hosting, Supabase for booking data and staff access, and
          Resend for transactional booking emails. These providers process information required to
          supply their services. Communications through WhatsApp, Instagram or your email provider
          are also subject to those providers’ privacy practices.
        </p>
        <p>
          Some providers may process information outside South Africa. Where cross-border processing
          takes place, applicable POPIA requirements and appropriate protections apply. We may also
          disclose information when required by law or to deal with a lawful request.
        </p>
      </>
    ),
  },
  {
    id: "storage",
    title: "Storage and protection",
    content: (
      <>
        <p>
          Booking records are stored in our database, with access controls restricting guest booking
          details to authorised staff and the services that process requests and emails. Staff sign
          in separately; there is no public guest booking directory.
        </p>
        <p>
          We keep information for as long as reasonably needed to handle your enquiry, deliver
          agreed services, resolve disputes and meet applicable record-keeping requirements.
          Retention depends on the type of record and the reason it is held. Contact us if you would
          like us to review information we retain about you.
        </p>
        <p>
          We use technical and organisational measures to protect information, but no online service
          can guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Browser storage and links",
    content: (
      <>
        <p>
          The guest request form does not require a login. Staff sign-in uses browser storage to
          maintain an authenticated session. Hosting and security services may also process
          technical request information needed to deliver and protect the site.
        </p>
        <p>
          The site loads fonts from Google Fonts, which makes requests to Google’s servers. Links to
          Google reviews, Instagram and WhatsApp take you to external services with their own
          privacy and cookie policies. Our home page includes links to our Instagram profile rather
          than an embedded live Instagram feed.
        </p>
        <p>
          You can manage cookies and local storage through your browser settings. Blocking necessary
          storage may affect staff sign-in or other site functionality.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your choices and rights",
    content: (
      <>
        <p>
          Subject to applicable law, you may ask to access or correct personal information we hold
          about you, request deletion where appropriate, object to certain processing, or withdraw
          consent for processing based on consent. Withdrawal does not affect processing that was
          lawful before withdrawal, and some records may need to be retained for other lawful
          reasons.
        </p>
        <p>
          Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> with your request and, if
          relevant, your booking reference. We may need to verify your identity before releasing or
          changing personal information. If details are needed to arrange your trip and you do not
          provide them, we may be unable to complete the arrangements.
        </p>
        <p>
          You can also raise a privacy complaint with South Africa’s{" "}
          <a
            href="https://inforegulator.org.za/complaints/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Information Regulator
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "updates",
    title: "Updates to this policy",
    content: (
      <p>
        We may update this policy when our services or practices change. The date at the top shows
        the latest revision. Please check this page when sending a new enquiry, and contact us if
        anything is unclear.
      </p>
    ),
  },
];

function PrivacyPolicy() {
  return (
    <PolicyPage
      eyebrow="Your details, handled with care"
      title="Privacy Policy"
      intro="A personal journey starts with trust. Here’s what we collect, why we need it, and how to get in touch about your information."
      sections={SECTIONS}
      related="terms"
    />
  );
}
