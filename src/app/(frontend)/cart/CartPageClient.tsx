"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";
import { getSupabasePreviewImageURL } from "@/lib/supabase/imageTransform";
import {
  buildCheckoutQuery,
  calculateSelectedSubtotal,
  readCartItems,
  removeCartItem,
  subscribeToCartChanges,
  updateCartItemQuantity,
  writeCartItems,
  type CartItem,
} from "../_lib/cartStorage";

import styles from "./cartPage.module.css";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);

const getDetailHref = (modelId: number) => `/model-detail?id=${encodeURIComponent(String(modelId))}`;

export default function CartPageClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<Set<number>>(() => new Set());

  const selectedSubtotal = useMemo(
    () => calculateSelectedSubtotal(items, selectedModelIds),
    [items, selectedModelIds],
  );

  useEffect(() => {
    const syncFromStorage = () => {
      const nextItems = readCartItems();
      setItems(nextItems);
      setSelectedModelIds((current) => {
        const validIds = new Set(nextItems.map((item) => item.modelId));
        const nextSelected = new Set(Array.from(current).filter((id) => validIds.has(id)));
        if (nextSelected.size === 0 && nextItems.length > 0) {
          const firstModelId = nextItems[0]?.modelId;
          if (firstModelId) nextSelected.add(firstModelId);
        }
        return nextSelected;
      });
    };

    syncFromStorage();
    return subscribeToCartChanges(syncFromStorage);
  }, []);

  const persistItems = (nextItems: readonly CartItem[]) => {
    const savedItems = writeCartItems(nextItems);
    setItems(savedItems);
    setSelectedModelIds((current) => {
      const validIds = new Set(savedItems.map((item) => item.modelId));
      return new Set(Array.from(current).filter((id) => validIds.has(id)));
    });
  };

  const toggleItem = (modelId: number) => {
    setSelectedModelIds((current) => {
      const nextSelected = new Set(current);
      if (nextSelected.has(modelId)) {
        nextSelected.delete(modelId);
      } else {
        nextSelected.add(modelId);
      }
      return nextSelected;
    });
  };

  const updateQuantity = (modelId: number, quantity: number) => {
    persistItems(updateCartItemQuantity(items, modelId, quantity));
  };

  const deleteItem = (modelId: number) => {
    persistItems(removeCartItem(items, modelId));
  };

  return (
    <main className={styles.page}>
      <div className={styles.backdropScene} aria-hidden="true" />
      <div className={styles.dimLayer} aria-hidden="true" />
      <div className={styles.modalShell} data-cart-frame>
        <ButtonBoxFrame className={styles.cartFrame} contentClassName={styles.cartFrameContent}>
          <section className={styles.panel} aria-labelledby="cart-title" aria-modal="true" role="dialog">
            <header className={styles.header}>
              <Link className={styles.brandLink} href="/" aria-label="Thorns Tavern home">
                <img alt="Thorns Tavern" src="/ui-lab/cart-modal/cart-logo@2x.png" />
              </Link>
              <span className={styles.headerDivider} aria-hidden="true" />
              <h1 id="cart-title">Shopping Cart</h1>
              <Link className={styles.closeButton} href="/showcase" aria-label="Close cart">
                <span aria-hidden="true" />
              </Link>
            </header>

            <div className={styles.listWrap}>
              {items.length > 0 ? (
                <div className={styles.itemList}>
                  {items.map((item) => {
                    const selected = selectedModelIds.has(item.modelId);
                    return (
                      <article className={styles.cartItem} data-selected={selected} key={item.modelId}>
                        <label className={styles.itemSelect} aria-label={`Select ${item.title}`}>
                          <input checked={selected} onChange={() => toggleItem(item.modelId)} type="checkbox" />
                        </label>

                        <Link className={styles.thumbnail} href={getDetailHref(item.modelId)}>
                          {item.imageSrc ? (
                            <img alt={item.title} src={getSupabasePreviewImageURL(item.imageSrc, "model-card")} />
                          ) : (
                            <span>{item.title.slice(0, 1)}</span>
                          )}
                        </Link>

                        <div className={styles.itemMeta}>
                          <Link className={styles.itemTitle} href={getDetailHref(item.modelId)}>
                            {item.title}
                          </Link>
                          <p>Type: {item.serviceType}</p>
                          <div className={styles.tags}>
                            {item.tags.slice(0, 3).map((tag) => (
                              <span key={tag}># {tag}</span>
                            ))}
                          </div>
                        </div>

                        <div className={styles.priceGroup} aria-label={`${formatPrice(item.discountedPrice)} discounted price`}>
                          <div className={styles.priceBadge}>
                            <strong>{formatPrice(item.discountedPrice)}</strong>
                          </div>
                          {item.originalPrice > item.discountedPrice ? (
                            <del>{formatPrice(item.originalPrice)}</del>
                          ) : null}
                        </div>

                        <div className={styles.quantityStepper} aria-label={`Quantity for ${item.title}`}>
                          <button aria-label={`Decrease ${item.title} quantity`} onClick={() => updateQuantity(item.modelId, item.quantity - 1)} type="button">
                            <span aria-hidden="true" className={styles.stepperIconMinus} />
                          </button>
                          <input
                            aria-label={`${item.title} quantity`}
                            inputMode="numeric"
                            min={1}
                            onChange={(event) => updateQuantity(item.modelId, Number(event.target.value))}
                            type="number"
                            value={item.quantity}
                          />
                          <button aria-label={`Increase ${item.title} quantity`} onClick={() => updateQuantity(item.modelId, item.quantity + 1)} type="button">
                            <span aria-hidden="true" className={styles.stepperIconPlus} />
                          </button>
                        </div>

                        <button className={styles.deleteButton} onClick={() => deleteItem(item.modelId)} type="button">
                          Delete
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h2>Your cart is empty.</h2>
                  <p>Add a print-ready model from the model detail page.</p>
                  <Link href="/showcase">Browse Models</Link>
                </div>
              )}
            </div>

            <footer className={styles.summaryBar}>
              <div className={styles.subtotalBadge} aria-label={`Subtotal ${formatPrice(selectedSubtotal)}`}>
                <div>
                  <strong>{formatPrice(selectedSubtotal)}</strong>
                  <span>SUBTOTAL</span>
                </div>
              </div>
              <Link
                aria-disabled={selectedModelIds.size === 0}
                className={styles.checkoutButton}
                href={buildCheckoutQuery(selectedModelIds)}
                onClick={(event) => {
                  if (selectedModelIds.size === 0) event.preventDefault();
                }}
              >
                <span>CHECKOUT</span>
                <span aria-hidden="true" className={styles.checkoutArrow} />
              </Link>
            </footer>
          </section>
        </ButtonBoxFrame>
      </div>
    </main>
  );
}
