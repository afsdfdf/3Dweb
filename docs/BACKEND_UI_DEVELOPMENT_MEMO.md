# Backend UI Development Memo

## Purpose

This memo tracks backend-owned UI configuration needed by the migrated formal frontend pages.

It should be used before wiring final frontend pages so UI components do not stay hardcoded when Payload can own the content, media, or user-facing settings.

No schema change has been made for this memo. Any future Payload schema change still requires generated types, database schema generation, formal migration, and validation.

## Reviewed Pages

- `src/app/(frontend)/home-test`
- `src/app/(frontend)/workbench-test`
- `src/app/(frontend)/model-detail-test`
- `src/app/(frontend)/account-test`

## Current Wiring Review

### UI Closeout Check

Current test-page closeout status:

- `home-test`, `workbench-test`, `model-detail-test`, and `account-test` returned HTTP 200 in the local dev server check.
- No browser runtime errors were found in the four-page Playwright pass.
- `home-test` public media URL handling now keeps local `/api/media/file/...` URLs as browser-safe relative URLs instead of sending them through signed URL resolution.
- Runtime S3 storage settings are cached briefly in process so one page render does not repeatedly read the same `storage-settings` global for every media asset.
- `home-test` public owner lookup now selects only the fields required by public author cards.

Remaining stability note:

- `model-detail-test` uses `/api/platform/models/:modelId/viewer` correctly, but local model asset delivery for `Adventurer.glb` is still slow in dev because the underlying media file is served through `/api/media/file/Adventurer.glb`. Keep the UI loading progress bar, and handle durable model delivery/caching in the later media-performance backend pass.

### `home-test`

Already wired:

- top navigation current user through `getCurrentNavUser()`
- featured strip and collection shelf through `homepage-items` plus public model fallback
- inspiration grid through public `models` and public owner profile data when allowed

Remaining backend gaps:

- editable featured strip ribbon/badge text is not modeled as a dedicated field
- public inspiration grid should avoid static fake author fallback before formal launch
- homepage prompt/workbench input area remains UI-only and should later connect to the real studio task flow

### `workbench-test`

Already wired:

- top navigation current user through `getCurrentNavUser()`
- right model library through current user's own `models`
- 3D model viewer through `/api/platform/models/:modelId/viewer`

Remaining backend gaps:

- generation form is still UI-only and not connected to `/api/studio/ai/tasks`
- uploaded image slots are UI-only and need upload/media flow integration
- model library pagination/search is currently client-local and should later map to a real query interface

### `model-detail-test`

Already wired:

- top navigation current user through `getCurrentNavUser()`
- public detail data through public `models`
- creator card through public owner profile when allowed
- model preview through `/api/platform/models/:modelId/viewer`

Remaining backend gaps:

- `ModelDetailAdBanner` is static and needs a backend promotion slot
- comments form is UI-only because comments endpoints/collections are not active
- like/favorite/action states are UI-only because reaction endpoints/collections are not active
- cart/download/print actions need commerce and credit-flow confirmation before formal launch

### `account-test`

Already wired:

- top navigation current user through `getCurrentNavUser()`
- avatar, display name, email, credit balance, and points history through server-side current-user Local API helpers

Remaining backend gaps:

- client-side profile edit/save needs registered `/api/account/profile`
- password change needs registered `/api/account/password`
- profile background edit needs the profile endpoint plus media upload/ownership flow
- avatar frame selection needs a backend-managed style catalog before it can become an admin-configurable UI

## Existing Backend Support

### Current User Navigation

The four migrated test pages can already receive the current user through `getCurrentNavUser()`:

- `home-test`
- `workbench-test`
- `model-detail-test`
- `account-test`

The current nav user includes:

- `id`
- `displayName`
- `email`
- `avatarUrl`
- `creditsBalance`
- `role`

Primary source:

- `src/app/(frontend)/_lib/session.ts`

### Account Profile

The service layer and endpoint module already define current account profile flows:

- `GET /api/account/profile`
- `PATCH /api/account/profile`
- `GET /api/account/dashboard`

Primary source:

- `src/endpoints/account.ts`
- `src/lib/accountService.ts`

Current registration status:

- these profile/dashboard endpoints are not registered in `src/payload.config.ts`
- registered account endpoints currently cover auth flows from `src/endpoints/accountAuth.ts`
- formal frontend wiring must either register the profile/dashboard endpoints first or use a server-side data adapter that calls the service layer safely

The account profile currently includes:

- `avatarUrl`
- `avatarFrame`
- `backgroundUrl`
- `displayName`
- `email`
- `fullName`
- `bio`
- `phone`
- `profileVisibility`
- `creditsBalance`

The `account-test` page now uses a server-side data adapter for avatar, account name, email, balance, and points history. Client-side profile editing should still wait for a registered `/api/account/profile`, `/api/account/password`, and profile media upload flow.

### Public Model Owner Cards

`home-test` and `model-detail-test` already have partial public creator wiring:

- public model cards use model owner display name when available
- creator avatar is only exposed when the owner profile is public and avatar media is guest-readable
- model detail side author card uses `detail.authorName` and `detail.authorAvatarSrc`

Primary sources:

- `src/app/(frontend)/home-test/_lib/homeTestData.ts`
- `src/app/(frontend)/model-detail-test/_lib/modelDetailTestData.ts`

Keep this boundary:

- public pages may show creator identity only for public profiles
- public pages may show avatar media only when media access rules allow it

## UI Slots Needing Backend Ownership

### Missing Registered Interfaces

Current missing or inactive interfaces for the migrated formal UI:

- `/api/account/profile` and `/api/account/dashboard` are defined in `src/endpoints/account.ts` but are not registered in `src/payload.config.ts`.
- `/api/account/password` is defined in `src/endpoints/account.ts` but is not registered in `src/payload.config.ts`.
- public model comments, reactions, favorites, follows, and engagement endpoints exist in dormant endpoint/service files but depend on social collections that are not currently active in `src/payload.config.ts`.
- model detail sidebar banner has no backend-managed read interface or Payload content slot.
- avatar frame style catalog has no admin-managed collection/global read interface.
- homepage featured strip and collection shelf are mostly backed by `homepage-items`, but editable ribbon/badge copy is not currently represented as its own field.

Frontend rule:

- use server-side Local API adapters for current test-page validation where safe and already available
- do not client-fetch unregistered endpoint paths
- record missing backend surface here and defer backend schema/API work until UI integration is stable

### User Avatar Frame Styles

Current state:

- `users.avatarFrame` exists as an enum with `none`, `ember`, `kick`, and `emerald`.
- `accountService` accepts and returns `avatarFrame`.
- the `/api/account/profile` endpoint module accepts and returns `avatarFrame`, but the endpoint is not currently registered.
- The current enum is enough for basic user selection but not enough for admin-managed visual styles.

Needed backend product shape:

- admins should manage avatar frame styles in a dedicated backend entry
- users should be able to choose from active basic styles
- premium, event, or locked styles should be representable later without changing UI contracts

Recommended future model:

- Add an `avatar-frame-styles` collection, or an equivalent global group if the set stays very small.
- Prefer a collection if styles can grow, be sorted, retired, localized, or tied to events/subscriptions.

Recommended fields:

- `key`: stable unique style key used by frontend and user profile
- `title`: admin/user-facing style name
- `thumbnail`: upload relation to `media`
- `frameImage`: upload relation to `media`
- `description`: optional text
- `isActive`: whether users can see the style
- `isUserSelectable`: whether normal users can choose it
- `sortOrder`: ordering in account settings
- `unlockRule`: optional reserved field for future subscription/event/achievement gating

Recommended user profile relation:

- keep the current `users.avatarFrame` enum only as the short-term compatibility path
- later migrate to a stable key or relationship once the style catalog exists

Frontend consumers:

- top navigation avatar
- account profile avatar block
- model detail author card
- home public model author cards
- future creator profile pages

### Model Detail Sidebar Banner

Current UI component:

- `ModelDetailAdBanner`
- DOM target: model detail sidebar banner image
- current asset: `/ui-lab/model-detail-uicut/images/detail-side-banner.png`

Current backend state:

- no dedicated backend slot was found for this model detail sidebar banner
- the component is currently static frontend UI

Needed backend product shape:

- operator/admin can configure the sidebar banner image
- operator/admin can set link target
- operator/admin can set alt/title/campaign label
- banner should support visibility and scheduling

Recommended future model:

- Add a general `promotion-slots` collection for cross-page promotional UI, or add a `modelDetail` group in a global only if this remains a single fixed slot.
- Prefer `promotion-slots` if the same system will also manage account, checkout, detail, or homepage promo surfaces.

Recommended fields:

- `slot`: enum such as `model-detail-sidebar-banner`
- `title`
- `image`: upload relation to `media`
- `href`
- `altText`
- `isVisible`
- `publishAt`
- `expireAt`
- `sortOrder`

Media rule:

- public model detail banners must use guest-readable media, either `purpose = preview` or approved `publicAccess = true`.

### Home Featured Strip

Current UI area:

- `home-test` bottom hero strip
- visual frame: `heroBottomBanner`
- component: `HeroImageFrameStrip`

Current backend state:

- mostly supported through `homepage-items` with `placement = featured-rail`
- supports title, cover image, linked model/post/bundle/announcement, custom link, visibility, pinning, sort order, and card variant
- frontend currently hardcodes some ribbon labels such as `New Product` and `Featured`

Needed backend refinement:

- add or reuse a backend field for the displayed ribbon/badge label
- ensure each promo image has a link target and alt/title mapping
- keep featured strip items operator-managed through Payload

Recommended path:

- Keep using `homepage-items` for this area.
- Add a field such as `badgeLabel` or `ribbonLabel` if product wants editable text on the card ribbon.

### Home Collection Shelf

Current UI area:

- `home-test` second banner / collection shelf
- visual frame: `heroSecondBanner`
- component: `SelectableFrameRow`

Current backend state:

- mostly supported through `homepage-items` with `placement = collection-shelf`
- supports linked bundle through `linkedBundle`
- supports direct image through `coverImage`
- supports display title through `title`
- supports count text through `itemCountLabel`
- supports custom link through `customHref`

Needed backend refinement:

- confirm whether the shelf should display only `model-bundles` or also custom cards/models
- ensure operator can manage image, display title, item count label, destination link, visibility, and order

Recommended path:

- Keep using `homepage-items` for this area.
- Use `contentType = bundle` and `linkedBundle` when the card represents a curated model package.
- Use `contentType = custom` only for pure promotional tiles.

### Pricing Page Backend Settings

Current UI route:

- `src/app/(frontend)/pricing`
- public path: `/pricing`

Current backend wiring:

- subscription plans are loaded from `site-settings.subscriptionPlans` through `getSubscriptionPlans()`
- payment rail settings are loaded from `site-settings.paymentProviders` through `getPaymentProviderSettings()`
- the current active user subscription is loaded through `getCurrentUserActiveSubscription()` and `billing-subscriptions`
- checkout actions call registered Payload endpoints under `/api/billing/subscriptions/*`
- Stripe webhook handling is registered through `/api/platform/billing/webhooks/stripe`
- site description, support email, footer, announcement, and navigation still come from the existing marketing/site settings path

Registered subscription endpoints:

- `POST /api/billing/subscriptions/checkout`
- `POST /api/billing/subscriptions/sync`
- `POST /api/billing/subscriptions/portal`
- `POST /api/platform/billing/webhooks/stripe`

Current backend support:

- `site-settings.paymentProviders.subscriptionProvider` controls whether Stripe subscription actions are enabled
- `site-settings.paymentProviders.orderProvider` is available for commerce direction, with Stripe currently active and Shopify reserved
- `site-settings.paymentProviders.providerNotice` is displayed as operational context
- `site-settings.subscriptionPlans.starter`, `pro`, and `studio` provide plan name, short label, monthly price, monthly credits, description, and feature rows
- `subscriptionPlans.ts` keeps stable Stripe lookup keys in code for `starter`, `pro`, and `studio`
- `billing-subscriptions` stores the user's subscription state after checkout/webhook sync

Remaining backend gaps:

- `/pricing` page-level marketing copy, FAQ copy, plan badges, promo labels, and comparison text are still mostly component-owned rather than Payload-managed.
- Plan visibility, sort order, active/inactive state, highlighted plan, and promotional price labels are not modeled.
- Stripe lookup keys are stable code constants, not admin-editable settings. This is safer for now, but future plan rollout needs a deliberate policy.
- One-time credit package purchase UI is not part of the migrated pricing page yet. If added, it should use `credit-products` or a confirmed `site-settings.creditPackages` strategy.
- Checkout requires an authenticated user; anonymous users need a clear login/register redirect path before calling checkout.
- Shopify provider is reserved in settings, but no formal Shopify subscription checkout flow is active.
- Subscription success/cancel copy and post-checkout recovery UX should be reviewed before launch.

Recommended future path:

- Keep `starter`, `pro`, and `studio` as stable plan keys for the first formal launch.
- Add pricing-page content settings only after the UI is stable, preferably in `site-settings` if the page stays simple or a dedicated pricing content global if the page grows.
- Add plan `isActive`, `isFeatured`, `sortOrder`, `badgeLabel`, and optional `compareLabel` before marketing needs seasonal changes.
- Keep Stripe price lookup keys stable and code-reviewed unless a stronger admin operation model is added.
- Do not expose checkout actions through a custom Next route that shadows Payload REST collection paths.

## Frontend Wiring Priority

1. Wire `account-test` to real account data after registering the needed account profile/dashboard endpoint or adding a server-side data adapter.
2. Keep model detail author card wired to public owner data, but remove static fallback identity before formal launch.
3. Replace `ModelDetailAdBanner` static asset with backend-managed promotion slot data after the backend slot exists.
4. Keep `home-test` featured strip and collection shelf on `homepage-items`; add missing ribbon/badge field only if editable ribbon copy is required.
5. Keep `/pricing` on `site-settings.subscriptionPlans` and the registered `/api/billing/subscriptions/*` endpoints; only add new backend page-content settings after the final pricing UI is confirmed.
6. Replace residual static fallback author cards on public grids with empty/skeleton states when there is no real public data.

## Boundaries Not To Cross

- Do not expose private creator profile data on public pages.
- Do not mark all avatar or promo media as public by default.
- Do not use `overrideAccess: true` in frontend public data adapters to bypass media/model privacy.
- Do not add custom Next routes under Payload REST collection paths such as `/api/media`, `/api/users`, or `/api/models`.
- Do not change Payload schemas without type generation, schema generation, migration planning, and validation.

## Backend Work Items For Later

- Register or replace `/api/account/profile`, `/api/account/dashboard`, and `/api/account/password` before client-side formal account settings are enabled.
- Decide whether avatar frame styles should be a collection or a global.
- Add backend-managed detail sidebar banner slot.
- Add editable ribbon/badge label for `homepage-items` if required by the formal home design.
- Decide whether `/pricing` needs a dedicated backend-managed content global or whether `site-settings` is enough.
- Add active/sort/featured/badge controls for subscription plans if marketing needs runtime plan changes.
- Build a server-side account-test data adapter or register and client-fetch `/api/account/dashboard`.
- Review public media rules for all promotional images before exposing them on anonymous pages.

## Supabase Service Consolidation Memo

Runtime direction:

- Supabase is the platform service boundary for database and object storage.
- Database runtime is Supabase Postgres through `DATABASE_URL` and Payload's Postgres adapter.
- Object storage runtime is Supabase Storage through the Supabase SDK.
- Do not reintroduce AWS S3 signing, AWS S3 host construction, Payload S3 plugin registration, or AWS media sync hooks.

Current correct paths:

- Payload collections/globals should use Payload Local API or `req.payload` when working inside Payload-owned schemas and access rules.
- Supabase Storage upload, public URL creation, and signed URL creation should use Supabase SDK helpers in `src/lib/supabase/storage.ts`.
- Browser uploads should continue using Supabase signed upload URLs from `/api/media/upload-url`.
- Direct Postgres helper usage through `src/lib/postgres.ts` is still Supabase Postgres access, but should be treated as a backend optimization path, not the default replacement for Payload access-controlled reads.

Services that should be reviewed later for SDK/service unification:

- `src/lib/supabase/billing.ts`: uses direct SQL against Supabase-owned tables such as `profiles`, `subscriptions`, `print_orders`, and `order_payments`.
- `src/lib/supabase/queries.ts`: uses direct SQL for dashboard/marketing-style reads across Supabase mirror tables and Payload-like tables.
- `src/lib/supabase/storage.ts`: mostly uses Supabase SDK but still reads `storage_settings` through direct SQL.
- `src/endpoints/modelViewer.ts`: uses direct SQL to resolve `models_formats -> media.url` because Payload field access can hide file relations. Keep this unless a safer Payload read adapter is added.
- `src/lib/ledgerStore.ts`: reaches into Payload's Postgres client for transaction-aware ledger writes; keep transaction safety first.

Preview and download credit policy:

- Current imported public model previews and downloads do not need credit charging enabled.
- Keep preview access and download access as separate backend policy surfaces. Preview can remain free while downloads may charge later, or both can be configured independently.
- Future implementation should expose admin-managed backend settings for preview credit cost and download credit cost instead of hardcoding values in frontend components.
- Download charging must stay server-side and idempotent, with automatic refund on failed asset delivery.
- Preview charging, if enabled later, should be rate-aware and abuse-resistant so normal gallery browsing does not drain credits unexpectedly.

Optimization rule:

- Do not blindly replace Payload Local API with `supabase-js` table calls. That can bypass Payload access rules, hooks, drafts, relationships, and transaction behavior.
- Prefer Payload Local API for Payload-owned business data.
- Prefer Supabase SDK for Supabase Storage and Supabase auth/session helpers.
- Prefer direct Postgres only for explicit reporting, compatibility, or performance paths that are documented and tested.

Known data migration requirement:

- Historical demo `models_formats.file -> media.url` records still point to `/api/media/file/...`.
- Some of those local Payload media files are not present in Supabase Storage.
- Before final launch, migrate required GLB/JPG assets into the configured Supabase bucket and update media/model references to Supabase Storage public URLs or verified Payload media records backed by Supabase.

Current media migration state:

- A verified partial migration was completed on 2026-04-29 for media IDs `4`, `33`, `35`, and `89` through `96`.
- Migrated objects are stored under `media/migrated/<purpose>/...` in the configured Supabase bucket.
- `Robed Man.glb` and `Savage Warrior.glb` now load through `/api/platform/models/:modelId/viewer` and redirect to Supabase signed URLs.
- The remaining legacy demo records still need an external source export or explicit mapping file before they can be migrated safely.
- Required next artifact for bulk migration: a reviewed map with `{ mediaId, sourceFile, supabasePath }`, followed by upload, object-size verification, DB backup, and URL update.
- The old S3 bucket backup `D:\py\backups\3dmodules-20260420-225145` has been staged into Supabase Storage under `media/legacy-s3/3dmodules`.
- That archive is complete but not automatically linked to current Payload media or generation task rows. Do not update current `media.url` values from it without an explicit mapping/import step.
- After the archive migration, user-rebuildable resource tables were cleaned so users can upload/generate fresh content. The cleanup preserves users, globals, credits, subscriptions, migrations, and Supabase archive objects.
- Future reset command: `pnpm db:cleanup:user-resources` previews counts; `pnpm db:cleanup:user-resources -- --apply` writes a JSON backup and performs the cleanup.
- Administrator public import completed from the staged archive: `32` public model records were created with preview images and GLB/FBX/OBJ/USDZ format rows when available.
- Public model import grouping rule: preview images and model formats are paired by identical legacy S3 key basename.
- Imported public model titles now expose the legacy resource ID as `Archive <legacyResourceId>`, matching the backend binding rule that preview images and model formats are grouped by one API/result ID.
- Homepage fallback model sections use different slices of public models for featured, shelf, and inspiration content when no curated `homepage-items` exist.
