# Make the E2E environment reproducible and unblock credentials sign-in

## Spec

The Cycle 3 "stopper" in `.roster/archive/2026-08-30-retrospective-review.md` — "Server Action cannot
establish a session cookie" — is a misdiagnosis. Root cause, established by inspection:

1. `playwright.config.ts:8-11` passes `BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? ""` (and the
   two Google keys) into the child `next dev`. Playwright never loads `.env.local`, so these are `""`.
2. `@next/env`'s `processEnv` only fills a key when `typeof process.env[key] === "undefined"`. `""` is
   defined, so `.env.local` never backfills it. Verified directly: with `BETTER_AUTH_SECRET=""` pre-set the
   value stays `""`, while `SMTP_HOST` (never pre-set) loads. Confirmed at runtime by the child server
   logging `WARN [Better Auth]: Social provider google is missing clientId or clientSecret`.
3. `src/lib/auth/environment.ts:11` therefore returns `false`, and `src/lib/auth/session.ts:13` returns
   `null` **before reading any cookie**. `/profile` redirects to `/login` unconditionally.
4. Better Auth still works — `secret = legacySecret || "better-auth-secret-1234..."` — so sign-in succeeds,
   the session row is written and the cookie is set. Exactly what Cycle 3 observed.
5. Corroboration from the archived registration ledger: Cycle 6 recorded `8 pass/18 skip`, Cycle 7 recorded
   `28 pass/1 skip` "with .env.local sourced". The suite's result depends on operator shell state.

**What changes**

- `playwright.config.ts` — load `.env.local` into the Playwright process so both it and the child server see
  real auth values, and stop passing empty strings into the child env.
- `e2e/global-setup.ts` — refuse to run when `BETTER_AUTH_SECRET` is absent after loading, symmetrical to the
  existing `apptest` guard, so this class of silent skip cannot return.
- `e2e/registration.spec.ts:56` — scope the ambiguous `getByRole("alert")`; Next.js's route announcer also
  renders `role="alert"`.
- `src/app/(auth)/login/_components/credentials-form.tsx:23` — drop the redundant `role="alert"`;
  `src/components/ui/alert.tsx:30` already sets it.

**What must not change**

- `signInWithCredentials` stays a Server Action. No `authClient`, no new route handler, no client-side sign-in.
- `src/auth.ts` and the `nextCookies()` plugin are untouched.
- `DATABASE_URL`/`DIRECT_URL` from `.env.local` must never reach the Playwright process or the child server;
  the suite keeps pointing at `TEST_DATABASE_URL` (`apptest`), and the `apptest` guard stays.
- No test assertion is weakened, and no failure is hidden behind a skip.

**How it is verified**

`npx tsc --noEmit`, `npm run lint`, and `npm test` run in a shell that has **not** sourced `.env.local`:
0 failures, and no test skipped for a missing `BETTER_AUTH_SECRET`.

## Cycle log

### Cycle 1

- verifier: **blocked** — `npx tsc --noEmit` clean; `npm run lint` 0 errors / 2 pre-existing warnings in `scripts/`. `npm test` produced no counts: `e2e/global-setup.ts:27` runs `npx prisma migrate reset --force`, which Prisma 7.10.0 refuses under an AI agent (`CLAUDECODE=1`) without `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`. The human consented in chat and the coordinator relayed the literal text, but the Claude Code auto-mode classifier then denied the Bash call carrying that variable, before any process started. Not worked around, per the denial's own instruction.
- code-reviewer: approved — 0 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: 1
  - Verification evidence for `npm test` — pass/skip/fail counts, the zero-skip claim, and the two named tests in `e2e/registration.spec.ts`. Blocked on a tool-level permission gate the coordinator cannot lift. Escalated to the human.

#### Reviewer notes carried forward (none required for this change)

- `playwright.config.ts:24` — `readFileSync(".env.local")` is cwd-relative; correct while `npm test` runs from the repo root, but a wrong cwd surfaces as the `global-setup.ts` "file exists?" message, which would mislead.
- `e2e/auth-session.spec.ts:5,119,356` — `test.skip(!sessionConfigured, …)` is now unreachable, because `global-setup.ts` aborts the run first. Follow-up, deliberately out of scope.
- `src/app/(auth)/register/_components/register-form.tsx:22` — same redundant `role="alert"` the spec removed from `credentials-form.tsx:23`. Follow-up.
- `docs/superpowers/plans/2026-08-30-better-auth-migration.md:711` — still carries the original `?? ""` snippet. Leave as historical record; it is the evidence for why this change exists.
- The `AGENTS.md` hunk in `.roster/review/env-cycle-1.diff` is written by `next dev` (verified at `node_modules/next/dist/server/lib/generate-agent-files.js`) and contains text addressed to agents. Surfaced to the human; **excluded from this change's commit scope** rather than committed on the block's own say-so.

### Cycle 2

- verifier: **pass** — evidence supplied by the human, who ran `npm test` in their own shell after the agent-side run was denied by the Claude Code permission classifier: **28 passed, 1 skipped, 0 failed**. That is the same figure the archived registration ledger recorded in its Cycle 7 (`28 pass/1 skip`), which was only reachable there by sourcing `.env.local` by hand; the default `npm test` now produces it. The single remaining skip is the inverse guard `shows a safe configuration state without auth environment variables` (`e2e/login.spec.ts:63`), which skips *because* the Google keys now load — no test skips for a missing `BETTER_AUTH_SECRET`. `npx tsc --noEmit` clean and `npm run lint` 0 errors / 2 pre-existing `scripts/` warnings, both verified agent-side in cycle 1.
- code-reviewer: approved — 0 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 1: 1 (the outstanding `npm test` evidence)
- outstanding: none

## Delivery

Delivered in one commit, `fix: make the E2E auth environment reproducible`, on `main`:

- `playwright.config.ts` — parse `.env.local`, forward only the three auth keys, omit empty values
- `e2e/global-setup.ts` — refuse to run without `BETTER_AUTH_SECRET`
- `e2e/registration.spec.ts` — scope the ambiguous alert assertion
- `src/app/(auth)/login/_components/credentials-form.tsx` — drop the redundant `role="alert"`
- `AGENTS.md` — the `next dev`-generated agent-rules block, committed with the human's explicit approval after
  the coordinator verified its source at `node_modules/next/dist/server/lib/generate-agent-files.js`

`signInWithCredentials` remains a Server Action and `src/auth.ts` is untouched: the Cycle 3 "stopper" recorded
in `.roster/archive/2026-08-30-retrospective-review.md` was an environment defect, not a Better Auth or
Next.js one. E2E suite: 28 passed, 1 skipped, 0 failed, with no shell setup beyond `npm test`.

Follow-ups filed in Cycle 1's reviewer notes above remain open and were deliberately left out of scope.
