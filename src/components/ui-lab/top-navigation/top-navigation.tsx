"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { publicNavigationItems } from "@/lib/publicNavigation";

import styles from "./top-navigation.module.css";
import { formatTopNavigationUserLabel, getTopNavigationUserLabel } from "./user-label";
import { TopNavigationUserMenu } from "./user-menu";

const assetBase = "/ui-lab/top-navigation";

export type TopNavigationItem = {
  href: string;
  id: string;
  label: string;
};

export type TopNavigationUser = {
  avatarUrl?: null | string;
  credits?: null | number;
  creditsBalance?: null | number;
  displayName?: null | string;
  email?: null | string;
  name?: null | string;
};

type TopNavigationProps = {
  active?: string;
  className?: string;
  credits?: number;
  items?: readonly TopNavigationItem[];
  loginHref?: string;
  registerHref?: string;
  showAuthEntry?: boolean;
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

function NotificationBellButton({ authenticated }: { authenticated: boolean }) {
  const { openAuthModal } = useAuthModal();
  const panelRef = useRef<HTMLDivElement>(null);
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

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    setUnreadCount(0);

    await fetch("/api/account/notifications/read-all", {
      method: "POST",
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
        <div aria-label="Notifications" className={styles.notificationPopover} role="dialog">
          <div className={styles.notificationHeader}>
            <div>
              <span>Notifications</span>
              <strong>{hasUnread ? `${unreadCount} unread` : "All caught up"}</strong>
            </div>
            {hasUnread ? (
              <button className={styles.notificationMarkAll} onClick={() => void markAllRead()} type="button">
                Mark all read
              </button>
            ) : null}
          </div>

          <div className={styles.notificationList}>
            {isLoading ? <div className={styles.notificationState}>Loading notifications...</div> : null}
            {!isLoading && loadError ? <div className={styles.notificationState}>{loadError}</div> : null}
            {!isLoading && !loadError && notifications.length === 0 ? (
              <div className={styles.notificationEmpty}>
                <span>No new notices</span>
                <p>Generation results, credit updates, and order changes will appear here.</p>
              </div>
            ) : null}
            {!isLoading && !loadError
              ? notifications.map((item) => {
                  const severityClass =
                    item.severity === "success"
                      ? styles.notificationSeveritySuccess
                      : item.severity === "warning"
                        ? styles.notificationSeverityWarning
                        : item.severity === "critical"
                          ? styles.notificationSeverityCritical
                          : styles.notificationSeverityInfo;
                  const itemClass = [
                    styles.notificationItem,
                    item.readAt ? styles.notificationItemRead : styles.notificationItemUnread,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const content = (
                    <>
                      <span className={`${styles.notificationStatusDot} ${severityClass}`} aria-hidden="true" />
                      <span className={styles.notificationText}>
                        <strong>{item.title}</strong>
                        <span>{item.body}</span>
                        <em>{formatNotificationTime(item.createdAt)}</em>
                      </span>
                    </>
                  );

                  return item.href ? (
                    <Link
                      className={itemClass}
                      href={item.href}
                      key={item.id}
                      onClick={() => {
                        if (!item.readAt) void markNotificationRead(item.id);
                        setIsOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      className={itemClass}
                      key={item.id}
                      onClick={() => {
                        if (!item.readAt) void markNotificationRead(item.id);
                      }}
                      type="button"
                    >
                      {content}
                    </button>
                  );
                })
              : null}
          </div>

          <Link className={styles.notificationFooter} href="/account" onClick={() => setIsOpen(false)}>
            View account activity
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function CartIconButton() {
  return (
    <button aria-label="Cart" className={styles.cartIconButton} type="button">
      <span className={styles.navActionIcon} aria-hidden="true">
        <img alt="" className={styles.navActionIconNormal} decoding="async" src={`${assetBase}/icon-cart-line.png`} />
        <img alt="" className={styles.navActionIconHover} decoding="async" src={`${assetBase}/icon-cart-line-emphasis.png`} />
        <img alt="" className={styles.navActionIconActive} decoding="async" src={`${assetBase}/icon-cart-gold.png`} />
      </span>
    </button>
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
  items = defaultNavItems,
  loginHref = "/login",
  showAuthEntry = true,
  user = null,
  userName = null,
}: TopNavigationProps) {
  const { closeAuthModal } = useAuthModal();
  const userMenuTriggerRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const displayName = user ? getTopNavigationUserLabel(user, userName) : null;
  const visibleDisplayName = displayName ? formatTopNavigationUserLabel(displayName) : null;
  const displayCredits = user ? getUserCredits(user, credits) : credits;
  const avatarUrl = user?.avatarUrl || `${assetBase}/icon-user-avatar-placeholder.png`;

  return (
    <div className={[styles.topNav, className].filter(Boolean).join(" ")} data-authenticated={user ? "true" : "false"}>
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
      {user ? (
        <>
          <button aria-label="Wallet balance" className={styles.wallet} type="button">
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
    </div>
  );
}
