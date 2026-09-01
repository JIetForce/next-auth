# Audit remediation Phase 4 — infrastructure & tooling (Task 5: Validate the environment at build time)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-04-infrastructure.md` — Task 5.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 5 answers audit finding 7.2 and reinforces 2.6.

What changes:
- Install `@t3-oss/env-nextjs` as runtime dependency (`npm install @t3-oss/env-nextjs`).
- Create `src/env.ts` with validated schema:
  - Required server vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`.
  - Optional server vars: `DIRECT_URL`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, SMTP set (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`), `CRON_SECRET`, `NEXT_DEV_ALLOWED_ORIGIN`, `EMAIL_CAPTURE_FILE`.
- Modify `src/lib/auth/environment.ts` to read from `env`:
  - `isAuthSessionConfigured()` checks `env.BETTER_AUTH_SECRET` and `env.DATABASE_URL`.
  - `isGoogleAuthConfigured()` checks `Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)`.
  - `getPublicBaseUrl()` reads `env.BETTER_AUTH_URL`.
- Modify `next.config.ts` to import `src/env.ts` (enforcing build-time validation) and read `NEXT_DEV_ALLOWED_ORIGIN` from `env`.

What must not change:
- Google OAuth remains genuinely optional: build and runtime must succeed without `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- E2E environment (`playwright.config.ts`) must not be broken; `EMAIL_CAPTURE_FILE` and `TEST_DATABASE_URL` work seamlessly.
- Client/server separation: no secrets exposed to client.

How it is verified:
- `npm run build` succeeds with full `.env.local` / valid environment.
- `BETTER_AUTH_SECRET="" npm run build` fails at build time with descriptive Zod validation error naming `BETTER_AUTH_SECRET`.
- `npm run test:unit` passes.
- `npm run test:agents` passes.
- `npx tsc --noEmit`
- `npm run lint`
- `npm run format:check`
- `npm run check:agents`
- `npm test` (Playwright E2E) is human-gated — report un-run.

## Cycle log

### Cycle 1
- verifier: pass — test:unit(48/48)/test:agents(44/44)/build/tsc/lint/format:check/check:agents all green; BETTER_AUTH_SECRET="" failure verified
- code-reviewer: rejected — 3 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding:
  - src/env.ts:16: replace/include EMAIL_FROM in env schema instead of phantom SMTP_FROM
  - src/env.test.ts:8-36: save and restore process.env in beforeEach/afterEach
  - src/env.test.ts:37: add negative unit test asserting validation failure on missing required env vars

### Cycle 2
- verifier: pass — test:unit(52/52)/test:agents(44/44)/build/tsc/lint/format:check/check:agents all green; npm test not run (human-gated)
- code-reviewer: approved_with_notes — 0 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 1: 3
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
