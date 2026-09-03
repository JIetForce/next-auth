# Cache-discipline rule for the coordinator in AGENTS.md

## Spec

Bounded chat spec (approved by the user in chat, 2026-09-03). Insert ONE new subsection,
`### Cache discipline`, into `AGENTS.md` under `## Parallel dispatch`, immediately after
`### Per-tool concurrency facts` (after the "**Workers do not dispatch workers.**" paragraph,
before `## Escalation`). Text provided verbatim in the developer dispatch.

- What changes: that subsection only.
- What must not change: any other line of `AGENTS.md`; the `is_background: false` default for
  `developer`/`verifier` (the new subsection references it, does not rewrite it); no hand edits
  to generated files (`.devin/agents/*`, `.devin/skills/**`).
- How it is verified: `npm run check:agents` and `npm run test:agents` pass from the repo root.
  If `check:agents` reports drift for generated skill files, regenerate via `npm run sync:agents`
  (never hand-edit them) and include the regenerated tracked files in the diff.
- Security-relevant paths touched: none

Already decided:

- Polling cadence 3–4 minutes; Devin `read_subagent(block=true, timeout=180)`.
- The rule is a cost discipline, not a gate — reviewers do not police it.
- Placement: one new subsection under `## Parallel dispatch`; the existing foreground mandate
  for `developer`/`verifier` stands (a background writer auto-denies tools not approved this
  session — the contract's own concurrency facts).
- Claude Code 1h TTL (`promptCacheTtl` / `subagentPromptCacheTtl`) is named as the preferred
  alternative where available.
- Harness-agnostic wording with per-harness parentheticals.

## Cycle log

### Cycle 1

- verifier: fail-environmental — `npm run test:agents` 55/56; единственный отказ: doctor `devin models list` → "Not logged in" (нужен `devin auth login`); pre-existing, не связан с диффом (stash-rerun разработчика + независимый прогон верификатора). `npm run check:agents` — pass (in sync, 30 profiles).
- coordinator-run suite: none (поправка верификации по шагу 5.2: отказ environmental, команда воспроизводима, интерактивный auth вне скоупа).
- reviewer: pending — background agent 446bd766, вердикт по тексту цикла 1 не получен (пользователь прервал ожидание).
- resolved since cycle 0: n/a
- outstanding: вердикт ревьюера цикла 1; решение по spec v2 (см. ниже).

**Pause / handoff (2026-09-03).** Пользователь прервал цикл: другой агент указал, что правило не покрывает `developer`/`verifier` — они остаются foreground, и самые длинные ожидания по-прежнему убивают кеш. Spec v2 предложена (буллет "Writers too, when the wait is long": `developer`/`verifier` → `is_background: true` + poll, fallback на foreground при `### Blocked` с tool denial), гейт не пройдён — пользователь передаёт решение другому агенту. Состояние: `AGENTS.md` изменён (uncommitted, текст цикла 1), `.roster/review/cycle-1.diff` захвачен, ревьюер работает в фоне. Индекс содержит чужую работу (`docs/ai-chat-mvp.md`, `docs/ai-integration-research.md`, `docs/superpowers/*`) — в коммит не включать; скоуп доставки: `AGENTS.md` + `.roster/archive`.

### Closed out (2026-09-03) — superseded, delivered in agent-roster

This run was paused at cycle 1 and handed to another agent. It resumed in the canonical repository,
`agent-roster`, not here: commit `e1af3dc` ("feat(loop): wait without burning the coordinator's
prompt cache"), whose ledger is `.roster/archive/2026-09-03-cache-discipline.md` there.

Three things changed against the cycle-1 text this ledger recorded, and each is why that text is not
what shipped:

1. `promptCacheTtl` / `subagentPromptCacheTtl` do not exist. Neither identifier appears in the
   Claude Code 2.1.150 binary. The TTL is selected by `oVH(querySource)`: `FORCE_PROMPT_CACHING_5M`
   forces 5m, `ENABLE_PROMPT_CACHING_1H` forces 1h, otherwise an entitlement check, off in overage,
   then a query-source allowlist defaulting to
   `["repl_main_thread*","sdk","auto_mode","memdir_relevance"]`. The coordinator's own main thread is
   on that list, so Claude Code already holds the long TTL and polling there is waste.
2. Spec v2 ("Writers too, when the wait is long") was rejected, not deferred. It assumed a background
   writer's tool denial announces itself as `### Blocked`; this repository's own record says it does
   not — `.roster/archive/2026-09-01-devin-projection-task3-dispatch-by-profile.md:46`, "silently
   auto-denied exec/edit and an empty report". No Devin experiment was run: the CLI is unauthenticated
   and the assumption it would have tested is already contradicted by that record.
3. Polling is not free. A poll re-sends the whole prefix at the cache-read rate (0.1x) against a cold
   reprocess at the cache-write rate (1.25x), so about a dozen polls cost the miss they avoid —
   break-even near 45 minutes. The shipped subsection carries that stopping point instead of the
   absolute "no single wait outlasts the TTL".

The cycle-1 reviewer verdict this ledger was waiting on never arrived and is moot: the text it was
reviewing no longer exists. The shipped text was reviewed in `agent-roster` cycle 1 — verifier pass
(56/56), reviewer approved, 0 required.

`AGENTS.md` here now carries the shipped text verbatim (prettier reports it unchanged). It is
uncommitted: the index holds unrelated staged work, so the commit is the human's to scope.
