import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, ShieldCheck, UserRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { functionError, getSupabase } from "@/lib/supabase";
import type { Profile } from "@/lib/bookings";

export function TeamPanel({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const team = useQuery({
    queryKey: ["admin-team"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("profiles")
        .select("id,email,full_name,phone,created_at,user_roles(role)")
        .order("created_at");
      if (error) throw error;
      return data as unknown as Profile[];
    },
    refetchInterval: 30000,
  });
  const adminCount = team.data?.filter((p) => p.user_roles?.role === "admin").length || 0;
  async function toggleRole(person: Profile, admin: boolean) {
    if (
      person.id === currentUserId &&
      !admin &&
      !window.confirm("Remove your own admin access? You will leave the dashboard immediately.")
    )
      return;
    setBusyId(person.id);
    setError("");
    setMessage("");
    try {
      const { error: updateError } = await getSupabase()
        .from("user_roles")
        .update({ role: admin ? "admin" : "user" })
        .eq("user_id", person.id)
        .select("role")
        .single();
      if (updateError)
        throw new Error(
          updateError.message.includes("last administrator")
            ? "Add another admin before removing the last administrator."
            : "Unable to update this role. Check your access and try again.",
        );
      setMessage(
        `${person.full_name || person.email} now has ${admin ? "administrator" : "standard staff"} access.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-team"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-access"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role update failed.");
    } finally {
      setBusyId(null);
    }
  }
  async function createStaff(event: FormEvent) {
    event.preventDefault();
    setAdding(true);
    setError("");
    setMessage("");
    try {
      const { error: createError } = await getSupabase().functions.invoke("admin-team", {
        body: { full_name: name, email, password },
      });
      if (createError)
        throw new Error(await functionError(createError, "Unable to create this staff account."));
      setName("");
      setEmail("");
      setPassword("");
      setShowForm(false);
      setMessage(
        "Staff account created. Share the temporary password privately, then enable Admin access below if needed. No invitation email was sent.",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-team"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create staff account.");
    } finally {
      setAdding(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl">Your people.</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Staff profiles and access stay in sync. Admins can view all bookings, manage requests
            and change team access.
          </p>
        </div>
        <button className="booking-button" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" />
          Add staff member
        </button>
      </div>
      {showForm && (
        <form
          onSubmit={createStaff}
          className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
        >
          <div>
            <label htmlFor="staff-name" className="mb-2 block text-sm font-semibold">
              Full name
            </label>
            <input
              id="staff-name"
              required
              minLength={2}
              maxLength={120}
              className="booking-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="staff-email" className="mb-2 block text-sm font-semibold">
              Email
            </label>
            <input
              id="staff-email"
              type="email"
              required
              maxLength={254}
              className="booking-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="staff-password" className="mb-2 block text-sm font-semibold">
              Temporary password
            </label>
            <input
              id="staff-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              className="booking-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={adding} className="booking-button">
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create staff account
            </button>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            New staff start without access to bookings. Toggle Admin access after creating the
            account to let them into the dashboard.
          </p>
        </form>
      )}
      {message && (
        <p role="status" className="rounded-lg bg-primary/10 p-4 text-sm text-primary">
          {message}
        </p>
      )}
      {(error || team.error) && (
        <p role="alert" className="rounded-lg bg-destructive/5 p-4 text-sm text-destructive">
          {error || "Unable to load staff. Please refresh."}
        </p>
      )}
      {team.isPending ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <div className="space-y-3">
          {team.data?.map((person) => (
            <article
              key={person.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary">
                {person.user_roles?.role === "admin" ? (
                  <ShieldCheck className="size-5 text-primary" />
                ) : (
                  <UserRound className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {person.full_name || "Staff member"}
                  {person.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="break-all text-sm text-muted-foreground">{person.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {person.user_roles?.role === "admin"
                    ? "Administrator"
                    : "Standard staff · no booking access"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <label htmlFor={`role-${person.id}`} className="text-xs font-semibold">
                  Admin access
                </label>
                {busyId === person.id ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Switch
                    id={`role-${person.id}`}
                    checked={person.user_roles?.role === "admin"}
                    disabled={
                      Boolean(busyId) || (person.user_roles?.role === "admin" && adminCount === 1)
                    }
                    onCheckedChange={(value) => void toggleRole(person, value)}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        The last administrator is protected from removal. Guest bookings never create staff
        accounts.
      </p>
      <AccountSettings />
    </div>
  );
}

export function AccountSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== repeat) {
      setError("The new passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      const db = getSupabase();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user?.email) throw new Error("Please sign in again.");
      const { error: verifyError } = await db.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) throw new Error("Your current password is incorrect.");
      const { error: updateError } = await db.auth.updateUser({ password: newPassword });
      if (updateError)
        throw new Error("Unable to update the password. Use a different password and try again.");
      setCurrentPassword("");
      setNewPassword("");
      setRepeat("");
      setMessage("Your password has been updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
      <h3 className="text-2xl">Your account</h3>
      <p className="mb-5 mt-2 text-sm text-muted-foreground">
        Keep your sign-in secure. Replace any temporary password before using this dashboard for
        real bookings.
      </p>
      <form onSubmit={changePassword} className="grid max-w-xl gap-4">
        <div>
          <label htmlFor="current-password" className="mb-2 block text-sm font-semibold">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            required
            autoComplete="current-password"
            className="booking-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-semibold">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className="booking-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="repeat-password" className="mb-2 block text-sm font-semibold">
              Repeat new password
            </label>
            <input
              id="repeat-password"
              type="password"
              required
              autoComplete="new-password"
              className="booking-input"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-primary">
            {message}
          </p>
        )}
        <button className="booking-button justify-self-start" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}Update password
        </button>
      </form>
    </section>
  );
}
