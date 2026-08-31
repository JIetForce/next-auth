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

### Cycle 2 (Task 1 revision: header width + Sign in active state)

- Spec: Fix three issues — (1) replace empty `container` class with `mx-auto max-w-6xl px-6 lg:px-8` so header content aligns with page content width; (2) extract "Sign in" link into a client `SignInLink` component that uses `usePathname()` to apply the brand pill on `/login`; (3) `HeaderAccount` renders `<SignInLink />` instead of raw `<Link>`.
- Revised per user feedback: active state = bottom underline (`border-b-2 border-primary`), not brand pill. Sign in = plain link matching nav style, not button. Mobile active = `text-primary font-semibold`.
- verifier: pass — lint, build, e2e auth-session+login (28 passed, 1 pre-existing skip)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required (notes: isActive/navLinkClass duplication across 3 files)
- resolved since cycle 1: brand pill → underline, button → plain link, container → max-w-6xl
- outstanding: none
- delivered: committed header-nav.tsx, sign-in-link.tsx, header-account.tsx, header.tsx, mobile-navigation.tsx
