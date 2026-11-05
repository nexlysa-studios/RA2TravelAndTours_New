import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  BOOKING_STATUSES,
  STATUS_LABELS,
  formatTravelDate,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";
import { functionError, getSupabase } from "@/lib/supabase";

export function BookingDetails({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={Boolean(booking)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full overflow-y-auto p-5 sm:max-w-xl sm:p-8">
        {booking && <BookingDetailBody key={booking.id} booking={booking} />}
      </SheetContent>
    </Sheet>
  );
}

function BookingDetailBody({ booking: b }: { booking: Booking }) {
  const [status, setStatus] = useState<BookingStatus>(b.status);
  const [notes, setNotes] = useState(b.admin_notes);
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(b.updated_at);
  const queryClient = useQueryClient();
  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data, error: saveError } = await getSupabase()
        .from("bookings")
        .update({ status, admin_notes: notes })
        .eq("id", b.id)
        .eq("updated_at", version)
        .select("updated_at")
        .maybeSingle();
      if (saveError)
        throw new Error("Unable to save this booking. Check your access and try again.");
      if (!data)
        throw new Error(
          "This booking changed since you opened it. Close and reopen it to see the latest details before saving.",
        );
      setVersion(data.updated_at);
      setMessage("Booking updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  async function retryEmails() {
    setEmailBusy(true);
    setError("");
    setMessage("");
    try {
      const { error: retryError } = await getSupabase().rpc("retry_booking_emails", {
        p_booking_id: b.id,
      });
      if (retryError) throw new Error("Unable to queue emails. Check your administrator access.");
      const { data, error: sendError } = await getSupabase().functions.invoke("booking-emails", {
        body: { mode: "send", booking_id: b.id },
      });
      if (sendError)
        throw new Error(
          await functionError(
            sendError,
            "Emails are queued. Automatic delivery will retry shortly.",
          ),
        );
      setMessage(
        !data.ready
          ? "Emails are safely queued. Complete Resend setup to start delivery."
          : data.failed
            ? "Some emails could not be sent. See the status below; automatic retries are scheduled."
            : data.sent
              ? `${data.sent} email(s) sent to the provider.`
              : "No unsent emails are ready to retry.",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to retry emails.");
    } finally {
      setEmailBusy(false);
    }
  }
  const whatsapp = b.phone.replace(/\D/g, "");
  return (
    <div className="space-y-7">
      <div className="pr-5">
        <p className="eyebrow mb-2">Booking details</p>
        <SheetTitle className="text-3xl font-medium">{b.full_name}</SheetTitle>
        <SheetDescription className="mt-2 font-mono text-xs">{b.reference}</SheetDescription>
        <p className="mt-2 text-xs text-muted-foreground">
          Received{" "}
          {new Date(b.created_at).toLocaleString("en-ZA", {
            timeZone: "Africa/Johannesburg",
            dateStyle: "medium",
            timeStyle: "short",
          })}{" "}
          SAST
        </p>
      </div>
      <div className="rounded-xl bg-primary p-5 text-ivory">
        <h3 className="text-2xl">{b.experience}</h3>
        <div className="mt-4 space-y-2 text-sm text-ivory/85">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 text-gold" />
            {b.flexible_dates ? "Flexible dates / to be arranged" : formatTravelDate(b.travel_date)}
          </p>
          <p className="flex items-center gap-2">
            <Users className="size-4 text-gold" />
            {b.adults} adults · {b.children} children
          </p>
        </div>
      </div>
      <section>
        <h3 className="mb-3 text-2xl">Get in touch</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Preferred contact:{" "}
          <span className="font-semibold capitalize">{b.contact_preference}</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <a
            className="booking-contact-link text-xs"
            href={`mailto:${b.email}?subject=${encodeURIComponent(`Your RA2 booking request · ${b.reference}`)}`}
          >
            <Mail className="size-4" />
            Email
          </a>
          <a
            className="booking-contact-link text-xs"
            href={`tel:${b.phone.replace(/[^+\d]/g, "")}`}
          >
            <Phone className="size-4" />
            Call
          </a>
          <a
            className="booking-contact-link text-xs"
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${b.full_name}, this is RA2 Travel and Tours regarding your booking request ${b.reference}.`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        </div>
        <p className="mt-3 break-all text-sm">{b.email}</p>
        <p className="text-sm text-muted-foreground">{b.phone}</p>
      </section>
      <section className="rounded-xl border border-border p-5">
        <h3 className="mb-4 text-2xl">Journey details</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Pickup" value={b.pickup_location || "To be arranged"} />
          {(b.package_type
            ? b.package_type === "transfer"
            : b.experience === "Transfer / Chauffeur") && (
            <>
              <Detail label="Drop-off" value={b.dropoff_location} />
              <Detail label="Pickup time" value={`${b.pickup_time} SAST (UTC+2)`} />
              <Detail label="Flight" value={b.flight_number || "Not specified"} />
              <Detail label="Luggage" value={`${b.luggage} pieces`} />
            </>
          )}
        </dl>
        {b.special_requests && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-1 text-xs text-muted-foreground">Guest’s additional details</p>
            <p className="whitespace-pre-wrap break-words text-sm">{b.special_requests}</p>
          </div>
        )}
      </section>
      {b.package_snapshot && (
        <details className="rounded-xl border border-border p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            Package details when this request was made
          </summary>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p className="font-semibold text-primary">{b.package_snapshot.name}</p>
            <p>{b.package_snapshot.duration}</p>
            {b.package_snapshot.included.length > 0 && (
              <p>
                <strong>Included: </strong>
                {b.package_snapshot.included.join(" ")}
              </p>
            )}
            {b.package_snapshot.excluded.length > 0 && (
              <p>
                <strong>Excluded: </strong>
                {b.package_snapshot.excluded.join(" ")}
              </p>
            )}
            {b.package_snapshot.booking_terms && (
              <p className="whitespace-pre-line">{b.package_snapshot.booking_terms}</p>
            )}
            <p className="text-xs">
              This is the version recorded for this request. Later package edits do not change it.
            </p>
          </div>
        </details>
      )}
      <section className="space-y-4">
        <h3 className="text-2xl">Manage this booking</h3>
        <div>
          <label htmlFor="booking-status" className="mb-2 block text-sm font-semibold">
            Booking status
          </label>
          <select
            id="booking-status"
            className="booking-input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as BookingStatus);
              setMessage("");
            }}
          >
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="admin-notes" className="mb-2 block text-sm font-semibold">
            Internal notes
          </label>
          <textarea
            id="admin-notes"
            rows={4}
            maxLength={10000}
            className="booking-input"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setMessage("");
            }}
            placeholder="Follow-ups, quote details, arrangements…"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Only your team can see these notes. Status changes don’t send guest emails; use the
            contact buttons to share updates.
          </p>
        </div>
        <button className="booking-button w-full" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save
          booking
        </button>
      </section>
      <section className="rounded-xl border border-border p-5">
        <h3 className="text-2xl">Request emails</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Each request has a guest receipt and an admin notification. “Sent” means accepted by the
          email provider.
        </p>
        <div className="my-4 space-y-3">
          {b.booking_emails.map((job) => (
            <div key={job.id} className="rounded-lg bg-secondary/60 p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{job.audience === "guest" ? "Guest receipt" : "Admin notification"}</span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold ${job.status === "sent" ? "text-primary" : job.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {job.status === "sent" && <Check className="size-3" />}
                  {job.status === "pending"
                    ? "Queued"
                    : job.status === "sending"
                      ? "Sending"
                      : job.status === "sent"
                        ? "Sent"
                        : "Needs attention"}
                </span>
              </div>
              {job.last_error && (
                <p className="mt-2 text-xs text-destructive">
                  {job.last_error.startsWith("RESEND_HTTP_403")
                    ? "Check sender domain verification and API key permissions in Resend."
                    : job.last_error === "RESEND_HTTP_401"
                      ? "Check the Resend API key in Supabase secrets."
                      : `Delivery attempt failed (${job.last_error}).`}
                </p>
              )}
              {job.sent_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(job.sent_at).toLocaleString("en-ZA", {
                    timeZone: "Africa/Johannesburg",
                  })}{" "}
                  SAST
                </p>
              )}
            </div>
          ))}
        </div>
        <button
          className="booking-button-secondary w-full text-xs"
          onClick={retryEmails}
          disabled={emailBusy || b.booking_emails.every((job) => job.status === "sent")}
        >
          {emailBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Retry unsent emails
        </button>
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
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">{value}</dd>
    </div>
  );
}
