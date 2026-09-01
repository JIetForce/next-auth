# Audit remediation Phase 2 — Task 5: App Router error and not-found conventions

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-02-architecture.md` — Task 5.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 5 answers audit finding 3.5: No error / not-found / loading conventions.

What changes:

- Create: `src/app/error.tsx` — client component taking { error, reset }, branded Siftloom visual language, "Try again" button wired to reset, log via useEffect, show error.digest never error.message.
- Create: `src/app/global-error.tsx` — must render own <html> and <body>, minimal, dependency-free.
- Create: `src/app/not-found.tsx` — branded 404 with link home.
- Create: `src/app/(main)/loading.tsx` and `src/app/(auth)/loading.tsx` — reusing Skeleton as header.tsx:50 does.
- The practical case: session.ts:15 lets Better Auth errors propagate — the error boundary now covers getCurrentViewer's throw path, so a Postgres outage renders a branded page instead of Next's default.

What must not change:

- Existing routes, behaviour, and E2E specs.
- The "why" comments in existing code.
- Roster tooling green.

How it is verified:

- `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm run test:agents`, `npm run check:agents` all green.
- 404 renders: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/definitely-not-a-route` (requires dev server — report if not run).
- `npm test` (Playwright) is human-gated.

## Cycle log

### Cycle 1

- verifier: pass
- code-reviewer: approved_with_notes — 0 required; noted reset() vs retry() (Next 16 uses retry), global-error imports globals.css (not strictly dependency-free)
- security-reviewer: approved_with_notes — 0 required; confirmed error.digest only, no XSS, no sensitive data in not-found
- quality-reviewer: changes_requested — 2 required: (1) error.tsx use retry() not reset(), (2) (main)/loading.tsx missing overflow-hidden

### Cycle 2

- verifier: pass
- code-reviewer: approved_with_notes — 0 required; confirmed retry() and overflow-hidden fixes
- security-reviewer: approved (empty output, no issues)
- quality-reviewer: changes_requested — 1 required: (auth)/loading.tsx has extra p-4 sm:p-6 padding causing layout shift; (global-error.tsx use shared components request overruled by coordinator — plan requires dependency-free)
- resolved since cycle 1: 2 (retry() and overflow-hidden)

### Cycle 3

- verifier: pass
- code-reviewer: approved_with_notes — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: changes_requested — 2 required: (1) (auth)/loading.tsx should match AuthCardShell structure (CardHeader/CardContent/CardFooter classes), (2) global-error.tsx should use shared Card/Button (overruled by coordinator — dependency-free is a plan requirement)
- resolved since cycle 2: 1 (auth loading padding removed, shadow classes aligned)

### Cycle 4

- verifier: pass
- code-reviewer: approved_with_notes — 0 required; noted Skeleton alignment on mobile could use mx-auto sm:mx-0
- security-reviewer: approved_with_notes — 0 required; confirmed error.digest only, no new attack surface
- quality-reviewer: approved_with_notes — 0 required; confirmed AuthCardShell structure match; noted CardTitle should wrap h1 for a11y, shared shell component would reduce drift
- resolved since cycle 3: 1 (auth loading structure aligned with AuthCardShell)
- outstanding: none
- delivery: committed as `feat(app): add error, not-found, and loading conventions for branded error handling`
