"use client";

/* eslint-disable @next/next/no-img-element */
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, PackageOpen, UserRound, WalletCards } from "lucide-react";

import { useLocale } from "@/app/(frontend)/_components/LocaleProvider";
import { getTopNavigationUserMenuText } from "@/app/(frontend)/_lib/ui-text";
import { BorderComboFrame1 } from "@/components/ui-lab/border-combo-frame-1";

import styles from "./user-menu.module.css";
import type { TopNavigationUser } from "./top-navigation";

const fallbackAvatarUrl = "/ui-lab/top-navigation/icon-user-avatar-placeholder.png";

const menuItems = [
  {
    href: "/account",
    icon: UserRound,
    labelKey: "account",
  },
  {
    href: "/account?section=models",
    icon: PackageOpen,
    labelKey: "models",
  },
  {
    href: "/pricing",
    icon: WalletCards,
    labelKey: "plans",
  },
] as const;

type TopNavigationUserMenuProps = {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  triggerRef?: RefObject<HTMLElement | null>;
  user: TopNavigationUser;
  userLabel: string;
};

const getCredits = (user: TopNavigationUser) => {
  const value = user.creditsBalance ?? user.credits;
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
};

export function TopNavigationUserMenu({
  defaultOpen = false,
  onOpenChange,
  open,
  triggerRef,
  user,
  userLabel,
}: TopNavigationUserMenuProps) {
  const router = useRouter();
  const locale = useLocale();
  const text = getTopNavigationUserMenuText(locale);
  const menuRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;
  const avatarUrl = user.avatarUrl || fallbackAvatarUrl;
  const email = typeof user.email === "string" ? user.email : "";
  const credits = getCredits(user);

  const setOpen = useCallback((nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }, [isControlled, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef?.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setOpen, triggerRef]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    await fetch("/api/platform/session/logout", {
      credentials: "include",
      method: "POST",
    }).catch(() => null);
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className={styles.menuAnchor} ref={menuRef}>
      <BorderComboFrame1 className={styles.menuFrame}>
        <div className={styles.menuContent}>
          <div className={styles.userSummary}>
            <span className={styles.avatarRing}>
              <img alt="" decoding="async" src={avatarUrl} />
            </span>
            <div className={styles.userText}>
              <strong>{userLabel}</strong>
              {email ? <span>{email}</span> : null}
            </div>
          </div>

          <div className={styles.creditLine}>
            <span>Credits</span>
            <strong>{credits}</strong>
          </div>

          <nav aria-label="Account quick links" className={styles.menuList}>
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link className={styles.menuItem} href={item.href} key={item.href} onClick={() => setOpen(false)}>
                  <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
                  <span>{text[item.labelKey]}</span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.separator} />

          <button className={[styles.menuItem, styles.logoutItem].join(" ")} disabled={isLoggingOut} onClick={handleLogout} type="button">
            <LogOut aria-hidden="true" size={14} strokeWidth={1.8} />
            <span>{isLoggingOut ? text.signingOut : text.signOut}</span>
          </button>
        </div>
      </BorderComboFrame1>
    </div>
  );
}
