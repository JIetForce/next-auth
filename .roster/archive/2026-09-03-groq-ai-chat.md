# AI Chat: connect Groq provider (Qwen 3.8 27B) with commented Google fallback

## Spec

Bounded change.

### What changes
1. Dependencies: Install `@ai-sdk/groq` provider.
2. `src/env.ts` and `.env.example`: Add optional `GROQ_AI_API_KEY` schema.
3. `src/lib/auth/environment.ts`: Update `isAiChatConfigured()` to check `GROQ_AI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`.
4. `src/app/api/chat/route.ts`:
   - Switch active inference to Groq with model `qwen/qwen3.8-27b` and key `GROQ_AI_API_KEY`.
   - Keep Google AI Studio (`gemini-2.5-flash`) implementation commented out with a clear comment noting it is fully functional and tested, but has low Free Tier limits (20 RPD / 5 RPM).
   - Update rate limit / quota error detection for Groq.
5. Tests: Update `src/app/api/chat/route.test.ts`, `src/lib/auth/environment.test.ts`, and `src/env.test.ts`.

### What must not change
- Internal session and rate limiting logic (`src/lib/ai/chat-guard.ts`).
- System prompt and knowledge base (`src/lib/ai/siftloom-prompt.ts`).
- Client chat widget component (`src/components/chat/chat-widget.tsx`).
- Authentication and Better Auth configuration.
- Developer does not commit.

### Security-relevant paths touched
src/app/api/chat/route.ts, src/env.ts

### How it will be verified
npx tsc --noEmit && npm run lint && npm run test:unit && npm run build && npm run format:check

### Already decided
none

## Cycle log

### Cycle 1

- verifier: pass — all 5 spec-required suites green (`tsc`, `lint`, `test:unit` 127 tests, `build`, `format:check`)
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required
- security-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

**DELIVERED 2026-09-03** — Connected Groq provider (qwen/qwen3.8-27b) with commented Google AI Studio fallback.
