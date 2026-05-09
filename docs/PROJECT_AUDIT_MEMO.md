# Project Audit Memo

## Purpose

This memo records the 2026-05-01 full-stack audit for `thornstavern` / `payload-local-demo`.

It is an engineering control document. It does not make schema, endpoint, collection, storage, or UI changes by itself.

## 2026-05-07 Addendum

The 2026-05-07 full-project audit is archived at `docs/archive/2026/FULL_PROJECT_AUDIT_2026-05-07.md`.

Completed during the addendum:

- Rebuilt `/test` as a local-only route inventory page with links and one-line descriptions.
- Fixed `/api/locale` open-redirect behavior by allowing only same-origin relative redirect paths.
- Removed the global frontend layout `<main>` wrapper so pages own their own primary landmark.
- Hardened `/results/[taskCode]` progress and download-format rendering.
- Added soft empty-state behavior for `/pricing` and `/showcase` when read-only local database queries fail.
- Removed confirmed stale `GenerateForm` and `personal-center-legacy` files after reference checks.
- Added `docs/PROJECT_USER_MANUAL.md` as the current Chinese owner/operator usage manual.

Open P1 discussion items from the addendum:

- Direct Payload REST create ownership for owner/user-scoped collections needs a design pass before implementation.
- User-writable identity and visibility fields need direct REST boundary tests and likely server-assignment rules.
- `/model-detail` should stop using fake/static fallback behavior for missing or invalid IDs after product behavior is confirmed.

## Audit Date

- 2026-05-01
- Latest addendum: 2026-05-07

## Audit Mode

Reviewed as:

- Payload CMS architecture audit
- Next.js frontend and route audit
- Supabase Postgres and Supabase Storage audit
- AI generation flow audit
- Stripe billing and credit-ledger audit
- Vercel deployment and environment-variable audit
- performance, testing, and cleanup audit

This audit used the project rules in `AGENTS.md`, `thornstavern-project`, `payload-local-demo-backend`, Vercel React guidance, Stripe guidance, Supabase Postgres guidance, and official public documentation where needed.

Official references checked:

- Payload Local API access control: https://payloadcms.com/docs/local-api/access-control
- Payload hooks and request context: https://payloadcms.com/docs/hooks/overview
- Meshy OpenAPI docs: https://docs.meshy.ai/
- Next.js lazy loading and client boundary docs: https://nextjs.org/docs/app/guides/lazy-loading
- Supabase Storage signed upload/signed URL docs: https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl
- Stripe webhook signature docs: https://docs.stripe.com/webhooks/signature
- Stripe idempotency docs: https://docs.stripe.com/api/idempotent_requests
- Vercel environment variables docs: https://vercel.com/docs/environment-variables

## Validation Snapshot

Commands run during this audit:

```bash
pnpm exec tsc --noEmit
pnpm test:unit
pnpm run build
```

Result:

- TypeScript passed.
- Unit tests passed: 112 tests, 112 passed, 0 failed after the remediation test additions.
- Production build passed.
- Build output still logged SMTP `EAUTH` verification failures from the configured local SMTP credentials, but the build completed successfully. SMTP remains a configuration/noise issue rather than a compile blocker.
- Build route output from the original audit included `/personal-center-legacy` and `/personal-center-test`. The 2026-05-01 remediation pass removed `/personal-center-legacy`; a later account promotion made `/account` the single formal personal center route, and the old `/personal-center-test` route was removed after promotion.

Read-only database probe:

- `public` schema table count: 70.
- Key active tables exist, including `users`, `media`, `models`, `models_formats`, `generation_tasks`, `task_events`, `credits`, `credit_transactions`, `billing_subscriptions`, `user_follows`, `model_comments`, `model_likes`, `model_favorites`, `engagement_views`, `homepage_items`, and `avatar_frame_styles`.
- Current counts: `users=1`, `media=123`, `models=42`, `models_formats=42`, `generation_tasks=0`, `task_events=0`, `credits=1`, `credit_transactions=1`, `billing_subscriptions=1`.
- Media URL breakdown: `123/123` media rows use Supabase public object URLs; `0` remaining Payload local file-route URLs; `0` missing URLs.
- Public model asset check: `42/42` public models have guest-readable preview media and `42/42` format rows point at Supabase public storage URLs.

Worktree note:

- The repository had many pre-existing uncommitted source changes before this audit document update. This memo treats the current worktree as the audited state and does not imply approval of unrelated uncommitted implementation changes.

## Executive Summary

The project is now much healthier than the older 2026-04-28 memo suggested. The social collections are active, TypeScript is green, unit tests are green, Supabase Storage is backing the current imported model set, and Workbench follows the intended anonymous-view/authenticated-action boundary.

The highest-risk original issue was not general public model visibility. The live database has public model data and storage URLs in the expected shape. The 2026-05-01 remediation pass fixed the original download risk: `GET /api/platform/models/:modelId/download` no longer returns mock files and now honors `site-settings.modelAccessPolicy`.

The second highest-risk area was configuration drift. The 2026-05-01 remediation pass cleaned active runtime/admin/env guidance around Supabase Postgres plus Supabase Storage without reintroducing AWS/S3 runtime media behavior.

The third highest-risk area was production route cleanup. `/test` and `/formal-components` correctly return `notFound()` in production, `/account` is the only formal personal center route, and the 2026-05-01 remediation pass removed the legacy personal center route page.

## Frontend Audit

### Current Good State

- Formal routes are active: `/`, `/workbench`, `/model-detail`, `/account`, `/pricing`, `/showcase`, and marketing/legal pages.
- `/account` is the single formal customer account surface. Old `/dashboard/*`, `/personal-center-test`, and `/personal-center-legacy` routes are not current customer delivery routes.
- `/login`, `/register`, and `/forgot-password` are compatibility entry points into the shared auth flow, not separate competing login systems.
- Workbench matches the current product decision:
  - anonymous users may open `/workbench`;
  - generation actions call the shared login modal when `navUser` is absent;
  - the right model library is scoped to the current user's own models;
  - image-generation assets are shown as private Workbench image assets and can be selected as 3D reference images.
- `ModelViewer` uses a shared `DRACOLoader`, a controlled viewer endpoint, blob URLs, and a single active canvas pattern on the formal Workbench/Model Detail flows.
- `/workbench/models/[id]` is no longer a separate detail UI. It is a compatibility redirect to `/model-detail?id=<modelId>`, and account/history detail links now target the canonical route directly.
- `/test` and `/formal-components` are blocked in production through `notFound()`.

### Risks

- `/account` owns the formal personal center UI. `/personal-center-test` and `/personal-center-legacy` have been removed from the app route tree.
- Some older helper components and test assets remain under `src/components/ui-lab/*` and `public/ui-lab/*`. They are acceptable as component assets only if no public route exposes them as production UX.
- Clipboard copy errors should not trigger runtime overlays. Browser clipboard APIs require a user gesture and permission; any copy action should catch `NotAllowedError` and show a non-blocking UI message.
- The progress bar jumping from a low percentage to complete is expected when the browser gets no reliable `Content-Length` or when download is fast but GLB/Draco parsing is slow. The UX should distinguish network download, blob validation, and model parse/prepare phases.

### Frontend Priority Actions

- P1: Keep UI-lab account variants out of production; local-only design review routes must use `notFound()` in production.
- P1: Keep Model Detail and Workbench current-model-first: one visible `ModelViewer`, one selected GLB request, visible-range thumbnails only.
- P2: Replace remaining demo/static account copy with data adapters or remove it from production navigation.
- P2: Add copy-action error handling where `navigator.clipboard.writeText` is used.

## Payload Backend Audit

### Active Registered Collections

Current registered collections include:

- `users`
- `user-follows`
- `avatar-frame-styles`
- `media`
- `generation-tasks`
- `task-events`
- `models`
- `model-comments`
- `model-likes`
- `model-favorites`
- `homepage-items`
- `posts`
- `announcements`
- `model-bundles`
- `credits`
- `credit-transactions`
- `credit-products`
- `engagement-views`
- `billing-subscriptions`
- `addresses`
- `print-orders`
- `shopify-payments`

The older statement that social collections are dormant is no longer true.

### Active Registered Globals

- `site-settings`
- `homepage-content`
- `ai-provider-settings`
- `storage-settings`
- `security-settings`
- `runtime-deployment-settings`

`EmailSettings.ts` exists but is not registered; email settings live under `site-settings.emailSettings`.

### Current Good State

- `src/payload.config.ts` uses Payload Postgres adapter, typed collections/globals, and custom admin components.
- Active user-scoped Local API paths mostly use `overrideAccess: false`.
- Nested Payload writes in the main task/account/media flows generally pass `req`.
- Project-owned APIs use explicit namespaces such as `/api/platform`, `/api/studio`, `/api/billing`, `/api/commerce`, `/api/social`, and `/api/account`.
- The custom upload helper routes avoid shadowing Payload REST roots such as `/api/media`.
- Social collections and endpoints are registered and have tests around rate limiting and public docs exposure.

### Backend Risks

- `src/endpoints/modelDownloads.ts` now returns a controlled error when a selected format has no resolvable asset URL. Production downloads must continue to fail clearly instead of returning fake assets.
- `src/endpoints/modelDownloads.ts` now honors `site-settings.modelAccessPolicy.chargeDownloadCredits`. Keep imported public downloads free by default, and keep charged download flows idempotent/refundable.
- `src/endpoints/modelViewer.ts` intentionally uses an access-checked read first, then an internal asset read. Keep this as a documented exception and do not widen it into a general `overrideAccess: true` pattern.
- `runtime-deployment-settings`, `RuntimeEnvPreview`, `.env.example`, and active docs now point operators toward `DATABASE_URL`, Supabase Postgres, and Supabase Storage.
- `src/lib/creditLedger.ts` contains Chinese source literals. Unless intentionally localized/admin-facing, backend service text should stay English or move to a localization/content layer.

### Backend Priority Actions

- P1: Keep the download endpoint's no-mock and policy-driven charging tests in place.
- P1: Keep active env examples and admin runtime UI aligned with Supabase Postgres plus Supabase Storage.
- P1: Keep social collection docs aligned with active registration and migrations.
- P2: Move durable service error/copy text out of Chinese source literals.

## Database, Supabase, And Storage Audit

### Current Good State

- Runtime database is PostgreSQL only.
- Current live read-only probe confirms the active Supabase/Postgres schema contains expected Payload tables and active social/profile tables.
- Current imported public model set is internally consistent:
  - public models: 42;
  - public model previews with guest-readable media: 42;
  - public model format rows: 42;
  - public model format rows with Supabase public storage URLs: 42.
- Storage runtime direction is Supabase Storage only.
- `media`, `models`, and `models_formats` are aligned for the current imported set.

### Database And Storage Risks

- Active docs/env/admin setup now uses the Supabase/Postgres plus Supabase Storage runtime strategy.
- `src/lib/supabase/billing.ts` and `src/lib/supabase/queries.ts` still use direct SQL for some flows. Direct SQL can be valid for reporting/performance paths, but it must not become the default replacement for Payload access-controlled reads.
- Live table cleanup/orphan-table decisions require a separate migration-grade review. This audit did a read-only table/count probe only.
- `homepage_items` and `avatar_frame_styles` are empty in the probed database. That is acceptable for launch only if the frontend has intentional empty states or static fallback content for those surfaces.

### Database Priority Actions

- P1: Keep Supabase Storage as the only runtime object-storage path; do not restore AWS S3 plugins or signing helpers.
- P1: Clean active env examples so required production vars are clear: `PAYLOAD_SECRET`, `DATABASE_PROVIDER=postgres`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, Supabase URL/service keys, Stripe keys if billing is enabled, Meshy key if generation is enabled.
- P2: Create a read-only database drift report command for future audits, using the probe shape from this memo.
- P2: Seed or curate `homepage-items` and `avatar-frame-styles` through Payload Admin before launch polish.

## AI Generation Flow Audit

### Current Good State

- Workbench submits neutral intent; the backend decides provider behavior.
- Meshy configuration lives under `ai-provider-settings.meshy`.
- API keys are backend-side only. Admin override mode exists for operational key rotation, while environment variables remain the safer default.
- Current Meshy mapping is aligned with the intended flow:
  - no source image: Text to 3D preview/refine;
  - one source image: Image to 3D;
  - two to four source images: Multi-image to 3D when enabled;
  - prompt with image becomes texture/style prompt.
- Meshy defaults use official `latest` model settings where configured.
- Generated Meshy files, thumbnails, and textures are intended to be ingested into Supabase Storage before model delivery.
- Gemini/image generation is separated from 3D generation. Generated images are private Workbench assets, not public model records.
- Unit tests cover Meshy settings, multi-image request body, Meshy pricing, image-generation single-image validation, and Supabase ingestion behavior.

### AI Flow Risks

- `resolveModelFormatAssets` can fall back to allowed remote URLs when Supabase upload fails unless strict ingestion is required. For final production Meshy tasks, strict local ingestion should stay enabled so storage failure becomes a failed/refunded task instead of a model dependent on provider URLs.
- Provider webhooks and sync paths must remain idempotent. The current locking and terminal-status checks are good, but webhook replay tests should stay in the suite.
- Image assets and model assets must stay separated in UI and database semantics. Do not create `models` rows for image-generation results.
- Frontend should not know or branch on provider-specific Meshy keys. Admin can change provider/model/key settings without changing Workbench UI.

### AI Priority Actions

- P1: Keep Meshy strict ingestion for production 3D success finalization.
- P1: Add smoke tests for Text to 3D, Image to 3D, and Multi-image to 3D task creation with provider calls mocked.
- P2: Add an operator UI status indicator showing which provider/key mode is active without exposing secrets.

## Payments, Credits, And Subscriptions Audit

### Current Good State

- Stripe webhook endpoint is registered under `/api/platform/billing/webhooks/stripe`.
- Webhook signature verification and replay handling are covered by tests.
- Subscription grant idempotency uses stable keys such as `subscription-grant:<subscription>:<period>`.
- Credit ledger tests cover grants, holds, settlement, refunds, insufficient balance, and download refunds.
- Admin credit adjustment endpoint exists and should remain admin-only.

### Billing Risks

- Download charging is implemented in the endpoint even though the product decision says imported public previews/downloads are currently free. This is a policy mismatch.
- `site-settings.modelAccessPolicy` exists but is not the source of truth for the current download endpoint.
- There are both Payload-owned billing flows and direct SQL billing helpers under `src/lib/supabase/billing.ts`. Avoid a double-ledger or double-checkout architecture.
- Stripe API version should be confirmed against the current official/account-supported version before final payment launch.

### Billing Priority Actions

- P0: Make download charging policy-driven and disabled by default for current imported public models.
- P1: Keep all credit mutations in the ledger service and retain idempotency keys.
- P1: Decide whether direct Supabase billing helpers are legacy/reporting paths or active payment paths; document one owner.
- P2: Add smoke tests for checkout, webhook, subscription sync, and admin manual adjustment against mocked Stripe.

## Login, Permissions, And Security Audit

### Current Good State

- Shared auth modal flow is now the primary login UX.
- Workbench can be browsed anonymously, but generation requires login.
- Account data routes are expected to be user-scoped.
- Payload Admin is separate from normal user permissions.
- Public model preview is backend-controlled through `/api/platform/models/:modelId/viewer`, not raw public field exposure.
- Mutation endpoints use origin checks and rate limiting in important paths.

### Security Risks

- Do not rely on frontend hiding for protected data. Continue to enforce protection at endpoint/collection access level.
- Public model pages can show public creator context, but avatar/banner media must still pass guest-readable media rules.
- Any endpoint that accepts `user` into Local API must include `overrideAccess: false`.
- Any new hook doing nested writes must pass `req` and use context flags if recursion is possible.

### Security Priority Actions

- P1: Keep `/account` as the single formal personal center route and keep `/personal-center-legacy` out of the app route tree.
- P1: Add a recurring `rg` audit for `user:` Local API calls without nearby `overrideAccess: false`.
- P2: Add smoke tests for anonymous Workbench browse, authenticated generation gate, anonymous public model preview, and `/account` protection.

## Deployment And Environment Audit

### Current Good State

- `.env` is not tracked by Git.
- Vercel build failures seen earlier were correctly caused by missing runtime env (`PAYLOAD_SECRET`, database URL/provider) or bad SMTP credentials, not TypeScript compilation.
- Payload can fall back to JSON transport when SMTP host is absent, so builds should not require SMTP unless SMTP variables are explicitly configured.

### Deployment Risks

- Active env examples now avoid AWS/S3 runtime variables, reducing Vercel variable sprawl risk.
- SMTP should not be a deployment blocker. If SMTP variables are present and invalid, Nodemailer verification can produce noisy build/runtime logs.
- Vercel environment variables must be set in the correct scope: Production, Preview, and Development. A value added only to Preview will not fix master Production deploys.
- Meshy, Stripe, Supabase service role, Payload secret, SMTP, and webhook secrets must never be exposed as `NEXT_PUBLIC_*`.

### Environment Variable Inventory

Required for production core runtime:

- `PAYLOAD_SECRET`
- `DATABASE_PROVIDER=postgres`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `CANONICAL_APP_URL` or an equivalent canonical URL path used by project helpers

Required when Supabase Storage/upload flows are enabled:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- storage bucket/prefix configured in `storage-settings`

Required when Meshy 3D generation is enabled:

- `MESHY_API_KEY` or a deliberate Payload admin key override
- optional `MESHY_API_BASE_URL`

Required when Stripe billing/subscriptions are enabled:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Optional or feature-gated:

- SMTP sender/transport values
- Resend values if Resend becomes the active email provider
- provider request timeout and rate-limit tuning values

Deprecated from active runtime direction:

- AWS S3 plugin/signing variables
- S3 bucket/CDN runtime helpers
- AWS RDS field-composed connection variables, unless kept only as archived migration compatibility notes

## Performance Audit

### Current Good State

- Model viewer flow is current-model-first.
- Public viewer endpoint can redirect public Supabase URLs rather than proxying every GLB.
- Frontend has in-memory/disk cache behavior for viewer blobs and Draco decoder assets.
- Workbench chooses one active model source instead of mounting all models.

### Performance Risks

- Repeated server-function proxying of large GLB files is not a sustainable hot path. Redirect to Supabase Storage should remain the preferred path after access is decided.
- Rails and libraries must avoid loading all thumbnails and GLBs at once.
- Next.js client component boundaries should stay tight around `ModelViewer`, Workbench interactions, and auth modal state.
- Model progress should expose parse/prepare time separately from byte download time to reduce false debugging signals.

### Performance Priority Actions

- P1: Keep `/api/platform/models/:id/viewer` redirect hot path for public Supabase assets.
- P1: Add a no-regression smoke check using `pnpm measure:model-preview -- --ids 1,20,42` after model viewer changes.
- P2: Consider a viewer manifest/signing response before scale: durable cache key, file size, format, delivery mode, URL, and expiry.

## Testing And Quality Audit

### Current Good State

- TypeScript passed.
- Unit tests passed with 112 tests after the remediation test additions.
- Tests cover several critical backend rules: media access, model viewer, remote asset security, Meshy, storage settings, webhooks, ledger, rate limiting, and operator access.

### Test Gaps

- No single smoke test currently proves the full browser path: anonymous public model detail -> viewer endpoint -> Supabase range request -> GLB parsed in browser.
- No single smoke test proves Workbench anonymous browse -> login modal on generate -> authenticated generation request.
- Meshy live provider tests should stay mocked by default; production keys should not be required for CI/build.
- `tests/backendIntegration.test.ts` prevents mock download fallback from shipping.

### Quality Priority Actions

- P0: Covered by the new backend integration test for missing download assets.
- P1: Add mocked Meshy 3D end-to-end task tests for text, image, and multi-image paths.
- P1: Add browser smoke tests for public model preview and Workbench login gate.
- P2: Add an env inventory test or script that prints required/missing variable names without values.

## Priority Backlog

### Completed In 2026-05-01 Remediation Pass

- `modelDownloads` no longer returns mock model-file content when no real asset exists.
- Download charging now reads `site-settings.modelAccessPolicy.chargeDownloadCredits` and remains disabled by default for current imported public model downloads.
- `/personal-center-legacy` was removed from the app route tree. `/account` is the single formal personal center route, and `/personal-center-test` was removed after promotion.
- Active env/admin guidance was cleaned around `DATABASE_URL`, Supabase Postgres, and Supabase Storage.
- `ModelViewer` loading telemetry now separates network download, file validation, parse/prepare, and ready phases without changing the one-current-model viewer path.
- Homepage curated cards now consume managed `homepage-items` display metadata for ribbon/alt copy.
- Model detail's side banner now uses the creator profile banner when the media is guest-readable.

### P0

- No open P0 items remain from this audit after the 2026-05-01 remediation pass.

### P1

- Add browser smoke coverage for anonymous public model preview and Workbench auth gate.
- Keep Meshy strict local ingestion before task success/credit settlement.
- Resolve direct SQL billing ownership so Payload ledger and Supabase helper paths cannot double-count.

### P2

- Improve model progress telemetry: download, validate, parse, prepare.
- Seed `avatar-frame-styles` and curate `homepage-items`.
- Add operator-facing provider/key status without exposing secrets.
- Move remaining Chinese source literals in service/frontend code to localization or Payload-managed content.
- Add viewer manifest/signing layer before high-traffic production scale.

## Current Good Signals

- TypeScript is green.
- Unit test suite is green.
- Public model data and Supabase model storage are aligned in the probed database.
- Workbench anonymous browse plus authenticated generation action matches product direction.
- Payload social/profile/backend UI surfaces are now active and should not be described as dormant.
- Supabase Storage is the active object-storage direction.
