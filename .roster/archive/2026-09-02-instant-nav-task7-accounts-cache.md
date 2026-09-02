# Instant navigation and caching architecture — Task 7: tag-based caching for linked-account labels (DAL seed)

## Spec

Plan: `docs/superpowers/plans/2026-09-02-instant-navigation-cache-architecture.md` — Task 7.
Design spec: `docs/superpowers/specs/2026-09-02-instant-navigation-cache-architecture-design.md` (section 4, DAL convention seed).

Task 7, per the plan (full code there): restructure
`src/lib/auth/accounts.ts` — add `import { cacheLife, cacheTag } from "next/cache"`;
create an UNEXPORTED `getLinkedAccountProviderLabelsByUserId(userId)` with
`"use cache"`, `cacheTag(\`accounts:${userId}\`)`, `cacheLife("hours")`,
containing the existing prisma.account.findMany + dedupe + mapping logic;
the exported `getLinkedAccountProviderLabels(userId)` keeps its signature and
delegates to the cached function. `displayNameForProviderId` unchanged.

Convention recorded: pass userId as an argument (never read cookies inside a
plain "use cache" scope), tag `entity:<userId>`, call `updateTag` from the
mutating Server Action when mutation flows exist (none today). Cache keys and
tags are plain text — key only on stable identifiers, never secrets. The
inner function stays unexported — a caller must never pass an arbitrary id;
the exported wrapper is the only door.

What must not change: the exported signature (`Promise<readonly string[]>`);
call sites (profile page); prisma usage; the anti-enumeration and
server-only boundaries elsewhere.

How it is verified: `npx playwright test e2e/auth-session.spec.ts` (providers
render through the cached path — "Email and password" assertion) + `npm run
build`. Plus standard suites (tsc, lint 0 warnings, test:unit, test:agents,
check:agents, format:check). No new unit test: the module thin-wraps Prisma;
a mocked next/cache would test the mock (plan documents this).

Security-relevant paths touched: `src/lib/auth/accounts.ts` (new cache scope
over session-derived data; cache key/tag on userId — stable identifier, no
secrets in keys/tags).

Out of scope (already decided):
- updateTag call sites (no account-mutation flows exist today).
- A full DAL subsystem (design spec).
- Route markers `◐`; per-link prefetching; TanStack Query.

## Cycle log

### Cycle 1

- developer: restructured accounts.ts per the plan (unexported "use cache" inner function, cacheTag accounts:<userId>, cacheLife("hours"); exported wrapper signature preserved); no amendments needed
- verifier: pass — build OK (all page routes ◐), tsc clean, lint 0 warnings, unit 98/98, check:agents in sync, format:check clean, test:agents 55/56 (known environmental: devin CLI auth), e2e auth-session 19/19 (provider label through the cached path)
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required; note: the concrete tag is accounts:<userId> (the spec's entity:<userId> is the generic convention) — future updateTag calls must use accounts:<userId>
- security-reviewer: approved_with_notes — 0 required; notes: the exported wrapper accepts arbitrary userId but the sole call site passes viewer.id from the auth boundary (pre-existing signature, not widened); stale labels ≤1h acceptable (cosmetic data, no authorization depends on it); no secrets in key/tag
- resolved since cycle 0: 0
- outstanding: none
- out-of-scope record (already decided): wrapper signature kept per the approved spec; any FUTURE server action or route handler that calls getLinkedAccountProviderLabels must derive userId from the session (requireCurrentViewer/getCurrentViewer), never accept it from client-influenced input; invalidation tag is accounts:<userId> via updateTag

### Delivery

All verdicts approved/approved_with_notes with zero required changes. Committed.
