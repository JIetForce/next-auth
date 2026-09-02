# Port six agent-roster commits (de33cdc..4c812e4) into next-auth

## Spec

Working document: `/private/tmp/claude-501/-Users-ruslan-repos-AI-anty-agent-roster/3abc3caf-ef9d-4241-8c51-29a19318c3af/scratchpad/port-roster-to-next-auth.md`
(deliberately not copied into this repository). Execute its steps 1–7 with the three
coordinator amendments below, **minus the step-7 commit**: the user instructed no commit
and no push; delivery stops at a verified, uncommitted working tree on branch
`port/roster-2026-09-02` (base `83a9bc2`).

**What changes:** the merged `reviewer` role (six roles → five), risk-proportional reviewer
fan-out and scope-bound findings, the security gate + `not run` = fail + tracked
`.roster/review/` (doctor hard-fails when it is git-ignored), the coordinator running a
not-run suite, and review cost bounded to change size — carried into `AGENTS.md`,
`agents/roles/`, `agents/skills/review-loop/SKILL.md`, `config/agents.json`,
`scripts/doctor-agents.mjs`, `.gitignore`, `tests/`, the generated harness directories,
and `.cursor/rules/agent-roster.mdc`. Accumulated `.roster/review/cycle-*.diff` files are
deleted (plan step 6).

**What must not change:** application code (`src/`, `e2e/`), `package.json`,
`scripts/sync-agents.mjs` and `scripts/validate-agents.mjs` (unchanged upstream, local
copies differ only by Prettier formatting), any model pin (`swe-1-7`, `glm-5-2`), and the
`# This is NOT the Next.js you know` block at the tail of `AGENTS.md` (restored after the
copy; `next dev` re-creates it otherwise).

**Coordinator amendments to the plan:**
1. Step 3 must also copy the doctor — the plan's prose requires it but omits the command:
   `cp $R/scripts/doctor-agents.mjs scripts/doctor-agents.mjs` (changed in `f328d7b`).
2. Step 2's `config/agents.json` edit has a third hunk the plan's diff omits: in
   `dispatch_lines.devin`, "the six roles" → "the five roles" and "the researcher and the
   three reviewers" → "the researcher and both reviewers".
3. Step 3 must also update the hand-maintained `.cursor/rules/agent-roster.mdc` (sync does
   not generate it): example line "`/developer`, then `/code-reviewer`" →
   "`/developer`, then `/reviewer`".

**How verified:** `npm run format` then `test:agents`, `check:agents`, `validate:agents`,
`doctor:agents`, `lint` — all exit 0; `check:agents` reports 25 agent profiles; the
behaviour checks in the plan's verification table (five roles and no orphans, doctor
hard-fails on a re-ignored review dir, review dir visible to git, model pins unchanged).
At the plan's Checkpoint A `test:agents` is expected red until step 5 lands.

Out of scope (already decided): the content of the rules being ported. They were reviewed and
delivered in agent-roster (.roster/archive/2026-09-02-*.md). Findings about whether a rule is
correct are notes; findings about whether it was ported correctly are required changes.

Security-relevant paths touched: `agents/roles/*/role.md`, `config/agents.json`,
`scripts/doctor-agents.mjs`, `.gitignore`.

Bounded change → one review cycle (`bounded_review_cycles: 1`).

## Cycle log

Pre-flight 2026-09-02: tree clean at `83a9bc2` on `main`, no active ledger, branch
`port/roster-2026-09-02` created. Ledger opened by the coordinator before dispatch.

### Cycle 1

- verifier: pass — format:check / check:agents (25 agent profiles + skills) / validate:agents /
  lint (0 errors) green; test:agents 55/56 and doctor:agents exit 1 solely on the pre-existing
  `devin models list: Not logged in` environment failure (check present at base `83a9bc2`,
  doctor line 304; identical failure in agent-roster)
- code-reviewer: rejected — 1 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 1 required
- resolved since cycle 0: n/a (first cycle)
- outstanding: AGENTS.md:593 — the Next.js tail block lost its opening
  `<!-- BEGIN:nextjs-agent-rules -->` marker and the blank line after it (base had
  BEGIN:398 / heading:400 / END:406); filed by both the correctness and maintainability
  lenses; root cause is the plan's tail-re-append snippet, which started the tail at the
  heading instead of the BEGIN marker
- note (quality-reviewer): tests/collisions.test.mjs:36 cites
  `tests/sync-agents.test.mjs:239-258` as the mutate-and-restore pattern — in this repo those
  lines are the "both lenses structural" test; the citation went stale in the port
- dispatch deviation: profile `reviewer` (merged role) does not exist in this session's
  profile set, which was fixed at session start before the port regenerated `.devin/agents/`;
  dispatched code-reviewer + quality-reviewer as the two lenses of the merged reviewer
  instead — same lenses, same structural output requirements

### Cycle 2

- verifier: pass — same green set as cycle 1; tail block bracketed (BEGIN:593 / END:601) and
  byte-identical to base; collisions citation now by test name, behaviour unchanged
- code-reviewer: rejected — 1 required
- security-reviewer: approved — 0 required
- quality-reviewer: rejected — 1 required (+1 minor note)
- resolved since cycle 1: 1 — the BEGIN marker (both lenses confirmed resolved; no duplicated
  markers or sections)
- outstanding:
  - AGENTS.md:100 — the continuation line `decided)` lost its 3-space indent in the port;
    upstream `agent-roster/AGENTS.md:100` has the indent (coordinator-confirmed port defect)
  - AGENTS.md:189-190 — "returns three `### Blocked` reports": the count is stale under the
    merged reviewer. The same stale text exists upstream (`agent-roster/AGENTS.md:184`) while
    upstream's own `agents/skills/review-loop/SKILL.md:56` uses the generic wording — so this
    is an internal inconsistency of the ported set, not rule content. Coordinator classifies
    it in-scope ("does it fit local conditions"): fix = drop the word "three". The one-line
    divergence from upstream's AGENTS.md is recorded here as an upstream follow-up.
- note (quality-reviewer): tests/collisions.test.mjs:35-36 — tautology "the mutate-and-restore
  pattern follows the mutate-and-restore pattern"; drop the second "mutate-and-restore"

### Cycle 3 (in flight)

- developer filed `### Blocked`: the AGENTS.md:100 indent fix (byte-match upstream) and
  `format:check` are mutually exclusive — Prettier normalizes that lazy-continuation line to
  column 0, and it is the only formatting issue in the file. The maintainability reviewer's
  premise ("format:check does not catch it") was factually wrong; upstream's AGENTS.md is not
  Prettier-managed at all.
- coordinator resolution: revert the indent fix. The plan's trap 1 pre-decides this class of
  conflict — "copy semantics, never bytes: apply the change, then `npm run format`". The
  indent divergence from upstream is intentional and Prettier-mandated; byte-fidelity yields
  to the repo's formatting gate. Edits 2 (drop "three") and 3 (tautology) stand.

### Cycle 3 — closed without a review round (user decision)

The user interrupted the cycle-3 dispatch and overruled running further review cycles over
cosmetic findings (an indentation and a prose word count). Resolution applied directly by the
coordinator, no developer/reviewer round:

- AGENTS.md:100 indent reverted to the Prettier-normalized column-0 form (with the indent,
  `format:check` — a CI gate — fails; the maintainability reviewer's premise that it would
  not catch it was factually wrong). Post-revert: `format:check` exit 0.
- AGENTS.md:189-190 "three" removal and the collisions.test.mjs tautology fix stand as
  accepted (already in the tree, strict improvements).
- The two cycle-2 `rejected` verdicts are closed as cosmetic notes by user decision; the
  contract's user-escalation authority outranks the loop.
- outstanding: none. Post-close verification: `format:check` exit 0; `test:agents` 55/56
  (the 1 fail is the pre-existing `devin models list: Not logged in` environment failure);
  HEAD `83a9bc2`, work uncommitted per the user's no-commit instruction.

Upstream follow-ups (agent-roster): AGENTS.md:184 still carries the stale "three
`### Blocked` reports" count its own SKILL.md:56 fixed; its AGENTS.md is not
Prettier-managed, so byte-comparing AGENTS.md against it will keep flagging the
normalized indent — compare semantics, not bytes.

Delivered 2026-09-02: one commit on `main` (user-directed; the port branch
`port/roster-2026-09-02` was deleted without receiving a commit). Captured diffs
deleted at delivery per exit (1). Cycles run: 3 — cycle 3 closed without a review
round by user decision (cosmetic findings resolved directly by the coordinator).
