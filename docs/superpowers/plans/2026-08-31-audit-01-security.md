# Audit remediation — Phase 1: Security

> **For agentic workers:** this repository's operating contract is `AGENTS.md`, and it supersedes the
> generic `subagent-driven-development` / `executing-plans` skills. The coordinator dispatches
> `developer`, then `verifier`, then the three reviewers in parallel, per plan task. The developer
> does **not** commit; the coordinator commits after every verdict is in.

**Goal:** close every security finding in `docs/audit-2026-08-31.md` §2 — rate limiting that can be
bypassed, a limiter that does not work on serverless, wrong client-IP derivation, missing response
headers, deployment-time base URL, an unconditionally registered OAuth provider, and unbounded table
growth.

**Spec:** `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` — read `## Corrections to
the audit` C1, C3 and C4 before starting. They contradict the audit document on purpose.

**Architecture:** Auth traffic gets one door. Better Auth's HTTP endpoints for credential flows are
disabled, leaving the Server Actions as the only entry point; those actions share one durable rate
limiter backed by the same `rateLimit` table Better Auth uses for the endpoints that remain open. A
scheduled route prunes every expiring table, including the new one.

**Tech Stack:** Better Auth 1.7.2, Prisma 7.10.0 / Postgres, Next.js 16 App Router, `@vercel/functions`.

## Global Constraints

- The developer does **not** commit. The coordinator commits after review approval.
- `npm test` (Playwright E2E) requires a local Postgres and a human. It is not agent-runnable. Where
  a task's verification names it, the developer reports it as un-run and the coordinator asks the
  human.
- The uniform anti-enumeration replies in all four auth actions must not change shape. A rate-limit
  rejection returns the same value the action already returns for that path today.
- `sendEmail` must stay un-awaited in `src/auth.ts`. Do not "fix" the missing `await`.
- Never hand-edit a file under `.claude/`, `.codex/`, `.cursor/`, `.devin/`, `.agent/` or `agents/`
  generated profiles — they come from `npm run sync:agents`.
- `next dev` rewrites a block into `CLAUDE.md`. If it appears in `git status`, commit it with the
  task rather than reverting it.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `prisma/schema.prisma` | `RateLimit` model; `expiresAt` indexes on `Session` and `Verification` | Modify |
| `prisma/migrations/<ts>_rate_limit_and_expiry_indexes/migration.sql` | The migration | Create |
| `src/lib/auth/rate-limit.ts` | Durable, database-backed `consumeRateLimit`; same signature | Rewrite |
| `src/lib/auth/client-ip.ts` | Single client-IP helper with an explicit fallback chain | Create |
| `src/auth.ts` | `rateLimit`, `disabledPaths`, `trustedOrigins`, `baseURL`, conditional Google | Modify |
| `src/lib/auth/environment.ts` | Resolve the public base URL from the deployment | Modify |
| `src/app/(auth)/*/actions.ts` | Use the IP helper; add the missing limit to `resetPasswordAction` | Modify |
| `next.config.ts` | `headers()`; `allowedDevOrigins` from the environment | Modify |
| `src/app/api/cron/cleanup/route.ts` | Delete expired `session`, `verification`, `rateLimit` rows | Create |
| `vercel.json` | Cron schedule | Create |
| `.env.example` | Production guidance for `BETTER_AUTH_URL`; new variables | Modify |

---

### Task 1: `RateLimit` model, expiry indexes, one migration

Answers 2.1 (storage prerequisite) and 2.9 (indexes).

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_rate_limit_and_expiry_indexes/migration.sql`

**Interfaces:**
- Produces: a `rateLimit` table matching what Better Auth's database storage expects, and
  `expiresAt` indexes that make Task 7's `DELETE` an index scan rather than a sequential one.

- [ ] **Step 1: Add the `RateLimit` model.** The canonical shape is
  `node_modules/@better-auth/core/dist/db/get-tables.mjs:33-56` — `key` (string, unique),
  `count` (number), `lastRequest` (number, `bigint: true`), plus the implicit `id`. Default model
  name is `rateLimit`. Follow the file's existing convention of an explicit `@@map`:

```prisma
model RateLimit {
  id          String @id
  key         String
  count       Int
  lastRequest BigInt

  @@unique([key])
  @@map("rateLimit")
}
```

- [ ] **Step 2: Add the expiry indexes** to the existing models — `@@index([expiresAt])` on
  `Session` and on `Verification`. Do not remove the indexes already there.

- [ ] **Step 3: Cross-check against the generator** rather than trusting Step 1:

```bash
npx @better-auth/cli generate --config src/auth.ts
```

  Compare its output for the rate-limit table against what you wrote. If it disagrees on a column
  name or type, the generator is right — take its version and note the difference in your report.
  Do not let it rewrite the rest of the schema.

- [ ] **Step 4: Create the migration.** The Prisma CLI reads the unpooled URL via
  `prisma.config.ts`, so this needs `DIRECT_URL` (or `DATABASE_URL_UNPOOLED`) in `.env.local`:

```bash
npx prisma migrate dev --name rate_limit_and_expiry_indexes
```

  If no database is reachable, generate the SQL without applying it
  (`npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`),
  write it to the migration directory by hand, and say clearly in `### Blocked` that it is unapplied.

- [ ] **Step 5: Verify.** `npx prisma validate`, then `npm run build` (which runs `prisma generate`)
  and `npx tsc --noEmit`.

---

### Task 2: One durable rate limiter, correct client IP, and the missing limit

Answers 2.2, 2.3, 2.4. Read spec C1 and C4 first.

**Files:**
- Rewrite: `src/lib/auth/rate-limit.ts`
- Create: `src/lib/auth/client-ip.ts`
- Modify: `src/app/(auth)/login/actions.ts`, `register/actions.ts`, `reset-password/actions.ts`, `verify-email/actions.ts`

**Interfaces:**
- Produces: `consumeRateLimit(key: string, max: number, windowMs: number): Promise<boolean>` — the
  signature gains a `Promise`, everything else is unchanged. Call sites become `await`ed.
- Produces: `getClientIp(headers: Headers): string`.
- Consumes: `prisma` from `@/lib/db`; the `rateLimit` table from Task 1.

- [ ] **Step 1: Create `src/lib/auth/client-ip.ts`.** One helper, `server-only`, with a comment
  explaining why the fallback exists — `ipAddress()` reads `x-real-ip`
  (`node_modules/@vercel/functions/headers.js:58-61`), which nothing sets off Vercel, and the
  `x-forwarded-for` fallback must take the **client-most** entry, not `.pop()`.

```ts
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
```

- [ ] **Step 2: Rewrite `src/lib/auth/rate-limit.ts`** over the `rateLimit` table. Keep the existing
  doc comment's intent and keep the key convention. Requirements:
  - Prefix every key written by this module with `action:` so it cannot collide with the keys Better
    Auth writes for its own endpoints into the same table.
  - Store the window boundary the way Better Auth does — `lastRequest` in epoch milliseconds — and
    treat a row whose `lastRequest` is older than `windowMs` as expired, resetting `count` to 1.
  - Use a single `upsert` inside `prisma.$transaction` so two concurrent requests cannot both read
    `count = max - 1` and both pass.
  - **Fail closed on a database error**: return `false`. A limiter that fails open under load is the
    condition an attacker will create deliberately. Log the error via `console.error` (phase 4
    replaces this with structured logging).
  - Delete the module-level `Map` entirely. It is the defect.

- [ ] **Step 3: Update the four actions.** In each, replace the inline
  `(await headers()).get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown"` with
  `getClientIp(await headers())`, and `await` each `consumeRateLimit` call. The rejection value for
  each call site must stay byte-identical to what it returns today — `{ error: "Too many attempts. Try again later." }`
  in `login`, `genericFailure` in `register`, `uniformReply` in `reset-password` and `verify-email`.

- [ ] **Step 4: Add the missing limit to `resetPasswordAction`** (`reset-password/actions.ts:52`),
  the only action with none. Limit by IP only — the token is the subject and it must not become a
  bucket key, since that would let an attacker with one valid token lock nothing and an attacker with
  many tokens evade the bucket entirely. `10` attempts per hour per IP, returning the existing
  `genericFailure`.

- [ ] **Step 5: Verify.** `npm run build`, `npx tsc --noEmit`, `npm run lint`. Then confirm by
  reading `src/lib/auth/rate-limit.ts` that no `Map`, `Set` or module-level mutable object survives.

---

### Task 3: Close the HTTP credential surface, configure Better Auth's limiter

Answers 2.1. Read spec C1 first — this task is where the audit's own proposal is deliberately not followed.

**Files:**
- Modify: `src/auth.ts`

**Interfaces:**
- Consumes: the `rateLimit` table from Task 1.
- Produces: a 404 from every Better Auth HTTP endpoint the application does not use.

- [ ] **Step 1: Establish which endpoints are actually reached** before disabling anything. Grep for
  `better-auth/client`, `createAuthClient`, and `fetch("/api/auth` across `src/` and `e2e/`. The
  expectation from the audit-verification pass is that there are none and every credential flow goes
  through a Server Action. **If that grep finds a caller, stop and file `### Blocked`** — the list
  below is wrong and the design needs revisiting.

- [ ] **Step 2: Add `disabledPaths`** to the `betterAuth({...})` options:

```ts
  // Every credential flow in this app goes through a Server Action, which calls
  // auth.api.* directly. Better Auth's rate limiter runs only in the router's
  // onRequest hook (better-auth/dist/api/index.mjs:168), so an HTTP caller hitting
  // these paths would bypass both the limiter below AND the per-action limits.
  // Disabling them leaves the Server Action as the only door.
  // The paths kept open are the ones the browser reaches by following an emailed
  // or redirected link, not by script.
  disabledPaths: [
    "/sign-in/email",
    "/sign-up/email",
    "/sign-in/social",
    "/forget-password",
    "/reset-password",
    "/send-verification-email",
    "/sign-out",
  ],
```

- [ ] **Step 3: Add `rateLimit`** as defence in depth over what remains open:

```ts
  rateLimit: {
    enabled: true,   // on in development too, so E2E exercises it
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/callback/*": { window: 60, max: 20 },
      "/verify-email": { window: 3600, max: 20 },
      "/reset-password/*": { window: 3600, max: 20 },
    },
  },
```

- [ ] **Step 3a: Understand why this list is safe, before trusting it.** `disabledPaths` is an
  **exact string match** against a normalized path (`api/index.mjs:164-166`), and
  `normalizePathname` (`@better-auth/core/dist/utils/url.mjs:18-30`) strips the query string, the
  trailing slash and the `/api/auth` base path. Two consequences the list above depends on:
  - `"/reset-password"` disables the **POST** that submits a new password. It does **not** disable
    `GET /reset-password/:token`, the emailed link, because `"/reset-password/abc123"` is a different
    string. That is the intended outcome, and it is why the entry is safe.
  - `"/verify-email"` is deliberately **absent** from the list. `GET /api/auth/verify-email?token=...`
    normalizes to `/verify-email`, so disabling it would break every verification email. The POST
    that resends one is `/send-verification-email`, which *is* disabled.

  Confirm both of these against the running server in Step 4 rather than taking this on trust.

- [ ] **Step 4: Verify the disabled paths really 404.** Start the dev server and check one disabled
  path and one open path:

```bash
curl -s -o /dev/null -w "sign-in/email: %{http_code}\n" -X POST http://localhost:3000/api/auth/sign-in/email -H 'content-type: application/json' -d '{"email":"a@b.co","password":"xxxxxxxx"}'
curl -s -o /dev/null -w "verify-email:  %{http_code}\n" "http://localhost:3000/api/auth/verify-email?token=not-a-real-token"
```

  Expect `404` for the first and **not** `404` for the second — a 4xx from token validation is the
  right answer there, a 404 means Step 3a's reasoning was wrong and the verification link is broken.
  Report the actual codes you observed; do not assert them from the config.

- [ ] **Step 5: Verify the app still works.** `npm run build`, `npx tsc --noEmit`, `npm run lint`.
  The E2E suite covers login, registration and reset end to end and is the real check here; report it
  as requiring the human.

---

### Task 4: Security response headers, and the personal IP out of the repository

Answers 2.5 and 2.10. Read spec C3 — the CSP here is deliberately partial.

**Files:**
- Modify: `next.config.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: response headers on every route; `allowedDevOrigins` sourced from `NEXT_DEV_ALLOWED_ORIGIN`.

- [ ] **Step 1: Add `headers()`** to `next.config.ts`, applied to `/:path*`:
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

- [ ] **Step 2: Add the CSP directives that do not interact with inline scripts**, as one
  `Content-Security-Policy` header:
  `frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`.
  Add a comment recording **why `script-src` and `default-src` are absent**: they need a per-request
  nonce, a nonce needs dynamic rendering
  (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`), and dynamic rendering
  is exactly what phase 2 removes. Do not add `unsafe-inline` — a `script-src` that permits inline
  scripts is worse than no `script-src`, because it reads as protection while providing none.

- [ ] **Step 3: Move the hard-coded LAN address out.**
  `allowedDevOrigins: ["192.168.31.145"]` becomes a read of `NEXT_DEV_ALLOWED_ORIGIN`, defaulting to
  an empty array. Document the variable in `.env.example` with a comment saying it is for testing the
  dev server from another device on the same network.

- [ ] **Step 4: `e2e/login.spec.ts:13` depends on that address.** Read it, and make it read the same
  environment variable with a skip when unset — an E2E test must not fail because a developer is on a
  different network. If it turns out to reference the address for a different reason, say so in
  `### Concerns` and leave it.

- [ ] **Step 5: Verify.** `npm run build`, then start the production server and confirm the headers
  are actually on the wire:

```bash
curl -sI http://localhost:3000/ | grep -iE 'x-frame-options|content-security-policy|strict-transport|x-content-type|referrer-policy|permissions-policy'
```

  Paste the real output into `### Test results`.

---

### Task 5: Base URL and trusted origins for production

Answers 2.6.

**Files:**
- Modify: `src/auth.ts`, `src/lib/auth/environment.ts`, `.env.example`

**Interfaces:**
- Produces: `getPublicBaseUrl(): string` in `environment.ts`, consumed by `src/auth.ts`.

- [ ] **Step 1: Add `getPublicBaseUrl()`** to `src/lib/auth/environment.ts`, resolving in order:
  `BETTER_AUTH_URL` when set (explicit wins, so a custom domain keeps working) → 
  `https://${VERCEL_PROJECT_PRODUCTION_URL}` → `https://${VERCEL_URL}` (preview deployments) →
  `http://localhost:3000`. Comment why the order is that way.

- [ ] **Step 2: Pass `baseURL: getPublicBaseUrl()`** in `src/auth.ts`, and set `trustedOrigins`
  explicitly to the resolved base URL plus, when `VERCEL_ENV === "preview"`, the preview host. Note
  in a comment that CSRF protection on the endpoints that stay open derives from this, so it is not
  cosmetic.

- [ ] **Step 3: Document it in `.env.example`.** The current line
  `BETTER_AUTH_URL="http://localhost:3000"` is a deployment trap — copied into Vercel it produces
  `redirect_uri=http://localhost:3000/...` on every OAuth request. Add a comment above it saying:
  local development only; in production either leave it unset so it derives from
  `VERCEL_PROJECT_PRODUCTION_URL`, or set it to the real public origin.

- [ ] **Step 4: Verify.** `npm run build`, `npx tsc --noEmit`. Then prove the resolution order works
  without a rebuild:

```bash
VERCEL_PROJECT_PRODUCTION_URL=example.com node --input-type=module -e "process.env.BETTER_AUTH_URL=''; const m = await import('./src/lib/auth/environment.ts').catch(() => null); console.log(m ? 'imported' : 'needs a compiled entry — verify via the unit test instead')"
```

  If that import cannot run against TypeScript directly, say so and verify by reading the code
  instead; phase 4 adds Vitest, which is where this belongs permanently.

---

### Task 6: Register the Google provider only when it is configured

Answers 2.7.

**Files:**
- Modify: `src/auth.ts`

- [ ] **Step 1: Make the provider conditional.** `socialProviders` currently always registers Google
  with `?? ""`, so a direct call with empty keys reaches Google with an empty `client_id` instead of
  failing legibly. Build the object from `isGoogleAuthConfigured()` — spread in `google` only when it
  returns true. Keep `isGoogleAuthConfigured()` as the single source of that truth; do not duplicate
  the check.

- [ ] **Step 2: Confirm the Server Action still behaves.** `login/actions.ts:12` already redirects to
  `/login?error=configuration` when unconfigured; that path must be unchanged. With Task 3's
  `disabledPaths` also covering `/sign-in/social`, there is now no way to reach an unconfigured
  provider at all — state that in `### Concerns` so the reviewers see the two tasks interlock.

- [ ] **Step 3: Verify.** `npm run build` and `npx tsc --noEmit` with `GOOGLE_CLIENT_ID` unset, and
  again with it set. Both must build.

---

### Task 7: Prune expired rows on a schedule

Answers 2.9. Read spec C4 — the new `rateLimit` table needs pruning too.

**Files:**
- Create: `src/app/api/cron/cleanup/route.ts`
- Create: `vercel.json`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `prisma` from `@/lib/db`; `CRON_SECRET`.
- Produces: `GET /api/cron/cleanup` returning the deleted-row counts.

- [ ] **Step 1: Write the route.** It must:
  - Reject any request whose `Authorization` header is not `Bearer ${process.env.CRON_SECRET}`,
    with `401` — this endpoint is publicly routable and deletes rows.
  - Return `503` when `CRON_SECRET` is unset, rather than running unauthenticated.
  - `deleteMany` from `session` and `verification` where `expiresAt < now()`, and from `rateLimit`
    where `lastRequest` is older than the widest configured window (use one hour; a stale bucket is
    a fresh bucket).
  - Return the three counts as JSON, and log them.
  - Export `const dynamic = "force-dynamic"` — or, once phase 2 lands `cacheComponents`, whatever
    that phase establishes as the equivalent. Route handlers are not prerendered, so confirm rather
    than assume.

- [ ] **Step 2: Add `vercel.json`** with a daily schedule:

```json
{ "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 4 * * *" }] }
```

- [ ] **Step 3: Document `CRON_SECRET`** in `.env.example`, noting that Vercel injects the
  `Authorization: Bearer` header from the project's own `CRON_SECRET` environment variable.

- [ ] **Step 4: Verify.** `npm run build`, `npx tsc --noEmit`, `npm run lint`, then exercise both
  branches against the dev server and paste the real status codes:

```bash
curl -s -o /dev/null -w "no-auth: %{http_code}\n" http://localhost:3000/api/cron/cleanup
```

---

## Phase exit

- [ ] `npm run build && npx tsc --noEmit && npm run lint && npm run test:agents && npm run check:agents` — all green.
- [ ] Ask the human to run `npm test` (Playwright, needs local Postgres) and report the result. The
      phase is not delivered until they do: this phase changes the login, registration, reset and
      verification paths, and E2E is the only coverage they have.
- [ ] Coordinator commits, appends the delivery line to `.roster/ledger.md`, and archives it.
