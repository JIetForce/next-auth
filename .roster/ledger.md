# Header redesign + Features/Pricing pages

## Spec

Plan task plus link to plan: `docs/superpowers/plans/2026-08-31-header-redesign-features-pricing.md` (Task 4: e2e header-navigation spec). Full spec: `docs/superpowers/specs/2026-08-31-header-redesign-features-pricing-design.md`.

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

### Cycle 3 (Task 2: /features page)

- verifier: pass — lint, build (/features in route output), e2e (28 passed, 1 skip)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required (notes: category card / CTA banner markup duplicated with home page)
- resolved since cycle 2: n/a
- outstanding: none
- delivered: committed (main)/features/page.tsx

### Cycle 4 (Task 3: /pricing page + shared content extraction)

- verifier: pass — lint, build (/pricing + /features in routes), e2e (28 passed, 1 skip)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: changes_requested → approved (partner stats + FAQ duplication resolved via src/lib/content.ts)
- resolved since cycle 3: extracted partnerStats + sharedFaqs to src/lib/content.ts, both pages consume shared data
- outstanding: none
- delivered: committed (main)/pricing/page.tsx, src/lib/content.ts, (main)/page.tsx

### Cycle 5 (Task 4: e2e header-navigation spec)

- verifier: pass — lint, build, new spec (7 passed), full suite (43 passed, 1 skip)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required (notes: mobile active state not covered by e2e)
- resolved since cycle 4: n/a
- outstanding: none
- delivered: committed e2e/header-navigation.spec.ts
