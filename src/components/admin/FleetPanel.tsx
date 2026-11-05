import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Car, ImagePlus, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getSupabase } from "@/lib/supabase";
import {
  fleetRecordSchema,
  fleetSchema,
  newVehicle,
  VEHICLE_CATEGORIES,
  VEHICLE_CATEGORY_LABELS,
  type FleetFields,
  type FleetVehicle,
} from "@/lib/fleet";

export function FleetPanel({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const [editing, setEditing] = useState<FleetVehicle | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const fleet = useQuery({
    queryKey: ["admin-fleet"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("fleet_vehicles")
        .select("*")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return fleetRecordSchema.array().parse(data);
    },
  });
  async function removeOrRestore(vehicle: FleetVehicle) {
    const removing = !vehicle.archived_at;
    if (
      removing &&
      !window.confirm(
        `Remove ${vehicle.name} from the fleet? It will disappear from the website and new booking choices. Existing booking details will be kept.`,
      )
    )
      return;
    setBusy(vehicle.id);
    setError("");
    setMessage("");
    try {
      const { data, error: updateError } = await getSupabase()
        .from("fleet_vehicles")
        .update({ archived_at: removing ? new Date().toISOString() : null, is_published: false })
        .eq("id", vehicle.id)
        .eq("updated_at", vehicle.updated_at)
        .select("id")
        .maybeSingle();
      if (updateError || !data)
        throw new Error(
          "This vehicle changed or your access expired. Refresh the fleet and try again.",
        );
      setMessage(
        removing
          ? "Vehicle removed from public listings and booking choices. Its booking history is preserved."
          : "Vehicle restored as a private draft. Open it, check the details and publish when ready.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-fleet"] }),
        queryClient.invalidateQueries({ queryKey: ["public-fleet"] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the vehicle.");
    } finally {
      setBusy(null);
    }
  }
  if (editing)
    return (
      <FleetEditor
        key={editing === "new" ? "new" : editing.id}
        record={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onDirtyChange={onDirtyChange}
      />
    );
  const rows =
    fleet.data?.filter(
      (v) =>
        v.name.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "removed"
          ? Boolean(v.archived_at)
          : !v.archived_at && (filter === "active" || v.is_published === (filter === "published"))),
    ) || [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">The right ride</p>
          <h1 className="text-4xl md:text-5xl">Your fleet.</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Manage the vehicles guests see and choose in their booking request. Guest capacity
            always excludes the driver.
          </p>
        </div>
        <button type="button" className="booking-button" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          Add vehicle
        </button>
      </div>
      <div className="rounded-xl border border-gold/30 bg-gold/10 p-5 text-sm">
        <strong>Edit → check seating and luggage → upload a photo → save.</strong>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Published vehicles appear on the Fleet page and in the Choose vehicle step. Pause a
          vehicle by switching Published off. Remove it to take it out of the active fleet while
          keeping existing booking records.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="fleet-search">
          Search fleet
        </label>
        <input
          id="fleet-search"
          className="booking-input min-w-0 flex-1"
          placeholder="Search vehicle name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="sr-only" htmlFor="fleet-filter">
          Fleet visibility
        </label>
        <select
          id="fleet-filter"
          className="booking-input w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="active">All active vehicles</option>
          <option value="published">Published</option>
          <option value="draft">Draft / paused</option>
          <option value="removed">Removed</option>
        </select>
      </div>
      {message && (
        <p role="status" className="rounded-lg bg-primary/10 p-4 text-sm text-primary">
          {message}
        </p>
      )}
      {(error || fleet.error) && (
        <p role="alert" className="rounded-lg bg-destructive/5 p-4 text-sm text-destructive">
          {error || "Unable to load the fleet."}{" "}
          <button type="button" className="underline" onClick={() => void fleet.refetch()}>
            Refresh fleet
          </button>
        </p>
      )}
      {fleet.isPending ? (
        <Loader2 className="size-5 animate-spin" />
      ) : rows.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((v) => (
            <article
              key={v.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card sm:flex-row"
            >
              <div className="flex h-44 items-center justify-center bg-secondary sm:h-auto sm:w-32 sm:shrink-0">
                {v.image_url ? (
                  <img
                    src={v.image_url}
                    alt={v.image_alt || v.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Car className="size-8 text-gold" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-5">
                <p
                  className={`mb-2 text-xs font-semibold ${v.is_published ? "text-primary" : "text-muted-foreground"}`}
                >
                  {v.archived_at ? "Removed" : v.is_published ? "Published" : "Draft / paused"}
                </p>
                <h2 className="text-2xl">{v.name}</h2>
                <p className="mt-2 text-sm">{v.capacity_label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.passenger_capacity === null
                    ? "Guest capacity needs confirmation"
                    : `${v.passenger_capacity} guests maximum · driver excluded`}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {!v.archived_at && (
                    <button
                      type="button"
                      className="booking-button-secondary text-xs"
                      onClick={() => setEditing(v)}
                    >
                      Edit vehicle
                    </button>
                  )}
                  <button
                    type="button"
                    className={`inline-flex min-h-11 items-center gap-2 text-xs ${v.archived_at ? "text-primary" : "text-destructive"}`}
                    disabled={Boolean(busy)}
                    onClick={() => void removeOrRestore(v)}
                  >
                    {busy === v.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : v.archived_at ? (
                      <RotateCcw className="size-4" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    {v.archived_at ? "Restore draft" : "Remove vehicle"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
          No matching vehicles. Add a vehicle or change the filter.
        </p>
      )}
    </div>
  );
}

function FleetEditor({
  record,
  onClose,
  onDirtyChange,
}: {
  record: FleetVehicle | null;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<FleetFields>(() => record || newVehicle());
  const [saved, setSaved] = useState(record);
  const [id] = useState(() => record?.id || crypto.randomUUID());
  const [features, setFeatures] = useState(record?.features.join("\n") || "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const uploaded = useRef(new Set<string>());
  const persisted = useRef(new Set<string>());
  const mounted = useRef(true);
  const saving = useRef(false);
  const cleanUnusedPhotos = () => {
    const unused = [...uploaded.current].filter((path) => !persisted.current.has(path));
    if (unused.length) void getSupabase().storage.from("fleet-images").remove(unused);
  };
  const queryClient = useQueryClient();
  const values = {
    ...draft,
    features: features
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter(Boolean),
  };
  const comparable = (v: FleetFields) =>
    JSON.stringify(Object.keys(newVehicle()).map((key) => v[key as keyof FleetFields]));
  const dirty = comparable(values) !== comparable(saved || newVehicle());
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    onDirtyChange(dirty || busy || uploading);
  }, [dirty, busy, uploading, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  useEffect(() => {
    mounted.current = true;
    const protect = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", protect);
    return () => {
      mounted.current = false;
      window.removeEventListener("beforeunload", protect);
      if (!saving.current) cleanUnusedPhotos();
    };
  }, []);
  const update = <K extends keyof FleetFields>(key: K, value: FleetFields[K]) => {
    setDraft((old) => ({ ...old, [key]: value }));
    setError("");
    setMessage("");
  };
  const field = (
    key:
      "name" | "description" | "capacity_label" | "seating_notes" | "luggage_guide" | "image_alt",
    title: string,
    hint = "",
    area = false,
  ) => (
    <Field id={`vehicle-${key}`} title={title} hint={hint}>
      {area ? (
        <textarea
          id={`vehicle-${key}`}
          className="booking-input"
          rows={4}
          value={draft[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      ) : (
        <input
          id={`vehicle-${key}`}
          className="booking-input"
          value={draft[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      )}
    </Field>
  );
  async function upload(file: File, input: HTMLInputElement) {
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
    };
    if (!extensions[file.type] || file.size > 5242880) {
      setError("Choose a JPG, PNG, WebP or AVIF under 5 MB.");
      input.value = "";
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const path = `${id}/${crypto.randomUUID()}.${extensions[file.type]}`;
      const db = getSupabase();
      const { error: uploadError } = await db.storage
        .from("fleet-images")
        .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (uploadError)
        throw new Error("Photo upload failed. Check your connection and administrator access.");
      if (!mounted.current) {
        await db.storage.from("fleet-images").remove([path]);
        return;
      }
      uploaded.current.add(path);
      update("image_url", db.storage.from("fleet-images").getPublicUrl(path).data.publicUrl);
      setMessage("Photo uploaded. Save the vehicle to publish this change.");
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      if (mounted.current) setUploading(false);
      input.value = "";
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || uploading) return;
    setError("");
    setMessage("");
    const result = fleetSchema.safeParse(values);
    if (!result.success) {
      setError(
        result.error.issues
          .map((issue) => `${String(issue.path[0]).replaceAll("_", " ")}: ${issue.message}`)
          .join(" · "),
      );
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      const db = getSupabase();
      const query = saved
        ? db
            .from("fleet_vehicles")
            .update(result.data)
            .eq("id", id)
            .eq("updated_at", saved.updated_at)
        : db.from("fleet_vehicles").insert({ ...result.data, id });
      const { data, error: saveError } = await query.select("*").maybeSingle();
      if (saveError)
        throw new Error(
          saveError.code === "23505"
            ? "An active vehicle already has that name. Use a distinct name."
            : "Unable to save. Check your connection and administrator access.",
        );
      if (!data)
        throw new Error(
          "This vehicle changed while you were editing. Copy your changes, reopen it and try again.",
        );
      const latest = fleetRecordSchema.parse(data);
      for (const path of uploaded.current)
        if (latest.image_url.endsWith(path)) persisted.current.add(path);
      setSaved(latest);
      setDraft(latest);
      setFeatures(latest.features.join("\n"));
      setMessage(
        latest.is_published
          ? "Saved and published. Website and booking choices refresh within a minute."
          : "Draft saved. This vehicle is hidden from guests and new booking choices.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-fleet"] }),
        queryClient.invalidateQueries({ queryKey: ["public-fleet"] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
      else cleanUnusedPhotos();
    }
  }
  return (
    <div className="space-y-6">
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        disabled={busy || uploading}
        onClick={() => {
          if (!dirty || window.confirm("Discard unsaved vehicle changes?")) onClose();
        }}
      >
        <ArrowLeft className="size-4" />
        Back to fleet
      </button>
      <div>
        <p className="eyebrow mb-2">Fleet editor</p>
        <h1 className="text-3xl md:text-4xl">{saved?.name || "Add a vehicle."}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Use the guest seating shown for the actual vehicle. Do not include the driver in its guest
          capacity.
        </p>
      </div>
      <form onSubmit={save} noValidate className="space-y-6">
        <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-7">
          <h2 className="text-2xl">1. Vehicle & guest seating</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {field("name", "Vehicle name")}
            <Field id="vehicle-category" title="Vehicle type">
              <select
                id="vehicle-category"
                className="booking-input"
                value={draft.category}
                onChange={(e) => update("category", e.target.value as FleetFields["category"])}
              >
                {VEHICLE_CATEGORIES.map((v) => (
                  <option key={v} value={v}>
                    {VEHICLE_CATEGORY_LABELS[v]}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="vehicle-year" title="Model year (optional)">
              <input
                id="vehicle-year"
                type="number"
                min={1950}
                max={2100}
                className="booking-input"
                value={draft.model_year ?? ""}
                onChange={(e) =>
                  update("model_year", e.target.value ? e.target.valueAsNumber : null)
                }
              />
            </Field>
            <Field
              id="vehicle-capacity"
              title="Maximum guests — exclude the driver"
              hint="Leave blank if the guest count must be confirmed. Known capacities prevent guests choosing a vehicle too small for their group."
            >
              <input
                id="vehicle-capacity"
                type="number"
                min={1}
                max={100}
                className="booking-input"
                value={draft.passenger_capacity ?? ""}
                onChange={(e) =>
                  update("passenger_capacity", e.target.value ? e.target.valueAsNumber : null)
                }
              />
            </Field>
          </div>
          {field(
            "capacity_label",
            "Guest seating label",
            "For example: Up to 8 guests + driver. For an unconfirmed layout, clearly say that seats need confirmation.",
          )}
          {field(
            "description",
            "Short description",
            "Explain the vehicle’s comfort and intended use.",
            true,
          )}
          {field(
            "seating_notes",
            "Seating arrangement",
            "Describe the actual layout and anything that needs confirming.",
            true,
          )}
        </section>
        <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-7">
          <h2 className="text-2xl">2. Luggage & features</h2>
          {field(
            "luggage_guide",
            "Luggage guide",
            "Use confirmed guidance. Mention reduced space at full occupancy and trailer arrangements where applicable.",
            true,
          )}
          <Field
            id="vehicle-features"
            title="Features / suitable uses"
            hint="One point per line, for example Airport transfers or Individual captain seats."
          >
            <textarea
              id="vehicle-features"
              rows={4}
              className="booking-input"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
            />
          </Field>
        </section>
        <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-7">
          <h2 className="text-2xl">3. Fleet photo</h2>
          {draft.image_url && (
            <img
              src={draft.image_url}
              alt={draft.image_alt || "Vehicle photo preview"}
              className="max-h-96 w-full rounded-lg bg-secondary object-contain"
            />
          )}
          <Field
            id="vehicle-photo"
            title="Upload a vehicle or seating image"
            hint="JPG, PNG, WebP or AVIF, up to 5 MB. Existing booking snapshots keep their original image."
          >
            <input
              id="vehicle-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="booking-input"
              disabled={uploading || busy}
              onChange={(e) => {
                const input = e.currentTarget;
                const file = input.files?.[0];
                if (file) void upload(file, input);
              }}
            />
            {uploading && (
              <p className="mt-2 flex gap-2 text-xs text-primary">
                <ImagePlus className="size-4" />
                Uploading…
              </p>
            )}
          </Field>
          {field(
            "image_alt",
            "Photo description",
            "A short description for guests using screen readers.",
          )}
        </section>
        <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-7">
          <h2 className="text-2xl">4. Visibility & order</h2>
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="vehicle-published" className="cursor-pointer">
              <span className="block text-sm font-semibold">
                Published — visible and selectable
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Switch off to pause the vehicle. Save to apply your choice.
              </span>
            </label>
            <Switch
              id="vehicle-published"
              checked={draft.is_published}
              onCheckedChange={(v) => update("is_published", v)}
            />
          </div>
          <Field id="vehicle-order" title="Display order" hint="Lower numbers appear first.">
            <input
              id="vehicle-order"
              type="number"
              min={0}
              max={9999}
              className="booking-input max-w-40"
              value={draft.sort_order}
              onChange={(e) => update("sort_order", e.target.valueAsNumber)}
            />
          </Field>
        </section>
        {message && (
          <p role="status" className="rounded-lg bg-primary/10 p-4 text-sm text-primary">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-lg">
          <p className="text-xs text-muted-foreground">
            {dirty
              ? "Unsaved changes"
              : saved
                ? "All changes saved"
                : "Private draft until published"}
          </p>
          <button
            type="submit"
            className="booking-button"
            disabled={busy || uploading || (!dirty && Boolean(saved))}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {draft.is_published ? "Save & publish" : "Save draft"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {title}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}
