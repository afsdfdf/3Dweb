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
