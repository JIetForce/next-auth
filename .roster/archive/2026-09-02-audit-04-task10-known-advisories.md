# Audit remediation Phase 4 — infrastructure & tooling (Task 10: Record the accepted advisory)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-04-infrastructure.md` — Task 10.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 10 answers audit finding 7.1.

What changes:
- In `README.md`, add a "Known advisories" section documenting:
  - `deepmerge-ts <8.0.0` (GHSA-ggr8-5vv4-36mx) via `prisma` -> `@prisma/config` -> `deepmerge-ts`.
  - `mysql2 <3.22.0` (GHSA-3f6p-5ww8-9rcr) via `prisma` -> `mysql2`.
  - Both vulnerabilities reside exclusively in the `prisma` CLI developer tooling and never enter runtime or production bundles.
  - Fix would require downgrading to Prisma 6, which is a breaking functional regression.
  - Decision: accepted and monitored via non-blocking `npm audit --audit-level=high` step in CI workflow.

What must not change:
- Existing documentation sections in `README.md` must not be corrupted or removed.

How it is verified:
- `npm run test:unit` passes.
- `npm run test:agents` passes.
- `npm run build` succeeds.
- `npx tsc --noEmit`
- `npm run lint`
- `npm run format:check`
- `npm run check:agents`
- Verify documentation accurately reflects current `npm audit` output.
- `npm test` (Playwright E2E) is human-gated — report un-run.

## Cycle log

### Cycle 1
- verifier: pass — format:check/check:agents/test:agents/test:unit/lint/tsc/build all green; README.md advisory documentation verified; npm test not run (human-gated)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
