import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Car, Check, ChevronRight, Users } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { VEHICLE_CATEGORY_LABELS, vehicleFits, type FleetVehicle } from "@/lib/fleet";

export function FleetCard({
  vehicle: v,
  package: pkg,
}: {
  vehicle: FleetVehicle;
  package?: { id: string; name: string } | undefined;
}) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <img
        src={v.image_url}
        alt={v.image_alt || v.name}
        loading="lazy"
        className="aspect-[2/3] w-full bg-secondary object-contain"
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow mb-2">{v.capacity_label}</p>
        <h3 className="text-2xl">{v.name}</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {v.model_year ? `${v.model_year} · ` : ""}
          {VEHICLE_CATEGORY_LABELS[v.category]}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{v.description}</p>
        {v.luggage_guide && (
          <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            <strong>Luggage: </strong>
            {v.luggage_guide}
          </p>
        )}
        <Link
          to="/plan-my-trip"
          search={{ vehicle: v.id, ...(pkg ? { package: pkg.id, experience: pkg.name } : {}) }}
          className="booking-button mt-5"
        >
          Choose this vehicle
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function VehicleSelection({
  vehicles,
  choice,
  selectedId,
  adults,
  children,
  onChoose,
}: {
  vehicles: FleetVehicle[];
  choice: "specific" | "recommend" | undefined;
  selectedId: string | undefined;
  adults: number;
  children: number;
  onChoose: (vehicle: FleetVehicle | null) => void;
}) {
  const [viewing, setViewing] = useState<FleetVehicle | null>(null);
  const total = adults + children;
  return (
    <div className="space-y-5" id="vehicle_id" tabIndex={-1}>
      <p className="rounded-lg bg-secondary/60 p-4 text-sm text-muted-foreground">
        Choosing for{" "}
        <strong className="text-primary">
          {total} guest{total === 1 ? "" : "s"}
        </strong>
        , including children. Your vehicle is a preference; RA2 confirms availability, seating and
        luggage fit with your quote.
      </p>
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-5 ${choice === "recommend" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}`}
      >
        <input
          type="radio"
          name="vehicle-choice"
          className="mt-1 size-4 shrink-0 accent-primary"
          checked={choice === "recommend"}
          onChange={() => onChoose(null)}
        />
        <div>
          <p className="text-sm font-semibold">Let RA2 recommend the right vehicle</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Ideal if you’re unsure, travelling with a large group or need help with luggage and
            child seats.
          </p>
        </div>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {vehicles.map((v) => {
          const fits = vehicleFits(v, adults, children);
          const selected = choice === "specific" && selectedId === v.id;
          return (
            <article
              key={v.id}
              className={`min-w-0 overflow-hidden rounded-xl border ${selected ? "border-primary ring-1 ring-primary" : "border-border"} ${fits ? "bg-card" : "bg-secondary/40"}`}
            >
              <label
                className={`block ${fits ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              >
                <img
                  src={v.image_url}
                  alt={v.image_alt || v.name}
                  loading="lazy"
                  className="aspect-[4/3] w-full bg-secondary object-contain"
                />
                <div className="p-4">
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="vehicle-choice"
                      className="mt-1 size-4 shrink-0 accent-primary"
                      checked={selected}
                      disabled={!fits}
                      onChange={() => onChoose(v)}
                    />
                    <div className="min-w-0">
                      <h3 className="font-sans text-sm font-semibold">{v.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{v.capacity_label}</p>
                    </div>
                    {selected && <Check className="ml-auto size-4 shrink-0 text-primary" />}
                  </div>
                  <p
                    className={`mt-3 text-xs ${!fits ? "text-destructive" : v.passenger_capacity === null ? "font-medium text-primary" : "text-muted-foreground"}`}
                  >
                    {!fits
                      ? `Too small for ${total} guests`
                      : v.passenger_capacity === null
                        ? "Guest-seat count needs confirmation"
                        : `Guest capacity: ${v.passenger_capacity} (driver excluded)`}
                  </p>
                </div>
              </label>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-border px-4 py-3 text-xs font-medium text-primary hover:bg-secondary"
                onClick={() => setViewing(v)}
              >
                <Car className="size-4" />
                View seating & luggage details
              </button>
            </article>
          );
        })}
      </div>
      {!vehicles.length && (
        <p className="text-sm text-muted-foreground">
          Our team can recommend a suitable vehicle with your quotation.
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Vehicle preferences apply to RA2 road transfers and touring. Flights and safari lodge
        game-drive vehicles are arranged separately. Fleet images and seating illustrations are
        illustrative.
      </p>
      <Sheet
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {viewing && (
            <>
              <SheetTitle className="pr-5 text-2xl">{viewing.name}</SheetTitle>
              <SheetDescription className="mt-2">{viewing.capacity_label}</SheetDescription>
              <img
                src={viewing.image_url}
                alt={viewing.image_alt || viewing.name}
                className="my-5 w-full rounded-lg object-contain"
              />
              <div className="space-y-4 text-sm">
                <p>
                  <strong>Seating: </strong>
                  {viewing.seating_notes}
                </p>
                <p>
                  <strong>Luggage: </strong>
                  {viewing.luggage_guide}
                </p>
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Users className="size-4 shrink-0" />
                  Availability, actual layout and luggage fit are confirmed before booking.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
