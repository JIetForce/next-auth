// e2e/global-setup.ts
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/apptest";

export const MAIL_LOG = ".next/mail.log";

export default function globalSetup() {
  if (!process.env.BETTER_AUTH_SECRET?.trim()) {
    throw new Error(
      "Refusing to run E2E tests: BETTER_AUTH_SECRET is not set. " +
        "playwright.config.ts loads it from .env.local — check that the file " +
        "exists at the repo root and defines BETTER_AUTH_SECRET.",
    );
  }

  if (!/apptest/.test(TEST_DATABASE_URL)) {
    throw new Error(
      `Refusing to reset ${TEST_DATABASE_URL}: the E2E database name must contain "apptest"`,
    );
  }

  execSync("npx prisma migrate reset --force", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
    },
  });

  mkdirSync(dirname(MAIL_LOG), { recursive: true });
  writeFileSync(MAIL_LOG, "");
}
