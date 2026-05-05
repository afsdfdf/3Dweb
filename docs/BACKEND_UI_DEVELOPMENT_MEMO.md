# Backend UI Development Memo

## Purpose

This memo tracks backend-owned UI configuration needed by the migrated formal frontend pages.

It should be used before wiring final frontend pages so UI components do not stay hardcoded when Payload can own the content, media, or user-facing settings.

No schema change has been made for this memo. Any future Payload schema change still requires generated types, database schema generation, formal migration, and validation.

## Reviewed Pages

- `src/app/(frontend)/page.tsx`
- `src/app/(frontend)/workbench`
- `src/app/(frontend)/model-detail`
- `src/app/(frontend)/account`
- `src/app/(frontend)/pricing`

Historical `home-test`, `workbench-test`, `model-detail-test`, and `account-test` route directories were promoted or removed. UI-lab asset/component folder names may still contain historical labels, but future product work should target the formal routes above.

## Current Wiring Review

### UI Closeout Check

Current formal-page closeout status:

- `/`, `/workbench`, `/model-detail`, and `/account` are the product routes for the migrated UI.
- No new backend UI work should target removed validation routes.
- Homepage public media URL handling now keeps local `/api/media/file/...` URLs as browser-safe relative URLs instead of sending them through signed URL resolution.
- Runtime Supabase Storage settings are cached briefly in process so one page render does not repeatedly read the same `storage-settings` global for every media asset.
- Homepage public owner lookup selects only the fields required by public author cards.

Remaining stability note:

- `model-detail` uses `/api/platform/models/:modelId/viewer` correctly. Keep the UI loading progress bar, but treat durable model delivery/caching as a backend media-performance concern rather than a layout workaround.

### Homepage `/`

Already wired:

- top navigation current user through `getCurrentNavUser()`
- featured strip and collection shelf through `homepage-items` plus public model fallback
- inspiration grid through public `models` and public owner profile data when allowed

Remaining backend gaps:

- editable featured strip ribbon/badge text is not modeled as a dedicated field
- public inspiration grid should avoid static fake author fallback before formal launch
- homepage prompt/workbench input area remains UI-only and should later connect to the real studio task flow

### Workbench `/workbench`

Already wired:

- top navigation current user through `getCurrentNavUser()`
- right model library through current user's own `models`
- 3D model viewer through `/api/platform/models/:modelId/viewer`

Remaining backend gaps:

- 3D generation is connected to `/api/studio/ai/tasks`
- image generation is connected to `/api/studio/ai/images`
- uploaded image slots use the Workbench source upload flow
- model library pagination/search is still mostly client-local and should later map to a real query interface

### Model Detail `/model-detail`

Already wired:

- top navigation current user through `getCurrentNavUser()`
- public detail data through public `models`
- creator card through public owner profile when allowed
- model preview through `/api/platform/models/:modelId/viewer`

Remaining backend gaps:

- `ModelDetailAdBanner` should be wired to the creator/user profile banner, not an ad or promotion slot
- comments, reactions, favorites, follows, and engagement endpoints/collections are active; UI work must preserve endpoint auth/rate-limit rules
- cart/download/print actions need commerce and credit-flow confirmation before formal launch

### Account `/account`

Already wired:

- `/account` requires a signed-in user through `requireUser()`
- top navigation current user through `getCurrentNavUser()`
- avatar, display name, email, credit balance, transactions, tasks, models, and orders through server-side current-user Local API helpers
- profile and password forms submit to the registered `/api/account/profile` and `/api/account/password` endpoints
- profile banner edit uses the profile endpoint plus `/api/account/profile-media/upload-url` for Supabase signed uploads and media ownership
- avatar frame selection can use the backend-managed `avatar-frame-styles` catalog

Remaining backend gaps:

- future profile public page work should decide how public avatar/banner media approval is governed when `profileVisibility = public`

## Existing Backend Support

### Current User Navigation

The formal pages can receive the current user through `getCurrentNavUser()`:

- `/`
- `/workbench`
- `/model-detail`
- `/account`

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

- these profile/dashboard/password endpoints are registered in `src/payload.config.ts`
- registered account auth endpoints remain in `src/endpoints/accountAuth.ts`
- frontend wiring may use the registered `/api/account/profile`, `/api/account/dashboard`, and `/api/account/password` paths, while preserving auth/origin/rate-limit contracts

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

The account page uses server-side current-user data for avatar, account name, email, balance, and points history. Client-side profile editing should use the registered `/api/account/profile`, `/api/account/password`, and profile media upload flow.

### Public Model Owner Cards

Homepage and model detail already have partial public creator wiring:

- public model cards use model owner display name when available
- creator avatar is only exposed when the owner profile is public and avatar media is guest-readable
- model detail side author card uses `detail.authorName` and `detail.authorAvatarSrc`

Primary sources:

- `src/app/(frontend)/_home/homeData.ts`
- `src/app/(frontend)/model-detail/_lib/modelDetailData.ts`

Keep this boundary:

- public pages may show creator identity only for public profiles
- public pages may show avatar media only when media access rules allow it

## UI Slots Needing Backend Ownership

### Active Interfaces And Remaining Backend-Owned Slots

Current active interfaces for the migrated formal UI:

- `/api/account/profile`, `/api/account/dashboard`, and `/api/account/password` are registered in `src/payload.config.ts`.
- Public model comments, reactions, favorites, follows, and engagement endpoints are registered and backed by active social collections.
- Sensitive account endpoints, social mutations, and engagement view writes use endpoint-level rate limiting in addition to origin/auth checks.
- Model downloads use the formal `GET /api/platform/models/:modelId/download` namespace.

Remaining backend-owned slots:

- model detail sidebar banner is owned by the creator/user profile banner fields on `users`; the formal model detail page now consumes the guest-readable creator banner.
- avatar frame style metadata is backend-managed through `avatar-frame-styles`; the account page can read and display the active catalog.
- homepage featured strip and collection shelf are backed by `homepage-items`, including editable badge, ribbon, CTA, and image alt fields; the homepage data adapter now consumes managed ribbon/alt metadata for curated cards.

Frontend rule:

- use server-side Local API adapters for formal-page validation where safe and already available
- do not client-fetch unregistered endpoint paths
- record missing backend surface here and defer backend schema/API work until UI integration is stable

### User Avatar Frame Styles

Current state:

- `users.avatarFrame` exists as an enum with `none`, `ember`, `kick`, and `emerald`.
- `accountService` accepts and returns `avatarFrame`.
- the `/api/account/profile` endpoint accepts and returns `avatarFrame`.
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

### Creator Profile Banner

Current UI component:

- `ModelDetailAdBanner`
- DOM target: model detail sidebar banner image
- current asset: `/ui-lab/model-detail-uicut/images/detail-side-banner.png`

Current backend state:

- the visual is the model owner's creator/user profile banner
- compatibility storage remains `users.profileBackground`
- account and creator DTOs expose `profileBanner`, `profileBannerUrl`, `profileBannerFocalX`, and `profileBannerFocalY`

Needed backend product shape:

- users can upload and select their own profile banner
- frontend can crop banners with focal point percentages
- public pages expose banner media only when the media is guest-readable

Implemented backend model:

- Keep `users.profileBackground` as the database field name for compatibility.
- Treat it as `profileBanner` in service responses and future frontend contracts.
- Use `POST /api/account/profile-media/upload-url` for Supabase signed avatar/profile-banner uploads.
- Use Supabase Storage only.

Future optional promotion model:

- A separate promotion system can be added later for operator ads.
- Do not use promotion slots for creator identity/profile surfaces.

Media rule:

- public profile banners must be guest-readable before public DTOs expose their URL.

### Home Featured Strip

Current UI area:

- homepage bottom hero strip
- visual frame: `heroBottomBanner`
- component: `HeroImageFrameStrip`

Current backend state:

- mostly supported through `homepage-items` with `placement = featured-rail`
- supports title, cover image, linked model/post/bundle/announcement, custom link, visibility, pinning, sort order, and card variant
- frontend currently hardcodes some ribbon labels such as `New Product` and `Featured`

Needed backend refinement:

- use `badgeLabel` and `ribbonLabel` for displayed badge/ribbon copy
- use `ctaLabel` and `altText` for action copy and image accessibility mapping
- keep featured strip items operator-managed through Payload

Recommended path:

- Keep using `homepage-items` for this area.
- `homepage-items` now includes `badgeLabel`, `ribbonLabel`, `ctaLabel`, and `altText`.

### Home Collection Shelf

Current UI area:

- homepage second banner / collection shelf
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

1. Wire account profile editing to `/api/account/profile` and profile media uploads to `/api/account/profile-media/upload-url`.
2. Keep model detail author card wired to public owner data, but remove static fallback identity before formal launch.
3. Continue refining account profile editing and avatar-frame selection actions on top of the now-readable backend catalog.
4. Keep homepage featured strip and collection shelf on `homepage-items`; use the badge/ribbon/CTA/alt fields for editable copy.
5. Keep `/pricing` on `site-settings.subscriptionPlans` and the registered `/api/billing/subscriptions/*` endpoints; only add new backend page-content settings after the final pricing UI is confirmed.
6. Replace residual static fallback author cards on public grids with empty/skeleton states when there is no real public data.

## Boundaries Not To Cross

- Do not expose private creator profile data on public pages.
- Do not mark all avatar or promo media as public by default.
- Do not use `overrideAccess: true` in frontend public data adapters to bypass media/model privacy.
- Do not add custom Next routes under Payload REST collection paths such as `/api/media`, `/api/users`, or `/api/models`.
- Do not change Payload schemas without type generation, schema generation, migration planning, and validation.

## Backend Work Items For Later

- Wire frontend account settings to the registered account/profile/password endpoints.
- Wire frontend avatar frame selection to the `avatar-frame-styles` collection.
- Wire model detail sidebar image to the creator/user profile banner.
- Wire homepage cards to the `homepage-items` badge/ribbon/CTA/alt fields.
- Decide whether `/pricing` needs a dedicated backend-managed content global or whether `site-settings` is enough.
- Add active/sort/featured/badge controls for subscription plans if marketing needs runtime plan changes.
- Keep account dashboard/profile data on the registered account endpoints and server-side adapters; do not revive the old account-test route as a production dependency.
- Review public media rules for all promotional images before exposing them on anonymous pages.

## 2026-05-01 Audit Addendum

- `docs/PROJECT_AUDIT_MEMO.md` is the current full-stack audit source for route/backend/deployment risk.
- Current database probe shows the imported public model set is internally consistent: 42 public models, 42 guest-readable previews, and 42 GLB format rows backed by Supabase public object URLs.
- `/personal-center-legacy` was removed from the app route tree in the 2026-05-01 remediation pass. `/account` now owns the formal personal center UI, and the old `/personal-center-test` route was removed after promotion to avoid parallel account surfaces.
- The download endpoint now uses `site-settings.modelAccessPolicy` for download charging and returns a controlled error when no real asset exists. Preview/download policy UI can build on that server-side behavior.

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

Workbench image asset rule:

- Generated images are private Workbench source assets, not model records.
- The right Image Assets panel should be backed by succeeded Gemini image-generation tasks and their `callbackPayload.imageGeneration.resultMediaId` media records, so refresh/navigation does not lose the user's generated image set.
- Image generation accepts at most one source image. Multi-image source arrays belong to Meshy 3D generation, where selected images become reference images for Image/Multi-Image to 3D.

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
