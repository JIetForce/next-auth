# Audit remediation Phase 1 Task 2 — durable rate limiter, client IP, missing limit
## Spec
Plan task 2 of `docs/superpowers/plans/2026-08-31-audit-01-security.md`. Answers audit findings 2.2
(in-memory limiter: per-instance, unbounded key growth), 2.3 (IP derived with `.pop()` on
`x-forwarded-for`), 2.4 (`resetPasswordAction` has no limit). Read spec C1 and C4 first.

**Files:**
- Rewrite: `src/lib/auth/rate-limit.ts`
- Create: `src/lib/auth/client-ip.ts`
- Modify: `src/app/(auth)/login/actions.ts`, `register/actions.ts`, `reset-password/actions.ts`, `verify-email/actions.ts`

**What changes:**
1. `src/lib/auth/client-ip.ts` — new helper `getClientIp(headers: Headers): string`, `import "server-only"`,
   using `ipAddress` from `@vercel/functions` (reads `x-real-ip`) with a fallback to the FIRST entry of
   `x-forwarded-for` (client-most, NOT `.pop()`), then `"unknown"`. Comment explaining why the fallback
   exists (x-real-ip is unset off Vercel).
2. `src/lib/auth/rate-limit.ts` — rewrite over the `rateLimit` Prisma table (Task 1). Signature becomes
   `consumeRateLimit(key, max, windowMs): Promise<boolean>` (gains `Promise`). Requirements:
   - Prefix every key with `action:` so it cannot collide with Better Auth's own keys in the same table.
   - Store window boundary as `lastRequest` in epoch milliseconds (BigInt). A row whose `lastRequest` is
     older than `windowMs` is expired → reset `count` to 1.
   - Single `upsert` inside `prisma.$transaction` so two concurrent requests cannot both read `count = max-1`.
   - **Fail closed on DB error**: return `false`. Log via `console.error`.
   - Delete the module-level `Map` entirely.
   - Keep the existing doc comment's intent and the key convention.
3. Four actions: replace the inline
   `(await headers()).get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown"` with
   `getClientIp(await headers())`, and `await` each `consumeRateLimit` call. The rejection value for each
   call site must stay byte-identical to today: `{ error: "Too many attempts. Try again later." }` in login,
   `genericFailure` in register, `uniformReply` in reset-password and verify-email.
4. Add the missing limit to `resetPasswordAction` (`reset-password/actions.ts`, the `resetPasswordAction`
   function — currently has NO limit). Limit by IP only — the token is the subject and must NOT become a
   bucket key (would let an attacker with one valid token lock nothing, and an attacker with many tokens
   evade the bucket entirely). `10` attempts per hour per IP, returning the existing `genericFailure`.

**What must not change:**
- Uniform anti-enumeration replies in all four actions — shape and value identical for every outcome.
- `sendEmail` stays un-awaited in `src/auth.ts` (not touched here, but do not "fix" it elsewhere).
- Existing limits on the other actions (login 20/15min ip + 5/15min email; register 10/1h ip + 3/1h email;
  request-reset 10/1h ip + 3/1h email; resend 10/1h ip + 3/1h email) — keep the same max/window values.
- The `"use server"` / `import "server-only"` conventions.
- Do NOT touch files under `.claude/`, `.codex/`, `.cursor/`, `.devin/`, `.agent/`, `agents/` generated
  profiles, or the staged docs under `docs/`.

**How verified:** `npm run build`, `npx tsc --noEmit`, `npm run lint`. Then read `rate-limit.ts` to confirm
no `Map`/`Set`/module-level mutable object survives. `npm test` (E2E) is not agent-runnable — report as
un-run. Developer does NOT commit.
## Cycle log

### Cycle 1
- verifier: pass — tsc, build, lint (0 errors), test:agents 33/33, check:agents 35 profiles; confirmed no Map/Set/module-level mutable in rate-limit.ts
- code-reviewer: approved_with_notes — 0 required (notes: no unit test pinning the new behavior — deferred to phase 4 per plan; first-insert race fails closed safely, documented)
- security-reviewer: approved_with_notes — 0 required (notes: unbounded key growth/disk leak tracked as 2.9 → Task 7; no key-length cap → over-long key fails closed, not exploitable; isolationLevel implicit READ COMMITTED is sufficient; 5s tx timeout under contention fails closed)
- quality-reviewer: approved — 0 required (notes: phase-4 forward-ref comment in catch; minor style asymmetry in reset-password comments)
- resolved since cycle 0: n/a
- outstanding: none

### Delivery
All verdicts approved/approved_with_notes with zero required changes; verifier passed. Committed (rate-limit.ts, client-ip.ts, 4 action files only; audit/plan/spec docs excluded per user instruction).
