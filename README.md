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
| `npm run sync:agents`     | Regenerate per-harness agent profiles                |
| `npm run test:agents`     | Run agent-roster tests                               |
| `npm run check:agents`    | Fail if agent profiles drifted from source           |
| `npm run validate:agents` | Validate role permissions against capability classes |
| `npm run doctor:agents`   | Check discovery, collisions and installed harnesses  |

## Notes

- `src/app/` is the source of truth for routing. Keep Server Components as the default and push `'use client'` to the leaves.
- Tailwind CSS v4 uses CSS-based configuration via `@theme` in `globals.css`; there is no `tailwind.config.ts`.
- Secrets and local environment variables go in `.env.local` (ignored by git).

## Google authentication

The `/login` page uses Better Auth with Google OAuth. A local Postgres 17 server with an `appdev` and an `apptest` database is required. Add these values to the ignored `.env.local` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appdev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/appdev"
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Use the required Node.js runtime to generate a secret cross-platform:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copy the command output into `AUTH_SECRET`. In Google Cloud, register the callback URL for each environment:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-domain.example/api/auth/callback/google`

Restart the application after changing environment variables. Without all three values, `/login` remains available but disables Google sign-in.

Keep `AUTH_SECRET` stable across restarts and deployments. Rotating it invalidates existing JWT sessions; if a stale browser cookie causes `no matching decryption secret`, visit `/api/auth/signout` and confirm **Sign out** (POST), or clear the site's cookies, then return to `/login`. Do not restore the previous secret to recover old sessions.

Application auth architecture, extension rules, redirect contracts, and test strategy are documented in [`docs/auth-architecture.md`](docs/auth-architecture.md). Read it before changing authentication, session handling, protected routes, Header account state, or logout.

## agent-roster (brief)

This repository defines its agent operating contract once in `AGENTS.md` and `agents/`, then projects it into each supported harness (Claude Code, Devin, Antigravity, Codex, Cursor). Run `npm run sync:agents` after any change to roles or config. See `AGENTS.md` for the full contract.
