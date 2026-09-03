# Siftloom AI Chat MVP — Task 2: Access guard and system prompt (TDD)

## Spec

Architectural path. Spec: `docs/superpowers/specs/2026-09-03-ai-chat-mvp-design.md`.
Plan: `docs/superpowers/plans/2026-09-03-ai-chat-mvp.md` (Task 2).

### What changes:
- Create `src/lib/ai/chat-guard.ts`: implements `verifyChatAccess(requestHeaders: Headers): Promise<RateLimitResult>` resolving Better-Auth viewer or guest IP (`getClientIp`), consuming two-circle atomic rate limit buckets (`consumeRateLimit` without `action:` prefix: user 15/min and 100/day; guest 3/5min and 20/day).
- Create `src/lib/ai/chat-guard.test.ts`: vitest unit tests covering guest and user paths, quota limits, retryAfterSeconds, session resolution failure fallback to guest, and unconfigured auth fallback.
- Create `src/lib/ai/siftloom-prompt.ts`: implements `buildSiftloomSystemPrompt(options?: { userName?: string | null; isGuest?: boolean }): string` containing Siftloom knowledge base (categories, navigation, `sharedFaqs`), strict guardrails, and role/language instructions.
- Create `src/lib/ai/siftloom-prompt.test.ts`: vitest unit tests asserting guardrails, knowledge base, shared FAQs, and guest vs named user greeting.

### What must not change:
- `src/lib/auth/rate-limit.ts` and `src/lib/auth/client-ip.ts` are consumed as-is, never edited.
- Rate-limit keys are passed WITHOUT the `action:` prefix (limiter adds it).
- Untouched: `src/auth.ts`, `next.config.ts`, existing Better-Auth flows.
- The 4 pre-staged documentation files in git index belong to Task 6 and must not be swept into this commit.

### Security-relevant paths touched:
`src/lib/ai/chat-guard.ts`, `src/lib/ai/chat-guard.test.ts` (authentication/session checks, rate limiting, IP handling), `src/lib/ai/siftloom-prompt.ts`, `src/lib/ai/siftloom-prompt.test.ts` (system prompt guardrails). Security reviewer required.

### How it will be verified:
`npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:agents && npm run check:agents && npm run format:check`
(Note: `npm run test:agents` has a known pre-existing environmental failure where doctor test calls `devin models list` without login; verified on clean HEAD).

## Cycle log

### Cycle 1 (Task 2 — delivering, full fan-out)

- verifier: pass — 5/6 suites green; `npm run test:agents` 1/56 fail is the pre-existing environmental failure (`devin models list` needs `devin auth login`, verified on clean HEAD); unit tests 21/21 files passed (111 tests).
- coordinator-run suite: none (verifier ran all 6 suites; environmental failure documented)
- reviewer: approved_with_notes — 0 required
- security-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

**DELIVERED (Task 2) 2026-09-03** — full fan-out cycle 1: reviewer approved_with_notes (0 required), security-reviewer approved_with_notes (0 required), verifier passed.
Notes carried to human:
- Minor note (reviewer): `const reqHeaders = requestHeaders;` in `chat-guard.ts` is a redundant local alias.
- Minor note (reviewer & security-reviewer): `chat-guard.ts` authenticated 24h limit uses `retryAfterSeconds: 3600` while message says 24 hours (86400s); matches spec plan.
- Minor note (security-reviewer): `siftloom-prompt.ts` could sanitize/truncate `userName` as defense-in-depth against prompt formatting injection.
- Minor note (reviewer): `siftloom-prompt.ts` falls back to guest greeting if `userName` is null or empty.
