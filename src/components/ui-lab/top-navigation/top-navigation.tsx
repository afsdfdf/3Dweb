"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";
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
  bio?: null | string;
  credits?: null | number;
  creditsBalance?: null | number;
  displayName?: null | string;
  email?: null | string;
  followersCount?: null | number;
  followingCount?: null | number;
  id?: number | string;
  modelsCount?: null | number;
  name?: null | string;
  role?: null | string;
};

type TopNavigationProps = {
  active?: string;
  className?: string;
  credits?: number;
  fitViewport?: boolean;
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

type NotificationTab = "message" | "notification";

const notificationTabs: Array<{ id: NotificationTab; label: string }> = [
  { id: "message", label: "Message" },
  { id: "notification", label: "Notification" },
];

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
  fitViewport = false,
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

  const topNav = (
    <div className={[styles.topNav, fitViewport ? null : className].filter(Boolean).join(" ")} data-authenticated={user ? "true" : "false"}>
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

  if (fitViewport) {
    return (
      <div className={[styles.scaledTopNav, className].filter(Boolean).join(" ")}>
        <div className={styles.scaledTopNavStage}>{topNav}</div>
      </div>
    );
  }

  return topNav;
}
