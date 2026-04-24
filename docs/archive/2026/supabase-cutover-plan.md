# Supabase Cutover Plan

## Decision

- Source of truth moving forward: Supabase Postgres
- Local SQLite data: abandoned
- Migration mode: rebuild schema on Supabase and cut application over
- Safety rule: do not write new business data to SQLite anymore

## Current Facts

### SQLite source database

File:

- `payload.db`

Observed business data counts:

- `users`: 5
- `credits`: 5
- `credit_transactions`: 1
- `generation_tasks`: 6
- `task_events`: 28
- `models`: 1
- `credit_products`: 1
- `site_settings`: 1
- `homepage_content`: 1
- `runtime_deployment_settings`: 1
- `security_settings`: 1
- `storage_settings`: 1

Observed SQLite-only risks:

- `src/payload.db` exists as an empty file, which indicates historical relative-path drift
- `billing_subscriptions` is defined in code but missing from the live SQLite database
- current migration history is not fully trustworthy because several migrations were SQLite compatibility repairs

### Supabase target database

Observed state:

- `public` schema has no project business tables yet
- `auth.users`: 0
- `storage.buckets`: 0
- `storage.objects`: 0

This means the cutover is a one-way transition into an empty target, not a merge between two active business databases.

## Active Payload Collections

These are the current collection definitions that matter for migration:

- `users`
- `media`
- `generation-tasks`
- `task-events`
- `models`
- `homepage-items`
- `posts`
- `announcements`
- `audit-logs`
- `model-bundles`
- `credits`
- `credit-transactions`
- `credit-products`
- `billing-subscriptions`
- `addresses`
- `print-orders`
- `shopify-payments`

## Active Payload Globals

- `site-settings`
- `homepage-content`
- `ai-provider-settings`
- `storage-settings`
- `security-settings`
- `runtime-deployment-settings`

Non-active but present in code:

- `email-settings`

## Cutover Constraints

1. Do not carry Payload internal tables forward as business data.
2. Do not keep runtime database switching between SQLite and Postgres.
3. Do not reuse the current SQLite migration set for Supabase/Postgres as-is.
4. Do not rely on SQLite draft/version mirror tables in the new design.

## Tables to Keep as Business Concepts

### Users and auth

- `users` -> `profiles`

### Credit ledger

- `credits` -> `credit_accounts`
- `credit_transactions` -> `credit_ledger_entries`
- `credit_products` -> `credit_products`

### AI production

- `generation_tasks` -> `ai_tasks`
- `task_events` -> `ai_task_events`
- `models` -> `models`
- `models_formats` -> `model_assets`
- `models_tags` -> `model_tag_assignments`

### Commerce

- `addresses` -> `addresses`
- `print_orders` -> `print_orders`
- `shopify_payments` -> `order_payments`
- `billing_subscriptions` -> `subscriptions`

### Content

- `posts` + `posts_locales` -> `posts` + `post_translations`
- `announcements` + `announcements_locales` -> `announcements` + `announcement_translations`
- `homepage_items` + `homepage_items_locales` -> `homepage_items` + `homepage_item_translations`
- `model_bundles*` -> normalized bundle tables

### Platform config

- `site_settings`
- `homepage_content`
- `ai_provider_settings`
- `storage_settings`
- `security_settings`
- `runtime_deployment_settings`

### Governance

- `audit_logs`

## Tables Not to Carry Forward 1:1

- `payload_kv`
- `payload_locked_documents`
- `payload_locked_documents_rels`
- `payload_preferences`
- `payload_preferences_rels`
- `payload_migrations`
- `users_sessions`
- all `_..._v` version mirror tables

## Recommended Target Architecture

### Auth

- Supabase Auth becomes the only auth system
- Add `public.profiles`
- `profiles.id` references `auth.users.id`
- Old Payload password/session storage is not retained as the primary auth mechanism

### Storage

- Keep current S3 asset pathing initially
- Do not mix database cutover with object-storage cutover in the same phase

### Content localization

- Keep localization
- Use translation tables instead of Payload `*_locales` mirrors

### Drafts and versions

- Do not recreate Payload-style draft/version tables in phase one
- If drafts are still needed later, add a simpler publish-state model

## Function Groups That Must Be Rewritten

### Session and user reads

- `src/app/(frontend)/_lib/session.ts`

### Credit ledger

- `src/lib/creditLedger.ts`
- `src/lib/ledgerStore.ts`
- `src/hooks/createDefaultCreditAccount.ts`

### AI task lifecycle

- `src/lib/aiTaskFlow.ts`
- `src/endpoints/aiTasks.ts`

### Subscription and Stripe

- `src/lib/subscriptionFlow.ts`
- `src/lib/stripeBilling.ts`
- `src/endpoints/subscriptions.ts`
- `src/endpoints/stripeWebhook.ts`
- `src/lib/adminSubscriptions.ts`

### Orders and payments

- `src/lib/printOrderFlow.ts`
- `src/endpoints/printOrders.ts`
- `src/lib/adminOrders.ts`
- `src/lib/adminPayments.ts`

### Admin workspace and search

- `src/lib/adminUsers.ts`
- `src/lib/adminTasks.ts`
- `src/lib/adminCredits.ts`
- `src/lib/adminOrders.ts`
- `src/lib/adminPayments.ts`
- `src/lib/adminSubscriptions.ts`
- `src/lib/adminSearch.ts`
- `src/lib/adminAudit.ts`
- `src/lib/adminConfig.ts`
- `src/lib/adminContent.ts`
- `src/lib/adminDashboard.ts`
- `src/lib/adminExceptions.ts`

### Frontend content and marketing reads

- `src/app/(frontend)/_lib/marketing.ts`
- `src/app/(frontend)/_lib/payload-data.ts`

## Recommended Cutover Phases

### Phase 1: schema-first

- create clean Supabase schema in `public`
- create indexes, unique constraints, foreign keys
- create RLS policies
- no data import required if local data is intentionally discarded

### Phase 2: auth-first application integration

- wire Supabase Auth
- create `profiles`
- replace Payload session-based reads

### Phase 3: core business rewrite

- rewrite credit ledger
- rewrite AI tasks
- rewrite orders
- rewrite subscriptions

### Phase 4: config and content rewrite

- move active globals/content reads to Supabase
- keep S3 asset access in place

### Phase 5: runtime lock-in

- remove SQLite adapter path
- remove runtime DB switching
- require Supabase/Postgres env vars to boot

## Immediate Next Step

Build the first Supabase schema migration set for:

1. `profiles`
2. `credit_accounts`
3. `credit_ledger_entries`
4. `ai_tasks`
5. `ai_task_events`
6. `models`
7. `subscriptions`
8. `print_orders`
9. `order_payments`
10. platform settings tables

Only after those exist should the runtime application be repointed away from SQLite.
