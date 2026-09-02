# Audit remediation Phase 5 — UI, accessibility, SEO and content (Task 5: Metadata, Open Graph, robots and sitemap)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-05-ui-content.md` — Task 5.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 5 answers four rows of §6 in audit.

What changes:
- In `src/app/layout.tsx`:
  - Configure `metadataBase` using `new URL(getPublicBaseUrl())` from `@/lib/auth/environment`.
  - Add `openGraph` and `twitter` metadata blocks.
  - Set title template (e.g. `%s | Siftloom` with default).
- In `src/app/(main)/page.tsx`, `features/page.tsx`, `pricing/page.tsx`:
  - Export distinct per-page `metadata` (Title, description).
- In `src/app/robots.ts`:
  - Create typed `MetadataRoute.Robots` handler disallowing `/profile`, `/api/`, and auth routes (`/login`, `/register`, `/reset-password`, `/verify-email`), linking to sitemap.
- In `src/app/sitemap.ts`:
  - Create typed `MetadataRoute.Sitemap` handler listing public routes (`/`, `/features`, `/pricing`, `/terms`, `/privacy`).
- In `src/app/opengraph-image.png` or `public/`:
  - Provide Open Graph image referenced in metadata.

What must not change:
- Static prerendering of `/`, `/features`, `/pricing` (`◐`). Metadata must not read request-time data (headers/cookies).
- Single source of truth for public base URL (`getPublicBaseUrl()`).

How it is verified:
- `npm run build` succeeds; route table confirms static routes remain static (`◐`).
- `npx tsc --noEmit`
- `npm run lint` with 0 warnings.
- `npm run test:unit`
- `npm run test:agents`
- `npm run check:agents`
- `npm run format:check`
- Verify distinct `<title>` per public page.
- Verify `/robots.txt` and `/sitemap.xml` build output.
- Playwright E2E (`npm test`) is human-gated — report un-run.

Security-relevant paths touched: none

Out of scope (already decided):
- Terms and Privacy page content implementation (Task 6).

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/unit(63/63)/agents/check:agents/format:check all green; robots.txt/sitemap.xml verified; npm test not run (human-gated)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: not applicable (security-relevant paths: none)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved, verifier passed. Committed.
