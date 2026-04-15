# Refactor Log

## 2026-04-13

### Goal
- Rebuild the project toward a finished product architecture that cleanly connects marketing site, studio app, Payload admin, database, and APIs.
- Replace hardcoded homepage content with Payload-managed marketing content so future terminals can continue from a stable source of truth.

### Decisions
- Treat the website as four connected surfaces:
  - Marketing Web
  - Studio App
  - Payload Admin
  - Platform API
- Use Payload globals first for site-level marketing content before introducing additional collections.
- Keep the initial refactor incremental:
  - Step 1: persistent docs/logs
  - Step 2: homepage content model
  - Step 3: homepage data wiring
  - Step 4: expand to feature pages / showcase / pricing / resources

### In Progress
- Introduce a richer homepage content schema in Payload.
- Create a server-side marketing data layer for the homepage.
- Replace homepage hardcoded arrays with data from Payload globals plus safe fallbacks.

### Risks Noted
- A lot of frontend pages still contain mojibake/encoding-damaged Chinese copy.
- Current site information architecture is too action-heavy and lacks finished-product content layers.
- Some platform/admin endpoints still need stricter access control before public rollout.

### Continuation Notes
- After homepage content is fully data-driven, next priorities:
  - Add navigation/footer/announcement content to Payload-managed site settings
  - Build finished-product routes: features, solutions, showcase, pricing, resources
  - Rename or reposition the current `/generate` flow as part of a larger `studio` product surface

## 2026-04-15

### Goal
- Fix the highest-risk full-stack issues from the logic and security review before continuing the product-site refactor.

### Changes Made
- Made internal server-owned writes explicit with `overrideAccess: true` in the subscription, Stripe customer, credit ledger, signup credit bootstrap, and payment-record flows.
- Restricted customer-facing order sync so it only refreshes verified payment state and no longer advances fulfillment statuses.
- Moved download credit charging to happen only after the file payload is confirmed ready to return.
- Added a Stripe webhook endpoint at `/api/platform/billing/webhooks/stripe` and routed one-time payments plus subscription lifecycle events through shared server-side finalization helpers.
- Added deterministic ledger `idempotencyKey` support for signup credits, subscription grants, task hold/spend/refund, and model download charges.

### Why
- Payload Local API defaults can silently bypass collection and field access rules if we do not mark intent explicitly.
- Payment confirmation and fulfillment progression are different responsibilities and should not share the same customer endpoint.
- Charging before verifying asset delivery creates false-negative billing outcomes for users.

### Remaining Risks
- Credit ledger concurrency still needs a dedicated idempotency / locking pass for stronger production safety.
- Deployment still needs `STRIPE_WEBHOOK_SECRET` configured, and the webhook endpoint should be registered in Stripe for production use.
- The new `idempotencyKey` field requires Payload type/schema regeneration and a database schema push before older environments are fully aligned.

## 2026-04-15 Database Runtime

### Goal
- Make the backend support AWS RDS PostgreSQL through environment variables while keeping local SQLite available for fallback development.

### Changes Made
- Added `@payloadcms/db-postgres` and `pg`.
- Reworked `src/payload.config.ts` so database selection is runtime-driven:
  - `DATABASE_URL` first
  - otherwise compose a PostgreSQL URL from `AWS_RDS_*`
  - otherwise fall back to SQLite
- Removed the startup-time `python + sqlite` config read path and made storage config env-driven.
- Added `.env.example` entries for direct PostgreSQL and `AWS_RDS_*` modes.
- Added `docs/AWS_RDS_SETUP.md` with the exact env contract and migration notes.

### Notes
- Standard AWS RDS PostgreSQL still needs endpoint, port, database, username, and password.
- AWS access keys are still only for optional S3 storage, not for normal PostgreSQL login.

## 2026-04-15 Runtime Deployment Admin

### Goal
- Add an admin surface for deployment-time runtime settings so operators can manage AWS RDS connection metadata and copy a ready-to-use env block.

### Changes Made
- Added a new admin global `runtime-deployment-settings`.
- Added admin UI helper components for runtime deployment notes and generated env preview output.
- Kept the actual database password out of Payload content and documented that secrets stay in hosting platform env vars.
