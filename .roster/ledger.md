# Instant navigation and caching architecture — Task 5: /reset-password streams its whole shell behind Suspense

## Spec

Plan: `docs/superpowers/plans/2026-09-02-instant-navigation-cache-architecture.md` — Task 5.
Design spec: `docs/superpowers/specs/2026-09-02-instant-navigation-cache-architecture-design.md`.

Task 5, per the plan (full code there): restructure
`src/app/(auth)/reset-password/page.tsx` — delete the `instant = false`
export and its comment; the page becomes `<Suspense
fallback={<AuthCardSkeleton />}>` around `ResetPasswordContent` (async:
session check → redirect `/`; `token` branch of searchParams; the
corresponding AuthCardShell — "Set a new password" with ResetPasswordForm vs
"Reset your password" with ForgotPasswordForm). The WHOLE shell streams
because the two branches render different titles/badges. Consumes
`AuthCardSkeleton` from Task 3.

What must not change: `src/lib/auth/session.ts`; redirect semantics
(authenticated → `/`); both branches' copy, forms, and links; metadata.

How it is verified: `npx playwright test e2e/instant-navigation.spec.ts
e2e/reset-password.spec.ts` — instant spec 4/4 green; reset-password flows
green (request reset → open link → set password → sign in; unregistered
address identical reply). Plus standard suites (build, tsc, lint 0 warnings,
test:unit, test:agents, check:agents, format:check).

Security-relevant paths touched: `src/app/(auth)/reset-password/page.tsx`
(session read + redirect moved behind a Suspense boundary; token handled
inside the boundary — passed to ResetPasswordForm as before, never logged).

Out of scope (already decided):
- Route markers `◐` steady state (Task 1).
- Per-link prefetching; TanStack Query; full DAL (design spec).

## Cycle log

### Cycle 1

- developer: restructured /reset-password per the plan (whole shell streams — Suspense fallback={AuthCardSkeleton} around ResetPasswordContent with the token branch; instant = false removed); no amendments needed
- verifier: pass — build OK (all page routes ◐), tsc clean, lint 0 warnings, unit 98/98, check:agents in sync, format:check clean, test:agents 55/56 (known environmental: devin CLI auth), combined e2e 7/7 (instant 4/4, reset-password 3/3), zero cookie/pool/context errors
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required; 2 informational notes (branch bodies verbatim vs HEAD; the last remaining instant = false is /verify-email — Task 6's scope)
- security-reviewer: approved — 0 required (fallback state-free; redirect before any form; token handled no worse than before — boundary-internal, prop-only, never reflected; no open-redirect surface)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved/approved_with_notes with zero required changes. Committed.
