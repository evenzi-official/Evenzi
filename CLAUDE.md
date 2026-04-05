# CLAUDE.md - Evenzi Project Guide

## Project Overview

Evenzi is an early-stage wedding/event planning SaaS platform. Users create events, manage invitations, track RSVPs, and organize wedding-related tasks and budgeting. The app is currently at v0.1 with authentication implemented and core features (events, invitations, budgeting) planned but not yet built.

## Tech Stack

- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **UI:** React 18.3.1 + Tailwind CSS 4
- **Auth & Database:** Supabase (PostgreSQL) via `@supabase/ssr` and `@supabase/supabase-js`
- **Deployment:** Vercel

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

No test framework is configured yet.

## Project Structure

```
app/                  # Next.js App Router pages
  auth/               # Login/signup (Phone OTP, Google OAuth)
  auth/callback/      # OAuth callback handler
  home/               # Post-login dashboard
  api/auth/verify/    # Session verification endpoint
lib/supabase/         # Supabase client utilities
  client.ts           # Browser-side Supabase client
  server.ts           # Server-side Supabase client
  middleware.ts        # Session refresh + route protection logic
middleware.ts          # Next.js middleware entry point
ai/                   # AI agent configs, feature specs, workflows (reference docs)
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<supabase-anon-key>
```

## Architecture & Patterns

### Authentication
- Supabase Auth with Phone OTP and Google OAuth
- Middleware (`middleware.ts`) refreshes sessions on every request and protects routes
- Public paths: `/`, `/auth`, `/auth/*`, `/api/*`, `/_next/*`
- Protected paths redirect unauthenticated users to `/auth`
- `/home` does client-side auth verification via `getUser()`

### Supabase Client Usage
- **Browser:** use `createBrowserClient()` from `lib/supabase/client.ts`
- **Server components/API routes:** use `createClient()` from `lib/supabase/server.ts`
- Never add logic between `createServerClient()` and `supabase.auth.getUser()` in middleware

### Path Alias
- `@/*` maps to the project root (configured in `tsconfig.json`)

## Coding Conventions

### Naming
- **Directories:** kebab-case (`event-management`)
- **Components:** PascalCase (`EventCard.tsx`)
- **Utilities/functions:** camelCase (`getUserEvents`)
- **Constants:** UPPER_CASE (`MAX_RETRY_COUNT`)
- **Database tables/columns:** snake_case (`event_id`, `created_at`)

### Components
- Use `"use client"` directive only when client-side interactivity is needed
- Prefer server components for data fetching
- Functional components with hooks, no class components
- No centralized state management library; use local `useState` + Supabase server state

### API Routes
- Use plural nouns for endpoints (`/api/events`, `/api/invitations`)
- Handle errors with try-catch and return `NextResponse`
- Keep business logic extractable to a future `services/` layer

### Styling
- Tailwind CSS utility classes only (no CSS modules, no styled-components)
- Mobile-first responsive design

### TypeScript
- Strict mode is enabled; do not use `any` unless absolutely necessary
- Use proper types/interfaces, not inline object shapes for reused structures

## Database

- PostgreSQL via Supabase (no ORM, raw Supabase client queries)
- Auth tables managed automatically by Supabase Auth
- Planned tables: `events`, `invitations` (see `ai/features/` for schemas)

## Important Notes

- This is a v0.1 project; many features are planned but not yet implemented
- The `ai/` directory contains reference documentation for AI-driven development (agent roles, workflows, feature specs) - these are docs, not executable code
- Test phone number for dev: `9999999999` with OTP `123456`
- Phone auth is configured for India region (+91 prefix)
