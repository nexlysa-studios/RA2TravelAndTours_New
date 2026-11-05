import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import ra2Logo from "@/assets/Ra2logo.png";
import peninsula from "@/assets/peninsula.jpg";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await getSupabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError)
        setError(
          authError.status === 429
            ? "Too many sign-in attempts. Please wait a few minutes."
            : "Unable to sign in. Check your email and password and try again.",
        );
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-forest lg:flex lg:items-end">
        <img
          src={peninsula}
          alt="Cape Peninsula coastline"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest/40 to-forest/10" />
        <div className="relative p-12 text-ivory xl:p-20">
          <img src={ra2Logo} alt="RA2 Travel and Tours" className="mb-8 size-36 object-contain" />
          <p className="eyebrow mb-4">Behind every great journey</p>
          <h1 className="max-w-lg text-5xl xl:text-6xl">
            A little planning.
            <br />A world of possibility.
          </h1>
          <p className="mt-5 max-w-md text-ivory/75">
            Your space to bring every guest’s South African adventure to life.
          </p>
        </div>
      </div>
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            to="/"
            className="mb-12 inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to RA2
          </Link>
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <LockKeyhole className="size-5 text-primary" />
          </div>
          <p className="eyebrow mb-2">RA2 management</p>
          <h2 className="text-4xl">Welcome back.</h2>
          <p className="mb-8 mt-3 text-sm text-muted-foreground">
            Sign in to manage bookings and look after your guests.
          </p>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold">
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                className="booking-input"
                placeholder="you@ra2travelandtours.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="booking-input pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="booking-button w-full">
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            For authorised RA2 staff. Guest bookings don’t need an account.
          </p>
        </div>
      </div>
    </div>
  );
}
