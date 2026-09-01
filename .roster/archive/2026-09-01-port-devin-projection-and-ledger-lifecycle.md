# Port Devin role projection and single-commit ledger lifecycle from agent-roster

## Spec
Port the Devin role projection fixes and ledger lifecycle improvements from `agent-roster` (commits `7876fb1..b0f663b` and checklist `ed45361`) to `next-auth`:
1. What changes:
   - Copy 6 files from `agent-roster`: `config/agents.json`, `scripts/sync-agents.mjs`, `scripts/validate-agents.mjs`, `scripts/doctor-agents.mjs`, `agents/skills/review-loop/SKILL.md`, `tests/sync-agents.test.mjs`.
   - Add 3 new files from `agent-roster`: `scripts/lib/devin-models.mjs`, `tests/devin-models.test.mjs`, `tests/fixtures/devin-models-list.txt`.
   - Update `AGENTS.md` with `agent-roster`'s contract updates (Devin dispatch by profile, step 4 untracked capture with `git status --porcelain`, step 8 single-commit delivery procedure, concurrency facts), while preserving the `<!-- BEGIN:nextjs-agent-rules -->` block at the end.
   - Run `npm run sync:agents` to regenerate projected agent configs.
2. What must not change:
   - Do NOT modify `README.md`.
   - Do NOT modify `agents/roles/*/role.md`.
   - Do NOT hand-edit generated files under `.devin/`, `.claude/`, `.agent/`, `.codex/`, `.cursor/`, or `config/.agents-manifest.json`.
   - Preserve existing archive ledgers in `.roster/archive/`.
   - Preserve `<!-- BEGIN:nextjs-agent-rules -->` in `AGENTS.md`.
3. Verification:
   - `npm run sync:agents`
   - `npm run check:agents`
   - `npm run validate:agents`
   - `npm run test:agents`
   - `npm run doctor:agents`
   - Delivery verified in 1 commit with archived ledger under `.roster/archive/`.

## Cycle log

### Cycle 1
- verifier: pass
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

## Delivery
Delivered: Devin role projection and single-commit ledger lifecycle ported from agent-roster.
