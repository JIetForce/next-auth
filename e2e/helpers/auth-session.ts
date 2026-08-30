import type { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

import type { Viewer } from "@/lib/auth/types";

const sessionCookieName = "authjs.session-token";

export const E2E_VIEWER = {
  name: "E2E User",
  email: "e2e-user@example.invalid",
  image: null,
} as const;

function getTestSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("AUTH_SECRET is required for authenticated E2E tests");
  }

  return secret;
}

/**
 * Mints a short-lived synthetic Auth.js session cookie. Defaults to
 * E2E_VIEWER; pass a `viewer` override to exercise other identity shapes
 * (e.g. UserAvatar's fallback-initials branches) without a second helper.
 * Never logs or persists the secret, cookie, or token.
 */
export async function addAuthenticatedSession(
  context: BrowserContext,
  viewer: Viewer = E2E_VIEWER,
) {
  const value = await encode({
    salt: sessionCookieName,
    secret: getTestSecret(),
    maxAge: 5 * 60,
    token: {
      sub: "private-e2e-subject",
      name: viewer.name,
      email: viewer.email,
      picture: viewer.image,
    },
  });

  await context.addCookies([
    {
      name: sessionCookieName,
      value,
      url: "http://localhost:3000",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
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
