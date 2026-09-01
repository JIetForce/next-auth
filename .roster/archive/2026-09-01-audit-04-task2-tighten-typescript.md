# Audit remediation Phase 4 — infrastructure & tooling (Task 2: Tighten TypeScript configuration)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-04-infrastructure.md` — Task 2.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 2 answers audit finding 7.3.

What changes:
- `tsconfig.json`:
  - `target`: `"ES2017"` -> `"ES2022"`.
  - Add `"noUncheckedIndexedAccess": true`.
- Narrowing fixes (strictly narrowing, no `!` assertion additions):
  - `src/components/user-avatar.tsx`: safe indexing of `words[0]` and `words.at(-1)`.
  - `src/lib/auth/rate-limit.ts`: narrow `rows[0]` after query.
  - `e2e/auth-session.spec.ts`: tuple typing for input entries `as const` / `[string, string][]`.

What must not change:
- No new `!` non-null assertions; all flagged issues resolved by narrowing.
- User initials algorithm logic and rate limiting behaviour remain unchanged.
- Generated agent profiles remain untouched.

How it is verified:
- `npx tsc --noEmit` clean (0 errors).
- `npm run build`
- `npm run lint`
- `npm run test:agents`
- `npm run check:agents`
- `npm test` (Playwright E2E) is human-gated — report un-run.

## Cycle log

### Cycle 1
- verifier: pass — build/tsc/lint/test:agents/check:agents all green; target ES2022 and noUncheckedIndexedAccess verified; tsc clean (0 errors); npm test not run (human-gated)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
