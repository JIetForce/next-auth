# Transfer full Siftloom landing sections and fix button gradient

## Spec
- In `src/components/ui/button.tsx` & `src/app/globals.css`:
  - Remove border and background clipping distortions from `default` gradient button variant (`border-0`, `linear-gradient(100deg, #3FA1DE, #2FB8AE 52%, #CBE37C)`).
- In `src/app/(main)/page.tsx`:
  - Implement all Siftloom landing sections:
    - Hero with social proof avatars (`Trusted by 10,000+ modern professionals`).
    - What We Do section (`#tools`) with 6 category cards and gradient icon badges.
    - What You'll Find Inside sneak peek section with 3 workflow preview cards.
    - FAQ accordion section with 5 expandable question items.
    - For Partners & Sponsors section (`#partners`) with CTAs and 2x2 stats matrix.
    - Footer (`#community`) with brand logo, copyright, and links (Twitter/X, Telegram, Privacy, Terms).

What must not change:
Authentication flow, Better Auth session checks, and E2E tests.
Theme switching support.

How it will be verified:
- `npm run lint`
- `npm run build`
- `npm run test:agents`

## Cycle log

### Cycle 1
- verifier: pass
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

## Delivered
Delivered in cycle 1. Fixed button gradient alignment without border clipping, and transferred all Siftloom landing sections (Hero with social proof, What We Do with 6 categories, Sneak Peek, FAQ, For Partners & Sponsors, and Footer).
