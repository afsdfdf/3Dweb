export type CreditTopupProduct = {
  credits: number;
  currency: string;
  description?: null | string;
  id: number;
  price: number;
  slug: string;
  title: string;
};

type CreditTopupProductInput = {
  credits?: unknown;
  currency?: unknown;
  description?: unknown;
  id?: unknown;
  isActive?: unknown;
  price?: unknown;
  productType?: unknown;
  slug?: unknown;
  title?: unknown;
};

export type CreditTopupProductDirection = "next" | "previous";

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizePositiveNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const isProductInput = (value: unknown): value is CreditTopupProductInput =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const normalizeProduct = (
  product: CreditTopupProductInput,
): null | CreditTopupProduct => {
  if (product.productType !== undefined && product.productType !== "credit-topup") {
    return null;
  }

  if (product.isActive !== undefined && product.isActive !== true) {
    return null;
  }

  const id = Math.floor(normalizePositiveNumber(product.id));
  const credits = normalizePositiveNumber(product.credits);
  const price = normalizePositiveNumber(product.price);

  if (!id || !credits || !price) return null;

  const slug = normalizeText(product.slug) || `credit-pack-${id}`;
  const title = normalizeText(product.title) || `${credits} Credits`;
  const currency = (normalizeText(product.currency) || "USD").toUpperCase();
  const description = normalizeText(product.description);

  return {
    credits,
    currency,
    description: description || null,
    id,
    price,
    slug,
    title,
  };
};

export function normalizeCreditTopupProducts(
  products: unknown[],
): CreditTopupProduct[] {
  return products
    .map((product) => (isProductInput(product) ? normalizeProduct(product) : null))
    .filter((product): product is CreditTopupProduct => Boolean(product))
    .sort((left, right) => {
      if (left.credits !== right.credits) return left.credits - right.credits;
      if (left.price !== right.price) return left.price - right.price;
      return left.id - right.id;
    });
}

export function getDefaultCreditTopupProduct(
  products: CreditTopupProduct[],
): null | CreditTopupProduct {
  return products[0] ?? null;
}

export function getAdjacentCreditTopupProduct(
  products: CreditTopupProduct[],
  currentProductId: number,
  direction: CreditTopupProductDirection,
): null | CreditTopupProduct {
  if (products.length === 0) return null;

  const currentIndex = products.findIndex(
    (product) => product.id === currentProductId,
  );
  if (currentIndex < 0) return getDefaultCreditTopupProduct(products);

  const offset = direction === "next" ? 1 : -1;
  const nextIndex = Math.max(
    0,
    Math.min(products.length - 1, currentIndex + offset),
  );

  return products[nextIndex] ?? null;
}
