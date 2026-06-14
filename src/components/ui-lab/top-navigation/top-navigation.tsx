"use client";

/* eslint-disable @next/next/no-img-element */
import { type KeyboardEvent as ReactKeyboardEvent, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import {
  CreditTopupRedemptionDialog,
  fetchCreditTopupProducts,
} from "@/components/ui-lab/credit-topup-redemption-dialog";
import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";
import {
  SubscriptionPanel,
  type SubscriptionBillingCycle,
  type SubscriptionPanelPlan,
} from "@/components/ui-lab/subscription-panel";
import type { CreditTopupProduct } from "@/lib/creditTopupProducts";
import { publicNavigationItems } from "@/lib/publicNavigation";
import type { SubscriptionPlanDefinition } from "@/lib/subscriptionPlans";

import styles from "./top-navigation.module.css";
import { formatTopNavigationUserLabel, getTopNavigationUserLabel } from "./user-label";
import { TopNavigationUserMenu } from "./user-menu";

const assetBase = "/ui-lab/top-navigation";
const emptyCreditTopupProducts: CreditTopupProduct[] = [];
type TopNavigationSubscriptionPlan = Omit<SubscriptionPlanDefinition, "lookupKey" | "yearlyLookupKey">;

const emptySubscriptionPlans: TopNavigationSubscriptionPlan[] = [];

export type TopNavigationPromotion = {
  buttonAriaLabel?: null | string;
  buttonLabel?: null | string;
  enabled?: boolean | null;
  eyebrow?: null | string;
  offerText?: null | string;
};

type ResolvedTopNavigationPromotion = {
  buttonAriaLabel: string;
  buttonLabel: string;
  enabled: boolean;
  eyebrow: string;
  offerText: string;
};

const defaultSubscriptionPromotion: ResolvedTopNavigationPromotion = {
  buttonAriaLabel: "Open subscription offers",
  buttonLabel: "SUB",
  enabled: true,
  eyebrow: "NEW USER",
  offerText: "30% OFF",
};

export type TopNavigationItem = {
  href: string;
  id: string;
  label: string;
};

export type TopNavigationUser = {
  avatarUrl?: null | string;
  bio?: null | string;
  credits?: null | number;
  creditsBalance?: null | number;
  displayName?: null | string;
  email?: null | string;
  followersCount?: null | number;
  followingCount?: null | number;
  hasActiveSubscription?: boolean | null;
  id?: number | string;
  modelsCount?: null | number;
  name?: null | string;
  role?: null | string;
};

type TopNavigationProps = {
  active?: string;
  className?: string;
  credits?: number;
  creditTopupProducts?: CreditTopupProduct[];
  fitViewport?: boolean;
  items?: readonly TopNavigationItem[];
  loginHref?: string;
  paymentProviderNotice?: null | string;
  registerHref?: string;
  showAuthEntry?: boolean;
  stripeSubscriptionsEnabled?: boolean;
  subscriptionPlans?: TopNavigationSubscriptionPlan[];
  subscriptionPromotion?: null | TopNavigationPromotion;
  user?: null | TopNavigationUser;
  userName?: null | string;
};

const defaultNavItems = publicNavigationItems;

export const migrationTestNavItems = publicNavigationItems;

type NotificationItem = {
  body: string;
  createdAt: string;
  href?: null | string;
  id: number | string;
  readAt?: null | string;
  severity: "critical" | "info" | "success" | "warning";
  title: string;
  type: string;
};

type NotificationsResponse = {
  notifications?: NotificationItem[];
  unreadCount?: number;
};

type NotificationTab = "message" | "notification";

const notificationTabs: Array<{ id: NotificationTab; label: string }> = [
  { id: "message", label: "Message" },
  { id: "notification", label: "Notification" },
];

type SubscriptionPlansResponse = {
  paymentProviderNotice?: unknown;
  plans?: unknown[];
  stripeSubscriptionsEnabled?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const normalizePromotionText = (value: unknown, fallback: string) => {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const resolveSubscriptionPromotion = (promotion?: null | TopNavigationPromotion) => {
  if (promotion?.enabled === false) return null;

  return {
    buttonAriaLabel: normalizePromotionText(promotion?.buttonAriaLabel, defaultSubscriptionPromotion.buttonAriaLabel),
    buttonLabel: normalizePromotionText(promotion?.buttonLabel, defaultSubscriptionPromotion.buttonLabel),
    enabled: true,
    eyebrow: normalizePromotionText(promotion?.eyebrow, defaultSubscriptionPromotion.eyebrow),
    offerText: normalizePromotionText(promotion?.offerText, defaultSubscriptionPromotion.offerText),
  };
};

const normalizeSubscriptionPlan = (value: unknown): null | TopNavigationSubscriptionPlan => {
  if (!isRecord(value)) return null;
  if (value.key !== "starter" && value.key !== "pro" && value.key !== "studio") return null;

  const monthlyPrice = Number(value.monthlyPrice);
  const yearlyPrice = Number(value.yearlyPrice);
  const creditsPerMonth = Number(value.creditsPerMonth);
  const features = Array.isArray(value.features)
    ? value.features.map((feature) => (typeof feature === "string" ? feature.trim() : "")).filter(Boolean)
    : [];

  return {
    creditsPerMonth: Number.isFinite(creditsPerMonth) ? creditsPerMonth : 0,
    description: normalizePromotionText(value.description, `${creditsPerMonth || 0} credits per month`),
    features: features.length > 0 ? features : [`${creditsPerMonth || 0} credits per month`],
    key: value.key,
    monthlyPrice: Number.isFinite(monthlyPrice) ? monthlyPrice : 0,
    name: normalizePromotionText(value.name, value.key),
    shortLabel: normalizePromotionText(value.shortLabel, `${value.key} plan`),
    yearlyPrice: Number.isFinite(yearlyPrice) ? yearlyPrice : Math.round((Number.isFinite(monthlyPrice) ? monthlyPrice : 0) * 12 * 0.8 * 100) / 100,
  };
};

async function fetchSubscriptionPlans(): Promise<{
  paymentProviderNotice: string;
  plans: TopNavigationSubscriptionPlan[];
  stripeSubscriptionsEnabled: boolean;
}> {
  const response = await fetch("/api/billing/subscriptions/plans", {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return {
      paymentProviderNotice: "Subscription plans are temporarily unavailable.",
      plans: [],
      stripeSubscriptionsEnabled: false,
    };
  }

  const data = (await response.json()) as SubscriptionPlansResponse;
  const plans = Array.isArray(data.plans)
    ? data.plans.map(normalizeSubscriptionPlan).filter((plan): plan is TopNavigationSubscriptionPlan => Boolean(plan))
    : [];

  return {
    paymentProviderNotice: typeof data.paymentProviderNotice === "string" ? data.paymentProviderNotice : "",
    plans,
    stripeSubscriptionsEnabled: data.stripeSubscriptionsEnabled !== false,
  };
}

const formatPanelPrice = (value: number) => {
  const amount = Number.isFinite(value) ? value : 0;
  return `$ ${amount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })}`;
};

const normalizePlanFeatures = (plan: TopNavigationSubscriptionPlan) => {
  const features = plan.features.filter((feature) => feature.trim());
  return features.length > 0 ? features : [`${plan.creditsPerMonth} credits per month`];
};

const formatNotificationTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return "Just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));
};

const isMessageNotification = (item: NotificationItem) => {
  const searchable = `${item.type} ${item.title}`.toLowerCase();
  return searchable.includes("message") || searchable.includes("comment") || searchable.includes("reply");
};

function NotificationBellButton({ authenticated }: { authenticated: boolean }) {
  const { openAuthModal } = useAuthModal();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<NotificationTab>("message");
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (!authenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch("/api/account/notifications/unread-count", {
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = (await response.json()) as NotificationsResponse;
      setUnreadCount(Math.max(0, Number(data.unreadCount || 0)));
    } catch {
      setUnreadCount(0);
    }
  }, [authenticated]);

  const loadNotifications = useCallback(async () => {
    if (!authenticated) return;

    setIsLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/account/notifications?limit=5", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load notifications.");
      }

      const data = (await response.json()) as NotificationsResponse;
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Math.max(0, Number(data.unreadCount || 0)));
      setHasLoaded(true);
    } catch {
      setLoadError("Could not load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    void loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const markNotificationRead = useCallback(async (id: number | string) => {
    setNotifications((current) =>
      current.map((item) => (String(item.id) === String(id) ? { ...item, readAt: item.readAt || new Date().toISOString() } : item)),
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    await fetch(`/api/account/notifications/${encodeURIComponent(String(id))}/read`, {
      method: "PATCH",
    }).catch(() => undefined);
  }, []);

  const handleToggle = () => {
    if (!authenticated) {
      openAuthModal("login");
      return;
    }

    setIsOpen((current) => !current);
    if (!hasLoaded) {
      void loadNotifications();
    }
  };

  const visibleCount = unreadCount > 99 ? "99+" : String(unreadCount);
  const hasUnread = unreadCount > 0;
  const messageNotifications = notifications.filter(isMessageNotification);
  const noticeNotifications = notifications.filter((item) => !isMessageNotification(item));
  const visibleNotifications = activeTab === "message" ? messageNotifications : noticeNotifications;
  const unreadMessages = messageNotifications.filter((item) => !item.readAt).length;
  const unreadNotices = noticeNotifications.filter((item) => !item.readAt).length;
  const tabUnreadCount = {
    message: unreadMessages,
    notification: unreadNotices,
  } satisfies Record<NotificationTab, number>;

  return (
    <div className={styles.notificationBellWrap} ref={panelRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Notifications"
        className={styles.notificationBellButton}
        onClick={handleToggle}
        type="button"
      >
        <span className={styles.navActionIcon} aria-hidden="true">
          <img
            alt=""
            className={styles.navActionIconNormal}
            decoding="async"
            src={`${assetBase}/icon-notification-bell-line.png`}
          />
          <img alt="" className={styles.navActionIconActive} decoding="async" src={`${assetBase}/icon-bell-gold.png`} />
        </span>
        {hasUnread ? <span className={styles.notificationBadge}>{visibleCount}</span> : null}
      </button>

      {isOpen ? (
        <ButtonBoxFrame
          className={styles.notificationPopover}
          contentClassName={styles.notificationPopoverContent}
          style={{ height: 676, width: 320 }}
        >
          <div aria-label="Notifications" className={styles.notificationPanel} role="dialog">
            <div className={styles.notificationTabBar} role="tablist" aria-label="Notification categories">
              {notificationTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const showUnreadDot = tabUnreadCount[tab.id] > 0;

                return (
                  <button
                    aria-selected={isActive}
                    className={isActive ? styles.notificationTabActive : styles.notificationTab}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    type="button"
                  >
                    <span>{tab.label}</span>
                    {showUnreadDot ? <i aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>

            <div className={styles.notificationList}>
              {isLoading ? <div className={styles.notificationState}>Loading...</div> : null}
              {!isLoading && loadError ? <div className={styles.notificationState}>{loadError}</div> : null}
              {!isLoading && !loadError && visibleNotifications.length === 0 ? (
                <div className={styles.notificationEmpty}>
                  <span>{activeTab === "message" ? "No messages" : "No notices"}</span>
                </div>
              ) : null}
              {!isLoading && !loadError
                ? visibleNotifications.map((item) => {
                    const itemClass = [
                      styles.notificationItem,
                      item.readAt ? styles.notificationItemRead : styles.notificationItemUnread,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const action = item.href ? (
                      <Link
                        className={styles.notificationGoButton}
                        href={item.href}
                        onClick={() => {
                          if (!item.readAt) void markNotificationRead(item.id);
                          setIsOpen(false);
                        }}
                      >
                        <span>Go Now</span>
                        <b aria-hidden="true" />
                      </Link>
                    ) : (
                      <button
                        className={styles.notificationGoButton}
                        onClick={() => {
                          if (!item.readAt) void markNotificationRead(item.id);
                        }}
                        type="button"
                      >
                        <span>Go Now</span>
                        <b aria-hidden="true" />
                      </button>
                    );

                    return (
                      <article className={itemClass} key={item.id}>
                        <span className={styles.notificationStatusDot} aria-hidden="true" />
                        <div className={styles.notificationText}>
                          <header>
                            <strong>{item.title}</strong>
                            <em>{formatNotificationTime(item.createdAt)}</em>
                          </header>
                          <p>{item.body}</p>
                          {action}
                        </div>
                      </article>
                    );
                  })
                : null}
            </div>

          </div>
        </ButtonBoxFrame>
      ) : null}
    </div>
  );
}

function CartIconButton() {
  return (
    <Link aria-label="Shopping cart" className={styles.cartIconButton} href="/cart">
      <span className={styles.navActionIcon} aria-hidden="true">
        <img alt="" className={styles.navActionIconNormal} decoding="async" src={`${assetBase}/icon-cart-line.png`} />
        <img alt="" className={styles.navActionIconHover} decoding="async" src={`${assetBase}/icon-cart-line-emphasis.png`} />
        <img alt="" className={styles.navActionIconActive} decoding="async" src={`${assetBase}/icon-cart-gold.png`} />
      </span>
    </Link>
  );
}

function SubscriptionPromotionButton({
  buttonRef,
  onClick,
  promotion,
}: {
  buttonRef?: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  promotion: ResolvedTopNavigationPromotion;
}) {
  return (
    <>
      <div className={styles.subscriptionPromotion} aria-label={`${promotion.eyebrow} ${promotion.offerText}`}>
        <strong>{promotion.eyebrow}</strong>
        <span>{promotion.offerText}</span>
      </div>
      <button
        aria-label={promotion.buttonAriaLabel}
        className={styles.subscriptionButton}
        onClick={onClick}
        ref={buttonRef}
        type="button"
      >
        <img alt="" aria-hidden="true" decoding="async" src={`${assetBase}/icon-crown-subscribe.png`} />
        <span>{promotion.buttonLabel}</span>
      </button>
    </>
  );
}

const focusableDialogSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableDialogElements(root: HTMLElement | null) {
  if (!root) return [];

  return Array.from(root.querySelectorAll<HTMLElement>(focusableDialogSelector)).filter((element) => {
    return !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true";
  });
}

function SubscriptionOfferDialog({
  authenticated,
  initialPaymentProviderNotice = "",
  initialPlans = emptySubscriptionPlans,
  initialStripeSubscriptionsEnabled = true,
  onOpenChange,
  open,
  restoreFocusRef,
}: {
  authenticated: boolean;
  initialPaymentProviderNotice?: null | string;
  initialPlans?: TopNavigationSubscriptionPlan[];
  initialStripeSubscriptionsEnabled?: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  restoreFocusRef?: RefObject<HTMLElement | null>;
}) {
  const { openAuthModal } = useAuthModal();
  const dialogPanelRef = useRef<HTMLDivElement>(null);
  const dialogTitleId = "top-navigation-subscription-dialog-title";
  const [mounted, setMounted] = useState(false);
  const [loadedPlans, setLoadedPlans] = useState<null | TopNavigationSubscriptionPlan[]>(null);
  const [hasRequestedPlans, setHasRequestedPlans] = useState(false);
  const [loadingPlanKey, setLoadingPlanKey] = useState<null | string>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info">("info");
  const [paymentProviderNotice, setPaymentProviderNotice] = useState(initialPaymentProviderNotice || "");
  const [stripeSubscriptionsEnabled, setStripeSubscriptionsEnabled] = useState(initialStripeSubscriptionsEnabled);
  const [billingCycle, setBillingCycle] = useState<SubscriptionBillingCycle>("yearly");
  const visiblePlans = initialPlans.length > 0 ? initialPlans : loadedPlans ?? emptySubscriptionPlans;
  const plansUnavailable = visiblePlans.length === 0 || !stripeSubscriptionsEnabled;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPaymentProviderNotice(initialPaymentProviderNotice || "");
  }, [initialPaymentProviderNotice]);

  useEffect(() => {
    setStripeSubscriptionsEnabled(initialStripeSubscriptionsEnabled);
  }, [initialStripeSubscriptionsEnabled]);

  useEffect(() => {
    if (!open || hasRequestedPlans || initialPlans.length > 0) return;

    setHasRequestedPlans(true);
    void fetchSubscriptionPlans()
      .then((result) => {
        setLoadedPlans(result.plans);
        setPaymentProviderNotice(result.paymentProviderNotice);
        setStripeSubscriptionsEnabled(result.stripeSubscriptionsEnabled);
      })
      .catch(() => {
        setLoadedPlans([]);
        setStripeSubscriptionsEnabled(false);
        setPaymentProviderNotice("Subscription plans are temporarily unavailable.");
        setMessageTone("error");
        setMessage("Subscription plans are temporarily unavailable.");
      });
  }, [hasRequestedPlans, initialPlans.length, open]);

  useEffect(() => {
    if (!open) {
      setMessage("");
      setMessageTone("info");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loadingPlanKey) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loadingPlanKey, onOpenChange, open]);

  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const explicitRestoreTarget = restoreFocusRef?.current || null;
    const focusFrame = window.requestAnimationFrame(() => {
      const focusableElements = getFocusableDialogElements(dialogPanelRef.current);
      (focusableElements[0] || dialogPanelRef.current)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      const restoreTarget = explicitRestoreTarget || previousActiveElement;
      restoreTarget?.focus?.();
    };
  }, [open, restoreFocusRef]);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;

    const focusableElements = getFocusableDialogElements(dialogPanelRef.current);
    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogPanelRef.current?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const panelPlans = useMemo<SubscriptionPanelPlan[]>(() => {
    return visiblePlans.map((plan) => {
      const isLoading = loadingPlanKey === plan.key;
      const isDisabled = plansUnavailable || Boolean(loadingPlanKey && !isLoading);
      const cyclePrice = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
      const yearlyOriginalPrice = plan.monthlyPrice * 12;
      const originalPrice =
        billingCycle === "yearly" && yearlyOriginalPrice > cyclePrice ? formatPanelPrice(yearlyOriginalPrice) : undefined;

      return {
        ctaDisabled: isDisabled,
        ctaLabel: !authenticated
          ? "Sign In"
          : isLoading
            ? "Redirecting"
            : stripeSubscriptionsEnabled
              ? "Subscribe Now"
              : "Unavailable",
        description: plan.description,
        features: normalizePlanFeatures(plan),
        id: plan.key,
        originalPrice,
        price: formatPanelPrice(cyclePrice),
        priceIntervalLabel: billingCycle === "yearly" ? "Year" : "Month",
        subtitle: plan.shortLabel,
        title: plan.name,
      };
    });
  }, [authenticated, billingCycle, loadingPlanKey, plansUnavailable, stripeSubscriptionsEnabled, visiblePlans]);

  const handleSubscribe = async (plan: SubscriptionPanelPlan) => {
    if (loadingPlanKey) return;

    if (!authenticated) {
      onOpenChange(false);
      openAuthModal("login");
      return;
    }

    const selectedPlan = visiblePlans.find((item) => item.key === plan.id);
    if (!selectedPlan) return;

    if (!stripeSubscriptionsEnabled) {
      setMessageTone("error");
      setMessage(paymentProviderNotice || "Subscription checkout is unavailable.");
      return;
    }

    setLoadingPlanKey(selectedPlan.key);
    setMessage("");

    try {
      const response = await fetch("/api/billing/subscriptions/checkout", {
        body: JSON.stringify({ billingCycle, planKey: selectedPlan.key }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const json = (await response.json().catch(() => ({}))) as {
        checkoutUrl?: unknown;
        message?: unknown;
      };

      if (response.status === 401) {
        onOpenChange(false);
        openAuthModal("login");
        return;
      }

      if (!response.ok) {
        throw new Error(typeof json.message === "string" && json.message ? json.message : "Failed to create subscription checkout.");
      }

      if (typeof json.checkoutUrl === "string" && json.checkoutUrl && typeof window !== "undefined") {
        window.location.assign(json.checkoutUrl);
        return;
      }

      setMessageTone("info");
      setMessage("Subscription checkout started.");
      onOpenChange(false);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to create subscription checkout.");
    } finally {
      setLoadingPlanKey(null);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      aria-labelledby={dialogTitleId}
      aria-modal="true"
      className={styles.subscriptionDialogOverlay}
      onKeyDown={handleDialogKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loadingPlanKey) {
          onOpenChange(false);
        }
      }}
      role="dialog"
    >
      <div className={styles.subscriptionDialogPanel} ref={dialogPanelRef} tabIndex={-1}>
        <h2 className={styles.srOnly} id={dialogTitleId}>
          Subscription offers
        </h2>
        <SubscriptionPanel
          className={styles.subscriptionDialogFrame}
          billingCycle={billingCycle}
          compact
          currencies={["USD"]}
          emptyMessage="Subscription plans are temporarily unavailable."
          onClose={() => onOpenChange(false)}
          onBillingCycleChange={setBillingCycle}
          onSubscribe={handleSubscribe}
          plans={panelPlans}
        />
        {paymentProviderNotice || message ? (
          <p
            aria-live="polite"
            className={[
              styles.subscriptionDialogMessage,
              messageTone === "error" ? styles.subscriptionDialogMessageError : "",
            ].filter(Boolean).join(" ")}
            role="status"
          >
            {message || paymentProviderNotice}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function AuthEntryButtons({
  loginHref,
}: {
  loginHref: string;
}) {
  const { openAuthModal } = useAuthModal();
  void loginHref;

  return (
    <button className={styles.authEntry} onClick={() => openAuthModal("login")} type="button">
      <img alt="" aria-hidden="true" className={styles.authEntryBg} decoding="async" src="/ui/nav/auth-pill.png" />
      <span className={styles.authEntryText}>Log in / Sign up</span>
    </button>
  );
}

const getUserCredits = (user: TopNavigationUser, fallback: number) => {
  const value = user.creditsBalance ?? user.credits;
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : fallback;
};

export function TopNavigation({
  active = "WORKBENCH",
  className,
  credits = 560,
  creditTopupProducts = emptyCreditTopupProducts,
  fitViewport = false,
  items = defaultNavItems,
  loginHref = "/login",
  paymentProviderNotice = "",
  showAuthEntry = true,
  stripeSubscriptionsEnabled = true,
  subscriptionPlans = emptySubscriptionPlans,
  subscriptionPromotion,
  user = null,
  userName = null,
}: TopNavigationProps) {
  const { closeAuthModal } = useAuthModal();
  const subscriptionPromotionButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuTriggerRef = useRef<HTMLDivElement>(null);
  const [loadedDialogProducts, setLoadedDialogProducts] = useState<null | CreditTopupProduct[]>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreditTopupOpen, setIsCreditTopupOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [hasRequestedDialogProducts, setHasRequestedDialogProducts] = useState(false);
  const displayName = user ? getTopNavigationUserLabel(user, userName) : null;
  const visibleDisplayName = displayName ? formatTopNavigationUserLabel(displayName) : null;
  const displayCredits = user ? getUserCredits(user, credits) : credits;
  const avatarUrl = user?.avatarUrl || `${assetBase}/icon-user-avatar-placeholder.png`;
  const resolvedSubscriptionPromotion = resolveSubscriptionPromotion(subscriptionPromotion);
  const showSubscriptionPromotion = Boolean(
    resolvedSubscriptionPromotion &&
      resolvedSubscriptionPromotion.enabled &&
      (!user || user?.hasActiveSubscription !== true),
  );
  const dialogProducts = creditTopupProducts.length > 0
    ? creditTopupProducts
    : loadedDialogProducts ?? emptyCreditTopupProducts;

  const openCreditTopupDialog = () => {
    setIsCreditTopupOpen(true);

    if (hasRequestedDialogProducts || dialogProducts.length > 0) return;

    setHasRequestedDialogProducts(true);
    void fetchCreditTopupProducts().then((products) => {
      setLoadedDialogProducts(products);
    });
  };

  const topNav = (
    <div
      className={[styles.topNav, fitViewport ? null : className].filter(Boolean).join(" ")}
      data-authenticated={user ? "true" : "false"}
      data-subscription-promotion-visible={showSubscriptionPromotion ? "true" : "false"}
    >
      <img alt="" className={styles.navBg} decoding="async" fetchPriority="high" src={`${assetBase}/nav-background.png`} />
      <img alt="Thorns Tavern" className={styles.logo} decoding="async" fetchPriority="high" src={`${assetBase}/logo-wordmark.png`} />
      <img alt="" className={styles.navCenter} decoding="async" src={`${assetBase}/nav-center-separator.png`} />
      <div className={styles.navLinks}>
        {items.map((item) => (
          <Link
            className={`${styles.navLink} ${item.id === active ? styles.activeNav : ""}`}
            href={item.href}
            key={item.id}
            onClick={closeAuthModal}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {showSubscriptionPromotion && resolvedSubscriptionPromotion ? (
        <SubscriptionPromotionButton
          buttonRef={subscriptionPromotionButtonRef}
          onClick={() => setIsSubscriptionDialogOpen(true)}
          promotion={resolvedSubscriptionPromotion}
        />
      ) : null}
      {user ? (
        <>
          <button aria-label="Open point redemption" className={styles.wallet} onClick={openCreditTopupDialog} type="button">
            <img alt="" decoding="async" src={`${assetBase}/icon-coin-badge.png`} />
            <span>{displayCredits}</span>
          </button>
          <NotificationBellButton authenticated />
          <CartIconButton />
          <div className={styles.userMenuTrigger} ref={userMenuTriggerRef}>
            <button
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className={styles.avatar}
              onClick={() => setIsUserMenuOpen((current) => !current)}
              type="button"
            >
              <img alt={displayName || "Account avatar"} decoding="async" src={avatarUrl} />
            </button>
            <button
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              className={styles.userName}
              onClick={() => setIsUserMenuOpen((current) => !current)}
              title={displayName ?? undefined}
              type="button"
            >
              {visibleDisplayName}
            </button>
          </div>
          <TopNavigationUserMenu
            onPointRedemption={openCreditTopupDialog}
            onOpenChange={setIsUserMenuOpen}
            open={isUserMenuOpen}
            triggerRef={userMenuTriggerRef}
            user={user}
            userLabel={visibleDisplayName || displayName || "Account"}
          />
        </>
      ) : (
        <>
          <NotificationBellButton authenticated={false} />
          <CartIconButton />
          <span className={styles.authAvatar} aria-hidden="true">
            <img alt="" decoding="async" src={`${assetBase}/icon-user-avatar-placeholder.png`} />
          </span>
          {showAuthEntry ? (
            <AuthEntryButtons loginHref={loginHref} />
          ) : null}
        </>
      )}
      {user ? (
        <CreditTopupRedemptionDialog
          onOpenChange={setIsCreditTopupOpen}
          open={isCreditTopupOpen}
          products={dialogProducts}
        />
      ) : null}
      {showSubscriptionPromotion ? (
        <SubscriptionOfferDialog
          authenticated={Boolean(user)}
          initialPaymentProviderNotice={paymentProviderNotice}
          initialPlans={subscriptionPlans}
          initialStripeSubscriptionsEnabled={stripeSubscriptionsEnabled}
          onOpenChange={setIsSubscriptionDialogOpen}
          open={isSubscriptionDialogOpen}
          restoreFocusRef={subscriptionPromotionButtonRef}
        />
      ) : null}
    </div>
  );

  if (fitViewport) {
    return (
      <div className={[styles.scaledTopNav, className].filter(Boolean).join(" ")}>
        <div className={styles.scaledTopNavStage}>{topNav}</div>
      </div>
    );
  }

  return topNav;
}
