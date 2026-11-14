-- Clarify the original seed copy without replacing text edited by an admin.
update public.packages
set description = 'Arrange a private airport, hotel, safari lodge or city-to-city transfer with RA2. Share your pickup and drop-off locations, pickup time, passenger count and luggage so we can recommend a suitable vehicle and prepare your quote. For a driver with several planned stops or a half-day, full-day or multi-day schedule, choose Private Chauffeur Service instead.'
where id = '00000000-0000-4000-8000-000000000007'
and description = 'Arrange a private transfer or chauffeur service with RA2. Share your pickup and drop-off locations, travel time, passenger count and luggage so we can recommend a suitable vehicle and prepare your quote.';
