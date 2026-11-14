# Booking services

The five-step booking form reads packages and fleet vehicles from Supabase. Published transport packages use the existing `transfer` experience type and an explicit `transport_service` classification: `transfer` or `chauffeur`.

## Admin: editing a service

1. Open **Admin → Packages**, then edit the relevant package.
2. Under **Name & essentials**, choose **Transfer / chauffeur** as the experience type.
3. Select **Point-to-point transfer** or **Private chauffeur service** under **Booking service**. This controls the fields requested from guests.
4. Keep **Published** and **Show on its category page** enabled to offer the package on the corresponding Transfers or Chauffeurs page. Use display order to select which service package that page links to first.
5. Save. Open public pages refresh their catalogue within a minute.

Transfers require pickup, destination and pickup time. Chauffeur services require pickup, start time, half-day/full-day/multi-day duration and planned stops. A final destination is optional for chauffeurs. Fixed multi-day dates require an end date on or after the start date; flexible dates are arranged with the team. Hours, mileage, waiting time and overtime are agreed in the quote, not assumed from the duration label.

All chauffeur page enquiry and fleet links preselect its published chauffeur package. Transfer links preselect a transfer package. Both continue through vehicle preference, guest details and editable review. Changing service clears chauffeur fields; switching duration or choosing flexible dates clears an end date that no longer applies. Changes reset contact consent.

## Stored records and emails

`bookings.transport_service`, `chauffeur_duration`, `service_end_date` and `planned_stops` preserve the submitted service details. The database derives the service from the selected package and rejects conflicting submissions. Package and vehicle snapshots preserve the version requested even after catalogue edits. Admin booking details and both transactional emails show the service, duration, date range and route.

The booking RPC saves a request and both email jobs atomically. UUID retries retain the existing idempotency behaviour. Existing records and older transfer payloads remain supported; the original `Transfer / Chauffeur` title is accepted as a legacy alias for its original package. New requests use separate Private Transfers and Private Chauffeur Service packages.

## Package photos

Safari cards and package details use `packages.image_url`/`image_key`. The original Aquila, Kruger and Sabi Sands artwork is stored under `package-images/seed/`. The migration only fills blank photo URLs, preserving custom admin photos. Future photos can be changed in **Admin → Packages → Package photo** without editing frontend code.

## Verification

Validation and email tests run with `npm run test`. Browser checks use intercepted booking/email APIs. Database checks run inside a rolled-back transaction, verifying persisted chauffeur details, both queue jobs, retries, invalid dates/service choices, vehicle capacity and legacy transfers. They do not leave bookings or send test emails.
