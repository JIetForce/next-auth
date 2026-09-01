// src/app/api/cron/cleanup/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

// A stale rate-limit bucket is a fresh bucket, so it is safe to prune anything
// older than the widest configured window. One hour comfortably exceeds every
// window currently in use.
const RATE_LIMIT_MAX_AGE_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  // Read a request property before any early return so Cache Components
  // cannot prerender this handler as a static 503 when CRON_SECRET is unset
  // at build time. Without force-dynamic (removed for cacheComponents), a
  // GET handler that never touches runtime data is baked at build.
  const authorization = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Fail closed: an unconfigured secret must never let this endpoint run
  // unauthenticated, since it deletes rows and is publicly routable.
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const rateLimitCutoff = BigInt(Date.now() - RATE_LIMIT_MAX_AGE_MS);

  const [session, verification, rateLimit] = await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.rateLimit.deleteMany({
      where: { lastRequest: { lt: rateLimitCutoff } },
    }),
  ]);

  const counts = {
    session: session.count,
    verification: verification.count,
    rateLimit: rateLimit.count,
  };

  console.info("cron/cleanup: pruned expired rows", counts);

  return NextResponse.json(counts);
}
