# Contain the unhandled verification-email rejection and clear three review follow-ups

## Spec

Four bounded defects, all identified earlier and deliberately left out of the E2E-environment change's scope.

1. **`src/auth.ts:23`** — `void sendEmail({...})` has no rejection handler. When the transport fails, the
   promise rejects unhandled: Next logs `⨯ unhandledRejection`, and Node's default outside dev is to
   terminate the process, so an SMTP outage takes the server down. Observed live on 2026-08-30 as
   `connect ECONNREFUSED ::1:1025`. The `void` itself is required by the design spec
   (`docs/superpowers/specs/2026-08-30-better-auth-email-password-design.md:130` — response time must not
   reveal whether an address exists) and stays. What is missing is a `.catch()` that logs the failure
   server-side and swallows it, satisfying spec line 192's "never silently drops a verification message".

2. **`e2e/auth-session.spec.ts:5,119-122,356-359`** — `sessionConfigured` and both
   `test.skip(!sessionConfigured, …)` guards are unreachable: `e2e/global-setup.ts` now throws when
   `BETTER_AUTH_SECRET` is absent, before any spec file evaluates. Dead code that misrepresents how the suite
   behaves. Remove the const and both guards.

3. **`src/app/(auth)/register/_components/register-form.tsx:22`** — redundant `role="alert"`;
   `src/components/ui/alert.tsx:30` already sets it. Same fix already applied at `credentials-form.tsx:23`.

4. **`playwright.config.ts:24`** — `readFileSync(".env.local", …)` is cwd-relative. Anchor it to the config
   file's own directory, so a run from a subdirectory cannot silently fall back to `{}` and surface as
   global-setup's misleading "check that the file exists" message.

**What must not change**

- The `void` dispatch semantics in `src/auth.ts`: the send must still not be awaited, and no HTTP response or
  Server Action return value may change. Enumeration resistance is preserved.
- `googleAuthEnvironmentKeys` / `googleConfigured` in `e2e/auth-session.spec.ts:8-15` and the `googleConfigured`
  guards in `e2e/login.spec.ts` — Google credentials remain genuinely optional.
- `playwright.config.ts`'s forwarded key set and the `DATABASE_URL`/`DIRECT_URL` boundary.

**How it is verified**

`npx tsc --noEmit` and `npm run lint` clean, and `npm test` at or above the current baseline of
28 passed / 1 skipped / 0 failed. The `npm test` run is performed by the human: `e2e/global-setup.ts` calls
`prisma migrate reset --force`, which Prisma refuses under an AI agent and which the harness permission
classifier also denies — see `.roster/archive/2026-08-30-e2e-environment-fix.md`, Cycle 1.

## Cycle log

### Cycle 1

- verifier: **partial** — `npx tsc --noEmit` clean; `npm run lint` 0 errors / 2 pre-existing `scripts/` warnings. `npm test` not run agent-side: `e2e/global-setup.ts` calls `prisma migrate reset --force`, refused by Prisma under an AI agent and by the harness permission classifier on the consent variable. Awaiting the human's run against the 28 passed / 1 skipped / 0 failed baseline.
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 4 (all four spec'd defects implemented)
- outstanding: 1
  - `npm test` evidence from the human.

#### Findings worth recording

- The PII question the code-reviewer raised on `src/auth.ts:37` was traced to ground by the security-reviewer:
  nodemailer never puts `SMTP_USER` or `SMTP_PASSWORD` on its error objects — only the auth *method* name and
  the server's own response text (`node_modules/nodemailer/lib/smtp-connection/index.js:803,816-818`). The
  recipient address can appear via `error.recipient` on an `RCPT TO` rejection (same file, 1671-1673), which
  the operator already holds in the database. Safe as written.
- `void sendEmail({...}).catch(...)` — `.catch()` binds tighter than `void`, so the whole chain is still
  fire-and-forget and the spec's timing requirement (design spec line 130) is intact.
- Design spec line 192 ("fails loudly … never silently drops") describes the *awaited* missing-config path.
  A configured-but-unreachable transport was not covered by the design; this change handles it. No doc update.

#### Follow-ups still open (not this spec's scope)

- `googleAuthEnvironmentKeys` (`e2e/auth-session.spec.ts:7-11`, `e2e/login.spec.ts:3-7`) still lists
  `BETTER_AUTH_SECRET`, which is now always true by the time it is evaluated — a no-op third of the check.
- The same two arrays plus `forwardedAuthKeys` (`playwright.config.ts:36-40`) are a three-way duplication.
- `console.error` at `src/auth.ts:37` is the repo's only server-side error log. A second one is the point to
  introduce a logging wrapper.

#### Outside the change, for the owner

- `.env.example` is modified in the working tree and is **not** part of this change: the owner edited it by
  hand at 23:33:34 while filling in SMTP credentials, removing `EMAIL_CAPTURE_FILE=""` and its comment. Two
  lines removed, none added — no secret was leaked into the tracked file. The key is also now absent from
  `.env.local`, which is functionally equivalent to empty. Restoring it is the owner's call; excluded from
  this change's commit scope either way.

### Cycle 2

- verifier: **pass** — `npm test` run by the human in their own terminal, output read directly: **28 passed, 1 skipped, 0 failed** in 23.3s, 29 tests over 4 workers. Exactly the baseline. The single skip is `shows a safe configuration state without auth environment variables` (`e2e/login.spec.ts:63`), which skips *because* the Google keys load — the inverse guard behaving correctly. `npx tsc --noEmit` clean and `npm run lint` 0 errors / 2 pre-existing `scripts/` warnings, verified agent-side in cycle 1.
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 1: 1 (the outstanding `npm test` evidence)
- outstanding: none

Noted from the run, not defects in this change:

- `WARN [Better Auth]: Base URL is not set` fires four times per run. The lines carry no `[WebServer]` prefix,
  so they come from the Playwright process, not the app: `e2e/helpers/auth-test-instance.ts:20` builds
  `testAuth` without a `baseURL`, and `BETTER_AUTH_URL` is only forwarded to the child server. Harmless noise;
  a follow-up could give `testAuth` a `baseURL`.
- `testAuth` now signs its fixture cookies with the real `BETTER_AUTH_SECRET`, because `playwright.config.ts`
  puts it in the Playwright process's own env. Previously it fell back to Better Auth's default secret. Both
  sides moved together, which is why the fixture still validates against the app.

## Delivery

Delivered in one commit, `fix: contain verification-email transport failures and clear review follow-ups`, on
`main`: `src/auth.ts`, `e2e/auth-session.spec.ts`,
`src/app/(auth)/register/_components/register-form.tsx`, `playwright.config.ts`.

`.env.example` was left out of the commit scope: its working-tree edit is the owner's own, made while filling
in SMTP credentials, and its disposition is an open question with them.
