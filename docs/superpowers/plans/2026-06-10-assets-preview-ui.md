# Assets Preview UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a UI-only `/assets-preview` page for reviewing the future assets center layout and interactions.

**Architecture:** Add an isolated frontend route with mock data and local React state. Keep the page separate from production `/assets`, reuse existing navigation/footer/frame assets, and avoid backend mutations.

**Tech Stack:** Next.js app router, React client component, CSS Modules, existing `TopNavigation`, `BorderComboFrame2`, and `FooterBar` components.

---

### Task 1: Route Contract Test

**Files:**
- Create: `tests/assetsPreviewPage.test.ts`
- Create: `src/app/(frontend)/assets-preview/page.tsx`
- Create: `src/app/(frontend)/assets-preview/AssetsPreviewClient.tsx`
- Create: `src/app/(frontend)/assets-preview/assetsPreviewData.ts`
- Create: `src/app/(frontend)/assets-preview/page.module.css`

- [x] **Step 1: Write the failing source test**

```ts
test('assets preview route is UI-only and uses the asset-center frame', () => {
  const pageSource = readFileSync(pagePath, 'utf8')
  const clientSource = readFileSync(clientPath, 'utf8')

  assert.match(pageSource, /AssetsPreviewClient/)
  assert.match(clientSource, /BorderComboFrame2/)
  assert.match(clientSource, /My Assets/)
  assert.match(clientSource, /My Collections/)
  assert.match(clientSource, /My Follows/)
  assert.match(clientSource, /Creator Assets/)
  assert.doesNotMatch(clientSource, /\/api\/account\/models/)
  assert.doesNotMatch(clientSource, /\/api\/social\/models/)
  assert.doesNotMatch(clientSource, /\/api\/creators/)
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --experimental-loader ./scripts/alias-loader.mjs --experimental-strip-types --test tests/assetsPreviewPage.test.ts`

Expected: FAIL because route files do not exist.

- [x] **Step 3: Implement the page**

Create the route, mock data, client interactions, and responsive CSS.

- [x] **Step 4: Run test to verify it passes**

Run: `node --experimental-loader ./scripts/alias-loader.mjs --experimental-strip-types --test tests/assetsPreviewPage.test.ts`

Expected: PASS.

### Task 2: Visual Verification

**Files:**
- Modify: `src/app/(frontend)/assets-preview/*`

- [x] **Step 1: Run TypeScript**

Run: `corepack pnpm exec tsc --noEmit --pretty false`

Expected: exit 0.

- [x] **Step 2: Start or reuse dev server**

Run: `corepack pnpm dev`

Expected: local Next app available on a localhost port.

- [ ] **Step 3: Open `/assets-preview` in browser**

Verify desktop and mobile layouts show the framed asset page, tabs, local menu actions, star removal, and follow toggle without console errors.

Status: blocked in this agent session by browser enterprise policy for `localhost:3000`; the dev server is running for manual review.
