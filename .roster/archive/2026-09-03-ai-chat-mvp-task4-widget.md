# Siftloom AI Chat MVP — Task 4: Chat widget, layout mount, e2e smoke

## Spec

Architectural path. Spec: `docs/superpowers/specs/2026-09-03-ai-chat-mvp-design.md`.
Plan: `docs/superpowers/plans/2026-09-03-ai-chat-mvp.md` (Task 4).

### What changes:
- Create `src/components/chat/chat-widget.tsx`:
  - Client component (`"use client"`).
  - Floating launcher button in bottom-right with ping indicator (`aria-hidden="true"`).
  - Base UI `Sheet` with right slide-out panel (`SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`).
  - Uses AI SDK v5 `useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) })`.
  - Local state for input; `isLoading` derived from `status === "submitted" || status === "streaming"`.
  - Guest history persisted in `localStorage` (`siftloom_chat_messages_v1`) only after initial hydration read completes.
  - Auto-scroll to latest message on open and new messages.
  - Quick starter prompts chips.
  - Error alert with `regenerate()` retry action.
- Modify `src/app/layout.tsx`:
  - Import `ChatWidget` from `@/components/chat/chat-widget`.
  - Mount `<ChatWidget />` inside `<Providers>` after `{children}`.
- Create `e2e/chat-widget.spec.ts`:
  - Playwright smoke test verifying launcher button opens sheet, renders assistant title/welcome, and dismisses on Escape.

### What must not change:
- `src/app/layout.tsx` beyond the import and mount inside `<Providers>`.
- The 4 pre-staged documentation files in git index belong to Task 6 and must not be swept into this commit.

### Security-relevant paths touched:
`src/components/chat/chat-widget.tsx`, `src/app/layout.tsx` (global layout mounting client widget communicating with `/api/chat` and localStorage). Security reviewer required.

### How it will be verified:
`npx tsc --noEmit && npm run lint && npm run test:unit && npm run build && npx playwright test e2e/chat-widget.spec.ts && npm run test:agents && npm run check:agents && npm run format:check`
(Note: `npm run test:agents` has a known pre-existing environmental failure where doctor test calls `devin models list` without login; verified on clean HEAD).

## Cycle log

### Cycle 1 (Task 4)

- verifier: pass — 7/8 suites green (`tsc`, `lint`, `test:unit`, `build`, `e2e`, `check:agents`, `format:check`); `npm run test:agents` 1/56 fail is the pre-existing environmental failure (`devin models list` needs `devin auth login`, verified on clean HEAD); unit tests 22/22 files passed (122 tests); build compiled successfully; Playwright smoke 2/2 passed.
- coordinator-run suite: none (verifier ran all 8 suites; environmental failure documented)
- reviewer: rejected — 1 required (Correctness: `src/components/chat/chat-widget.tsx:83-98` broken hydration guard wipes `localStorage` on initial mount before state update re-renders)
- security-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding:
  - `src/components/chat/chat-widget.tsx:83-98`: Broken hydration guard wipes `localStorage` on initial mount. In React, all useEffect hooks run on mount in order; Effect 1 sets isRestoredRef.current = true, then Effect 2 runs with initial empty messages [] and removes localStorage item. Fix to ensure Effect 2 only synchronizes after the component has mounted and hydrated (e.g. tracking hydration state so synchronization only runs on subsequent renders when messages change). (reviewer, Correctness)

### Cycle 2 (Task 4 — reduced cycle)

- verifier: pass — 7/8 suites green (`tsc`, `lint`, `test:unit`, `build`, `e2e`, `check:agents`, `format:check`); `test:agents` unchanged environmental failure; unit tests 22/22 passed; Playwright 4/4 passed.
- coordinator-run suite: none
- reviewer: approved — 0 required (cycle 1 hydration guard confirmed resolved)
- security-reviewer: not dispatched (reduced cycle)
- resolved since cycle 1: 1 (hydration guard)
- outstanding: none

### Cycle 3 (Task 4 — delivering, full fan-out)

- verifier: pass (carried from cycle 2 — tree unchanged since; all suites green except pre-existing environmental test:agents failure)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: approved_with_notes — 0 required
- resolved since cycle 2: 0
- outstanding: none

**DELIVERED (Task 4) 2026-09-03** — full fan-out cycle 3: reviewer approved (0 required), security-reviewer approved_with_notes (0 required), verifier passed.
Notes carried to human:
- Minor note (security-reviewer): Guest chat history is persisted in browser localStorage under `siftloom_chat_messages_v1`. Safe for guest interactions with clear history button provided, but keep in mind for future sensitive flows.
