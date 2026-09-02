# Audit remediation Phase 5 — UI, accessibility, SEO and content (Task 1: Decorative layers work in both themes)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-05-ui-content.md` — Task 1.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` (decision D4).

Task 1 answers audit finding 4.2.

What changes:
- In `src/app/globals.css`:
  - Move decorative background grid (`rgba(255, 255, 255, 0.03)`) onto semantic tokens or theme-adaptive CSS variables so it is visible in both light and dark themes (grid is invisible on `#f8fafc`).
  - Fix `.sl-card:hover` (`border-color: rgba(255, 255, 255, 0.16)`), which erases card borders in light theme, replacing it with `--border` or token-based styling.
- In `src/app/(main)/page.tsx` and `src/app/(main)/pricing/page.tsx`:
  - Replace inline `border-white/*` and `bg-white/*` utilities on accordions, badges, and cards with semantic tokens (`border-border`, `bg-card`, `bg-muted`, etc.).

What must not change:
- Brand primary `#2fb8ae` (`bg-primary` / `text-primary-foreground`).
- shadcn Base UI usage (no Radix `asChild`).
- Static prerendering of `/`, `/features`, `/pricing` (no request-time dynamic reads).
- Existing navigation link structure and counts (`e2e/auth-session.spec.ts`).

How it is verified:
- `npm run build` succeeds; route table confirms `/`, `/features`, `/pricing` remain static (`○`).
- `npx tsc --noEmit`
- `npm run lint` with zero warnings.
- `npm run test:unit`
- `npm run test:agents`
- `npm run check:agents`
- `npm run format:check`
- Visual/markup inspection confirming grid visibility and card hover border preservation in both themes.
- Playwright E2E (`npm test`) is human-gated — report un-run.

Security-relevant paths touched: none

Out of scope (already decided):
- Motion and compositing optimization (Task 2).
- Dead CSS and font cleanup (Task 3).

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/unit/agents/check:agents/format:check all green; npm test not run (human-gated)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: not applicable (security-relevant paths: none)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved, verifier passed. Committed.
