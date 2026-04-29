"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import styles from "./top-navigation.module.css";

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
  items?: TopNavigationItem[];
  loginHref?: string;
  registerHref?: string;
  showAuthEntry?: boolean;
  user?: null | TopNavigationUser;
  userName?: null | string;
};

const defaultNavItems: TopNavigationItem[] = [
  { href: "#home", id: "HOME", label: "HOME" },
  { href: "#workbench", id: "WORKBENCH", label: "WORKBENCH" },
  { href: "#account", id: "ACCOUNT", label: "ACCOUNT" },
  { href: "#admin", id: "ADMIN", label: "ADMIN" },
];

export const migrationTestNavItems: TopNavigationItem[] = [
  { href: "/", id: "HOME", label: "HOME" },
  { href: "/workbench", id: "WORKBENCH", label: "WORKBENCH" },
  { href: "/account", id: "ACCOUNT", label: "ACCOUNT" },
  { href: "/model-detail", id: "DETAIL", label: "DETAIL" },
];

function NotificationBellButton({ count = 0 }: { count?: number }) {
  return (
    <button aria-label="Notifications" className={styles.notificationBellButton} type="button">
      <span className={styles.navActionIcon} aria-hidden="true">
        <img
          alt=""
          className={styles.navActionIconNormal}
          decoding="async"
          src={`${assetBase}/icon-notification-bell-line.png`}
        />
        <img alt="" className={styles.navActionIconActive} decoding="async" src={`${assetBase}/icon-bell-gold.png`} />
      </span>
      {count > 0 ? <span className={styles.notificationBadge}>{count}</span> : null}
    </button>
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
  return (
    <Link className={styles.authEntry} href={loginHref}>
      <img alt="" aria-hidden="true" className={styles.authEntryBg} decoding="async" src="/ui/nav/auth-pill.png" />
      <span className={styles.authEntryText}>Log in / Sign up</span>
    </Link>
  );
}

const getUserLabel = (user: TopNavigationUser, fallback?: null | string) => {
  return user.displayName || user.name || user.email || fallback || "Account";
};

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
  const displayName = user ? getUserLabel(user, userName) : null;
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
          <NotificationBellButton count={2} />
          <CartIconButton />
          <Link aria-label="Account profile" className={styles.avatar} href="/account">
            <img alt={displayName || "Account avatar"} decoding="async" src={avatarUrl} />
          </Link>
          <Link className={styles.userName} href="/account">
            {displayName}
          </Link>
        </>
      ) : (
        <>
          <NotificationBellButton />
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
