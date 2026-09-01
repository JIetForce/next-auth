# Audit remediation Phase 3 — documentation (Task 2: Fix README.md)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-03-documentation.md` — Task 2.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 2 answers audit finding 1.2.

What changes:
- Modify `README.md`:
  - Title & Branding: Change heading `# next-auth` to `# Siftloom`, noting package name `agent-roster-web`.
  - Tech stack: Update React Compiler item from Babel to native Turbopack React Compiler (`turbopackRustReactCompiler`).
  - Project structure: Update `src/` tree block to accurately reflect route groups `(main)` and `(auth)`, API routes (`api/auth/[...all]`, `api/cron/cleanup`), and populated `components/` and `lib/`.
  - Secret-rotation instruction: Replace Auth.js / `jose` text with Better Auth reality: rotating `BETTER_AUTH_SECRET` invalidates signed session cookies and user signs in again — no endpoint or confirmation page to visit.
  - Command table: Add `npm test` (Playwright E2E — note local PostgreSQL `apptest` requirement and human-gated execution).
  - Routes: Document application routes: `/`, `/features`, `/pricing`, `/login`, `/register`, `/verify-email`, `/reset-password`, `/profile`, and API routes (`/api/auth/[...all]`, `/api/cron/cleanup`).

What must not change:
- No runtime code (`src/**`), schema, or test files are modified.
- Accurate sections (environment variables, Gmail SMTP setup, database configuration, `AGENTS.md` overview) preserved.
- English language matching surrounding documentation.

How it is verified:
- Verify all listed commands against `package.json`.
- Verify all documented routes and project tree against `src/`.
- `npm run build && npx tsc --noEmit && npm run lint && npm run test:agents && npm run check:agents` all green.
- Playwright E2E (`npm test`) is human-gated (reported un-run).

## Cycle log

### Cycle 1
- verifier: pass — build/tsc/lint/test:agents/check:agents all green; scripts and routes verified; npm test not run (human-gated)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved, verifier passed. Committed.
