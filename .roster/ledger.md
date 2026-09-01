# Audit remediation Phase 2 — Task 2: Profile shows the real provider

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-02-architecture.md` — Task 2.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 2 answers audit finding 4.1: Profile always says "Provider: Google". Depends on Task 1 (viewer.id).

What changes:

- `src/app/(main)/profile/page.tsx`: replace hard-coded `<dd>Google</dd>` with a dynamic provider label read from the Account table via Prisma. A user can have multiple linked accounts (accountLinking enabled), so render ALL linked providers. Map providerId to label: `credential` -> "Email and password", `google` -> "Google", anything else -> raw providerId.
- Possibly create: `src/lib/auth/accounts.ts` — a `server-only` helper that reads accounts for a given userId via Prisma, so the page stays a view.
- Handle empty case: render "Not available" if no account row exists; the page must not 500.
- `e2e/auth-session.spec.ts`: update the provider assertion. The current test at :183 asserts `getByText("Google", { exact: true })` — the hard-coded text. The E2E test user is created via `ctx.test.createUser` which creates a User but NOT an Account row. The developer must resolve this: either create a credential Account row in the test helper so the assertion can check "Email and password", or adjust the assertion to match what the test user actually has.

What must not change:

- The page stays a view — DB access goes in a server-only helper.
- Uniform anti-enumeration responses, server/client separation, roster tooling green.
- Existing E2E specs keep passing (E2E is human-gated; report un-run).

How it is verified:

- `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm run test:agents`, `npm run check:agents` all green.
- `npm test` (Playwright) is human-gated — report un-run.

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/test:agents(33/33)/check:agents(35 profiles) all green; npm test not run (human-gated)
- code-reviewer: approved_with_notes — 0 required; noted "Provider" singular label vs comma-separated list, sort by providerId not label, no dedup of duplicate providerIds
- security-reviewer: approved_with_notes — 0 required; confirmed server-only, providerId-only select, userId bound to authenticated session, raw providerId for unknown providers is not a secret leak
- quality-reviewer: approved_with_notes — 0 required; noted stale docstring on addAuthenticatedSession, sort by providerId not label, "credential" hardcoded in two places
- outstanding: none — all notes are non-blocking; the plan does not require dedup, label-sorting, or a shared constant. The stale docstring is a minor issue that Phase 3's doc rewrite does not cover (it's a code comment, not a doc file), but it's non-blocking for this task.
- delivery: committed as `feat(profile): show the real linked account provider(s) instead of hard-coded Google`
