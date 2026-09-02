# Audit remediation Phase 5 — UI, accessibility, SEO and content (Task 4: Landmarks, skip link, and a footer on every public page)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-05-ui-content.md` — Task 4.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 4 answers three rows of §6 in audit.

What changes:
- In `src/components/site-footer.tsx`:
  - Create `SiteFooter` component extracted from `src/app/(main)/page.tsx` footer unchanged. Keep it a server component.
- In `src/app/(main)/page.tsx`, `src/app/(main)/features/page.tsx`, `src/app/(main)/pricing/page.tsx`:
  - Ensure exactly one `<main id="main-content">` landmark per page (replacing root outer `<div>` or wrapping main content).
  - Render `<SiteFooter />` on all three public pages.
- In `src/app/layout.tsx`:
  - Add accessible skip link (`href="#main-content"`) as first focusable element inside `<body>`, visually hidden until focused.
- Ensure `id="main-content"` is also present on `<main>` in `(auth)/layout.tsx` and `profile/page.tsx`.

What must not change:
- Mobile navigation link count (`e2e/auth-session.spec.ts:49`) must remain exactly 3 links.
- "Home" link name (`e2e/auth-session.spec.ts:178`).
- Static prerendering of `/`, `/features`, `/pricing` (`◐`).

How it is verified:
- `npm run build` succeeds; route table confirms `/`, `/features`, `/pricing` remain static (`◐`).
- `npx tsc --noEmit`
- `npm run lint` with zero warnings.
- `npm run test:unit`
- `npm run test:agents`
- `npm run check:agents`
- `npm run format:check`
- Verify each page has exactly one `<main id="main-content">`.
- Verify skip link is present in `layout.tsx`.
- Playwright E2E (`npm test`) is human-gated — report un-run.

Security-relevant paths touched: none

Out of scope (already decided):
- Metadata, Open Graph, robots and sitemap (Task 5).

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/unit/agents/check:agents/format:check all green; npm test not run (human-gated)
- coordinator-run suite: none
- reviewer: rejected — 1 required
- security-reviewer: not applicable (security-relevant paths: none)
- resolved since cycle 0: 0
- outstanding:
  - src/app/layout.tsx:32: elevate skip link focus z-index above sticky header (e.g. focus:z-60) so focused skip link is painted above header

### Cycle 2

- verifier: pass — build/tsc/lint/unit(59/59)/agents/check:agents/format:check all green; npm test not run (human-gated)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: not applicable (security-relevant paths: none)
- resolved since cycle 1: 1
- outstanding: none

### Delivery

All verdicts approved, verifier passed. Committed.
