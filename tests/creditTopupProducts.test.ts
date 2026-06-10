import assert from "node:assert/strict";
import test from "node:test";

import {
  getAdjacentCreditTopupProduct,
  getDefaultCreditTopupProduct,
  normalizeCreditTopupProducts,
} from "@/lib/creditTopupProducts";

test("credit top-up products normalize to purchasable sorted packs", () => {
  const products = normalizeCreditTopupProducts([
    { credits: 100, currency: "usd", id: 3, price: 19, slug: "hundred", title: "Hundred" },
    { credits: 0, currency: "usd", id: 4, price: 1, slug: "empty", title: "Empty" },
    { credits: 20, currency: "eur", id: 1, price: 5, slug: "twenty", title: "Twenty" },
    { credits: 50, currency: "", id: 2, price: 10, slug: "fifty", title: "Fifty" },
    { credits: 25, currency: "usd", id: 0, price: 7, slug: "invalid", title: "Invalid" },
  ]);

  assert.deepEqual(
    products.map((product) => ({
      credits: product.credits,
      currency: product.currency,
      id: product.id,
      price: product.price,
    })),
    [
      { credits: 20, currency: "EUR", id: 1, price: 5 },
      { credits: 50, currency: "USD", id: 2, price: 10 },
      { credits: 100, currency: "USD", id: 3, price: 19 },
    ],
  );
});

test("credit top-up selection moves between fixed packs without wrapping", () => {
  const products = normalizeCreditTopupProducts([
    { credits: 100, currency: "usd", id: 3, price: 19, slug: "hundred", title: "Hundred" },
    { credits: 20, currency: "usd", id: 1, price: 5, slug: "twenty", title: "Twenty" },
    { credits: 50, currency: "usd", id: 2, price: 10, slug: "fifty", title: "Fifty" },
  ]);

  assert.equal(getDefaultCreditTopupProduct(products)?.id, 1);
  assert.equal(getAdjacentCreditTopupProduct(products, 1, "next")?.id, 2);
  assert.equal(getAdjacentCreditTopupProduct(products, 2, "previous")?.id, 1);
  assert.equal(getAdjacentCreditTopupProduct(products, 1, "previous")?.id, 1);
  assert.equal(getAdjacentCreditTopupProduct(products, 3, "next")?.id, 3);
  assert.equal(getAdjacentCreditTopupProduct(products, 999, "next")?.id, 1);
});
