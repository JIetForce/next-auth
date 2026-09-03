# Fix retired gemini-2.0-flash (404) + English-only runtime copy in src/

## Spec

Bounded change. Post-delivery review of the AI chat MVP (commits 4a37ea6..215a764)
found two blockers and a policy violation. User approved the spec and the model
choice (gemini-3.6-flash); translation scope is src/ only (docs/ and .roster
archives stay as-is for now).

### What changes

1. `src/app/api/chat/route.ts`:
   - `google("gemini-2.0-flash")` → `google("gemini-3.6-flash")` — gemini-2.0-flash
     was retired by Google; the API returns 404 NOT_FOUND ("This model is no longer
     available... use models/gemini-3.6-flash"). Verified gemini-3.6-flash works
     with the operator's key via the same v1beta surface.
   - `maxOutputTokens: 1000` → `4000` — gemini-3.6-flash is a thinking model;
     958 thinking tokens were observed on a trivial prompt (finishReason MAX_TOKENS),
     so 1000 would truncate or empty real answers.
   - All Russian strings → English: zod messages (empty message / empty dialog /
     max dialog depth), invalid-JSON 400, invalid-format 400, quota 429 message,
     generic onError fallback, init-error 500 message, and the log message
     "Gemini 2.0 Flash streamText execution error" → "Gemini 3.6 Flash ...".
2. `src/lib/ai/siftloom-prompt.ts`: translate the whole system prompt to English
   (knowledge base, guardrails, greeting). Preserve every guardrail's semantics 1:1
   (topic lock, no third-party code, off-topic refusal formula, jailbreak/role-attack
   immunity, system-prompt confidentiality, obfuscation resistance). Language rule:
   "Always reply in the language the user writes in; default to English."
   Keep section markers (e.g. GUARDRAILS) so tests can assert them.
3. `src/lib/ai/siftloom-prompt.test.ts`: assertions → English markers; coverage identical.
4. `src/app/api/chat/route.test.ts`: expected error strings → new English ones;
   `maxOutputTokens: 4000`; log-message assertion updated.
5. `src/components/chat/chat-widget.tsx`: Badge "Gemini 2.0" → "Gemini 3.6".
6. `src/components/user-avatar.test.ts`: Russian fixtures → English equivalents
   ("Alexander Ivanov" → "AI", "Vladimir" → "VL") — same behavior under test.
7. `.env.example`: comment references model gemini-2.0-flash → gemini-3.6-flash.

### What must not change

- `src/lib/ai/chat-guard.ts`, rate-limit keys/quotas, `src/lib/auth/*` — untouched.
- Widget structure/behavior/chrome (already English), e2e specs, layout mount.
- Auth flows, CSP/security headers, Prisma schema, cron route.
- `docs/**` and `.roster/archive/**` — untouched (user decision 2026-09-03).

### How it is verified

- `npx tsc --noEmit`, `npm run lint`, `npm run test:unit`, `npm run format:check`,
  `npm run build`.
- Live-model check (new, required — the gap that let the retired model ship):
  POST http://localhost:3000/api/chat with a valid one-message body must return a
  UI message stream containing text parts, not an immediate error part. Dev server
  is already running on :3000; if down, start `npm run dev` in the background for
  the check.
- `rg "[\x{0400}-\x{04FF}]" src` → 0 matches.

Security-relevant paths touched: `src/app/api/chat/route.ts` (untrusted-input
boundary / outbound LLM call — model id, maxOutputTokens, and error copy),
`src/lib/ai/siftloom-prompt.ts` (guardrail text translated — semantics preserved),
`.env.example` (comment only). The security-reviewer is dispatched.

### Out of scope (already decided)

- Model = **gemini-2.5-flash** — user decision 2026-09-03, after measured evidence that
  gemini-3.6-flash streams pathologically slowly on the v1beta surface this SDK uses
  (159s to first text on a trivial prompt, both raw REST and installed SDK), while
  gemini-2.5-flash first-chunk is 0ms / 642ms total. gemini-3.6-flash is rejected for
  this MVP; do not re-litigate. (The earlier interim choice of 3.6-flash was made
  before this evidence existed and is superseded.)
- maxOutputTokens = 4000 — thinking-model headroom with cost control; thinkingConfig
  stays at the model default (no providerOptions) — minimal change.
- Translation scope = src/ only; docs/ and .roster archives stay Russian for now
  (user decision 2026-09-03).
- Reply-language adaptation stays prompt-driven; default reply language becomes English.
- Archived ledgers are historical records — never modified or deleted.

## Cycle log

### Cycle 1 (in progress)

- verifier: fail — 6/7 suites pass; live-model check `not run` (nothing listening on :3000)
- coordinator-run suite: live-model check — **failed differently**: POST /api/chat returned
  HTTP 200 + open SSE stream but zero events for 120s (client timeout). Investigation:
  - raw REST `streamGenerateContent?alt=sse` on gemini-3.6-flash: silent for 40s (curl --max-time)
  - installed SDK `streamText` on gemini-3.6-flash: stream completes, but time-to-first-text
    ≈ 159s for a trivial "Say OK" prompt — unusable latency on the v1beta streaming surface
  - gemini-2.5-flash, same SDK: first chunk 0ms, total 642ms; raw REST also instant
  - installed `@ai-sdk/google@2.0.95` supports `thinkingConfig` (`thinkingBudget`,
    `thinkingLevel`) via providerOptions
- conclusion: gemini-3.6-flash streams pathologically slowly on the API surface this
  SDK uses (159s to first text on a trivial prompt); gemini-2.5-flash is fast and
  first-class for @ai-sdk/google@2.0.95. Model decision goes back to the user (their
  gate choice of 3.6-flash was made before this evidence existed).
- developer rework (same cycle): model swapped to gemini-2.5-flash everywhere
  (route, prompt KB, test assertion, Badge, .env.example); all local suites green.
- verifier: pass — 8/8 (tsc, lint, test:unit 122/122, format:check, build,
  Cyrillic scan 0, stray-3.6 scan 0, live-model check: HTTP 200, real streamed
  English answer, 2.72s wall time, zero error parts)
- coordinator-run suite: live-model check on the interim 3.6-flash tree — failed
  (stream hung, 0 events in 120s); superseded by the model decision above and the
  final verifier's passing live check on the delivered tree
- reviewer: approved_with_notes — 0 required (3 minor: model-id assertion gap in
  route.test.ts, "third-party code" wording clarity, ledger security-paths
  parenthetical — fixed in the spec section before delivery)
- security-reviewer: approved — 0 required (guardrail translation audited 1:1;
  pre-existing notes: `details: parsed.error.format()` in the 400 body, raw `err`
  in server-side logs — both flagged for a future hardening cycle)
- resolved since cycle start: n/a (first cycle)
- outstanding: none

**DELIVERED 2026-09-03** — retired gemini-2.0-flash → gemini-2.5-flash (live-verified
end-to-end), maxOutputTokens 4000, all runtime copy in src/ English-only. Minor notes
handed to the human in the delivery summary, none blocking.
