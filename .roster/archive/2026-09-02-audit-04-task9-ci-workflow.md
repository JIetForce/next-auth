# Audit remediation Phase 4 — infrastructure & tooling (Task 9: The CI workflow)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-04-infrastructure.md` — Task 9.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 9 answers audit finding 7.1.

What changes:
- Create `.github/workflows/ci.yml`:
  - Triggers on pull request and push to `main`.
  - Uses `node-version-file: ".nvmrc"` and `cache: "npm"`.
  - Runs `npm ci`.
  - Environment for build: dummy `DATABASE_URL` and `BETTER_AUTH_SECRET` (build-time validation).
  - Steps in order:
    1. `npm run format:check`
    2. `npm run check:agents`
    3. `npm run validate:agents`
    4. `npm run test:agents`
    5. `npm run test:unit`
    6. `npm run lint`
    7. `npx tsc --noEmit`
    8. `npm run build`
    9. `npm audit --audit-level=high` (`continue-on-error: true` as non-blocking monitor for accepted dev dependencies)
  - Explicit comment documenting omission of `npm test` in CI (Playwright requires real Postgres, migrations, and SMTP capture; treated separately to avoid flaky CI).

What must not change:
- Existing package scripts must not be broken or renamed.
- All gates must remain blocking except the non-blocking audit step.

How it is verified:
- `npm run test:unit` passes.
- `npm run test:agents` passes.
- `npm run build` succeeds.
- `npx tsc --noEmit`
- `npm run lint`
- `npm run format:check`
- `npm run check:agents`
- Local simulation of all workflow steps in order.
- `npm test` (Playwright E2E) is human-gated — report un-run.

## Cycle log

### Cycle 1
- verifier: pass — test:unit(54/54)/test:agents(44/44)/build/tsc/lint/format:check/check:agents all green; npm test not run (human-gated)
- code-reviewer: rejected — 1 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: approved — 0 required
- resolved since cycle 0: 0
- outstanding:
  - .github/workflows/ci.yml: schedule build (which runs prisma generate) before tsc, lint, and test:unit to ensure generated prisma client exists on fresh checkout

### Cycle 2
- verifier: pass — test:unit(54/54)/test:agents(44/44)/build/tsc/lint/format:check/check:agents all green; permissions and build step ordering verified; npm test not run (human-gated)
- code-reviewer: approved — 0 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 1: 1
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
