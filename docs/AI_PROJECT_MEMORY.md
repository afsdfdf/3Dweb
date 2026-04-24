# AI Project Memory

## Purpose

This file is the persistent project memory for AI-assisted development in `payload-local-demo`.

Update this file after important long-lived backend, content, admin, or routing changes so future work starts from the current architecture instead of rediscovering old decisions.

## Update Rule

Update this file when work changes:

- collection or global schema
- access control or media visibility rules
- hook behavior or transaction patterns
- route ownership or API namespaces
- homepage content ownership
- admin component structure or branding
- important bug fixes that reveal a recurring pitfall
- backend optimization rules that future refactors should preserve

## Current Architecture Summary

### Product Surfaces

- Marketing web: public product website
- Studio app: generation, results, and authenticated workflows
- Dashboard: user-facing operational views
- Payload Admin: content operations and business operations
- Platform API: public, studio, commerce, and platform endpoints

### Active Runtime Database

- Current runtime database is Supabase Postgres.
- Do not assume local SQLite is the source of truth for live schema behavior.
- Every Payload schema change must be checked against the active Supabase/Postgres schema, including enum drift, missing columns, and existing live data compatibility.

### Backend Entry Points

- Main config: `src/payload.config.ts`
- Payload REST and admin app: `src/app/(payload)/`
- Project API helpers and route support: `src/app/api/`
- Custom Payload endpoints: `src/endpoints/`
- Business services: `src/lib/`
- Collection configs: `src/collections/`
- Global configs: `src/globals/`
- Hook implementations: `src/hooks/`

### Core Payload Domains

- Users and media
- Generation tasks and task events
- Models and model bundles
- Homepage content and homepage items
- Credits, subscriptions, print orders, and payments
- Platform settings globals

## Backend Map

### Collections

- `users`
  - auth collection
  - roles, avatar, customer IDs, credits balance mirror
  - account profile fields: display name, bio, profile background, avatar frame, profile visibility, and social counters
  - anonymous user creation is routed through `accountAuth.ts`; direct anonymous REST collection create should remain blocked
- `media`
  - uploads for input, preview, model, document, asset
  - guest-readable media is restricted to `purpose = preview`
  - do not rely on `publicAccess` for anonymous delivery of model files or private assets
- `generation-tasks`
  - generation queue, provider state, billing snapshot, task result relationship
- `task-events`
  - task timeline and operational event log
- `models`
  - generated model assets, visibility, print readiness, formats, preview image
  - public model docs should not expose raw asset file relations or direct viewer URLs to anonymous readers
- `user-follows`
  - creator follow relationships
- `model-comments`
  - lightweight public comments for public model pages
- `engagement-views`
  - deduplicated public page view records
- `model-likes`
  - per-user likes for public models
- `model-favorites`
  - per-user saved models for later access
- `homepage-items`
  - curated homepage cards and rail items
- `posts`
  - articles and event-style content
- `announcements`
  - short-form announcement content
- `model-bundles`
  - grouped public content / collection-style surfaces
- `credits`
  - user credit account
- `credit-transactions`
  - ledger entries
- `credit-products`
  - credit top-up products
- `billing-subscriptions`
  - Stripe subscription state
- `addresses`
  - shipping addresses
- `print-orders`
  - physical print order records
- `shopify-payments`
  - payment records with legacy naming kept for compatibility

### Globals

- `site-settings`
  - nav, footer, pricing, generation pricing, announcement
- `homepage-content`
  - singleton homepage section copy and section settings
- `ai-provider-settings`
  - provider defaults, polling, credit rules, Meshy settings
  - Gemini image generation settings for official and third-party keys
- `storage-settings`
  - non-secret storage config
- `security-settings`
  - request origin and remote asset allowlists
- `runtime-deployment-settings`
  - runtime deployment notes and DB connection mode

### Hooks

- `assignCurrentUser`
  - writes creator/owner field on create
- `createDefaultCreditAccount`
  - creates initial credit account for a new user
- `fillPublishAtOnPublish`
  - fills publish date automatically
- `sendWelcomeEmail`
  - business email side effect for new users
- `syncMediaToS3`
  - mirrors media to S3 when enabled
- `validateHomepageItem`
  - validates `homepage-items` content type linkage rules

### Endpoints

- `aiTasks.ts`
  - submit AI task
  - sync AI task
  - provider webhook entrypoints
- `imageGeneration.ts`
  - official Gemini image generation endpoint
  - in-memory provider response upload directly to object storage
- `printOrders.ts`
  - create print order
  - sync print order
- `subscriptions.ts`
  - subscription checkout
  - subscription sync
  - billing portal
- `stripeWebhook.ts`
  - Stripe webhook processing
- `mockDownloads.ts`
  - model download and download-charge flow
  - authentication is required for all download requests, including inline rendering
  - `inline=1` only changes response disposition and does not bypass download charging
- `modelViewer.ts`
  - public/authorized 3D preview should go through the dedicated viewer endpoint
  - preview traffic is rate limited separately from authenticated downloads
- `modelViewer.ts`
  - same-origin GLB streaming endpoint for showcase, results, and workbench rendering
  - enforces normal model read access but does not apply download charges
  - avoids client-side CORS/fetch failures against third-party or signed asset URLs
- `opsDashboard.ts`
  - admin operations dashboard data
- `sessionLogout.ts`
  - authenticated session logout
- `account.ts`
  - current account profile read/update
  - account dashboard aggregate read
  - public creator profile read
- `accountAuth.ts`
  - project-owned auth wrapper endpoints for register, login, me, forgot/reset password, verify email, resend verification, and logout
- `modelComments.ts`
  - public model comment list/create/delete
- `engagement.ts`
  - lightweight public view tracking
- `modelReactions.ts`
  - public model reaction state
  - like and favorite toggles
  - current user favorite list
- `modelDetails.ts`
  - model detail aggregate endpoint for public/owner/staff detail views
- `adminRepair.ts`
  - admin-safe repair endpoints for order status, credit adjustment, and task result repair

### Service Layer Responsibilities

- `aiTaskFlow.ts`
  - task creation
  - provider dispatch and sync
  - model creation
  - asset ingestion
  - task billing
- `imageGenerationFlow.ts`
  - text-to-image and image-to-image submission
  - direct upload to storage without local disk writes
  - media record creation for generated images
- `geminiImageGateway.ts`
  - official Gemini image generation integration
- `printOrderFlow.ts`
  - order creation
  - Stripe checkout for print orders
  - payment completion state transitions
- `subscriptionFlow.ts`
  - Stripe subscription sync
  - subscription persistence
  - recurring credit grants
- `creditLedger.ts`
  - reserve, spend, refund, grant logic
- `ledgerStore.ts`
  - lower-level ledger persistence helpers
- `paymentRecords.ts`
  - neutral wrappers for legacy payment fields
- `paymentProviders.ts`
  - site-level provider selection
- `stripeBilling.ts`
  - Stripe subscription integration helpers
- `stripeGateway.ts`
  - Stripe checkout helpers for orders
- `meshyGateway.ts`
  - Meshy provider integration
- `s3Settings.ts`
  - bootstrap S3 config
- `s3SignedURL.ts`
  - signed media access URLs
- `requestSecurity.ts`
  - mutation origin rules, CSP, request security helpers
- `remoteAssetSecurity.ts`
  - allowlist for remote assets
- `payloadAuthFallback.ts`
  - Payload user resolution from headers/JWT
- `adminDashboard.ts`
  - admin dashboard aggregation
- `auditLog.ts`
  - structured audit logging
- `accountService.ts`
  - account profile normalization
  - current account dashboard aggregation
  - public creator profile response shaping
- `followService.ts`
  - follow and unfollow creator workflow
  - synchronize follower/following counters
- `commentService.ts`
  - public model comment workflow
  - synchronize model comment counters
- `engagementService.ts`
  - deduplicated creator/model view counting
  - synchronize public counters on users and models
- `reactionService.ts`
  - like and favorite toggle workflow
  - synchronize model likes and favorites counters
- `authService.ts`
  - project auth wrappers around Payload auth operations and auth cookies
  - registration responses are intentionally uniform to avoid account enumeration
- `modelDetailService.ts`
  - aggregate model detail response shaping for detail pages
- `adminRepairService.ts`
  - controlled admin repair workflows with audit logging

### Current Frontend-to-Payload Content Split

- `homepage-content`
  - owns singleton section copy
- `homepage-items`
  - intended owner of curated homepage repeatable content
- current risk:
  - some homepage rails are still hardcoded in frontend and not fully Payload-managed

## Persistent Project Rules

### 1. Follow official Payload patterns first

Use the official Payload skill and official Payload docs as the primary reference. Project code should move toward official Payload conventions, not away from them.

### 2. Local API calls with user must enforce access

When passing `user` to Local API, always set `overrideAccess: false`.

### 3. Nested hook operations must pass req

When hooks perform nested Payload operations, pass `req` to preserve transaction behavior.

### 4. Do not shadow Payload REST collection routes

Do not create custom Next route handlers on paths owned by Payload REST collections, such as `/api/media`.

Known pitfall:

- A custom `src/app/api/media/route.ts` shadowed Payload REST `/api/media` and caused admin bulk edit to fail with `405 Method Not Allowed`.

### 5. Public media depends on media purpose

Guests can read media when either:

- `purpose = preview` for user-public preview assets
- `publicAccess = true` for explicitly operator-approved public assets

Implication:

- public homepage and showcase imagery must use preview media
- making a model public is not enough if its preview image is still `purpose = input`
- treat all other media as private by default

Current extension:

- administrators can explicitly mark exact media assets as guest-readable with `media.publicAccess = true`
- use this for curated example files or public 3D assets without changing the media purpose semantics for all assets

### 6. Account profile architecture

The account system is now being built as a creator-profile layer on top of the existing auth collection.

Current milestone-A fields on `users`:

- `displayName`
- `bio`
- `profileBackground`
- `avatarFrame`
- `profileVisibility`
- `profileViewCount`
- `followersCount`
- `followingCount`

Current milestone-A endpoints:

- `GET /api/account/profile`
- `PATCH /api/account/profile`
- `GET /api/account/dashboard`
- `GET /api/creators/:userId`

Current milestone-B/D endpoints:

- `GET /api/account/follows`
- `POST /api/creators/:userId/follow`
- `DELETE /api/creators/:userId/follow`
- `GET /api/models/:modelId/comments`
- `POST /api/models/:modelId/comments`
- `DELETE /api/models/:modelId/comments/:commentId`
- `POST /api/engagement/view`
- `GET /api/account/favorites`
- `GET /api/models/:modelId/reactions`
- `POST /api/models/:modelId/like`
- `DELETE /api/models/:modelId/like`
- `POST /api/models/:modelId/favorite`
- `DELETE /api/models/:modelId/favorite`
- `POST /api/account/password`
- `PATCH /api/models/:modelId/comments/:commentId/moderation`
- `POST /api/account/auth/register`
- `POST /api/account/auth/login`
- `POST /api/account/auth/logout`
- `GET /api/account/auth/me`
- `POST /api/account/auth/forgot-password`
- `POST /api/account/auth/reset-password`
- `POST /api/account/auth/verify-email`
- `POST /api/account/auth/resend-verification`
- `GET /api/models/:modelId/detail`
- `POST /api/platform/admin/orders/:orderId/status`
- `POST /api/platform/admin/credits/:userId/adjust`
- `POST /api/platform/admin/tasks/:taskId/repair`

Design rule:

- keep `users` collection access restrictive by default
- expose public creator data through explicit sanitized endpoints rather than opening general collection reads
- keep follow/comment/view write paths in service-owned endpoints so social counters stay consistent
- keep likes and favorites model-bound through dedicated collections instead of embedding user arrays on the model document
- account password changes now use Payload auth login verification for the current password, then update the auth collection through the Local API
- comment moderation is staff-only and updates `models.commentsCount` through the same service synchronization path used by comment create/delete
- auth routes are now project-owned wrappers, even though they internally rely on Payload auth operations
- admin repair routes are allowed for order status, credit adjustment, and task-result repair, but manual make-up orders remain out of scope

### 6. Homepage content ownership is split

Use:

- `homepage-content` global for section-level copy and singleton settings
- `homepage-items` collection for curated repeating cards and operator-managed placements

Do not hardcode new homepage rails when the same content should be Payload-managed.

### 7. Generated artifacts must be regenerated after Payload-facing changes

- schema change -> `pnpm run generate:types`
- admin component path change -> `pnpm run generate:importmap`
- then run `pnpm exec tsc --noEmit`

### 8. Source language safety

Do not introduce Chinese in code comments.

Do not introduce Chinese literals in frontend page/component source.

Do not introduce Chinese literals in backend service code, hooks, endpoint handlers, or library code.

Allowed exception:

- Chinese may appear in admin-facing UI copy, localization files, or Payload-managed content where multilingual operator-facing text is explicitly intended.

Preferred rule:

- comments in source code: English only
- frontend literals in source code: English only
- backend service and endpoint literals: English only
- multilingual copy: localization files, admin-facing UI layers, or Payload content

### 9. Database runtime source of truth

- Production and hosted runtime should use Supabase Postgres only.
- Runtime Postgres connections should resolve from a single config source rooted in `resolveDatabaseRuntimeConfig`.
- Prefer `DATABASE_URL` as the canonical environment variable.
- `SUPABASE_DB_URL` / `SUPABASE_DATABASE_URL` may be accepted as compatibility aliases, but code should not introduce new parallel database config readers.
- Do not add new direct `POSTGRES_URL`-only runtime code paths.

### 10. Social write protection

- Social mutations are account-scoped and must stay idempotent at the service layer.
- Like, favorite, follow, and comment write routes now have dedicated endpoint rate-limit scopes.
- Database-level uniqueness for social relationship tables should be preserved through migrations and not replaced by frontend-only or service-only assumptions.

### 11. Deployment environment templates

- Root deployment templates now belong in `.env.vercel.production.example` and `.env.vercel.preview.example`.
- Treat `DATABASE_URL` as the canonical runtime database variable for Vercel.
- Preview and production should both use Supabase Postgres runtime mode unless there is a deliberate environment split.
- Do not store live secrets in committed env template files; committed templates must contain placeholders only.

## Recent Decisions

- Official Gemini image generation is exposed at `/api/studio/ai/images`.
- Official Gemini returns inline image data, so the project uploads generated images to storage from server memory only and does not write them to local disk.
- Image generation results are stored as `media` records with `purpose = asset` and `publicAccess = false` by default.
- Administrator-controlled public asset visibility now uses `media.publicAccess`.

## Important Paths

- `src/payload.config.ts`
- `src/collections/`
- `src/globals/`
- `src/endpoints/`
- `src/lib/`
- `src/components/admin/`
- `docs/DEVELOPMENT_GUIDE.md`
- `docs/ARCHITECTURE_BLUEPRINT.md`

## Recent Decisions

### 2026-04-20

- Admin branding was switched from the default Payload brand to `Thorns Tavern`.
- Public homepage visibility should rely only on intentionally public models and preview media.
- Homepage and showcase public pages should not use `overrideAccess: true` as a fallback to read models.
- Project-specific Payload guidance is maintained as a Codex overlay skill: `payload-local-demo-backend`.
- This file is now the required persistent memory target for important architecture and backend changes.
- Root `docs/` now keeps evergreen references only; dated plans, reports, and worklogs belong in `docs/archive/`.
- The backend map in this file should be treated as the first-stop index for future debugging and service review.
- Homepage top featured rail and collection shelf are now intended to be Payload-managed through `homepage-items` placements (`featured-rail`, `collection-shelf`) with rail-level copy in `homepage-content`.
- Public models now require a preview image whose linked media purpose is `preview` before they can be made public.
- Chinese source literals and comments are now treated as an encoding risk and should not be introduced into frontend/component source or code comments.
- Current active runtime is Postgres/Supabase, so schema rollouts must consider Postgres enum/value drift as well as column drift.
- Adding new homepage item placements required both new columns and Postgres enum expansion for `homepage_items.placement` and `_homepage_items_v.version_placement`.
- Adding new collections under Payload Postgres may also require checking internal relation tables such as `payload_locked_documents_rels`; missing relation columns there can break document updates even when the main collection tables already exist.
- Model viewers should use the project-owned `/api/platform/models/:modelId/viewer` endpoint instead of sending raw third-party GLB URLs to the browser; download endpoints remain separate because they can require auth and credit charging.
- Browser extensions can inject transient attributes such as `style="caret-color: transparent"` onto workbench form inputs before React hydrates; for workbench search/form controls, targeted `suppressHydrationWarning` is acceptable to avoid noisy false-positive hydration warnings.
- Runtime Postgres access is now being consolidated so Payload and direct SQL helpers read from the same database config resolution path instead of separate connection-string readers.
- Social relationship stability now depends on database-level deduplication and unique indexes for `user_follows`, `model_likes`, and `model_favorites`, not only on service-layer prechecks.
- Social write routes have dedicated rate-limit scopes so reaction/comment/follow endpoints do not share budgets with AI, billing, or preview traffic.

### 2026-04-24

- Runtime database configuration is now Postgres-only. `resolveDatabaseRuntimeConfig` no longer falls back to SQLite or `payload.db`.
- `src/payload.config.ts` now initializes only the Postgres adapter at runtime and the project no longer keeps a direct `@payloadcms/db-sqlite` dependency.
- `.env.example`, package metadata, and active runtime docs now describe Postgres as the only supported database path.
- `ledgerStore` now supports Postgres transaction clients only.
- Payload migrations now import Postgres migration helpers from `src/migrations/postgresUtils.ts` instead of `@payloadcms/db-sqlite`, and the old SQLite baseline reconciliation migration is archived as a Postgres no-op to avoid executing legacy repair SQL on Supabase.
