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
- Dashboard: `src/app/(frontend)/dashboard/`
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
   - Decide whether the migrated detail UI is for private model detail, public showcase detail, or both.
   - Do not expose raw `viewerUrl` or `formats.file`.

3. Homepage
   - Compare `home-test` components with `src/app/(frontend)/page.tsx`.
   - Keep content ownership in `homepage-content` and `homepage-items`.
   - Use static fallback assets only when Payload has no public content.

4. Auth/account
   - Compare lab account/auth prototypes with current auth pages.
   - Keep current authentication service boundaries.
   - Do not rely on unregistered account endpoint modules.

5. Dashboard and library
   - Migrate card/frame treatments into `dashboard/library`, `dashboard/tasks`, and `dashboard/orders`.
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

## Current Status

Status: first low-risk component and asset batch migrated.

Next step: integrate selected `ui-lab` primitives into one formal page at a time, starting with workbench or model detail.
