# Auth route split, shared shell, and password reset

## Spec

docs/superpowers/specs/2026-08-31-auth-navigation-password-reset-design.md
Plan: docs/superpowers/plans/2026-08-31-auth-navigation-password-reset.md
Tasks 1–2 delivered (commits fe4fa9c, 63dbd0f). Resuming at Task 3.

## Cycle log

### Cycle 1 (Task 3: Reset-password UI)

- verifier: pass — build exit 0, lint exit 0
- code-reviewer: approved — 0 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: changes_requested — 1 required (isValidPassword duplicated)
- outstanding: extract isValidPassword to shared module

### Cycle 2 (Task 3: Reset-password UI — extraction)

- verifier: pass — build exit 0, lint exit 0
- code-reviewer: approved (source-based) — 0 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: blocked on diff access, confirmed extraction correct — 0 required
- resolved since cycle 1: 1 (isValidPassword extracted to src/lib/auth/validation.ts)
- outstanding: none
