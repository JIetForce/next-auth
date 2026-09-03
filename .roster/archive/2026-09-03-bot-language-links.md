# Siftloom bot: reply-language rule + relative-only internal links

## Spec

Bounded change. User-reported defects after AI chat MVP delivery:
1. The bot answered an English question ("What is Siftloom?" quick-prompt chip) in Russian —
   the "reply in the language the user writes in" rule loses to Russian conversation history
   persisted in the widget's localStorage.
2. The bot emitted `https://siftloom.com/register` (absolute URL glued from the KB line
   "Website: https://siftloom.com") — the renderer treated it as external: wrong host, new tab.
   Required behaviour: the link must lead to this deployment's /register
   (https://next-auth-nine-rho.vercel.app/register in production) and navigate in the same tab.

### What changes
`src/lib/ai/siftloom-prompt.ts` only, plus assertions in `src/lib/ai/siftloom-prompt.test.ts`:
1. Language rule — **AMENDED by the user 2026-09-03 (supersedes the earlier gate choice)**: the bot
   replies ONLY in English, regardless of the user's language or conversation history; Russian (or
   any other language) text in the KB/history is source material to translate from, never a model
   for the reply language. Rationale: the most-recent-message rule did not survive testing — the
   model kept answering English questions in Russian.
2. Internal links: the bot must render an ACTUAL Markdown link with a relative path for every
   internal page it mentions — e.g. [our registration page](/register) — never a bare path like
   "/register" without link syntax, and never an absolute URL for an internal page. Relative links
   render via next/link: same tab, current deployment host.

Already decided (overruled findings — do not re-file):
- Cycle-3 required changes on `duration-350` and `top-3/5` are overruled: the compiled CSS from the
  verifier's own build proves CSS-identity — `.duration-350,.duration-\[0\.35s\]{transition-duration:.35s}`
  and `.top-3\/5,.top-\[60\%\]{top:60%}` (same rule, same declarations as the originals).
- `group-has-focus-visible` is the Tailwind v4 language service's own suggested form; compiled CSS
  generates the intended `:has(:focus-visible)` selector.
- `rounded-[4px]` stays arbitrary: the project theme redefines `--radius-sm` to ≈6px.
- Docs drift (`docs/*.md` old class names) — historical records, accepted.
- The coordinator skipped the reviewer dispatch on cycle 4 on the user's explicit instruction to
  stop review cycles; verification is the verifier's evidence only.

### What must not change
The widget's link renderer (internal → next/link same tab, external → new tab), KB facts, FAQ
content, routes, /api/chat, e2e specs.

### Security-relevant paths touched
none

### How it will be verified
`npx tsc --noEmit && npm run lint && npm run test:unit && npm run build && npm run format:check`

## Cycle log

### Cycle 1

- verifier: pass — all 5 spec-required suites green (`tsc`, `lint`, `test:unit` 124 tests, `build`, `format:check`)
- coordinator-run suite: none
- reviewer: rejected — 1 required
- security-reviewer: not dispatched (spec declares none)
- resolved since cycle 0: 0
- outstanding:
  - `src/components/ui/checkbox.tsx:13`: the style-sweep rename `rounded-[4px]` → `rounded-sm` is not CSS-identical under this project's theme — `globals.css` defines `--radius-sm: calc(var(--radius) * 0.6)` = 0.375rem ≈ 6px vs the original 4px. Revert to the exact 4px value. (reviewer, Correctness; coordinator verified against `src/app/globals.css:41,74`)
  - Spec fidelity (coordinator, from reviewer minor note): `src/lib/ai/siftloom-prompt.ts:96` still says "into the language of the conversation", contradicting the spec's MOST RECENT MESSAGE rule at line 94 — align the translation sentence; also tidy the line-44 comma spacing in the new KB bullet.

### Cycle 2 (reduced: reviewer only)

- verifier: pass — all 5 spec-required suites green
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required (cycle-1 required change confirmed resolved)
- resolved since cycle 1: 1 (rounded-[4px] reverted)
- outstanding: none

### Cycle 3 (delivering full fan-out — reviewer only, security paths none)

- verifier: pass (carried from cycle 2 — tree unchanged)
- coordinator-run suite: none
- reviewer: rejected — 2 required (`duration-350` and `top-3/5` claimed invalid)
- coordinator verification of the findings: **both refuted by compiled CSS** from the verifier's own
  build — `.duration-350,.duration-\[0\.35s\]{--tw-duration:.35s;transition-duration:.35s}` and
  `.top-3\/5,.top-\[60\%\]{top:60%}` (Tailwind grouped old and new class names into identical rules);
  all other renames confirmed in the compiled CSS as well. Both required changes OVERRULED, recorded
  in the spec's "Already decided" list.
- resolved since cycle 2: 0
- outstanding: none (all required changes overruled with evidence)

### Cycle 4 (user directive: stop review cycles; spec amended — English-only replies, markdown links)

- Spec amended by the user: language rule → English-only (most-recent-message rule failed in
  practice); link rule → actual Markdown links with relative paths, never bare paths.
- Reviewer dispatch skipped on the user's explicit instruction; verification = verifier only.

### Cycle 4 (delivering)

- verifier: pass — all 5 spec-required suites green (`tsc`, `lint`, `test:unit` 124 tests, `build`, `format:check`)
- coordinator-run suite: none
- reviewer: not dispatched (user directive)
- resolved since cycle 3: 0 (cycle-3 required changes were overruled, not fixed)
- outstanding: none

**DELIVERED 2026-09-03** — English-only bot replies, Markdown-link rule for internal pages, Tailwind v4 class sweep. Reviewer skipped on user instruction; verifier evidence only.
