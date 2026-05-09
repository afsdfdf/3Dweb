# UI Migration Plan

## Purpose

This document tracks the migration from `D:\组件测试\component-lab` into `thornstavern`.

`component-lab` is a UI debugging and design-restoration project. It is not an application source of truth. Migrate only stable UI components, reusable sliced assets, and page patterns that can be connected to the real Payload-backed frontend.

## Source And Target

Source:

- `D:\组件测试\component-lab`

Target:

- Components: `src/components/ui-lab/`
- Static UI assets: `public/ui-lab/`
- Formal frontend pages: `src/app/(frontend)/`

## Migration Rules

- Do not copy the whole lab project.
- Do not copy browser profiles, screenshots, measurement dumps, `.next`, logs, or generated experiment folders.
- Do not overwrite existing frontend files with user changes.
- Keep migrated UI isolated under `ui-lab` until each component is connected to real data and page flows.
- Do not introduce new API assumptions from the lab project.
- Do not add Chinese source comments or durable Chinese UI literals directly in code.
- Do not touch Payload collections, globals, migrations, admin import map, or generated types for UI-only migration.

## Current Main Project State

Relevant existing frontend surfaces:

- Homepage: `src/app/(frontend)/page.tsx`
- Auth pages: `login`, `register`, `forgot-password`, `reset-password`, `verify-email/[token]`
- Workbench: `src/app/(frontend)/workbench/`
- Results: `src/app/(frontend)/results/[taskCode]/page.tsx`
- Account center: `src/app/(frontend)/account/page.tsx`
- Showcase: `src/app/(frontend)/showcase/`
- Pricing: `src/app/(frontend)/pricing/page.tsx`

Existing dirty files were present before this migration, including `SiteShell`, `TopNavBar`, workbench components, `src/app/(payload)/admin/importMap.js`, and `src/payload-types.ts`. This migration avoids overwriting those files.

## Component Lab Inventory

High-value reusable component groups:

- `action-buttons`
- `button-box-frame`
- `button-box-frame-11`
- `border-combo-frame-1`
- `border-combo-frame-2`
- `hero-product-ribbon`
- `small-button-pair`
- `module-common-frame`
- `model-download-confirmation`
- `model-library-card`
- `model-library-panel`
- `model-detail` and `model-detail-2` generated detail layouts
- `home-test` homepage restoration components
- `workbench` page prototype

Do not migrate as-is:

- `home-test-assets` wholesale: large generated image set.
- `model-detail-assets` and `model-detail-2-assets` wholesale: large generated detail-page assets.
- `pixso-all-assets`, `react-assets`, and generated Pixso routes: prototype/export artifacts.
- `.chrome-*`, `.edge-*`, `.video-review`, screenshots, logs, and measurement JSON.
- Lab-only `/api/assets` route assumptions.

## Completed First Batch

Migrated isolated components:

- `src/components/ui-lab/action-buttons/`
- `src/components/ui-lab/button-box-frame/`
- `src/components/ui-lab/button-box-frame-11/`
- `src/components/ui-lab/border-combo-frame-1/`
- `src/components/ui-lab/border-combo-frame-2/`
- `src/components/ui-lab/hero-product-ribbon/`
- `src/components/ui-lab/small-button-pair/`
- `src/components/ui-lab/module-common-frame/`
- `src/components/ui-lab/model-download-confirmation.tsx`
- `src/components/ui-lab/formal-auth-collections.tsx`
- `src/components/ui-lab/formal-components-registry.tsx`
- `src/components/ui-lab/model-author-card.tsx`
- `src/components/ui-lab/model-detail-ad-banner.tsx`
- `src/components/ui-lab/model-library-card/`
- `src/components/ui-lab/model-library-panel/`

Migrated isolated assets:

- `public/ui-lab/component-assets/button-box-frame/`
- `public/ui-lab/formal-components/assets/buttons/`
- `public/ui-lab/formal-components/assets/small-button-pair/`
- `public/ui-lab/formal-components/assets/arrows/`
- `public/ui-lab/formal-components/assets/inspiration-card/`
- `public/ui-lab/model-detail-uicut/`
- `public/ui-lab/pixso-auth-assets/`
- `public/ui-lab/workbench-assets/`

Adjusted during migration:

- Public asset paths now use `/ui-lab/...`.
- Internal imports now use `@/components/ui-lab/...`.
- The lab `GenerateCtaButton` was not kept because it depended on mojibake `/api/assets` filenames.
- `src/app/(frontend)/formal-components/page.tsx` now exposes the migrated component review page in the main project.
- The formal components page copy was rewritten in English to avoid carrying mojibake source text into the main repository.

## Recommended Integration Order

1. Workbench visual shell
   - Compare `component-lab/src/app/workbench` with `src/app/(frontend)/workbench`.
   - Pull only layout measurements, panel framing, and button treatments.
   - Keep real task submission and session logic in the main project.

2. Model detail
   - Compare `component-lab/src/app/model-detail-rebuild` and generated `model-detail` components with `src/app/(frontend)/workbench/models/[id]` and `showcase/[id]`.
   - Decision: `/model-detail?id=<modelId>` is the single model detail UI for public models and for models owned by the signed-in user. `/workbench/models/[id]` is only a compatibility redirect.
   - Do not expose raw `viewerUrl` or `formats.file`.

3. Homepage
   - Compare `home-test` components with `src/app/(frontend)/page.tsx`.
   - Keep content ownership in `homepage-content` and `homepage-items`.
   - Use static fallback assets only when Payload has no public content.

4. Auth/account
   - Compare lab account/auth prototypes with current auth pages.
   - Keep current authentication service boundaries.
   - Do not rely on unregistered account endpoint modules.

5. Account center and user library
   - Migrate card/frame treatments into `/account` tabs and panels.
   - Keep user-scoped Local API reads with `overrideAccess: false`.

## Review Checklist

For every migrated page or component:

1. Check it imports only allowed project paths.
2. Check it does not depend on lab `/api/assets`.
3. Check static asset paths exist under `public/ui-lab`.
4. Check no source mojibake or Chinese comments were introduced.
5. Check server components stay server components unless browser state is required.
6. Check client components have a clear reason for `"use client"`.
7. Run `pnpm exec tsc --noEmit`.
8. Run visual comparison on desktop and mobile before replacing a formal page.

## Formal Page Redesign Matrix

This matrix tracks formal page ownership after the homepage, Workbench, and public model detail routes were promoted. It should stay focused on active product routes, not temporary dated worklogs.

| Route | Priority | Current Owner | Redesign Status | Next Action |
| --- | --- | --- | --- | --- |
| `/pricing` | High | `SubscriptionPage` plus backend plans, credit products, and `formal-pages` copy | Formal dark billing layout active; hero/support body copy is CMS-managed | Browser-check desktop/mobile after adjacent shell changes; keep checkout endpoints unchanged |
| `/account` | High | `AccountCenter` formal account component | In progress, protected account route active | Keep as the single account surface and avoid recreating dashboard-era pages |
| `/generate` | High | Redirect wrapper | Stable compatibility route | Keep redirecting to `/workbench` while preserving supported mode query params |
| `/results/[taskCode]` | High | Result detail page | Formal dark result receipt active and browser-checked for `/results/not-exist` | Keep as compatibility/status route; Workbench and `/model-detail` remain the primary model preview surfaces |
| `/solutions` | High | Shared `MarketingPage` plus `formal-pages` copy | Updated through shared dark marketing layout | Verify desktop/mobile |
| `/features` | High | Shared `MarketingPage` plus `formal-pages` copy | Updated through shared dark marketing layout | Verify desktop/mobile |
| `/resources` | Formal content | Shared `MarketingPage` plus `formal-pages` copy | Updated through shared dark marketing layout | Verify as part of the shared marketing-page pass |
| `/developers` | Formal content | Shared `MarketingPage` plus `formal-pages` copy | Updated through shared dark marketing layout | Verify as part of the shared marketing-page pass |
| `/contact` | Formal content | `FormalInfoPage` plus `formal-pages` copy | Formal dark info page active | Keep support links sourced from content/settings where possible |
| `/privacy-policy` | Formal content | `FormalInfoPage` plus `formal-pages` copy | Formal dark info page active | Policy copy is CMS-managed |
| `/refund-policy` | Formal content | `FormalInfoPage` plus `formal-pages` copy | Formal dark info page active | Policy copy is CMS-managed |
| `/shipping-policy` | Formal content | `FormalInfoPage` plus `formal-pages` copy | Formal dark info page active | Policy copy is CMS-managed |
| `/login` | Account flow | Redirect wrapper to shared auth flow | Compatibility route active | Do not create a separate login system |
| `/register` | Account flow | Redirect wrapper to shared auth flow | Compatibility route active | Do not create a separate register system |
| `/forgot-password` | Account flow | Redirect wrapper to shared auth flow | Compatibility route active | Reuse shared auth modal state |
| `/reset-password` | Account flow | `ResetPasswordForm` | Formal route active and browser-checked on desktop/mobile | Keep posting to `/api/account/auth/reset-password` |
| `/verify-email/[token]` | Account flow | `VerifyEmailClient` | Formal route active with mobile-safe footer shell | Keep posting through account auth verification endpoint |
| `/showcase/[id]` | Cleanup | Compatibility redirect | Redirects to `/model-detail?id=<id>` | Keep `/model-detail` as canonical public detail route |
| `/workbench/models/[id]` | Cleanup | Compatibility redirect | Redirects to `/model-detail?id=<id>` | Do not restore a separate Workbench-owned detail UI |
| `/formal-components` | Local only | Component registry | Hidden in production | Keep local-only; do not invest as a formal page |
| `/test` | Local only | Route inventory | Hidden in production | Keep local-only and update when route ownership changes |
| `/test-bundles` | Local only | Bundle visual validation | Hidden in production | Keep local-only; formal bundle delivery lives at `/bundles` and `/bundles/[slug]` |

## Current Status

Status: shared formal marketing pages are now part of the dark gold Thorns Tavern page family. Formal info/marketing page body copy is centralized in the `formal-pages` Payload global; source content helpers remain fallback/default seed content. The mobile/browser verification pass has accepted `/workbench`, `/model-detail`, and the homepage `/`; the homepage mobile branch uses the desktop-style "Ideas to Miniatures" generator hero and was checked at 360/390/430 mobile widths plus 1440 desktop width with zero horizontal overflow. The public/formal route pass also verified `/about`, `/showcase`, `/bundles`, `/bundles/starter-guide-first-tavern-kit`, `/pricing`, `/features`, `/solutions`, `/resources`, `/developers`, `/contact`, `/privacy-policy`, `/refund-policy`, `/shipping-policy`, and `/verify-email/not-a-real-token` at 1366x768 and 390x844 with zero horizontal overflow.

Next step: only `/account` remains marked `未验证` in the UI matrix. `/workbench/models/[id]` has been resolved as a compatibility redirect to `/model-detail?id=<id>` so the old demo-detail bundle is no longer a product UI surface.
