# Apply Siftloom color palette and visual theme

## Spec
In `src/app/globals.css`:
- Configure the dark theme tokens to match Siftloom: background `#07090D`, primary `#2FB8AE` (teal), primary foreground `#06140F`, muted `#9AA6B2`, and accent tones (`#3FA1DE` blue, `#CBE37C` lime).
- Add utility classes for the Siftloom gradient (`bg-siftloom-gradient`, `text-siftloom-gradient`), hover glow shadow (`shadow-siftloom-glow`), and background grid (`sl-bg-grid`).
In `src/components/ui/button.tsx`:
- Enhance `default` variant with the Siftloom tri-color gradient (`#3FA1DE` → `#2FB8AE` → `#CBE37C`), dark text (`#06140F`), hover lift `translateY(-2px)`, and teal glow shadow.
In `src/app/(auth)/login/page.tsx` and `auth-card.tsx`:
- Apply the background grid, ambient radial glows, and gradient text accents matching the Siftloom design.
In `src/components/header.tsx` and `src/app/(main)/page.tsx`:
- Align header glassmorphism and main cards with the new color tokens.

What must not change:
Theme switcher functionality (dark / light / system) and theme persistence.
Better Auth logic, Server Actions, and existing E2E tests.

How it will be verified:
- `npm run lint`
- `npm run build`
- `npm run test:agents`

## Cycle log

### Cycle 1
- verifier: pass
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: rejected — 1 required
- resolved since cycle 0: 0
- outstanding:
  - src/components/ui/button.tsx:13: remove unused duplicate gradient variant from buttonVariants

### Cycle 2
- verifier: pass
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved — 0 required
- resolved since cycle 1: 1
- outstanding: none

## Delivered
Delivered in cycle 2. Applied Siftloom color scheme, gradient buttons, ambient glows, and dark-theme tokens across the application.
