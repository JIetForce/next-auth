# Audit remediation Phase 4 — infrastructure & tooling (Task 7: Destroy the E2E Prisma pool)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-04-infrastructure.md` — Task 7.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 7 answers audit finding 4.4.

What changes:
- `e2e/helpers/auth-test-instance.ts`: manage pool/Prisma connection explicitly and export a teardown function (`teardownAuthTestInstance()`) that disconnects Prisma and ends the pool.
- Create `e2e/global-teardown.ts`: default function calling `teardownAuthTestInstance()`.
- `playwright.config.ts`: register `globalTeardown: "./e2e/global-teardown.ts"`.

What must not change:
- Test helper functionality (`testAuth`, `testUtils()`) must remain identical.
- Global setup guard (`/apptest/`) must remain untouched.
- Production database pool in `src/lib/db.ts` must remain untouched.

How it is verified:
- `npm run test:unit` passes.
- `npm run test:agents` passes.
- `npm run build` succeeds.
- `npx tsc --noEmit`
- `npm run lint`
- `npm run format:check`
- `npm run check:agents`
- `npm test` (Playwright E2E) is human-gated; human will be asked to run it and verify clean exit.

## Cycle log

### Cycle 1
- verifier: pass — test:unit(54/54)/test:agents(44/44)/build/tsc/lint/format:check/check:agents all green; npm test not run (human-gated)
- code-reviewer: rejected — 2 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding:
  - e2e/auth-session.spec.ts: wire teardownAuthTestInstance in test.afterAll so worker process pool is closed
  - e2e/helpers/auth-test-instance.ts: wrap prisma.$disconnect in try/finally to guarantee pool.end is executed

### Cycle 2
- verifier: pass — test:unit(54/54)/test:agents(44/44)/build/tsc/lint/format:check/check:agents all green; globalTeardown and test.afterAll verified; npm test not run (human-gated)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 1: 2
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
