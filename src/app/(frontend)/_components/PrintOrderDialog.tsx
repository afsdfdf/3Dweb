"use client";

import { CreditCard, Loader2, PackageCheck, ShieldCheck, Truck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { printMaterialOptions, printSizeOptions } from "../_lib/printPricing";

import styles from "./PrintOrderDialog.module.css";

type PrintOrderDialogProps = {
  buttonLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  modelId: number;
  modelPreviewSrc?: null | string;
  modelTitle?: null | string;
  renderTrigger?: (args: {
    disabled: boolean;
    loading: boolean;
    open: () => void;
  }) => ReactNode;
  sourceTaskId?: number;
  triggerClassName?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
};

const sizeOptions = printSizeOptions;
const materialOptions = printMaterialOptions;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Failed to create print order.";

export function PrintOrderDialog({
  buttonLabel = "Print this model",
  disabled = false,
  disabledReason,
  modelId,
  modelPreviewSrc = null,
  modelTitle = null,
  renderTrigger,
  sourceTaskId,
  triggerClassName,
  variant = "secondary",
}: PrintOrderDialogProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sizeOption, setSizeOption] =
    useState<(typeof sizeOptions)[number]["key"]>("standard");
  const [materialOption, setMaterialOption] =
    useState<(typeof materialOptions)[number]["key"]>("plastic");

  const selectedSize = sizeOptions.find((item) => item.key === sizeOption) ?? sizeOptions[0];
  const selectedMaterial =
    materialOptions.find((item) => item.key === materialOption) ?? materialOptions[0];
  const total = useMemo(
    () => selectedSize.price + selectedMaterial.price,
    [selectedMaterial.price, selectedSize.price],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loading, open]);

  const openDialog = () => {
    if (disabled) return;
    setError("");
    setOpen(true);
  };

  const createOrder = async (formData: FormData) => {
    setLoading(true);
    setError("");

    try {
      const shippingName = String(formData.get("shippingName") || "").trim();
      const shippingPhone = String(formData.get("shippingPhone") || "").trim();
      const shippingAddress = String(formData.get("shippingAddress") || "").trim();

      if (!shippingName || !shippingPhone || !shippingAddress) {
        throw new Error("Shipping name, phone, and address are required.");
      }

      const response = await fetch("/api/commerce/print-orders", {
        body: JSON.stringify({
          materialOption,
          modelId,
          shippingAddress,
          shippingName,
          shippingPhone,
          sizeOption,
          sourceTaskId,
        }),
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
            : "Failed to create print order.",
        );
      }

      if (typeof json.checkoutUrl === "string" && json.checkoutUrl) {
        window.location.assign(json.checkoutUrl);
        return;
      }

      setOpen(false);
      router.push("/account?section=orders");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const trigger = renderTrigger ? (
    renderTrigger({ disabled, loading, open: openDialog })
  ) : (
    <Button
      className={[styles.trigger, triggerClassName].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      onClick={openDialog}
      title={disabled ? disabledReason : undefined}
      type="button"
      variant={variant}
    >
      {buttonLabel}
    </Button>
  );

  const dialog = open ? (
    <div
      aria-labelledby="print-order-title"
      aria-modal="true"
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) setOpen(false);
      }}
      role="dialog"
    >
      <article className={styles.dialog}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Print Checkout</span>
            <h2 className={styles.title} id="print-order-title">
              Configure your model print.
            </h2>
          </div>
          <button
            aria-label="Close print checkout"
            className={styles.closeButton}
            disabled={loading}
            onClick={() => setOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className={styles.body}>
          <aside className={styles.summary}>
            <div className={styles.preview}>
              {modelPreviewSrc ? (
                <img alt={modelTitle || "Selected model"} src={modelPreviewSrc} />
              ) : (
                <span className={styles.previewFallback}>Model preview</span>
              )}
            </div>
            <h3 className={styles.modelTitle}>{modelTitle || `Model ${modelId}`}</h3>
            <p className={styles.summaryText}>
              This checkout is for one owner-approved, print-ready model. Multi-copy
              orders and fulfillment settings will use the next backend pricing pass.
            </p>

            <div className={styles.quoteBox} aria-label="Estimated quote">
              <div className={styles.quoteLine}>
                <span>{selectedSize.label} print</span>
                <strong>{formatCurrency(selectedSize.price)}</strong>
              </div>
              <div className={styles.quoteLine}>
                <span>{selectedMaterial.label} material</span>
                <strong>{formatCurrency(selectedMaterial.price)}</strong>
              </div>
              <div className={styles.quoteLine}>
                <span>Copies</span>
                <strong>1</strong>
              </div>
              <div className={styles.quoteTotal}>
                <span>Estimated total</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
            </div>

            <div className={styles.note}>
              <ShieldCheck aria-hidden="true" size={16} />
              <span>Stripe collects payment after this order is created.</span>
            </div>
          </aside>

          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void createOrder(new FormData(event.currentTarget));
            }}
          >
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <PackageCheck aria-hidden="true" size={17} />
                <h3>Print Specification</h3>
              </div>
              <div className={styles.optionGrid}>
                {sizeOptions.map((item) => (
                  <button
                    className={styles.optionButton}
                    data-selected={item.key === sizeOption}
                    key={item.key}
                    onClick={() => setSizeOption(item.key)}
                    type="button"
                  >
                    <strong>{item.label}</strong>
                    <span>
                      {item.description} · {formatCurrency(item.price)}
                    </span>
                  </button>
                ))}
              </div>
              <div className={styles.optionGrid}>
                {materialOptions.map((item) => (
                  <button
                    className={styles.optionButton}
                    data-selected={item.key === materialOption}
                    key={item.key}
                    onClick={() => setMaterialOption(item.key)}
                    type="button"
                  >
                    <strong>{item.label}</strong>
                    <span>
                      {item.description} · {formatCurrency(item.price)}
                    </span>
                  </button>
                ))}
              </div>
              <div className={styles.lockedQuantity}>
                <strong>Quantity: 1</strong>
                <span>Quantity is fixed until server-side quote snapshots are added.</span>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <Truck aria-hidden="true" size={17} />
                <h3>Shipping Contact</h3>
              </div>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor="print-shipping-name">Recipient name</label>
                  <Input
                    autoComplete="name"
                    id="print-shipping-name"
                    maxLength={120}
                    name="shippingName"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="print-shipping-phone">Phone number</label>
                  <Input
                    autoComplete="tel"
                    id="print-shipping-phone"
                    maxLength={80}
                    name="shippingPhone"
                    required
                  />
                </div>
                <div className={styles.fieldWide}>
                  <label htmlFor="print-shipping-address">Shipping address</label>
                  <Textarea
                    autoComplete="street-address"
                    id="print-shipping-address"
                    maxLength={500}
                    name="shippingAddress"
                    required
                    rows={4}
                  />
                </div>
              </div>
            </section>

            {error ? (
              <p aria-live="polite" className={styles.error}>
                {error}
              </p>
            ) : null}

            <div className={styles.actions}>
              <Button
                className={styles.secondaryButton}
                disabled={loading}
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button className={styles.payButton} disabled={loading} type="submit">
                {loading ? (
                  <>
                    <Loader2 aria-hidden="true" size={16} />
                    Creating checkout
                  </>
                ) : (
                  <>
                    <CreditCard aria-hidden="true" size={16} />
                    Create order and pay
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </article>
    </div>
  ) : null;

  return (
    <>
      {trigger}
      {mounted && dialog ? createPortal(dialog, document.body) : null}
    </>
  );
}
