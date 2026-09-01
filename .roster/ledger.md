# Audit remediation Phase 2 — Task 7: React Compiler via Turbopack

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-02-architecture.md` — Task 7.
Answers audit finding 5.3.

What changes:

- `next.config.ts`: add `experimental: { turbopackRustReactCompiler: true }` (keep `reactCompiler: true`)
- `package.json`: remove `babel-plugin-react-compiler` from devDependencies
- Run `npm install` to update lockfile

What must not change:

- React Compiler must still run (memoization must still happen). The build succeeding is not sufficient — if the compiler silently stopped, the app is just slower.
- Existing behaviour and E2E specs (E2E is human-gated).
- Roster tooling green.

How it is verified:

- `npm run build` — report wall-clock time before and after. Check build output for React Compiler activity.
- `npx tsc --noEmit`, `npm run lint`, `npm run test:agents`, `npm run check:agents` all green.
- `npm test` (Playwright) is human-gated.

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/test:agents/check:agents all green; build time ~24s→~21.3s; React Compiler activity confirmed via memo-cache artifacts in compiled chunks
- code-reviewer: approved_with_notes — 0 required
- security-reviewer: approved_with_notes — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved or approved_with_notes, verifier passed. Committed.
