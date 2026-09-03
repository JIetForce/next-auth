// src/lib/auth/environment.ts
import "server-only";

import { env } from "@/env";

export function isAuthSessionConfigured() {
  return Boolean(env.BETTER_AUTH_SECRET && env.DATABASE_URL);
}

export function isGoogleAuthConfigured() {
  return (
    isAuthSessionConfigured() &&
    Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
  );
}

export function isAiChatConfigured() {
  return Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY);
}

// Resolution order, most to least specific:
// 1. BETTER_AUTH_URL — an explicit operator override always wins, so a custom
//    domain (or local dev) keeps working regardless of platform.
// 2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable production URL, present
//    on production deployments even when a custom domain isn't configured.
// 3. VERCEL_URL — the deployment-specific URL Vercel sets for preview builds,
//    used when there is no production URL to fall back to.
// 4. http://localhost:3000 — the local development default.
export function getPublicBaseUrl() {
  const explicitUrl = env.BETTER_AUTH_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    return `https://${productionUrl}`;
  }

  const previewUrl = process.env.VERCEL_URL?.trim();
  if (previewUrl) {
    return `https://${previewUrl}`;
  }

  return "http://localhost:3000";
}
