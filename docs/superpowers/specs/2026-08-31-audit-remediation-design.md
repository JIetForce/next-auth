# Audit remediation — design

Source: `docs/audit-2026-08-31.md` (revision `743d2e6`).
Every finding in that audit was re-verified against live code on 2026-08-31 before this spec was
written. All of them reproduce. Four of them have a proposed fix that is wrong or incomplete; those
are corrected in `## Corrections to the audit` below, and the corrected design is what the plans
implement.

## Context

`agent-roster-web` (branded Siftloom) is a Next.js 16.3.3 / React 19.2.8 App Router application with
Better Auth 1.7.2 over Prisma 7.10.0 and Postgres. It has a marketing surface (`/`, `/features`,
`/pricing`), an auth surface (`/login`, `/register`, `/verify-email`, `/reset-password`) built on
Server Actions, and one authenticated route (`/profile`). The repository also carries the
`agent-roster` tooling that projects agent roles into six harnesses.

The codebase builds clean and type-checks clean. The audit's findings are about security,
architecture, operations and documentation — not about compilation.

## The spec, in three statements

### What changes

Forty-one findings, remediated in five sequenced phases. Each phase is one plan file, and each plan
task is one run of the `AGENTS.md` loop. The phases are ordered by the audit's own §9, with two
moves: password policy travels with validation unification (same files), and database growth
travels with the rate-limit migration (same migration).

| Phase                              | Plan                                    | Covers                                             |
| ---------------------------------- | --------------------------------------- | -------------------------------------------------- |
| 1. Security                        | `2026-08-31-audit-01-security.md`       | 2.1–2.7, 2.9, 2.10                                 |
| 2. Architecture & performance      | `2026-08-31-audit-02-architecture.md`   | 2.8, 3.1–3.5, 4.1, 5.1–5.3                         |
| 3. Documentation                   | `2026-08-31-audit-03-documentation.md`  | 1.1–1.3                                            |
| 4. Infrastructure & tooling        | `2026-08-31-audit-04-infrastructure.md` | 4.4, 7.1–7.3                                       |
| 5. UI, accessibility, SEO, content | `2026-08-31-audit-05-ui-content.md`     | 3.6, 4.2, 4.3, 5.4, 5.5, §6, 7.2 (email templates) |

Phases 1 and 2 are ordered: phase 2's `cacheComponents` work depends on phase 1 having settled
`next.config.ts`, and phase 2's `Viewer` change depends on nothing in phase 1 but touches files
phase 1 also touches. Phases 3, 4 and 5 are independent of each other and of phase 2, but run after
phase 2 so the documentation describes the finished system rather than an intermediate one.

### What must not change

The audit's §8 lists what this codebase already does well. These are invariants, and a reviewer
should reject any diff that erodes them:

- **Server/Client separation.** `Viewer` DTO instead of a raw session object; `server-only` on every
  server module; `"use client"` only on leaves.
- **Uniform anti-enumeration responses.** `login/actions.ts:64`, `reset-password/actions.ts:13`,
  `verify-email/actions.ts:11` return one response for every outcome, and mail is dispatched without
  `await` specifically so response timing cannot reveal whether an address exists. Any refactor that
  makes a reply vary by outcome, or that starts awaiting `sendEmail`, is a regression.
- **The "why" comments.** `db.ts:21-24`, `auth.ts:73`, `playwright.config.ts:9-22`. They explain
  non-obvious decisions and must survive edits to their surrounding code.
- **The test-database guard.** `e2e/global-setup.ts:21-25` refuses `migrate reset` unless the
  database name contains `apptest`.
- **Prisma schema fidelity to Better Auth 1.7**, including `Account.issuer` and the
  `(issuer, accountId)` unique index.
- **Roster tooling green.** `npm run test:agents` 33/33, `check:agents` / `validate:agents` /
  `doctor:agents` clean, 35 profiles in sync. No phase may edit a generated profile by hand.
- **Existing behaviour and existing tests.** Every current E2E spec keeps passing unchanged unless a
  task explicitly says which assertion it changes and why.

### How it is verified

Per phase, and per task where the task says so:

```bash
npm run build && npx tsc --noEmit && npm run lint && npm run test:agents && npm run check:agents
```

Phase 4 adds `npm run test:unit` (Vitest) to that gate, and phases after it must keep it green.

`npm test` (Playwright E2E) needs a local Postgres and a human at the keyboard. It is **not** an
agent-runnable step. Every phase ends with an explicit hand-off asking the human to run it, and the
phase is not delivered until they report the result. A verifier that cannot run E2E says so in its
evidence rather than inferring a pass.

## Corrections to the audit

These four are the reason this spec exists rather than the plans being generated straight from §9.

### C1 — The proposed rate-limit fix would leave the login form with no limit at all

The audit (2.1, 2.2) proposes configuring Better Auth's `rateLimit` and deleting
`src/lib/auth/rate-limit.ts`. The first half is right. The second half, done on its own, is a net
loss of protection.

Better Auth applies rate limiting in exactly one place: `onRequestRateLimit(currentRequest, ctx)`
inside the router's `onRequest` hook (`node_modules/better-auth/dist/api/index.mjs:168`). That hook
runs only for traffic arriving through `auth.handler` — that is, through
`src/app/api/auth/[...all]/route.ts`.

Every Server Action in this application calls `auth.api.*` **directly**:

- `login/actions.ts:62` → `auth.api.signInEmail`
- `register/actions.ts:55` → `auth.api.signUpEmail`
- `reset-password/actions.ts:36,68` → `auth.api.requestPasswordReset`, `auth.api.resetPassword`
- `verify-email/actions.ts:36` → `auth.api.sendVerificationEmail`

A direct `auth.api.*` call invokes the endpoint handler; it never passes through the router, so
`onRequestRateLimit` never sees it. Configuring `rateLimit` protects the raw HTTP surface and does
nothing for the login form. Deleting the custom limiter at the same time would remove the only
protection the login form currently has.

**Corrected design — narrow the surface, and keep one durable limiter.**

1. **`disabledPaths`.** The application never uses Better Auth's HTTP endpoints for credential
   flows; every one of them is reached through a Server Action. Disable them, so the Server Action
   is the only door:

   ```ts
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

   `disabledPaths` is checked in the same `onRequest` hook, before rate limiting, and returns 404
   (`api/index.mjs:164-166`). The paths that must stay open are the ones the browser reaches by
   following a link rather than by script: `GET /callback/:id` (Google OAuth return),
   `GET /verify-email` (the emailed confirmation link), and `GET /reset-password/:token` (the emailed
   reset link, which redirects to the app page carrying the token).

2. **Better Auth `rateLimit` for what remains**, with `storage: "database"`. This is defence in
   depth over the link-following endpoints and any endpoint added later that someone forgets to
   disable.

3. **One durable custom limiter** for the Server Actions, backed by the same `rateLimit` table
   through Prisma, with a distinct key prefix (`action:`) so the two never collide. `consumeRateLimit`
   keeps its current signature and call sites; only its storage changes. This fixes both defects the
   audit identifies in 2.2 — per-instance buckets and unbounded key growth — without leaving the
   Server Actions unprotected.

The audit's warning that two independent limiters will diverge is right, and this design answers it:
one table, one migration, one place where limits are declared.

### C2 — Cache Components is not a one-line change, because `/profile` reads the session at page level

The audit (3.1) is right that `cacheComponents: true` is the largest available win and right that
the header's Suspense boundary (`header.tsx:49-53`) is already the shape Cache Components wants. It
is not right that the flag alone is sufficient.

`src/app/(main)/profile/page.tsx:26` calls `requireCurrentViewer()` directly in the page body, with
no Suspense boundary above it. Under Cache Components, reading `cookies()`/`headers()` outside a
boundary is a build error, not an insight
(`node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`).

**Corrected design — adopt incrementally, in the order the Next.js guide prescribes:**

1. Enable the flag.
2. `export const instant = false` on `/profile` so the app keeps building.
3. Convert `getCurrentViewer` to `"use cache: private"`, which is the directive that is allowed to
   read `cookies()` and `headers()` and keeps the result in the viewer's browser only.
4. Restructure `/profile` so the session read sits behind a boundary, then remove its `instant = false`.
5. Confirm the marketing routes prerender by reading the build output, not by assuming.

The success criterion is the build manifest: `/`, `/features` and `/pricing` must print as static
(`○`), not dynamic (`ƒ`). A task that lands the flag without moving those three markers has not
delivered 3.1.

### C3 — A strict CSP and a static shell are mutually exclusive here; pick deliberately

The audit (2.5) proposes security headers and defers CSP to "a separate task, needing a nonce for the
theme script". The deferral hides a real conflict: Next.js requires **dynamic rendering** to serve
per-request nonces (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`), and
App Router streams inline `self.__next_f.push(...)` bootstrap scripts whose content changes per
build, so a hash-based `script-src` is not a workable substitute. A nonce-based CSP would therefore
undo C2 — the single largest performance win in the audit.

**Corrected design — ship the directives that do not interact with inline scripts, now:**

```
frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';
```

Plus the non-CSP headers the audit lists (`X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options: DENY`, `Strict-Transport-Security`, `Permissions-Policy`), all statically declared
in `next.config.ts` `headers()`, which applies at the response layer and does not affect rendering
mode.

This closes the clickjacking gap the audit names as the practical risk, plus base-tag injection and
form hijacking. A `script-src` / `default-src` policy is explicitly **out of scope**, with the reason
recorded here rather than left as an open "later": it costs the static shell. Revisit only with a
measurement showing the trade is worth it.

### C4 — Two details that make the recommended fixes actually work

- **`ipAddress()` reads `x-real-ip`, and returns `undefined` off Vercel.** The audit's recommendation
  (2.3) is correct, and its signature is `ipAddress(input: Request | Headers): string | undefined`
  (`node_modules/@vercel/functions/headers.d.ts:95`), which accepts the `Headers` returned by
  `await headers()` directly. But `node_modules/@vercel/functions/headers.js:58-61` reads only
  `x-real-ip`, which nothing sets in local development or a self-hosted container. The helper needs
  an explicit fallback chain — `x-real-ip`, then the first entry of `x-forwarded-for`, then
  `"unknown"` — or every local request shares one bucket. Note the fallback takes the **first**
  entry, not `.pop()`: the audit is right that the current `.pop()` is wrong, but the replacement
  must be the client-most entry, not the proxy-most.
- **Better Auth's database rate-limit storage never deletes rows.** The table is
  `{ id, key (unique), count, lastRequest (bigint) }`
  (`node_modules/@better-auth/core/dist/db/get-tables.mjs:33-56`), keyed by IP and path, and the
  database backend only ever upserts. So the cleanup job the audit asks for in 2.9 must prune
  `rateLimit` as well as `session` and `verification`, or the fix for 2.2's memory leak becomes a
  disk leak.

Two smaller corrections, recorded so nobody re-derives them:

- The audit lists `middleware.ts` among the missing App Router conventions (3.5). In Next.js 16 that
  convention is **deprecated and renamed to `proxy.ts`**
  (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md`). This
  application needs neither; its absence is correct, and no task creates one.
- The audit reasons that `.pop()` on `x-forwarded-for` collapses to one address "behind Vercel's
  frontend" (2.3). On Vercel `x-forwarded-for` normally carries a single client entry, so the
  practical failure is narrower than stated — but the fix is right for a different reason: `x-real-ip`
  is the header Vercel actually guarantees, and it is what `ipAddress()` reads.

## Decisions

Settled with the user before writing the plans. Each changes what gets built.

- **D1 — Rate limiting: narrow the surface plus one durable limiter.** As C1. Chosen over
  "two limiters sharing a store" and over the audit's literal text.
- **D2 — Passwords: minimum 8, no composition rules.** `minPasswordLength: 8`; the
  letter-and-digit regexes come out. This follows NIST SP 800-63B, which advises against
  composition rules. Existing passwords keep working: the rule is enforced only at registration and
  password reset. A Have I Been Pwned breach check was considered and declined — it puts a
  third-party network call in the registration path and needs its own timeout and
  fail-open/fail-closed decision.
- **D3 — Email: templates now, transport unchanged.** Add `@react-email/components`, move the
  verification and reset messages into templates with an HTML body and a plain-text fallback. The
  `sendEmail` interface in `src/lib/email/client.ts` does not change, nodemailer/SMTP stays, and the
  `EMAIL_CAPTURE_FILE` E2E interception keeps working untouched. Moving to Resend later becomes a
  swap of one module. Deliverability and the Gmail App Password limit remain a known, accepted risk.
- **D4 — Marketing statistics: removed.** "10,000+ subscribers", "48% avg. open rate" and
  "5,000+ community members" are placeholders. `partnerStats` and the "Trusted by 10,000+ modern
  professionals" line come out, replaced by copy that makes no numeric claim.
- **D5 — Legal pages: engineering-drafted, flagged for review.** `/terms` and `/privacy` are created
  so the links in `auth-card-shell.tsx:53,60` stop pointing at `/`. Their content is limited to what
  is true of this application and derivable from its code: the service is free, the data held is
  name / email / avatar, sessions are rows in Postgres, and how to request deletion. **Assumption,
  stated explicitly: this is not legal advice and needs a lawyer's review before public launch.**
  The alternative — deleting the links — was rejected because the consent line belongs on a sign-up
  form.
- **D6 — Pending verification address travels in a cookie, not a query parameter.** The audit (§6)
  notes `/verify-email` makes the user retype their address. The fix sets a short-lived, `httpOnly`,
  `sameSite: "lax"` cookie at registration and reads it on `/verify-email`. A query parameter would
  put an email address in browser history, server logs and any `Referer` header — the exact leak the
  uniform-response work elsewhere in this codebase exists to prevent.
- **D7 — Five plans, not one.** Thirty-six tasks in one plan would exceed `max_review_cycles`
  before delivery. Five plans means five ledger cycles and five commits, each independently
  reviewable and revertible.

## Out of scope, with reasons

Recorded so a reviewer does not read these as omissions:

- **`script-src` / `default-src` CSP.** See C3. Costs the static shell.
- **The `deepmerge-ts` advisory (GHSA-ggr8-5vv4-36mx, 3 × high).** Reaches the tree only through
  `prisma` → `@prisma/config`, a dev-time CLI dependency that never enters the runtime bundle.
  Downgrading to `prisma@6.12.0` is a functional regression. Phase 4 documents the acceptance and
  adds the CI step that will surface a patch when one lands upstream.
- **Major version upgrades** — `eslint` 9→10, `typescript` 5.9→7.0, `prisma` 7→8-rc,
  `@types/node` 20→26 beyond what pinning the Node version requires. Each is its own spec. Phase 4
  takes the safe minors only (`lucide-react`, `shadcn`, `react-hook-form`, `zod`).
- **`@upstash/ratelimit`.** Made unnecessary by D1: the `rateLimit` table is already a shared,
  durable store, and adding Redis would add an external dependency for no gain.
- **Resend.** See D3.
- **OpenTelemetry.** Phase 4 adds structured logging with `pino`, which needs no account and no
  vendor. Tracing is a separate decision.

## Risks

- **`cacheComponents` is the highest-risk change in the set.** It is a rendering-model change that
  touches every route. It is the last task of phase 2 for that reason, behind a green build, and it
  is the one task most likely to need a second review cycle.
- **`disabledPaths` will 404 anything that later calls Better Auth's HTTP API from the browser.**
  That is the intent, but it is a trap for a future developer reaching for `better-auth/client`.
  Phase 3's rewritten `auth-architecture.md` must state it as an invariant, not a footnote.
- **`session.cookieCache` delays session revocation by up to `maxAge`.** A deliberate trade, and
  phase 3 records it in `auth-architecture.md` — which matters here because the audit found the
  existing document claiming the opposite of the truth about revocation (1.1, line 109).
- **The Prettier pass in phase 4 produces a very large diff.** It ships as its own commit,
  formatting only, so the review of every other task stays readable.

## Traceability

Every finding in `docs/audit-2026-08-31.md`, and where it is answered. "Accepted" means the finding
is real and the decision is to not change the code; the reason is in `## Out of scope` or `## Decisions`.

| #    | Finding                                                                         | Phase | Task                                       |
| ---- | ------------------------------------------------------------------------------- | ----- | ------------------------------------------ |
| 1.1  | `auth-architecture.md` describes the pre-Better-Auth app                        | 3     | 1                                          |
| 1.2  | `README.md` — title, structure, secret-rotation instruction, missing `npm test` | 3     | 2                                          |
| 1.3  | `nextjs-research.md` written for Auth.js v5                                     | 3     | 3                                          |
| 2.1  | Rate limiting bypassed by one HTTP request                                      | 1     | 1, 3                                       |
| 2.2  | In-memory limiter: per-instance, unbounded key growth                           | 1     | 2                                          |
| 2.3  | IP derived with `.pop()` on `x-forwarded-for`                                   | 1     | 2                                          |
| 2.4  | `resetPasswordAction` has no limit                                              | 1     | 2                                          |
| 2.5  | No security headers                                                             | 1     | 4                                          |
| 2.6  | `BETTER_AUTH_URL` / no `trustedOrigins`                                         | 1     | 5                                          |
| 2.7  | Google provider registered unconditionally                                      | 1     | 6                                          |
| 2.8  | Password policy below current guidance                                          | 2     | 3                                          |
| 2.9  | `session` / `verification` grow without bound                                   | 1     | 1, 7                                       |
| 2.10 | Personal IP in `next.config.ts`                                                 | 1     | 4                                          |
| 3.1  | Every route renders dynamically                                                 | 2     | 6                                          |
| 3.2  | Session `SELECT` on every request                                               | 2     | 4                                          |
| 3.3  | `Viewer` carries no `id` or `emailVerified`                                     | 2     | 1                                          |
| 3.4  | Two divergent validation systems                                                | 2     | 3                                          |
| 3.5  | No `error` / `not-found` / `loading` conventions                                | 2     | 5                                          |
| 3.6  | FAQ content split between `content.ts` and the page                             | 5     | 7                                          |
| 4.1  | Profile always says "Provider: Google"                                          | 2     | 2                                          |
| 4.2  | Decorative layers broken in the light theme                                     | 5     | 1                                          |
| 4.3  | Dead code (`.sl-faq-*`, `clearMailbox`, `Geist_Mono`, two unused vars)          | 5     | 3                                          |
| 4.4  | E2E Prisma pool never destroyed                                                 | 4     | 7                                          |
| 5.1  | Everything dynamic                                                              | 2     | 6 (same as 3.1)                            |
| 5.2  | Session `SELECT` per request                                                    | 2     | 4 (same as 3.2)                            |
| 5.3  | React Compiler runs through Babel                                               | 2     | 7                                          |
| 5.4  | `Geist_Mono` loaded and never used                                              | 5     | 3                                          |
| 5.5  | Three `blur(90–100px)` layers on every public page                              | 5     | 2                                          |
| 6    | No `<main>` on `/`, `/features`, `/pricing`                                     | 5     | 4                                          |
| 6    | No skip link                                                                    | 5     | 4                                          |
| 6    | `<footer>` only on `/`                                                          | 5     | 4                                          |
| 6    | Terms / Privacy links point at `/`                                              | 5     | 6                                          |
| 6    | No per-page `metadata` on three public pages                                    | 5     | 5                                          |
| 6    | No `metadataBase`, `openGraph`, `twitter`, OG image                             | 5     | 5                                          |
| 6    | No `robots.ts` / `sitemap.ts`                                                   | 5     | 5                                          |
| 6    | No `prefers-reduced-motion`                                                     | 5     | 2                                          |
| 6    | `/verify-email` makes the user retype their address                             | 5     | 8                                          |
| 6    | Unsubstantiated marketing statistics                                            | 5     | 7                                          |
| 7.1  | `npm audit` — 3 high via `prisma` CLI                                           | 4     | 10 (accepted, monitored)                   |
| 7.1  | Safe minor upgrades outstanding                                                 | 4     | 1                                          |
| 7.1  | `@types/node` 20 against Node 26; no `engines`, no `.nvmrc`                     | 4     | 1                                          |
| 7.2  | No CI                                                                           | 4     | 9                                          |
| 7.2  | No unit tests                                                                   | 4     | 4                                          |
| 7.2  | No Prettier; style already diverged                                             | 4     | 3                                          |
| 7.2  | Environment variables validated by `Boolean(...trim())`                         | 4     | 5                                          |
| 7.2  | Emails are plain-text string literals                                           | 5     | 9                                          |
| 7.2  | Gmail SMTP as production transport                                              | —     | Accepted (D3)                              |
| 7.2  | No accessibility testing                                                        | 4     | 8                                          |
| 7.2  | No shared rate-limit store                                                      | 1     | 2 (via the `rateLimit` table, not Upstash) |
| 7.2  | Telemetry is two `console.error` calls                                          | 4     | 6                                          |
| 7.3  | `target: "ES2017"`                                                              | 4     | 2                                          |
| 7.3  | No `noUncheckedIndexedAccess`                                                   | 4     | 2                                          |
