-- Seating and luggage details transcribed from the ten supplied fleet images.
-- A NULL passenger capacity means confirmation is required, not unlimited seats.
insert into public.fleet_vehicles (id, name, category, model_year, description, passenger_capacity, capacity_label, seating_notes, luggage_guide, features, image_url, image_alt, is_published, sort_order)
select id, name, category, model_year, description, passenger_capacity, capacity_label, seating_notes, luggage_guide, features, image_url, image_alt, is_published, sort_order from jsonb_populate_recordset(null::public.fleet_vehicles,
$fleet_seed$[
  {
    "id": "10000000-0000-4000-8000-000000000009",
    "name": "Standard Sedan",
    "category": "sedan",
    "model_year": 2025,
    "description": "Everyday comfort for private transfers. Make and model are confirmed when booking.",
    "passenger_capacity": 3,
    "capacity_label": "Recommended for 1–3 guests",
    "seating_notes": "Front: driver and 1 guest. Rear: 2 guests with the centre seat left free.",
    "luggage_guide": "Luggage fit depends on the allocated vehicle. Send suitcase sizes and quantities.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Everyday comfort"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-9.jpg",
    "image_alt": "Standard Sedan — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 10
  },
  {
    "id": "10000000-0000-4000-8000-000000000002",
    "name": "Mercedes-Benz C180",
    "category": "sedan",
    "model_year": 2020,
    "description": "AMG Line luxury sedan for private transfers, tours and business travel.",
    "passenger_capacity": 3,
    "capacity_label": "Private travel for 1–3 guests",
    "seating_notes": "Front: driver and 1 guest. Rear: 2 guests, centre seat left free. Best comfort: 2 guests in the rear.",
    "luggage_guide": "Suggested: 2 medium suitcases and 2 small soft bags. Bag sizes and fit must be confirmed before booking.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Business travel"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-2.jpg",
    "image_alt": "Mercedes-Benz C180 — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 20
  },
  {
    "id": "10000000-0000-4000-8000-000000000004",
    "name": "Toyota Rumion",
    "category": "mpv",
    "model_year": 2025,
    "description": "Compact MPV with 7 seats including the driver.",
    "passenger_capacity": 6,
    "capacity_label": "Up to 6 guests + driver",
    "seating_notes": "Front: driver and 1 guest. Middle: 3 guests. Rear: 2 guests.",
    "luggage_guide": "More luggage space with the rear row folded. Full seating reduces luggage space. Send your bag sizes before booking.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Group travel"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-4.jpg",
    "image_alt": "Toyota Rumion — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 30
  },
  {
    "id": "10000000-0000-4000-8000-000000000010",
    "name": "Mercedes-Benz V-Class",
    "category": "van",
    "model_year": 2025,
    "description": "Luxury passenger travel in the illustrated 7-seat configuration.",
    "passenger_capacity": 6,
    "capacity_label": "Up to 6 guests + driver",
    "seating_notes": "Front: driver and 1 guest. Middle: 2 individual captain seats. Rear: 3 guests on a bench seat. Actual configuration confirmed when booking.",
    "luggage_guide": "Dedicated rear luggage area. Bag quantity and size must be confirmed before booking.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Group travel"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-10.jpg",
    "image_alt": "Mercedes-Benz V-Class — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 40
  },
  {
    "id": "10000000-0000-4000-8000-000000000003",
    "name": "Hyundai Staria",
    "category": "van",
    "model_year": 2025,
    "description": "Executive 9-seater for private touring and group travel.",
    "passenger_capacity": 8,
    "capacity_label": "Up to 8 guests + driver",
    "seating_notes": "Front: driver and 2 guests. Middle: 3 guests. Rear: 3 guests. 9 seats total.",
    "luggage_guide": "Luggage capacity depends on passenger numbers and seat positions. Trailer available by arrangement.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Group travel"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-3.jpg",
    "image_alt": "Hyundai Staria — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 50
  },
  {
    "id": "10000000-0000-4000-8000-000000000001",
    "name": "Toyota Quantum",
    "category": "minibus",
    "model_year": 2025,
    "description": "GL 11-seater with spacious seating for families, friends and small groups.",
    "passenger_capacity": 10,
    "capacity_label": "Up to 10 guests + driver",
    "seating_notes": "Driver and 10 guests: 11 seats total. Illustrative arrangement; layout confirmed when booking.",
    "luggage_guide": "Group luggage assessed before booking. Trailer available by arrangement.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Group travel"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-1.jpg",
    "image_alt": "Toyota Quantum — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 60
  },
  {
    "id": "10000000-0000-4000-8000-000000000006",
    "name": "Toyota Quantum GL",
    "category": "minibus",
    "model_year": 2025,
    "description": "14-seater for private touring and group transfers.",
    "passenger_capacity": 13,
    "capacity_label": "13 guests + driver",
    "seating_notes": "Front: driver and 1 passenger. Rear cabin: 12 passengers. 14 seats total.",
    "luggage_guide": "Luggage assessed before booking. Trailer available by arrangement.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Group travel"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-6.jpg",
    "image_alt": "Toyota Quantum GL — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 70
  },
  {
    "id": "10000000-0000-4000-8000-000000000008",
    "name": "Toyota Hiace GL",
    "category": "minibus",
    "model_year": 2025,
    "description": "Classic-shape 14-seater with comfortable bench seating for family, friends and corporate travel.",
    "passenger_capacity": 13,
    "capacity_label": "13 guests + driver",
    "seating_notes": "13 guests and driver: 14 seats total. Actual row layout confirmed when booking.",
    "luggage_guide": "Trailer available for group luggage. Confirm passengers and luggage when enquiring.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Group travel"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-8.jpg",
    "image_alt": "Toyota Hiace GL — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 80
  },
  {
    "id": "10000000-0000-4000-8000-000000000005",
    "name": "Mercedes-Benz Sprinter",
    "category": "minibus",
    "model_year": 2025,
    "description": "21-seater for group airport transfers, private Western Cape tours and group travel.",
    "passenger_capacity": 20,
    "capacity_label": "20 guests + driver",
    "seating_notes": "20 guest seats and driver: 21 seats total. Exact row arrangement confirmed with the allocated vehicle.",
    "luggage_guide": "Group luggage and trailer requirements quoted to suit your trip.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Group travel"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-5.jpg",
    "image_alt": "Mercedes-Benz Sprinter — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 90
  },
  {
    "id": "10000000-0000-4000-8000-000000000007",
    "name": "30-Seater Bus",
    "category": "coach",
    "model_year": 2025,
    "description": "Group transfers and private travel in a spacious coach. The supplied image does not specify a confirmed guest-seat count.",
    "passenger_capacity": null,
    "capacity_label": "Confirm available guest seats when booking",
    "seating_notes": "Passenger seating for group travel. Available guest seats and exact layout must be confirmed with the allocated bus.",
    "luggage_guide": "Luggage storage depends on the allocated bus. Send passenger and baggage details for a tailored quote.",
    "features": [
      "Airport transfers",
      "Private tours",
      "Group travel"
    ],
    "image_url": "https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/fleet-images/seed/fleet-7.jpg",
    "image_alt": "30-Seater Bus — supplied RA2 vehicle and seating illustration",
    "is_published": true,
    "sort_order": 100
  }
]$fleet_seed$::jsonb) on conflict (id) do nothing;
