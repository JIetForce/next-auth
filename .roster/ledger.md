# Better Auth migration (stages 1–2) — replace Auth.js with Better Auth on Postgres

## Spec

Implement `docs/superpowers/plans/2026-08-30-better-auth-migration.md` (stages 1–2),
written from `docs/superpowers/specs/2026-08-30-better-auth-email-password-design.md`.

Goal: replace Auth.js with Better Auth on a real Postgres database, preserving every
existing user-visible behaviour and every consumer of the auth DAL. Two unchanged
interfaces: the `Viewer` DTO + `getCurrentViewer`/`requireCurrentViewer` in
`src/lib/auth/session.ts`, and the three exports of `e2e/helpers/auth-session.ts`.

Scope: Tasks 1–8 of the plan. Email transport, registration, verification, password
recovery, and the docs/auth-architecture.md rewrite are stages 3–6 and OUT OF SCOPE.

Global constraints (verbatim from plan):
- Pinned exact versions: better-auth@1.7.2, prisma@7.10.0, @prisma/client@7.10.0,
  @prisma/adapter-pg@7.10.0. Never `prisma@latest` (resolves to 8.0.0-rc.12).
- Prisma 7 generator = `prisma-client` (not `prisma-client-js`); `output` required;
  ESM so `moduleFormat = "esm"`.
- Datasource URLs live in `prisma.config.ts`, never inline in `schema.prisma`.
- Run `npx prisma generate` after every schema change (migrate dev does not regen
  into custom output).
- Better Auth CLI is `auth` (`npx auth@latest`); `@better-auth/cli` is stale.
- `nextCookies()` must be the LAST entry in `plugins`.
- `testUtils()` lives in a test-only auth instance, never in `src/auth.ts`.
- `e2e/**` must never be imported from `src/**`.
- `src/lib/auth/types.ts` is not modified by any task.
- `getCurrentViewer` and `requireCurrentViewer` keep their exact signatures.
- No secret value is printed, echoed, committed, or written into a tracked file.
- Better Auth endpoints: GET /api/auth/get-session; POST /api/auth/sign-out;
  POST /api/auth/sign-in/social. Remove /api/auth/providers, /api/auth/csrf,
  /api/auth/session references.
- Session cookie name: `better-auth.session_token`.

What must not change: `src/app/(main)/profile/page.tsx`,
`src/components/header-account.tsx`, `src/components/user-menu.tsx`,
`src/lib/auth/types.ts`. No consumer of the auth DAL exports is edited.

Verification: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run test:agents`
all pass. Google sign-in completes and lands on `/`. Sessions are rows in the
`session` table; deleting a row ends that session.

## Cycle log

### Cycle 1 — Task 1: Disposable Postgres

- verifier: pass — all 7 checks green (commit scope, docker healthy, both psql selects, no secrets in .env.example, tracked despite .gitignore)
- code-reviewer: approved — 0 required
- security-reviewer: approved_with_notes — 0 required (minor: bind ports to 127.0.0.1; .env.example has no !negation in .gitignore)
- quality-reviewer: approved_with_notes — 0 required (minor: fold `!.env.example` into Task 2 .gitignore edit; no test-db var in .env.example, consistent with plan)
- resolved since cycle 0: 0
- outstanding: none
- commit: 930bbee

### Cycle 2 — Task 2: Prisma 7.10 server-only singleton

- verifier: pass — all 10 checks (versions 7.10.0/17.4.2 bare, generated client exists & gitignored, prisma generate loads .env.local, tsc clean, schema/db.ts/config correct)
- code-reviewer: approved — 0 required (verified directUrl removal is faithful Prisma 7; import order sound)
- security-reviewer: approved — 0 required (no secrets committed, no connection-string leakage in errors, .env.local ignored, generated client gitignored)
- quality-reviewer: approved_with_notes — 0 required (idiomatic globalThis singleton, consistent ESM/path-alias/server-only conventions, dotenv banner cosmetic)
- resolved since cycle 1: 2 spec contradictions (directUrl removed in Prisma 7 → url: env("DIRECT_URL"); dotenv loads .env.local not .env → dotenv.config({path: ".env.local"}) + dotenv@17.4.2 devDep)
- outstanding: none
- commit: 1c72570 (amended)
- coordinator note: plan's prisma.config.ts was written for Prisma 6 syntax; corrected to Prisma 7 per official docs. .env.local loading fixed to match Next.js env convention.

### Cycle 3 — Task 1 realignment: remove Docker, use local Postgres

- verifier: pass — docker-compose.yml deleted & untracked, only local Postgres on 5432, appdev+apptest exist with all 5 tables each, .env.example correct
- code-reviewer: approved — 0 required (deletion matches revised plan §53-55, .env.example intact)
- security-reviewer: approved — 0 required (removing Docker narrows port-exposure surface, no secrets committed)
- quality-reviewer: approved_with_notes — 0 required (note: registration plan line 32 says "Modify docker-compose.yml" but file is gone — self-healing at line 44, out of scope this cycle)
- resolved since cycle 2: Docker conflict (plan revised to forbid containerised Postgres beside local; docker-compose.yml removed, apptest created on local Postgres, migration deployed to apptest)
- outstanding: none
- commit: 6bc0d2e
- coordinator note: plan revised by author after cycle 2 — Docker removed, TEST_DATABASE_URL pattern adopted. Tasks 2-3 content already correct; Task 1 realigned. apptest now has schema for E2E (Task 6).

### Cycle 4 — Tasks 4+5: Better Auth route + DAL/actions rewrite (combined)

- verifier: pass — all 12 checks (route handler correct, nextauth deleted, session/environment/actions/login-actions rewritten, tsc clean, lint 0 errors, endpoints 200/null/404, no consumer files modified)
- code-reviewer: approved_with_notes — 0 required (signatures preserved, redirect constants fixed, no spread, cache() preserved)
- security-reviewer: approved — 0 required (no open-redirect, callbackURL fixed "/", signOut checks viewer, Viewer projection safe, no secret leakage)
- quality-reviewer: approved_with_notes — 1 required (login/page.tsx:218 help text names old AUTH_* vars, misdirects users)
- resolved since cycle 3: 0
- outstanding: 1 required — login/page.tsx help text

### Cycle 5 — Tasks 4+5 fix: login help text env var names

- verifier: pass — grep clean (word-boundary), tsc clean, lint 0 errors, new env var names in help text, no consumer files modified
- (reviewers not re-run: sole required change from cycle 4 was a 3-word string fix, trivially verified)
- resolved since cycle 4: 1 (login/page.tsx help text → BETTER_AUTH_SECRET/GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET)
- outstanding: none
- commits: pending (coordinator commits after approval)
- commits: ccde88a (Task 4: route handler), 157df72 (Task 5: DAL + actions + help text)
- coordinator note: cycle-5 developer reformatted login/page.tsx with prettier (unauthorized, violated "only change env var names"). Coordinator restored from ccde88a and applied only the 1-line env var rename. Amended commit now shows 2 insertions/1 deletion for page.tsx instead of 49 lines.

### Cycle 6 — Task 6: E2E seam rebuilt on testUtils plugin

- verifier: pass — all 9 checks (4 files, testUtils not in src/, e2e not imported from src/, exports preserved, tsc clean)
- code-reviewer: approved — 0 required (testUtils in separate instance, cookie name correct, race handling correct, TEST_DATABASE_URL chain correct)
- security-reviewer: approved_with_notes — 0 required (apptest guard is defense-in-depth, no secrets leaked, testUtils not in production, tampered session can't bypass auth)
- quality-reviewer: approved_with_notes — 0 required (relative import path is plan-level inconsistency, catch breadth is plan-specified)
- coordinator-approved deviations: (1) prisma migrate reset --force without --skip-seed/--skip-generate (Prisma 7), (2) TEST_DATABASE_URL import instead of process.env.DATABASE_URL (test workers don't inherit webServer.env)
- outstanding: none
- commits: pending

### Cycle 7 — Task 7: E2E specs adapted to Better Auth endpoints

- verifier: pass — all 12 checks (cookie name, 5 probes repointed, Auth.js endpoints gone, provider test deleted, env vars updated, null normalization, tsc clean, lint 0 errors, 25 passed/1 skipped/0 failed)
- code-reviewer: approved_with_notes — 0 required (deviations sound, all repointing correct, null preservation correct)
- security-reviewer: approved_with_notes — 0 required (callbackURL rejection verified, CSRF Origin correct, normalization safe, no weakened assertions)
- quality-reviewer: rejected — 2 required (dead addTamperedSession + sessionCookieName, misleading test name)
- resolved since cycle 7: 0
- outstanding: 2 (dead code removal, test rename)

### Cycle 7b — Task 7 cycle 2: dead code + test rename

- verifier: pass — all 8 checks (addTamperedSession gone, sessionCookieName gone from helper, test renamed, exports intact, tsc clean, lint 0 errors, 25 passed/1 skipped/0 failed)
- code-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required (minor: untrimmed return in session.ts is blank-check not normalization)
- resolved since cycle 7: 2 (dead code removed, test renamed)
- outstanding: none
- coordinator-approved deviations: (1) sign-out test Origin+JSON body, (2) social sign-in 403 rejection, (3) helper null-vs-undefined preservation, (4) DAL empty-to-null normalization
- commits: pending
