# Siftloom AI chat MVP — design

Date: 2026-09-03
Status: drafted from the audited design doc, pending user approval
Origin: `docs/ai-chat-mvp.md` — a fully audited 1-Day-MVP design (its section 9
audit log already reconciled it against this codebase; every project primitive
it cites was re-verified during spec writing, see Context). This spec adds
what the contract requires and records the four decisions that deviate from
the source doc.

## Context

The design doc specifies a floating chat assistant backed by Google
`gemini-2.0-flash` through the Vercel AI SDK: in-context knowledge base (no
vector DB), two-circle access (Better-Auth users vs guests identified by IP),
atomic PostgreSQL rate limiting via the existing `consumeRateLimit`, hardened
guardrails against prompt injection, guest history in `localStorage` only, and
a Base UI `Sheet` widget mounted in the root layout.

Verified against the codebase during spec writing:

- Stack claims match `package.json`: `next 16.3.3`, `react 19.2.8`,
  `better-auth 1.7.2`, `prisma 7.10.0`, `@base-ui/react ^1.7.0`, `zod 4.5.4`.
- `consumeRateLimit(key, max, windowMs)` in `src/lib/auth/rate-limit.ts`
  auto-prefixes `action:` and fails closed — the doc's calling convention is
  correct.
- `getClientIp(headers: Headers)` in `src/lib/auth/client-ip.ts` and the
  `Viewer` type in `src/lib/auth/types.ts` match the doc's usage.
- `sharedFaqs` exists in `src/lib/content.ts`; `isAuthSessionConfigured()` in
  `src/lib/auth/environment.ts` is the established optional-config guard
  pattern; `logger` (Pino) at `src/lib/logger.ts`.
- UI tokens `bg-siftloom-gradient`, `shadow-siftloom-glow`, `font-heading`
  exist (`src/app/globals.css`); `src/components/ui/sheet.tsx` is Base UI
  (`@base-ui/react/dialog`) with a built-in close button at `top-3 right-3`
  (the doc's `pr-10` header offset is correct) and `SheetContent side="right"`.
- The cron collision the doc warns about is real:
  `src/app/api/cron/cleanup/route.ts:10` prunes `rateLimit` rows older than
  **1 hour**; 24-hour chat windows would be reset early without a change.
- `src/env.ts` currently has no `GOOGLE_GENERATIVE_AI_API_KEY`;
  `GOOGLE_GENERATIVE_AI_API_KEY` is absent from `.env.local` (operator adds
  the key when convenient).
- The AI SDK packages are not installed. npm registry (2026-09-03): latest
  `ai` is 7.0.91; the v4 line ends at 4.3.19 and peer-depends on
  `zod ^3.23.8` — incompatible with the project's zod 4.5.4. The v5 line
  (`ai@5.0.251`, `@ai-sdk/react@2.0.254`, `@ai-sdk/google@2.0.95`)
  peer-depends on `zod ^3.25.76 || ^4.1.8` and
  `react ^18 || ~19.0.1 || ~19.1.2 || ^19.2.1` — both satisfied.
- No i18n infrastructure exists (no react-i18next); site copy is English.

## What changes

### 1. Dependencies (pinned, exact)

`npm install ai@5.0.251 @ai-sdk/google@2.0.95 @ai-sdk/react@2.0.254` — the
v5 line, not the doc's v4 (decision 1 in Out of scope). No other dependency
changes.

### 2. Environment wiring

- `src/env.ts`: add `GOOGLE_GENERATIVE_AI_API_KEY:
z.string().min(1).optional()` to `server` (decision 2).
- `.env.example`: add a commented entry for the key.
- `src/lib/auth/environment.ts`: add `isAiChatConfigured()` returning
  `Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY)` — same pattern as
  `isAuthSessionConfigured()`.
- Operator (not a task): paste the AI Studio key into `.env.local` when
  available; until then the chat endpoint fails closed with HTTP 503.

### 3. Access guard — `src/lib/ai/chat-guard.ts` (new)

`verifyChatAccess(requestHeaders: Headers)` as specified in the source doc
(section 6.3, with one deviation — the headers argument is required, not
optional, so the module never touches `next/headers` and stays
unit-testable; the route always passes `req.headers`): resolve the Better-Auth session (fall back to guest on resolution
failure), identify guests by `getClientIp`, and consume two atomic
`consumeRateLimit` buckets per caller — users `15/min` + `100/24h`, guests
`3/5min` + `20/24h` — returning `{ allowed: false, retryAfterSeconds, reason }`
on exhaustion. Keys without the `action:` prefix (the limiter adds it).

Unit tests in `src/lib/ai/chat-guard.test.ts` following the
`rate-limit.test.ts` mocking pattern (mock `@/auth`, `@/lib/auth/rate-limit`,
`@/lib/auth/environment`, `@/lib/logger`; pass real `Headers` instances).

### 4. System prompt — `src/lib/ai/siftloom-prompt.ts` (new)

`buildSiftloomSystemPrompt({ userName, isGuest })` embedding the Siftloom
knowledge base (6 catalog categories, site navigation, `sharedFaqs`), the
hardened guardrails (topic lock, no third-party code, jailbreak immunity,
system-prompt confidentiality, obfuscation resistance, language adaptation),
and the guest/user greeting. Unit tests assert the guardrail markers, the FAQ
injection, and both greeting variants.

### 5. Streaming endpoint — `src/app/api/chat/route.ts` (new)

`POST` handler: `dynamic = "force-dynamic"`, `maxDuration = 30`; order is
config check (503 when `!isAiChatConfigured()`), then `verifyChatAccess`
(429 with `Retry-After`), then Zod validation, then `streamText`.

Adapted from the doc's v4 code to the installed v5 API (decision 1):

| Doc (v4)                                                                | Implementation (v5)                                                                                                                                                                                         |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `convertToCoreMessages(messages)`                                       | `convertToModelMessages(messages)`                                                                                                                                                                          |
| `result.toDataStreamResponse({ getErrorMessage })`                      | `result.toUIMessageStreamResponse({ onError })`                                                                                                                                                             |
| `maxTokens: 1000`                                                       | `maxOutputTokens: 1000`                                                                                                                                                                                     |
| client sends `{ role, content }`                                        | client sends `UIMessage` `{ id, role, parts }`; Zod validates `role: z.enum(["user","assistant"])`, `parts` array (text parts capped at 4000 chars), max 50 messages — client `system` role stays forbidden |
| `useChat` v4 (`input`, `handleSubmit`, `append`, `isLoading`, `reload`) | v5 (`sendMessage`, `status`, `regenerate`, local input state; `DefaultChatTransport({ api: "/api/chat" })`)                                                                                                 |

The `onError` callback of `streamText` logs via `logger.error`; the
`onError` callback of `toUIMessageStreamResponse` maps quota/network errors to
the doc's friendly Russian messages (the model's reply language is
prompt-driven; error copy follows the doc). The exact v5 export surface is
verified against the installed `.d.ts` in Task 1 before any code is written —
the packaged types govern over both this table and training data.

### 6. Widget — `src/components/chat/chat-widget.tsx` (new) + layout mount

The doc's widget (section 6.6) with the v5 `useChat` API: floating gradient
button (fixed `right-6 bottom-6`), Base UI `Sheet` (side right, `pr-10`
header), `Badge` "Gemini 2.0", project `Spinner`, quick-prompt chips calling
`sendMessage`, error banner with `regenerate()`, and the `isRestoredRef`
localStorage hydration guard (guest history only; `siftloom_chat_messages_v1`).
Widget chrome copy is **English** (decision 3). Mounted in
`src/app/layout.tsx` inside `<Providers>` after `{children}`.

A minimal e2e smoke spec `e2e/chat-widget.spec.ts` locks the regression: the
floating button is visible on `/` and opens the sheet. No message is sent (no
API key or network dependency in e2e).

### 7. Cron retention — `src/app/api/cron/cleanup/route.ts`

`RATE_LIMIT_MAX_AGE_MS` from `60 * 60 * 1000` to `24 * 60 * 60 * 1000`, and
its comment updated (it currently claims one hour "comfortably exceeds every
window currently in use" — false once the chat windows land). The prune
semantics stay: stale buckets are safe to drop; the widest configured window
is now 24h.

## What must not change

- `src/lib/auth/rate-limit.ts` and `src/lib/auth/client-ip.ts` — consumed
  as-is, never edited.
- No new Prisma models or migrations; no chat data in the database (guest
  history is client-only by design; authenticated history stays in client
  memory this phase).
- Better Auth's own `rateLimit` rows and cleanup behavior — the cron change
  only widens retention for every bucket equally; `session`/`verification`
  pruning is untouched.
- Auth flows, CSP/security headers in `next.config.ts`, `src/auth.ts` —
  untouched; the session read in the guard is read-only.
- The root layout gains only the `ChatWidget` import and mount.
- The existing e2e suite stays green; if its axe a11y checks flag the new
  floating button or ping dot, the widget is fixed (e.g. `aria-hidden` on
  decorative elements), never the tests' intent.

## How it is verified

- `npm run build` — succeeds; `/api/chat` appears as a dynamic route.
- `npx tsc --noEmit`
- `npm run lint` — 0 warnings
- `npm run test:unit` — includes the new guard and prompt suites
- `npm run test:agents`, `npm run check:agents`
- `npm run format:check`
- `npx playwright test e2e/chat-widget.spec.ts` — smoke passes; full
  `npm test` is human-gated (report un-run), as is the doc's manual QA
  checklist (section 7) — final task, results recorded in the ledger.

Security-relevant paths touched:
`src/app/api/chat/route.ts` (untrusted-input boundary, outbound LLM call),
`src/lib/ai/chat-guard.ts` (session resolution, IP identification, rate
limiting), `src/lib/ai/siftloom-prompt.ts` (prompt-injection guardrails),
`src/env.ts`, `src/lib/auth/environment.ts` (secret configuration),
`src/app/api/cron/cleanup/route.ts` (rate-limit retention). The
`security-reviewer` is dispatched on every cycle of this plan.

## Out of scope (already decided)

- **AI SDK v4 as written in the source doc: rejected.** The v4 line
  peer-depends on `zod ^3.23.8`, incompatible with the project's zod 4.5.4 —
  a clean `npm install` is impossible without overrides or
  `--legacy-peer-deps`. v5 is zod-4 and React-19.2.8 compatible and keeps the
  doc's architecture intact; the code is adapted per the mapping table above.
  Decided 2026-09-03 during spec writing.
- **AI SDK v6/v7 (latest = 7.0.91): not adopted.** Newest majors, furthest
  from the audited doc, no feature in this MVP needs them. Revisit on the
  Target-RAG phase.
- **Required env schema (`z.string().min(1)`, per the doc): rejected** in
  favor of optional-at-schema + fail-closed route guard
  (`isAiChatConfigured()` → 503). A required key bricks `build`, `dev`, and
  the e2e webServer until the operator adds it; the optional+guard shape
  mirrors the existing `isAuthSessionConfigured()` pattern. Decided
  2026-09-03 during spec writing.
- **Russian widget chrome copy (doc section 6.6): translated to English.**
  The site is English-only and there is no i18n infrastructure to extract
  strings into; the assistant's reply-language adaptation lives in the
  system prompt. Decided 2026-09-03 during spec writing.
- pgvector / RAG / `DocumentChunk` / background workers (doc section 8):
  deferred to the Target phase with its documented growth triggers.
- Server-side chat-history persistence for authenticated users: not built
  this phase (client memory only, per the doc's matrix).
- Persisting chat transcripts, moderation queues, analytics events: nothing
  beyond the doc's `logger` calls.
