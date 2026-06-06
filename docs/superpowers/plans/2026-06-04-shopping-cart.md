# Shopping Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a front-end localStorage shopping cart page and add an `ADD TO CART` action to model detail.

**Architecture:** Cart persistence is isolated in a pure TypeScript helper with a small browser storage wrapper. The cart route renders a `1160px x 760px` centered `ButtonBoxFrame` modal over a dimmed, blurred backdrop and a responsive mobile version. Model detail writes a snapshot of the active model into the shared cart helper.

**Tech Stack:** Next.js App Router, React client components, CSS Modules, Node test runner, TypeScript, existing `ButtonBoxFrame`, cart-specific PC slice assets, and action-button assets.

---

## File Structure

- Create `src/app/(frontend)/_lib/cartStorage.ts`: cart item types, pure operations, `localStorage` read/write helpers, selection serialization.
- Create `tests/cartStorage.test.ts`: unit coverage for cart storage behavior.
- Create `src/app/(frontend)/cart/page.tsx`: server route wrapper.
- Create `src/app/(frontend)/cart/CartPageClient.tsx`: interactive shopping cart UI.
- Create `src/app/(frontend)/cart/cartPage.module.css`: frame, rows, scroll area, controls, responsive layout.
- Create `src/app/(frontend)/checkout/page.tsx`: front-end checkout placeholder.
- Modify `src/app/(frontend)/model-detail/ModelDetailNative.tsx`: add `ADD TO CART` action beside the print action.

---

### Task 1: Cart Storage Helper

**Files:**
- Create: `src/app/(frontend)/_lib/cartStorage.ts`
- Test: `tests/cartStorage.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  addCartItem,
  buildCheckoutQuery,
  calculateSelectedSubtotal,
  clampCartQuantity,
  removeCartItem,
  updateCartItemQuantity,
} from "../src/app/(frontend)/_lib/cartStorage.ts";

const baseItem = {
  discountedPrice: 22.5,
  imageSrc: "/model.png",
  modelId: 7,
  originalPrice: 25,
  quantity: 1,
  serviceType: "3D Printing Service",
  tags: ["Model Body"],
  title: "Monk",
};

test("addCartItem merges duplicate model ids and clamps quantities", () => {
  const first = addCartItem([], { ...baseItem, quantity: 2 });
  const second = addCartItem(first, { ...baseItem, quantity: 200 });

  assert.equal(second.length, 1);
  assert.equal(second[0].quantity, 99);
});

test("updateCartItemQuantity clamps to one and removeCartItem deletes by model id", () => {
  const cart = addCartItem([], { ...baseItem, quantity: 3 });
  const updated = updateCartItemQuantity(cart, baseItem.modelId, 0);
  const removed = removeCartItem(updated, baseItem.modelId);

  assert.equal(clampCartQuantity(0), 1);
  assert.equal(updated[0].quantity, 1);
  assert.equal(removed.length, 0);
});

test("calculateSelectedSubtotal totals only selected items", () => {
  const cart = [
    { ...baseItem, modelId: 1, discountedPrice: 25, quantity: 2 },
    { ...baseItem, modelId: 2, discountedPrice: 10, quantity: 3 },
  ];

  assert.equal(calculateSelectedSubtotal(cart, new Set([1])), 50);
});

test("buildCheckoutQuery serializes selected model ids", () => {
  assert.equal(buildCheckoutQuery(new Set([9, 3])), "/checkout?items=3%2C9");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node --experimental-loader ./scripts/alias-loader.mjs --experimental-strip-types --test tests/cartStorage.test.ts
```

Expected: failure because `cartStorage.ts` does not exist.

- [ ] **Step 3: Implement cart storage**

Create `cartStorage.ts` with exported `CartItem`, pure functions from the test, and browser helpers `readCartItems`, `writeCartItems`, `subscribeToCartChanges`, and `dispatchCartChanged`.

- [ ] **Step 4: Run test to verify it passes**

Run the same targeted Node test command. Expected: all `cartStorage` tests pass.

---

### Task 2: Cart And Checkout Pages

**Files:**
- Create: `src/app/(frontend)/cart/page.tsx`
- Create: `src/app/(frontend)/cart/CartPageClient.tsx`
- Create: `src/app/(frontend)/cart/cartPage.module.css`
- Create: `src/app/(frontend)/checkout/page.tsx`

- [ ] **Step 1: Implement `/cart` using the storage helper**

The page must load cart items on mount, keep selected ids in component state, persist quantity and delete changes, and render thumbnail links to `/model-detail?id=<modelId>`.

- [ ] **Step 2: Apply the modal frame and sizing**

Use `ButtonBoxFrame` for the modal frame. Set the desktop frame to `width: 1160px` and `height: 760px`; keep the item list scrollable and the bottom summary fixed.

- [ ] **Step 3: Implement `/checkout` placeholder**

Render a document-style page that reads `items` from `searchParams`, explains that payment integration is pending, and links to `/cart` and `/account?section=orders`.

- [ ] **Step 4: Verify TypeScript route compilation**

Run:

```powershell
corepack pnpm exec tsc --noEmit
```

Expected: no TypeScript errors caused by the new pages.

---

### Task 3: Model Detail Add To Cart

**Files:**
- Modify: `src/app/(frontend)/model-detail/ModelDetailNative.tsx`

- [ ] **Step 1: Import the cart helper**

Import `addModelToCart` or the equivalent storage wrapper from `cartStorage.ts`.

- [ ] **Step 2: Add `ADD TO CART` beside the existing print action**

Use the current `activeModel` snapshot. The item should include `modelId`, `title`, `imageSrc`, service type, tags, original price `25`, discounted price `22.5`, and quantity `1`.

- [ ] **Step 3: Add lightweight user feedback**

Show a short non-blocking status such as `Added to cart.` after a successful click.

- [ ] **Step 4: Run targeted tests and typecheck**

Run the cart storage test command and `corepack pnpm exec tsc --noEmit`.

---

### Task 4: Browser Verification

**Files:**
- No new source files unless a defect is found.

- [ ] **Step 1: Start the dev server**

Run `corepack pnpm dev` on an available port.

- [ ] **Step 2: Verify `/cart` desktop**

Use browser automation to confirm the frame is `1160px x 760px`, item rows scroll inside the frame, and no text overlaps at a desktop viewport.

- [ ] **Step 3: Verify `/cart` mobile**

Use a mobile viewport around `390px x 844px` and confirm no horizontal overflow and all controls remain usable.

- [ ] **Step 4: Verify model detail add-to-cart manually or by browser script**

Open a model detail page, click `ADD TO CART`, then open `/cart` and confirm the item appears.
