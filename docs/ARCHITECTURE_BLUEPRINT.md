# Product Architecture Blueprint

## Surfaces

### 1. Marketing Web
- Purpose: public-facing finished website
- Routes:
  - `/`
  - `/features`
  - `/solutions`
  - `/showcase`
  - `/pricing`
  - `/resources`
  - `/api`

### 2. Studio App
- Purpose: logged-in creation and delivery workflows
- Routes:
  - `/generate` for now, later migrate to `/studio`
  - `/results/[taskCode]`
  - `/dashboard/*`

### 3. Payload Admin
- Purpose: content operations + business operations
- Areas:
  - marketing content
  - users
  - tasks
  - models
  - orders
  - payments
  - provider configuration

### 4. Platform API
- Purpose: serve public content, product actions, commerce, and provider callbacks
- API domains:
  - `/api/public/*`
  - `/api/studio/*`
  - `/api/commerce/*`
  - `/api/platform/*`

## Data Domains

### Marketing Content
- `site-settings`
- `homepage-content`
- future:
  - `feature-pages`
  - `solution-pages`
  - `showcase-items`
  - `resources`
  - `testimonials`
  - `pricing-plans`

### Product
- `users`
- `generation-tasks`
- `task-events`
- `models`

### Commerce
- `credits`
- `credit-transactions`
- `credit-products`
- `print-orders`
- `shopify-payments`
- `addresses`

### Platform
- `ai-provider-settings`
- future:
  - `api-keys`
  - `provider-webhook-logs`
  - `audit-logs`
  - `usage-metrics`

## Homepage Refactor Direction

### Problem
- Homepage currently behaves like an operation funnel instead of a finished website.
- Too much emphasis on “start using” and internal workflow language.
- Hardcoded content makes it hard to operate from Payload admin.

### Target
- Homepage should feel like a complete product surface:
  - hero
  - use cases
  - featured works
  - capability sections
  - process
  - pricing / entry
  - FAQ

### Content Ownership
- Structure lives in React components.
- Content lives in Payload globals and later supporting collections.
- Business stats and dynamic featured content can be injected separately after the content layer is stable.

## Implementation Sequence

### Phase 1
- Add persistent documentation and refactor log
- Expand homepage content schema
- Build a server-side marketing data adapter
- Render homepage from Payload content with fallbacks

### Phase 2
- Move site navigation/footer/announcement content to `site-settings`
- Create dedicated routes for features / solutions / pricing / showcase

### Phase 3
- Refactor public APIs into explicit namespaces
- Add content collections for showcase/resources/testimonials

### Phase 4
- Reposition `/generate` into a broader studio surface
- Tighten access control and production-readiness gaps
