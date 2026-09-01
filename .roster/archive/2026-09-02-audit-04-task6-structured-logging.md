# Audit remediation Phase 4 — infrastructure & tooling (Task 6: Structured logging)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-04-infrastructure.md` — Task 6.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 6 answers audit finding 7.2.

What changes:
- Install `pino` as runtime dependency (`npm install pino`).
- Create `src/lib/logger.ts`: structured logger wrapper with pino.
- Replace `console.error` / `console.info` in server code:
  - `src/auth.ts`: structured error logs for sendVerificationEmail and sendResetPassword failures.
  - `src/lib/auth/rate-limit.ts`: structured error log for database failure (fail-closed path).
  - `src/app/api/cron/cleanup/route.ts`: structured info log for prune counts.
  - `src/app/error.tsx`: client-safe error telemetry (ensuring no server-only leak).
- Add unit tests for logger and updated error paths if appropriate.

What must not change:
- Invariant: NEVER log credentials. No password, no token, no reset URL, and no email in anti-enumeration contexts. Log event, not subject.
- Server/client separation: `src/lib/logger.ts` if server-only must not break client builds or `src/app/error.tsx`.
- Existing function signatures and return types must not change.

How it is verified:
- `npm run test:unit` passes.
- `npm run test:agents` passes.
- `npm run build` succeeds.
- `npx tsc --noEmit`
- `npm run lint`
- `npm run format:check`
- `npm run check:agents`
- Grep git diff for passwords, tokens, reset URLs, or emails to ensure zero sensitive data leakage.
- `npm test` (Playwright E2E) is human-gated — report un-run.

## Cycle log

### Cycle 1
- verifier: pass — test:unit(54/54)/test:agents(44/44)/build/tsc/lint/format:check/check:agents all green; npm test not run (human-gated)
- code-reviewer: approved_with_notes — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
