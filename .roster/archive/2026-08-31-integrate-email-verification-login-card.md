# Integrate email verification into /login auth card

## Spec
Embed the email confirmation & resend verification form directly into the `/login` auth card (`src/app/(auth)/login/_components/auth-card.tsx`), allowing seamless transition to the "Check your inbox / Confirm email" view without navigating to a standalone page.
Enhance the resend verification form (`resend-form.tsx`) with modern styling and `lucide-react` icons (`Mail`, `Send`, `CheckCircle2`, `ArrowRight`, `Sparkles`).
Update `registerAction` (`src/app/(auth)/register/actions.ts`) and `/verify-email` page (`src/app/(auth)/verify-email/page.tsx`) to redirect to `/login?verify=true` so no separate `/verify-email` page opens.
Update E2E tests in `e2e/registration.spec.ts` to verify the in-page email confirmation view.

What must not change:
Rate limiting and email verification logic in `resendVerificationAction` and Better Auth `signUpEmail`. Token callback and session redirection flow.

How it will be verified:
- `npm run lint`
- `npm run build`
- `npm run test:agents`

## Cycle log

### Cycle 1
- verifier: pass
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved — 0 required
- resolved since cycle 0: 0
- outstanding: none

## Delivery
Delivered email confirmation and resend verification integration into `/login` auth card with Lucide icons and redirect for `/verify-email`.
