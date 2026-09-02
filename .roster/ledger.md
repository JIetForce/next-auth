# Instant navigation and caching architecture — Task 4: /register streams behind Suspense

## Spec

Plan: `docs/superpowers/plans/2026-09-02-instant-navigation-cache-architecture.md` — Task 4.
Design spec: `docs/superpowers/specs/2026-09-02-instant-navigation-cache-architecture-design.md`.

Task 4, per the plan (full code there): restructure
`src/app/(auth)/register/page.tsx` — delete the `instant = false` export and
its comment; static AuthCardShell frame (badge/title/description unchanged);
`<Suspense fallback={<AuthContentSkeleton />}>` around `RegisterContent`
(session check → redirect `/`; `isGoogleAuthConfigured()`; RegisterForm;
Separator block; GoogleSignInForm; badges; sign-in link — original body
moved verbatim). Consumes `AuthContentSkeleton` from Task 3.

What must not change: `src/lib/auth/session.ts`; redirect semantics
(authenticated → `/`); form behavior; metadata; GoogleSignInForm import path
(`../login/_components/google-sign-in-form`).

How it is verified: `npx playwright test e2e/instant-navigation.spec.ts
e2e/registration.spec.ts` — instant spec 4/4 green; registration flows green
(register, confirm by email, refuse unconfirmed sign-in, duplicate-address
reply). Plus standard suites (build, tsc, lint 0 warnings, test:unit,
test:agents, check:agents, format:check).

Security-relevant paths touched: `src/app/(auth)/register/page.tsx` (session
read + redirect moved behind a Suspense boundary; env-configuration read kept
inside the boundary).

Out of scope (already decided):
- Route markers `◐` steady state (Task 1).
- Per-link prefetching; TanStack Query; full DAL (design spec).

## Cycle log

### Cycle 1

- developer: restructured /register per the plan (static AuthCardShell + Suspense around RegisterContent; instant = false removed; original body verbatim); no amendments needed
- verifier: pass — build OK (all page routes ◐), tsc clean, lint 0 warnings, unit 98/98, check:agents in sync, format:check clean, test:agents 55/56 (known environmental: devin CLI auth), combined e2e 11/11 (instant 4/4, registration 7/7), zero cookie/pool/context errors
- coordinator-run suite: none
- reviewer: approved — 0 required, 0 notes
- security-reviewer: approved — 0 required (shell free of session/config state; redirect fires before any form content; body moved verbatim; no new streamed data)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved with zero required changes. Committed.
