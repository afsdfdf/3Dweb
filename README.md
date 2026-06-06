# ThornsTavern

ThornsTavern is a 3D model / AI generation platform built on Payload CMS and Next.js. Users generate 3D models from images or prompts, browse a model library, purchase bundles, and order prints.

## Tech Stack

- **CMS / Backend**: Payload CMS 3.82 (`@payloadcms/db-postgres`)
- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: PostgreSQL (via Supabase)
- **Auth / Storage**: Supabase
- **Payments**: Stripe
- **3D**: Three.js (`@react-three/fiber`, `@react-three/drei`)
- **Styling**: Tailwind CSS 4
- **Package manager**: pnpm (see `engines.pnpm`)

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy the environment template and fill in the values:
   ```bash
   cp .env.example .env
   ```
   Key variables include `DATABASE_URL`, `SUPABASE_URL`, `PAYLOAD_SECRET`, Stripe keys, and `NEXT_PUBLIC_APP_URL` / `CANONICAL_APP_URL` (public origin used for SEO and email links).
3. Start the dev server:
   ```bash
   pnpm dev
   ```
   The frontend and the Payload admin (`/admin`) run on the same Next.js server.

## Common Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build (`next build --webpack`, required for Payload compatibility) |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm test:unit` | Run the unit test suite |
| `pnpm test:smoke` | Run the smoke test (checks key route HTTP status) |
| `pnpm generate:types` | Regenerate Payload types |
| `pnpm cleanup:temp` | Remove local temp/log files |

## Project Structure

```
src/
  access/        Payload access-control helpers
  app/
    (frontend)/  Public site + authenticated UI (App Router)
    (payload)/   Payload admin routes
    api/         Route handlers
  collections/   Payload collections (Users, Models, Credits, ...)
  endpoints/     Custom Payload endpoints
  globals/       Payload globals (site settings, ...)
  hooks/         Collection hooks
  i18n/          Localized strings
  lib/           Shared utilities (billing, auth, media, ai, supabase)
  migrations/    Database migrations
supabase/        SQL schema / reset scripts
scripts/         Maintenance & test scripts
tests/           Unit / integration tests
docs/            Additional documentation
```

See `AGENTS.md` and `docs/` for deeper architectural notes.
