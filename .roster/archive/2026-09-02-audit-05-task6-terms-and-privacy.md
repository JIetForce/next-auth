# Audit remediation Phase 5 — UI, accessibility, SEO and content (Task 6: Terms and Privacy)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-05-ui-content.md` — Task 6.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` (decision D5).

Task 6 answers the "links point at /" row of §6.

What changes:
- Create `src/app/(main)/terms/page.tsx`:
  - Engineering-drafted Terms of Service describing the actual service: free access to curated AI/workflow tools, acceptable use, account creation.
  - Landmark `<main id="main-content">`, `<SiteFooter />`, static metadata.
- Create `src/app/(main)/privacy/page.tsx`:
  - Engineering-drafted Privacy Policy reflecting actual application data practices: data collected (name, email, avatar), Postgres session storage with expiration, email used solely for authentication (verification, password reset), optional Google OAuth linking, instructions for requesting data deletion.
  - Landmark `<main id="main-content">`, `<SiteFooter />`, static metadata.
- In `src/app/(auth)/_components/auth-card-shell.tsx`:
  - Update Terms of Service link from `/` to `/terms`.
  - Update Privacy Policy link from `/` to `/privacy`.
- In `src/components/site-footer.tsx`:
  - Update Privacy Policy and Terms of Service links from `#` to `/privacy` and `/terms` using `next/link`.

What must not change:
- Static prerendering of marketing/public routes (`◐` or `○`).
- Anti-enumeration behavior or authentication flows.

How it is verified:
- `npm run build` succeeds; `/terms` and `/privacy` render statically (`◐` or `○`).
- `npx tsc --noEmit`
- `npm run lint` with 0 warnings.
- `npm run test:unit`
- `npm run test:agents`
- `npm run check:agents`
- `npm run format:check`
- Both `/terms` and `/privacy` routes render properly and links resolve from auth pages and footer.
- Playwright E2E (`npm test`) is human-gated — report un-run.

Security-relevant paths touched: none

Out of scope (already decided):
- FAQ consolidation and statistics placeholder removal (Task 7).

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/unit(66/66)/agents/check:agents/format:check all green; /terms and /privacy render statically; npm test not run (human-gated)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: not applicable (security-relevant paths: none)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved, verifier passed. Committed.
