# Fix bare AUTH_SECRET references in README.md

## Spec

Bounded change. In `README.md`, rename the two bare `AUTH_SECRET` references to `BETTER_AUTH_SECRET` so the docs match what the app actually reads (`src/lib/auth/environment.ts:11` → `process.env.BETTER_AUTH_SECRET`).

- README.md:88 — `Copy the command output into \`AUTH_SECRET\`.`→`…into \`BETTER_AUTH_SECRET\`.`
- README.md:99 — `Keep \`AUTH_SECRET\` stable across restarts and deployments.`→`Keep \`BETTER_AUTH_SECRET\` stable…`

What must not change: everything else in README.md (env block at line 66 already uses BETTER_AUTH_SECRET; surrounding JWT/signout prose on line 99 is a separate stale-terminology concern, deferred). No changes to `docs/`, source, or `.env.example`.

Verification: `git diff` shows exactly two one-word substitutions; `npm run lint` and `npx tsc --noEmit` stay clean (sanity, no source touched); no `npm test` (Playwright gated for agents).

## Cycle log

### Cycle 1

- verifier: pass — `git diff --stat` shows 2 insertions/2 deletions on README.md only; `npm run lint` 0 errors (2 pre-existing warnings in scripts/, unrelated); `npx tsc --noEmit` clean; npm test not run (Playwright gated for agents, owner's to run)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required (1 note: stale JWT/signout prose on README.md:99 is pre-existing and out of scope for this spec; same staleness affects docs/auth-architecture.md as a separate task)
- resolved since cycle 0: n/a (first cycle)
- outstanding: none
