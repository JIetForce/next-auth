# Siftloom AI Chat MVP — Task 3: Streaming /api/chat route handler

## Spec

Architectural path. Spec: `docs/superpowers/specs/2026-09-03-ai-chat-mvp-design.md`.
Plan: `docs/superpowers/plans/2026-09-03-ai-chat-mvp.md` (Task 3).

### What changes:
- Create `src/app/api/chat/route.ts`:
  - `export const dynamic = "force-dynamic"`, `export const maxDuration = 30`.
  - POST handler:
    1. Guard `isAiChatConfigured()`: returns 503 if false.
    2. Rate limit check via `verifyChatAccess(req.headers)`: returns 429 with `Retry-After` header and `{ error: access.reason }` if blocked.
    3. Body validation: Zod schema enforcing `messages` (1-50), roles `user` or `assistant` only (rejects `system` role injection), `parts` text capped at 4000 chars; returns 400 on invalid JSON or schema failure.
    4. Model invocation: `createGoogleGenerativeAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })`, `streamText` with `gemini-2.0-flash`, `buildSiftloomSystemPrompt({ userName, isGuest })`, `convertToModelMessages`, `temperature: 0.3`, `maxOutputTokens: 1000`.
    5. Returns `result.toUIMessageStreamResponse({ onError })` mapping quota errors (`isQuotaError`) to friendly localized text.
    6. Catches top-level initialization errors and maps quota errors to 429 with `Retry-After: 60`.

### What must not change:
- `src/lib/auth/rate-limit.ts` and `src/lib/auth/client-ip.ts` are untouched.
- Untouched: `src/auth.ts`, `next.config.ts`, existing Better-Auth flows.
- The 4 pre-staged documentation files in git index belong to Task 6 and must not be swept into this commit.

### Security-relevant paths touched:
`src/app/api/chat/route.ts` (API route endpoint, authentication/session verification, rate limit enforcement, input boundary parsing untrusted data, LLM outbound request). Security reviewer required.

### How it will be verified:
`npx tsc --noEmit && npm run lint && npm run test:unit && npm run build && npm run test:agents && npm run check:agents && npm run format:check`
(Note: `npm run test:agents` has a known pre-existing environmental failure where doctor test calls `devin models list` without login; verified on clean HEAD).

## Cycle log

### Cycle 1 (Task 3 — delivering, full fan-out)

- verifier: pass — 6/7 suites green (`tsc`, `lint`, `test:unit`, `build`, `check:agents`, `format:check`); `npm run test:agents` 1/56 fail is the pre-existing environmental failure (`devin models list` needs `devin auth login`, verified on clean HEAD); unit tests 22/22 files passed (122 tests); build compiled successfully with dynamic route `ƒ /api/chat`.
- coordinator-run suite: none (verifier ran all 7 suites; environmental failure documented)
- reviewer: approved_with_notes — 0 required
- security-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

**DELIVERED (Task 3) 2026-09-03** — full fan-out cycle 1: reviewer approved_with_notes (0 required), security-reviewer approved_with_notes (0 required), verifier passed.
Notes carried to human:
- Note (developer): Next.js 16 `cacheComponents: true` in `next.config.ts` makes `export const dynamic = "force-dynamic"` incompatible, so it was omitted per repository conventions (`src/app/api/cron/cleanup/route.ts`), compiling as dynamic `ƒ /api/chat`.
- Minor note (reviewer): `isQuotaError` relies on substring checks; could use structured error code inspection if available from provider.
- Minor note (reviewer): Unit tests cover empty messages and max text length, but could test message counts > 50 explicitly.
- Minor note (security-reviewer): `chatRequestSchema` could tighten `text: z.string().min(1).max(4000)` instead of optional text to return 400 early on empty text parts.
