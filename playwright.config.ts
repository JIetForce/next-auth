import { readFileSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

import { MAIL_LOG, TEST_DATABASE_URL } from "./e2e/global-setup";

// Playwright never loads .env.local on its own, and @next/env only backfills
// a variable when it is `undefined` in process.env — an empty string still
// counts as "set". So BETTER_AUTH_SECRET and the Google OAuth keys have to be
// read here and forwarded explicitly, both to this process
// (e2e/global-setup.ts and e2e/auth-session.spec.ts read them directly) and
// to the child `next dev` server below.
//
// DATABASE_URL and DIRECT_URL are deliberately never among the keys copied
// out of .env.local: the suite always points at TEST_DATABASE_URL (the
// disposable `apptest` database — see e2e/global-setup.ts), and the
// developer's real database must never become reachable from this process or
// the child server. dotenv.parse() returns a plain object instead of
// mutating process.env, so nothing here can leak the two DB URLs by
// accident — only the keys named below ever cross over.
function loadLocalEnv(): Record<string, string> {
  try {
    return dotenv.parse(readFileSync(".env.local", "utf8"));
  } catch {
    return {};
  }
}

const forwardedAuthKeys = [
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

const localEnv = loadLocalEnv();

for (const key of forwardedAuthKeys) {
  if (!process.env[key]?.trim() && localEnv[key]?.trim()) {
    process.env[key] = localEnv[key];
  }
}

// A key that resolves to nothing is omitted from the child env rather than
// passed as "" — an empty string is still "defined", which is exactly what
// broke auth detection in the child `next dev` process before this fix.
function withoutEmptyValues(
  vars: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(vars).filter((entry): entry is [string, string] =>
      Boolean(entry[1]?.trim()),
    ),
  );
}

const webServerAuthEnvironment = {
  DATABASE_URL: TEST_DATABASE_URL,
  DIRECT_URL: TEST_DATABASE_URL,
  BETTER_AUTH_URL: "http://localhost:3000",
  EMAIL_CAPTURE_FILE: MAIL_LOG,
  ...withoutEmptyValues({
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  }),
};

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
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
