# RA2 Travel and Tours

Private tours, safaris and transfers, with guest booking requests and a Supabase-backed staff dashboard.

- Repository: https://github.com/nexlysa-studios/RA2TravelAndTours_New
- Supabase project: `kqiizpibptowcqfzycvj`
- Booking form: `/plan-my-trip`
- Staff dashboard: `/admin`

## Develop

```sh
npm install
npm run dev
```

The browser connection in `src/lib/supabase-public.ts` contains the project URL and **public anon key only**. These are intentionally public; RLS protects the database. Override them with the public variables in `.env.example` if moving to a different Supabase project. Never put a service-role key, Resend key or staff password in a `VITE_` variable.

## Booking flow

1. Choose an experience.
2. Enter travel details, dates, party size and transfer information where applicable.
3. Choose a fleet vehicle or let RA2 recommend the right fit.
4. Provide contact information and contact preference.
5. Review, edit sections, consent and submit.

The `create-booking` Edge Function validates the same schema as the form, applies persistent rate limits and saves the booking plus two email jobs in one database transaction. A request UUID makes retries idempotent. Guests cannot read, insert or update booking or staff tables directly; they can read published packages. A saved request receives a unique `RA2-…` reference; it is not a paid or confirmed trip.

The desktop summary stays alongside the form as the guest scrolls. Mobile has a collapsible summary. Guest details are held in memory while completing the form, not saved in browser storage.

## Editable packages

Open **Admin → Packages** to manage the Supabase catalogue. The existing tours, safari choices, journey examples and transfer experience are seeded in `public.packages`. The supplied Peninsula page includes its updated admission inclusions, eight itinerary stops and nine FAQs. Public cards, detail pages and booking choices read the published catalogue; drafts remain private.

Admins can create packages, edit content and FAQs, reorder itinerary stops, upload photos, preview changes and publish/pause offerings. Every published package can receive a booking request, and new requests retain a stable package ID, canonical type and snapshot of the package details. Existing bookings are preserved. Transfer validation follows the package type rather than an editable title.

See [the package editing guide](docs/PACKAGES.md) for the owner's step-by-step instructions. Package management does not change email secrets or the current notification inbox.

## Editable fleet

Open **Admin → Fleet** to add/edit vehicles, upload photos, publish/pause choices or remove them from the active fleet. The ten supplied fleet images are in the `fleet-images` storage bucket and vehicle details are stored in `fleet_vehicles`. Public pages and the vehicle booking step read the published catalogue.

Guest capacity excludes the driver and counts children. The bus's guest-seat count is intentionally unconfirmed. Selected vehicles are validated in the database and recorded as immutable booking snapshots, then included in both email templates and admin booking details. Removed vehicles are archived to preserve that history.

See [the fleet editing guide](docs/FLEET.md). Fleet editing does not change the email notification recipient or Resend configuration.

## Staff and database access

- `profiles.id` references Supabase Auth users. Auth account creation automatically creates a profile and a `user_roles` row with role `user`.
- `user_roles.user_id` references the profile. Change its `role` to `admin` in Table Editor or toggle Admin access in the dashboard. Roles are read from the database, so access changes do not depend on old JWT claims expiring.
- Staff without the admin role can read their own profile/role and edit their own name/phone; they cannot see bookings or promote themselves.
- Administrators can read bookings and email status, update booking status/internal notes, create staff accounts and manage roles. Guest contact details are protected against direct client overwrites. The last administrator cannot be removed.
- Guests do not get Auth accounts, profiles or roles.
- Internal notes are not included in guest emails. Status changes are internal and do not send a separate status-update email.

The dashboard supports live updates with polling fallback, search, date/status filters, pagination, email/call/WhatsApp links, email retry controls and password changes. New staff receive no automatic invitation email; the administrator shares their temporary password privately.

The initial administrator has been provisioned in Supabase Auth. Use the credentials supplied for setup, then change the temporary password under **Team & account → Your account** before launch. The password is not stored in this repository.

## Finish Resend setup

The backend is deployed. These Supabase Edge Function secrets are already configured:

| Secret | Value / purpose |
| --- | --- |
| `EMAIL_FROM` | `RA2 Travel and Tours <bookings@ra2travelandtours.co.za>` |
| `ADMIN_NOTIFICATION_EMAIL` | `rezah@ra2travelandtours.co.za` |
| `SITE_URL` | `https://ra2travelandtours.co.za` |
| `ALLOWED_ORIGINS` | The apex/www domains plus localhost ports 5173 and 3000 |
| `BOOKING_EMAIL_WORKER_TOKEN` | Private random scheduler credential, also stored in Supabase Vault |

To enable delivery:

1. [Add and verify `ra2travelandtours.co.za` in Resend](https://resend.com/docs/dashboard/domains/introduction), using the DNS records Resend provides. The API key must permit sending from this domain.
2. Create a Resend sending key. Add it as **`RESEND_API_KEY`** in [Supabase Edge Function secrets](https://supabase.com/dashboard/project/kqiizpibptowcqfzycvj/functions/secrets). Keep it out of frontend variables and Git.
3. Submit a request with a real authorised inbox. Check both the guest receipt and the admin notification. The dashboard's **Process pending emails** button runs the queue immediately; the scheduled worker also runs every minute.
4. Inspect Resend's email logs to confirm delivery. Dashboard “Sent” means Resend accepted the message, not proof of delivery to the inbox. A delivery/bounce webhook is a possible next enhancement.

No redeploy is needed after setting the key. Missing email configuration leaves jobs queued without consuming attempts. Provider errors retry with exponential backoff, up to eight attempts; failed jobs remain visible and admins can retry unsent jobs. Jobs use leases to avoid concurrent delivery and stable [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys) for retries. Successfully sent jobs are not requeued by the retry button.

Guest receipts and admin notifications both include the reference, experience, dates, traveller counts, contact details, preferred contact method, transfer details and special requests. Guest replies go to the business inbox; admin replies go to the guest.

**Until the domain is verified and `RESEND_API_KEY` exists, actual email delivery cannot be tested or guaranteed. Bookings still save and appear in the admin dashboard.** Requests queued before activation will also be sent when delivery is enabled.

## Deploy / update

```sh
supabase link --project-ref kqiizpibptowcqfzycvj
supabase db push --linked
supabase functions deploy --use-api --project-ref kqiizpibptowcqfzycvj
npm run build
```

The frontend uses the existing Netlify build configuration. Build/publish the updated GitHub checkout through your normal hosting flow. If testing on a separate Netlify or preview URL, add that **exact origin** to `ALLOWED_ORIGINS` in Supabase secrets. Update `SITE_URL` if changing the production domain.

`supabase/config.toml` deliberately disables the platform JWT check for public guest submission. Staff functions validate the actual Auth session with `getUser` and query the caller's current admin role. The scheduled email worker additionally accepts its private Vault-backed worker credential; it cannot be triggered by an anonymous visitor.

`scripts/configure-supabase.mjs` is a one-time bootstrap helper; it retrieves service credentials into memory through the logged-in CLI, writes only the public browser connection, configures sender secrets and synchronises the scheduler token with Vault. Temporary secret files are ignored and removed. Do not rerun it to add a Resend key. Re-running with `ADMIN_BOOTSTRAP_PASSWORD` creates the initial account only if it does not already exist; it never resets an existing password.

## Verify

```sh
npm run typecheck
npm test
npm run build
```

Live integration/browser checks require a logged-in Supabase CLI and the current admin password supplied through the process environment:

```powershell
# Set ADMIN_BOOTSTRAP_PASSWORD securely in your terminal session first.
npm run test:integration
npm run test:e2e
```

The browser check uses installed Google Chrome, starts/reuses localhost:5173, checks desktop/mobile layouts and writes screenshots under ignored `.qa/`. Integration checks create temporary QA bookings/staff and delete only their own records. They verify RLS, role grants/revocations, admin edits, idempotency, server validation, queue lease recovery and atomic rate limits. Run them before enabling real email sending, or use an appropriate test Resend setup, as a live booking can trigger emails.

Supabase migrations preserve existing history. Do not reset the production database or rewrite published Git history.
