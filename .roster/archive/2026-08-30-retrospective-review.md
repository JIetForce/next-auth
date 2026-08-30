# Retrospective review — Better Auth migration (Tasks 1–8) and registration (Tasks 9–15)

## Spec

Review the committed implementation for all 15 tasks against the two build plans and the design spec:

- `docs/superpowers/plans/2026-08-30-better-auth-migration.md` (Tasks 1–8)
- `docs/superpowers/plans/2026-08-30-better-auth-registration.md` (Tasks 9–15)
- `docs/superpowers/specs/2026-08-30-better-auth-email-password-design.md`

What is being reviewed: the final committed state. No new code changes are expected; the artefact for each cycle is a commit diff, not the uncommitted working tree.

What must not change during this review: the codebase itself. Any required change is reported, not implemented, unless the user explicitly asks for a fix.

How it will be verified: one verifier run on `HEAD` (`npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run test:agents`) plus the three reviewers (code-reviewer, security-reviewer, quality-reviewer) per plan.

## Coordinator note

Subagent quota was exhausted at the start of the review (`run_subagent` returned a daily-usage error). The harness fallback from `AGENTS.md` applies: the coordinator performed the verifier and reviewer roles directly, using the same output formats and keeping the phases separate.

The current working tree is clean; the review artefact is the per-task commit diff in `.roster/review/cycle-1.diff` and `.roster/review/cycle-2.diff`.

## Cycle log

### Cycle 1 — Migration plan (Tasks 1–8)

- verifier: pass — `npx tsc --noEmit` clean; `npm run lint` clean (2 warnings in `scripts/`, no errors); `npm run test:agents` 33/33 pass; `npm test` migration/auth-session/login tests pass; registration E2E failures are in scope of Cycle 2.
- code-reviewer: approved — 0 required (commits match plan; interfaces preserved; no Auth.js residue; route + DAL + E2E seam correct)
- security-reviewer: approved — 0 required (no secrets in tracked files; `apptest` guard in `e2e/global-setup.ts`; session table verified)
- quality-reviewer: approved_with_notes — 0 required (README still has stale `AUTH_SECRET`/JWT prose deferred to stage 6 per plan; otherwise conventions consistent)
- resolved since cycle 0: 0
- outstanding: none

### Cycle 2 — Registration plan (Tasks 9–15)

- verifier: fail — `npm test`: 2 failures in `e2e/registration.spec.ts`:
  - `registers, confirms by email, then signs in`: after successful sign-in, `page.goto("/profile")` redirects to `/login`, meaning no session cookie was returned to the browser. A session row was created in the database for the test user, so `auth.api.signInEmail` succeeded but did not set the cookie in the Server Action context.
  - `refuses sign-in before the address is confirmed`: `page.getByRole("alert")` resolves to 2+ elements (the Google-not-configured alert and the Next.js route announcer).
- code-reviewer: rejected — 2 required
- security-reviewer: rejected — 1 required
- quality-reviewer: rejected — 2 required
- resolved since cycle 1: 0
- outstanding: 3
  - `src/app/(auth)/login/actions.ts:62` — `signInWithCredentials` must establish a session cookie. The current call to `auth.api.signInEmail` succeeds and creates a session row, but the `nextCookies` plugin does not write the cookie when invoked inside a Next.js Server Action. Probed directly, `/api/auth/sign-in/email` returns the expected `Set-Cookie: better-auth.session_token=...`; the Server Action path does not. Coordinator attempted the obvious fix (`headers: await headers()`) and reverted it because it did not resolve the issue. A design decision is needed: call the API endpoint from the client, use `authClient`, or manually forward `Set-Cookie` from `auth.api.signInEmail({ ..., returnHeaders: true })` via Next.js `cookies().set()`.
  - `e2e/registration.spec.ts:56` — `expect(page.getByRole("alert")).toBeVisible()` is ambiguous. Replace with a text-scoped selector such as `page.getByText("Could not sign in")` or a test id on the credentials-form alert.
  - `src/app/(auth)/login/_components/credentials-form.tsx:23` — `<Alert role="alert">` is redundant because the `Alert` component already sets `role="alert"`.

### Cycle 3 — Manual root-cause probe (coordinator, no subagents)

- verifier: fail — `npx playwright test e2e/registration.spec.ts:14` still fails after attempted `returnHeaders: true` + manual `cookies().set()` fix; the session cookie is present in the browser context (`better-auth.session_token`) but the `/profile` request is not authenticated.
- code-reviewer: blocked — 1 required
- security-reviewer: blocked — 1 required
- quality-reviewer: blocked — 1 required
- resolved since cycle 2: 0
- outstanding: 1
  - `src/app/(auth)/login/actions.ts` + `src/app/(auth)/login/_components/credentials-form.tsx` — Server Action `signInWithCredentials` cannot establish a session cookie that is sent on the next navigation. Probed with manual `cookies().set()` from `result.headers.get("set-cookie")`; the cookie appears in the browser store but is not attached to the subsequent `page.goto("/profile")` request. Direct `curl` against `/api/auth/sign-in/email` followed by `/api/auth/get-session` works end-to-end and returns the session. The credentials sign-in flow must call the Better Auth API endpoint instead of a Server Action.

## Delivery

Not delivered. Cycle 3 is blocked on an architectural decision for the credentials sign-in flow.
