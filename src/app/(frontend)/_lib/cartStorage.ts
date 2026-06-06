export type CartItem = {
  discountedPrice: number;
  imageSrc?: null | string;
  modelId: number;
  originalPrice: number;
  quantity: number;
  serviceType: string;
  tags: string[];
  title: string;
};

const cartStorageKey = "thorns-tavern:shopping-cart";
const cartChangedEventName = "thorns-tavern:shopping-cart-changed";
const minQuantity = 1;
const maxQuantity = 99;

const toFinitePrice = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
};

const toModelId = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 0;
};

export function clampCartQuantity(value: unknown) {
  const numberValue = Math.floor(Number(value));
  if (!Number.isFinite(numberValue)) return minQuantity;
  return Math.min(maxQuantity, Math.max(minQuantity, numberValue));
}

export function normalizeCartItem(value: unknown): null | CartItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const item = value as Partial<CartItem>;
  const modelId = toModelId(item.modelId);
  const title = typeof item.title === "string" ? item.title.trim() : "";

  if (!modelId || !title) return null;

  const tags = Array.isArray(item.tags)
    ? item.tags
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean)
        .slice(0, 4)
    : [];

  return {
    discountedPrice: toFinitePrice(item.discountedPrice),
    imageSrc: typeof item.imageSrc === "string" && item.imageSrc.trim() ? item.imageSrc.trim() : null,
    modelId,
    originalPrice: toFinitePrice(item.originalPrice),
    quantity: clampCartQuantity(item.quantity),
    serviceType:
      typeof item.serviceType === "string" && item.serviceType.trim()
        ? item.serviceType.trim()
        : "3D Printing Service",
    tags,
    title,
  };
}

export function addCartItem(items: readonly CartItem[], item: CartItem) {
  const normalizedItem = normalizeCartItem(item);
  if (!normalizedItem) return [...items];

  const nextItems = items.map((existing) => {
    if (existing.modelId !== normalizedItem.modelId) return existing;

    return {
      ...existing,
      ...normalizedItem,
      quantity: clampCartQuantity(existing.quantity + normalizedItem.quantity),
    };
  });

  if (nextItems.some((existing) => existing.modelId === normalizedItem.modelId)) {
    return nextItems;
  }

  return [...nextItems, normalizedItem];
}

export function updateCartItemQuantity(items: readonly CartItem[], modelId: number, quantity: unknown) {
  return items.map((item) =>
    item.modelId === modelId
      ? {
          ...item,
          quantity: clampCartQuantity(quantity),
        }
      : item,
  );
}

export function removeCartItem(items: readonly CartItem[], modelId: number) {
  return items.filter((item) => item.modelId !== modelId);
}

export function calculateSelectedSubtotal(items: readonly CartItem[], selectedModelIds: ReadonlySet<number>) {
  return items.reduce((total, item) => {
    if (!selectedModelIds.has(item.modelId)) return total;
    return total + item.discountedPrice * item.quantity;
  }, 0);
}

export function buildCheckoutQuery(selectedModelIds: ReadonlySet<number>) {
  const ids = Array.from(selectedModelIds)
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)
    .sort((left, right) => left - right);

  if (ids.length === 0) return "/checkout";

  return `/checkout?items=${encodeURIComponent(ids.join(","))}`;
}

function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function readCartItems() {
  const storage = getBrowserStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(cartStorageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeCartItem).filter((item): item is CartItem => Boolean(item));
  } catch {
    return [];
  }
}

export function dispatchCartChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(cartChangedEventName));
}

export function writeCartItems(items: readonly CartItem[]) {
  const storage = getBrowserStorage();
  const normalizedItems = items.map(normalizeCartItem).filter((item): item is CartItem => Boolean(item));

  if (storage) {
    storage.setItem(cartStorageKey, JSON.stringify(normalizedItems));
    dispatchCartChanged();
  }

  return normalizedItems;
}

export function addModelToCart(item: CartItem) {
  const nextItems = addCartItem(readCartItems(), item);
  return writeCartItems(nextItems);
}

export function subscribeToCartChanges(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(cartChangedEventName, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(cartChangedEventName, listener);
    window.removeEventListener("storage", listener);
  };
}
