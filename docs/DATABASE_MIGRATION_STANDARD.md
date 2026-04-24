# Database Migration Standard

## Goal

This document defines the long-term migration standard for the project.

It is written to support two environments safely:

1. Supabase / PostgreSQL local and hosted runtime
2. Forward-only formal migrations for schema evolution

## Current Reality

The project originally drifted because:

- the active Payload schema changed faster than formal migrations
- local SQLite repairs were applied directly before the Postgres cutover
- some legacy tables stayed in historical databases even after the configuration changed

This is now partially corrected by the archived baseline reconciliation migration:

- [20260417_023000_database_baseline_reconciliation.ts](/D:/web/payload-local-demo/src/migrations/20260417_023000_database_baseline_reconciliation.ts)

## Migration Layers

### Layer 1: Payload Runtime Schema

Primary source:

- [src/payload.config.ts](/D:/web/payload-local-demo/src/payload.config.ts)

This file defines what the application expects.

### Layer 2: Generated Schema Snapshot

Generated source:

- [src/payload-generated-schema.ts](/D:/web/payload-local-demo/src/payload-generated-schema.ts)

Use it as the schema snapshot generated from the current Payload config.

### Layer 3: Formal Migrations

Current migration files:

- [20260413_094128_add_stripe_subscriptions.ts](/D:/web/payload-local-demo/src/migrations/20260413_094128_add_stripe_subscriptions.ts)
- [20260417_023000_database_baseline_reconciliation.ts](/D:/web/payload-local-demo/src/migrations/20260417_023000_database_baseline_reconciliation.ts)

These files are the formal migration history and must become the only supported way to evolve schema.
The SQLite reconciliation migration is now a Postgres no-op and should be treated as historical archive, not an active repair path.

### Layer 4: Legacy Repair Script

Legacy support file:

- No repair script should be required for normal development anymore.

Policy:

- formal migrations are now the primary schema management strategy
- do not introduce new schema drift via ad-hoc repair scripts
- do not rely on manual database patching in production deployment

## Formal Baseline

The current formal baseline includes:

### Core Business Tables

- users
- users_sessions
- media
- generation_tasks
- task_events
- models
- models_formats
- models_tags
- homepage_items
- posts
- announcements
- model_bundles
- credits
- credit_transactions
- credit_products
- billing_subscriptions
- addresses
- print_orders
- shopify_payments

### Globals

- site_settings
- homepage_content
- ai_provider_settings
- storage_settings
- security_settings
- runtime_deployment_settings

### Payload System Tables

- payload_kv
- payload_locked_documents
- payload_locked_documents_rels
- payload_preferences
- payload_preferences_rels
- payload_migrations

### Localized / Version / Relationship Tables

Keep these as Payload-managed support tables. They are part of the formal baseline when the related collection/global uses localization, versions, arrays, or relationships.

## Local SQLite Standard

### Required commands after schema changes

1. `pnpm payload generate:db-schema`
2. `pnpm generate:types`
3. `pnpm exec tsc --noEmit`

### New schema changes rule

For any future collection/global change:

1. update Payload config
2. regenerate schema
3. add a formal migration
4. generate types
5. update docs if the table model changed

Do not stop at step 2.

## Future AWS PostgreSQL / RDS Standard

### Target policy

AWS PostgreSQL / RDS should use formal migrations, not local repair scripts.

### Recommended rollout

1. Provision a clean PostgreSQL database in AWS RDS
2. Apply only formal migrations from `src/migrations`
3. Validate schema creation on PostgreSQL
4. Import approved business data only
5. Skip Payload system tables unless there is a specific migration reason

### Recommended data to migrate from SQLite to PostgreSQL

Migrate:

- users
- media
- generation_tasks
- task_events
- models
- homepage_items
- posts
- announcements
- model_bundles
- credits
- credit_transactions
- credit_products
- billing_subscriptions
- addresses
- print_orders
- shopify_payments
- required globals

Do not blindly migrate:

- payload_locked_documents
- payload_preferences
- payload_migrations
- legacy tables like `email_settings`
- legacy tables like `homepage_content_selling_points`

### PostgreSQL cutover checklist

1. Admin opens without schema errors
2. Global settings pages open
3. Users can authenticate
4. Content collections can list/create/update
5. AI tasks can read/write
6. Commerce tables are queryable
7. Signed download flow still works
8. Webhook endpoints can still persist data

## Rules For Future Developers

1. Never patch production schema manually in the database console unless it is an emergency repair.
2. Any emergency repair must be backfilled into a formal migration.
3. Do not introduce new long-lived tables without updating:
   [DATABASE_TABLE_REFERENCE.md](/D:/web/payload-local-demo/docs/DATABASE_TABLE_REFERENCE.md)
4. Do not delete legacy tables until their removal is represented in a reviewed migration plan.
5. For AWS / RDS work, treat PostgreSQL as the target source of truth, not the repaired SQLite file.

## Outstanding Cleanup Work

1. Backfill additional formal migrations for any future table changes instead of growing the repair script.
2. Decide removal or archival policy for:
   - `email_settings`
   - `homepage_content_selling_points`
3. Add a schema-drift CI check comparing:
   - Payload config
   - generated schema
   - migration history
