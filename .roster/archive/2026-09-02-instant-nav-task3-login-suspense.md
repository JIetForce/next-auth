# Instant navigation and caching architecture — Task 3: /login streams behind Suspense; shared auth skeletons

## Spec

Plan: `docs/superpowers/plans/2026-09-02-instant-navigation-cache-architecture.md` — Task 3.
Design spec: `docs/superpowers/specs/2026-09-02-instant-navigation-cache-architecture-design.md`.

Task 3, per the plan (full code there):
- Create `src/app/(auth)/_components/auth-content-skeleton.tsx` (AuthContentSkeleton — content-rows fallback, reused by Tasks 4 and 6).
- Create `src/app/(auth)/_components/auth-card-skeleton.tsx` (AuthCardSkeleton — full-card fallback, reused by Task 5); body moved verbatim from the current `(auth)/loading.tsx`.
- `src/app/(auth)/loading.tsx` becomes a one-line render of AuthCardSkeleton.
- Restructure `src/app/(auth)/login/page.tsx`: delete `instant = false`; static AuthCardShell frame; `<Suspense fallback={<AuthContentSkeleton />}>` around `LoginContent` (session check → redirect `/`, searchParams handling — verify redirect + error alerts, `isGoogleAuthConfigured()`, both forms, links). Exact code in the plan.

What must not change: `src/lib/auth/session.ts`; redirect semantics (authenticated → `/`, `verify` → `/verify-email`); error-alert copy and conditions; form behavior; metadata.

How it is verified: `npx playwright test e2e/instant-navigation.spec.ts e2e/login.spec.ts` — all four instant tests green (the /login one flips); all login.spec tests green. Plus standard suites (build, tsc, lint 0 warnings, test:unit, test:agents, check:agents, format:check).

Security-relevant paths touched: `src/app/(auth)/login/page.tsx` (session read + redirects moved behind a Suspense boundary; env-configuration read kept inside the boundary so it is not baked into the prerendered shell).

Out of scope (already decided):
- Route markers `◐` steady state (Task 1).
- Per-link prefetching (no shell depends on URL data; searchParams content is inside the boundary).
- TanStack Query / full DAL (design spec).

## Cycle log

### Cycle 1

- developer: created AuthContentSkeleton + AuthCardSkeleton, loading.tsx refactored, login page restructured per the plan; flagged two issues
- coordinator amendment 1: aria-hidden moved to per-Skeleton in AuthContentSkeleton (repo convention, matching Task 2's standardization); instant spec serialized via test.describe.configure({ mode: "serial" }) — the instant() helper's releaseInstantCookie raced closed browser contexts under fullyParallel workers (3 client-nav instant tests failed at 4 workers with "Failed to find browser context"; all green at 1 worker and, after the fix, at default workers across two consecutive runs)
- verifier: pass — build OK (all page routes ◐), tsc clean, lint 0 warnings, unit 98/98, check:agents in sync, format:check clean, test:agents 55/56 (known environmental: devin CLI auth), combined e2e at default workers ×2 runs: 13 passed + 2 env-gated skips, all four instant tests green including /login, zero cookie/pool errors
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required; 2 notes, both plan-document sync fixes, applied (AuthContentSkeleton example now per-Skeleton aria-hidden; Task 3 Files/commit scope now includes e2e/instant-navigation.spec.ts)
- security-reviewer: approved — 0 required (static shell is configuration- and session-blind; redirects fire before any sensitive content; error alerts provider-agnostic; verify redirect fixed-destination, no open redirect; serial mode tightens test isolation)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved/approved_with_notes with zero required changes. Committed.
