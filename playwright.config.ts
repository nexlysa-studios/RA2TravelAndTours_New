import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120000,
  expect: { timeout: 15000 },
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    channel: "chrome",
    actionTimeout: 15000,
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5173 --host localhost",
    url: "http://localhost:5173/plan-my-trip",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
