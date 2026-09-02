# Instant navigation and caching architecture — Task 8: full verification sweep and route-table check

## Spec

Plan: `docs/superpowers/plans/2026-09-02-instant-navigation-cache-architecture.md` — Task 8.
Design spec: `docs/superpowers/specs/2026-09-02-instant-navigation-cache-architecture-design.md`.

Task 8 (verification only, no source changes):
- `grep -rn "instant = false" src/` — expected: no matches.
- `npm run build` — expected: succeeds; paste the route table into this
  ledger; all page routes `◐` (Partial Prerender — correct steady state),
  none regressed to `ƒ`.
- Static suites: `npx tsc --noEmit`, `npm run lint` (0 warnings),
  `npm run test:unit`, `npm run test:agents` (known environmental failure:
  devin CLI auth), `npm run check:agents`, `npm run format:check`.
- Full e2e `npm test` — human-gated: report un-run if the human has not run
  it after the last commit.
- Coordinator final commit: empty-scope check that the working tree is clean.

What must not change: nothing — this task changes no source.

How it is verified: this task IS verification; its deliverable is the
evidence recorded below.

Security-relevant paths touched: none

Out of scope (already decided):
- Local worker pinning for the 4-worker contention flake (Task 2 ledger):
  decide only if the human-gated full run flakes; CI runs 1 worker.

## Cycle log

### Cycle 1

- verifier: pass — working tree clean of source changes (only this ledger + transient .roster/review/ untracked); grep confirms zero instant = false in src/; build OK with the full route table below; tsc clean; lint 0 warnings; unit 98/98; check:agents in sync; format:check clean; test:agents 55/56 (known environmental: devin CLI auth — surfaced to the human, fix is `devin auth login`); npm test human-gated — un-run-pending-human
- coordinator-run suite: none
- reviewer: not applicable (verification-only task, no diff to review)
- security-reviewer: not applicable (security-relevant paths: none)
- resolved since cycle 0: 0
- outstanding: human-gated npm test

### Delivery

Route table at delivery (all page routes ◐, only /api/* dynamic):

```
Route (app)
┌ ◐ /
├ ○ /_not-found
├ ƒ /api/auth/[...all]
├ ƒ /api/cron/cleanup
├ ◐ /features
├ ◐ /login
├ ◐ /pricing
├ ◐ /privacy
├ ◐ /profile
├ ◐ /register
├ ◐ /reset-password
├ ○ /robots.txt
├ ○ /sitemap.xml
├ ◐ /terms
└ ◐ /verify-email
```

All plan tasks 1-7 delivered with approved verdicts; Task 8 evidence above.
Remaining: human runs `npm test` (50 existing + 4 instant tests expected green).
