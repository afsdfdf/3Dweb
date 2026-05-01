# Development Guide

## Scope

This guide is the active engineering reference for day-to-day development.

It replaces temporary worklogs, dated audit notes, and one-off fix memos.

## Stack

- Next.js 16
- Payload CMS 3
- React 19
- Supabase / PostgreSQL runtime

## Important Paths

- App config:
  [src/payload.config.ts](/D:/web/payload-local-demo/src/payload.config.ts)
- Collections:
  [src/collections](/D:/web/payload-local-demo/src/collections)
- Globals:
  [src/globals](/D:/web/payload-local-demo/src/globals)
- Endpoints:
  [src/endpoints](/D:/web/payload-local-demo/src/endpoints)
- Tests:
  [tests](/D:/web/payload-local-demo/tests)

## Active Documentation

- Start with [DOCS_INDEX.md](/D:/web/payload-local-demo/docs/DOCS_INDEX.md).
- Treat [AI_PROJECT_MEMORY.md](/D:/web/payload-local-demo/docs/AI_PROJECT_MEMORY.md) as the current AI-readable architecture memory.
- Treat archived documents as historical context only.
- If archived guidance is still required, fold it into an evergreen root document instead of linking to the archived file as active guidance.

## Local Commands

- Start dev server:
  `pnpm dev`
- Build:
  `pnpm build`
- Generate import map:
  `pnpm generate:importmap`
- Generate Payload types:
  `pnpm generate:types`
- Generate DB schema snapshot:
  `pnpm payload generate:db-schema`
- Type check:
  `pnpm exec tsc --noEmit`
- Unit tests:
  `pnpm test:unit`
- Smoke tests:
  `pnpm test:smoke`

## PostgreSQL Runtime Defaults

The app now supports explicit PostgreSQL pool tuning for Supabase/Postgres deployments.

Optional environment variables:

- `POSTGRES_POOL_MAX` default `20`
- `POSTGRES_POOL_MIN` default `2`
- `POSTGRES_POOL_IDLE_TIMEOUT_MS` default `30000`
- `POSTGRES_POOL_CONNECTION_TIMEOUT_MS` default `5000`

Migration note:

- Keep these at defaults unless load testing shows a real need to tune them.
- Do not change project code or production values ad hoc; treat them as deployment-time overrides.

## Database Rules

- Treat [DATABASE_TABLE_REFERENCE.md](/D:/web/payload-local-demo/docs/DATABASE_TABLE_REFERENCE.md) as the current table inventory.
- Treat [DATABASE_MIGRATION_STANDARD.md](/D:/web/payload-local-demo/docs/DATABASE_MIGRATION_STANDARD.md) as the migration policy.
- Do not reintroduce SQLite runtime fallbacks or `payload.db`-based startup behavior.
- For future schema changes:
  1. Update Payload config
  2. Generate schema
  3. Add a formal migration
  4. Generate types
  5. Update docs if the table model changed

## Current Migration Baseline

Formal migrations currently tracked:

- [20260413_094128_add_stripe_subscriptions.ts](/D:/web/payload-local-demo/src/migrations/20260413_094128_add_stripe_subscriptions.ts)
- [20260417_023000_database_baseline_reconciliation.ts](/D:/web/payload-local-demo/src/migrations/20260417_023000_database_baseline_reconciliation.ts)

These migrations are now the authoritative baseline for future database evolution.

## Test Policy

- Any payment, credits, download, webhook, or permission change must include tests.
- Keep permanent test tooling only:
  - [scripts/run-unit-tests.mjs](/D:/web/payload-local-demo/scripts/run-unit-tests.mjs)
  - [scripts/smoke-test.mjs](/D:/web/payload-local-demo/scripts/smoke-test.mjs)
  - [scripts/alias-loader.mjs](/D:/web/payload-local-demo/scripts/alias-loader.mjs)

## Admin Access

- Admin URL:
  `http://127.0.0.1:3000/admin`
- Admin access requires an authenticated `admin` or `operator` role.

## Documentation Policy

- Keep only evergreen documents in `docs/`.
- Move dated reports, rollout checklists, one-off migration plans, and worklogs into `docs/archive/`.
- Delete or archive temporary pentest notes, dated worklogs, and one-off repair notes once the guidance is folded into active docs.
- Prefer updating a stable reference file over creating another dated report.
- Keep root docs aligned with the currently registered Payload config, not planned or dormant modules.

## AI Memory

- Treat [AI_PROJECT_MEMORY.md](/D:/web/payload-local-demo/docs/AI_PROJECT_MEMORY.md) as the persistent AI-readable knowledge base for the repository.
- After important backend, content-architecture, routing, or admin changes, update that file in the same task.
- Do not leave durable project decisions only in transient chat history.
