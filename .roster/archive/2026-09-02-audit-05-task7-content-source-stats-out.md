# Audit remediation Phase 5 — UI, accessibility, SEO and content (Task 7: One content source, and the placeholder statistics out)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-05-ui-content.md` — Task 7.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` (decision D4).

Task 7 answers audit finding 3.6 and statistics paragraph of §6.

What changes:
- In `src/lib/content.ts`:
  - Move the two inline FAQs from `src/app/(main)/page.tsx:319-345` into `sharedFaqs` so `sharedFaqs` is the single source of truth.
  - Delete `partnerStats` export entirely.
- In `src/app/(main)/page.tsx`:
  - Render all FAQs by mapping over `sharedFaqs` (removing inline FAQ items).
  - Remove the "Trusted by 10,000+ modern professionals" line and replace with non-numeric copy ("Curated tools and weekly intelligence for modern operators and teams").
  - Remove the `partnerStats.map(...)` renderer and adjust surrounding partner section spacing.
- In `src/app/(main)/pricing/page.tsx`:
  - Remove `partnerStats.map(...)` renderer and adjust partner section layout.
  - Remove `(5,000+ members)` from feature list bullet.
- In `src/app/(main)/features/page.tsx` and `src/app/(auth)/_components/auth-showcase.tsx`:
  - Remove placeholder numeric claims (`10,000+`, `5,000+`, `48%`) so no unverified marketing statistics survive in the application code.

What must not change:
- Static prerendering of public routes (`◐`).
- Accordion component structure and functionality.

How it is verified:
- `npm run build` succeeds; confirms static prerendering is preserved.
- `npx tsc --noEmit`
- `npm run lint` with 0 warnings.
- `npm run test:unit`
- `npm run test:agents`
- `npm run check:agents`
- `npm run format:check`
- `grep -rn "10,000\|5,000\|48%" src` yields no marketing claims.
- Playwright E2E (`npm test`) is human-gated — report un-run.

Security-relevant paths touched: none

Out of scope (already decided):
- Verify email pending address cookie (Task 8).
- Email templates (Task 9).

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/unit(71/71)/agents/check:agents/format:check all green; placeholder stats removed; npm test not run (human-gated)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: not applicable (security-relevant paths: none)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved, verifier passed. Committed.
