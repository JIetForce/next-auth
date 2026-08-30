import "server-only";

const googleProviderEnvironmentKeys = [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
] as const;

export function isAuthSessionConfigured() {
  return Boolean(process.env.AUTH_SECRET?.trim());
}

export function isGoogleAuthConfigured() {
  return (
    isAuthSessionConfigured() &&
    googleProviderEnvironmentKeys.every((key) =>
      Boolean(process.env[key]?.trim()),
    )
  );
}
