// src/lib/auth/client-ip.ts
import "server-only";

import { ipAddress } from "@vercel/functions";

/**
 * The client address, or "unknown" when none can be established.
 *
 * `ipAddress()` reads `x-real-ip`, which Vercel sets to the true client address
 * and nothing sets in local development or a self-hosted container. The
 * `x-forwarded-for` fallback takes the FIRST entry — the client — not the last,
 * which is the nearest proxy and identical for every caller behind one.
 */
export function getClientIp(headers: Headers): string {
  const fromPlatform = ipAddress(headers);
  if (fromPlatform) return fromPlatform;

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
