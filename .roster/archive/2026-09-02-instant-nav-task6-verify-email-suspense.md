# Instant navigation and caching architecture — Task 6: /verify-email streams behind Suspense

## Spec

Plan: `docs/superpowers/plans/2026-09-02-instant-navigation-cache-architecture.md` — Task 6.
Design spec: `docs/superpowers/specs/2026-09-02-instant-navigation-cache-architecture-design.md`.

Task 6, per the plan (full code there): restructure
`src/app/(auth)/verify-email/page.tsx` — delete the `instant = false` export
and its comment (the LAST one in src/app); static AuthCardShell frame
(badge/title/description unchanged); `<Suspense
fallback={<AuthContentSkeleton />}>` around `VerifyEmailContent` (session
check → redirect `/`; `cookies()` read of `pending_verification_email`;
ResendForm defaultEmail; info box; badges; sign-in link — original body
verbatim). Consumes `AuthContentSkeleton` from Task 3.

What must not change: `src/lib/auth/session.ts`; redirect semantics
(authenticated → `/`); the resend action's identical-reply anti-enumeration
behavior; cookie name and attributes (set by the register action, untouched);
metadata.

How it is verified: `npx playwright test e2e/instant-navigation.spec.ts
e2e/registration.spec.ts` — instant spec 4/4 green; registration flows green
including the pending-address prefill path. Plus standard suites (build, tsc,
lint 0 warnings, test:unit, test:agents, check:agents, format:check).

Security-relevant paths touched: `src/app/(auth)/verify-email/page.tsx`
(session read + redirect moved behind a Suspense boundary; cookies() read
moved inside the boundary).

Out of scope (already decided):
- Route markers `◐` steady state (Task 1).
- Per-link prefetching; TanStack Query; full DAL (design spec).

## Cycle log

### Cycle 1

- developer: restructured /verify-email per the plan (static shell + Suspense around VerifyEmailContent; instant = false removed — the LAST one in src/app); one declared deviation: VerifyEmailContent exported so the existing unit test can target the streamed behavior directly (renderToStaticMarkup of the page resolves only the fallback); unit test updated accordingly
- coordinator amendment 1: applied reviewer note — redirect test now asserts the cookie store was not read before redirect (locks redirect-before-cookie ordering)
- verifier: pass — build OK (all page routes ◐), tsc clean, lint 0 warnings, unit 98/98, check:agents in sync, format:check clean, test:agents 55/56 (known environmental: devin CLI auth), combined e2e 11/11 (instant 4/4, registration 7/7), zero cookie/pool/context errors, grep confirms zero instant = false in src/
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required; notes: export deviation sound (convention-drift caution for future page-level unit tests), dropped shell-text assertions correct, ordering assertion suggested (applied)
- security-reviewer: approved — 0 required (shell state-free; redirect before content; email flows only to ResendForm defaultEmail as before, React-escaped; export creates no new surface — component self-protects and session.ts is server-only)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved/approved_with_notes with zero required changes. Committed.
