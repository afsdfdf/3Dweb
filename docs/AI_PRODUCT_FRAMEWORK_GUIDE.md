# Product Framework Guide

## Purpose

This guide explains the product shape of `thornstavern` for future AI and engineering work. It is intentionally stable and should not contain dated worklogs or temporary rollout notes.

## Product Positioning

The project is not a CMS-only website. Payload is the backend spine for a complete AI 3D product:

- Marketing website
- Studio / Workbench generation flow
- User dashboard
- Model library and delivery
- Credits and subscriptions
- Print orders and payments
- Payload Admin operations
- Project-owned platform APIs

Core product path:

1. User signs in.
2. User submits an AI generation task.
3. The system creates and tracks `generation-tasks` and `task-events`.
4. Successful tasks create or link `models`.
5. Models can be previewed, downloaded, and used for print-order workflows.
6. Credits, subscriptions, orders, and payment records keep the commercial state consistent.
7. Operators manage content and business data in Payload Admin.

## Technical Stack

- Next.js 16
- React 19
- Payload CMS 3
- PostgreSQL runtime
- Stripe for active billing and checkout flows
- S3-compatible storage support through Payload storage and project helpers

Important entry points:

- `src/payload.config.ts`
- `src/app/(frontend)/`
- `src/app/(payload)/`
- `src/app/api/`
- `src/collections/`
- `src/globals/`
- `src/endpoints/`
- `src/lib/`

## Product Areas

### Marketing Web

Primary routes:

- `/`
- `/features`
- `/solutions`
- `/showcase`
- `/pricing`
- `/resources`
- `/developers`

Primary content sources:

- `site-settings`
- `homepage-content`
- `homepage-items`
- public `models`
- guest-readable `media`

### Studio / Workbench

Primary routes:

- `/generate`
- `/workbench`
- `/workbench/history`
- `/workbench/models/[id]`
- `/results/[taskCode]`

Primary backend sources:

- `generation-tasks`
- `task-events`
- `models`
- `media`
- `/api/studio/ai/tasks`
- `/api/studio/ai/tasks/:taskId/sync`

### Dashboard

Primary routes:

- `/dashboard`
- `/dashboard/tasks`
- `/dashboard/library`
- `/dashboard/credits`
- `/dashboard/orders`
- `/dashboard/orders/[id]`
- `/dashboard/settings`

Primary backend sources:

- user-scoped Local API reads
- `credits`
- `credit-transactions`
- `billing-subscriptions`
- `print-orders`
- `models`

### Admin

Primary route:

- `/admin`

Admin manages:

- users and roles
- media
- AI production
- models
- homepage and marketing content
- credits and subscription state
- print orders and payment records
- provider, storage, security, and runtime settings

## API Boundaries

Use project-owned APIs for product operations:

- `/api/studio/...`
- `/api/commerce/...`
- `/api/billing/...`
- `/api/platform/...`
- `/api/social/...` only after social endpoints and collections are confirmed active

Payload REST collection routes remain under:

- `/api/<collection-slug>`

Do not create custom Next routes that collide with collection REST paths.

## Current Registered Product APIs

Currently registered in `src/payload.config.ts`:

- `/api/studio/ai/tasks`
- `/api/studio/ai/tasks/:taskId/sync`
- `/api/platform/ai/webhooks/provider`
- `/api/platform/mock/models/:modelId/download`
- `/api/commerce/print-orders`
- `/api/commerce/print-orders/:orderId/sync`
- `/api/billing/subscriptions/checkout`
- `/api/billing/subscriptions/sync`
- `/api/billing/subscriptions/portal`
- `/api/platform/session/logout`
- `/api/platform/billing/webhooks/stripe`
- `/api/platform/ops/dashboard`

Endpoint modules for account, social, model viewer, image generation, engagement, and admin repair exist but are not currently registered in the main Payload config.

## Security Rules

### Local API

When a Local API call passes `user`, it must use:

```ts
overrideAccess: false
```

### Hooks

Nested Payload operations inside hooks must pass `req`.

### Media

Guest-readable media requires:

- `purpose = preview`, or
- `publicAccess = true`

Public model visibility does not automatically make linked media public.

### Model Delivery

- Preview/viewer delivery should go through a project-owned viewer endpoint when enabled.
- Download delivery goes through the download endpoint and may require auth and credits.
- Do not expose private raw asset URLs directly to browsers.

## Development Workflow

After Payload schema changes:

1. Update collection/global config.
2. Run `pnpm payload generate:db-schema`.
3. Add or update a formal migration.
4. Run `pnpm generate:types`.
5. Run `pnpm exec tsc --noEmit`.
6. Update docs and `AI_PROJECT_MEMORY.md` if architecture changed.

After admin component path changes:

1. Run `pnpm generate:importmap`.
2. Run `pnpm exec tsc --noEmit`.

## Current Risks To Preserve In Planning

- Some frontend routes call endpoint modules that are not registered.
- Social service code references collections that are not active in the current Payload config.
- Homepage still contains hardcoded localhost media fallback URLs.
- Some source files contain mojibake from Chinese literals; new frontend copy should come from localization or Payload content.
- PostgreSQL schema changes need formal migrations, not ad-hoc database edits.
