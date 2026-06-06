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
