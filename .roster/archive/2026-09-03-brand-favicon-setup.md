# Siftloom: brand favicon and app icon setup

## Spec

Bounded change.

### What changes
1. `src/app/favicon.ico`: Replace default Next.js/Vercel icon with a multi-size .ico (16x16, 32x32) generated from `public/siftloom-logo.png`.
2. `src/app/icon.png` (32x32) and `src/app/apple-icon.png` (180x180): Generate standard App Router icon files from `public/siftloom-logo.png`.
3. `src/app/layout.tsx`: Synchronize `metadata.icons` with `/favicon.ico` and `/apple-icon.png`.
4. `public/`: Remove unused boilerplate template SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
5. `src/app/metadata.test.ts`: Add assertion for `icons` metadata in root layout.

### What must not change
- Existing `description`, `title`, OpenGraph and Twitter metadata.
- Brand assets `public/siftloom-logo.png` and `public/og-image.png`.
- Route logic, authentication, chat widget, UI components.
- No new dependencies in `package.json`.
- Developer does not commit.

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
- reviewer: approved_with_notes — 0 required
- security-reviewer: not dispatched (spec declares none)
- resolved since cycle 0: 0
- outstanding: none

**DELIVERED 2026-09-03** — Siftloom brand favicon and app icon setup; deleted unused boilerplate template SVGs.
