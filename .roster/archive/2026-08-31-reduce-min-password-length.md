# Reduce minimum password length to 6 characters

## Spec
In `src/auth.ts`, change `minPasswordLength` from 12 to 6.
In `src/app/(auth)/register/actions.ts`, update `isValidPassword` check to require minimum length 6 and update the error message to "Use at least 6 characters, including one letter and one number.".
In `src/app/(auth)/register/_components/register-form.tsx`, update `minLength` on password inputs to 6, placeholder to "At least 6 characters", and helper text to "Must be at least 6 characters with letters and numbers.".

What must not change:
Password confirmation check (`password === confirmation`).
Better Auth email verification, session handling, rate limits, and maximum password length (128).

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
Reduced minimum password length from 12 to 6 characters across Better Auth configuration, server action validation, and client registration form.
