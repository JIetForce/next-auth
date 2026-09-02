# Instant navigation and caching architecture — Task 2: /profile streams behind Suspense

## Spec

Plan: `docs/superpowers/plans/2026-09-02-instant-navigation-cache-architecture.md` — Task 2.
Design spec: `docs/superpowers/specs/2026-09-02-instant-navigation-cache-architecture-design.md`.

Task 2, per the plan (full code there): restructure
`src/app/(main)/profile/page.tsx` — delete the `instant = false` export and
its comment; the page renders a static frame (background layers, `Card`
frame, static `CardHeader` with title/description) and one `<Suspense
fallback={ProfileDetailsSkeleton}>` in `CardContent` wrapping `ProfileDetails`
(avatar, name/email/providers list, sign-out form with `border-t` divider —
one streamed unit so an anonymous visitor never sees a "Sign out" flash
before `requireCurrentViewer()` redirects). `CardFooter` and its import are
dropped; `Suspense` and `Skeleton` imports added. Exact code in the plan.

What must not change: `src/lib/auth/session.ts`; redirect semantics
(authenticated → stays, anonymous → `/login`); the sign-out form's server-side
re-validation; metadata block; existing e2e behavior (fields, initials,
logout, a11y).

How it is verified: `npx playwright test e2e/instant-navigation.spec.ts
e2e/auth-session.spec.ts` — both `/profile` instant tests flip green; all
auth-session tests stay green. Plus the standard suites (build, tsc, lint
0 warnings, test:unit, test:agents, check:agents, format:check).

Security-relevant paths touched: `src/app/(main)/profile/page.tsx` (session
read + auth redirect moved behind a Suspense boundary).

Out of scope (already decided):
- Route markers `◐` are the steady state (Task 1, spec out-of-scope).
- TanStack Query / per-link prefetching / full DAL (design spec).

## Cycle log

### Cycle 1

- developer: restructured /profile per the plan (static frame + one Suspense around ProfileDetails; instant = false removed); flagged a parallel-run pool error during combined e2e runs
- coordinator amendment 1: root-caused the pool error — per-file afterAll teardownAuthTestInstance ends the per-worker pg pool for sibling spec files sharing the worker; removed from BOTH instant-navigation.spec.ts (Task 1 code) and auth-session.spec.ts (delivered code), comment documents the lifecycle; verified 6 parallel runs, zero pool errors
- coordinator amendment 2: applied three reviewer notes — skeleton size fidelity (size-10/h-8 match resolved avatar/button), aria-hidden per-Skeleton per repo convention, explanatory comment in instant-navigation.spec.ts
- verifier: pass — build OK (all page routes ◐), tsc clean, lint 0 warnings, unit 98/98, check:agents in sync, format:check clean, test:agents 55/56 (known environmental: devin CLI auth), combined e2e at 4 workers: 22 passed + 1 expected failure (/login instant — Task 3 pending), zero pool errors
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required; 5 notes (3 applied as amendment 2, 1 covered by amendment 1's comment, 1 pre-existing global-teardown quirk — out of scope)
- security-reviewer: approved — 0 required (authorization semantics preserved: redirect fires inside the boundary before any viewer JSX; skeleton is the only anonymous-visible content and carries no session data; no new fields rendered; teardown removal does not weaken cookie isolation — fresh BrowserContext per test)
- resolved since cycle 0: 0
- outstanding: none
- known risk for Task 8: pre-existing dev-server/DB contention flake at 4 workers when auth-session.spec.ts is scheduled first (static /pricing timeout, sign-out hang); clean at 2 workers and with the plan's file order; CI runs 1 worker — decide on local worker pinning at Task 8

### Delivery

All verdicts approved/approved_with_notes with zero required changes. Committed (plan scope + e2e robustness fix as separate commits).
