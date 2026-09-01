# Audit remediation — Phase 3: Documentation

> **For agentic workers:** this repository's operating contract is `AGENTS.md`. The developer does
> **not** commit.

**Goal:** close `docs/audit-2026-08-31.md` §1. Three documents describe an application that no longer
exists, and one of them declares itself the source of truth while asserting the opposite of the truth
about session revocation.

**Spec:** `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`

**Architecture:** `docs/auth-architecture.md` is rewritten from the code, not edited line by line —
the invariants changed, not the wording. `README.md` is corrected where it is wrong and extended
where it is silent. `docs/nextjs-research.md` is marked historical rather than deleted, because it is
dated research and its conclusions explain decisions still visible in the code.

**Depends on:** phases 1 and 2, whose decisions this phase documents. Running it earlier produces a
document that is stale on arrival.

## Global Constraints

- The developer does **not** commit.
- **Every claim in these documents must be verified against the code before it is written.** That is
  the entire failure mode being fixed. Cite `file:line` for each invariant.
- Do not delete `docs/audit-2026-08-31.md` or `docs/superpowers/` history.
- Write in English, matching the surrounding documentation.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `docs/auth-architecture.md` | Source of truth for authentication | Rewrite from scratch |
| `README.md` | Project entry point | Modify |
| `docs/nextjs-research.md` | Historical research | Add banner |

---

### Task 1: Rewrite `docs/auth-architecture.md`

Answers 1.1.

**Files:**
- Rewrite: `docs/auth-architecture.md`

- [ ] **Step 1: Read the audit's table at §1.1** — eleven specific false statements, with line
  numbers. It is the checklist for what the old document got wrong, not the source for the new one.

- [ ] **Step 2: Read the code.** `src/auth.ts`, `src/lib/auth/*`, `src/app/(auth)/**`,
  `src/app/api/auth/[...all]/route.ts`, `prisma/schema.prisma`, `e2e/helpers/auth-test-instance.ts`.
  The new document is written from these files.

- [ ] **Step 3: Delete the old file's content entirely and write a new one.** The audit is explicit
  that line-by-line patching is the wrong approach: the invariants changed, not the phrasing. Cover:

  - **Stack:** `better-auth@1.7.2` with `prismaAdapter`, sessions as rows in Postgres. Not
    `next-auth`, not JWT cookies, not "no database adapter".
  - **Providers:** email + password *and* Google, with `accountLinking` enabled and
    `trustedProviders: ["google"]`, `requireLocalEmailVerified: true` (`src/auth.ts:66-72`).
  - **Environment variables:** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`,
    `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, `DIRECT_URL`, SMTP variables, `CRON_SECRET`,
    `NEXT_DEV_ALLOWED_ORIGIN`. The old names (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
    do not exist. Neither does `AUTH_TRUST_HOST` — that whole section described an Auth.js option.
  - **Route:** `src/app/api/auth/[...all]/route.ts`, not `[...nextauth]`.
  - **Session revocation — correct the inversion.** The old line 109 claimed there is no central
    revocation and a new design would be needed. Sessions are rows, they are revocable, and
    `revokeSessionsOnPasswordReset: true` is already on (`src/auth.ts:18`). Someone reading that line
    would have built a redundant layer.
  - **The sections that never existed:** registration, email verification, password reset, email
    dispatch, rate limiting. The audit puts this at roughly 60% of the current auth surface.
  - **The phase 1 invariant, stated as an invariant:** `disabledPaths` means Better Auth's HTTP
    credential endpoints return 404 and the Server Actions are the only door. Explain *why* — the
    rate limiter runs only in the router's `onRequest` hook, so an open HTTP endpoint bypasses every
    per-action limit — and say plainly that adding a `better-auth/client` call will 404 until its
    path is removed from that list.
  - **The phase 2 trade-off:** `session.cookieCache` with `maxAge: 300` means revocation takes effect
    with up to five minutes of delay. Deliberate, and recorded here rather than rediscovered.
  - **Testing:** `e2e/helpers/auth-test-instance.ts` seeds a **real database session** through
    `testUtils()`. The old document described JWT encoding via `next-auth/jwt` and an
    `authjs.session-token` cookie; neither exists.

- [ ] **Step 4: Keep the "source of truth" claim, and earn it.** Add a line saying every statement is
  cited to `file:line` and that a change to those files is a change to this document.

- [ ] **Step 5: Verify.** Re-read the finished document against the code and confirm every cited
  `file:line` resolves. List in `### Test results` any claim you could not verify, rather than
  leaving it in the text.

---

### Task 2: Fix `README.md`

Answers 1.2.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: The title.** Line 1 says `# next-auth`. `package.json` says `agent-roster-web`. The
  application is branded Siftloom. Three names for one thing. Pick one for the heading — Siftloom, as
  the user-facing name — and note the package name beneath it.

- [ ] **Step 2: The project structure block (lines 22-37).** It shows a flat `src/app/layout.tsx` and
  `page.tsx` and describes `components/` and `lib/` as "create as needed". Reality: route groups
  `(main)` and `(auth)`, `api/auth/[...all]`, and both directories long since populated. Regenerate
  it from the tree.

- [ ] **Step 3: The secret-rotation instruction (line 99) is actively wrong.** Every clause of it:
  `no matching decryption secret` is a `jose`/Auth.js message Better Auth never emits; the endpoint is
  `/api/auth/sign-out` with a hyphen, POST only, with no confirmation page, so a GET to
  `/api/auth/signout` 404s; and sessions are rows in `session`, not JWTs. After phase 1, `/sign-out`
  is in `disabledPaths` and 404s regardless. Replace with what is actually true: rotating
  `BETTER_AUTH_SECRET` invalidates the signed session cookies, and the user signs in again — there is
  nothing to visit.

- [ ] **Step 4: The command table.** Add `npm test` (Playwright E2E — note it needs a local Postgres
  and does not run unattended), plus whatever phase 4 added: `npm run test:unit`, `npm run format`,
  `npm run format:check`.

- [ ] **Step 5: The routes.** Lines 40-50 document every roster script and not one application route.
  Add `/`, `/features`, `/pricing`, `/login`, `/register`, `/verify-email`, `/reset-password`,
  `/profile`, and the pages phase 5 adds.

- [ ] **Step 6: Verify.** Run every command in the table and confirm it exists. Follow the structure
  block against `find src -type f`. Report any line you could not verify.

---

### Task 3: Mark `docs/nextjs-research.md` historical

Answers 1.3.

**Files:**
- Modify: `docs/nextjs-research.md`

- [ ] **Step 1: Add a banner at the top**, before any other content: this document was written for a
  stack the project no longer uses — Auth.js v5 (`next-auth@beta`) — during the evaluation that
  preceded the move to Better Auth. It is kept as a record of that evaluation. For current
  authentication behaviour, read `docs/auth-architecture.md`.

- [ ] **Step 2: Fix the currency claim.** Line 3 says "Актуальность: август 2026", which reads as
  current. Change it to a written-on date. Keep the rest of the 834 lines: the audit's recommendation
  is to mark it, not to delete it, and its Next.js 16 research is still sound even where its auth
  research is not.

- [ ] **Step 3: Verify.** Confirm no other document links to it as current guidance:

```bash
grep -rn "nextjs-research" --include=*.md . | grep -v node_modules
```

---

## Phase exit

- [ ] `npm run build && npx tsc --noEmit && npm run lint && npm run test:agents && npm run check:agents` — all green (this phase should not affect any of them; if it does, something other than documentation changed).
- [ ] Every `file:line` citation in `docs/auth-architecture.md` resolves.
- [ ] Coordinator commits, appends the delivery line to `.roster/ledger.md`, archives it.
