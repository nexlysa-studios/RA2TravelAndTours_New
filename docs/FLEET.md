# Fleet management

Open `/admin` and choose **Fleet**. Website fleet cards and booking choices read published records in Supabase `fleet_vehicles`. Images live in `fleet-images`; uploads are restricted to administrators.

## Edit or add

1. Choose **Edit vehicle**, or **Add vehicle** to start a draft.
2. Enter the name, type and model year if known.
3. Set **Maximum guests — exclude the driver** to the verified guest count. Children count as guests. Leave it blank if seating must be confirmed; do not guess.
4. Write a seating label, seating arrangement and luggage guide. Use one feature per line. Explain limits caused by full occupancy, folding seats or trailers.
5. Upload a JPG, PNG, WebP or AVIF under 5 MB and add an accessible image description.
6. Switch **Published** on and save when ready. Lower display-order numbers appear first. Open guest pages refresh within about a minute; a page refresh also loads current choices.

The original assets were uploaded without image edits. Their seating/luggage guidance was transcribed. The C180 image is labelled 2020; the others are labelled 2025. The Standard Sedan's actual make/model is confirmed when booking.

| Vehicle | Guest guidance, driver excluded |
| --- | --- |
| Standard Sedan | Recommended for 1–3 |
| Mercedes-Benz C180 | 1–3; two rear guests for best comfort |
| Toyota Rumion | Up to 6 |
| Mercedes-Benz V-Class | Up to 6 in the illustrated configuration |
| Hyundai Staria | Up to 8 |
| Toyota Quantum | Up to 10 |
| Toyota Quantum GL | 13 |
| Toyota Hiace GL | 13 |
| Mercedes-Benz Sprinter | 20 |
| 30-Seater Bus | Guest-seat count requires confirmation |

The bus image asks for confirmation of available guest seats, so its numeric guest capacity is blank. Images and seating diagrams are illustrative; actual availability, configuration and luggage fit are confirmed with the quote.

## Pause, remove or restore

- To pause, switch **Published** off and save.
- **Remove vehicle** archives it and removes it from the website and new booking choices. Existing bookings and photos are kept.
- Use the **Removed** filter and **Restore draft** to bring it back privately, then review and publish.

Removing a vehicle does not cancel a guest booking or send a cancellation email.

## Bookings and emails

The form has five steps: experience, travel details, vehicle, contact details and review. Guests can select a vehicle or **Let RA2 recommend**. Fleet-page buttons preselect the vehicle and a transfer package when available.

Known guest capacities are checked against adults plus children in both the UI and database. An unconfirmed configuration can be requested for manual assessment; it is not guaranteed to fit. Unpublished/removed vehicles cannot be selected for a new request. Older forms and bookings remain compatible.

New requests store a stable vehicle ID and a snapshot of the name, guest guidance, seating, luggage and image. Admin booking details and both emails show that recorded preference. Later fleet edits do not change it. Earlier requests with no choice retain that distinction.

Preferences are not vehicle reservations. They apply to RA2 road travel; flights and lodge game-drive vehicles are arranged separately. Staff confirm availability, actual seats, child-seat requirements and luggage fit before confirming the trip.

The booking transaction and two-job email queue are preserved. Fleet editing never changes notification recipients or Resend secrets. `scripts/upload-fleet-images.mjs` is for initial asset upload only and never overwrites existing storage objects; routine edits belong in the dashboard.
