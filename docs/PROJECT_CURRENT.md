# Thorns Tavern Current Project Guide

Updated: 2026-05-28

This is the current human-readable source of truth for `D:\web\payload-local-demo`. Older root docs, dated reports, rollout plans, and local test-route notes were removed or superseded by this file. For compact machine-readable guardrails, use `docs/AI_PROJECT_MEMORY.md`.

## Product Scope

Thorns Tavern is a Next.js 16 + Payload CMS 3 application backed by PostgreSQL and Supabase Storage.

Active product surfaces:

- Marketing website and formal information pages
- Public model showcase and model bundle pages
- Public/private model detail preview through controlled viewer endpoints
- Studio Workbench for AI image generation, 3D generation, task polling, and model review
- Account Center for profile, tasks, models, orders, billing, subscriptions, and notifications
- Payload Admin for operators and admins
- Platform, studio, commerce, billing, account, social, and notification APIs

## Runtime Rules

- PostgreSQL is the only runtime database. Prefer `DATABASE_URL`; do not restore SQLite, libsql, or `payload.db` runtime fallbacks.
- Supabase Storage is the only runtime object-storage direction. Do not restore AWS S3 runtime media helpers, signing code, or plugins.
- `PAYLOAD_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` or `CANONICAL_APP_URL`, Supabase service settings, Stripe keys, and provider keys are deployment configuration, not frontend source.
- `.env` and local env backups are not versioned. Active examples are `.env.example`, `.env.vercel.preview.example`, and `.env.vercel.production.example`.

## Payload Rules

- Use Payload types and TypeScript-first code.
- When passing `user` to Payload Local API, also set `overrideAccess: false`.
- Nested Payload operations inside hooks must pass `req`.
- Hooks that can re-enter the same collection need context flags.
- Field-level access returns booleans only; collection access may return booleans or query constraints.
- After collection/global schema changes, run `corepack pnpm generate:types` and `corepack pnpm payload generate:db-schema`, then add a formal migration.
- After admin component path changes, run `corepack pnpm generate:importmap`.

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

## Current Routes

Formal public/customer routes:

- `/`
- `/about`
- `/blog`
- `/blog/[slug]`
- `/bundles`
- `/bundles/[slug]`
- `/contact`
- `/developers`
- `/features`
- `/forgot-password`
- `/generate` redirects to `/workbench`
- `/login`
- `/model-detail?id=<modelId>`
- `/pricing`
- `/privacy-policy`
- `/refund-policy`
- `/register`
- `/reset-password`
- `/resources`
- `/results/[taskCode]`
- `/shipping-policy`
- `/showcase`
- `/showcase/[id]` redirects to `/model-detail?id=<id>`
- `/solutions`
- `/verify-email/[token]`
- `/workbench`
- `/workbench/history`
- `/workbench/models/[id]` redirects to `/model-detail?id=<id>`
- `/account`

Payload and API shells:

- `/admin`
- `/api/[...slug]`
- `/api/access`
- `/api/graphql`
- `/api/graphql-playground`
- `/api/locale`
- `/api/account/profile-media/upload-url`
- `/api/account/profile-media/complete`
- `/api/media/upload-url`

Removed local-only test routes:

- `/test`
- `/test-bundles`
- `/formal-components`

Do not recreate those routes unless a new formal design-review workflow is explicitly requested. Static UI assets under `public/ui-lab/formal-components/` remain in use by production UI components and should not be deleted without a reference check.

## Important API Namespaces

Use project-owned custom namespaces:

- `/api/platform/...`
- `/api/studio/...`
- `/api/commerce/...`
- `/api/billing/...`
- `/api/account/...`
- `/api/social/...`

Do not add Next route handlers that shadow Payload REST roots such as `/api/media`, `/api/models`, or `/api/users`.

## Security Boundaries

- Public model preview means anonymous model read access, not admin access.
- Guest-readable media requires `purpose = preview` or `publicAccess = true`.
- Public `models.visibility = public` does not make linked private media public.
- Workbench user libraries stay scoped to the current user. Other users' public models may be used as references, not editable personal assets.
- Direct Payload REST writes are blocked for service-owned social/engagement/task-event surfaces: `model-likes`, `model-favorites`, `model-comments`, `user-follows`, `engagement-views`, and `task-events`.
- Mutation endpoints must keep origin checks and rate limits.
- Auth redirects must use safe internal redirect helpers and reject absolute or protocol-relative paths.

## Model And Media Delivery

- `/api/platform/models/:modelId/viewer?format=glb` is the controlled browser viewer entry.
- After access is decided, the viewer endpoint should redirect to Supabase Storage when possible and use proxy delivery only as a fallback.
- Optimized GLB previews are served transparently by the viewer endpoint when `models.viewerOptimization.status = succeeded`; use `quality=original` to force the original GLB.
- Preview compression is queued in `model-optimization-jobs` and executed by the separate `glb-compress` worker using signed source/upload URLs. Generation success schedules an immediate non-blocking dispatch attempt, while Vercel Cron calls `/api/platform/model-optimization/cron-dispatch` every minute as a recovery path. Historical models can be queued through `POST /api/platform/model-optimization/backfill`; it requires `Authorization: Bearer ${CRON_SECRET}`, defaults to dry-run, caps each request to 100 candidates, and should be run in small batches before any full backfill. The shared worker secret belongs in `x-model-optimization-secret` headers only.
- Downloads must keep using original model format files through `/api/platform/models/:modelId/download`.
- `ModelViewer` must keep Draco decoder support through `public/three-draco/gltf/`.
- Public downloads use `/api/platform/models/:modelId/download`.
- Imported public preview/download assets are free unless `site-settings.modelAccessPolicy.chargeDownloadCredits` explicitly enables charging.
- Generated image results are private Workbench source assets, not public model records.

## Content Ownership

- `homepage-content`: homepage singleton copy and section-level settings.
- `homepage-items`: repeated homepage cards, curated promos, rails, and placements.
- `formal-pages`: editable copy for formal information, marketing pages, and blog page-level UI labels/CTAs.
- `posts`: public blog and Tavern Journal content.
- `model-bundles`: public curated bundle merchandising and bundle detail content.
- `site-settings.headerNav`: backend-managed public navigation labels/order.
- `site-settings.footer.linkGroups`: shared footer groups.

Avoid adding new hardcoded page copy when the page is already backed by Payload-managed content.

## Billing And Credits

- Credit balance source of truth is `credits.balance`.
- `users.creditsBalance` is only a denormalized display/admin mirror.
- Credit mutations belong in the Payload credit ledger service.
- Stripe checkout/webhook flows must remain idempotent.
- `shopify-payments` is the neutral payment record table despite the historical name.

## AI Generation

- Workbench submits neutral generation intent to backend endpoints.
- Provider selection, Meshy settings, pricing, and API key mode live under `ai-provider-settings`.
- Meshy model files, thumbnails, and textures must be ingested into Supabase Storage before marking model tasks successful and settling reserved credits.
- Provider keys stay server-side only.
- Mock/local results require explicit non-production switches and must not masquerade as production model assets.

## Code Quality And Validation

Use `corepack pnpm` in this Windows shell because bare `pnpm` may not be on PATH.

## Blog CMS Rules

- Blog page-level labels, CTAs, hero copy, listing labels, article-detail labels, and SEO copy live in `formal-pages.blogPage`.
- Blog CTA/link rendering must use `src/app/(frontend)/blog/_lib/blogSafety.ts`; do not pass raw CMS hrefs directly into public `<Link>` or `<a>` elements.
- Blog public images must use guest-readable media only. Private Supabase object URLs and non-preview/non-public media should fall back instead of rendering.
- Blog shell pages should use `getMarketingSiteSettings()` when they only need navigation/footer settings.

Baseline validation:

```bash
corepack pnpm exec tsc --noEmit
corepack pnpm run lint
corepack pnpm run audit:source-language
corepack pnpm test:unit
corepack pnpm run build
corepack pnpm test:smoke
git diff --check
```

Current model-preview smoke behavior:

- `test:smoke` checks the model viewer endpoint and a byte-range probe separately from the browser render. The browser check fails on visible client errors, but it does not fail only because a remote Supabase GLB is still downloading in headless Edge.
- `ModelViewer` uses a stall timeout for GLB fetches: slow downloads may continue while bytes are arriving, but a request with no progress still aborts and falls back to proxy delivery.

## Cleanup Policy

Safe local garbage to remove when not actively debugging:

- `.next/`
- `.claude/`
- `.vercel/`
- `media/`
- `tmp/`
- `public/media/` when untracked/generated
- `.codex*.log`
- `*.tsbuildinfo`
- `.env.backup.*`
- local-only env files such as `.env*.local`

Do not remove:

- `node_modules/` unless reinstall time is acceptable
- `.env` unless the user explicitly asks
- tracked `public/ui-lab/**` assets without reference checks
- tracked Payload schema, migration, generated type, or import-map files unless they are regenerated intentionally

## Current Repository State After Cleanup

Removed as obsolete local test routes:

- `src/app/(frontend)/test/page.tsx`
- `src/app/(frontend)/test-bundles/page.tsx`
- `src/app/(frontend)/test-bundles/test-bundles.module.css`
- `src/app/(frontend)/formal-components/page.tsx`
- `src/components/ui-lab/formal-components-registry.tsx`
- `src/components/ui-lab/formal-components-registry.module.css`

Removed as local garbage:

- `.next/`
- `.claude/`
- `.vercel/`
- `media/`
- `tmp/`
- `public/media/`
- local Codex logs
- local env backups and local Vercel/env scratch files
- `tsconfig.tsbuildinfo`

Keep future documentation in this file plus `AI_PROJECT_MEMORY.md`. If durable architecture changes, update both.
