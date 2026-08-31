# Unified in-page login and registration switcher with Lucide icons

## Spec
Convert the auth card on `/login` into an interactive switcher supporting both "Sign In" and "Create Account" forms in-place without page transitions. Enhance both credentials login and registration forms with refined UI styling and `lucide-react` icons (`Mail`, `Lock`, `User`, `KeyRound`, `Sparkles`, `ArrowRight`, `ShieldCheck`). Redirect `/register` to `/login` to prevent a standalone register route from opening. Update E2E tests in `e2e/registration.spec.ts` to verify registration via `/login` switcher.

What must not change:
Authentication logic with Better Auth, server actions (`signInWithCredentials`, `registerAction`), Google OAuth integration, and email verification (`/verify-email`). Authenticated user redirects and session validation.

How it will be verified:
- `npm run lint`
- `npx playwright test`

## Cycle log

### Cycle 1
- verifier: pass
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved — 0 required
- resolved since cycle 0: 0
- outstanding: none

## Delivery
Delivered unified in-page login and registration switcher on `/login` with Lucide icons and `/register` route redirect.
