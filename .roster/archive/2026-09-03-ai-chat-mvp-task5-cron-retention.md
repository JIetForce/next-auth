# Siftloom AI Chat MVP — Task 5: Cron retention aligned with 24h chat windows

## Spec

Architectural path. Spec: `docs/superpowers/specs/2026-09-03-ai-chat-mvp-design.md`.
Plan: `docs/superpowers/plans/2026-09-03-ai-chat-mvp.md` (Task 5).

### What changes:
- Modify `src/app/api/cron/cleanup/route.ts`:
  - Widen `RATE_LIMIT_MAX_AGE_MS` from `60 * 60 * 1000` to `24 * 60 * 60 * 1000` (`24 * 60 * 60 * 1000`).
  - Update comment to document alignment with the 24-hour daily quotas for guests (20/day) and users (100/day).

### What must not change:
- Nothing else in `src/app/api/cron/cleanup/route.ts`.
- The 4 pre-staged documentation files in git index belong to Task 6 and must not be swept into this commit.

### Security-relevant paths touched:
`src/app/api/cron/cleanup/route.ts` (rate-limit retention policy on PostgreSQL database table). Security reviewer required.

### How it will be verified:
`npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:agents && npm run check:agents && npm run format:check`
(Note: `npm run test:agents` has a known pre-existing environmental failure where doctor test calls `devin models list` without login; verified on clean HEAD).

## Cycle log

### Cycle 1 (Task 5 — delivering, full fan-out)

- verifier: pass — 5/6 suites green (`tsc`, `lint`, `test:unit`, `check:agents`, `format:check`); `npm run test:agents` 1/56 fail is the pre-existing environmental failure (`devin models list` needs `devin auth login`, verified on clean HEAD); unit tests 22/22 files passed (122 tests).
- coordinator-run suite: none (verifier ran all 6 suites; environmental failure documented)
- reviewer: approved_with_notes — 0 required
- security-reviewer: approved — 0 required
- resolved since cycle 0: 0
- outstanding: none

**DELIVERED (Task 5) 2026-09-03** — full fan-out cycle 1: reviewer approved_with_notes (0 required), security-reviewer approved (0 required), verifier passed.
Notes carried to human:
- Minor note (reviewer): `RATE_LIMIT_MAX_AGE_MS` is an unexported module-level constant; could export or test cutoff calculation directly when automated tests for cron endpoints are added.
