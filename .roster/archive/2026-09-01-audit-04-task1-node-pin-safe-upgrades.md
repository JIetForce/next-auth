# Audit remediation Phase 4 — infrastructure & tooling (Task 1: Pin Node version and safe upgrades)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-04-infrastructure.md` — Task 1.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 1 answers audit finding 7.1.

What changes:
- `.nvmrc`: create pinning to Node 26 (matching active runtime v26.7.0).
- `package.json`:
  - Add `"engines": { "node": ">=26.0.0" }`.
  - Raise `@types/node` from `^20` to `^26`.
  - Take safe minor upgrades:
    - `lucide-react`: `^1.37.0` -> `^1.38.0`
    - `shadcn`: `^4.19.0` -> `^4.19.1`
    - `react-hook-form`: `7.86.0` -> `7.87.0`
    - `zod`: `4.4.3` -> `4.5.4`
- Update `package-lock.json` via `npm install`.

What must not change:
- Major versions out of scope remain untouched: `eslint` (stay v9), `typescript` (stay v5), `prisma` (stay v7), `@prisma/*` (stay v7).
- Roster tooling, agent profiles, tests, Server/Client separation, auth behavior.
- Generated agent profiles are not touched.

How it is verified:
- `npm install`
- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run test:agents`
- `npm run check:agents`
- `npm test` (Playwright) is human-gated — report un-run.

## Cycle log

### Cycle 1
- verifier: pass — build/tsc/lint/test:agents/check:agents all green; .nvmrc and package.json verified; npm test not run (human-gated)
- code-reviewer: approved_with_notes — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
