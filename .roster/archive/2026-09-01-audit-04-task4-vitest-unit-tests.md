# Audit remediation Phase 4 — infrastructure & tooling (Task 4: Vitest and the first unit tests)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-04-infrastructure.md` — Task 4.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 4 answers audit finding 7.2.

What changes:
- Install `vitest` as devDependency (`npm install --save-dev vitest`).
- Create `vitest.config.ts` configuring Vitest to collect from `src/**/*.test.ts(x)` only, with `@/` path alias mapped to `./src`, excluding `e2e/` and `tests/`.
- Add script to `package.json`: `"test:unit": "vitest run"`.
- Create unit tests:
  - `src/components/user-avatar.test.ts`: test `getViewerInitials` across all 4 fallback branches (multi-word name, single-word name, email local part fallback, "U" fallback, and multi-byte unicode name).
  - `src/lib/auth/rate-limit.test.ts`: test `consumeRateLimit` against mocked Prisma client (within budget, over budget, window expiry resets count, database error fails closed returning false).
  - `src/lib/auth/schemas.test.ts`: test zod schemas (8-character minimum, no composition rules, email lowercased and trimmed, mismatched confirmation failure path).
  - `src/lib/auth/client-ip.test.ts`: test `getClientIp` (x-real-ip precedence, x-forwarded-for first entry, "unknown" fallback).

What must not change:
- `npm test` remains reserved for Playwright E2E.
- `npm run test:agents` remains `node --test` for agent roster tooling.
- Vitest must not collect from `e2e/` or `tests/`.
- Existing runtime behavior and interfaces must remain unchanged.

How it is verified:
- `npm run test:unit` passes all tests.
- `npm run test:agents` passes (44/44).
- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run format:check`
- `npm run check:agents`
- `npm test` (Playwright E2E) is human-gated — report un-run.

## Cycle log

### Cycle 1
- verifier: pass — test:unit(35/35)/test:agents(44/44)/build/tsc/lint/format:check/check:agents all green; npm test not run (human-gated)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
