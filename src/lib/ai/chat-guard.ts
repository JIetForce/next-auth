// src/lib/ai/chat-guard.ts
import "server-only";

import { auth } from "@/auth";
import { isAuthSessionConfigured } from "@/lib/auth/environment";
import { getClientIp } from "@/lib/auth/client-ip";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import type { Viewer } from "@/lib/auth/types";
import { logger } from "@/lib/logger";

export type ChatCaller =
  | {
      kind: "authenticated";
      viewer: Viewer;
      identifier: string;
    }
  | {
      kind: "guest";
      ip: string;
      identifier: string;
    };

export type RateLimitResult =
  | { allowed: true; caller: ChatCaller }
  | { allowed: false; retryAfterSeconds: number; reason: string };

/**
 * Two-circle quotas for registered members and guests:
 * - Users: 15 requests per minute, 100 requests per day.
 * - Guests: 3 requests per 5 minutes, 20 requests per day.
 */
const LIMITS = {
  user: {
    shortWindowMs: 60 * 1000, // 1 minute
    shortMax: 15,
    dayWindowMs: 24 * 60 * 60 * 1000, // 24 hours
    dayMax: 100,
  },
  guest: {
    shortWindowMs: 5 * 60 * 1000, // 5 minutes
    shortMax: 3,
    dayWindowMs: 24 * 60 * 60 * 1000, // 24 hours
    dayMax: 20,
  },
} as const;

/**
 * Resolves the caller (Viewer or Guest) and consumes the atomic PostgreSQL
 * quotas. Takes the request's Headers (e.g. `req.headers` from a route
 * handler). Keys are passed WITHOUT the `action:` prefix —
 * consumeRateLimit adds it.
 */
export async function verifyChatAccess(
  requestHeaders: Headers,
): Promise<RateLimitResult> {
  const reqHeaders = requestHeaders;
  let viewer: Viewer | null = null;

  // 1. Resolve the active Better-Auth session
  if (isAuthSessionConfigured()) {
    try {
      const session = await auth.api.getSession({ headers: reqHeaders });
      if (session?.user) {
        viewer = {
          id: session.user.id,
          name: session.user.name?.trim() ? session.user.name : null,
          email: session.user.email?.trim() ? session.user.email : null,
          image: session.user.image ?? null,
          emailVerified: session.user.emailVerified,
        };
      }
    } catch (err) {
      logger.warn(
        { err },
        "Failed to resolve session in chat guard, falling back to guest",
      );
    }
  }

  // 2. Authenticated branch
  if (viewer) {
    const caller: ChatCaller = {
      kind: "authenticated",
      viewer,
      identifier: viewer.id,
    };

    const shortOk = await consumeRateLimit(
      `ai:chat:user:min:${viewer.id}`,
      LIMITS.user.shortMax,
      LIMITS.user.shortWindowMs,
    );

    if (!shortOk) {
      logger.info({ userId: viewer.id }, "Chat 1-min limit exceeded for user");
      return {
        allowed: false,
        retryAfterSeconds: 60,
        reason: "Message limit exceeded (15 per minute). Please wait a moment.",
      };
    }

    const dayOk = await consumeRateLimit(
      `ai:chat:user:day:${viewer.id}`,
      LIMITS.user.dayMax,
      LIMITS.user.dayWindowMs,
    );

    if (!dayOk) {
      logger.info({ userId: viewer.id }, "Chat 24h limit exceeded for user");
      return {
        allowed: false,
        retryAfterSeconds: 3600,
        reason:
          "Daily message limit exceeded (100 per day). The limit resets in 24 hours.",
      };
    }

    return { allowed: true, caller };
  }

  // 3. Guest branch (by IP)
  const clientIp = getClientIp(reqHeaders);
  const caller: ChatCaller = {
    kind: "guest",
    ip: clientIp,
    identifier: clientIp,
  };

  const guestShortOk = await consumeRateLimit(
    `ai:chat:guest:5min:${clientIp}`,
    LIMITS.guest.shortMax,
    LIMITS.guest.shortWindowMs,
  );

  if (!guestShortOk) {
    logger.info({ ip: clientIp }, "Chat 5-min limit exceeded for guest");
    return {
      allowed: false,
      retryAfterSeconds: 300,
      reason:
        "You have used up your guest allowance (3 messages per 5 minutes). Sign in to keep chatting without delays.",
    };
  }

  const guestDayOk = await consumeRateLimit(
    `ai:chat:guest:day:${clientIp}`,
    LIMITS.guest.dayMax,
    LIMITS.guest.dayWindowMs,
  );

  if (!guestDayOk) {
    logger.info({ ip: clientIp }, "Chat 24h limit exceeded for guest");
    return {
      allowed: false,
      retryAfterSeconds: 86400,
      reason:
        "You have used up your daily guest allowance (20 per day). Register for free to raise your limits.",
    };
  }

  return { allowed: true, caller };
}
