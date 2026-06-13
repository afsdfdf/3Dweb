"use client";

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { useState } from "react";

import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";

import styles from "./subscription-panel.module.css";

const assetBase = "/ui-lab/subscription-panel";
const buttonAssetBase = "/ui-lab/formal-components/assets/buttons";
const coinAsset = "/ui-lab/top-navigation/icon-coin-badge.png";
const subscribeButtonImages = {
  normal: `${buttonAssetBase}/button-orange-medium-normal.png`,
  hover: `${buttonAssetBase}/button-orange-medium-hover.png`,
  pressed: `${buttonAssetBase}/button-orange-medium-pressed.png`,
};

type SubscribeButtonStyle = CSSProperties & {
  "--subscribe-button-image": string;
};

export type SubscriptionBillingCycle = "monthly" | "yearly";

export type SubscriptionPanelPlan = {
  ctaDisabled?: boolean;
  ctaLabel?: string;
  description: string;
  features: string[];
  id: string;
  originalPrice?: string;
  price: string;
  priceIntervalLabel?: string;
  title: string;
  subtitle: string;
};

export type SubscriptionPanelProps = {
  billingCycle?: SubscriptionBillingCycle;
  className?: string;
  compact?: boolean;
  currencies?: string[];
  currency?: string;
  emptyMessage?: string;
  onBillingCycleChange?: (cycle: SubscriptionBillingCycle) => void;
  onClose?: () => void;
  onCurrencyChange?: (currency: string) => void;
  onSubscribe?: (plan: SubscriptionPanelPlan) => void;
  plans?: SubscriptionPanelPlan[];
};

export const defaultSubscriptionPlans: SubscriptionPanelPlan[] = [
  {
    id: "free",
    title: "Free",
    subtitle: "No credit card needed",
    price: "$ 0",
    description: "Includes All Essential Features You Need",
    features: ["No credit card needed", "No credit card needed", "No credit card needed"],
  },
  {
    id: "pro",
    title: "Pro",
    subtitle: "For Individual Creators",
    price: "$ 60.25",
    originalPrice: "$ 90.25",
    description: "Includes all features of the Free Plan, plus additional benefits",
    features: [
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
    ],
    ctaLabel: "Subscribe Now",
  },
  {
    id: "studio",
    title: "Studio",
    subtitle: "For Creator Teams",
    price: "$ 120.25",
    originalPrice: "$ 180.50",
    description: "Includes all features of the Pro Plan, plus extra offerings",
    features: [
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
      "No credit card needed",
    ],
    ctaLabel: "Subscribe Now",
  },
];

function SubscribeButton({
  disabled,
  label,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  const [state, setState] = useState<keyof typeof subscribeButtonImages>("normal");
  const image = subscribeButtonImages[state];
  const buttonStyle: SubscribeButtonStyle = {
    "--subscribe-button-image": `url("${image}")`,
  };

  return (
    <button
      className={styles.subscribeButton}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => {
        if (!disabled) setState("pressed");
      }}
      onPointerEnter={(event) => {
        if (!disabled && event.pointerType === "mouse") setState("hover");
      }}
      onPointerLeave={() => setState("normal")}
      onPointerUp={(event) => setState(!disabled && event.pointerType === "mouse" ? "hover" : "normal")}
      style={buttonStyle}
      type="button"
    >
      {label}
    </button>
  );
}

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: SubscriptionBillingCycle;
  onChange: (cycle: SubscriptionBillingCycle) => void;
}) {
  return (
    <div className={styles.billingToggle} role="tablist" aria-label="Billing cycle">
      <button
        aria-selected={cycle === "monthly"}
        className={cycle === "monthly" ? styles.billingTabActive : styles.billingTab}
        onClick={() => onChange("monthly")}
        role="tab"
        type="button"
      >
        Monthly
      </button>
      <button
        aria-selected={cycle === "yearly"}
        className={cycle === "yearly" ? styles.billingTabActive : styles.billingTab}
        onClick={() => onChange("yearly")}
        role="tab"
        type="button"
      >
        <span>Yearly</span>
        <b>20%</b>
      </button>
    </div>
  );
}

function SubscriptionPlanCard({
  onSubscribe,
  plan,
}: {
  onSubscribe?: (plan: SubscriptionPanelPlan) => void;
  plan: SubscriptionPanelPlan;
}) {
  return (
    <article className={styles.planCard} data-subscription-plan={plan.id}>
      <header className={styles.planHeader}>
        <h3>{plan.title}</h3>
        <p>{plan.subtitle}</p>
      </header>

      <div className={styles.priceRibbon}>
        <img alt="" className={styles.priceCoin} src={coinAsset} />
        <div className={styles.priceText}>
          <strong>{plan.price}</strong>
          <span>/ {plan.priceIntervalLabel ?? "Month"}</span>
          {plan.originalPrice ? <em>{plan.originalPrice}</em> : null}
        </div>
      </div>

      <div className={styles.planBody}>
        <p className={styles.description}>{plan.description}</p>
        <ul className={styles.featureList}>
          {plan.features.map((feature, index) => (
            <li key={`${plan.id}-${index}`}>
              <img alt="" src={`${assetBase}/check@2x.png`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {plan.ctaLabel ? (
        <div className={styles.planFooter}>
          <SubscribeButton disabled={plan.ctaDisabled} label={plan.ctaLabel} onClick={() => onSubscribe?.(plan)} />
        </div>
      ) : null}
    </article>
  );
}

export function SubscriptionPanel({
  billingCycle,
  className,
  compact = false,
  currencies = ["USD"],
  currency,
  emptyMessage = "Subscription plans are temporarily unavailable.",
  onBillingCycleChange,
  onClose,
  onCurrencyChange,
  onSubscribe,
  plans = defaultSubscriptionPlans,
}: SubscriptionPanelProps) {
  const [internalCycle, setInternalCycle] = useState<SubscriptionBillingCycle>("yearly");
  const [internalCurrency, setInternalCurrency] = useState(currencies[0] ?? "USD");
  const selectedCycle = billingCycle ?? internalCycle;
  const selectedCurrency = currency ?? internalCurrency;

  const setCycle = (cycle: SubscriptionBillingCycle) => {
    setInternalCycle(cycle);
    onBillingCycleChange?.(cycle);
  };

  const setCurrency = (value: string) => {
    setInternalCurrency(value);
    onCurrencyChange?.(value);
  };

  return (
    <ButtonBoxFrame
      className={[styles.panel, className].filter(Boolean).join(" ")}
      contentClassName={styles.panelContent}
      data-subscription-panel-density={compact ? "compact" : "default"}
      data-subscription-panel-frame
      style={{ height: "var(--subscription-panel-height)", width: "var(--subscription-panel-width)" }}
    >
      <section className={styles.inner} aria-label="Subscription panel" data-subscription-panel>
        <header className={styles.header} data-subscription-panel-header>
          <img alt="" className={styles.logo} src={`${assetBase}/logo-medallion@2x.png`} />
          <img alt="Subscription" className={styles.titleRibbon} src={`${assetBase}/title-ribbon@2x.png`} />
          <span className={styles.headerRule} aria-hidden="true" />
          <button aria-label="Close subscription panel" className={styles.closeButton} onClick={onClose} type="button" />
        </header>

        <div className={styles.body}>
          <div className={styles.controls}>
            <label className={styles.currencyControl}>
              <span>Currency</span>
              <select onChange={(event) => setCurrency(event.target.value)} value={selectedCurrency}>
                {currencies.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <BillingToggle cycle={selectedCycle} onChange={setCycle} />
          </div>

          <div className={styles.planGrid} data-subscription-plan-grid>
            {plans.length > 0 ? (
              plans.map((plan) => {
                const resolvedPlan = {
                  ...plan,
                  priceIntervalLabel: plan.priceIntervalLabel ?? (selectedCycle === "yearly" ? "Year" : "Month"),
                };

                return <SubscriptionPlanCard key={plan.id} onSubscribe={onSubscribe} plan={resolvedPlan} />;
              })
            ) : (
              <div className={styles.planState}>{emptyMessage}</div>
            )}
          </div>
        </div>
      </section>
    </ButtonBoxFrame>
  );
}
