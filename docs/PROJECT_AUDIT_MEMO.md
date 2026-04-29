# Project Audit Memo

## Purpose

This memo records the current multi-dimensional audit status for `thornstavern`.

It is a working engineering memo, not a schema migration plan. No backend schema, endpoint, collection, or UI implementation change is implied by this document.

## Audit Date

- 2026-04-28

## Scope

Reviewed dimensions:

- Payload registration and backend surface
- frontend routes and formal UI migration state
- API boundaries and endpoint registration
- access-control and media-delivery guardrails
- document/code drift
- TypeScript and unit-test health
- source-language and hardcoded-content risk
- production-readiness boundaries

Primary sources:

- `src/payload.config.ts`
- `src/app/(frontend)`
- `src/app/(payload)`
- `src/app/api`
- `src/collections`
- `src/globals`
- `src/endpoints`
- `src/lib`
- `docs/AI_PROJECT_MEMORY.md`
- `docs/COLLECTIONS_REFERENCE.md`
- `docs/BACKEND_UI_DEVELOPMENT_MEMO.md`

## Validation Snapshot

### Browser Route Audit

Audit output:

- `project-route-audit.json`

Routes checked:

- `/`
- `/about`
- `/features`
- `/solutions`
- `/showcase`
- `/showcase/17`
- `/pricing`
- `/resources`
- `/developers`
- `/login`
- `/register`
- `/forgot-password`
- `/privacy-policy`
- `/refund-policy`
- `/shipping-policy`
- `/contact`
- `/workbench`
- `/model-detail?id=17`
- `/account`
- `/home-test`
- `/workbench-test`
- `/model-detail-test?id=17`
- `/account-test`
- `/dashboard`
- `/dashboard/tasks`
- `/dashboard/library`
- `/dashboard/credits`
- `/dashboard/orders`
- `/dashboard/settings`
- `/formal-components`
- `/test`

Result:

- all checked routes returned HTTP 200
- dashboard routes correctly redirected unauthenticated users to `/login?redirect=...`
- no browser `pageerror`
- no console errors
- no failed requests
- no 4xx/5xx resource responses
- no visibly broken images

### TypeScript

Command:

```bash
pnpm exec tsc --noEmit
```

Result:

- failed

Primary cause:

- dormant social services still reference collections that are not registered in `src/payload.config.ts`

Affected services:

- `src/lib/commentService.ts`
- `src/lib/engagementService.ts`
- `src/lib/followService.ts`
- `src/lib/reactionService.ts`

Missing or inactive collection slugs referenced by those services:

- `model-comments`
- `engagement-views`
- `user-follows`
- `model-likes`
- `model-favorites`

Impact:

- the project cannot be treated as type-clean until either social collections/endpoints are restored as a coordinated rollout or the dormant social service files are removed/excluded
- frontend work must not integrate comments, likes, favorites, follows, or engagement endpoints as active features yet

### Unit Tests

Command:

```bash
pnpm test:unit
```

Result:

- 107 tests discovered
- 82 passed
- 25 failed

Failure groups:

- missing admin service modules referenced by tests:
  - `src/lib/adminAudit.ts`
  - `src/lib/adminConfig.ts`
  - `src/lib/adminContent.ts`
  - `src/lib/adminCredits.ts`
  - `src/lib/adminExceptions.ts`
  - `src/lib/adminOrders.ts`
  - `src/lib/adminPayments.ts`
  - `src/lib/adminSearch.ts`
  - `src/lib/adminSubscriptions.ts`
  - `src/lib/adminTasks.ts`
  - `src/lib/adminUsers.ts`
- outdated admin i18n test expectation for `adminLabelsKey`
- outdated locked-document migration compatibility test expecting old `audit_logs_id` repair SQL
- `AIProviderSettings` tests still expect a tab layout that the current global no longer exposes
- `auditLog` tests expect persisted logger entries that current implementation no longer emits in the same way
- `creditLedger` tests use a mock DB shape that no longer satisfies the Postgres transaction client expectations
- `getCanonicalAppURL` tests expect `http://127.0.0.1:3000`, while current code returns `http://localhost:3000`

Impact:

- current unit-test suite is not a reliable green gate
- before major backend changes, either restore the missing admin service modules or retire/update the stale tests

## Architecture Findings

### A-01: Formal UI Routes Are Mounted But Test Routes Remain

Current formal routes:

- `/` re-exports `home-test`
- `/workbench` re-exports `workbench-test`
- `/model-detail` re-exports `model-detail-test`
- `/account` re-exports `account-test`

Current retained validation routes:

- `/home-test`
- `/workbench-test`
- `/model-detail-test`
- `/account-test`

Assessment:

- migration is functionally successful
- keeping test routes is useful for rollback and comparison during UI closeout
- before launch, decide whether these test routes should remain accessible, move behind a dev flag, or be removed

### A-02: Utility Pages Are Publicly Reachable

Current utility routes:

- `/formal-components`
- `/test`
- `/test-auth-preview`

Assessment:

- useful for development
- should not be publicly exposed in production unless intentionally protected or hidden

Recommended follow-up:

- add a production policy for component/test route availability

## Payload Backend Findings

### B-01: Actual Registered Surface Is Clear

Active collections from `src/payload.config.ts`:

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

Active globals:

- `site-settings`
- `homepage-content`
- `ai-provider-settings`
- `storage-settings`
- `security-settings`
- `runtime-deployment-settings`

Registered custom endpoints include:

- `GET /api/platform/ops/dashboard`
- `POST /api/account/auth/register`
- `POST /api/account/auth/login`
- `POST /api/account/auth/logout`
- `GET /api/account/auth/me`
- `POST /api/account/auth/forgot-password`
- `POST /api/account/auth/reset-password`
- `POST /api/account/auth/verify-email`
- `POST /api/account/auth/resend-verification`
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

### B-02: Dormant Endpoint Modules Still Exist

Present but not registered:

- `src/endpoints/account.ts`
- `src/endpoints/adminRepair.ts`
- `src/endpoints/engagement.ts`
- `src/endpoints/imageGeneration.ts`
- `src/endpoints/modelComments.ts`
- `src/endpoints/modelDetails.ts`
- `src/endpoints/modelReactions.ts`

Assessment:

- these modules should be treated as inactive
- frontend code must not call their paths until registration and collection support are restored

Recommended follow-up:

- decide per module: register, rewrite, archive, or delete

### B-03: `modelViewerEndpoint` Documentation Drift

Actual code:

- `src/payload.config.ts` imports and registers `modelViewerEndpoint`
- active path: `GET /api/platform/models/:modelId/viewer`

Drifted docs:

- `docs/COLLECTIONS_REFERENCE.md` still says `src/endpoints/modelViewer.ts` exists but is not registered
- `docs/COLLECTIONS_REFERENCE.md` still lists `modelViewer.ts` under endpoint modules present but not registered
- `docs/AI_PRODUCT_FRAMEWORK_GUIDE.md` also says endpoint modules for account, social, model viewer, image generation, engagement, and admin repair are not currently registered

Impact:

- future developers may incorrectly avoid the correct viewer endpoint or reintroduce raw model URL exposure

Recommended follow-up:

- update active docs to match `src/payload.config.ts`

## API Boundary Findings

### C-01: Mock Download Endpoint Is Still Used By Formal/Legacy UI

Endpoint:

- `GET /api/platform/mock/models/:modelId/download`

Current frontend references:

- `src/app/(frontend)/model-detail-test/ModelDetailNative.tsx`
- `src/app/(frontend)/dashboard/library/page.tsx`
- `src/app/(frontend)/results/[taskCode]/page.tsx`
- `src/app/(frontend)/workbench/_components/WorkbenchPanels.tsx`
- `src/app/(frontend)/workbench/models/[id]/page.tsx`
- `src/app/(frontend)/workbench/models/[id]/SketchExactPreview.tsx`

Assessment:

- the endpoint may contain real billing/download behavior, but the namespace and filename still signal mock behavior
- this creates product and security ambiguity before launch

Recommended follow-up:

- rename or replace the endpoint with a formal download namespace
- keep credit charging, auth, access control, refund behavior, and file delivery tests in the same rollout

### C-02: Custom Next API Routes Do Not Currently Shadow Payload REST Roots

Current project-owned Next API routes:

- `src/app/api/locale/route.ts`
- `src/app/api/media/upload-url/route.ts`

Assessment:

- no `src/app/api/media/route.ts` route was found
- this preserves Payload REST `/api/media`

## Security And Access Findings

### D-01: User-Scoped Active Flows Mostly Follow `overrideAccess: false`

Observed active paths with user-scoped reads:

- session helpers
- showcase reads
- workbench data reads
- AI task endpoints
- print-order endpoints
- model viewer access check

Assessment:

- active flows appear aligned with the project rule that Local API calls with a user must set `overrideAccess: false`

Risk note:

- dormant social/comment/reaction services use many `overrideAccess: true` calls and reference inactive collections; do not expose them without a fresh access-control review

### D-02: Public Media Rule Remains A Critical Launch Gate

Current rule:

- guests can read `media` only when `purpose = preview` or `publicAccess = true`

Launch risk:

- public model pages may show a model while thumbnails/viewer assets fail if linked media is still private

Recommended follow-up:

- run a data-level audit before launch: public models must have guest-readable preview images and controlled viewer assets

## Frontend Findings

### E-01: Formal UI Migration Is Functionally Passing

Browser audit shows:

- formal pages render
- test pages render
- `pricing` renders
- dashboard unauthenticated redirects work

Assessment:

- formal route replacement is ready for visual/product review

Remaining decision:

- when to remove or protect `*-test`, `/formal-components`, and `/test`

### E-02: Dashboard Contains Direct Chinese Source Literals

Examples:

- `src/app/(frontend)/dashboard/credits/page.tsx`
- `src/app/(frontend)/dashboard/orders/page.tsx`
- `src/app/(frontend)/dashboard/orders/[id]/page.tsx`
- `src/app/(frontend)/dashboard/settings/page.tsx`

Assessment:

- this violates the project source-language guardrail for frontend source literals unless these pages are intentionally localized source files
- it also increases mojibake risk on Windows tooling

Recommended follow-up:

- move durable dashboard copy into `src/app/(frontend)/_lib/ui-text.ts`, Payload-managed content, or a localization layer

### E-03: Formal Migrated Pages Still Depend On Static UI Assets And Fallbacks

Current state:

- migrated pages use `/ui-lab` and `/home-test-assets` static assets
- model detail sidebar banner is static
- homepage featured strip and shelf have Payload-backed data paths but still retain static fallback behavior

Assessment:

- acceptable during UI closeout
- should not be mistaken for complete backend-owned content

Recommended follow-up:

- use `homepage-items` for home repeated content
- add backend promotion slots for model detail banners
- keep fallback assets only for empty-state safety, not as final content strategy

## Documentation Findings

### F-01: `AGENTS.md` Contains Mojibake

Observed issue:

- tree diagrams and symbols in `AGENTS.md` render as mojibake such as `鈹溾攢`
- checkmark/cross symbols also render incorrectly

Impact:

- coding-agent rule text is still understandable, but corrupted characters reduce trust and can spread if copied into other docs

Recommended follow-up:

- rewrite `AGENTS.md` as clean UTF-8 ASCII/Markdown

### F-02: Active Docs Have Registration Drift

Observed drift:

- `COLLECTIONS_REFERENCE.md` and `AI_PRODUCT_FRAMEWORK_GUIDE.md` are stale about `modelViewerEndpoint`
- `COLLECTIONS_REFERENCE.md` says `accountAuth.ts` is present but not registered, while auth endpoints are registered in `src/payload.config.ts`

Impact:

- future frontend/backend work may target the wrong API boundary

Recommended follow-up:

- refresh active docs from `src/payload.config.ts`
- keep generated or dormant modules clearly separated from active registered modules

## Test And Build Findings

### G-01: TypeScript Is Not Green

Cause:

- inactive social collections referenced by services

Recommended options:

- restore social collections, migrations, generated types, services, and endpoint registration together
- or archive/remove inactive social service files until the feature is intentionally rebuilt

### G-02: Unit Test Suite Is Not Green

Cause groups:

- tests refer to removed/missing admin service files
- tests still encode old migration and config shapes
- ledger tests are not aligned with Postgres transaction client requirements

Recommended options:

- split tests into active and archived suites
- restore missing admin modules only if those product admin APIs are still desired
- update tests to current Postgres-only assumptions

## Production Readiness Findings

### H-01: Model And Image Delivery Needs Production Cache Policy

Current state:

- browser route audit passes
- `ModelViewer` uses controlled viewer endpoint and browser object URLs
- service worker/browser cache exists for repeat local loads

Remaining production concern:

- large GLB files should not rely on repeated server-function proxying at scale

Recommended follow-up:

- add a viewer manifest/signing layer
- use CDN/object-storage delivery for approved public hot assets
- keep controlled proxy fallback for private assets
- preserve `Vary: Cookie, Authorization` for user-specific model responses

### H-02: Pricing Backend Is Partially Backend-Managed

Current state:

- plan names, prices, credits, descriptions, and features come from `site-settings.subscriptionPlans`
- checkout/portal/sync endpoints are registered

Remaining gaps:

- plan active state, sort order, featured badge, comparison labels, FAQ, and page-level marketing copy are not fully backend-managed

Recommended follow-up:

- keep current plan keys stable for launch
- add pricing content settings only after final UI is confirmed

## Priority Backlog

### P0 Before New Backend Feature Work

- Decide social domain direction: restore as active collections/endpoints or archive dormant services.
- Make `pnpm exec tsc --noEmit` green.
- Fix or retire stale unit tests so `pnpm test:unit` becomes a useful gate.

### P1 Before Public Launch

- Protect or remove `/test`, `/test-auth-preview`, `/formal-components`, and `*-test` routes.
- Rename or replace `/api/platform/mock/models/:modelId/download`.
- Audit public models and media for guest-readable preview/viewer assets.
- Update active docs to match registered Payload config.
- Clean `AGENTS.md` encoding.

### P2 Product Hardening

- Move dashboard Chinese source literals into localization or Payload-managed content.
- Add backend-managed model-detail promotion slot.
- Add pricing page content and plan state controls if marketing needs runtime edits.
- Add production model/image delivery manifest and CDN strategy.

## Current Good Signals

- Formal migrated routes render successfully.
- Public marketing/legal/auth routes render successfully.
- Dashboard auth redirect behavior is working.
- `modelViewerEndpoint` is registered and browser-tested through formal pages.
- Custom Next API routes do not shadow Payload collection REST roots.
- Core product API namespaces are mostly aligned with `/api/platform`, `/api/studio`, `/api/commerce`, and `/api/billing`.
