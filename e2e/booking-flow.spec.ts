import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PROJECT_URL, SUPABASE_PUBLIC_KEY } from "../src/lib/supabase-public";

test("guest review/edit/submit and admin follow-up work on desktop and mobile", async ({
  page,
}) => {
  test.skip(
    !process.env["ADMIN_BOOTSTRAP_PASSWORD"],
    "Set ADMIN_BOOTSTRAP_PASSWORD to run the live booking browser check.",
  );
  const project = new URL(SUPABASE_PROJECT_URL).hostname.split(".")[0]!;
  const raw = execFileSync(
    process.platform === "win32" ? "supabase.exe" : "supabase",
    ["projects", "api-keys", "--project-ref", project, "--output", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const serviceKey = JSON.parse(raw).find(
    (entry: { name: string }) => entry.name === "service_role",
  ).api_key;
  const service = createClient(SUPABASE_PROJECT_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const qaEmail = `browser-qa-${randomUUID()}@example.com`;
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  mkdirSync(".qa", { recursive: true });
  let bookingId: string | undefined;
  try {
    await page.goto("/plan-my-trip");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Choose an experience");
    await page
      .locator('input[name="experience"][value="00000000-0000-4000-8000-000000000007"]')
      .check();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByText("Choose a travel date or select flexible dates.")).toBeVisible();
    await page.getByLabel("Travel date", { exact: false }).fill("2030-12-15");
    await page.getByLabel("Adults", { exact: false }).fill("3");
    await page.getByLabel("Children", { exact: true }).fill("1");
    await page
      .getByLabel("Pickup location", { exact: false })
      .fill("Cape Town International Airport");
    await page.getByLabel("Drop-off location", { exact: false }).fill("Waterfront Hotel");
    await page.getByLabel("Pickup time", { exact: false }).fill("14:30");
    await page.getByLabel("Flight number", { exact: false }).fill("FA101");
    await page.getByLabel("Luggage pieces").fill("4");
    await page.getByLabel("Anything else").fill("Browser QA request — child seat required.");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Choose your ride." })).toBeVisible();
    await page.getByRole("radio", { name: /Let RA2 recommend the right vehicle/ }).check();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Full name", { exact: false }).fill("Browser QA Guest");
    await page.getByLabel("Email address", { exact: false }).fill(qaEmail);
    await page.getByLabel("Phone / WhatsApp number", { exact: false }).fill("+27780000000");
    await page.getByLabel("How would you prefer").selectOption("whatsapp");
    await page.getByRole("button", { name: "Review my request" }).click();
    await expect(page.getByRole("heading", { name: "Everything looking good?" })).toBeVisible();
    await page.getByRole("button", { name: "Edit travel details", exact: true }).click();
    await expect(page.getByLabel("Drop-off location", { exact: false })).toHaveValue(
      "Waterfront Hotel",
    );
    await page.getByLabel("Adults", { exact: false }).fill("4");
    await page.getByRole("button", { name: "Save & review" }).click();
    await expect(page.getByText("4 adults · 1 children", { exact: true }).first()).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: ".qa/booking-review-desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByText("Your trip at a glance")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: ".qa/booking-review-mobile.png", fullPage: true });
    await page.getByRole("checkbox", { name: /I agree that RA2/ }).check();
    await page.getByRole("button", { name: "Send booking request" }).click();
    await expect(page.getByRole("heading", { name: "Leave the planning to us." })).toBeVisible();
    const saved = await service
      .from("bookings")
      .select("id,adults,reference,booking_emails(*)")
      .eq("email", qaEmail)
      .single();
    expect(saved.error).toBeNull();
    bookingId = saved.data!.id;
    expect(saved.data!.adults).toBe(4);
    expect(saved.data!.booking_emails.length).toBe(2);
    await page.screenshot({ path: ".qa/booking-confirmation-mobile.png", fullPage: true });
    await page.goto("/admin");
    await page.getByLabel("Email address").fill("admin@gmail.com");
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env["ADMIN_BOOTSTRAP_PASSWORD"]!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your booking desk." })).toBeVisible();
    await page.getByLabel("Search bookings").fill(qaEmail);
    await expect(page.getByRole("button", { name: /Browser QA Guest/ }).first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: ".qa/admin-bookings-mobile.png", fullPage: true });
    await page
      .getByRole("button", { name: /Browser QA Guest/ })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("link", { name: "Email", exact: true })).toHaveAttribute(
      "href",
      new RegExp(`^mailto:${qaEmail}`),
    );
    await expect(page.getByRole("link", { name: "WhatsApp", exact: true })).toHaveAttribute(
      "href",
      /https:\/\/wa.me\/27780000000/,
    );
    await page.getByLabel("Booking status", { exact: true }).selectOption("confirmed");
    await page.getByLabel("Internal notes").fill("Browser test: confirmed with guest.");
    await page.getByRole("button", { name: "Save booking" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Booking updated." })).toBeVisible();
    expect(
      (await service.from("bookings").select("status,admin_notes").eq("id", bookingId).single())
        .data,
    ).toMatchObject({ status: "confirmed", admin_notes: "Browser test: confirmed with guest." });
    await page.screenshot({ path: ".qa/admin-booking-detail-mobile.png", fullPage: true });
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: ".qa/admin-bookings-desktop.png", fullPage: true });
    await page.getByRole("button", { name: "Team & account" }).first().click();
    await expect(page.getByRole("heading", { name: "Your people." })).toBeVisible();
    await expect(page.getByRole("switch", { name: "Admin access" }).first()).toBeChecked();
    await expect(page.getByRole("switch", { name: "Admin access" }).first()).toBeDisabled();
    await page.screenshot({ path: ".qa/admin-team-desktop.png", fullPage: true });
    await page.getByRole("button", { name: "Sign out", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    expect(browserErrors).toEqual([]);
  } finally {
    if (!bookingId)
      bookingId = (await service.from("bookings").select("id").eq("email", qaEmail).maybeSingle())
        .data?.id;
    if (bookingId) {
      const { error } = await service.from("bookings").delete().eq("id", bookingId);
      if (error) throw error;
    }
  }
});
