# Header redesign + Features/Pricing pages

## Spec

Plan task plus link to plan: `docs/superpowers/plans/2026-08-31-header-redesign-features-pricing.md` (Task 1: Header redesign with centered nav and brand active pill). Full spec: `docs/superpowers/specs/2026-08-31-header-redesign-features-pricing-design.md`.

## Cycle log

### Cycle 1 (Task 1: header redesign)

- verifier: pass — lint, build, e2e auth-session+login (28 passed, 1 pre-existing skip)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required (notes: isActive duplication, primaryLinks export unused externally, relative/absolute coupling)
- resolved since cycle 0: n/a
- outstanding: none
- delivered: committed header-nav.tsx, header.tsx, mobile-navigation.tsx
