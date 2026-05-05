# Architecture Blueprint

## Purpose

This document describes the current product architecture at a high level. For exact code-level status, use `AI_PROJECT_MEMORY.md` and `src/payload.config.ts`.

## Product Surfaces

### Marketing Web

Purpose:

- Public product website.
- Homepage, features, solutions, showcase, pricing, resources, and developer-oriented entry points.

Primary routes:

- `/`
- `/features`
- `/solutions`
- `/showcase`
- `/showcase/[id]`
- `/pricing`
- `/resources`
- `/developers`

Primary data sources:

- `homepage-content`
- `homepage-items`
- `site-settings`
- public `models`
- guest-readable `media`

### Studio / Workbench

Purpose:

- AI generation workflow.
- Model review and delivery entry point.

Primary routes:

- `/generate` redirects to `/workbench`
- `/workbench`
- `/workbench/history`
- `/workbench/models/[id]`
- `/results/[taskCode]`

Primary data sources:

- `generation-tasks`
- `task-events`
- `models`
- `media`
- credits and download endpoints

### Account Center

Purpose:

- Authenticated user operations.
- Profile, password, avatar/banner, tasks, library, credits, subscriptions, orders, and settings.

Primary routes:

- `/account`

Primary data sources:

- user-scoped Local API reads with `overrideAccess: false`
- registered account endpoints under `/api/account/...`
- project-owned product APIs for mutations and sync operations

### Payload Admin

Purpose:

- Content operations.
- Business operations.
- Platform settings.
- Operator dashboard.

Primary route:

- `/admin`

Admin areas:

- users and media
- AI production
- marketing content
- models and bundles
- credits, subscriptions, orders, and payments
- provider, storage, security, and runtime settings

### Platform API

Purpose:

- Stable product API boundary for frontend and external integrations.
- Keep custom APIs out of Payload REST collection namespaces.

Preferred namespaces:

- `/api/studio/...`
- `/api/commerce/...`
- `/api/billing/...`
- `/api/platform/...`
- `/api/social/...` only after social endpoints and collections are confirmed active

Do not create custom routes under `/api/<collection-slug>` because those paths belong to Payload REST.

## Data Domains

### Identity And Access

- `users`
- roles: `admin`, `operator`, `customer`
- admin UI access: `admin` and `operator`

### Media And Assets

- `media`
- `models`
- model format files
- preview images

Public media depends on `purpose` and `publicAccess`, not only on linked model visibility.

### AI Production

- `generation-tasks`
- `task-events`
- provider settings in `ai-provider-settings`
- AI workflow services in `src/lib/aiTaskFlow.ts`

### Marketing Content

- `site-settings`
- `homepage-content`
- `homepage-items`
- `posts`
- `announcements`
- `model-bundles`

### Commerce

- `credits`
- `credit-transactions`
- `credit-products`
- `billing-subscriptions`
- `addresses`
- `print-orders`
- `shopify-payments`

### Platform Settings

- `ai-provider-settings`
- `storage-settings`
- `security-settings`
- `runtime-deployment-settings`

## Current Integration Notes

- The homepage content model is split between `homepage-content` for section copy and `homepage-items` for repeated curated placements.
- `/account` is the single formal customer account surface. Do not document or route new customer workflows through old `/dashboard/*` paths.
- The frontend still contains some fallback/hardcoded content. New frontend integration should replace those with Payload-managed data where possible.
- Account, social, engagement, model detail, model viewer, image generation, and admin repair endpoint modules are registered in `src/payload.config.ts`; treat them as active API surface.
- Runtime database is PostgreSQL only.

## Frontend Integration Order

1. Confirm active Payload collections, globals, and registered endpoints.
2. Stabilize marketing data adapters around `homepage-content`, `homepage-items`, and public `models`.
3. Replace hardcoded homepage media fallbacks with Payload-managed preview media.
4. Align auth frontend with one active auth boundary.
5. Integrate workbench and result pages with registered studio endpoints.
6. Integrate commerce and billing flows through project-owned APIs.
7. Enable social/detail features only after their collections and endpoints are registered.

## Non-Negotiable Boundaries

- Do not bypass access control by passing `user` without `overrideAccess: false`.
- Do not expose raw private model files or third-party GLB URLs to browsers.
- Do not shadow Payload REST routes with custom Next route handlers.
- Do not reintroduce SQLite runtime assumptions.
- Do not add new Chinese source literals in frontend/backend code.
