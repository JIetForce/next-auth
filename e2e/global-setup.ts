// e2e/global-setup.ts
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/apptest";

export const MAIL_LOG = ".next/mail.log";

export default function globalSetup() {
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
