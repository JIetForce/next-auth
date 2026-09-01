// src/lib/auth/session.ts
import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAuthSessionConfigured } from "@/lib/auth/environment";
import type { Viewer } from "@/lib/auth/types";

// `cache()` was removed because "use cache: private" provides per-browser
// caching that supersedes React's per-request deduplication. The directive
// is the Cache Components replacement for the manual cache() wrapper.
export async function getCurrentViewer(): Promise<Viewer | null> {
  "use cache: private";

  if (!isAuthSessionConfigured()) return null;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  return {
    // `id` is projected into the DTO because server-side ownership checks
    // (e.g. `row.authorId === viewer.id`) are impossible without it. The
    // alternatives are a second database round-trip or comparing by email.
    id: session.user.id,
    name: session.user.name?.trim() ? session.user.name : null,
    email: session.user.email?.trim() ? session.user.email : null,
    image: session.user.image ?? null,
    emailVerified: session.user.emailVerified,
  };
}

// `redirect()` must be inside the `"use cache: private"` boundary so it
// produces an HTTP redirect (303/307) rather than being caught as a
// NEXT_REDIRECT error during prerendering. See the Next.js guide
// "Authentication with Cache Components" for this pattern.
export async function requireCurrentViewer(): Promise<Viewer> {
  "use cache: private";

  const viewer = await getCurrentViewer();
  if (!viewer) redirect("/login");
  return viewer;
}
