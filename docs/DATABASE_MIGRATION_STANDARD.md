# Database Migration Standard

## Goal

This document defines the long-term migration standard for `thornstavern`.

The project supports:

- PostgreSQL runtime only.
- Forward-only formal migrations for schema evolution.
- Generated Payload schema and types as build artifacts that must stay synchronized with config and migrations.

## Current Reality

The project previously accumulated schema drift because:

- Payload schema changed faster than formal migrations.
- historical SQLite repair work existed before the Postgres-only runtime decision.
- generated schema and service code can contain references that are not currently active in `src/payload.config.ts`.

The active rule is now:

- no new ad-hoc schema repair path
- no new SQLite runtime path
- no production schema patch that is not backfilled into a formal migration

## Migration Layers

### Layer 1: Payload Runtime Config

Primary source:

- [src/payload.config.ts](/D:/web/payload-local-demo/src/payload.config.ts)

This file defines what the application expects at runtime.

### Layer 2: Generated Schema Snapshot

Generated source:

- [src/payload-generated-schema.ts](/D:/web/payload-local-demo/src/payload-generated-schema.ts)

This file should be regenerated after Payload schema changes.

### Layer 3: Formal Migrations

Migration directory:

- [src/migrations](/D:/web/payload-local-demo/src/migrations)

Formal migrations are the supported way to evolve shared or hosted database schema.

### Layer 4: Active PostgreSQL Schema

The active database must match:

- Payload runtime config
- generated schema
- formal migration history

When they disagree, treat it as schema drift and resolve it deliberately.

## Required Workflow For Schema Changes

For every collection/global schema change:

1. Update Payload config and related collection/global files.
2. Run `pnpm payload generate:db-schema`.
3. Add a formal migration.
4. Run `pnpm generate:types`.
5. Run `pnpm exec tsc --noEmit`.
6. Update [DATABASE_TABLE_REFERENCE.md](/D:/web/payload-local-demo/docs/DATABASE_TABLE_REFERENCE.md) if table families changed.
7. Update [AI_PROJECT_MEMORY.md](/D:/web/payload-local-demo/docs/AI_PROJECT_MEMORY.md) if the change affects long-lived architecture.

For admin component path changes:

1. Run `pnpm generate:importmap`.
2. Run `pnpm exec tsc --noEmit`.

## Migration Rules

1. Prefer forward-only migrations.
2. Do not edit production schema manually except for emergency repair.
3. Any emergency repair must be backfilled into a reviewed formal migration.
4. Do not delete legacy tables until removal is represented in a reviewed migration plan.
5. Do not add new long-lived tables without updating the database reference and AI memory.
6. Treat enum changes as migrations, not as incidental code-only changes.
7. Check Payload internal relation tables when adding or removing collections.

## PostgreSQL Concerns

### Enum Drift

PostgreSQL enum values can drift from Payload select field options.

Common risk areas:

- `homepage-items.placement`
- task status values
- model status and visibility values
- order status values
- payment status values

### Relation Drift

Payload internal relation tables can need new relation columns when collections are added.

Watch:

- `payload_locked_documents_rels`
- `payload_preferences_rels`

### Generated Schema Drift

If generated schema references collections not registered in `src/payload.config.ts`, resolve whether the feature is:

- active and missing config
- intentionally dormant
- historical and should be cleaned up

## Deployment Checklist

Before shared or production deployment:

1. Confirm `DATABASE_PROVIDER=postgres`.
2. Confirm a valid `DATABASE_URL` or AWS RDS connection variables.
3. Apply formal migrations.
4. Regenerate Payload schema and types.
5. Run `pnpm exec tsc --noEmit`.
6. Verify admin opens.
7. Verify collection list/edit flows.
8. Verify global settings pages.
9. Verify auth, AI task, billing, order, media, and download flows relevant to the release.

## Data Migration Policy

Migrate approved business data only.

Usually safe candidates:

- users
- media metadata
- generation tasks and task events
- models
- homepage items and content globals
- posts, announcements, and model bundles
- credits and credit transactions
- subscriptions
- addresses
- print orders
- payment records
- required globals

Do not blindly migrate:

- `payload_locked_documents`
- `payload_preferences`
- `payload_migrations`
- historical or dormant tables unless they are intentionally restored

## Outstanding Cleanup Work

1. Resolve social table/config drift.
2. Decide whether `EmailSettings` should remain dormant or be fully removed from the active code tree.
3. Add CI drift checks comparing Payload config, generated schema, migrations, and active PostgreSQL schema.
