# AI Project Memory

## Purpose

This is the compact AI-readable memory for `thornstavern`.

Use it first to understand stable project boundaries, active entry points, and recurring pitfalls. For the current human-readable project guide, route list, validation policy, and cleanup policy, use `docs/PROJECT_CURRENT.md`.

## Update Rule

Update this file in the same task when work changes durable architecture:

- collection or global registration
- access rules or media visibility
- hook behavior or transaction patterns
- route ownership or API namespaces
- homepage content ownership
- admin component structure
- database runtime or migration policy
- important bug fixes that future work should preserve

Do not leave durable project decisions only in chat history.

## 2026-05-28 Blog Content Ownership

- `/blog` and `/blog/[slug]` now route nearly all blog-specific visible UI copy through `formal-pages.blogPage`, including category labels, search labels, empty states, pinned-sidebar copy, pagination labels, detail-page video/related labels, rich-text empty body copy, default article excerpt/date/reading-time labels, and the article CTA block.
- The `/blog` top banner image is editable through `formal-pages.blogPage.heroImage`, shown at the top of the `Formal Pages` -> `Blog` admin tab before the "Hero copy and CTAs" group. The selected media must be guest-readable (`publicAccess` enabled or preview purpose) because public rendering resolves it through `getGuestReadableBlogImageURL`.
- Article records remain owned by the `posts` collection. Frontend blog list/detail reads pass `blogPage.categoryLabels` and listing labels into `blogData.ts` so card labels and article metadata stay aligned with the CMS-managed blog page content.
- Public blog post reads intentionally use the default English content locale (`blogPostContentLocale = 'en'`) and keep Payload `fallbackLocale: false`; the frontend locale only localizes page-level labels and date formatting. Do not make article list/detail queries switch to the current UI locale, because `posts` records are operated as shared/default-English articles rather than separate Chinese/English content.
- Public blog post reads should also exclude locale records with blank titles or missing rich-text content, and `posts` slugs are normalized before validation so operator-entered spaces/punctuation do not create fragile public URLs.
- `posts` changes and deletes revalidate `/blog` plus the affected detail slug through `revalidateBlogPostCacheAfterChange` / `revalidateBlogPostCacheAfterDelete`. Keep this hook path so Payload Admin publish, hide, slug, and delete actions do not leave stale public blog pages behind.
- The supporting database rollout is `20260528_160500_formal_pages_blog_auxiliary_content`, which adds the flattened `formal_pages.blog_page_*` columns for these blog UI labels and backfills defaults.
- Blog rendering must use `blogSafety.ts` for CMS-entered CTA hrefs, rich-text links, and blog image URLs. Protocol-relative URLs, `javascript:`, `data:`, and private Supabase object URLs must not be rendered on public blog pages; rich-text upload images should render only when their media record is guest-readable.
- Blog list/detail shells should fetch `getMarketingSiteSettings()` instead of `getMarketingSiteData()` so the journal does not pull homepage content just to render navigation and footer chrome.
- Do not reintroduce new hardcoded blog UI copy in `BlogComponents.tsx` or `BlogArticleBody.tsx`; add new operator-editable page-level labels under `formal-pages.blogPage` unless the copy is purely structural or inaccessible implementation text.

## 2026-05-27 GLB Preview Optimization

- Generated/imported GLB preview compression is asynchronous. The main Payload app owns queue state, auth, media records, Supabase signed upload targets, dispatch capacity, callback validation, and viewer selection; the separate Vercel worker only downloads a signed source URL, runs `gltf-transform`, uploads through a signed Supabase upload token, and calls back.
- The optimization queue lives in `model-optimization-jobs`, and `models.viewerOptimization` stores fast lookup/status fields. Run `generate:types`, `payload generate:db-schema`, and the migration when changing those schemas.
- Shared secrets for model optimization travel only in `x-model-optimization-secret` headers. Do not put the secret in worker request or callback JSON bodies.
- Generation success should enqueue preview optimization and immediately schedule one non-blocking dispatch attempt with `next/server` `after()` plus an in-process fallback. The Vercel Cron route `/api/platform/model-optimization/cron-dispatch` runs every minute as recovery for missed, failed, or capacity-limited dispatches and must require `Authorization: Bearer ${CRON_SECRET}`.
- Historical model preview backfill is owned by `POST /api/platform/model-optimization/backfill`. It must require `Authorization: Bearer ${CRON_SECRET}`, default to dry-run unless `dryRun: false` is posted, cap each request to 100 candidates, skip already succeeded/queued source+mode jobs, and enqueue through the same `model-optimization-jobs` queue instead of compressing files inside the app server.
- Model optimization dispatch may retry `failed` jobs and `running` jobs whose lease has expired while `attempts < 3`. `dispatchModelOptimizationJob` also rechecks claimability before creating signed upload targets, clears stale failure fields when a retry starts, and uses attempt-suffixed output paths after the first attempt so Supabase signed upload creation does not collide with a previous partial object. Completion must create the media record with the returned output path basename as `filename`; using a fixed filename can trip Payload's global media filename uniqueness on retries.
- The browser viewer URL remains `/api/platform/models/:modelId/viewer?format=glb`. It prefers `viewerOptimization.previewFile` only when status is `succeeded`, supports `quality=original`, and falls back to the original GLB when optimized preview delivery is missing or blocked.
- `/api/platform/models/:modelId/download` remains the original-quality download path. Do not switch downloads to optimized preview files unless a separate product decision adds a preview-download concept.
- Production compression capacity should start from the Vercel pressure-test result: worker memory `4096 MB`, timeout `300s`, app `MODEL_OPTIMIZATION_MAX_ACTIVE=24`, and dispatch batch `6`. Higher levels may work in tests, but website generation concurrency and Postgres capacity still need headroom.

## Current Architecture

Product surfaces:

- Marketing web
- Studio / Workbench
- Account Center
- Payload Admin
- Platform API

Main entry points:

- Payload config: `src/payload.config.ts`
- Payload admin and REST routes: `src/app/(payload)/`
- Project-owned Next routes: `src/app/api/`
- Frontend app: `src/app/(frontend)/`
- Collections: `src/collections/`
- Globals: `src/globals/`
- Endpoints: `src/endpoints/`
- Business services: `src/lib/`
- Hooks: `src/hooks/`
- Admin components: `src/components/admin/`

Runtime database:

- PostgreSQL only.
- `resolveDatabaseRuntimeConfig` is the source of truth.
- Prefer `DATABASE_URL`.
- Do not reintroduce SQLite, libsql, or `payload.db` runtime fallback paths.

## Active Payload Surface

Registered collections:

- `users`
- `user-follows`
- `user-notifications`
- `media`
- `avatar-frame-styles`
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

Registered globals:

- `site-settings`
- `homepage-content`
- `formal-pages`
- `ai-provider-settings`
- `storage-settings`
- `security-settings`
- `runtime-deployment-settings`

`src/globals/EmailSettings.ts` exists but is not registered. Email settings currently live under `site-settings.emailSettings`.

Registered Payload endpoints:

- `GET /api/platform/ops/dashboard`
- `POST /api/studio/ai/tasks`
- `POST /api/studio/ai/tasks/:taskId/sync`
- `POST /api/platform/ai/webhooks/provider`
- `GET /api/platform/models/:modelId/viewer`
- `GET /api/platform/models/:modelId/download`
- `POST /api/commerce/print-orders`
- `POST /api/commerce/print-orders/:orderId/sync`
- `POST /api/billing/subscriptions/checkout`
- `POST /api/billing/subscriptions/sync`
- `POST /api/billing/subscriptions/portal`
- `POST /api/platform/session/logout`
- `POST /api/platform/billing/webhooks/stripe`
- `POST /api/account/auth/register`
- `POST /api/account/auth/login`
- `POST /api/account/auth/logout`
- `GET /api/account/auth/me`
- `POST /api/account/auth/forgot-password`
- `POST /api/account/auth/reset-password`
- `POST /api/account/auth/verify-email`
- `POST /api/account/auth/resend-verification`
- `GET /api/account/notifications`
- `GET /api/account/notifications/unread-count`
- `PATCH /api/account/notifications/:notificationId/read`
- `POST /api/account/notifications/read-all`

Additional active endpoint modules registered in `src/payload.config.ts`:

- `src/endpoints/account.ts`
- `src/endpoints/adminRepair.ts`
- `src/endpoints/engagement.ts`
- `src/endpoints/imageGeneration.ts`
- `src/endpoints/modelComments.ts`
- `src/endpoints/modelDetails.ts`
- `src/endpoints/modelReactions.ts`
- `src/endpoints/notifications.ts`

Important implication:

- Account, notifications, social, image-generation, model detail, engagement, and admin-repair endpoints are active production surface. Treat them as live backend APIs, keep origin checks and endpoint-level rate limits on mutations, and do not describe them as dormant.

## User Notifications

`user-notifications` is the private account notification collection for the shared top navigation bell. It is not the public `announcements` collection and should not expose raw `task-events` payloads to the UI.

Rules:

- Users can read only their own notification records through `ownerOrStaff('user')`.
- Direct collection writes are staff-only; account notification endpoints call `src/lib/notificationService.ts` after authenticating and checking ownership.
- Business flows create concise notifications with idempotent `sourceKey` values for generation completion/failure, print order payment/status changes, credit top-ups, subscription credit grants, and admin credit adjustments.
- The shared `TopNavigation` bell calls `/api/account/notifications*`; do not reintroduce hard-coded badge counts.

## Credit Balance Display

The canonical user credit balance is `credits.balance`. `users.creditsBalance` is only a denormalized mirror for lightweight display and admin scanning.

Rules:

- `src/app/(frontend)/_lib/session.ts` should read the cached current `credits` account for navigation/account balance display and only fall back to `users.creditsBalance` when no active credit account is available.
- `src/hooks/syncCreditBalanceMirror.ts` keeps `users.creditsBalance` synchronized when admins edit the `credits` collection directly in Payload Admin.
- Ledger flows still update both `credits.balance` and `users.creditsBalance` atomically.
- Do not treat a stale `users.creditsBalance` value as proof that a manual backend credit adjustment failed; check `credits.balance` first.

## Account Center Performance

Rules:

- `/account` should not load every account table at full size on first render. Resolve the active `section` first, fetch the active table with `accountRecordLimit`, and keep inactive tables to light summary queries.
- Account table queries should pass `depth: 0` and explicit `select` fields through the current-user helpers so large task payload fields and relationship expansions are not fetched for list rows.
- Use filtered lightweight status queries for active task/order metrics instead of counting active rows from the current table page.
- Account pages only need header navigation, so use `getMarketingSiteSettings()` rather than `getMarketingSiteData()` to avoid fetching homepage content for the account shell.

## Core Guardrails

### Local API

When passing `user` to Payload Local API, always set:

```ts
overrideAccess: false;
```

Administrative internal operations may intentionally bypass access, but keep those operations in service-owned flows and document the reason.

### Hooks

Nested Payload operations in hooks must pass `req`.

Hooks that can re-enter the same collection need a context flag to prevent recursion.

### Media Visibility

Guests can read `media` only when:

- `purpose = preview`
- or `publicAccess = true`

Public `models.visibility = public` does not make linked private media public.

### Workbench Source Images

Workbench generation endpoints must not trust client-supplied source image storage references.

Rules:

- Validate `sourceImageAsset` and `sourceImageAssets` through `src/lib/workbenchSourceAssets.ts` before calling AI task flows.
- Supabase `bucket/path` references must match the configured runtime bucket and the current user's `input/user-<id>/` prefix.
- `mediaId` references must be checked with Payload Local API using `overrideAccess: false` and the current `user`.
- Do not use a raw client-provided `publicUrl` as authorization for source images or provider signing.
- Source image signed upload helpers must remain rate limited and default to the same `NEXT_PUBLIC_MAX_UPLOAD_BYTES` upload size limit as the Workbench browser helper.

Generated image results should default to:

- `purpose = asset`
- `publicAccess = false`

Public homepage/showcase media must be intentionally guest-readable.

### API Namespaces

Use project-owned custom APIs:

- `/api/platform/...`
- `/api/studio/...`
- `/api/commerce/...`
- `/api/billing/...`
- `/api/social/...` only if social endpoints and collections are active

### Mutation Origin Checks

`rejectDisallowedMutationOrigin` enforces mutation origin allowlists for project-owned auth and business endpoints.

In non-production local development, loopback browser origins such as `http://localhost:<port>` and `http://127.0.0.1:<port>` are allowed so alternate dev ports like `3005` can call `/api/account/auth/login` without requiring every temporary port in `Security Settings`.

Production still depends on `security-settings.allowedMutationOrigins`, `ALLOWED_REQUEST_ORIGINS`, `CANONICAL_APP_URL`, or `NEXT_PUBLIC_APP_URL`.

### Browser Media URLs

Frontend pages can run on alternate local ports during UI migration, such as `http://localhost:3005`.

Payload media records may still contain absolute local URLs from another dev port, such as `http://localhost:3000/api/media/file/...`.

Before passing media URLs to browser-rendered images, normalize loopback `/api/media/file/...` URLs to same-origin relative paths like `/api/media/file/...`. Otherwise migrated pages can render data correctly but fail thumbnails because the browser requests the stale port.

Do not create Next route handlers that shadow Payload REST collection routes such as `/api/media`, `/api/models`, or `/api/users`.

Known past issue:

- A custom `src/app/api/media/route.ts` shadowed Payload REST `/api/media` and broke admin bulk edit with `405 Method Not Allowed`.

### Model Viewer Asset Delivery

`/api/platform/models/:modelId/viewer` is the controlled browser viewer entry point for GLB preview rendering.

After normal model read access succeeds, the endpoint should resolve `models_formats.file_id -> media.url` from the active Postgres schema as the first source of truth for format assets. This avoids relying on Payload field output that can be stripped by field-level access rules.

When the resolved source is a Payload media file path or an allowed remote GLB URL, the viewer endpoint should authenticate the model read, resolve a short-lived access URL, and return a `302` redirect. The browser should then fetch the final Supabase Storage URL directly instead of forcing large GLB traffic through the app server.

The frontend `ModelViewer` should fetch the viewer endpoint itself, follow redirects, display loading progress, create a blob URL after a successful response, and only then hand the blob URL to `GLTFLoader`. This prevents loader network failures from becoming Next.js runtime overlays. Direct delivery requires Supabase Storage to allow browser CORS for the app origin. If direct delivery fails, the frontend may retry the same viewer endpoint with `delivery=proxy`; that fallback is for stability and should not be the permanent hot-path for large public assets.

Runtime object storage is Supabase Storage only. Do not reintroduce AWS S3 signing, AWS S3 host construction, Payload S3 plugin registration, or `syncMediaToS3` hooks. Use the Supabase SDK for upload, public URL creation, and signed URL creation.

Payload Admin uploads for the `media` collection are also Supabase-owned. `src/hooks/uploadMediaToSupabase.ts` runs as a `media` collection `beforeChange` hook after Payload has generated file metadata; it uploads `req.file` to the configured Supabase bucket and writes the returned public URL back to `media.url` and image `thumbnailURL`. Keep `media.upload.disableLocalStorage = true`, and do not allow Admin uploads to persist `/api/media/file/...` URLs unless local storage is deliberately reintroduced across the whole media architecture.

Historical demo model records may still point to `/api/media/file/...` paths whose files are not present in Supabase Storage. Those assets need migration into the configured Supabase bucket instead of fallback signing through AWS.

`ModelViewer` must register `DRACOLoader` because imported production GLB files can be Draco-compressed. The project serves decoder assets from `public/three-draco/gltf/`; do not depend on a third-party decoder CDN for core model viewing.

Direct third-party or signed remote model URLs remain allowed only through the remote asset allowlist and should return controlled 4xx/5xx responses on failure.

Frontend asset caching is layered:

- `ModelViewer` keeps an in-memory LRU blob URL cache for fast model switching in the current page session.
- `public/asset-cache-sw.js` registers a browser Cache Storage runtime cache for model viewer responses, Payload media file requests, and local Draco decoder assets.
- Model viewer redirect responses must include `Vary: Cookie, Authorization` so browser persistent caches do not mix authenticated model access across different login states.
- Browser persistent cache size is best-effort and subject to browser quota and eviction; do not treat it as the only production hot-model cache.

Public image preview delivery should use Supabase Storage Image Transformations only at display call sites. `src/lib/supabase/imageTransform.ts` converts default Supabase `/storage/v1/object/public/...` URLs to `/storage/v1/render/image/public/...` with page-appropriate width/height/quality presets for homepage, showcase, bundle, blog, model-detail related-card, Workbench library, and account-style thumbnail display. Keep provider inputs, Workbench `sourceAsset` metadata, Meshy signed URLs, downloads, printer payloads, and full inspection views on original URLs; signed URLs and non-Supabase URLs must pass through unchanged.

### Meshy 3D Generation Flow

Workbench 3D generation is backend-owned and provider-agnostic from the browser's perspective.

The frontend should submit neutral task intent to `POST /api/studio/ai/tasks`:

- prompt
- source image asset array
- requested title
- tags
- public/private visibility
- desired output formats

Payload decides the Meshy route:

- explicit Text to 3D mode with no source images: Meshy Text to 3D preview/refine
- explicit Image to 3D mode must include at least one source image and should be rejected before task creation when no image is provided
- one source image: Meshy Image to 3D
- two to four source images: Meshy Multi Image to 3D when enabled in `ai-provider-settings`

Meshy model choice, texture generation, PBR, topology, target polycount, target formats, and multi-image enablement belong to the `ai-provider-settings.meshy` global. Meshy API keys are never sent to the frontend. Runtime can use `MESHY_API_KEY`, or admins can explicitly switch `ai-provider-settings.meshy.apiKeyMode` to the Payload admin override for operational key rotation convenience.

Meshy 3D credit pricing is separate from generic image-generation pricing. Default Meshy text/image/multi-image 3D pricing is 30 internal credits, and admins can change the values under `ai-provider-settings.meshy.pricing` without changing Gemini image-generation pricing.

Generated Meshy model files, thumbnails, and textures must be ingested into Supabase Storage before model delivery. Result models should preserve the Workbench title, tags, visibility, owner, source task, preview image when available, and generated format media records. Public requested models only become `visibility = public` when a guest-readable preview image was created; otherwise they stay private to avoid creating invalid public model records. Do not settle reserved generation credits until result model/media ingestion has succeeded; if local asset ingestion or model creation fails after provider success, mark the task failed and refund reserved credits according to the configured credit rules.

Meshy result assets are served from `assets.meshy.ai`; keep that official host allowed for backend result ingestion even when admins use the Payload-stored Meshy API key instead of `MESHY_API_KEY`. Workbench source images should be passed to Meshy through short-lived Supabase signed URLs when bucket/path metadata is available, including the multi-image flow. Do not rely on public bucket policy as the only path for provider-side source image reads.

Workbench image-generation results are private source assets, not model records. The image-generation flow may create owner-scoped `media` rows with `purpose = asset` and `publicAccess = false`, but it must not create `models` rows or publish those images to public model discovery. In the Workbench UI, generated images belong in an Image Assets panel; selecting one adds it as a source image for the next Image-to-3D/Multi-Image-to-3D task.

Future production delivery refactor:

- Keep `/api/platform/models/:modelId/viewer` as the stable access-controlled signing/redirect entry while the Workbench integration is being completed.
- Do not rely on a Vercel Function as the permanent transfer path for every large GLB file. A 30 MB model repeatedly proxied through the server can consume origin transfer quickly and adds latency.
- Add a manifest/signing layer before production scale. The preferred shape is a `viewer-manifest` response with `modelId`, `format`, `fileSize`, `updatedAt`, `cacheKey`, `deliveryMode`, `url`, and optional `expiresAt`.
- Public or hot approved models should use Supabase Storage delivery with versioned cache keys after access has been decided.
- Private models should use short-lived signed URLs or the existing controlled proxy fallback, with `Vary: Cookie, Authorization` preserved when the response is user-specific.
- Browser persistent cache remains useful for repeat local loads, but production performance should also rely on Supabase Storage headers, durable object paths, and stable cache invalidation.
- Images and thumbnails should follow the same policy: normalize URLs, cache by durable key, and avoid forcing repeat downloads of unchanged assets.

### Public Model Detail Boundary

Public homepage discovery and public model detail pages may show other users' models only when `models.visibility = public` and the preview media is guest-readable.

Workbench model library panels should remain scoped to the current user's own models. Other users' public models can enter Workbench only as read-only references or generation inspiration, not as editable library assets.

Public model cards should target the formal detail route: `/model-detail?id=<modelId>`. The former validation routes were removed after promotion.

### Source Language

Do not add Chinese literals to source code comments, frontend component source, backend services, hooks, endpoints, or libraries unless the text is intentionally Payload-managed, localized, or admin-facing.

Reason:

- The repo has had mojibake from Chinese source literals.
- Durable UI text should come from localization or Payload-managed content.

## Content Ownership

Homepage content split:

- `homepage-content`: singleton section copy and section-level settings.
- `homepage-items`: repeated cards, curated promos, image-led items, and operator-managed placements.
- `formal-pages`: operator-editable body copy, CTAs, summaries, and sections for formal info/marketing pages.

Rules:

- Do not add new hardcoded homepage rails if Payload can manage the data.
- Do not add new hardcoded formal page body copy for pages already represented in `formal-pages`; source content in `formal-pages.ts` and `marketing-content.ts` is fallback/seeding content only.
- Public homepage rendering should use public models and guest-readable preview media only.
- For the current human-readable project guide, route list, validation policy, and cleanup policy, see `docs/PROJECT_CURRENT.md`.

## Known Drift And Cleanup Items

Social collection status:

- `user-follows`
- `model-comments`
- `model-likes`
- `model-favorites`
- `engagement-views`

These collections are active in `src/payload.config.ts`. Follow, like, and favorite relations have database-level unique indexes in Postgres migrations. Engagement views are publicly writable through the registered endpoint and rely on endpoint rate limiting plus service-level hash/window dedupe.

Do not describe these social modules as dormant. Future changes must preserve endpoint auth/origin/rate-limit guards and keep migrations aligned with collection config.

Other cleanup items:

- Remove hardcoded localhost media fallback URLs from homepage.
- Keep active endpoint documentation aligned with `src/payload.config.ts`.
- Keep product docs aligned with registered Payload config, not generated-schema leftovers.

## Database And Migration Rules

Any Payload schema change must include:

1. Update collection/global config.
2. Run `pnpm payload generate:db-schema`.
3. Add a formal migration.
4. Run `pnpm generate:types`.
5. Run `pnpm exec tsc --noEmit`.
6. Update docs if table model or long-lived architecture changed.

For admin component path changes, also run:

```bash
pnpm generate:importmap
```

Watch for:

- Postgres enum drift.
- `payload_locked_documents_rels` relation-column drift.

## Documentation Rules

- `docs/DOCS_INDEX.md` is the active documentation entry point.
- Root `docs/` should contain evergreen documents only.
- Dated reports, temporary rollout plans, audit reports, and worklogs belong in `docs/archive/`.
- If archived guidance is still required, fold it into an evergreen root doc or this memory file.

Current evergreen references:

- `docs/PROJECT_CURRENT.md`: current human-readable project guide, route list, validation policy, cleanup policy, and operational boundaries.
- `docs/AI_PROJECT_MEMORY.md`: compact AI-readable architecture memory and recurring guardrails.

## Recent Decisions

### 2026-04-20

- Public homepage and showcase rely only on intentionally public models and guest-readable media.
- Homepage repeated content belongs in `homepage-items`; section copy belongs in `homepage-content`.
- Downloads are separate from viewer access because downloads can require auth and credit charging.

### 2026-04-24

- Runtime database configuration became PostgreSQL-only.
- SQLite and direct `payload.db` runtime fallback paths were removed.
- Payload migrations should use Postgres migration helpers.

### 2026-04-28

- Root docs were consolidated into evergreen documents plus `docs/archive/`.
- AI memory was compacted into guardrails and active registration facts.
- Detailed collection, route, validation, and cleanup documentation is consolidated in `docs/PROJECT_CURRENT.md`.
- Account, notifications, social, model detail, model viewer, image generation, engagement, and admin repair endpoint modules are registered. Frontend integration can use their public `/api/...` paths while preserving the documented security contracts.
- Workbench model viewing is currently stabilized through the controlled `/api/platform/models/:modelId/viewer` path plus frontend/service-worker caching. After the formal frontend flow is complete, plan a production delivery refactor around a manifest/signing layer, Supabase Storage delivery for public hot assets, short-lived signed access for private assets, and durable cache keys for models and images.
- Public model discovery/detail and Workbench ownership are separate. `/model-detail?id=<modelId>` is the formal public detail route; Workbench library panels should keep showing only the current user's own models, with other users' public models used only as read-only references.
- Backend UI development memo added for formal page wiring. Current findings: `users.avatarFrame` and `accountService` support a basic avatar frame value, but there is no admin-managed style catalog; account profile/dashboard/password endpoints are registered; model detail sidebar banner is still static and needs a backend promotion slot; the homepage featured strip and collection shelf are mostly covered by `homepage-items`, with a possible missing editable ribbon/badge label.
- `/account` now uses existing server-side current-user Local API helpers for display name, email, avatar, credit balance, and credit transaction history. Client-side account editing remains blocked on registered profile/password endpoints and the future avatar-frame style catalog.
- Formal page UI closeout kept the migrated layout intact while improving data stability: the homepage now short-circuits local `/api/media/file/...` URLs, public owner card lookups select only required fields, and runtime Supabase Storage settings use a brief in-process cache to avoid repeated global reads during media-heavy renders. `/model-detail` still depends on `/api/platform/models/:modelId/viewer`; dev delivery of local GLB media can be slow and should be handled in the later media/cache backend pass rather than by changing UI layout.
- Formal frontend route replacement points `/`, `/workbench`, `/model-detail`, and `/account` at the validated migrated UI implementations. Formal navigation should link to formal paths. The shared security header allows `blob:` in `connect-src` because `ModelViewer` creates browser object URLs before Three.js parses GLB assets.
- Project and default runtime branding now use `thornstavern` / `Thorns Tavern`. Historical migrations, filesystem paths, and Stripe subscription lookup keys intentionally remain unchanged unless a later billing/data migration explicitly renames them.

### 2026-04-29

- Media storage direction is Supabase Storage only. Do not reintroduce AWS S3 storage plugins, AWS signing helpers, or S3 sync hooks for runtime media delivery.
- Partial media migration completed for the verified local source files only: media IDs `4`, `33`, `35`, and `89` through `96` were uploaded to the configured Supabase bucket and their `media.url` values now point at Supabase Storage public object URLs.
- The migration state is summarized here instead of relying on root-level local JSON artifacts; future media migrations should create fresh reviewed backups for the exact target database before applying changes.
- Current database state after the partial migration: `96` media rows total, `11` Supabase Storage URLs, `85` legacy `/api/media/file/...` URLs. The remaining legacy rows were not updated because no verified source file or existing Supabase object was found.
- Verified model viewer delivery for migrated public GLB examples: `/api/platform/models/42/viewer?format=glb` and `/api/platform/models/44/viewer?format=glb` redirect to Supabase signed URLs, and direct Supabase range requests return `206 Partial Content`.
- Do not bulk-rewrite legacy media URLs unless the source object is verified by filename/size or an explicit migration map. Broken old demo records are a data-source problem, not a frontend fallback problem.
- The old S3 backup at `D:\py\backups\3dmodules-20260420-225145` was migrated as a Supabase legacy archive under `media/legacy-s3/3dmodules`. All `162` backed-up objects were uploaded, totaling about `1037.8 MB`; two Unicode-key PNGs were stored under `_unicode-renamed` with their original S3 keys preserved during migration review.
- The legacy S3 archive does not automatically match the remaining `85` legacy Payload media records by filename/extension/size, and its keys were not found in current `generation_tasks.callback_payload`. Treat it as a staged asset archive until an explicit mapping or import workflow connects it to product records.
- User-rebuildable resource data was reset after export backup. Cleared tables include `media`, `models`, `models_formats`, `generation_tasks`, `task_events`, engagement/social rows, print orders, Shopify payment test rows, homepage item rows, model bundle rows, and Payload lock rows. Preserved tables include `users`, sessions, credits/ledger rows, subscriptions, globals, Payload migrations, and Supabase Storage archive objects.
- Reusable cleanup command added: `pnpm db:cleanup:user-resources` for dry-run counts and `pnpm db:cleanup:user-resources -- --apply` for backup plus deletion. This is a development/deployment reset helper for user-generated resources, not a full database drop.
- The staged legacy archive was imported as administrator-owned public resources. The import created `32` public `models`, `32` preview `media` records, `110` public model-file `media` records, and `110` `models_formats` rows. Owner is admin user `1`; the durable grouping rule is same-basename pairing by legacy S3 key.
- The public resource import pairs files by identical legacy S3 key basename, not by arbitrary upload filename. It skips GLB groups without a same-basename preview image so public model cards have guest-readable thumbnails.
- Imported public model titles were normalized to `Archive <legacyResourceId>` so the same API/result ID is visible as the binding key across preview image and multiple model formats. Homepage fallback data now uses separate public-model slices for featured, shelf, and inspiration sections to reduce repeated cards when no `homepage-items` are curated.
- Public/admin-owned model files can be hidden from non-owner Payload reads by the field-level access rule on `models.formats.file`. Frontend data mappers must not require `formats.file.url` to decide whether a public model can be viewed; if a `glb` format row exists, use `/api/platform/models/:modelId/viewer?format=glb` and let the endpoint resolve `models_formats -> media.url`. The download endpoint follows the same direct format-asset resolution and must return a controlled error instead of mock content when no real asset exists.
- Workbench model loading depends on the formal `workbench` client receiving `ModelLibraryPanelCard.modelSrc`. Keep the first real card selected by default so the center `ModelViewer` is not mounted with `src=null` on initial load. The shared `ModelViewer` disk cache is versioned and should validate cached/fetched blobs with the GLB magic header before storing or reusing them, because stale bad blobs can otherwise mask healthy Supabase/Payload delivery.
- `model-preview` endpoint rate limiting must allow normal gallery browsing. The 2026-04-28 retry import considered 42 candidates (`14` newly imported and `28` reused), and a default `30` requests per 10 minutes caused `/api/platform/models/:id/viewer` to return `429` during ordinary full-batch checks and repeated Workbench switching. Keep generation, billing, social writes, and downloads stricter, but model viewer redirects should use a higher preview limit because they are read-only and ultimately redirect public GLB delivery to Supabase.
- The four migrated validation routes were promoted fully to formal routes and the route directories were removed: `/home-test`, `/workbench-test`, `/model-detail-test`, and `/account-test` no longer exist. Use `/`, `/workbench`, `/model-detail`, and `/account` for future UI and backend integration work. UI-lab component or static asset folder names may still contain `home-test` as historical asset names, but they are not routable app pages.
- Public model detail pages should show the model owner's basic public-by-context identity when the model itself is public. Do not drop the author card to `Creator` only because `users.profileVisibility` is private; still keep avatar media constrained by `purpose=preview` or `publicAccess=true` and do not expose private avatar assets.
- Keep Supabase public object URLs stable for frontend images and thumbnails. Do not wrap `/storage/v1/object/public/...` URLs in signed URLs; changing signed query strings make card thumbnails appear to reload and defeats browser cache. Private `/storage/v1/object/sign/...` or non-public media should still use signed access where required.
- Payload's built-in first admin flow posts to `/api/users/first-register`. Keep the `users` collection compatible with that flow: the first-register request must assign `role=admin` before validation and must allow Payload's internal `_verified=true` update while `auth.verify` is enabled. Do not broaden anonymous `users.update` access beyond that exact first-register verification update.
- First admin bootstrap must not depend on SMTP health. The `users` collection disables Payload's verification email only for `/api/users/first-register`; Payload still auto-verifies the first admin afterward, and normal customer registration continues to use email verification.
- Model detail creator model rails should keep the current model visible in the rail. Do not exclude the current `model.id` from the creator public-model query; otherwise the clicked/current card disappears after navigation and makes the thumbnail rail appear to refresh.
- The compact current-model info card under the model detail author block should not bind its image to the current model preview URL. Keep that small image stable to avoid making the right rail appear to refresh while the actual 3D model loads; the real current model preview belongs in the main viewer and creator model rail.
- Model detail creator rail clicks should behave like a master-detail picker, not route navigation. Keep the rail mounted, update the active model state and browser URL with history state, and avoid document/RSC/image reloads. Comments and model actions should use the active model id.
- Vercel/Supabase cutover check found that social service code depends on `user-follows`, `model-comments`, `model-likes`, `model-favorites`, and `engagement-views`. These collections must stay registered in `src/payload.config.ts`, and empty/new Supabase databases must include the 2026-04-29 social baseline migration so comments, likes, favorites, follows, and view dedupe do not fail at runtime.
- `D:\py\thornstavern_downloads` was imported into the new Supabase-backed database after the first admin account was created. Import owner is `admin@thornstavern.com`; `42` public `models`, `42` GLB `models_formats`, and `123` `media` rows were created. Assets are stored in Supabase Storage bucket `media` under `media/imports/thornstavern-downloads-20260429`; do not re-import this set through AWS S3. Three optional source images referenced by the manifest were absent, but every model has a GLB and preview image.
- Current imported public model previews and downloads do not require credit charging. Future backend work should keep preview credit cost and download credit cost independently configurable from admin/runtime settings, with charging performed server-side and download refunds issued automatically when asset delivery fails.
- Workbench is an authenticated action workspace, not a public gallery. Anonymous visitors may enter `/workbench` to inspect the UI, but generation and user-owned model/image library data require login. `/workbench/history` remains account-specific; `/workbench/models/:id` is now only a compatibility redirect to `/model-detail?id=<modelId>`. Anonymous public model preview belongs on `/model-detail?id=<modelId>` through `/api/platform/models/:modelId/viewer`.
- Model detail should reuse the same `ModelViewer` canvas when selecting creator-rail models. Do not key `ModelViewer` by `viewerURL` on that page; forcing a remount creates new WebGL contexts and browsers can stop loading models after roughly six selections even though the viewer endpoint and GLB files are healthy.
- `ModelViewer` should keep GLTF/Draco loading resources singleton-style where possible. Reuse the shared Draco decoder loader instead of creating a new `DRACOLoader` per selected model, and release WebGL renderers on unmount so route changes or dev remounts do not leak contexts. On model detail, keep the slide key stable too; keying the parent slide by preview image URL still remounts the canvas even if `ModelViewer` itself has no key.

### 2026-04-29

- Backend architecture audit cleanup formalized model downloads at `GET /api/platform/models/:modelId/download`; do not use the old mock download namespace in production UI.
- Sensitive account auth mutations, follow/unfollow mutations, and engagement view writes now use endpoint-level rate limiting in addition to existing origin/auth checks.
- `/test`, `/test-bundles`, and `/formal-components` were removed during the 2026-05-11 cleanup because they were local-only validation/design-review routes, not formal product delivery routes. Do not recreate them unless a new formal design-review workflow is explicitly requested.
- Obsolete admin service tests for removed `src/lib/admin*.ts` modules were retired. The active unit test suite is 99/99 passing, and `pnpm exec tsc --noEmit` plus `pnpm run build` passed after the cleanup.
- Public model preview latency is optimized in two layers: `/model-detail` should keep Payload reads narrow with `depth`, `select`, and parallel data preparation, while `/api/platform/models/:modelId/viewer` may use a read-only public fast path against `models -> models_formats -> media.url` before falling back to Payload access for non-public/authenticated cases. The fast path must still require `models.visibility = public`, keep endpoint rate limiting, and only bypass remote-asset global reads for configured Supabase public storage URLs.
- Model preview performance work should use the shared measurement command `pnpm measure:model-preview -- --ids 1,20,42`. It records page HTML time, viewer endpoint 302 time, Supabase range probe time, browser GLB start/finish, final ready/error, and related thumbnail count so Model Detail and Workbench preview changes can be compared against the same baseline.
- Model Detail and Workbench must keep the preview flow current-model-first: mount only one active `ModelViewer` canvas, request only the selected model's GLB, and load rail/library thumbnails by visible range instead of loading every card image immediately. The 2026-04-30 check for models `1,20,42` returned page `200`, viewer `302`, Supabase range `206`, one canvas, no visible errors, and only about `9-10` real related image requests instead of the previous full rail burst.

### 2026-05-01

- Backend UI profile/banner milestone added `avatar-frame-styles` as the admin-managed avatar frame catalog. `users.avatarFrame` remains the compatibility key, while frame thumbnails, images, unlock rules, active flags, selection flags, and ordering live in the new collection.
- User profile side banners are creator/user profile banners, not advertising or promotion slots. Compatibility storage remains `users.profileBackground`, but account and creator/model-detail service DTOs expose `profileBanner`, `profileBannerUrl`, `profileBannerFocalX`, and `profileBannerFocalY`.
- Public creator/model-detail DTOs must not leak private profile media. Avatar and profile banner URLs are returned only when the related media is guest-readable through `purpose = preview` or explicit `publicAccess = true`.
- Profile media uploads use `POST /api/account/profile-media/upload-url`, a non-shadowing Next route that creates Supabase Storage signed upload URLs and Payload `media` records for `purpose = avatar` or `profile-banner`. Runtime object storage remains Supabase Storage only.
- `homepage-items` now owns editable `badgeLabel`, `ribbonLabel`, `ctaLabel`, and `altText` fields for homepage cards. Keep homepage repeated UI content in Payload instead of hardcoding new card labels.
- `site-settings.modelAccessPolicy` records disabled-by-default preview/download credit charging controls. Imported public model previews and downloads remain free until backend policy enforcement is deliberately enabled server-side.
- Workbench image-generation assets are recoverable from backend state. The right-side Image Assets panel should be seeded from the current user's succeeded Gemini image-generation tasks by resolving `callbackPayload.imageGeneration.resultMediaId` to private owner-readable `media` records; do not rely only on transient React state for generated images.
- Image generation and 3D generation have intentionally different image-input contracts. Gemini image generation accepts at most one source image; multi-image source arrays are reserved for Meshy Image/Multi-Image to 3D. Backend endpoints must reject extra image-generation inputs with a clear error rather than silently ignoring them.
- Provider source-image access should prefer short-lived Supabase signed URLs when `bucket/path` is available, then fall back to public URLs or `mediaId` resolution. This applies to both Meshy source images and Gemini image-to-image reads so private buckets can be supported later without changing the frontend contract.

### 2026-05-01 Full-Stack Audit

- `docs/PROJECT_CURRENT.md` is the current human-readable guide and supersedes older split docs and audit memos. Social collections are active and should not be described as dormant.
- Fresh validation during the audit and remediation: `pnpm exec tsc --noEmit` passed, `pnpm test:unit` passed with `112/112` tests after the latest remediation tests were added, and `pnpm run build` passed. Build still logged SMTP `EAUTH` verification noise from configured SMTP credentials, so SMTP config remains a deployment hygiene item even though it is not a compile blocker.
- Read-only Supabase/Postgres probe found `70` public tables. Current imported public resource set is internally consistent: `42` public `models`, `42` `models_formats`, `123` `media` rows, all media URLs are Supabase public object URLs, and all 42 public models have guest-readable preview media plus Supabase-backed GLB format rows.
- Highest-priority backend risk: `src/endpoints/modelDownloads.ts` must stop returning mock download content when no real asset exists. It should return a controlled error and refund any charged credits.
- Download charging must honor `site-settings.modelAccessPolicy` instead of a hardcoded gate. Current imported public previews and downloads remain free until backend policy enforcement is deliberately enabled.
- `personal-center-test` and `personal-center-legacy` were identified as cleanup candidates. The formal account route should avoid parallel personal-center surfaces.
- Active env/admin docs still contain AWS RDS/S3 wording. Runtime direction remains Supabase Postgres plus Supabase Storage only; clean the active examples/admin UI without reintroducing AWS S3 runtime media behavior.
- Workbench image-generation assets and 3D model assets remain separate: image-generation results are private source assets, while `models` records are created only by 3D/result model flows.

### 2026-05-01 Remediation Pass

- `GET /api/platform/models/:modelId/download` now returns a controlled `404` when no real model asset URL can be resolved. It must not return generated mock model-file content in production paths.
- Download credit charging is policy-driven by `site-settings.modelAccessPolicy.chargeDownloadCredits`. Current imported public downloads remain free by default; if charging is enabled later, charges happen only after a real source asset is resolved and are refunded on delivery failure.
- Runtime environment guidance is consolidated around `DATABASE_PROVIDER=postgres`, `DATABASE_URL`, Supabase project variables, and Supabase Storage settings. Active `.env.example`, admin runtime preview, and active docs must not guide operators toward AWS/S3 runtime setup.
- `/account` now owns the formal personal center route through `src/components/account/account-center`. It uses server-side current-user data for profile, credits, transactions, tasks, models, and orders. The `/personal-center-test` route was removed after promotion; do not revive parallel personal-center routes. Profile and password edits use the existing `/api/account/profile` and `/api/account/password` endpoints without changing backend schemas.
- `ModelViewer` keeps the current-model-first architecture and still fetches only the selected viewer URL, but the loading UI is split into network, verify, parse, and ready phases so fast downloads with slower GLB/Draco parsing are visible without changing the fast Supabase redirect path.
- Homepage managed items now read `homepage-items.badgeLabel`, `ribbonLabel`, and `altText` for homepage card display metadata instead of forcing the same hardcoded ribbon copy for curated cards.
- Model detail's right-side image slot is the creator profile banner. The frontend uses `users.profileBackground` only when that media is guest-readable, with focal point fields applied as object positioning. Do not model this slot as a generic ad/promotion placement.
- The account page can consume the backend-managed `avatar-frame-styles` catalog and the current user's profile banner summary. Avatar frame visuals remain catalog-driven instead of adding new hardcoded frame names to frontend source.
- Auth modal context imports must use the canonical alias path `@/components/auth/AuthModalProvider` across provider consumers. Mixing a relative `./AuthModalProvider` import with the alias import can create duplicate context instances in Turbopack/HMR and surface as `useAuthModal must be used within AuthModalProvider`, which can make navigation disappear after login modal flows. `useAuthModal` now also has a compatibility fallback to `/login`, `/register`, or `/forgot-password` so a missing provider cannot crash the public page shell. Route changes and top navigation clicks must dismiss stale auth modal state, and the auth overlay layer must stay below the fixed top navigation layer.
- `/account` is now a protected signed-in route via `requireUser()`. It passes `fullName`, `phone`, `bio`, and `profileVisibility` into the formal personal center UI, mounts `AuthModalStage` for shared navigation compatibility, and wires avatar/profile-banner edits through `/api/account/profile-media/upload-url` plus `/api/account/profile`. Profile/password saves refresh the server component data after successful writes, and records search/range/export/pagination are real client interactions instead of static shell controls.
- `/account` current-user list helpers must add explicit owner/user `where` clauses for models, generation tasks, print orders, and credit transactions. Do not rely on collection read access alone for account rows, because public model read access can otherwise mix public gallery records into a user's model library and staff access can widen account billing/history queries.

### 2026-05-04

- `/dashboard` frontend routes were removed after confirming `/account` is the single formal personal center. Former dashboard-era user flows now land on `/account?section=tasks|models|orders|billing`; this includes login defaults, account menu model-library links, print-order follow-up, subscription portal returns, checkout returns, and business email CTAs. Keep `/api/account/dashboard` and `/api/platform/ops/dashboard` as backend API names only; do not recreate a frontend `/dashboard` personal-center surface.
- The `/account` personal center accepts a `section` search param and passes it into `AccountCenter` as the initial section. Use this instead of adding new account subroutes for models, orders, tasks, or billing unless a future product decision asks for real routable detail pages.
- Source language cleanup added `scripts/audit-source-language.mjs` and `npm`/package script `audit:source-language`. The audit fails on Chinese characters outside explicit `src/i18n/**` resources and on common mojibake markers, while excluding generated files, migrations, and local test routes.
- Production UI and backend/service copy should default to English. The corrupted admin `zh` resource was replaced with a clean `src/i18n/admin/zh.ts` translation overlay that deep-merges onto `adminEn`, so backend/admin Chinese stays in the explicit I18N resource while missing keys safely fall back to English. Do not scatter Chinese fallback strings back into collection configs, globals, admin components, or service code.
- Backend admin UI field labels, field descriptions, option labels, tabs, collection labels, and global labels are localized through `src/lib/payloadAdminI18n.ts` plus the phrase table in `src/i18n/admin/phrases.ts`. Keep future Payload config UI copy as English in config files and add Chinese only to the explicit I18N phrase table. Custom admin components should read the current Payload admin language and resolve phrases through `src/lib/adminPhrase.ts`.
- `/bundles/[slug]` is the formal public model-bundle detail route. It reads published/visible `model-bundles`, shows the bundle title, cover, summary, tags, and included public models, and links each model to `/model-detail?id=...`. Homepage `homepage-items.linkedBundle` cards should link to `/bundles/:slug`; the old `/test-bundles` local demo page has been removed.
- Workbench 3D generation stays on `/workbench`: create an immediate pending model card/loading viewer state, poll `POST /api/studio/ai/tasks/:taskId/sync`, replace the pending card with `/api/platform/models/:modelId/viewer?format=glb` when `resultModel` is available, and only use `/results/:taskCode` as a separate result route rather than the primary submission redirect.
- Workbench pending progress must distinguish provider progress from final asset readiness. Meshy preview/refine/image stages are mapped into capped progress ranges, frontend may optimistically advance within the current stage, and the UI must show `failureReason` for failed tasks such as insufficient credits instead of leaving a silent 100% pending state.
- Workbench task sync polling should be client-batched. Keep the active pending task prioritized, rotate through background pending tasks, and avoid syncing every pending task on every interval; this protects the per-user `ai-sync` endpoint rate limit without reducing backend generation worker concurrency.
- Workbench generation must preflight task credits before creating `generation-tasks` rows for both 3D model and image-generation submissions. Insufficient credits should return `402` without creating a task row, and the Workbench client should remove any transient pending card so the user sees an unsubmitted request rather than a failed generated work.
- Workbench generation defaults to a 20-credit charge. Backend billing settings must always reserve generation credits before provider dispatch; `ai-provider-settings.creditRules.reserveOnSubmit` is retained only for legacy snapshots and must not make new generation free. Admins may change positive generation prices through Site Settings and AI Provider Settings, and non-positive generation prices fall back to the 20-credit default.
- `ModelViewer` should detect WebGL availability before mounting `@react-three/fiber` Canvas. Some embedded/local browser surfaces can reject WebGL context creation; in that case show the existing model preview unavailable overlay instead of mounting Canvas and leaving an unhandled rejection/blank viewer.
- Workbench must hydrate unfinished backend 3D generation tasks on page load. Pending model cards cannot rely only on React memory because refreshes, route changes, HMR, or transient database errors can stop frontend polling while a `generation-tasks` row remains `queued` or `processing`. Seed `/workbench` from the current user's unfinished `custom`/`meshy`/`tripo` tasks so reopening the page resumes `/api/studio/ai/tasks/:id/sync`.
- Workbench generation polling should be sized for real Meshy task duration. Keep the client sync interval moderate and authenticated `ai-sync` rate limits high enough for multi-minute provider runs; a low sync cap can leave legitimate long-running tasks looking stuck even though provider polling is the intended local-dev fallback when webhooks are unavailable.
- 3D model generation must not create successful result models without real model assets. A succeeded provider callback with no downloadable model file is converted to task failure/refund, and production result models must not rely on `formats.file = null` fallback rows. Local demo/mock model results require the explicit non-production `ENABLE_AI_MOCK_RESULTS=true` switch.

### 2026-05-05

- Image generation now supports an `openai-compatible` provider in addition to Gemini official and Gemini third-party. Admin settings live under `ai-provider-settings.imageGeneration.openAICompatible` with `baseURL`, `model`, `apiKey`, and `size`; environment fallback order is `OPENAI_IMAGE_COMPATIBLE_*` first, then generic `OPENAI_*` where applicable.
- OpenAI-compatible text image generation posts JSON to `/images/generations`; image-to-image posts to `/images/edits`, preferring JSON `images: [{ image_url }]` and falling back to multipart only for providers that reject that JSON shape. Keep this separate from Gemini-compatible gateways, which use `x-goog-api-key` and `generateContent`.
- OpenAI-compatible image-to-image should prefer `/images/edits` JSON with `images: [{ image_url }]` when a Workbench source image has a Supabase/public/signed URL. Current tested GPT Image compatible gateways can succeed through JSON image URLs while multipart `image` or `image[]` uploads may fail with `502 stream disconnected before completion`. Keep multipart only as a compatibility fallback when the provider rejects the JSON edit request format.
- Workbench image-reference generation has two OpenAI-compatible image-to-image prompt routes: uploaded image plus configured default prompt, or uploaded image plus configured default prompt plus user prompt. Both routes must dispatch as JSON `/images/edits` with `images: [{ image_url }]` and a non-empty effective `prompt`; do not treat a raw image upload without an effective prompt as provider-ready.
- OpenAI-compatible image providers can return classic Images JSON (`data[].b64_json` or `data[].url`), Responses-style JSON (`image_generation_call.result`), or SSE `data:` events containing those payloads. Keep the parser tolerant of all three shapes and redact large `result`, `b64_json`, or `partial_image_b64` values from failure reasons before storing them on generation tasks.
- `/api/studio/ai/images` must not force `gemini-official` when no provider is supplied. Let the image-generation global default provider select Gemini official, Gemini third-party, or OpenAI-compatible so backend admin configuration is the source of truth.
- `media.upload.disableLocalStorage` must stay enabled. Runtime assets are uploaded to Supabase Storage first, then represented by Payload media rows with external URLs. Leaving Payload local upload storage enabled can make generated Meshy/image assets fail during finalization with local `media` directory filesystem errors.
- Workbench image generation is asynchronous. `POST /api/studio/ai/images` creates a queued `generation-tasks` row and returns immediately with `/api/studio/ai/images/:taskId/sync`; provider work runs after the response and the Workbench polls until the private generated media asset is ready. Image-generation tasks use `taskType = image-generation`, while 3D/model tasks use `taskType = model-generation`; do not infer the product task type from `inputMode` labels. Admins can set `ai-provider-settings.imageGeneration.defaultPrompt`, which is prepended to the user prompt and stored in the task snapshot for provider dispatch.
- Workbench image-generation defaults are templates, not user input. Keep the prompt state empty until the user types or restores a real draft, show the backend default prompt only as placeholder/context, and reject text-mode image generation before reading the default prompt when no user prompt is provided. Image-to-image may use the configured default template with the uploaded reference image, but a no-prompt/no-image submission must not create a task.
- Image-generation sync polling must be able to recover unfinished provider dispatch. The image sync endpoint should reschedule runnable `queued`/`processing` tasks when no result media exists, while `runImageGenerationTask` records `parameterSnapshot.imageGeneration.dispatchStartedAt` and treats recent processing tasks as already dispatched. Dispatch scheduling should not depend only on Next `after()`; keep a non-blocking same-process fallback and an in-process work queue. Image-generation dispatch concurrency is backend-editable at `ai-provider-settings.imageGeneration.maxConcurrentTasks`, defaults to `20`, and falls back to `IMAGE_GENERATION_MAX_CONCURRENT_TASKS` when the global cannot be read; duplicate sync calls for the same task must not enqueue duplicate workers. The image provider timeout has a `600` second runtime floor and the stale-dispatch recovery window is `900000` ms so slow but successful OpenAI-compatible image queues are not prematurely timed out or duplicated, even when a saved admin global still contains the old `60` second default. Keep `ai-image-submit` rate limits high enough for more than 20 accepted submissions, because overload should queue in the backend instead of failing before the queue.
- Image-generation worker scheduling must not block the submit response on reading `ai-provider-settings`. Keep global concurrency refresh fire-and-forget, queue stale task locks expirable, and avoid starting every worker in the same millisecond. Local stress testing on 2026-05-21 showed the root failure was backend Postgres pressure (`POSTGRES_POOL_MAX=3` plus 5s connection timeout), not the OpenAI-compatible `images: [{ image_url }] + prompt` provider payload. Local defaults now use `POSTGRES_POOL_CONNECTION_TIMEOUT_MS=60000`; local `.env` can use `POSTGRES_POOL_MAX=10` with image worker concurrency capped at 20 so excess work queues instead of starving Payload/Postgres.
- Image-generation provider retry belongs inside `runImageGenerationTask`, not the Workbench client. A transient provider failure such as timeout, 429, 5xx, network reset, or concurrency overload should retry once inside the same `generation-tasks` row and credit reservation, record retry metadata under `parameterSnapshot.imageGeneration`, and stay bounded by the backend image-generation concurrency queue. Do not retry configuration/auth/source-image validation failures.
- Image-generation provider credentials entered in `ai-provider-settings.imageGeneration.*.apiKey` are admin overrides. Runtime should use the saved admin key when it is non-empty, then fall back to provider-specific environment variables. For OpenAI-compatible third-party providers, non-default admin `baseURL`, `model`, and `size` values should also win over generic environment fallbacks.
- Meshy 3D model generation concurrency is backend-editable at `ai-provider-settings.meshy.maxConcurrentTasks`, defaults to `20`, and falls back to `MESHY_MAX_CONCURRENT_TASKS` when backend settings are unavailable. Keep provider dispatch capacity checks backend-owned; Workbench must not decide model-generation concurrency.

### 2026-05-10

- Customer direct Payload REST writes are blocked for provider-owned workflow records: `models.create`, `generation-tasks.create`, `generation-tasks.update`, and `print-orders.create` are staff-only. The Workbench/image-generation/print-order service paths write those records with explicit internal access after doing their own auth, credit, and checkout checks. Model proof and delivery fields (`viewerUrl`, social counts, `formats.file`, and `formats.downloadCredits`) are staff-writable only; public/customer model reads and owner updates for non-protected fields still use the existing access rules.
- Customer direct Payload media writes sanitize visibility: `sanitizeMediaUploadVisibility` runs before Supabase upload, allows customer-created `purpose` only for `asset`, `avatar`, `input`, and `profile-banner`, and forces `publicAccess = false`. Staff and explicit service writes with `context.allowManagedMediaVisibility = true` can still create `preview` or public media for generated public model previews and operator-managed assets. `media.purpose` and `media.publicAccess` are staff-updatable only.
- Social identity fields are service-enforced: `forceCurrentUserField` is attached to `model-likes.user`, `model-favorites.user`, `user-follows.follower`, `model-comments.author`, and `engagement-views.viewer`. Customer creates overwrite spoofed identity fields with `req.user.id`; anonymous engagement views clear `viewer`; staff can still manage records. `UserFollows.update` is staff-only, and `assignCurrentUser` now always overwrites spoofed create identity fields instead of only filling missing values.
- Runtime branding defaults must not leak old project names or local URLs. `.env.example` uses `EMAIL_FROM_NAME=Thorns Tavern`, and `RuntimeEnvPreview` renders `<not-configured>` for missing `nextPublicAppUrl` instead of defaulting to `http://localhost:3000`.
- Account service Local API calls use the current request user through `accessOptions(req) = { overrideAccess: false, user: req.user }` when authenticated. Keep `tests/accountServiceAccess.test.ts` as a regression guard so account dashboard/profile reads do not silently fall back to anonymous access evaluation.
- Legacy Supabase SQL paths have explicit ownership boundaries: `src/lib/supabase/queries.ts` is a read-only legacy/reporting facade, while `src/lib/supabase/billing.ts` may sync Stripe customer/subscription/print-order compatibility rows but must not mutate credit accounts or credit ledger state. Credit mutations belong in the Payload credit ledger services.
- `getCachedPayload` lazy-loads `@payload-config`, shares successful initialization, clears failed initialization so later requests can recover, and applies a short failure backoff so bursts after a first Postgres connection failure do not repeatedly open new connection attempts. Keep `tests/getCachedPayload.test.ts` and the test loader's `@payload-config` alias support when changing this helper.
- Workbench image generation (`imageTools`) supports only one reference image. The client should cap image-mode references at one and submit only that asset; the image-generation endpoint should still tolerate stale clients that send multiple `sourceImageAssets` by using the first source image and normalizing the task snapshot.
- `/model-detail` must not mount both desktop and mobile `ModelViewer` instances at the same time. Hidden zero-size responsive branches can keep a stale loading overlay and a second WebGL canvas alive, which breaks `measure:model-preview` and wastes browser resources. Gate viewer mounting by the active media query, and keep `scripts/measure-model-preview.mjs` checking only visible canvas/error/loading overlay nodes. The 2026-05-10 baseline for ids `1,20,42` returned page `200`, viewer `302`, Supabase range `206`, one visible canvas, no visible error, empty final loading text, and 9 related real images.
- `pnpm test:smoke` includes HTTP route checks, a model viewer endpoint/range probe, and browser checks. The browser smoke verifies anonymous `/model-detail?id=<SMOKE_MODEL_ID>` mounts one visible model canvas without a visible error overlay, while readiness is reported separately because remote Supabase GLB downloads can legitimately outlive the smoke timeout in headless Edge. Anonymous `/workbench` Generate must open the login dialog without posting to `/api/studio/ai/tasks` or `/api/studio/ai/images`.
- `ModelViewer` GLB fetch timeouts are stall-based, not absolute wall-clock timers. Refresh the timeout after response headers and each received chunk so a large model on a slow but progressing connection does not abort before falling back to proxy delivery; still abort stalled requests that make no progress.

### 2026-05-03

- Customer registration now supports backend-configurable verification modes through `security-settings`: `registrationVerificationMode = email-code` is the default, while `email-link` preserves the legacy Payload verification-link flow.
- Email-code registration uses the `email-verification-codes` collection. Codes are short-lived, stored only as hashes, rate-limited through the auth email scope, consumed server-side before user creation, and never exposed to the frontend.
- Public auth UI reads `GET /api/account/auth/settings` and calls `POST /api/account/auth/send-register-code` only when the backend mode requires a code. Registration security is enforced in `registerAccount`; frontend display is not the source of truth.
- In email-code mode, successful registration creates the user with `_verified = true` and `disableVerificationEmail = true`, so Payload does not send the old verification-link email. In email-link mode, the previous generic registration response and Payload email verification remain compatible.
- Local SMTP was verified with Aliyun enterprise mail before this change; runtime still relies on server-side SMTP/Resend configuration and must not place email API keys or SMTP passwords in frontend code.
- Account avatar and profile-banner uploads are a two-step Supabase Storage flow. `/api/account/profile-media/upload-url` only reserves object path and metadata; the browser uploads to the signed Supabase URL; `/api/account/profile-media/complete` verifies ownership/path and writes the final media URL before `/api/account/profile` links it to the user. Do not create Payload upload records before the object exists, because Payload upload collections validate file presence and will throw `MissingFile` / `FileRetrievalError`.
- Avatar uploads keep the original object in the configured Supabase Storage bucket and generate a server-side `*-avatar.webp` derivative during `/api/account/profile-media/complete`. The derivative uses Payload-style `sharp` processing: auto-rotate, center-cover square crop/resize, WebP output, and a 500px maximum configured by `AVATAR_IMAGE_SIZE` but clamped to 500. Store that derivative in `media.thumbnailURL` so existing profile, nav, homepage, model-detail, and Workbench avatar reads prefer the processed public URL while preserving the original `media.url`. Do not reject non-square avatar uploads; process them into the avatar derivative instead.
- `requireUser()` accepts an optional redirect target and defaults to `/account`. Use `/account?section=tasks`, `/account?section=models`, `/account?section=orders`, or `/account?section=billing` for former dashboard-era account destinations.
- One-time credit package purchases now use `credit-products` as the editable product catalog and `shopify-payments` as the neutral payment record table. The checkout endpoints are `/api/billing/credits/checkout` and `/api/billing/credits/sync`; Stripe checkout sessions use `metadata.paymentType = credit-topup`. The Stripe webhook must route credit top-up payment sessions to `finalizeCreditTopupCheckoutSession`, not the print-order finalizer. Successful paid sessions call `purchaseCredits` with idempotency key `credit-topup:<sessionId>`, write a `credit-transactions.type = purchase` ledger row, update `credits.balance/lifetimePurchased`, and mirror the new balance to `users.creditsBalance`.

### 2026-05-06

- Email-code registration returns `loginReady = true` only when a new verified user is actually created. The public auth modal should auto sign in and close only for that explicit flag, then reuse the normal login completion path that waits for `/api/account/auth/me`; duplicate or email-link-compatible registration responses must remain generic and should not trigger auto-login.
- Password recovery uses the auth modal `forgot-success` state for the "Check Your Email" confirmation. The reset-password page reuses `AuthFlowCard` in `reset` mode and submits to `/api/account/auth/reset-password`, not Payload's raw `/api/users/reset-password`; after a successful reset the UI clears the transient reset session and returns the user to the shared sign-in card so they can log in with the new password.
- Model bundle merchandising is now owned by `model-bundles`: `bundleType`, `subtitle`, `badgeLabel`, `coverImage`, `heroImage`, `includedSummary`, `technicalSpecs`, `license`, `cta`, and `releaseNotes` support the homepage bundle rails, `/bundles`, and `/bundles/[slug]`. `coverImage` is thumbnail/card media; `heroImage` is the bundle detail banner and falls back to `coverImage`. Public bundle rendering must go through `src/lib/bundleService.ts`, use `overrideAccess: false`, show only published/visible bundles, include only `models.visibility = public`, and normalize media URLs without exposing private media. Published visible bundle cover and hero images must already be guest-readable through `purpose = preview` or explicit `publicAccess = true`; `validatePublicBundleCoverImage` enforces that business rule without silently changing Media records.
- Homepage top rails now prefer operator-managed `homepage-items`, then public bundle cards, then public model fallbacks. The lower inspiration grid remains public model discovery. Keep the current page layout unchanged and treat `/bundles` as the formal "all bundles" destination for the second rail.
- Bundle CTA pricing is a merchandising display field only in this phase. It does not grant access, reserve credits, create purchases, or unlock downloads; add a dedicated commerce/entitlement design before enforcing paid bundle behavior.

### 2026-05-07

- 2026-05-11 cleanup removed the local-only route inventory and design validation pages: `/test`, `/test-bundles`, and `/formal-components`.
- `/api/locale` only accepts same-origin relative redirect paths. Empty, absolute, and protocol-relative redirect values fall back to `/`.
- The frontend route layout no longer wraps all pages in an extra `<main>`, so pages can own their own primary landmark without nested main elements.
- Public `/pricing` and `/showcase` list queries should fail soft to empty states when local database reads fail; this is page resilience only and does not replace fixing database connectivity.
- `/results/[taskCode]` clamps progress to the 0-100 range and renders download buttons from actual available model formats.
- The confirmed stale `GenerateForm` component and `personal-center-legacy` UI-lab files were removed after reference checks. Do not recreate those legacy entry points; `/generate` redirects to `/workbench` and `/account` owns the formal personal center.
- A 2026-05-07 audit found P1 permission-design work that still needs owner discussion before remediation: direct Payload REST create ownership for owner/user-scoped collections and client-controlled identity/visibility fields on user-writable collections.
- Model bundle detail hero copy now has an optional `heroMarketing` group on `model-bundles` for operator-controlled eyebrow, title override, subtitle override, slogan, and three fixed selling points. `/bundles/[slug]` should use these fields only as detail-page marketing copy and fall back to the basic bundle title/subtitle/summary when they are empty, keeping the layout stable instead of allowing arbitrary rich page composition.

### 2026-05-08

- `/features`, `/solutions`, `/resources`, and `/developers` now share the formal dark gold `MarketingPage` layout. The shared shell uses the same public navigation, auth modal stage, hero artwork treatment, and footer-link helper pattern as the newer `/about` and `/showcase` pages.
- `/showcase/[id]` is now only a compatibility redirect to `/model-detail?id=<id>`. Keep `/model-detail` as the canonical public model detail route, and point future public model cards directly to that route.
- `/model-detail` no longer renders static fake model data when `id` is missing, invalid, or not a public model. `src/app/(frontend)/model-detail/page.tsx` calls `notFound()` when `getModelDetailData()` returns null, and `ModelDetailNative` requires real `ModelDetailData`.
- `/results/[taskCode]` is a lightweight compatibility generation receipt/status route, not a model preview page. Workbench and `/model-detail` remain the primary model preview surfaces. The result route uses a dark gold receipt layout, links users back to Workbench/account history, and only shows delivery actions from real result model formats.
- `/reset-password` uses a route-local responsive shell instead of the fixed `h-[960px]` stage. It passes `mobileChildren` into `SiteShell` so mobile does not use the desktop 1920px scaled stage, while the shared auth form component remains unchanged.

### 2026-05-09

- `/blog` and `/blog/[slug]` are the formal public Tavern Journal routes. They reuse the registered `posts` collection; do not add a duplicate `blog-posts` collection or custom `/api/posts` or `/api/blog` routes.
- Public blog reads must go through access-controlled Payload Local API calls with `overrideAccess: false`. Guest-visible posts require `_status = published`, `isVisible = true`, and an empty or past `publishedAt`; drafts, hidden posts, and future posts must not render on list or detail pages.
- Published visible posts with `coverImage` must use guest-readable media (`purpose = preview` or `publicAccess = true`). `validatePostCoverImage` enforces this business rule without silently changing media visibility.
- Blog rich text is rendered from Lexical node data, not with `dangerouslySetInnerHTML`. Cover media URLs are normalized for browser display, and missing/private covers fall back to branded empty artwork instead of leaking private media.
- Public page footers are now centralized in `FooterBar` and backed by `site-settings.footer.linkGroups`. Do not add new page-local footer link arrays; update Site Settings when footer groups or links need to change. The related tables are `site_settings_footer_link_groups` and `site_settings_footer_link_groups_links`.
- `/verify-email/[token]` uses a route-local responsive shell instead of `SiteShell`'s desktop 1920px fixed stage. It keeps `VerifyEmailClient` as the verification worker and shares `FooterBar` for both desktop and mobile.
- Formal public page body copy is now centralized in the `formal-pages` global. It covers info pages (`/about`, `/contact`, `/privacy-policy`, `/refund-policy`, `/shipping-policy`) and marketing pages (`/features`, `/solutions`, `/resources`, `/developers`, `/pricing`, `/showcase`). Frontend reads use `payload.findGlobal({ slug: 'formal-pages', overrideAccess: false })` and merge CMS values over source fallbacks.
- Formal public navigation should resolve through `site-settings.headerNav` using `resolvePublicNavigationItems`. The adapter preserves known IDs such as `HOME`, `WORKBENCH`, `SHOWCASE`, `PLANS`, `BLOG`, and `ABOUT` while allowing backend-managed labels and order to drive `TopNavigation` and mobile formal headers. Avoid new production uses of `migrationTestNavItems` on CMS-backed formal pages.
- `/blog` page header settings are also owned by `formal-pages.blogPage`: hero eyebrow/title/text/image, CTAs, category labels, dispatch count label, and SEO title/description. `/blog` resolves them through `blogPageContent.ts` and falls back to `blogPageDefaults.ts`; article data remains owned by `posts`.
- `GET /api/platform/models/:modelId/download` allows anonymous redirects for public models only when `site-settings.modelAccessPolicy.chargeDownloadCredits` is disabled and the request is a normal file download. The public fast path resolves `models -> models_formats -> media.url` directly, matching the viewer endpoint's public-asset boundary; inline delivery, charged downloads, private models, and missing public format rows still require authentication or return controlled errors.
- `/model-detail` comments are backed by `/api/social/models/:id/comments`, not static sidebar copy. The page loads a sanitized comment DTO, opens the shared auth modal for anonymous submissions, and posts authenticated comments through the existing comment service. Its displayed download cost comes from `site-settings.modelAccessPolicy` plus per-format `downloadCredits`; when charging is disabled the UI shows the download as free and uses the anonymous public download path.
- `/model-detail` is the single model detail UI for public models and for models owned by the signed-in user. Its Payload read passes the current user with `overrideAccess: false`, so private models are available only to their owner or staff through the existing `models` access rule. `/workbench/models/[id]` is a compatibility redirect and the old demo/detail implementation files were removed.
- UI delivery review is currently in the mobile/browser verification phase. `/workbench`, `/model-detail`, and `/` have independent mobile layouts verified with Edge/Playwright; `/` was accepted with the desktop-style "Ideas to Miniatures" mobile generator hero and checked at 360/390/430 mobile widths plus 1440 desktop width with zero horizontal overflow. The desktop audit report on the user's Desktop was updated to mark those routes verified.
- Next UI review task: continue with the remaining routes still marked `鏈獙璇乣 in `C:\Users\changcheng\Desktop\Thorns_Tavern_浜や粯瀹℃煡鎶ュ憡_20260508.md`, starting with the shared public/formal pages (`/about`, `/showcase`, `/bundles`, `/bundles/[slug]`, `/pricing`, then the shared `MarketingPage` and `FormalInfoPage` groups) before moving to `/account` cleanup or backend P1/P2 security items.
- The shared public/formal page verification pass has now been completed for `/about`, `/showcase`, `/bundles`, `/bundles/starter-guide-first-tavern-kit`, `/pricing`, `/features`, `/solutions`, `/resources`, `/developers`, `/contact`, `/privacy-policy`, `/refund-policy`, `/shipping-policy`, and `/verify-email/not-a-real-token`. Each returned `200` and had zero horizontal overflow at 1366x768 desktop and 390x844 mobile. The audit report was updated; the only UI matrix row still pending visual review is `/account`; `/workbench/models/[id]` has been resolved as a redirect.

### 2026-05-10

- Profile avatar and profile-banner upload routes derive `media.publicAccess` server-side from the authenticated user's `profileVisibility`; client `publicAccess` values are ignored and the account UI no longer sends them. Keep this route-level rule because the two-step SQL media helper bypasses Payload collection hooks.
- Notification `markAllNotificationsRead` must update every unread notification for the current user, not only the first top-navigation page. The service now loops over access-controlled unread batches and returns the actual updated count.
- Auth compatibility redirects use `getSafeInternalRedirect` / `isSafeInternalRedirect`. Internal redirects must start with a single `/` and reject protocol-relative paths such as `//example.com` and backslash-prefixed variants.
- `/model-detail` no longer masks data damage with UI-lab model placeholder images. A model detail payload requires a real accessible preview image; related creator models without a resolved preview are filtered out; an empty related rail renders an explicit empty state. Public owner display must not select or fall back to email local-parts.
- Blog detail reads fail soft to `null` on Payload/database errors so the route can render `notFound()` instead of an uncaught 500. `BlogArticleBody` remains a Lexical node renderer and supports common article nodes including upload images, h4 headings, code blocks, and horizontal rules without `dangerouslySetInnerHTML`.
- Account center production fallback data is empty, not demo rows. Do not reintroduce Dragon/Northern/Lava style activity rows or fake credit balances into the production account component; missing account data should render the existing empty table/state with zero metrics.
- Public pricing cards use minimum heights instead of fixed clipped content boxes so backend-managed plan features can grow without silently hiding text. The top-navigation cart glyph links to `/account?section=orders` as an order shortcut rather than acting as an inert button.
- Social, engagement, and task-event collections are no longer customer/public direct-write surfaces. `model-likes`, `model-favorites`, `model-comments`, `user-follows`, `engagement-views`, and `task-events` keep their formal service endpoints as the write owners; collection create/update/delete is staff-only so direct Payload REST cannot bypass origin/rate-limit checks, public-target validation, counter synchronization, or task timeline ownership.
- Active Vercel env examples must not include AWS/S3 runtime media variables. Supabase Storage runtime settings live in Payload Admin -> Globals -> Storage Settings, matching the project-wide Supabase Storage-only direction.
