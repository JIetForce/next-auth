import { defineConfig, devices } from "@playwright/test";

const webServerAuthEnvironment = {
  AUTH_SECRET: process.env.AUTH_SECRET ?? "",
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ?? "",
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ?? "",
};

export default defineConfig({
  testDir: "./e2e",
  outputDir: ".next/playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    env: webServerAuthEnvironment,
    url: "http://localhost:3000",
    reuseExistingServer: false,
  },
});
