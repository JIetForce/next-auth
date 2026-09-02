# Instant navigation and caching architecture — Task 1: instant() test infrastructure

## Spec

Plan: `docs/superpowers/plans/2026-09-02-instant-navigation-cache-architecture.md` — Task 1.
Design spec: `docs/superpowers/specs/2026-09-02-instant-navigation-cache-architecture-design.md`.

Task 1, verbatim from the plan:

- Step 1: `npm install -D @next/playwright@16.3.3` — package.json gains
  `"@next/playwright": "16.3.3"` in devDependencies; no other dependency moves.
- Step 2: in `next.config.ts`, directly below `cacheComponents: true,` add
  `partialPrefetching: true,` (top-level flag, not `experimental`; requires
  `cacheComponents`, already present). The `headers()` block is not touched.
- Step 3: create `e2e/instant-navigation.spec.ts` with four `instant()` tests
  (pricing-instant, profile-instant client nav, profile-shell initial load,
  login-instant anonymous) — exact code in the plan.
- Step 4: run `npx playwright test e2e/instant-navigation.spec.ts` and record
  the red state — expected: the two `/profile` tests and the `/login` test
  FAIL (routes carry `instant = false` and block), `/pricing` PASS.

What must not change: no dependency other than the one added; the CSP/headers
block in `next.config.ts`; `src/lib/auth/session.ts`; behavior of the existing
50-test e2e suite.

How it is verified: `npm run build`, `npx tsc --noEmit`, `npm run lint`
(0 warnings), `npm run test:unit`, `npm run test:agents`,
`npm run check:agents`, `npm run format:check`,
`npx playwright test e2e/instant-navigation.spec.ts` (red state recorded).

Security-relevant paths touched: `next.config.ts` (platform configuration:
partialPrefetching), `package.json` (new dev dependency).

Out of scope (already decided):
- TanStack Query / SWR not adopted (design spec).
- Per-link prefetching not added (design spec).

## Cycle log

### Cycle 1

- developer: implemented Task 1 (install @next/playwright, partialPrefetching flag, e2e/instant-navigation.spec.ts); two coordinator amendments: exact pin via `npm install -D --save-exact` (repo pins framework-coupled deps exactly), and `{ baseURL }` passed to instant() in the initial-load test (verifier caught a structural test defect: instant() could not infer the base URL before first navigation)
- verifier: pass — tsc/lint(0 warnings)/format:check clean; instant spec 1 passed / 3 failed with clean TDD-red reasons (assertion timeouts on blocking routes, not baseURL errors); full pass earlier on this tree: build OK (all page routes ◐ — correct steady state under cacheComponents), unit 98/98, check:agents in sync; test:agents has one pre-existing environmental failure (`devin models list` → Not logged in; devin CLI auth expired, unrelated to the diff — surfaced to the human)
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required; 3 notes, all coordinator-document fixes, applied (spec verification section still said ○; broken markdown between plan Steps 4/5; Task 1 commit scope now includes the amended docs)
- security-reviewer: approved — 0 required (partialPrefetching does not widen the session-leak surface beyond "use cache: private" semantics; @next/playwright@16.3.3 legitimate, dev-only, exact pin sound; no secrets in e2e artifacts)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved/approved_with_notes with zero required changes. Committed.
