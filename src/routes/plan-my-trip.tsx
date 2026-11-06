import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Compass,
  Leaf,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Mountain,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  Car,
} from "lucide-react";
import { CONTACT } from "@/lib/site";
import {
  bookingSchema,
  bookingStepSchemas,
  formatTravelDate,
  initialBooking,
  isTransferBooking,
  STEP_FIELDS,
  todayInSouthAfrica,
  type BookingDraft,
} from "@/lib/bookings";
import { functionError, getSupabase } from "@/lib/supabase";
import { packageImage, publicPackagesOptions, type TravelPackage } from "@/lib/packages";
import { publicFleetOptions, vehicleFits, type FleetVehicle } from "@/lib/fleet";
import { VehicleSelection } from "@/components/site/FleetCards";
import peninsula from "@/assets/peninsula.jpg";

export const Route = createFileRoute("/plan-my-trip")({
  loader: async ({ context }) => {
    const [packages, fleet] = await Promise.all([
      context.queryClient.ensureQueryData(publicPackagesOptions),
      context.queryClient.ensureQueryData(publicFleetOptions),
    ]);
    return { packages, fleet };
  },
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    experience?: string | undefined;
    package?: string | undefined;
    vehicle?: string | undefined;
  } => ({
    experience: typeof s["experience"] === "string" ? s["experience"] : undefined,
    package: typeof s["package"] === "string" ? s["package"] : undefined,
    vehicle: typeof s["vehicle"] === "string" ? s["vehicle"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Plan Your Journey | RA2 Travel and Tours" },
      {
        name: "description",
        content:
          "Plan your private South African journey in five simple steps. Review your request and receive a personalised quote from RA2.",
      },
    ],
  }),
  component: Plan,
});

const STEPS = ["Experience", "Travel details", "Choose vehicle", "Your details", "Review & send"];
const ICONS = {
  tour: Compass,
  safari: Leaf,
  journey: Sparkles,
  transfer: Car,
  consultation: MessageCircle,
};

function FormField({
  id,
  title,
  required,
  error,
  children,
  hint,
}: {
  id: string;
  title: string;
  required?: boolean;
  error?: string | undefined;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {title}
        {required && (
          <span className="ml-1 text-gold" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Plan() {
  const { experience, package: packageId, vehicle: vehicleId } = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const packages = useSuspenseQuery({
    ...publicPackagesOptions,
    initialData: loaderData.packages,
  }).data;
  const fleet = useSuspenseQuery({ ...publicFleetOptions, initialData: loaderData.fleet }).data;
  const preselectedVehicle = fleet.find((v) => v.id === vehicleId);
  const preselected = packages.find((p) =>
    packageId ? p.id === packageId : p.name === experience,
  );
  const [draft, setDraft] = useState<BookingDraft>({
    ...initialBooking,
    experience: preselected?.name || "",
    ...(preselected ? { package_id: preselected.id, package_type: preselected.package_type } : {}),
    ...(preselectedVehicle
      ? { vehicle_choice: "specific", vehicle_id: preselectedVehicle.id }
      : {}),
  });
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState<{ reference: string; email: string } | null>(null);
  const [website, setWebsite] = useState("");
  const lastSubmission = useRef<{ fingerprint: string; id: string } | null>(null);
  const formTop = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const selectedPackage = packages.find((p) => p.id === draft.package_id);
  const packageOutdated = Boolean(
    draft.package_id &&
    (!selectedPackage ||
      selectedPackage.name !== draft.experience ||
      selectedPackage.package_type !== draft.package_type),
  );
  const isTransfer = isTransferBooking(draft);
  const selectedVehicle = fleet.find((v) => v.id === draft.vehicle_id);
  const vehicleInvalid =
    draft.vehicle_choice === "specific" &&
    (!selectedVehicle || !vehicleFits(selectedVehicle, draft.adults, draft.children));
  const chooseVehicle = (vehicle: FleetVehicle | null) => {
    setDraft((old) => {
      const next = {
        ...old,
        vehicle_choice: vehicle ? ("specific" as const) : ("recommend" as const),
        consent: false,
      };
      if (vehicle) next.vehicle_id = vehicle.id;
      else delete next.vehicle_id;
      return next;
    });
    setErrors({});
    setError("");
  };
  const choosePackage = (pkg: TravelPackage) => {
    setDraft((old) => ({
      ...old,
      experience: pkg.name,
      package_id: pkg.id,
      package_type: pkg.package_type,
      consent: false,
      ...(old.package_type === "transfer" && pkg.package_type !== "transfer"
        ? { dropoff_location: "", pickup_time: "", flight_number: "", luggage: 0 }
        : {}),
    }));
    setErrors({});
    setError("");
  };
  const update = <K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) => {
    setDraft((old) => ({ ...old, [key]: value, ...(key !== "consent" ? { consent: false } : {}) }));
    setErrors((old) => {
      const next = { ...old };
      delete next[key];
      return next;
    });
    setError("");
  };
  const moveTo = (value: number, edit = false) => {
    setStep(value);
    setEditing(edit);
    setErrors({});
    setError("");
    requestAnimationFrame(() => {
      formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      heading.current?.focus({ preventScroll: true });
    });
  };
  const editStep = (value: number) => moveTo(value, step === 4 || editing);
  const next = () => {
    if (!selectedPackage || packageOutdated) {
      setStep(0);
      setErrors({ experience: "Choose an experience to continue." });
      return;
    }
    if (step === 2 && vehicleInvalid) {
      setErrors({ vehicle_id: "Choose a vehicle that fits your group, or let RA2 recommend one." });
      return;
    }
    const result = bookingStepSchemas[step]!.safeParse(draft);
    const currentFields: readonly string[] = STEP_FIELDS[step]!;
    const issues = result.success
      ? []
      : result.error.issues.filter((issue) => currentFields.includes(String(issue.path[0])));
    if (issues.length) {
      setErrors(Object.fromEntries(issues.map((issue) => [String(issue.path[0]), issue.message])));
      requestAnimationFrame(() => document.getElementById(String(issues[0]!.path[0]))?.focus());
      return;
    }
    moveTo(editing ? 4 : step + 1);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    if (step < 4) {
      next();
      return;
    }
    if (!selectedPackage || packageOutdated) {
      setStep(0);
      setError(
        "This package was updated or unpublished. Please select a current experience; your other details are still here.",
      );
      return;
    }
    if (vehicleInvalid) {
      setStep(2);
      setEditing(true);
      setErrors({
        vehicle_id:
          "Your vehicle is unavailable or too small for the updated group. Please choose again.",
      });
      return;
    }
    const result = bookingSchema.safeParse(draft);
    if (!result.success) {
      const first = result.error.issues[0]!;
      const invalidStep = STEP_FIELDS.findIndex((fields) =>
        (fields as readonly string[]).includes(String(first.path[0])),
      );
      setStep(invalidStep < 0 ? 4 : invalidStep);
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      requestAnimationFrame(() => document.getElementById(String(first.path[0]))?.focus());
      return;
    }
    setSending(true);
    setError("");
    const fingerprint = JSON.stringify(result.data);
    if (lastSubmission.current?.fingerprint !== fingerprint)
      lastSubmission.current = { fingerprint, id: crypto.randomUUID() };
    try {
      const { data, error: invokeError } = await getSupabase().functions.invoke("create-booking", {
        body: { booking: result.data, request_id: lastSubmission.current.id, website },
      });
      if (invokeError)
        throw new Error(
          await functionError(
            invokeError,
            "We couldn't reach our booking service. Please try again or contact us directly.",
          ),
        );
      if (!data?.reference)
        throw new Error(
          "We couldn't confirm your request was saved. Please try again with the same details.",
        );
      setReceipt({ reference: data.reference, email: result.data.email });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputProps = (key: keyof BookingDraft) => ({
    id: key,
    name: key,
    className: "booking-input",
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });
  const summary = (
    <>
      <div className="relative h-36 overflow-hidden rounded-t-xl">
        <img
          src={selectedPackage ? packageImage(selectedPackage) : peninsula}
          alt="South African scenery"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 to-transparent" />
        <p className="absolute bottom-4 left-5 text-sm font-medium text-ivory">
          A little closer to your next adventure.
        </p>
      </div>
      <div className="space-y-5 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Your journey</h2>
          <Compass className="size-5 text-gold" />
        </div>
        <div className="border-b border-border pb-5">
          <p className="text-xs text-muted-foreground">Experience</p>
          <p className="mt-1 font-semibold">{draft.experience || "Your adventure awaits"}</p>
          {draft.experience && step > 0 && (
            <button
              type="button"
              className="mt-1 text-xs font-medium text-primary underline underline-offset-4"
              onClick={() => editStep(0)}
              disabled={sending}
            >
              Change experience
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-gold" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">When</p>
            <p className="text-sm">
              {draft.flexible_dates ? "Flexible dates" : formatTravelDate(draft.travel_date)}
            </p>
            {draft.pickup_time && (
              <p className="text-xs text-muted-foreground">
                {draft.pickup_time} · South African time
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Users className="mt-0.5 size-4 shrink-0 text-gold" />
          <div>
            <p className="text-xs text-muted-foreground">Travellers</p>
            <p className="text-sm">
              {draft.adults || 0} adults{draft.children > 0 ? ` · ${draft.children} children` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Car className="mt-0.5 size-4 shrink-0 text-gold" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Vehicle preference</p>
            <p className="break-words text-sm">
              {draft.vehicle_choice === "specific"
                ? selectedVehicle?.name || "Please choose again"
                : "Let RA2 recommend"}
            </p>
            {selectedVehicle && (
              <p className="mt-1 text-xs text-muted-foreground">{selectedVehicle.capacity_label}</p>
            )}
          </div>
        </div>
        {draft.pickup_location && (
          <div className="flex gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="break-words text-sm">{draft.pickup_location}</p>
            </div>
          </div>
        )}
        <div className="rounded-lg bg-secondary/70 p-4">
          <p className="text-sm font-semibold">Made for you. Priced for you.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            We’ll prepare a personal quote after checking your dates and plans. No payment is needed
            to send a request.
          </p>
        </div>
        <p className="flex gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-gold" />
          Your details are shared only with the RA2 team to plan your trip.
        </p>
      </div>
    </>
  );

  if (receipt)
    return (
      <section className="container-site py-16 md:py-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm md:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <p className="eyebrow mt-7">Request received</p>
          <h1 className="mt-3 text-4xl md:text-5xl">Leave the planning to us.</h1>
          <p className="mt-5 text-muted-foreground">
            Thank you, {draft.full_name}. Your request is safely with the RA2 team. We’ll check
            availability and get back to you with a personalised quote.
          </p>
          <div className="my-7 rounded-xl border border-gold/30 bg-secondary/60 p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Your booking reference
            </p>
            <p className="mt-2 break-all font-mono text-xl font-semibold text-primary">
              {receipt.reference}
            </p>
            <p className="mt-3 break-words text-sm">
              A request receipt will be emailed to <strong>{receipt.email}</strong>. Keep this
              reference if you need to get in touch.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            This is a booking request. Your trip is confirmed once we agree on availability and
            pricing. No payment has been taken.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              className="booking-button"
              href={`${CONTACT.whatsapp}?text=${encodeURIComponent(`Hi RA2, I'd like to discuss booking ${receipt.reference}.`)}`}
            >
              <MessageCircle className="size-4" />
              Chat about my request
            </a>
            <Link to="/" className="booking-button-secondary">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    );

  return (
    <section className="pb-20 pt-10 md:pt-14">
      <div className="container-site">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Your journey, your way</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl">Let’s make it memorable.</h1>
          <p className="mt-4 text-muted-foreground">
            A few simple details. A journey built around you. Send your request and we’ll take care
            of the next steps.
          </p>
        </div>
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_21rem] xl:gap-12">
          <div ref={formTop} className="min-w-0 scroll-mt-40">
            <ol
              aria-label="Booking progress"
              className="mb-5 grid grid-cols-5 gap-0 sm:mb-7 sm:gap-3"
            >
              {STEPS.map((title, index) => (
                <li key={title}>
                  <button
                    type="button"
                    disabled={index > step || sending}
                    onClick={() => index < step && editStep(index)}
                    aria-current={step === index ? "step" : undefined}
                    className={`flex w-full min-w-0 flex-col items-center gap-1 border-b-2 pb-3 text-center text-[10px] leading-tight sm:items-start sm:gap-2 sm:pb-4 sm:text-left sm:text-sm ${index === step ? "border-gold text-primary" : index < step ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                  >
                    <span
                      className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold ${index < step ? "bg-primary text-ivory" : index === step ? "bg-gold text-forest-deep" : "bg-secondary"}`}
                    >
                      {index < step ? <Check className="size-4" /> : `0${index + 1}`}
                    </span>
                    <span
                      className={`max-w-full break-words ${index === step ? "font-semibold" : ""}`}
                    >
                      {title}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">
                Step {step + 1} of 5
              </p>
              <h2 ref={heading} tabIndex={-1} className="text-3xl outline-none sm:text-4xl">
                {
                  [
                    "What’s calling you?",
                    "Let’s plan the details.",
                    "Choose your ride.",
                    "How can we reach you?",
                    "Everything looking good?",
                  ][step]
                }
              </h2>
              <p className="mb-7 mt-3 text-sm text-muted-foreground">
                {
                  [
                    "Choose an experience. We can always tailor it to you.",
                    "Tell us when you’re travelling and who’s coming along.",
                    "Pick a vehicle for your group, or let our team recommend the right fit.",
                    "No account needed. Just the details we need to arrange your trip.",
                    "Take a moment to check your request. You can edit any section before sending.",
                  ][step]
                }
              </p>
              <form onSubmit={submit} noValidate className="space-y-6">
                <div className="absolute -left-[10000px]" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                {step === 0 && (
                  <fieldset id="experience" tabIndex={-1}>
                    <legend className="sr-only">Choose an experience</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {packages.map((pkg) => {
                        const Icon = ICONS[pkg.package_type];
                        const selected = draft.package_id === pkg.id && !packageOutdated;
                        return (
                          <label
                            key={pkg.id}
                            className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-gold hover:bg-secondary/30"}`}
                          >
                            <input
                              type="radio"
                              name="experience"
                              value={pkg.id}
                              checked={selected}
                              onChange={() => choosePackage(pkg)}
                              className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
                            />
                            <span className="pointer-events-none absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2" />
                            <Icon
                              className={`mt-1 size-5 shrink-0 ${selected ? "text-primary" : "text-gold"}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold">{pkg.name}</span>
                              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                                {pkg.summary}
                              </span>
                            </span>
                            <span
                              className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-input"}`}
                            >
                              {selected && <Check className="size-3" />}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {!packages.length && (
                      <p className="rounded-lg bg-secondary p-4 text-sm">
                        We’re updating our experiences. Please contact RA2 directly to plan your
                        trip.
                      </p>
                    )}
                    {packageOutdated && (
                      <p role="alert" className="mt-3 text-sm text-destructive">
                        Your selected package changed. Please choose it again to review the latest
                        details.
                      </p>
                    )}
                    {errors["experience"] && (
                      <p className="mt-3 text-sm text-destructive" role="alert">
                        {errors["experience"]}
                      </p>
                    )}
                  </fieldset>
                )}
                {step === 1 && (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField id="travel_date" title="Travel date" error={errors["travel_date"]}>
                        <input
                          {...inputProps("travel_date")}
                          type="date"
                          min={todayInSouthAfrica()}
                          value={draft.travel_date}
                          disabled={draft.flexible_dates}
                          onChange={(e) => update("travel_date", e.target.value)}
                        />
                        <label className="mt-3 flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={draft.flexible_dates}
                            onChange={(e) => {
                              update("flexible_dates", e.target.checked);
                              if (e.target.checked) update("travel_date", "");
                            }}
                            className="size-4 accent-primary"
                          />
                          My dates are flexible / not sure yet
                        </label>
                      </FormField>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField id="adults" title="Adults" required error={errors["adults"]}>
                          <input
                            {...inputProps("adults")}
                            type="number"
                            min={1}
                            max={100}
                            value={Number.isNaN(draft.adults) ? "" : draft.adults}
                            onChange={(e) => update("adults", e.target.valueAsNumber)}
                          />
                        </FormField>
                        <FormField id="children" title="Children" error={errors["children"]}>
                          <input
                            {...inputProps("children")}
                            type="number"
                            min={0}
                            max={100}
                            value={Number.isNaN(draft.children) ? "" : draft.children}
                            onChange={(e) => update("children", e.target.valueAsNumber)}
                          />
                        </FormField>
                      </div>
                    </div>
                    <div className="grid gap-5 rounded-xl bg-secondary/50 p-4 sm:grid-cols-2 sm:p-5">
                      <div className="sm:col-span-2">
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          <MapPin className="size-4 text-gold" />
                          {isTransfer ? "Your transfer" : "Pickup & preferences"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isTransfer
                            ? "Help us get you to the right place, at the right time."
                            : "Add your accommodation if you know it. You can arrange this with us later."}
                        </p>
                      </div>
                      <FormField
                        id="pickup_location"
                        title="Pickup location"
                        required={isTransfer}
                        error={errors["pickup_location"]}
                      >
                        <input
                          {...inputProps("pickup_location")}
                          maxLength={300}
                          value={draft.pickup_location}
                          placeholder="Airport, hotel or address"
                          onChange={(e) => update("pickup_location", e.target.value)}
                        />
                      </FormField>
                      {isTransfer && (
                        <>
                          <FormField
                            id="dropoff_location"
                            title="Drop-off location"
                            required
                            error={errors["dropoff_location"]}
                          >
                            <input
                              {...inputProps("dropoff_location")}
                              maxLength={300}
                              value={draft.dropoff_location}
                              placeholder="Hotel, airport or address"
                              onChange={(e) => update("dropoff_location", e.target.value)}
                            />
                          </FormField>
                          <FormField
                            id="pickup_time"
                            title="Pickup time"
                            required
                            error={errors["pickup_time"]}
                            hint="South African time (UTC+2)"
                          >
                            <input
                              {...inputProps("pickup_time")}
                              type="time"
                              value={draft.pickup_time}
                              onChange={(e) => update("pickup_time", e.target.value)}
                            />
                          </FormField>
                          <FormField
                            id="flight_number"
                            title="Flight number (optional)"
                            error={errors["flight_number"]}
                          >
                            <input
                              {...inputProps("flight_number")}
                              maxLength={30}
                              value={draft.flight_number}
                              placeholder="e.g. FA101"
                              onChange={(e) => update("flight_number", e.target.value)}
                            />
                          </FormField>
                          <FormField id="luggage" title="Luggage pieces" error={errors["luggage"]}>
                            <input
                              {...inputProps("luggage")}
                              type="number"
                              min={0}
                              max={200}
                              value={Number.isNaN(draft.luggage) ? "" : draft.luggage}
                              onChange={(e) => update("luggage", e.target.valueAsNumber)}
                            />
                          </FormField>
                        </>
                      )}
                    </div>
                    <FormField
                      id="special_requests"
                      title="Anything else we should know?"
                      error={errors["special_requests"]}
                      hint="Interests, children’s ages, accessibility needs, preferred vehicle or anything that would make your journey special."
                    >
                      <textarea
                        {...inputProps("special_requests")}
                        rows={4}
                        maxLength={3000}
                        value={draft.special_requests}
                        onChange={(e) => update("special_requests", e.target.value)}
                        placeholder="Make it yours…"
                      />
                    </FormField>
                  </>
                )}
                {step === 2 && (
                  <>
                    <VehicleSelection
                      vehicles={fleet}
                      choice={draft.vehicle_choice}
                      selectedId={draft.vehicle_id}
                      adults={draft.adults}
                      children={draft.children}
                      onChoose={chooseVehicle}
                    />
                    {errors["vehicle_id"] && (
                      <p role="alert" className="text-sm text-destructive">
                        {errors["vehicle_id"]}
                      </p>
                    )}
                  </>
                )}
                {step === 3 && (
                  <>
                    <FormField
                      id="full_name"
                      title="Full name"
                      required
                      error={errors["full_name"]}
                    >
                      <input
                        {...inputProps("full_name")}
                        autoComplete="name"
                        maxLength={120}
                        value={draft.full_name}
                        onChange={(e) => update("full_name", e.target.value)}
                        placeholder="Your first and last name"
                      />
                    </FormField>
                    <FormField
                      id="email"
                      title="Email address"
                      required
                      error={errors["email"]}
                      hint="We’ll send your request receipt and booking reference here."
                    >
                      <input
                        {...inputProps("email")}
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={draft.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="you@example.com"
                      />
                    </FormField>
                    <FormField
                      id="phone"
                      title="Phone / WhatsApp number"
                      required
                      error={errors["phone"]}
                      hint="Include your country code so we can reach you wherever you are."
                    >
                      <input
                        {...inputProps("phone")}
                        type="tel"
                        autoComplete="tel"
                        maxLength={30}
                        value={draft.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="+27 78 815 8817"
                      />
                    </FormField>
                    <FormField
                      id="contact_preference"
                      title="How would you prefer us to contact you?"
                      error={errors["contact_preference"]}
                    >
                      <select
                        {...inputProps("contact_preference")}
                        value={draft.contact_preference}
                        onChange={(e) =>
                          update(
                            "contact_preference",
                            e.target.value as BookingDraft["contact_preference"],
                          )
                        }
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="phone">Phone call</option>
                      </select>
                    </FormField>
                  </>
                )}
                {step === 4 && (
                  <>
                    <ReviewSection title="Your experience" onEdit={() => editStep(0)}>
                      <p className="font-semibold text-primary">{draft.experience}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedPackage?.duration} · {selectedPackage?.location}
                      </p>
                      {selectedPackage &&
                        (selectedPackage.included.length > 0 || selectedPackage.booking_terms) && (
                          <details className="mt-4 rounded-lg bg-secondary/60 p-3">
                            <summary className="cursor-pointer text-xs font-semibold text-primary">
                              Package inclusions & booking information
                            </summary>
                            <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
                              {selectedPackage.included.length > 0 && (
                                <p>
                                  <strong>Included: </strong>
                                  {selectedPackage.included.join(" ")}
                                </p>
                              )}
                              {selectedPackage.excluded.length > 0 && (
                                <p>
                                  <strong>Excluded: </strong>
                                  {selectedPackage.excluded.join(" ")}
                                </p>
                              )}
                              {selectedPackage.booking_terms && (
                                <p className="whitespace-pre-line">
                                  {selectedPackage.booking_terms}
                                </p>
                              )}
                            </div>
                          </details>
                        )}
                    </ReviewSection>
                    <ReviewSection title="Travel details" onEdit={() => editStep(1)}>
                      <dl className="grid gap-4 sm:grid-cols-2">
                        <ReviewItem
                          title="Travel date"
                          value={
                            draft.flexible_dates
                              ? "Flexible / to be arranged"
                              : formatTravelDate(draft.travel_date)
                          }
                        />
                        <ReviewItem
                          title="Travellers"
                          value={`${draft.adults} adults · ${draft.children} children`}
                        />
                        {draft.pickup_location && (
                          <ReviewItem title="Pickup" value={draft.pickup_location} />
                        )}
                        {isTransfer && (
                          <>
                            <ReviewItem title="Drop-off" value={draft.dropoff_location} />
                            <ReviewItem
                              title="Pickup time"
                              value={`${draft.pickup_time} (South African time)`}
                            />
                            <ReviewItem
                              title="Flight"
                              value={draft.flight_number || "Not specified"}
                            />
                            <ReviewItem title="Luggage" value={`${draft.luggage} pieces`} />
                          </>
                        )}
                      </dl>
                      {draft.special_requests && (
                        <div className="mt-4 border-t border-border pt-4">
                          <p className="text-xs text-muted-foreground">Additional details</p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                            {draft.special_requests}
                          </p>
                        </div>
                      )}
                    </ReviewSection>
                    <ReviewSection title="Your vehicle preference" onEdit={() => editStep(2)}>
                      <p className="font-semibold text-primary">
                        {draft.vehicle_choice === "specific"
                          ? selectedVehicle?.name || "Please choose again"
                          : "Let RA2 recommend the right vehicle"}
                      </p>
                      {selectedVehicle && (
                        <>
                          <p className="mt-2 text-sm">{selectedVehicle.capacity_label}</p>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {selectedVehicle.luggage_guide}
                          </p>
                        </>
                      )}
                      <p className="mt-3 text-xs text-muted-foreground">
                        Availability, actual seating and luggage fit are confirmed with your
                        quotation.
                      </p>
                    </ReviewSection>
                    <ReviewSection title="Your contact details" onEdit={() => editStep(3)}>
                      <dl className="grid gap-4 sm:grid-cols-2">
                        <ReviewItem title="Name" value={draft.full_name} />
                        <ReviewItem title="Email" value={draft.email} />
                        <ReviewItem title="Phone / WhatsApp" value={draft.phone} />
                        <ReviewItem title="Preferred contact" value={draft.contact_preference} />
                      </dl>
                    </ReviewSection>
                    <div className="rounded-xl bg-secondary/60 p-4">
                      <label className="flex cursor-pointer items-start gap-3 text-sm">
                        <input
                          id="consent"
                          type="checkbox"
                          checked={draft.consent}
                          onChange={(e) => update("consent", e.target.checked)}
                          className="mt-1 size-4 shrink-0 accent-primary"
                          aria-invalid={Boolean(errors["consent"])}
                        />
                        <span>
                          I agree that RA2 may use these details to contact me and arrange this
                          trip. I understand this is a request and availability and pricing still
                          need to be confirmed.
                        </span>
                      </label>
                      {errors["consent"] && (
                        <p className="mt-2 text-sm text-destructive" role="alert">
                          {errors["consent"]}
                        </p>
                      )}
                    </div>
                  </>
                )}
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
                  >
                    {error}
                    <p className="mt-2">
                      Need help?{" "}
                      <a className="underline" href={CONTACT.phoneHref}>
                        Call {CONTACT.phone}
                      </a>
                      .
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                  <button
                    type="button"
                    className="booking-button-secondary"
                    onClick={() => moveTo(editing ? 4 : Math.max(step - 1, 0))}
                    disabled={sending || (step === 0 && !editing)}
                  >
                    <ArrowLeft className="size-4" />
                    {editing ? "Back to review" : "Back"}
                  </button>
                  <button type="submit" className="booking-button" disabled={sending}>
                    {sending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending request…
                      </>
                    ) : step === 4 ? (
                      <>
                        Send booking request
                        <ArrowRight className="size-4" />
                      </>
                    ) : (
                      <>
                        {editing ? "Save & review" : step === 3 ? "Review my request" : "Continue"}
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
                {step === 4 && (
                  <p className="text-center text-xs text-muted-foreground">
                    No payment needed. No account to create. Just your next adventure.
                  </p>
                )}
              </form>
            </div>
          </div>
          <aside className="order-first min-w-0 lg:order-last lg:sticky lg:top-40 lg:self-start">
            <details className="overflow-hidden rounded-xl border border-border bg-card lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Compass className="size-4 text-gold" />
                  Your trip at a glance
                </span>
                <ChevronDown className="size-4" />
              </summary>
              {summary}
            </details>
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:block">
              {summary}
            </div>
            <div className="mt-5 hidden rounded-xl border border-border p-5 lg:block">
              <p className="text-sm font-semibold">A real person, every step.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Prefer a chat? Rezah is here to help.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={CONTACT.whatsapp}
                  aria-label="WhatsApp RA2"
                  className="booking-contact-link"
                >
                  <MessageCircle className="size-4" />
                </a>
                <a href={CONTACT.phoneHref} aria-label="Call RA2" className="booking-contact-link">
                  <Phone className="size-4" />
                </a>
                <a
                  href={`mailto:${CONTACT.email}`}
                  aria-label="Email RA2"
                  className="booking-contact-link"
                >
                  <Mail className="size-4" />
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-sans text-sm font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary underline underline-offset-4"
          aria-label={`Edit ${title.toLowerCase()}`}
        >
          <Pencil className="size-3" />
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}
function ReviewItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{title}</dt>
      <dd className="mt-1 break-words text-sm">{value}</dd>
    </div>
  );
}
