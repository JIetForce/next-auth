# Audit remediation Phase 5 — UI, accessibility, SEO and content (Task 2: Motion and compositing)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-05-ui-content.md` — Task 2.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 2 answers audit finding 5.5 and §6 prefers-reduced-motion row.

What changes:
- In `src/app/globals.css`:
  - Wrap `.sl-card:hover` transform in `@media (prefers-reduced-motion: no-preference)`, keeping the colour/border transitions active regardless of motion preference.
  - Add `will-change: filter` to `.sl-ambient-glow-top` and `.sl-ambient-glow-side` blur layers.

What must not change:
- Visual presentation and hover effects for users with no motion reduction preference.

How it is verified:
- `npm run build` succeeds; route table confirms static routes remain static (`◐`).
- `npx tsc --noEmit`
- `npm run lint`
- `npm run test:unit`
- `npm run test:agents`
- `npm run check:agents`
- `npm run format:check`
- Playwright E2E (`npm test`) is human-gated — report un-run.

Security-relevant paths touched: none

Out of scope (already decided):
- Dead code cleanup (Task 3).

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
