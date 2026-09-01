// e2e/global-teardown.ts
import { teardownAuthTestInstance } from "./helpers/auth-test-instance";

export default async function globalTeardown() {
  await teardownAuthTestInstance();
}
