// e2e/global-setup.ts
import { execSync } from "node:child_process";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/apptest";

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
}
