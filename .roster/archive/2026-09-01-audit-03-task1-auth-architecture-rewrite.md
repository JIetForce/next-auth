# Audit remediation Phase 3 — documentation (Task 1: Rewrite docs/auth-architecture.md)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-03-documentation.md` — Task 1.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 1 answers audit finding 1.1: `docs/auth-architecture.md` describes the pre-Better-Auth app.

What changes:
- Rewrite `docs/auth-architecture.md` from scratch based on actual live code:
  - Stack: Better Auth 1.7.2 with Prisma adapter and PostgreSQL database sessions (replacing Auth.js v5 JWT cookie model).
  - Providers: Email + password and Google OAuth with account linking (`trustedProviders: ["google"]`, `requireLocalEmailVerified: true` at `src/auth.ts`).
  - Environment variables: Current variables (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, `DIRECT_URL`, SMTP configuration, `CRON_SECRET`, `NEXT_DEV_ALLOWED_ORIGIN`), explicitly noting removal of obsolete `AUTH_*` and `AUTH_TRUST_HOST` variables.
  - Route: `src/app/api/auth/[...all]/route.ts`.
  - Session revocation: Correct the revocation inversion; document database session rows, `revokeSessionsOnPasswordReset: true`, and the 5-minute latency trade-off from `session.cookieCache` (`maxAge: 300`).
  - Missing flows: Document registration, email verification, password reset, transactional email dispatch, and rate limiting.
  - Security invariants: Document `disabledPaths` blocking raw credential HTTP endpoints with 404 to ensure traffic passes through Server Actions where durable rate limiting is enforced.
  - Testing seam: Document `e2e/helpers/auth-test-instance.ts` using `testUtils()` for real database session seeding instead of synthetic JWT cookies.
  - Source of truth: Every invariant and statement must cite `file:line` against current repository code.

What must not change:
- No runtime code (`src/**`), schema, or test files are modified in this task.
- `docs/audit-2026-08-31.md` and `docs/superpowers/**` history remain untouched.
- English language and tone matching project documentation.
- Project architectural invariants (server/client separation, `Viewer` DTO, uniform anti-enumeration responses, roster tooling integrity).

How it will be verified:
- Automated verification:
  `npm run build && npx tsc --noEmit && npm run lint && npm run test:agents && npm run check:agents`
- All `file:line` citations in `docs/auth-architecture.md` verified against current code.
- Playwright E2E (`npm test`) is human-gated; reported un-run.

## Cycle log

### Cycle 1
- verifier: pass — build/tsc/lint/test:agents/check:agents all green; all 188 citations verified; npm test not run (human-gated)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
