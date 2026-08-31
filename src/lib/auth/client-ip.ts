// src/lib/auth/client-ip.ts
import "server-only";

/**
 * The client address, or "unknown" when none can be established.
 *
 * We read `x-real-ip` directly instead of using `ipAddress()` from
 * `@vercel/functions`. `ipAddress()` duck-types its input via
 * `"headers" in input`: if a `.headers` property exists it takes that branch
 * and calls `.get` on it. Next.js's `headers()` returns a `HeadersAdapter`
 * (`next/dist/server/web/spec-extension/adapters/headers.js`) whose
 * constructor sets `this.headers = new Proxy(...)` over a plain object — so
 * `"headers" in input` is true, but `input.headers.get` is not a function,
 * and `ipAddress()` throws `TypeError: headers.get is not a function` on
 * every auth action call. Reading `x-real-ip` directly avoids that trap and
 * is byte-equivalent for the IP field, since `IP_HEADER_NAME` in
 * `@vercel/functions` is exactly `"x-real-ip"`.
 *
 * `x-real-ip` is set by Vercel to the true client address and set by nothing
 * in local development or a self-hosted container, which is why the
 * `x-forwarded-for` fallback exists. The fallback takes the FIRST entry — the
 * client — not the last, which is the nearest proxy and identical for every
 * caller behind one.
 */
export function getClientIp(headers: Headers): string {
  const fromPlatform = headers.get("x-real-ip");
  if (fromPlatform) return fromPlatform;

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
