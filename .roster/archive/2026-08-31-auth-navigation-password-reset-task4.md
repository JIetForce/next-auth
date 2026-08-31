# Auth route split, shared shell, and password reset

## Spec

docs/superpowers/specs/2026-08-31-auth-navigation-password-reset-design.md
Plan: docs/superpowers/plans/2026-08-31-auth-navigation-password-reset.md
Tasks 1–3 delivered (commits fe4fa9c, 63dbd0f, 273d9d1). Resuming at Task 4.

## Cycle log

### Cycle 1 (Task 4: Reset-password E2E test)

- verifier: pass — build exit 0, lint exit 0, E2E 36 passed 1 skipped
- code-reviewer: approved — 0 required
- security-reviewer: changes_requested — 1 required (add negative sign-in with old password)
- quality-reviewer: approved_with_notes — 0 required
- outstanding: add negative sign-in attempt proving old password no longer works

### Cycle 2 (Task 4: Reset-password E2E test — old-password check)

- verifier: pass — build exit 0, lint exit 0, E2E 36 passed 1 skipped
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required (previous required change resolved)
- quality-reviewer: approved — 0 required
- resolved since cycle 1: 1 (negative sign-in with old password added)
- outstanding: none
- delivered: commit pending — test(auth): add E2E coverage of the password reset flow
