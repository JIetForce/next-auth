# Siftloom bot: reply in language of most recent message

## Spec

Bounded change.

### What changes
1. `src/lib/ai/siftloom-prompt.ts`: In section `6. LANGUAGE AND ADAPTATION:`, replace the English-only reply rule with:
   - Reply in the same language as the user's most recent message. Do not let the language of earlier messages in the conversation influence the reply language.
   - If the most recent message contains multiple languages or its language is unclear, default to English.
   - The knowledge base and earlier conversation history are source material; render all facts in the same language as the user's most recent message.
   - Keep relative markdown links rules intact.
2. `src/lib/ai/siftloom-prompt.test.ts`: Replace `it("locks the English-only reply rule")` with `it("locks the reply-to-last-message-language rule")`, verifying that the prompt contains "Reply in the same language as the user's most recent message" and "default to English", and does not contain "ALWAYS reply in English" or "Never reply in Russian".

### What must not change
- `src/app/api/chat/route.ts`
- `src/components/chat/chat-widget.tsx`
- Model `gemini-2.5-flash`, rate limits, all other guardrails
- No new dependencies
- Do not commit directly

### Security-relevant paths touched
none

### How it will be verified
npx tsc --noEmit && npm run lint && npm run test:unit && npm run build && npm run format:check

### Already decided
none

## Cycle log

### Cycle 1

- verifier: pass — all 5 spec-required suites green (`tsc`, `lint`, `test:unit` 124 tests, `build`, `format:check`)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: not dispatched (spec declares none)
- resolved since cycle 0: 0
- outstanding: none

**DELIVERED 2026-09-03** — Bot replies in language of user's most recent message, default to English; tests updated.
