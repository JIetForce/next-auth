// src/lib/auth/environment.ts
import "server-only";

const googleProviderEnvironmentKeys = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

export function isAuthSessionConfigured() {
  return (
    Boolean(process.env.BETTER_AUTH_SECRET?.trim()) &&
    Boolean(process.env.DATABASE_URL?.trim())
  );
}

export function isGoogleAuthConfigured() {
  return (
    isAuthSessionConfigured() &&
    googleProviderEnvironmentKeys.every((key) =>
      Boolean(process.env[key]?.trim()),
    )
  );
}
