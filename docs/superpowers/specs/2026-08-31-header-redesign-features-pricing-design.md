# Header redesign + Features/Pricing pages

## Context

Siftloom is a curated newsletter/community for AI, SaaS, and workflow tools. The home page
(`src/app/(main)/page.tsx`) already establishes a rich visual language: `sl-bg-grid` background,
ambient glows, `text-siftloom-gradient`, `sl-card` hover lift, brand color `#2fb8ae` (teal) with a
`#3fa1de → #2fb8ae → #cbe37c` gradient. The product is free, monetized via sponsorships (per the
home page FAQ).

The current `Header` (`src/components/header.tsx`) has two problems:

1. Nav links are not centered — logo, nav, and actions sit in one left-aligned flex row.
2. Active page is not highlighted with brand color.
3. The nav links `/features` ("Tools") and `/pricing` ("Community") both 404 — those pages don't exist,
   and the labels don't match the routes.

## What changes

### 1. Header redesign (`src/components/header.tsx` + new `src/components/header-nav.tsx`)

**Layout — logo left, nav center, actions right:**

- Outer `<header>` keeps `sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md`.
- Inner `<div className="container relative flex h-14 items-center">` gains `relative` for absolute nav centering.
- Logo `Link` stays on the left (unchanged markup).
- Nav is wrapped in a new client component `HeaderNav` rendered as
  `<nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex">` so it stays true-centered
  regardless of logo/action widths.
- Actions (`ModeToggle`, `HeaderAccount` in `Suspense`, `MobileNavigation`) move to a
  `<div className="ml-auto flex items-center gap-2">` on the right.

**Nav links:** `Home → /`, `Features → /features`, `Pricing → /pricing` (renamed from Tools/Community).
The `primaryLinks` array in `header.tsx` is updated to these labels.

**Active state — brand pill:** Active link gets `bg-primary text-primary-foreground rounded-md`.
Inactive links get `text-foreground/80 hover:text-foreground hover:bg-muted`.

**Active detection:** `HeaderNav` is a `"use client"` component using `usePathname()`. Match logic:
exact match for `/`; `pathname === href || pathname.startsWith(href + "/")` for others. The same
active-state styling applies in `MobileNavigation` (which is already a client component).

**Files:**

- `src/components/header.tsx` — updated layout, updated `primaryLinks` labels, renders `<HeaderNav />`
  instead of inline `NavigationMenu`. Remains a server component.
- `src/components/header-nav.tsx` — **new** client component: `usePathname()` + active pill rendering.
  Receives `links` as a prop. Renders the desktop nav (`hidden md:flex`, absolutely centered).
- `src/components/mobile-navigation.tsx` — add active-state pill styling to the links (uses
  `usePathname()`, already a client component).

### 2. `/features` page (`src/app/(main)/features/page.tsx`)

Server component, static. Lives under `(main)/layout.tsx` so the shared `Header` + active state work
automatically. Reuses the Siftloom visual language (`sl-bg-grid`, ambient glows,
`text-siftloom-gradient`, `sl-card`).

**Sections:**

1. **Hero** — `Badge` "Features", gradient headline, subtitle, `Join for Free` CTA → `/login`.
2. **Category grid** — the 6 category cards from the home page (Productivity, Developer Tools,
   Automation, SaaS & Software, AI & Agents, Growth & Marketing), each expanded with a short bulleted
   list of what's inside. Same icon/color treatment as home.
3. **What you get** — 3 cards (Curated Updates, Community Access, Early Alerts) mirroring the home
   page's "sneak peek" row format.
4. **CTA banner** — gradient card repeating the home page's partner/CTA pattern, `Join for Free` → `/login`.

### 3. `/pricing` page (`src/app/(main)/pricing/page.tsx`)

Server component, static, under `(main)/layout.tsx`. Reflects product reality: Siftloom is free,
monetized via sponsorships. No invented paid tiers.

**Sections:**

1. **Hero** — `Badge` "Pricing", headline "Free, forever", subtitle referencing the FAQ.
2. **Free tier** — a single highlighted `Card` listing what's included (curated updates, community
   access, early alerts, no paywall) with a `Join for Free` button → `/login`.
3. **Sponsor/Partner** — a card repeating the home page's partner section: "Reach a highly engaged B2B
   audience" + `Become a Partner` → `/login`.
4. **FAQ** — reuses the relevant FAQ items from the home page (Is it free, how often updates, what kind
   of tools) via the same `Accordion` markup.

## What must not change

- `src/app/(main)/layout.tsx` — unchanged (already renders `<Header />`).
- `src/app/(auth)/layout.tsx` — unchanged (already renders `<Header />` from the prior change).
- `src/components/header-account.tsx`, `src/components/user-menu.tsx`, `src/components/mode-toggle.tsx`
  — unchanged.
- `src/app/(main)/page.tsx` (home) — unchanged.
- `src/app/globals.css` — unchanged (all needed utility classes already exist).
- Auth flow, Better Auth config, schemas — unchanged.

## Verification

- `npm run lint` passes (0 errors; the 2 pre-existing warnings in `scripts/` are unrelated).
- `npm run build` passes; `/features` and `/pricing` appear as `○` (static) in the route output.
- `npx playwright test --workers 1` passes — existing `e2e/login.spec.ts` and `e2e/auth-session.spec.ts`
  remain green (they assert on header nav/account rendering).
- New e2e spec `e2e/header-navigation.spec.ts` asserts: all three nav links resolve (no 404), and the
  active link has the brand-pill class on `/`, `/features`, and `/pricing`.
- Visual: header on `/`, `/features`, `/pricing`, `/login` is identical; active link shows the teal
  pill; `/features` and `/pricing` no longer 404.
