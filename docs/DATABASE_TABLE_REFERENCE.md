# Database Table Reference

## Purpose

This file is the current database-domain reference for development, deployment preparation, and future maintenance.

Use it to answer:

1. Which tables belong to active product domains.
2. Which tables are Payload system tables.
3. Which historical tables or generated-schema leftovers require caution.

## Source Of Truth

Primary sources:

- [src/payload.config.ts](/D:/web/payload-local-demo/src/payload.config.ts)
- [src/payload-generated-schema.ts](/D:/web/payload-local-demo/src/payload-generated-schema.ts)
- [src/payload-types.ts](/D:/web/payload-local-demo/src/payload-types.ts)
- active PostgreSQL schema
- formal migrations in [src/migrations](/D:/web/payload-local-demo/src/migrations)

Migration policy:

- [DATABASE_MIGRATION_STANDARD.md](/D:/web/payload-local-demo/docs/DATABASE_MIGRATION_STANDARD.md)

## Runtime Database

- PostgreSQL is the only supported runtime database.
- Historical SQLite references are legacy context only.
- Do not treat `payload.db` as an active source of truth.
- Future schema changes must be represented in formal migrations.

## Naming Rules

- Base collection tables: `users`, `models`, `posts`
- Global tables: `site_settings`, `storage_settings`
- Nested array/group tables: `models_formats`, `homepage_content_faq`
- Localized tables: `<base>_locales`
- Draft/version tables: `_<base>_v`
- Localized version tables: `_<base>_v_locales`
- Relationship tables: `<base>_rels`

## Active Registered Collections

These collection slugs are registered in `src/payload.config.ts`:

- `users`
- `media`
- `generation-tasks`
- `task-events`
- `models`
- `homepage-items`
- `posts`
- `announcements`
- `model-bundles`
- `credits`
- `credit-transactions`
- `credit-products`
- `billing-subscriptions`
- `addresses`
- `print-orders`
- `shopify-payments`

## Active Registered Globals

These global slugs are registered in `src/payload.config.ts`:

- `site-settings`
- `homepage-content`
- `ai-provider-settings`
- `storage-settings`
- `security-settings`
- `runtime-deployment-settings`

## Active Business Table Families

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

## Caution: Generated Schema Or Legacy Drift

Some table families may appear in generated schema, previous migrations, service files, or historical databases even when their collection configs are not currently registered.

Current caution list:

- `user_follows`
- `model_comments`
- `model_likes`
- `model_favorites`
- `engagement_views`
- `email_settings`
- `homepage_content_selling_points`

Do not build new frontend or service logic against these as active collections unless their collection configs are present and registered in `src/payload.config.ts`.

## Current Drift Risks

### 1. Config vs Generated Schema

If generated schema contains tables for collections no longer registered in Payload config, future work must resolve whether those tables are historical leftovers or active features waiting for collection config restoration.

### 2. Internal Relation Tables

Adding or removing collections can require relation-column changes in Payload internal tables such as:

- `payload_locked_documents_rels`
- `payload_preferences_rels`

Missing relation columns can break admin document updates even when the main collection table exists.

### 3. Postgres Enum Drift

Changes to select field options can require enum migration work in PostgreSQL.

Watch especially:

- homepage item placements
- task status values
- order/payment status values
- model status and visibility values

## Recommended Schema Change Workflow

1. Update Payload collection/global config.
2. Run `pnpm payload generate:db-schema`.
3. Add a formal migration.
4. Run `pnpm generate:types`.
5. Run `pnpm exec tsc --noEmit`.
6. Update this file if table families changed.
7. Update `AI_PROJECT_MEMORY.md` if the change affects long-lived architecture.

## Recommended Cleanup Tasks

1. Resolve whether social table families should be restored as active collections or removed from generated-schema/service expectations.
2. Keep `email_settings` historical unless `EmailSettings` is intentionally re-registered.
3. Keep `homepage_content_selling_points` historical unless the homepage schema intentionally reintroduces it.
4. Add CI drift checks comparing Payload config, generated schema, migrations, and active PostgreSQL schema.
