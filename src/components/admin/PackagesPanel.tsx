import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FilePenLine, Loader2, Plus, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getSupabase } from "@/lib/supabase";
import {
  packageImage,
  packageRecordSchema,
  PACKAGE_TYPE_LABELS,
  type TravelPackage,
} from "@/lib/packages";
import { PackageEditor } from "./PackageEditor";

export function PackagesPanel({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const [editing, setEditing] = useState<TravelPackage | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const packages = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("packages")
        .select("*")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return packageRecordSchema.array().parse(data);
    },
    refetchOnWindowFocus: true,
  });
  if (editing)
    return (
      <PackageEditor
        key={editing === "new" ? "new" : editing.id}
        record={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onDirtyChange={onDirtyChange}
      />
    );
  const filtered =
    packages.data?.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        (visibility === "all" || p.is_published === (visibility === "published")),
    ) || [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Your experience collection</p>
          <h1 className="text-4xl md:text-5xl">Packages, made personal.</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Edit the experiences guests see on your website and choose when they’re ready to
            publish.
          </p>
        </div>
        <button type="button" className="booking-button" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          Add package
        </button>
      </div>
      <div className="grid gap-4 rounded-xl border border-gold/30 bg-gold/10 p-5 sm:grid-cols-3">
        {[
          ["01", "Choose a package", "Open an existing experience, or start a new draft."],
          [
            "02",
            "Make your changes",
            "Use the labelled fields for text, photos, stops, inclusions and FAQs.",
          ],
          [
            "03",
            "Preview, then save",
            "Published packages update the website. Drafts stay private.",
          ],
        ].map(([n, title, text]) => (
          <div key={n} className="flex gap-3">
            <span className="mt-0.5 text-xs font-semibold text-gold">{n}</span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="package-search" className="sr-only">
            Search packages
          </label>
          <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <input
            id="package-search"
            className="booking-input pl-10"
            placeholder="Find a package by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="package-visibility" className="sr-only">
            Package visibility
          </label>
          <select
            id="package-visibility"
            className="booking-input"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="all">All packages</option>
            <option value="published">Published</option>
            <option value="draft">Draft / paused</option>
          </select>
        </div>
      </div>
      {packages.isPending ? (
        <p className="flex gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading your packages…
        </p>
      ) : packages.error ? (
        <p role="alert" className="rounded-lg bg-destructive/5 p-5 text-sm text-destructive">
          Unable to load packages.{" "}
          <button className="underline" onClick={() => void packages.refetch()}>
            Try again
          </button>
        </p>
      ) : filtered.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card sm:flex-row"
            >
              <img
                src={packageImage(p)}
                alt=""
                loading="lazy"
                className="h-40 w-full object-cover sm:h-auto sm:w-32"
              />
              <div className="min-w-0 flex-1 p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${p.is_published ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}
                  >
                    {p.is_published ? "Published" : "Draft / paused"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {PACKAGE_TYPE_LABELS[p.package_type]}
                  </span>
                </div>
                <h2 className="text-2xl">{p.name}</h2>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {p.summary || "Add a short summary before publishing."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-primary"
                  >
                    <FilePenLine className="size-4" />
                    Edit package
                  </button>
                  {p.is_published && (
                    <Link
                      to="/tours/$slug"
                      params={{ slug: p.slug }}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center gap-1 text-xs text-muted-foreground"
                    >
                      View on website
                      <ArrowUpRight className="size-3" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <h2 className="text-3xl">No matching packages.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Try another search or add a new package.
          </p>
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Every published package is available in the booking form. Pause one by switching off
        “Published” in its editor and saving. Previous bookings and their recorded package details
        are kept.
      </p>
    </div>
  );
}
