// src/lib/auth/rate-limit.ts
import "server-only";

import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";

/**
 * Returns true when the call is within budget, false when it is over — or when
 * the underlying store could not be reached. The limiter fails closed, because
 * a limiter that fails open under load is exactly the condition an attacker
 * will create deliberately; the error is logged so the failure is visible.
 *
 * Keys should combine the action name with the subject, e.g.
 * `register:${email}`. Every key is prefixed with `action:` so it cannot
 * collide with the keys Better Auth writes for its own endpoints into the same
 * `rateLimit` table.
 *
 * The window boundary is stored the way Better Auth stores it — `lastRequest`
 * in epoch milliseconds — and a row whose `lastRequest` is older than
 * `windowMs` is treated as expired, resetting `count` to 1.
 *
 * Concurrency: the read-then-write runs inside `prisma.$transaction` with a
 * `SELECT ... FOR UPDATE` on the bucket row, so two concurrent requests for the
 * same key serialize on the row lock; the second sees the count the first
 * committed and cannot also pass. When no row exists yet, the unique
 * constraint on `key` makes one of two concurrent inserts fail — and a failure
 * fails closed (returns false), which is safe.
 */
export async function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const prefixedKey = `action:${key}`;
  const now = BigInt(Date.now());
  const windowStart = now - BigInt(windowMs);

  try {
    return await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ count: number; lastRequest: bigint }[]>`
        SELECT count, "lastRequest" FROM "rateLimit" WHERE key = ${prefixedKey} FOR UPDATE
      `;

      if (rows.length === 0) {
        await tx.rateLimit.create({
          data: {
            id: randomUUID(),
            key: prefixedKey,
            count: 1,
            lastRequest: now,
          },
        });
        return true;
      }

      const row = rows[0];
      const expired = row.lastRequest < windowStart;

      if (expired) {
        await tx.rateLimit.update({
          where: { key: prefixedKey },
          data: { count: 1, lastRequest: now },
        });
        return true;
      }

      if (row.count >= max) {
        return false;
      }

      await tx.rateLimit.update({
        where: { key: prefixedKey },
        data: { count: { increment: 1 }, lastRequest: now },
      });
      return true;
    });
  } catch (error) {
    // Fail closed: a database error rejects the request rather than letting
    // it through. Phase 4 replaces this with structured logging.
    console.error("consumeRateLimit failed closed:", error);
    return false;
  }
}
