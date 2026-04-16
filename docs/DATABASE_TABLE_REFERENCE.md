# Database Table Reference

## Purpose

This file is the current database baseline for local development, deployment preparation, and future maintenance.

Use it to answer three questions:

1. Which tables are part of the active product data model
2. Which tables are Payload system tables
3. Which tables are historical or compatibility leftovers that need special care

## Source Of Truth

Primary sources:

- [src/payload.config.ts](/D:/web/payload-local-demo/src/payload.config.ts)
- [src/payload-generated-schema.ts](/D:/web/payload-local-demo/src/payload-generated-schema.ts)
- [src/payload-types.ts](/D:/web/payload-local-demo/src/payload-types.ts)
- [payload.db](/D:/web/payload-local-demo/payload.db)

Compatibility / repair sources:

- [src/migrations/20260413_094128_add_stripe_subscriptions.ts](/D:/web/payload-local-demo/src/migrations/20260413_094128_add_stripe_subscriptions.ts)
- [src/migrations/20260417_023000_database_baseline_reconciliation.ts](/D:/web/payload-local-demo/src/migrations/20260417_023000_database_baseline_reconciliation.ts)

Formal migration process reference:

- [DATABASE_MIGRATION_STANDARD.md](/D:/web/payload-local-demo/docs/DATABASE_MIGRATION_STANDARD.md)

## Important Notes

- The project currently uses SQLite in local development.
- Some schema changes were previously repaired manually in the local SQLite file instead of being represented as formal Payload migrations.
- The baseline reconciliation migration now captures the active schema required by the current codebase.

## Naming Rules

- Base collection tables: `users`, `models`, `posts`
- Global tables: `site_settings`, `storage_settings`
- Nested array/group tables: `models_formats`, `homepage_content_faq`
- Localized tables: `<base>_locales`
- Draft/version tables: `_<base>_v`
- Localized version tables: `_<base>_v_locales`
- Relationship tables: `<base>_rels`

## Active Business Tables

### User And Auth

- `users`
- `users_sessions`

### Media And Assets

- `media`
- `models`
- `models_formats`
- `models_tags`

### AI Production

- `generation_tasks`
- `task_events`
- `ai_provider_settings`
- `ai_provider_settings_providers`

### Content Operations

- `homepage_items`
- `homepage_items_locales`
- `_homepage_items_v`
- `_homepage_items_v_locales`

- `posts`
- `posts_locales`
- `_posts_v`
- `_posts_v_locales`

- `announcements`
- `announcements_locales`
- `_announcements_v`
- `_announcements_v_locales`

- `model_bundles`
- `model_bundles_locales`
- `model_bundles_rels`
- `model_bundles_tags`
- `model_bundles_tags_locales`
- `_model_bundles_v`
- `_model_bundles_v_locales`
- `_model_bundles_v_rels`
- `_model_bundles_v_version_tags`
- `_model_bundles_v_version_tags_locales`

### Commerce

- `credits`
- `credit_transactions`
- `credit_products`
- `billing_subscriptions`
- `addresses`
- `print_orders`
- `shopify_payments`

### Runtime / Platform Globals

- `site_settings`
- `site_settings_header_nav`
- `site_settings_credit_packages`

- `homepage_content`
- `homepage_content_faq`

- `storage_settings`
- `security_settings`
- `security_settings_allowed_mutation_origins`
- `security_settings_allowed_remote_asset_hosts`
- `runtime_deployment_settings`

## Payload System Tables

- `payload_kv`
- `payload_locked_documents`
- `payload_locked_documents_rels`
- `payload_preferences`
- `payload_preferences_rels`
- `payload_migrations`

## Historical / Legacy Tables To Watch

These exist in the current SQLite database, but they are not the main target shape we should build on going forward.

### Legacy Content Globals

- `homepage_content_selling_points`

Reason:
This table exists in the local database but is not part of the current active homepage content model we are maintaining.

### Legacy Email Global

- `email_settings`

Reason:
Email settings now live inside `site_settings.emailSettings` rather than a standalone top-level global in the current configuration.

## Tables Reconciled Into Formal Baseline Migration

The following table families are now formally represented by the baseline reconciliation migration:

- `homepage_items*`
- `posts*`
- `announcements*`
- `model_bundles*`
- `storage_settings`
- `security_settings*`
- `runtime_deployment_settings`

The following relation columns are part of the formal baseline reconciliation:

- `homepage_items_id`
- `posts_id`
- `announcements_id`
- `model_bundles_id`

## Current Drift Risks

### 1. Migration Drift

Current state:

- [src/migrations/20260413_094128_add_stripe_subscriptions.ts](/D:/web/payload-local-demo/src/migrations/20260413_094128_add_stripe_subscriptions.ts) is effectively a no-op.
- The active baseline is now captured in [src/migrations/20260417_023000_database_baseline_reconciliation.ts](/D:/web/payload-local-demo/src/migrations/20260417_023000_database_baseline_reconciliation.ts).

Risk:

- A fresh environment may not match the current local database unless the repair script is run.

### 2. Generated Schema vs Historical DB

Current state:

- [src/payload-generated-schema.ts](/D:/web/payload-local-demo/src/payload-generated-schema.ts) now reflects newer content tables.
- Older SQLite snapshots may still miss those tables.

Risk:

- Admin can fail at runtime when generated schema expects tables or relation columns that SQLite does not yet contain.

### 3. Legacy Tables Still Present

Current state:

- `email_settings`
- `homepage_content_selling_points`

Risk:

- Future developers may mistake these for current production data sources.

## Recommended Deployment Workflow

### Local Development

1. Run `pnpm payload generate:db-schema`
2. Run `pnpm generate:types`
3. Run migrations when schema history changes
4. Start the app

### Before Production Or Shared Environment Deployment

1. Review this table list
2. Convert manual SQLite repair steps into formal migrations
3. Rebuild the generated schema
4. Re-generate types
5. Verify admin globals open successfully
6. Verify content collections appear in admin

## Recommended Next Cleanup Tasks

1. Prefer formal migrations over any direct database repair strategy.
2. Decide whether to remove or archive legacy tables:
   `email_settings`
   `homepage_content_selling_points`
3. Add a repeatable database bootstrap script for fresh environments.
4. Add a schema drift check to CI for SQLite development mode.

## Full Local Table List

Current `payload.db` tables:

- `_announcements_v`
- `_announcements_v_locales`
- `_homepage_items_v`
- `_homepage_items_v_locales`
- `_model_bundles_v`
- `_model_bundles_v_locales`
- `_model_bundles_v_rels`
- `_model_bundles_v_version_tags`
- `_model_bundles_v_version_tags_locales`
- `_posts_v`
- `_posts_v_locales`
- `addresses`
- `ai_provider_settings`
- `ai_provider_settings_providers`
- `announcements`
- `announcements_locales`
- `billing_subscriptions`
- `credit_products`
- `credit_transactions`
- `credits`
- `email_settings`
- `generation_tasks`
- `homepage_content`
- `homepage_content_faq`
- `homepage_content_selling_points`
- `homepage_items`
- `homepage_items_locales`
- `media`
- `model_bundles`
- `model_bundles_locales`
- `model_bundles_rels`
- `model_bundles_tags`
- `model_bundles_tags_locales`
- `models`
- `models_formats`
- `models_tags`
- `payload_kv`
- `payload_locked_documents`
- `payload_locked_documents_rels`
- `payload_migrations`
- `payload_preferences`
- `payload_preferences_rels`
- `posts`
- `posts_locales`
- `print_orders`
- `runtime_deployment_settings`
- `security_settings`
- `security_settings_allowed_mutation_origins`
- `security_settings_allowed_remote_asset_hosts`
- `shopify_payments`
- `site_settings`
- `site_settings_credit_packages`
- `storage_settings`
- `task_events`
- `users`
- `users_sessions`
