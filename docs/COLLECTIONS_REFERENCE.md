# Collections Reference

## Purpose

This is the current development reference for active Payload collections in `thornstavern`.

Use it to answer:

- which collections are registered in `src/payload.config.ts`
- what each collection owns
- which access rules and hooks matter
- which frontend or service layer should use each collection
- which generated-schema or historical table families are not active collections

Primary code sources:

- `src/payload.config.ts`
- `src/collections/`
- `src/access/index.ts`
- `src/hooks/`
- `src/lib/`
- `src/endpoints/`

## Active Collections

The currently registered collections are:

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

Do not treat names found only in generated schema, old migrations, dormant service files, or archived docs as active collections unless they are registered in `src/payload.config.ts`.

## Access Helpers

Shared access helpers live in `src/access/index.ts`.

- `isLoggedIn`: any authenticated user.
- `isStaff`: `admin` or `operator`.
- `isAdmin`: `admin` only.
- `canAccessAdmin`: allows `admin` and `operator` into Payload Admin.
- `isSelfOrStaff`: current user document or staff.
- `ownerOrStaff(ownerField)`: document owner or staff.
- `publicOwnerOrStaff(ownerField)`: staff can read all; authenticated users can read public records and their own records; guests can read public records.

Local API rule:

- When passing `user`, always set `overrideAccess: false`.
- Administrative bypasses should stay in service-owned internal flows and be intentional.

## User And Platform

### `users`

File: `src/collections/Users.ts`

Owns Payload authentication, account identity, profile fields, role, customer IDs, credit mirror, and social counters.

Access:

- Admin panel access: `canAccessAdmin`.
- Read/update: `isSelfOrStaff`.
- Delete: `isAdmin`.
- Staff-only fields are protected with field-level access.

Important fields:

- `email`
- `fullName`
- `displayName`
- `bio`
- `role`: `admin`, `operator`, `customer`
- `avatar`
- `profileBackground`
- `avatarFrame`
- `profileVisibility`
- `shopifyCustomerId`
- `stripeCustomerId`
- `creditsBalance`
- `profileViewCount`
- `followersCount`
- `followingCount`
- `lastActiveAt`

Hooks:

- `afterOperation`: normalizes duplicate email behavior on REST create.
- `afterChange`: `createDefaultCreditAccount`, `sendWelcomeEmail`.

Frontend and service notes:

- Anonymous direct REST user creation is blocked by collection access.
- Account/auth endpoint modules are registered in `src/payload.config.ts`; sensitive auth mutations use origin checks and endpoint-level rate limits.
- Current-user server reads should go through `src/app/(frontend)/_lib/session.ts`.
- Do not let customer profile updates write staff-only fields.

### `media`

File: `src/collections/Media.ts`

Owns uploads for input images, preview images, model files, documents, and general assets. It is the main privacy boundary for public previews versus private/generated assets.

Access:

- Create: authenticated users.
- Read: `mediaReadAccess`.
- Update/delete: `ownerOrStaff('owner')`.

Guest-readable media requires one of:

- `purpose = preview`
- `publicAccess = true`

Signed-in non-staff users can read:

- their own media
- preview media
- explicitly public media

Important fields:

- `alt`
- `owner`
- `purpose`: `input`, `preview`, `model`, `document`, `asset`
- `publicAccess`

Hooks:

- `afterRead`: normalizes empty URL strings to `null`.
- Runtime object storage is Supabase Storage only; media no longer runs AWS S3 sync hooks.

Frontend and service notes:

- Public model previews must point to guest-readable media.
- Generated image results should default to `purpose = asset` and `publicAccess = false`.
- Upload helper route is `src/app/api/media/upload-url/route.ts`.
- Do not add `src/app/api/media/route.ts`; it would shadow Payload REST `/api/media`.

## AI Production

### `generation-tasks`

File: `src/collections/GenerationTasks.ts`

Owns AI task queue state, provider state, billing snapshot, source prompt/image, result model link, and callback payload.

Access:

- Create/read/update: `ownerOrStaff('user')`.

Important fields:

- `taskCode`
- `user`
- `inputMode`: `image`, `text`, `hybrid`
- `prompt`
- `sourceImage`
- `provider`
- `providerTaskId`
- `status`: `queued`, `processing`, `succeeded`, `failed`, `timeout`
- `progress`
- `parameterSnapshot`
- `creditsReserved`
- `creditsSpent`
- `resultModel`
- `printRequested`
- `startedAt`
- `completedAt`
- `failureReason`
- `callbackPayload`

Frontend and service notes:

- Registered endpoints:
  - `POST /api/studio/ai/tasks`
  - `POST /api/studio/ai/tasks/:taskId/sync`
- User-scoped reads must pass `user` and `overrideAccess: false`.
- Do not expose raw provider callback payloads to the browser.

### `task-events`

File: `src/collections/TaskEvents.ts`

Owns the AI task timeline and operational event log.

Access:

- Create: authenticated users.
- Read/update/delete: `ownerOrStaff('user')`.

Important fields:

- `task`
- `user`
- `eventType`: `queued`, `submitted`, `polling`, `callback`, `completed`, `failed`
- `provider`
- `message`
- `payload`

Frontend and service notes:

- Usually written by `src/lib/aiTaskFlow.ts` and `src/lib/imageGenerationFlow.ts`.
- Nested writes from hooks or service flows should pass `req` when participating in the same Payload request.

### `models`

File: `src/collections/Models.ts`

Owns generated 3D model records, ownership, public/private visibility, preview image, model formats, print readiness, counters, tags, and description.

Access:

- Create/update: `ownerOrStaff('owner')`.
- Read: `publicOwnerOrStaff('owner')`.
- Restricted fields: `formats.file` and `viewerUrl` are owner/staff readable.

Important fields:

- `title`
- `owner`
- `sourceTask`
- `status`: `draft`, `ready`, `archived`
- `visibility`: `private`, `team`, `public`
- `previewImage`
- `formats`
- `viewerUrl`
- `printReady`
- `viewCount`
- `commentsCount`
- `likesCount`
- `favoritesCount`
- `dimensions`
- `tags`
- `description`

Hooks:

- `beforeChange`: `validatePublicModelPreview`.

Frontend and service notes:

- `visibility = public` is not enough; the `previewImage` must also be guest-readable.
- Public pages must not expose raw `formats.file` or raw `viewerUrl`.
- `src/endpoints/modelViewer.ts` is registered as `GET /api/platform/models/:modelId/viewer`.
- Registered download endpoint: `GET /api/platform/models/:modelId/download`.

## Marketing And Content

### `homepage-items`

File: `src/collections/HomepageItems.ts`

Owns curated homepage cards and repeated operational placements. It works with `homepage-content`: the global owns section copy, this collection owns repeated items.

Access:

- Create/update/delete: `isStaff`.
- Read: staff can read all; public users can read `isVisible = true` and `_status = published`.

Important fields:

- `title`
- `slug`
- `placement`: `hero-secondary`, `featured-rail`, `featured`, `collection-shelf`, `bundles`, `announcements`, `articles`
- `contentType`: `custom`, `model`, `post`, `announcement`, `bundle`
- `summary`
- `railVariant`
- `itemCountLabel`
- `coverImage`
- `linkedModel`
- `linkedPost`
- `linkedAnnouncement`
- `linkedBundle`
- `customHref`
- `createdBy`
- `publishAt`
- `isPinned`
- `isVisible`
- `sortOrder`

Hooks:

- `assignCurrentUser('createdBy')`.
- `validateHomepageItem`.

Frontend and service notes:

- `validateHomepageItem` enforces content-type to linked-field consistency.
- Custom `featured-rail` and `collection-shelf` items require `coverImage`.
- Public homepage reads should use access-controlled queries.
- Linked model previews still need guest-readable media.

### `posts`

File: `src/collections/Posts.ts`

Owns articles, event-style pages, and long-form content.

Access:

- Create/update/delete: `isStaff`.
- Read: staff can read all; non-staff can read `_status = published`.

Important fields:

- `title`
- `slug`
- `category`: `article`, `event`, `announcement`
- `coverImage`
- `excerpt`
- `content`
- `videoUrl`
- `createdBy`
- `publishedAt`
- `isPinned`
- `isVisible`
- `sortOrder`

Hooks:

- `assignCurrentUser('createdBy')`.
- `fillPublishAtOnPublish('publishedAt')`.

Frontend and service notes:

- Current read access does not include `isVisible`; add a frontend `where` clause if hidden published posts should be excluded.

### `announcements`

File: `src/collections/Announcements.ts`

Owns short announcements, operational notices, and homepage/content promotion material.

Access:

- Create/update/delete: `isStaff`.
- Read: staff can read all; public users can read `isVisible = true` and `_status = published`.

Important fields:

- `title`
- `slug`
- `summary`
- `content`
- `createdBy`
- `publishAt`
- `isPinned`
- `isVisible`
- `sortOrder`

Hooks:

- `assignCurrentUser('createdBy')`.
- `fillPublishAtOnPublish('publishAt')`.

### `model-bundles`

File: `src/collections/ModelBundles.ts`

Owns curated groups of `models` for collection shelves, topic packs, and promotional model groupings.

Access:

- Create/update/delete: `isStaff`.
- Read: staff can read all; public users can read `isVisible = true` and `_status = published`.

Important fields:

- `title`
- `slug`
- `coverImage`
- `summary`
- `tags`
- `models`
- `createdBy`
- `publishAt`
- `isVisible`
- `isFeatured`
- `sortOrder`

Hooks:

- `assignCurrentUser('createdBy')`.
- `fillPublishAtOnPublish('publishAt')`.

Frontend and service notes:

- Related `models` still obey `models` read access.
- Public bundle cover media must be guest-readable.

## Commerce

### `credits`

File: `src/collections/Credits.ts`

Owns user credit accounts.

Access:

- Create/update/delete: `isAdmin`.
- Read: `ownerOrStaff('user')`.

Important fields:

- `accountLabel`
- `user`
- `balance`
- `reservedBalance`
- `lifetimePurchased`
- `lifetimeSpent`
- `status`: `active`, `suspended`, `closed`
- `billingNotes`

Frontend and service notes:

- Balance changes should go through `src/lib/creditLedger.ts`.
- `users.creditsBalance` is a mirror, not the source ledger.

### `credit-transactions`

File: `src/collections/CreditTransactions.ts`

Owns immutable-ish credit ledger entries.

Access:

- Create/update: `isAdmin`.
- Read: `ownerOrStaff('user')`.

Important fields:

- `referenceCode`
- `idempotencyKey`
- `user`
- `creditAccount`
- `type`: `purchase`, `task_hold`, `task_spend`, `download_spend`, `refund`, `manual_adjustment`, `subscription_grant`
- `amount`
- `currency`
- `balanceAfter`
- `sourceTask`
- `sourceOrder`
- `notes`
- `metadata`

Frontend and service notes:

- Reserve, spend, refund, and grant logic should stay in `creditLedger` for idempotency and consistency.

### `credit-products`

File: `src/collections/CreditProducts.ts`

Owns purchasable credit top-ups and print packages.

Access:

- Create/update/delete: `isStaff`.
- Read: public.

Important fields:

- `title`
- `slug`
- `productType`: `credit-topup`, `print-package`
- `description`
- `credits`
- `price`
- `currency`
- `shopifyProductId`
- `shopifyVariantId`
- `isFeatured`
- `isActive`
- `sortOrder`

Frontend and service notes:

- Shopify fields are legacy compatibility. Current billing/order flows primarily use Stripe-related services.

### `billing-subscriptions`

File: `src/collections/BillingSubscriptions.ts`

Owns Stripe subscription state and recurring credit grant metadata.

Access:

- Create/update/delete: `isAdmin`.
- Read: `ownerOrStaff('user')`.

Important fields:

- `user`
- `planKey`
- `stripeCustomerId`
- `stripeSubscriptionId`
- `stripePriceId`
- `status`
- `interval`
- `monthlyCredits`
- `currentPeriodStart`
- `currentPeriodEnd`
- `cancelAtPeriodEnd`
- `lastGrantedPeriodKey`
- `lastCheckoutSessionId`
- `metadata`

Frontend and service notes:

- Registered endpoints:
  - `POST /api/billing/subscriptions/checkout`
  - `POST /api/billing/subscriptions/sync`
  - `POST /api/billing/subscriptions/portal`
- Subscription sync and credit grants live in `src/lib/subscriptionFlow.ts`.

### `addresses`

File: `src/collections/Addresses.ts`

Owns user shipping addresses.

Access:

- Create: authenticated users.
- Read/update/delete: `ownerOrStaff('user')`.

Important fields:

- `user`
- `label`
- `recipientName`
- `phone`
- `country`
- `province`
- `city`
- `district`
- `postalCode`
- `addressLine1`
- `addressLine2`
- `isDefault`

Hooks:

- `assignCurrentUser('user')`.

Frontend and service notes:

- The create flow should not trust a client-supplied `user`; ownership is assigned server-side.

### `print-orders`

File: `src/collections/PrintOrders.ts`

Owns physical print order records and payment/shipping status.

Access:

- Create/read: `ownerOrStaff('user')`.
- Update: `isStaff`.

Important fields:

- `orderNumber`
- `user`
- `model`
- `sourceTask`
- `status`: `pending-payment`, `paid`, `in-production`, `shipped`, `completed`, `cancelled`
- `paymentStatus`: `pending`, `paid`, `failed`, `refunded`
- `shopifyOrderId`
- `amount`
- `currency`
- `creditsUsed`
- `sizeOption`
- `materialOption`
- `shippingName`
- `shippingPhone`
- `shippingAddress`
- `trackingNumber`
- `shopifyCheckoutUrl`
- `internalNotes`

Frontend and service notes:

- Registered endpoints:
  - `POST /api/commerce/print-orders`
  - `POST /api/commerce/print-orders/:orderId/sync`
- Order creation and payment flow live in `src/lib/printOrderFlow.ts`.
- Customers should not directly update order status.

### `shopify-payments`

File: `src/collections/ShopifyPayments.ts`

Owns payment records. The collection name is legacy Shopify compatibility, but the current flow can store Stripe checkout/session references.

Access:

- Create/update: `isAdmin`.
- Read: `ownerOrStaff('user')`.

Important fields:

- `checkoutReference`
- `user`
- `paymentType`: `credit-topup`, `print-order`
- `status`: `pending`, `paid`, `failed`, `refunded`
- `shopifyOrderId`
- `shopifyCheckoutId`
- `creditsGranted`
- `linkedOrder`
- `amount`
- `currency`
- `rawWebhookPayload`

Frontend and service notes:

- The name does not mean Shopify is the only active payment provider.
- Registered Stripe webhook endpoint: `POST /api/platform/billing/webhooks/stripe`.

## Globals Related To Collections

Registered globals:

- `site-settings`: site branding, contact, integrations, and email settings.
- `homepage-content`: homepage singleton copy and section settings.
- `ai-provider-settings`: provider credentials/configuration.
- `storage-settings`: storage adapter and S3-related configuration.
- `security-settings`: security and rate-limit controls.
- `runtime-deployment-settings`: runtime environment visibility and deployment settings.

`src/globals/EmailSettings.ts` exists but is not registered. Email settings currently live under `site-settings.emailSettings`.

## Registered Payload Endpoints

Currently registered in `src/payload.config.ts`:

- `GET /api/platform/ops/dashboard`
- `POST /api/studio/ai/tasks`
- `POST /api/studio/ai/tasks/:taskId/sync`
- `POST /api/platform/ai/webhooks/provider`
- `GET /api/platform/models/:modelId/download`
- `POST /api/commerce/print-orders`
- `POST /api/commerce/print-orders/:orderId/sync`
- `POST /api/billing/subscriptions/checkout`
- `POST /api/billing/subscriptions/sync`
- `POST /api/billing/subscriptions/portal`
- `POST /api/platform/session/logout`
- `POST /api/platform/billing/webhooks/stripe`

Additional registered endpoint modules:

- `src/endpoints/account.ts`
- `src/endpoints/adminRepair.ts`
- `src/endpoints/engagement.ts`
- `src/endpoints/imageGeneration.ts`
- `src/endpoints/modelComments.ts`
- `src/endpoints/modelDetails.ts`
- `src/endpoints/modelReactions.ts`
- `src/endpoints/modelViewer.ts`

Frontend integration may use these endpoint modules through their registered `/api/...` paths, but new calls must preserve the endpoint security contracts.

## Dormant Or Drifted Table Families

The following table families appear in generated schema, migrations, services, or endpoint modules, but there are no active collection configs registered in `src/payload.config.ts`:

- `user-follows` / `user_follows`
- `model-comments` / `model_comments`
- `model-likes` / `model_likes`
- `model-favorites` / `model_favorites`
- `engagement-views` / `engagement_views`

Related files:

- `src/lib/followService.ts`
- `src/lib/commentService.ts`
- `src/lib/reactionService.ts`
- `src/lib/engagementService.ts`
- `src/endpoints/modelComments.ts`
- `src/endpoints/modelReactions.ts`
- `src/endpoints/modelDetails.ts`
- `src/endpoints/engagement.ts`

Rules:

- Do not integrate a new frontend against these as active REST collections.
- Do not depend on `/api/social/...` until collection configs and endpoint registration are restored or intentionally removed.
- If social is enabled later, align collection configs, generated types, migrations, services, and endpoint registration in the same rollout.

## Frontend Mapping

### Public Homepage

Primary data sources:

- `homepage-content`
- `homepage-items`
- public `models`
- guest-readable `media`
- `model-bundles`
- `posts`
- `announcements`

Rules:

- Section copy belongs in `homepage-content`.
- Repeated curated items belong in `homepage-items`.
- Public images must be `purpose = preview` or `publicAccess = true`.

### Showcase

Primary data sources:

- `models`
- `media`
- optionally `model-bundles`

Rules:

- Public listing should use `visibility = public` and access-controlled reads.
- Do not expose `formats.file` or `viewerUrl` directly.
- Confirm viewer endpoint registration before relying on `/api/platform/models/:modelId/viewer`.

### Workbench And Results

Primary data sources:

- `generation-tasks`
- `task-events`
- `models`
- `media`

Rules:

- User-scoped reads must pass `user` and `overrideAccess: false`.
- Task submission uses `/api/studio/ai/tasks`.
- Task sync uses `/api/studio/ai/tasks/:taskId/sync`.

### Dashboard

Primary data sources:

- `users`
- `generation-tasks`
- `models`
- `credits`
- `credit-transactions`
- `billing-subscriptions`
- `print-orders`
- `shopify-payments`

Rules:

- Dashboard reads must be user-scoped.
- Do not use admin overrides for ordinary customer dashboard data.

## Change Checklist

When changing collection schema:

1. Update `src/collections/<Collection>.ts`.
2. Check access boundaries in `src/access/index.ts`.
3. Check hook transaction safety and pass `req` for nested Payload operations.
4. Add context flags for recursive hook risks.
5. Run `pnpm payload generate:db-schema`.
6. Add a formal migration.
7. Run `pnpm generate:types`.
8. Run `pnpm generate:importmap` if admin component paths changed.
9. Run `pnpm exec tsc --noEmit`.
10. Update `docs/AI_PROJECT_MEMORY.md` and this file when the change is durable.
