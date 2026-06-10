"use client";

/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { OrangeMediumActionButton } from "@/components/ui-lab/action-buttons";
import { BorderComboFrame1 } from "@/components/ui-lab/border-combo-frame-1";
import {
  getAdjacentCreditTopupProduct,
  getDefaultCreditTopupProduct,
  normalizeCreditTopupProducts,
  type CreditTopupProduct,
} from "@/lib/creditTopupProducts";

import styles from "./credit-topup-redemption-dialog.module.css";

type CreditTopupRedemptionDialogProps = {
  onOpenChange?: (open: boolean) => void;
  open: boolean;
  products?: CreditTopupProduct[];
};

type CreditProductsResponse = {
  docs?: unknown[];
};

const coinAsset = "/ui-lab/model-detail-uicut/images/detail-bottom-icon-1.png";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Failed to create credit checkout.";

export async function fetchCreditTopupProducts(): Promise<CreditTopupProduct[]> {
  const params = new URLSearchParams({
    depth: "0",
    limit: "12",
    pagination: "false",
    sort: "sortOrder",
    "where[and][0][productType][equals]": "credit-topup",
    "where[and][1][isActive][equals]": "true",
  });

  const response = await fetch(`/api/credit-products?${params.toString()}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) return [];

  const data = (await response.json()) as CreditProductsResponse;
  return normalizeCreditTopupProducts(Array.isArray(data.docs) ? data.docs : []);
}

export function CreditTopupRedemptionDialog({
  onOpenChange,
  open,
  products = [],
}: CreditTopupRedemptionDialogProps) {
  const router = useRouter();
  const normalizedProducts = useMemo(
    () => normalizeCreditTopupProducts(products),
    [products],
  );
  const [mounted, setMounted] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<null | number>(
    () => getDefaultCreditTopupProduct(normalizedProducts)?.id ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct =
    normalizedProducts.find((product) => product.id === selectedProductId) ??
    getDefaultCreditTopupProduct(normalizedProducts);
  const selectedIndex = selectedProduct
    ? normalizedProducts.findIndex((product) => product.id === selectedProduct.id)
    : -1;
  const canStepPrevious = selectedIndex > 0;
  const canStepNext = selectedIndex >= 0 && selectedIndex < normalizedProducts.length - 1;
  const canBuy = Boolean(selectedProduct) && !loading;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const defaultProduct = getDefaultCreditTopupProduct(normalizedProducts);
    if (!defaultProduct) {
      setSelectedProductId(null);
      return;
    }

    setSelectedProductId((current) =>
      normalizedProducts.some((product) => product.id === current)
        ? current
        : defaultProduct.id,
    );
  }, [normalizedProducts]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onOpenChange?.(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading, onOpenChange, open]);

  useEffect(() => {
    if (!open) {
      setError("");
    }
  }, [open]);

  const stepProduct = (direction: "next" | "previous") => {
    if (!selectedProduct) return;

    const nextProduct = getAdjacentCreditTopupProduct(
      normalizedProducts,
      selectedProduct.id,
      direction,
    );
    setSelectedProductId(nextProduct?.id ?? null);
    setError("");
  };

  const buyProduct = async () => {
    if (!selectedProduct || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/billing/credits/checkout", {
        body: JSON.stringify({ productId: selectedProduct.id }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const json = (await response.json()) as {
        checkoutUrl?: unknown;
        message?: unknown;
      };

      if (!response.ok) {
        throw new Error(
          typeof json.message === "string" && json.message
            ? json.message
            : "Failed to create credit checkout.",
        );
      }

      if (typeof json.checkoutUrl === "string" && json.checkoutUrl) {
        window.location.assign(json.checkoutUrl);
        return;
      }

      onOpenChange?.(false);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !open) return null;

  const dialog = (
    <div
      aria-labelledby="credit-topup-redemption-title"
      aria-modal="true"
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onOpenChange?.(false);
        }
      }}
      role="dialog"
    >
      <BorderComboFrame1
        className={styles.frame}
        contentClassName={styles.frameContent}
        style={{ height: 546, width: 594 }}
      >
        <section className={styles.panel}>
          <button
            aria-label="Close point redemption"
            className={styles.closeButton}
            disabled={loading}
            onClick={() => onOpenChange?.(false)}
            type="button"
          />

          <img alt="" className={styles.coin} src={coinAsset} />

          <h2 className={styles.title} id="credit-topup-redemption-title">
            Point Redemption
          </h2>

          <div className={styles.stepperShell}>
            <button
              aria-label="Previous credit pack"
              className={styles.stepperButton}
              disabled={!canStepPrevious || loading}
              onClick={() => stepProduct("previous")}
              type="button"
            >
              -
            </button>
            <output aria-live="polite" className={styles.stepperValue}>
              {selectedProduct ? selectedProduct.credits : "--"}
            </output>
            <button
              aria-label="Next credit pack"
              className={styles.stepperButton}
              disabled={!canStepNext || loading}
              onClick={() => stepProduct("next")}
              type="button"
            >
              +
            </button>
          </div>

          <p className={styles.helperText}>Select Point Value</p>

          {selectedProduct ? (
            <p className={styles.priceText}>
              {new Intl.NumberFormat("en-US", {
                currency: selectedProduct.currency,
                maximumFractionDigits: 2,
                style: "currency",
              }).format(selectedProduct.price)}
            </p>
          ) : (
            <p className={styles.priceText}>No credit packs available</p>
          )}

          <div className={styles.buyButtonSlot}>
            <OrangeMediumActionButton
              disabled={!canBuy}
              label={loading ? "REDIRECTING" : "BUY"}
              onClick={buyProduct}
              type="button"
            />
          </div>

          {error ? (
            <p aria-live="polite" className={styles.error} role="status">
              {error}
            </p>
          ) : null}
        </section>
      </BorderComboFrame1>
    </div>
  );

  return createPortal(dialog, document.body);
}
