# Chat widget fixes: model badge, auth-conditional sign-in, markdown links

## Spec

Bounded change (user-reported defects after AI Chat MVP delivery). Reference flows:
`src/components/chat/chat-widget.tsx`, `src/app/layout.tsx`, `src/components/header-account.tsx`
(server viewer gate pattern), `src/lib/auth/session.ts` (`getCurrentViewer`, "use cache: private"),
`e2e/chat-widget.spec.ts`, `e2e/helpers/auth-session.ts`.

### What changes
1. Remove the "Gemini 2.5" Badge from the widget `SheetTitle` (title is just
   "Siftloom Assistant"); drop the now-unused `Badge` import.
2. "Sign in" link in the widget context bar renders only for unauthenticated users.
   New `src/components/chat/chat-widget-gate.tsx` (async server component) awaits the
   existing `getCurrentViewer()` and renders `<ChatWidget isAuthenticated={viewer !== null} />`.
   `src/app/layout.tsx` mounts it inside `<Suspense fallback={null}>` instead of `<ChatWidget />`
   (same pattern as `HeaderAccount` in `header.tsx`). Only a boolean crosses to the client —
   no viewer PII. Authenticated users see nothing extra in the bar (user decision).
3. Assistant messages render as Markdown via new dependency `react-markdown` (`^10.1.0`):
   links clickable; internal hrefs via next/link, external via `target="_blank"
   rel="noopener noreferrer"`; no `dangerouslySetInnerHTML`. User messages stay plain text.
4. e2e: authenticated case in `e2e/chat-widget.spec.ts` (no "Sign in" inside the widget panel,
   reusing `e2e/helpers/auth-session`) plus a deterministic case intercepting `POST /api/chat`
   with a canned Markdown assistant reply asserting a clickable anchor.

### What must not change
- `/api/chat` route, `src/lib/ai/chat-guard.ts`, rate limiting, `src/lib/ai/siftloom-prompt.ts`.
- Guest localStorage hydration / clear-history logic in the widget.
- Header components (`HeaderAccount`, `SignInLink`, `UserMenu`, `header.tsx`).
- Guest widget behavior: launcher button, quick prompts, existing guest e2e assertions.

### Security-relevant paths touched
`src/components/chat/chat-widget-gate.tsx` (new, session read), `src/app/layout.tsx`,
`src/components/chat/chat-widget.tsx` (auth-conditional UI), `package.json` (new dependency
react-markdown) — security-reviewer required.

### How it will be verified
`npx tsc --noEmit && npm run lint && npm run test:unit && npm run build && npx playwright test e2e/chat-widget.spec.ts && npm run format:check`

## Cycle log

### Cycle 1

- verifier: pass — all 6 spec-required suites green (`tsc`, `lint`, `test:unit` 122 tests, `build`, `playwright e2e/chat-widget.spec.ts` 6/6, `format:check`)
- coordinator-run suite: none
- reviewer: rejected — 2 required
- security-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding:
  - `e2e/chat-widget.spec.ts:128,172`: external-link branch of the Markdown renderer (`target="_blank" rel="noopener noreferrer"`, `src/components/chat/chat-widget.tsx:71`) is untested — an `https://` SSE-intercept case asserting those attributes is missing. (reviewer, Correctness)
  - `src/components/chat/chat-widget.tsx:62-75`: `...props` spread forwards the react-markdown HAST `node` prop to next/link and the external `<a>` — destructure `node` out before spreading. (reviewer, Maintainability)

### Cycle 2 (reduced: reviewer only — security filed none in cycle 1)

- verifier: pass — all 6 spec-required suites green (`tsc`, `lint`, `test:unit` 122 tests, `build`, `playwright e2e/chat-widget.spec.ts` 7/7, `format:check`)
- coordinator-run suite: none
- reviewer: approved_with_notes — 0 required (both cycle-1 required changes confirmed resolved)
- security-reviewer: not dispatched (reduced cycle)
- resolved since cycle 1: 2 (external-link test coverage; HAST `node` leak)
- outstanding: none

### Cycle 3 (delivering, full fan-out — tree unchanged since cycle 2)

- verifier: pass (carried from cycle 2 — tree unchanged; all 6 suites green)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- resolved since cycle 2: 0
- outstanding: none

**DELIVERED 2026-09-03** — full fan-out cycle 3: reviewer approved (0 required), security-reviewer approved (0 required), verifier passed (tsc, lint, test:unit 122, build, playwright 7/7, format:check).
Notes carried to human:
- `src/components/chat/chat-widget.tsx:68` — `href.startsWith("/")` routes protocol-relative `//host` URLs through next/link instead of the external branch (security, minor; one-line tighten if desired).
- `src/components/chat/chat-widget.tsx:76` — safe `target`/`rel` set before `{...props}`; a future markdown plugin injecting those attributes would override them (security + reviewer, minor).
- `e2e/chat-widget.spec.ts` — the two SSE-intercept tests duplicate the canned-stream construction; extract a helper if more cases appear (reviewer, minor).
- `e2e/chat-widget.spec.ts:95-111` — guest-branch presence of the "Sign in" link is not pinned by an explicit assertion (reviewer, minor).
- `src/components/chat/chat-widget-gate.tsx:8` — a session-lookup throw in the root-layout gate routes to the root error boundary; consider defaulting to `isAuthenticated={false}` on error (reviewer, minor).
