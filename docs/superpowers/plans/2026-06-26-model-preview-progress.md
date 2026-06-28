# Model Preview Progress Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the shared model-preview loading progress overlay to the supplied reference using the requested 1920 reference proportional sizing.

**Architecture:** Style the shared `ModelViewer` loading overlay with the target framed progress bar by default. Workbench wrappers also pass the explicit variant so Workbench-specific entry points remain covered.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS modules/global utility classes, Vitest-style Node test runner.

---

### Task 1: Add A Source Contract Test

**Files:**
- Modify: `tests/modelLoadProgress.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that reads `ModelViewer.tsx`, `WorkbenchClient.tsx`, and the public asset path. Assert that the new variant prop exists, that Workbench passes `loadingOverlayVariant="workbench"`, that the 460px design width and 9-slice frame are present, and that the frame asset exists.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-loader file:///D:/web/payload-local-demo/scripts/alias-loader.mjs --experimental-strip-types --test tests/modelLoadProgress.test.ts`

Expected: FAIL because the prop, frame asset, and style constants do not exist yet.

### Task 2: Implement The Workbench Overlay Variant

**Files:**
- Modify: `src/app/(frontend)/_components/ModelViewer.tsx`
- Modify: `src/app/(frontend)/workbench/WorkbenchClient.tsx`
- Create: `public/ui-lab/workbench/model-loading-frame-2x.png`

- [ ] **Step 1: Copy the frame asset**

Copy `C:\Users\changcheng\Downloads\按钮盒子备份 10_slices\按钮盒子备份 10@2x.png` to `public/ui-lab/workbench/model-loading-frame-2x.png`.

- [ ] **Step 2: Add the variant prop**

Add `loadingOverlayVariant?: "default" | "workbench"` to `ModelViewerProps` and pass it into `ModelLoadingOverlay`.

- [ ] **Step 3: Add the framed markup and classes**

For the Workbench variant, set the overlay width to `460px`, bottom to `86px`, centered horizontally inside the viewer, and use `borderImage: url("/ui-lab/workbench/model-loading-frame@2x.png") 9 fill / 9px / 0 stretch`.

- [ ] **Step 4: Enable it in Workbench**

Pass `loadingOverlayVariant="workbench"` to the desktop Workbench `ModelViewer` call. Keep the model-detail calls unchanged.

### Task 3: Verify

**Files:**
- No production file changes unless verification finds a defect.

- [ ] **Step 1: Run focused test**

Run: `node --experimental-loader file:///D:/web/payload-local-demo/scripts/alias-loader.mjs --experimental-strip-types --test tests/modelLoadProgress.test.ts`

Expected: PASS.

- [ ] **Step 2: Run TypeScript check**

Run: `corepack pnpm exec tsc --noEmit`

Expected: PASS.
