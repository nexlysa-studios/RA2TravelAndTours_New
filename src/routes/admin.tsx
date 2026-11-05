import { createFileRoute, Link } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  PackageOpen,
  Car,
} from "lucide-react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { BookingDetails } from "@/components/admin/BookingDetails";
import { TeamPanel, AccountSettings } from "@/components/admin/TeamPanel";
import { PackagesPanel } from "@/components/admin/PackagesPanel";
import { FleetPanel } from "@/components/admin/FleetPanel";
import { useAdminSession } from "@/hooks/use-admin-session";
import {
  BOOKING_STATUSES,
  STATUS_LABELS,
  formatTravelDate,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";
import { functionError, getSupabase } from "@/lib/supabase";
import ra2Logo from "@/assets/Ra2logo.png";

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): { booking?: string | undefined } => ({
    booking:
      typeof s["booking"] === "string" && /^[a-f\d-]{36}$/i.test(s["booking"])
        ? s["booking"]
        : undefined,
  }),
  head: () => ({
    meta: [{ title: "RA2 | Booking Management" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: Admin,
});

const PAGE_SIZE = 12;
const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "border-amber-200 bg-amber-50 text-amber-900",
  contacted: "border-sky-200 bg-sky-50 text-sky-800",
  quoted: "border-purple-200 bg-purple-50 text-purple-800",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  completed: "border-border bg-secondary text-primary",
  cancelled: "border-red-200 bg-red-50 text-red-800",
};

function Admin() {
  const { session, initializing, isAdmin, accessError, retryAccess } = useAdminSession();
  if (initializing)
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Opening your workspace…
      </div>
    );
  if (!session) return <AdminLogin />;
  if (accessError)
    return (
      <div className="mx-auto max-w-lg px-6 py-24">
        <h1 className="text-3xl">Unable to check your access.</h1>
        <p className="my-5 text-muted-foreground">Check your connection and try again.</p>
        <button className="booking-button" onClick={() => void retryAccess()}>
          Try again
        </button>
      </div>
    );
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <ShieldCheck className="mb-5 size-8 text-gold" />
        <h1 className="text-4xl">Your account is ready.</h1>
        <p className="my-5 text-muted-foreground">
          You’re signed in as {session.user.email}. An administrator needs to enable Admin access
          for your account before you can manage bookings.
        </p>
        <AccountSettings />
        <div className="mt-6 flex gap-3">
          <button className="booking-button-secondary" onClick={() => void retryAccess()}>
            Check access
          </button>
          <button className="booking-button" onClick={() => void getSupabase().auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  return <Dashboard userId={session.user.id} email={session.user.email || ""} />;
}

function Dashboard({ userId, email }: { userId: string; email: string }) {
  const { booking: linkedBooking } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"bookings" | "packages" | "fleet" | "team">("bookings");
  const [packageDirty, setPackageDirty] = useState(false);
  const [search, setSearch] = useState("");
  const searchValue = useDeferredValue(search);
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(linkedBooking || null);
  const [signOutError, setSignOutError] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [retrying, setRetrying] = useState(false);
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc("booking_dashboard_stats");
      if (error) throw error;
      return data as { total: number; new: number; upcoming: number; confirmed: number };
    },
    refetchInterval: 30000,
  });
  const config = useQuery({
    queryKey: ["admin-email-config"],
    queryFn: async () => {
      const { data, error } = await getSupabase().functions.invoke("booking-emails", {
        body: { mode: "status" },
      });
      if (error) throw error;
      return data as {
        ready: boolean;
        sender: string;
        admin_recipient: string;
        resend_configured: boolean;
      };
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
  const bookings = useQuery({
    queryKey: ["admin-bookings", "list", searchValue, status, date, page],
    enabled: tab === "bookings",
    queryFn: async () => {
      let query = getSupabase()
        .from("bookings")
        .select("*,booking_emails(id,audience,status,attempts,last_error,sent_at,provider_id)", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (status !== "all") query = query.eq("status", status);
      if (date) query = query.eq("travel_date", date);
      const cleanSearch = searchValue
        .replace(/[,()%"'\\]/g, " ")
        .trim()
        .slice(0, 100);
      if (cleanSearch)
        query = query.or(
          `full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%,reference.ilike.%${cleanSearch}%`,
        );
      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: data as Booking[], count: count || 0 };
    },
    refetchInterval: 30000,
  });
  const selected = useQuery({
    queryKey: ["admin-bookings", "detail", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("bookings")
        .select("*,booking_emails(id,audience,status,attempts,last_error,sent_at,provider_id)")
        .eq("id", selectedId!)
        .maybeSingle();
      if (error) throw error;
      return data as Booking | null;
    },
    refetchInterval: 15000,
  });
  useEffect(() => {
    const db = getSupabase();
    const channel = db
      .channel("admin-booking-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
        void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_emails" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-team"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-team"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "packages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
        void queryClient.invalidateQueries({ queryKey: ["public-packages"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "fleet_vehicles" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-fleet"] });
        void queryClient.invalidateQueries({ queryKey: ["public-fleet"] });
      })
      .subscribe();
    return () => {
      void db.removeChannel(channel);
    };
  }, [queryClient]);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-email-config"] });
  };
  async function signOut() {
    if (
      (tab === "packages" || tab === "fleet") &&
      packageDirty &&
      !window.confirm("Sign out without saving your changes?")
    )
      return;
    const { error } = await getSupabase().auth.signOut();
    if (error) setSignOutError("Unable to sign out. Please try again.");
  }
  async function processQueue() {
    setRetrying(true);
    setEmailMessage("");
    try {
      const { data, error } = await getSupabase().functions.invoke("booking-emails", {
        body: { mode: "send" },
      });
      if (error)
        throw new Error(await functionError(error, "Unable to process the queue right now."));
      setEmailMessage(
        data.ready
          ? `${data.sent} email(s) sent. ${data.failed ? "Some attempts failed; automatic retries remain scheduled." : "Pending emails will continue automatically."}`
          : "Email delivery is waiting for a Resend API key in Supabase secrets.",
      );
      refresh();
    } catch (err) {
      setEmailMessage(err instanceof Error ? err.message : "Unable to process the queue.");
    } finally {
      setRetrying(false);
    }
  }
  const nav = (
    <>
      {(
        [
          ["bookings", ClipboardList, "Bookings"],
          ["packages", PackageOpen, "Packages"],
          ["fleet", Car, "Fleet"],
          ["team", Users, "Team & account"],
        ] as const
      ).map(([key, Icon, title]) => (
        <button
          key={key}
          className={`flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${tab === key ? "bg-ivory/10 text-gold" : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory"}`}
          onClick={() => {
            if (
              (tab === "packages" || tab === "fleet") &&
              packageDirty &&
              key !== tab &&
              !window.confirm("Leave without saving your changes?")
            )
              return;
            setTab(key);
          }}
        >
          <Icon className="size-4" />
          {title}
          {key === "bookings" && Boolean(stats.data?.new) && (
            <span className="ml-auto rounded bg-gold px-1.5 text-xs font-semibold text-forest-deep">
              {stats.data?.new}
            </span>
          )}
        </button>
      ))}
    </>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden bg-forest-deep lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link to="/" className="px-7 pb-4 pt-5">
          <img src={ra2Logo} alt="RA2 Travel and Tours home" className="size-28 object-contain" />
        </Link>
        <p className="px-7 pb-4 text-[10px] uppercase tracking-[0.22em] text-gold">
          The journey desk
        </p>
        <nav className="grid gap-2 px-4" aria-label="Admin navigation">
          {nav}
        </nav>
        <div className="mt-auto space-y-4 border-t border-ivory/10 p-6">
          <Link to="/" className="flex items-center gap-2 text-xs text-ivory/70">
            <ExternalLink className="size-3.5" />
            View website
          </Link>
          <p className="break-all text-xs text-ivory/50">{email}</p>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-2 text-xs text-ivory/80"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-border bg-card px-5 py-4 md:px-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" />
              RA2 workspace<span className="mx-2 text-border">/</span>
              <span className="font-medium text-foreground">
                {tab === "bookings"
                  ? "Bookings"
                  : tab === "packages"
                    ? "Packages"
                    : tab === "fleet"
                      ? "Fleet"
                      : "Team & account"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground sm:block">
                {new Date().toLocaleDateString("en-ZA", {
                  timeZone: "Africa/Johannesburg",
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                })}
              </span>
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-ivory">
                RA
              </div>
              <button
                onClick={() => void signOut()}
                aria-label="Sign out"
                className="p-2 lg:hidden"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
          <nav
            aria-label="Mobile admin navigation"
            className="-mx-5 mt-4 flex gap-2 overflow-x-auto bg-forest px-2 py-2 lg:hidden"
          >
            {nav}
          </nav>
        </header>
        <div className="mx-auto max-w-[100rem] px-4 py-7 sm:px-6 md:p-9 xl:p-12">
          {signOutError && (
            <p role="alert" className="mb-5 text-sm text-destructive">
              {signOutError}
            </p>
          )}
          {tab === "team" ? (
            <TeamPanel currentUserId={userId} />
          ) : tab === "packages" ? (
            <PackagesPanel onDirtyChange={setPackageDirty} />
          ) : tab === "fleet" ? (
            <FleetPanel onDirtyChange={setPackageDirty} />
          ) : (
            <>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow mb-2">Good journeys start here</p>
                  <h1 className="text-4xl md:text-5xl">Your booking desk.</h1>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Every enquiry, every detail. Give your guests a great start.
                  </p>
                </div>
                <button
                  className="booking-button-secondary"
                  onClick={refresh}
                  disabled={bookings.isFetching}
                >
                  <RefreshCw className={`size-4 ${bookings.isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
              <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {(
                  [
                    [
                      "Total requests",
                      stats.data?.total,
                      ClipboardList,
                      "All your guest enquiries",
                    ],
                    ["Needs a reply", stats.data?.new, Inbox, "New requests to follow up"],
                    [
                      "Upcoming journeys",
                      stats.data?.upcoming,
                      CalendarDays,
                      "Dated requests ahead",
                    ],
                    ["Confirmed", stats.data?.confirmed, CheckCircle2, "Ready for the road"],
                  ] as const
                ).map(([title, value, Icon, subtitle]) => (
                  <div key={title} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">{title}</p>
                      <Icon className="size-4 text-gold" />
                    </div>
                    <p className="my-2 text-3xl font-semibold text-primary">{value ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                  </div>
                ))}
              </div>
              {(stats.error || config.error) && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
                >
                  {stats.error
                    ? "Booking totals could not be loaded."
                    : "Email configuration could not be checked."}{" "}
                  <button className="underline" onClick={refresh}>
                    Try again
                  </button>
                </div>
              )}
              {config.data && !config.data.ready && (
                <div className="mb-7 flex flex-col items-start gap-4 rounded-xl border border-gold/40 bg-gold/10 p-5 sm:flex-row sm:items-center">
                  <Mail className="hidden size-5 shrink-0 text-primary sm:block" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Bookings are connected. Email setup needs one final step.
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Verify ra2travelandtours.co.za in Resend and add RESEND_API_KEY to Supabase
                      Edge Function secrets. Saved requests and their emails remain queued until
                      delivery is ready.
                    </p>
                  </div>
                  <a
                    href="https://supabase.com/dashboard/project/kqiizpibptowcqfzycvj/functions/secrets"
                    target="_blank"
                    rel="noreferrer"
                    className="booking-button-secondary text-xs"
                  >
                    Open secrets
                    <ArrowUpRight className="size-3" />
                  </a>
                </div>
              )}
              <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 sm:px-6">
                  <div>
                    <h2 className="text-2xl">Guest requests</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Open a request to see the full journey and contact your guest.
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1 text-[11px] text-primary">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Auto-refresh enabled
                  </span>
                </div>
                <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[minmax(0,1fr)_11rem_10rem] sm:p-5">
                  <div className="relative">
                    <label htmlFor="booking-search" className="sr-only">
                      Search bookings
                    </label>
                    <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                    <input
                      id="booking-search"
                      type="search"
                      maxLength={100}
                      className="booking-input pl-10 text-sm"
                      placeholder="Name, email, phone or reference"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="status-filter" className="sr-only">
                      Filter by status
                    </label>
                    <select
                      id="status-filter"
                      className="booking-input text-sm"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(0);
                      }}
                    >
                      <option value="all">All statuses</option>
                      {BOOKING_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="date-filter" className="sr-only">
                      Filter by travel date
                    </label>
                    <input
                      id="date-filter"
                      aria-label="Filter by travel date"
                      type="date"
                      className="booking-input text-sm"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setPage(0);
                      }}
                    />
                  </div>
                  {(search || date || status !== "all") && (
                    <button
                      className="justify-self-start text-xs text-primary underline"
                      onClick={() => {
                        setSearch("");
                        setStatus("all");
                        setDate("");
                        setPage(0);
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                {bookings.isPending ? (
                  <div className="flex justify-center gap-3 p-16 text-sm text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    Loading requests…
                  </div>
                ) : bookings.error ? (
                  <div role="alert" className="p-8 text-sm text-destructive">
                    Unable to load bookings.{" "}
                    <button className="underline" onClick={refresh}>
                      Try again
                    </button>
                  </div>
                ) : !bookings.data?.rows.length ? (
                  <div className="px-6 py-16 text-center">
                    <Inbox className="mx-auto mb-4 size-9 text-gold" />
                    <h3 className="text-3xl">
                      {search || date || status !== "all"
                        ? "No matching requests."
                        : "Your next journey starts here."}
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                      {search || date || status !== "all"
                        ? "Try another search or clear your filters."
                        : "Guest booking requests will appear here as soon as they’re submitted. Everything you need to follow up will be in one place."}
                    </p>
                    {!search && !date && status === "all" && (
                      <Link to="/plan-my-trip" className="booking-button-secondary mt-5">
                        View booking form
                        <ArrowUpRight className="size-4" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/30 text-xs text-muted-foreground">
                          <tr>
                            {["Guest", "Experience & travel", "Status", "Emails", ""].map(
                              (title, i) => (
                                <th key={i} className="px-5 py-3 font-medium">
                                  {title}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {bookings.data.rows.map((b) => (
                            <tr key={b.id} className="transition-colors hover:bg-secondary/30">
                              <td className="max-w-52 px-5 py-5">
                                <button
                                  onClick={() => setSelectedId(b.id)}
                                  className="text-left font-semibold text-primary hover:underline"
                                >
                                  {b.full_name}
                                </button>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {b.email}
                                </p>
                                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                                  {b.reference}
                                </p>
                              </td>
                              <td className="max-w-56 px-5 py-5">
                                <p className="text-sm">{b.experience}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {b.flexible_dates
                                    ? "Flexible dates"
                                    : formatTravelDate(b.travel_date)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {b.adults + b.children} travellers
                                </p>
                              </td>
                              <td className="px-5 py-5">
                                <StatusBadge status={b.status} />
                              </td>
                              <td className="px-5 py-5">
                                <EmailBadge booking={b} />
                              </td>
                              <td className="px-4 py-5">
                                <button
                                  className="booking-contact-link"
                                  onClick={() => setSelectedId(b.id)}
                                  aria-label={`Open booking ${b.reference}`}
                                >
                                  <ArrowUpRight className="size-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="divide-y divide-border md:hidden">
                      {bookings.data.rows.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedId(b.id)}
                          className="block w-full p-5 text-left transition-colors hover:bg-secondary/30"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-primary">{b.full_name}</span>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="text-sm">{b.experience}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {b.flexible_dates ? "Flexible dates" : formatTravelDate(b.travel_date)}{" "}
                            · {b.adults + b.children} travellers
                          </p>
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {b.reference}
                            </span>
                            <EmailBadge booking={b} />
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
                      <p className="text-xs text-muted-foreground">
                        {page * PAGE_SIZE + 1}–
                        {Math.min((page + 1) * PAGE_SIZE, bookings.data.count)} of{" "}
                        {bookings.data.count} requests
                      </p>
                      <div className="flex gap-2">
                        <button
                          aria-label="Previous page"
                          className="booking-button-secondary px-3 py-2"
                          disabled={page === 0}
                          onClick={() => setPage(page - 1)}
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <button
                          aria-label="Next page"
                          className="booking-button-secondary px-3 py-2"
                          disabled={(page + 1) * PAGE_SIZE >= bookings.data.count}
                          onClick={() => setPage(page + 1)}
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <ArrowDownLeft className="size-4" />
                  Notifications go to {config.data?.admin_recipient || "your configured inbox"}.
                </p>
                <button
                  className="flex items-center gap-2 text-primary"
                  disabled={retrying}
                  onClick={() => void processQueue()}
                >
                  {retrying ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                  Process pending emails
                </button>
              </div>
              {emailMessage && (
                <p role="status" className="mt-4 rounded-lg bg-secondary p-4 text-sm">
                  {emailMessage}
                </p>
              )}
            </>
          )}
          {selectedId && selected.isPending && (
            <p role="status" className="mt-4 text-sm text-muted-foreground">
              Opening booking…
            </p>
          )}
          {selectedId && (selected.error || (selected.isSuccess && !selected.data)) && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/20 p-4 text-sm text-destructive"
            >
              This booking could not be opened.{" "}
              <button
                className="underline"
                onClick={() => {
                  setSelectedId(null);
                  void navigate({ search: {} });
                }}
              >
                Dismiss
              </button>
            </div>
          )}
          <BookingDetails
            booking={selected.data || null}
            onClose={() => {
              setSelectedId(null);
              if (linkedBooking) void navigate({ search: {} });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
function EmailBadge({ booking }: { booking: Booking }) {
  const sent = booking.booking_emails.filter((job) => job.status === "sent").length;
  const failed = booking.booking_emails.some((job) => job.status === "failed" || job.last_error);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] ${failed ? "text-destructive" : sent === 2 ? "text-primary" : "text-muted-foreground"}`}
    >
      <Mail className="size-3.5" />
      {sent === 2 ? "Both sent" : failed ? "Needs attention" : `${sent}/2 sent`}
    </span>
  );
}
