# Unified header on auth pages

## Spec

Replace the custom `<header>` block in `src/app/(auth)/layout.tsx` (lines 10–28) with the shared `<Header />` component from `src/components/header.tsx`. Add `import { Header } from "@/components/header";`. Remove the now-unused imports `Link` from `next/link` and `ModeToggle` (neither is used elsewhere in the file). The `<main>` with ambient background, grid, `AuthShowcase`, and `{children}` stays unchanged. No changes to `header.tsx`, `header-account.tsx`, or `(main)/layout.tsx`.

Verification: `npm run lint` and `npm run build` pass; `npx playwright test --workers 1` passes (including `e2e/login.spec.ts` and `e2e/auth-session.spec.ts`).

## Cycle log

### Cycle 1

- verifier: pass — lint, build, `npx playwright test --workers 1` (36 passed, 1 pre-existing skip)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved — 0 required
- resolved since cycle 0: n/a
- outstanding: none
- delivered: committed `src/app/(auth)/layout.tsx` + `.roster/ledger.md`
