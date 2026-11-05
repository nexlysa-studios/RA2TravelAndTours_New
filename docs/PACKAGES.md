# Editing website packages

Sign in at `/admin`, then select **Packages**. Package changes are stored in Supabase; saving a published package updates the website and booking choices without rebuilding Netlify. Open guest pages refresh their catalogue within about a minute; refreshing the page also fetches current data.

## Change an existing package

1. Find its card and choose **Edit package**.
2. Open the numbered sections and edit the labelled fields. Lists use one item per line. Add, remove or reorder itinerary stops and FAQs with their buttons.
3. Choose an existing photo or upload a landscape JPG, PNG, WebP or AVIF under 5 MB. Add a short photo description for accessibility.
4. Choose **Preview** to see the unsaved page. Preview links do not navigate away.
5. Close the preview, then choose **Save changes**. Look for the saved confirmation.

Keep the short summary concise: it appears on cards and in the booking form. The introduction, overview, at-a-glance rows, highlights, itinerary, inclusions, exclusions, customisation, travel advice, FAQs and booking information appear on the detail page.

The Peninsula package contains the supplied **Penguins & Coastal Wonders** content, including Cape Point and Boulders admission, eight itinerary stops, nine FAQs and the supplied deposit/quotation terms. Update both the FAQ answer and the separate booking-information field if changing those terms.

## Add a package

1. Choose **Add package**, enter its name and select its experience type.
2. Check the generated website address. It becomes permanent after the first save so existing links keep working. Renaming the package later changes the displayed name, not its address.
3. Complete the content and save a private draft while preparing it.
4. Add the short summary, introduction, location and duration before publishing.
5. Switch **Published** on, choose website placements and save. Every published package becomes a booking option.

Choose **Transfer / chauffeur** as the type when pickup, drop-off and pickup time must be required. This behaviour follows the type even if you rename the package.

## Website placements

- **Published:** guests can view its detail page and select it in the booking form.
- **Feature on the home page:** include it in Signature experiences.
- **Show in Private Tours:** list it in the tour catalogue.
- **Show on its category page:** include safaris, journeys or transfers on their matching page.
- **Display order:** lower numbers come first; equal numbers sort by name.
- **Tour filters:** choose the categories used by the Private Tours filters.

Each package has a page at `/tours/<its-address>`. The existing `/tours/peninsula` address is preserved. Fleet vehicle photographs and seating specifications remain in the fleet page; the transfer package itself is editable here.

## Pause a package

Switch **Published** off and save. It disappears from public lists and new booking choices, and its public page becomes unavailable. It remains in Packages as a draft/paused package and can be published again later. Guests with an older open form are asked to choose a current package before a new request can be accepted.

Packages cannot be deleted through the dashboard. Existing bookings keep their submitted package name, stable ID, type and recorded inclusions/exclusions/booking information. Later edits never rewrite those snapshots. Bookings made before the catalogue was introduced keep their existing details.

The editor checks for concurrent changes, warns before discarding unsaved edits and restricts editing/photo uploads to current administrators. Guests can read only published packages; standard staff cannot edit packages or upload photos.

Package editing does not change the notification email recipient, email provider settings or booking statuses. Quote requests still require availability and pricing to be agreed; the website does not collect deposits.
