# AI Project Memory

## Purpose

This is the compact AI-readable memory for `thornstavern`.

Use it first to understand stable project boundaries, active entry points, and recurring pitfalls. For detailed collection fields, hooks, and frontend mapping, use `docs/COLLECTIONS_REFERENCE.md`.

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

## Current Architecture

Product surfaces:

- Marketing web
- Studio / Workbench
- Dashboard
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

Registered globals:

- `site-settings`
- `homepage-content`
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
- `GET /api/platform/mock/models/:modelId/download`
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

Endpoint modules present but not registered:

- `src/endpoints/account.ts`
- `src/endpoints/adminRepair.ts`
- `src/endpoints/engagement.ts`
- `src/endpoints/imageGeneration.ts`
- `src/endpoints/modelComments.ts`
- `src/endpoints/modelDetails.ts`
- `src/endpoints/modelReactions.ts`

Important implication:

- Frontend code must not assume dormant account, social, image-generation, or admin-repair endpoints are live until they are registered in `src/payload.config.ts`.

## Core Guardrails

### Local API

When passing `user` to Payload Local API, always set:

```ts
overrideAccess: false
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

Historical demo model records may still point to `/api/media/file/...` paths whose files are not present in Supabase Storage. Those assets need migration into the configured Supabase bucket instead of fallback signing through AWS.

`ModelViewer` must register `DRACOLoader` because imported production GLB files can be Draco-compressed. The project serves decoder assets from `public/three-draco/gltf/`; do not depend on a third-party decoder CDN for core model viewing.

Direct third-party or signed remote model URLs remain allowed only through the remote asset allowlist and should return controlled 4xx/5xx responses on failure.

Frontend asset caching is layered:

- `ModelViewer` keeps an in-memory LRU blob URL cache for fast model switching in the current page session.
- `public/asset-cache-sw.js` registers a browser Cache Storage runtime cache for model viewer responses, Payload media file requests, and local Draco decoder assets.
- Model viewer redirect responses must include `Vary: Cookie, Authorization` so browser persistent caches do not mix authenticated model access across different login states.
- Browser persistent cache size is best-effort and subject to browser quota and eviction; do not treat it as the only production hot-model cache.

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

Rules:

- Do not add new hardcoded homepage rails if Payload can manage the data.
- Public homepage rendering should use public models and guest-readable preview media only.
- For detailed collection mappings, see `docs/COLLECTIONS_REFERENCE.md`.
- Backend-owned UI slot notes for the migrated formal frontend are tracked in `docs/BACKEND_UI_DEVELOPMENT_MEMO.md`.

## Known Drift And Cleanup Items

Social table/config drift:

- `user-follows`
- `model-comments`
- `model-likes`
- `model-favorites`
- `engagement-views`

These appear in generated schema, migrations, services, or dormant endpoint files, but matching active collection configs are not registered in `src/payload.config.ts`.

Do not build new frontend integration against these until collection configs, generated types, migrations, services, and endpoint registration are aligned.

Other cleanup items:

- Remove hardcoded localhost media fallback URLs from homepage.
- Confirm or remove dormant endpoint modules before exposing related frontend flows.
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

- `docs/COLLECTIONS_REFERENCE.md`: active collection and frontend mapping reference.
- `docs/ARCHITECTURE_BLUEPRINT.md`: architecture map.
- `docs/AI_PRODUCT_FRAMEWORK_GUIDE.md`: product/backend integration guide.
- `docs/DEVELOPMENT_GUIDE.md`: engineering workflow.
- `docs/DATABASE_TABLE_REFERENCE.md`: table/domain reference.
- `docs/DATABASE_MIGRATION_STANDARD.md`: migration policy.

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
- Detailed collection documentation moved to `docs/COLLECTIONS_REFERENCE.md`.
- Frontend integration must not assume dormant endpoint modules are registered.
- Workbench model viewing is currently stabilized through the controlled `/api/platform/models/:modelId/viewer` path plus frontend/service-worker caching. After the formal frontend flow is complete, plan a production delivery refactor around a manifest/signing layer, Supabase Storage delivery for public hot assets, short-lived signed access for private assets, and durable cache keys for models and images.
- Public model discovery/detail and Workbench ownership are separate. `/model-detail?id=<modelId>` is the formal public detail route; Workbench library panels should keep showing only the current user's own models, with other users' public models used only as read-only references.
- Backend UI development memo added for formal page wiring. Current findings: `users.avatarFrame` and `accountService` support a basic avatar frame value, but there is no admin-managed style catalog; `src/endpoints/account.ts` defines profile/dashboard endpoints but they are not registered in `src/payload.config.ts`; model detail sidebar banner is still static and needs a backend promotion slot; the homepage featured strip and collection shelf are mostly covered by `homepage-items`, with a possible missing editable ribbon/badge label.
- `/account` now uses existing server-side current-user Local API helpers for display name, email, avatar, credit balance, and credit transaction history. Client-side account editing remains blocked on registered profile/password endpoints and the future avatar-frame style catalog.
- Formal page UI closeout kept the migrated layout intact while improving data stability: the homepage now short-circuits local `/api/media/file/...` URLs, public owner card lookups select only required fields, and runtime S3 storage settings use a brief in-process cache to avoid repeated global reads during media-heavy renders. `/model-detail` still depends on `/api/platform/models/:modelId/viewer`; dev delivery of local GLB media can be slow and should be handled in the later media/cache backend pass rather than by changing UI layout.
- Formal frontend route replacement points `/`, `/workbench`, `/model-detail`, and `/account` at the validated migrated UI implementations. Formal navigation should link to formal paths. The shared security header allows `blob:` in `connect-src` because `ModelViewer` creates browser object URLs before Three.js parses GLB assets.
- Project and default runtime branding now use `thornstavern` / `Thorns Tavern`. Historical migrations, filesystem paths, and Stripe subscription lookup keys intentionally remain unchanged unless a later billing/data migration explicitly renames them.

### 2026-04-29

- Media storage direction is Supabase Storage only. Do not reintroduce AWS S3 storage plugins, AWS signing helpers, or S3 sync hooks for runtime media delivery.
- Partial media migration completed for the verified local source files only: media IDs `4`, `33`, `35`, and `89` through `96` were uploaded to the configured Supabase bucket and their `media.url` values now point at Supabase Storage public object URLs.
- Migration artifacts were written to `media-migration-supabase-before.json` and `media-migration-supabase-result.json`. `media-migration-current-media.json` remains the earlier full-row backup.
- Current database state after the partial migration: `96` media rows total, `11` Supabase Storage URLs, `85` legacy `/api/media/file/...` URLs. The remaining legacy rows were not updated because no verified source file or existing Supabase object was found.
- Verified model viewer delivery for migrated public GLB examples: `/api/platform/models/42/viewer?format=glb` and `/api/platform/models/44/viewer?format=glb` redirect to Supabase signed URLs, and direct Supabase range requests return `206 Partial Content`.
- Do not bulk-rewrite legacy media URLs unless the source object is verified by filename/size or an explicit migration map. Broken old demo records are a data-source problem, not a frontend fallback problem.
- The old S3 backup at `D:\py\backups\3dmodules-20260420-225145` was migrated as a Supabase legacy archive under `media/legacy-s3/3dmodules`. All `162` backed-up objects were uploaded, totaling about `1037.8 MB`; two Unicode-key PNGs were stored under `_unicode-renamed` with their original S3 keys preserved in `media-migration-legacy-s3-to-supabase.json`.
- The legacy S3 archive does not automatically match the remaining `85` legacy Payload media records by filename/extension/size, and its keys were not found in current `generation_tasks.callback_payload`. Treat it as a staged asset archive until an explicit mapping or import workflow connects it to product records.
- User-rebuildable resource data was reset after export backup. Cleared tables include `media`, `models`, `models_formats`, `generation_tasks`, `task_events`, engagement/social rows, print orders, Shopify payment test rows, homepage item rows, model bundle rows, and Payload lock rows. Preserved tables include `users`, sessions, credits/ledger rows, subscriptions, globals, Payload migrations, and Supabase Storage archive objects.
- Reusable cleanup command added: `pnpm db:cleanup:user-resources` for dry-run counts and `pnpm db:cleanup:user-resources -- --apply` for backup plus deletion. This is a development/deployment reset helper for user-generated resources, not a full database drop.
- The staged legacy archive was imported as administrator-owned public resources. The import created `32` public `models`, `32` preview `media` records, `110` public model-file `media` records, and `110` `models_formats` rows. Owner is admin user `1`; source mapping is recorded in `admin-public-resource-import-2026-04-28T17-14-40-259Z.json`.
- The public resource import pairs files by identical legacy S3 key basename, not by arbitrary upload filename. It skips GLB groups without a same-basename preview image so public model cards have guest-readable thumbnails.
- Imported public model titles were normalized to `Archive <legacyResourceId>` so the same API/result ID is visible as the binding key across preview image and multiple model formats. Homepage fallback data now uses separate public-model slices for featured, shelf, and inspiration sections to reduce repeated cards when no `homepage-items` are curated.
- Public/admin-owned model files can be hidden from non-owner Payload reads by the field-level access rule on `models.formats.file`. Frontend data mappers must not require `formats.file.url` to decide whether a public model can be viewed; if a `glb` format row exists, use `/api/platform/models/:modelId/viewer?format=glb` and let the endpoint resolve `models_formats -> media.url`. The mock download endpoint follows the same direct format-asset resolution so public model downloads return real Supabase assets instead of mock files.
- Workbench model loading depends on the formal `workbench` client receiving `ModelLibraryPanelCard.modelSrc`. Keep the first real card selected by default so the center `ModelViewer` is not mounted with `src=null` on initial load. The shared `ModelViewer` disk cache is versioned and should validate cached/fetched blobs with the GLB magic header before storing or reusing them, because stale bad blobs can otherwise mask healthy Supabase/Payload delivery.
- `model-preview` endpoint rate limiting must allow normal gallery browsing. The 2026-04-28 retry import considered 42 candidates (`14` newly imported and `28` reused), and a default `30` requests per 10 minutes caused `/api/platform/models/:id/viewer` to return `429` during ordinary full-batch checks and repeated Workbench switching. Keep generation, billing, social writes, and downloads stricter, but model viewer redirects should use a higher preview limit because they are read-only and ultimately redirect public GLB delivery to Supabase.
- The four migrated validation routes were promoted fully to formal routes and the route directories were removed: `/home-test`, `/workbench-test`, `/model-detail-test`, and `/account-test` no longer exist. Use `/`, `/workbench`, `/model-detail`, and `/account` for future UI and backend integration work. UI-lab component or static asset folder names may still contain `home-test` as historical asset names, but they are not routable app pages.
- Public model detail pages should show the model owner's basic public-by-context identity when the model itself is public. Do not drop the author card to `Creator` only because `users.profileVisibility` is private; still keep avatar media constrained by `purpose=preview` or `publicAccess=true` and do not expose private avatar assets.
- Keep Supabase public object URLs stable for frontend images and thumbnails. Do not wrap `/storage/v1/object/public/...` URLs in signed URLs; changing signed query strings make card thumbnails appear to reload and defeats browser cache. Private `/storage/v1/object/sign/...` or non-public media should still use signed access where required.
- Model detail creator model rails should keep the current model visible in the rail. Do not exclude the current `model.id` from the creator public-model query; otherwise the clicked/current card disappears after navigation and makes the thumbnail rail appear to refresh.
- The compact current-model info card under the model detail author block should not bind its image to the current model preview URL. Keep that small image stable to avoid making the right rail appear to refresh while the actual 3D model loads; the real current model preview belongs in the main viewer and creator model rail.
- Model detail creator rail clicks should behave like a master-detail picker, not route navigation. Keep the rail mounted, update the active model state and browser URL with history state, and avoid document/RSC/image reloads. Comments and model actions should use the active model id.
