# Audit remediation Phase 4 — infrastructure & tooling (Task 3: Prettier)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-04-infrastructure.md` — Task 3.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 3 answers audit finding 7.2. Ships as its own commit, formatting only.

What changes:
- Install `prettier` as devDependency (`npm install --save-dev prettier`).
- Create `.prettierrc`: match prevailing style (semi: true, double quotes, tabWidth: 2, etc.).
- Create `.prettierignore`: ignore `src/generated/**`, `.next/**`, `node_modules/**`, `package-lock.json`, `.roster/**`, and every generated agent profile under `.claude/**`, `.codex/**`, `.cursor/**`, `.devin/**`, `.agent/**`.
- Add scripts to `package.json`: `"format": "prettier --write ."` and `"format:check": "prettier --check ."`.
- Run formatting once across the repository.

What must not change:
- Generated agent profiles under `.claude/`, `.codex/`, `.cursor/`, `.devin/`, `.agent/` must NOT be reformatted (would fail `npm run check:agents`).
- Prisma generated client `src/generated/**` must not be touched.
- Formatting only: no line may change semantic meaning or logic.

How it is verified:
- `npm run format:check` clean.
- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run test:agents`
- `npm run check:agents`
- `git diff --stat` confirming formatting only.
- `npm test` (Playwright E2E) is human-gated — report un-run.

## Cycle log

### Cycle 1
- verifier: pass — format:check/build/tsc/lint/test:agents/check:agents all green; npm test not run (human-gated)
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
