import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { PackagePage } from "@/components/site/PackagePage";
import { getSupabase } from "@/lib/supabase";
import {
  IMAGE_KEYS,
  newPackage,
  PACKAGE_CATEGORIES,
  PACKAGE_TYPES,
  PACKAGE_TYPE_LABELS,
  packageImage,
  packageSchema,
  slugify,
  type PackageFields,
  type TravelPackage,
} from "@/lib/packages";

const LIST_KEYS = ["highlights", "included", "excluded", "customisation_options"] as const;
type ListKey = (typeof LIST_KEYS)[number];
const listText = (value: PackageFields) =>
  Object.fromEntries(LIST_KEYS.map((key) => [key, value[key].join("\n")])) as Record<
    ListKey,
    string
  >;
const parseLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export function PackageEditor({
  record,
  onClose,
  onDirtyChange,
}: {
  record: TravelPackage | null;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<PackageFields>(() => record || newPackage());
  const [saved, setSaved] = useState(record);
  const [id] = useState(() => record?.id || crypto.randomUUID());
  const [lists, setLists] = useState(() => listText(record || newPackage()));
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const uploaded = useRef(new Set<string>());
  const persistedUploads = useRef(new Set<string>());
  const mounted = useRef(true);
  const saving = useRef(false);
  const cleanUnusedPhotos = () => {
    const unused = [...uploaded.current].filter((path) => !persistedUploads.current.has(path));
    if (unused.length) void getSupabase().storage.from("package-images").remove(unused);
  };
  const values = {
    ...draft,
    ...Object.fromEntries(LIST_KEYS.map((key) => [key, parseLines(lists[key])])),
  } as PackageFields;
  const comparable = (value: PackageFields) =>
    JSON.stringify(Object.keys(newPackage()).map((key) => value[key as keyof PackageFields]));
  const dirty = comparable(values) !== comparable(saved || newPackage());
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const queryClient = useQueryClient();
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
  const update = <K extends keyof PackageFields>(key: K, value: PackageFields[K]) => {
    setDraft((old) => ({
      ...old,
      [key]: value,
      ...(key === "name" && !saved && !slugEdited ? { slug: slugify(String(value)) } : {}),
    }));
    setErrors((old) => {
      const next = { ...old };
      delete next[key];
      return next;
    });
    setError("");
    setMessage("");
  };
  const close = () => {
    if (!dirty || window.confirm("Leave this package without saving your changes?")) onClose();
  };
  const field = (
    key: keyof PackageFields,
    label: string,
    options: { area?: boolean; hint?: string; rows?: number } = {},
  ) => (
    <EditorField id={`package-${key}`} title={label} hint={options.hint} error={errors[key]}>
      {options.area ? (
        <textarea
          id={`package-${key}`}
          className="booking-input"
          rows={options.rows || 4}
          value={String(draft[key])}
          onChange={(e) => update(key, e.target.value as never)}
        />
      ) : (
        <input
          id={`package-${key}`}
          className="booking-input"
          value={String(draft[key])}
          onChange={(e) => update(key, e.target.value as never)}
        />
      )}
    </EditorField>
  );
  const listField = (key: ListKey, title: string) => (
    <EditorField
      id={`package-${key}`}
      title={title}
      hint="One item per line. Guests see each line as a separate point."
      error={errors[key]}
    >
      <textarea
        id={`package-${key}`}
        className="booking-input"
        rows={6}
        value={lists[key]}
        onChange={(e) => {
          setLists((old) => ({ ...old, [key]: e.target.value }));
          setMessage("");
        }}
      />
    </EditorField>
  );

  async function upload(file: File, input: HTMLInputElement) {
    setError("");
    setMessage("");
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
    };
    if (!extensions[file.type] || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG, WebP or AVIF photo smaller than 5 MB.");
      input.value = "";
      return;
    }
    setUploading(true);
    try {
      const path = `${id}/${crypto.randomUUID()}.${extensions[file.type]}`;
      const db = getSupabase();
      const { error: uploadError } = await db.storage
        .from("package-images")
        .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (uploadError)
        throw new Error(
          "The photo could not be uploaded. Check your connection and admin access, then try again.",
        );
      if (!mounted.current) {
        await db.storage.from("package-images").remove([path]);
        return;
      }
      uploaded.current.add(path);
      update("image_url", db.storage.from("package-images").getPublicUrl(path).data.publicUrl);
      setMessage("Photo uploaded. Save the package to use it on the website.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || uploading) return;
    setError("");
    setMessage("");
    const result = packageSchema.safeParse(values);
    if (!result.success) {
      const issues = Object.fromEntries(
        result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      );
      setErrors(issues);
      setError("Please check the highlighted sections before saving.");
      const target = document.getElementById(`package-${result.error.issues[0]!.path[0]}`);
      let parent: HTMLElement | null = target;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus();
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      const db = getSupabase();
      const { slug: _slug, ...editable } = result.data;
      const query = saved
        ? db.from("packages").update(editable).eq("id", id).eq("updated_at", saved.updated_at)
        : db.from("packages").insert({ ...result.data, id });
      const { data, error: saveError } = await query.select("*").maybeSingle();
      if (saveError)
        throw new Error(
          saveError.code === "23505"
            ? "That name or website address is already in use. Choose a different one."
            : "Unable to save this package. Check your connection and admin access, then try again.",
        );
      if (!data)
        throw new Error(
          "Someone changed this package while you were editing. Copy your changes, reopen the package and try again.",
        );
      const latest = data as TravelPackage;
      for (const path of uploaded.current)
        if (latest.image_url.endsWith(path)) persistedUploads.current.add(path);
      setSaved(latest);
      setDraft(latest);
      setLists(listText(latest));
      setErrors({});
      setMessage(
        latest.is_published
          ? "Saved and published. Your website and booking form will use these changes; open pages refresh within a minute."
          : "Draft saved. This package is hidden from guests and new booking requests.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
        queryClient.invalidateQueries({ queryKey: ["public-packages"] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
      else cleanUnusedPhotos();
    }
  }

  const previewPackage: TravelPackage = {
    ...values,
    id,
    created_at: saved?.created_at || new Date().toISOString(),
    updated_at: saved?.updated_at || new Date().toISOString(),
  };
  return (
    <div className="min-w-0 space-y-6">
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        onClick={close}
      >
        <ArrowLeft className="size-4" />
        Back to packages
      </button>
      <div>
        <p className="eyebrow mb-2">{saved ? "Edit your experience" : "Create an experience"}</p>
        <h1 className="break-words text-3xl md:text-4xl">
          {saved?.name || "A new journey starts here."}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Work through the sections below. Preview your changes, then save. No coding or formatting
          tags are needed.
        </p>
      </div>
      <form onSubmit={save} noValidate className="space-y-4">
        <EditorSection
          title="1. Name & essentials"
          description="These details appear on package cards, the page and the booking form."
          open
        >
          <div className="grid gap-5 md:grid-cols-2">
            {field("name", "Package name")}
            {field("subtitle", "Subtitle (optional)")}
            <EditorField
              id="package-package_type"
              title="Experience type"
              hint="For transfers and chauffeur services, choose the booking service below."
            >
              <select
                id="package-package_type"
                className="booking-input"
                value={draft.package_type}
                onChange={(e) => {
                  update("package_type", e.target.value as PackageFields["package_type"]);
                  if (e.target.value !== "transfer") update("transport_service", "transfer");
                }}
              >
                {PACKAGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PACKAGE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </EditorField>
            {draft.package_type === "transfer" && (
              <EditorField
                id="package-transport-service"
                title="Booking service"
                hint="Transfers request a destination. Chauffeur bookings request duration, planned stops and multi-day dates."
              >
                <select
                  id="package-transport-service"
                  className="booking-input"
                  value={draft.transport_service}
                  onChange={(e) =>
                    update("transport_service", e.target.value as "transfer" | "chauffeur")
                  }
                >
                  <option value="transfer">Point-to-point transfer</option>
                  <option value="chauffeur">Private chauffeur service</option>
                </select>
              </EditorField>
            )}
            <EditorField
              id="package-slug"
              title="Website address"
              hint={
                saved
                  ? "The address stays the same when you rename a package, keeping existing links working."
                  : "Created from the name. Use lowercase words and hyphens."
              }
              error={errors["slug"]}
            >
              <div className="mb-1 text-[11px] text-muted-foreground">
                ra2travelandtours.co.za/tours/
              </div>
              <input
                id="package-slug"
                className="booking-input"
                value={draft.slug}
                disabled={Boolean(saved)}
                onChange={(e) => {
                  setSlugEdited(true);
                  update("slug", e.target.value);
                }}
              />
            </EditorField>
            {field("location", "Location / pickup area")}
            {field("duration", "Duration", { hint: "For example: Approximately 8–9 hours" })}
            {field("badge", "Short label", { hint: "For example: Private guided day tour" })}
            {field("tagline", "Opening tagline", { hint: "A short line under the page title." })}
          </div>
          {field("summary", "Short summary", {
            area: true,
            rows: 3,
            hint: "Used on website cards and when guests choose their experience. Maximum 500 characters.",
          })}
        </EditorSection>
        <EditorSection
          title="2. Package photo"
          description="Choose an existing image or upload your own landscape photo."
        >
          <img
            src={packageImage(draft)}
            alt={draft.image_alt || "Package photo preview"}
            className="aspect-[16/7] w-full rounded-lg object-cover"
          />
          <div className="grid gap-5 md:grid-cols-2">
            <EditorField id="package-image_key" title="Existing photo">
              <select
                id="package-image_key"
                className="booking-input"
                value={draft.image_key}
                onChange={(e) => {
                  update("image_key", e.target.value as PackageFields["image_key"]);
                  update("image_url", "");
                }}
              >
                {IMAGE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {
                      {
                        peninsula: "Cape Peninsula coast",
                        winelands: "Cape Winelands",
                        safari: "Safari wildlife",
                        hero: "Cape coastline",
                      }[key]
                    }
                  </option>
                ))}
              </select>
              {draft.image_url && (
                <button
                  type="button"
                  className="mt-2 text-xs text-primary underline"
                  onClick={() => update("image_url", "")}
                >
                  Use existing photo instead
                </button>
              )}
            </EditorField>
            <EditorField
              id="package-photo"
              title="Upload a photo"
              hint="JPG, PNG, WebP or AVIF, up to 5 MB. Save after uploading."
            >
              <label
                htmlFor="package-photo"
                className="booking-button-secondary w-full cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                {uploading ? "Uploading…" : "Choose a photo"}
              </label>
              <input
                id="package-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                disabled={uploading || busy}
                onChange={(e) => {
                  const input = e.currentTarget;
                  const file = input.files?.[0];
                  if (file) void upload(file, input);
                }}
              />
            </EditorField>
          </div>
          {field("image_alt", "Describe the photo", {
            hint: "A short description for guests using screen readers.",
          })}
        </EditorSection>
        <EditorSection
          title="3. Introduction & at-a-glance details"
          description="Write naturally. Leave a blank line between paragraphs."
        >
          {field("description", "Opening introduction", { area: true, rows: 6 })}
          {field("overview_title", "Overview heading (optional)")}
          {field("overview_text", "Overview text (optional)", { area: true, rows: 5 })}
          <Repeater
            title="At-a-glance rows"
            entries={draft.facts}
            fields={[
              { key: "label", title: "Detail", placeholder: "Entrance fees" },
              {
                key: "value",
                title: "What to expect",
                placeholder: "Cape Point and Boulders admission included",
                area: true,
              },
            ]}
            onChange={(value) => update("facts", value)}
            blank={{ label: "", value: "" }}
            max={20}
            error={errors["facts"]}
            id="package-facts"
          />
        </EditorSection>
        <EditorSection
          title="4. Highlights & itinerary"
          description="Add, remove or reorder stops with the arrow buttons."
        >
          {listField("highlights", "Tour highlights")}
          <Repeater
            title="Itinerary stops"
            entries={draft.itinerary}
            fields={[
              {
                key: "title",
                title: "Stop title",
                placeholder: "Cape Point & the Cape of Good Hope",
              },
              { key: "label", title: "Small label (optional)", placeholder: "Morning / Stop 1" },
              { key: "body", title: "What happens at this stop?", area: true },
            ]}
            onChange={(value) => update("itinerary", value)}
            blank={{ title: "", label: "", body: "" }}
            max={30}
            error={errors["itinerary"]}
            id="package-itinerary"
          />
          {field("itinerary_note", "Itinerary note (optional)", {
            area: true,
            rows: 3,
            hint: "For example: Stops may change according to weather and road access.",
          })}
        </EditorSection>
        <EditorSection
          title="5. What’s included & excluded"
          description="Be specific about entrance fees, meals, transport and optional extras."
        >
          <div className="grid gap-5 xl:grid-cols-2">
            {listField("included", "Included in the standard package")}
            {listField("excluded", "For the guest’s own account / optional extras")}
          </div>
        </EditorSection>
        <EditorSection
          title="6. Customisation & booking information"
          description="Explain upgrades, practical details and the terms supplied with a quotation."
        >
          {field("customisation_intro", "Make the day your own — introduction", { area: true })}
          {listField("customisation_options", "Customisation options")}
          {field("before_you_go", "Before you travel", {
            area: true,
            rows: 6,
            hint: "What to bring, mobility considerations, child seats or identification.",
          })}
          {field("booking_terms", "Booking information / terms", {
            area: true,
            rows: 6,
            hint: "Explain deposits, quotation validity and payment timing. This website takes requests, not online payments.",
          })}
        </EditorSection>
        <EditorSection
          title="7. Frequently asked questions"
          description="Each question appears as an expandable answer on the package page."
        >
          <Repeater
            title="Questions & answers"
            entries={draft.faqs}
            fields={[
              { key: "question", title: "Question" },
              { key: "answer", title: "Answer", area: true },
            ]}
            onChange={(value) => update("faqs", value)}
            blank={{ question: "", answer: "" }}
            max={30}
            error={errors["faqs"]}
            id="package-faqs"
          />
        </EditorSection>
        <EditorSection
          title="8. Closing invitation & search engines"
          description="Optional wording for the bottom of the page and its search listing."
        >
          {field("cta_title", "Closing heading")}
          {field("cta_text", "Closing text", { area: true })}
          {field("cta_label", "Quote button wording", {
            hint: "The button automatically selects this package in the booking form.",
          })}
          {field("seo_title", "Search engine title (optional)", {
            hint: "Leave blank to use the package name.",
          })}
          {field("seo_description", "Search engine description (optional)", {
            area: true,
            rows: 3,
            hint: "Leave blank to use the short summary.",
          })}
        </EditorSection>
        <EditorSection
          title="9. Visibility & website placement"
          description="Choose where it appears, then save to apply your choices."
          open
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Toggle
              label="Published — guests can view and request it"
              description="Switch off to pause new enquiries. Existing bookings stay in your dashboard."
              checked={draft.is_published}
              onChange={(value) => update("is_published", value)}
            />
            <Toggle
              label="Feature on the home page"
              description="Show this package among your signature experiences."
              checked={draft.featured}
              onChange={(value) => update("featured", value)}
            />
            <Toggle
              label="Show in Private Tours"
              description="Include this package in the tour catalogue."
              checked={draft.show_in_tours}
              onChange={(value) => update("show_in_tours", value)}
            />
            <Toggle
              label="Show on its category page"
              description="Show safaris, journeys, transfers or chauffeurs on their matching website section."
              checked={draft.show_on_category_page}
              onChange={(value) => update("show_on_category_page", value)}
            />
          </div>
          <EditorField
            id="package-sort_order"
            title="Display order"
            hint="Lower numbers appear first. Packages with the same number are sorted by name."
            error={errors["sort_order"]}
          >
            <input
              id="package-sort_order"
              type="number"
              min={0}
              max={9999}
              className="booking-input max-w-40"
              value={Number.isNaN(draft.sort_order) ? "" : draft.sort_order}
              onChange={(e) => update("sort_order", e.target.valueAsNumber)}
            />
          </EditorField>
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">Tour filters</legend>
            <div className="flex flex-wrap gap-4">
              {PACKAGE_CATEGORIES.map((category) => (
                <label key={category} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={draft.categories.includes(category)}
                    onChange={(e) =>
                      update(
                        "categories",
                        e.target.checked
                          ? [...draft.categories, category]
                          : draft.categories.filter((value) => value !== category),
                      )
                    }
                  />
                  {category}
                </label>
              ))}
            </div>
          </fieldset>
        </EditorSection>
        {message && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl bg-primary/10 p-4 text-sm text-primary"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            {message}
          </p>
        )}
        {error && (
          <div role="alert" className="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
            <p>{error}</p>
            {Object.keys(errors).length > 0 && (
              <ul className="mt-2 list-inside list-disc">
                {Object.entries(errors).map(([key, value]) => (
                  <li key={key}>
                    {key.replaceAll("_", " ")}: {value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
          <span className="text-xs text-muted-foreground">
            {dirty
              ? "You have unsaved changes"
              : saved
                ? "All changes saved"
                : "New package · private until published"}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="booking-button-secondary"
              onClick={() => setPreview(true)}
              disabled={busy || uploading}
            >
              <Eye className="size-4" />
              Preview
            </button>
            <button
              type="submit"
              className="booking-button"
              disabled={busy || uploading || (!dirty && Boolean(saved))}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {draft.is_published
                ? saved?.is_published
                  ? "Save changes"
                  : "Publish package"
                : saved?.is_published
                  ? "Save & unpublish"
                  : "Save draft"}
            </button>
          </div>
        </div>
      </form>
      <Sheet open={preview} onOpenChange={setPreview}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-6xl">
          <div className="sticky top-0 z-20 border-b border-border bg-card p-4 pr-12">
            <SheetTitle className="font-sans text-sm">Package preview</SheetTitle>
            <SheetDescription className="mt-1 text-xs">
              This shows your unsaved changes. Close the preview and save to apply them.
            </SheetDescription>
          </div>
          <div
            onClickCapture={(event) => {
              if ((event.target as Element).closest("a")) event.preventDefault();
            }}
          >
            <PackagePage pkg={previewPackage} preview />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EditorField({
  id,
  title,
  hint,
  error,
  children,
}: {
  id: string;
  title: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {title}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
function EditorSection({
  title,
  description,
  children,
  open = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="group rounded-xl border border-border bg-card" open={open}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5 sm:p-6">
        <span>
          <span className="block text-lg font-semibold">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        </span>
        <ChevronDown className="mt-1 size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-border p-5 sm:p-6">{children}</div>
    </details>
  );
}
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = `toggle-${slugify(label)}`;
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

type StringRecord = Record<string, string>;
function Repeater<T extends StringRecord>({
  title,
  entries,
  fields,
  onChange,
  blank,
  max,
  error,
  id,
}: {
  title: string;
  entries: T[];
  fields: { key: keyof T & string; title: string; placeholder?: string; area?: boolean }[];
  onChange: (entries: T[]) => void;
  blank: T;
  max: number;
  error?: string | undefined;
  id: string;
}) {
  const move = (index: number, offset: number) => {
    const next = [...entries];
    [next[index], next[index + offset]] = [next[index + offset]!, next[index]!];
    onChange(next);
  };
  return (
    <div id={id} tabIndex={-1} className="space-y-4 outline-none">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-sans text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {entries.length}/{max}
        </span>
      </div>
      {entries.map((entry, i) => (
        <div key={i} className="space-y-4 rounded-lg border border-border bg-secondary/25 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary">#{i + 1}</p>
            <div className="flex gap-1">
              <button
                type="button"
                className="booking-contact-link min-h-9 min-w-9 p-2"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Move item ${i + 1} up`}
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                className="booking-contact-link min-h-9 min-w-9 p-2"
                disabled={i === entries.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move item ${i + 1} down`}
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button
                type="button"
                className="booking-contact-link min-h-9 min-w-9 p-2 text-destructive"
                onClick={() => onChange(entries.filter((_value, index) => index !== i))}
                aria-label={`Remove item ${i + 1}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
          {fields.map((field) => (
            <EditorField key={field.key} id={`${id}-${i}-${field.key}`} title={field.title}>
              {field.area ? (
                <textarea
                  id={`${id}-${i}-${field.key}`}
                  className="booking-input"
                  rows={4}
                  placeholder={field.placeholder}
                  value={entry[field.key]}
                  onChange={(e) =>
                    onChange(
                      entries.map((value, index) =>
                        index === i ? { ...value, [field.key]: e.target.value } : value,
                      ),
                    )
                  }
                />
              ) : (
                <input
                  id={`${id}-${i}-${field.key}`}
                  className="booking-input"
                  placeholder={field.placeholder}
                  value={entry[field.key]}
                  onChange={(e) =>
                    onChange(
                      entries.map((value, index) =>
                        index === i ? { ...value, [field.key]: e.target.value } : value,
                      ),
                    )
                  }
                />
              )}
            </EditorField>
          ))}
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        className="booking-button-secondary text-xs"
        disabled={entries.length >= max}
        onClick={() => onChange([...entries, { ...blank }])}
      >
        <Plus className="size-4" />
        Add{" "}
        {title === "Itinerary stops"
          ? "stop"
          : title === "Questions & answers"
            ? "question"
            : "row"}
      </button>
    </div>
  );
}
