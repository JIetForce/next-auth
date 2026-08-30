// e2e/helpers/auth-session.ts
import type { BrowserContext } from "@playwright/test";

import type { Viewer } from "@/lib/auth/types";
import { testAuth } from "./auth-test-instance";

const sessionCookieName = "better-auth.session_token";

export const E2E_VIEWER = {
  name: "E2E User",
  email: "e2e-user@example.invalid",
  image: null,
} as const;

async function findOrCreateUser(viewer: Viewer) {
  const ctx = await testAuth.$context;
  const email = viewer.email ?? E2E_VIEWER.email;

  const existing = await ctx.internalAdapter.findUserByEmail(email);
  if (existing?.user) return existing.user;

  const user = ctx.test.createUser({
    email,
    name: viewer.name ?? "",
    image: viewer.image ?? undefined,
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
  viewer: Viewer = E2E_VIEWER,
) {
  const ctx = await testAuth.$context;
  const user = await findOrCreateUser(viewer);

  const cookies = await ctx.test.getCookies({
    userId: user.id,
    domain: "localhost",
  });

  await context.addCookies(cookies);
}

export async function addTamperedSession(context: BrowserContext) {
  await context.addCookies([
    {
      name: sessionCookieName,
      value: "tampered-session",
      url: "http://localhost:3000",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
