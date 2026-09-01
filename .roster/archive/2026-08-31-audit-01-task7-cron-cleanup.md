# Audit remediation Phase 1 Task 7 — Prune expired rows on a schedule

## Spec

Plan task 7 of `docs/superpowers/plans/2026-08-31-audit-01-security.md`. Answers audit finding 2.9
(`session` / `verification` grow without bound). Read spec C4 — the new `rateLimit` table from Task 1
needs pruning too.

**Files:**

- Create: `src/app/api/cron/cleanup/route.ts`
- Create: `vercel.json`
- Modify: `.env.example`

**What changes:**

1. Write `GET /api/cron/cleanup` route that:
   - Rejects any request whose `Authorization` header is not `Bearer ${process.env.CRON_SECRET}`, with
     `401` — this endpoint is publicly routable and deletes rows.
   - Returns `503` when `CRON_SECRET` is unset, rather than running unauthenticated.
   - `deleteMany` from `session` and `verification` where `expiresAt < now()`, and from `rateLimit`
     where `lastRequest` is older than the widest configured window (use one hour; a stale bucket is
     a fresh bucket).
   - Returns the three counts as JSON, and logs them.
   - Exports `const dynamic = "force-dynamic"` — or, once phase 2 lands `cacheComponents`, whatever
     that phase establishes as the equivalent. Route handlers are not prerendered, so confirm rather
     than assume.
2. Add `vercel.json` with a daily schedule:
   `{ "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 4 * * *" }] }`
3. Document `CRON_SECRET` in `.env.example`, noting that Vercel injects the `Authorization: Bearer`
   header from the project's own `CRON_SECRET` environment variable.

**What must not change:**

- The `rateLimit` table shape from Task 1 (`{ id, key, count, lastRequest BigInt }`).
- The `session`/`verification` `expiresAt` indexes from Task 1.
- Do NOT touch files under `.claude/`, `.codex/`, `.cursor/`, `.devin/`, `.agent/`, `agents/` generated
  profiles, or staged docs under `docs/`.

**How verified:** `npm run build`, `npx tsc --noEmit`, `npm run lint`, then exercise the no-auth
branch against the dev server and paste the real status code:
`curl -s -o /dev/null -w "no-auth: %{http_code}\n" http://localhost:3000/api/cron/cleanup`
`npm test` (E2E) is not agent-runnable — report as un-run. Developer does NOT commit.

## Cycle log

### Cycle 1

- verifier: pass — tsc/build/lint/test:agents 33/33/check:agents 35 profiles; route /api/cron/cleanup compiles as dynamic; npm test (E2E) not agent-runnable
- code-reviewer: approved — 0 required (notes: comment says "comfortably exceeds" but widest window is exactly 1h — the < cutoff is still safe; non-constant-time string compare flagged for visibility; unhandled deleteMany rejection → Next.js default 500 acceptable for cron)
- security-reviewer: approved_with_notes — 0 required (notes: non-constant-time Bearer comparison low-risk for high-entropy secret, could use crypto.timingSafeEqual; 503-before-401 leaks whether CRON_SECRET configured — acceptable fail-closed; no secret leakage in error bodies; strict string match is stricter than necessary = safe direction; no rate limiting on endpoint — mitigated by secret entropy; where clauses correct, no over-deletion; no injection surface)
- quality-reviewer: approved — 0 required (notes: RATE_LIMIT_MAX_AGE_MS not linked to auth.ts customRules window — future maintenance trap if a >1h window is added; Date vs BigInt cutoff asymmetry mirrors schema types — a one-line comment would help; .env.example comment style consistent; vercel.json minimal correct)
- resolved since cycle 0: n/a
- outstanding: none
