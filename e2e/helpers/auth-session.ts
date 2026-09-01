// e2e/helpers/auth-session.ts
import type { BrowserContext } from "@playwright/test";

import type { Viewer } from "@/lib/auth/types";
import { testAuth } from "./auth-test-instance";

// Only the display fields are seeded; the real `id` and `emailVerified`
// come from the database when `findOrCreateUser` calls `ctx.test.createUser`.
type E2eViewer = Partial<Pick<Viewer, "name" | "email" | "image">>;

export const E2E_VIEWER = {
  name: "E2E User",
  email: "e2e-user@example.invalid",
  image: null,
} as const;

async function findOrCreateUser(viewer: E2eViewer) {
  const ctx = await testAuth.$context;
  // Distinguish explicit `null` (let it flow through) from `undefined` (fall
  // back to the default). The User table's `name`/`email` columns are NOT NULL
  // (prisma/schema.prisma), so `null` is coerced to `""` at the DB boundary —
  // which is equivalent to `null` in getViewerInitials, since an empty string
  // yields no word-initials and falls through to the next fallback branch.
  const name =
    (viewer.name !== undefined ? viewer.name : E2E_VIEWER.name) ?? "";
  const email =
    (viewer.email !== undefined ? viewer.email : E2E_VIEWER.email) ?? "";
  const image = viewer.image !== undefined ? viewer.image : E2E_VIEWER.image;

  const existing = await ctx.internalAdapter.findUserByEmail(email);
  if (existing?.user) return existing.user;

  const user = ctx.test.createUser({
    email,
    name,
    image,
    emailVerified: true,
  });

  try {
    await ctx.test.saveUser(user);
    return user;
  } catch {
    // Another worker inserted the same address first; reuse its row.
    const raced = await ctx.internalAdapter.findUserByEmail(email);
    if (!raced?.user) throw new Error(`Could not seed E2E user ${email}`);
    return raced.user;
  }
}

/**
 * Seeds a real database-backed Better Auth session and installs its cookie.
 * Defaults to E2E_VIEWER; pass a `viewer` override to exercise other identity
 * shapes (e.g. UserAvatar's fallback-initials branches) without a second
 * helper. Never logs or persists the secret, cookie, or token.
 */
export async function addAuthenticatedSession(
  context: BrowserContext,
  viewer: E2eViewer = E2E_VIEWER,
) {
  const ctx = await testAuth.$context;
  const user = await findOrCreateUser(viewer);

  const cookies = await ctx.test.getCookies({
    userId: user.id,
    domain: "localhost",
  });

  await context.addCookies(cookies);
}
