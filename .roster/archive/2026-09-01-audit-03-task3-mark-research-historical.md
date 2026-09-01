# Audit remediation Phase 3 — documentation (Task 3: Mark docs/nextjs-research.md historical)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-03-documentation.md` — Task 3.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 3 answers audit finding 1.3.

What changes:
- Modify `docs/nextjs-research.md`:
  - Add historical banner at the top before any other content:
    > **Historical Document / Исторический документ:**
    > This document was written for a stack the project no longer uses — Auth.js v5 (`next-auth@beta`) — during the evaluation that preceded the move to Better Auth. It is kept as an archive of that evaluation. For current authentication behaviour, read [`docs/auth-architecture.md`](auth-architecture.md).
  - Fix currency claim on line 3: change "Актуальность: август 2026" to a written-on date (e.g. "Дата составления: август 2026 [архив]").
  - Preserve the rest of the document.

What must not change:
- The remainder of `docs/nextjs-research.md` (keep all sections intact).
- No runtime code (`src/**`), schema, or test files are modified.

How it is verified:
- Verify no other document links to `nextjs-research.md` as active guidance:
  `grep -rn "nextjs-research" --include=*.md . | grep -v node_modules`
- `npm run build && npx tsc --noEmit && npm run lint && npm run test:agents && npm run check:agents` all green.
- Playwright E2E (`npm test`) is human-gated (reported un-run).

## Cycle log

### Cycle 1
- verifier: pass — build/tsc/lint/test:agents/check:agents all green; links verified; npm test not run (human-gated)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved, verifier passed. Committed.
