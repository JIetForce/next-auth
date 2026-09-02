# Audit remediation Phase 5 — UI, accessibility, SEO and content (Task 3: Delete the dead code)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-05-ui-content.md` — Task 3.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 3 answers audit findings 4.3 and 5.4.

What changes:
- In `src/app/globals.css`:
  - Delete unused `.sl-faq-item`, `.sl-faq-item:hover`, `.sl-faq-item.open`, `.sl-faq-question`, `.sl-faq-answer`, `.sl-faq-content` rules.
  - Remove `--font-geist-mono` declaration under `@theme`.
- In `src/app/layout.tsx`:
  - Remove `Geist_Mono` font import and usage (`geistMono`).
- In `e2e/helpers/mail.ts`:
  - Delete unused exported function `clearMailbox()`.
- In `scripts/sync-agents.mjs` and `scripts/validate-agents.mjs`:
  - Fix the two unused variables (`roles` in `sync-agents.mjs`, `tool` in `validate-agents.mjs`) causing ESLint warnings, achieving zero warnings on `npm run lint`.

What must not change:
- Existing functionality of sync and validation scripts.
- Page rendering and typography styling using `Geist` sans font.

How it is verified:
- `npm run lint` with 0 errors and **0 warnings**.
- `npm run build` succeeds.
- `npx tsc --noEmit`
- `npm run test:agents` passes.
- `npm run check:agents` passes.
- `npm run test:unit` passes.
- `npm run format:check` passes.
- Playwright E2E (`npm test`) is human-gated — report un-run.

Security-relevant paths touched: none

Out of scope (already decided):
- Landmarks and footer extraction (Task 4).

## Cycle log

### Cycle 1

- verifier: pass — lint(0 warnings)/build/tsc/test:agents/check:agents/test:unit/format:check all green; npm test not run (human-gated)
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required
- security-reviewer: not applicable (security-relevant paths: none)
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved or approved_with_notes, verifier passed. Committed.
