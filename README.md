# next-auth

A Next.js 16 application with App Router, Tailwind CSS v4, Turbopack and TypeScript.

## For AI agents: read before you write

1. This project uses **Next.js 16**, **React 19**, **App Router**, **Tailwind CSS v4** and **Turbopack**. APIs and conventions may differ from older Next.js versions. Read the relevant guides in `node_modules/next/dist/docs/` first.
2. This repository also uses `agent-roster` to define agent roles and the review loop. Read `AGENTS.md` for the operating contract before making any code changes.

## Tech stack

- **Next.js 16** with **App Router** (`src/app/`)
- **React 19**
- **Tailwind CSS v4** with `@tailwindcss/postcss`
- **Turbopack** (default for `next dev`)
- **TypeScript 5** with strict mode
- **ESLint 9** with `eslint-config-next`
- **Babel React Compiler** for automatic memoization

## Project structure

```text
src/
  app/              # App Router routes
    layout.tsx      # root layout with Geist font
    page.tsx        # home page
    globals.css     # Tailwind imports and global styles
  components/       # shared UI components (create as needed)
  lib/              # utilities, auth, db, server actions (create as needed)
public/             # static assets
agents/             # agent-roster role definitions
config/             # agent-roster config and MCP
scripts/            # agent-roster generator and validator
tests/              # agent-roster test suite
docs/               # project research and notes
```

## Commands

| Command                   | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| `npm run dev`             | Start the development server with Turbopack          |
| `npm run build`           | Create an optimized production build                 |
| `npm run start`           | Start the production server                          |
| `npm run lint`            | Run ESLint                                           |
| `npm run db:studio`       | Open Prisma Studio against the `appdev` database     |
| `npm run sync:agents`     | Regenerate per-harness agent profiles                |
| `npm run test:agents`     | Run agent-roster tests                               |
| `npm run check:agents`    | Fail if agent profiles drifted from source           |
| `npm run validate:agents` | Validate role permissions against capability classes |
| `npm run doctor:agents`   | Check discovery, collisions and installed harnesses  |

## Notes

- `src/app/` is the source of truth for routing. Keep Server Components as the default and push `'use client'` to the leaves.
- Tailwind CSS v4 uses CSS-based configuration via `@theme` in `globals.css`; there is no `tailwind.config.ts`.
- Secrets and local environment variables go in `.env.local` (ignored by git).

## Authentication and email

The `/login` page uses Better Auth with Google OAuth and email/password sign-in, backed by Postgres 17 (see [Database](#database) below for the `appdev`/`apptest` split). Add these values to the ignored `.env.local` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appdev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/appdev"
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
# Gmail over authenticated SMTP. Works without a domain because the message is an
# ordinary Gmail message signed by Google's own SPF/DKIM — nothing is relayed on
# behalf of a domain the sender does not control.
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
EMAIL_FROM=""
# Tests only. When set, mail is appended here as JSON lines and never sent.
EMAIL_CAPTURE_FILE=""
```

Use the required Node.js runtime to generate a secret cross-platform:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copy the command output into `BETTER_AUTH_SECRET`. In Google Cloud, register the callback URL for each environment:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-domain.example/api/auth/callback/google`

Restart the application after changing environment variables. Without `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, `/login` remains available but disables Google sign-in; a missing `DATABASE_URL` crashes `/login` instead.

`SMTP_USER` is a full Gmail address, and `SMTP_PASSWORD` is a 16-character Google App Password — not that account's normal password. App Passwords require 2-Step Verification to already be enabled on the Google account (Google Account → Security → 2-Step Verification → App passwords). `EMAIL_FROM` should be the same Gmail address as `SMTP_USER`. No mail server, container or catcher is installed, expected, or to be pointed at for this project — see the design record in [`docs/superpowers/specs/2026-08-30-better-auth-email-password-design.md`](docs/superpowers/specs/2026-08-30-better-auth-email-password-design.md). Without SMTP configured, the registration form still accepts submissions and creates the account, but the verification email fails to send — the failure is caught in `src/auth.ts` and only logged to the server console, so the account exists but never receives a verification link.

Leave `EMAIL_CAPTURE_FILE` empty in your own `.env.local`. When it is set, `src/lib/email/client.ts` appends every outgoing message to that file as JSON and never actually sends it — including the account verification email, so registration will look like it succeeded while silently sending nothing. `playwright.config.ts` sets this variable automatically, only in the environment of the `next dev` process the test suite starts, so it never affects your own `npm run dev` as long as it stays unset in `.env.local`.

Keep `BETTER_AUTH_SECRET` stable across restarts and deployments. Rotating it invalidates existing JWT sessions; if a stale browser cookie causes `no matching decryption secret`, visit `/api/auth/signout` and confirm **Sign out** (POST), or clear the site's cookies, then return to `/login`. Do not restore the previous secret to recover old sessions.

Application auth architecture, extension rules, redirect contracts, and test strategy are documented in [`docs/auth-architecture.md`](docs/auth-architecture.md). Read it before changing authentication, session handling, protected routes, Header account state, or logout.

## Database

Postgres 17 provides two databases: `appdev`, used by `npm run dev` and Prisma Studio, and `apptest`, used only by the Playwright suite.

`apptest` is destroyed and recreated on every `npm test` run: `e2e/global-setup.ts` overrides `DATABASE_URL`/`DIRECT_URL` to `apptest`, checks the name, and calls `prisma migrate reset --force` against it first — never rely on data there surviving a test run. Never run `prisma migrate reset` by hand against `appdev` — a hand-run has no guard and destroys local development data: `prisma.config.ts` resolves its datasource from `.env.local`'s `DIRECT_URL`, which defaults to `appdev`.

Inspect `appdev`'s data with `npm run db:studio`, which opens Prisma Studio against that same `DIRECT_URL`, so no extra flags are needed. For a quick query without a browser, connect directly with `psql` (match the host, credentials and database name to whatever `DIRECT_URL` holds in your `.env.local` — the values below are the `.env.example` defaults):

```bash
psql postgresql://postgres:postgres@localhost:5432/appdev
```

After editing `prisma/schema.prisma`, run:

```bash
npx prisma migrate dev --name <description>
npx prisma generate
```

`migrate dev` creates and applies the migration against `appdev` (via `DIRECT_URL`); with this schema's custom generator `output`, Prisma 7 does not also regenerate the client, so `prisma generate` has to run afterward or the app keeps seeing the old schema.

## agent-roster (brief)

This repository defines its agent operating contract once in `AGENTS.md` and `agents/`, then projects it into each supported harness (Claude Code, Devin, Antigravity, Codex, Cursor). Run `npm run sync:agents` after any change to roles or config. See `AGENTS.md` for the full contract.
