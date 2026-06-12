"use client";

/* eslint-disable @next/next/no-img-element */
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

import { useLocale } from "@/app/(frontend)/_components/LocaleProvider";
import { type Locale } from "@/app/(frontend)/_lib/locale";
import { getTopNavigationUserMenuText } from "@/app/(frontend)/_lib/ui-text";
import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";

import styles from "./user-menu.module.css";
import type { TopNavigationUser } from "./top-navigation";

const assetBase = "/ui-lab/top-navigation";
const fallbackAvatarUrl = `${assetBase}/icon-user-avatar-placeholder.png`;

const profileMenuIcons = {
  account: `${assetBase}/profile-menu-icon-account@2x.png`,
  assetLibrary: `${assetBase}/profile-menu-icon-asset-library@2x.png`,
  check: `${assetBase}/profile-menu-icon-check@2x.png`,
  chevronDown: `${assetBase}/profile-menu-icon-chevron-down@2x.png`,
  language: `${assetBase}/profile-menu-icon-language@2x.png`,
  logout: `${assetBase}/profile-menu-icon-logout@2x.png`,
  models: `${assetBase}/profile-menu-icon-models@2x.png`,
  users: `${assetBase}/profile-menu-icon-users@2x.png`,
} as const;

const languageOptions: Array<{ label: string; locale: Locale }> = [
  { label: "En", locale: "en" },
  { label: "Zh-CN", locale: "zh" },
];

type TopNavigationUserMenuProps = {
  defaultOpen?: boolean;
  onPointRedemption?: () => void;
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

const getCount = (value: null | number | undefined) => {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
};

const getDisplayName = (user: TopNavigationUser, fallback: string) => {
  return (
    (typeof user.displayName === "string" && user.displayName.trim()) ||
    (typeof user.name === "string" && user.name.trim()) ||
    (typeof user.email === "string" && user.email.trim()) ||
    fallback
  );
};

const getBio = (user: TopNavigationUser) => {
  return (typeof user.bio === "string" && user.bio.trim()) || "Is an outstanding anime...";
};

const getLocaleLabel = (locale: Locale) => {
  return languageOptions.find((option) => option.locale === locale)?.label ?? "En";
};

const getCurrentRedirectPath = () => {
  if (typeof window === "undefined") return "/";

  return `${window.location.pathname}${window.location.search}`;
};

export function TopNavigationUserMenu({
  defaultOpen = false,
  onPointRedemption,
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
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(getLocaleLabel(locale));
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;
  const avatarUrl = user.avatarUrl || fallbackAvatarUrl;
  const credits = getCredits(user);
  const displayName = getDisplayName(user, userLabel);
  const bio = getBio(user);
  const followingCount = getCount(user.followingCount ?? user.followersCount);
  const modelsCount = getCount(user.modelsCount);

  const setOpen = useCallback((nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }, [isControlled, onOpenChange]);

  useEffect(() => {
    setSelectedLanguage(getLocaleLabel(locale));
  }, [locale]);

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

  const handleLanguageSelect = (nextLocale: Locale, label: string) => {
    setSelectedLanguage(label);
    setIsLanguageOpen(false);
    window.location.assign(`/api/locale?locale=${nextLocale}&redirect=${encodeURIComponent(getCurrentRedirectPath())}`);
  };

  return (
    <div className={styles.menuAnchor} ref={menuRef}>
      <ButtonBoxFrame
        className={styles.profileMenuReferenceFrame}
        contentClassName={styles.profileMenuReferenceFrameContent}
        style={{ height: 414, width: 320 }}
      >
        <div className={styles.profileMenuReferencePanel}>
          <div className={styles.profileMenuHero}>
            <span className={styles.profileMenuAvatar}>
              <span className={styles.profileMenuAvatarInner}>
                <img alt="" decoding="async" src={avatarUrl} />
              </span>
            </span>

            <div className={styles.profileMenuNamePlate}>
              <strong>{displayName}</strong>
              <span>{bio}</span>
            </div>
          </div>

          <div className={styles.profileMenuStats}>
            <div className={styles.profileMenuCreditPill}>
              <img alt="" src={`${assetBase}/icon-coin-badge.png`} />
              <strong>{credits}</strong>
            </div>
            <div className={styles.profileMenuStat}>
              <img alt="" className={styles.profileMenuStatIcon} src={profileMenuIcons.users} />
              <span>{followingCount}</span>
            </div>
            <div className={styles.profileMenuStat}>
              <img alt="" className={styles.profileMenuStatIcon} src={profileMenuIcons.models} />
              <span>{modelsCount}</span>
            </div>
          </div>

          <div className={styles.profileMenuDivider} />

          <nav className={styles.profileMenuLinks} aria-label="Account quick links">
            <Link className={styles.profileMenuLink} href="/assets" onClick={() => setOpen(false)}>
              <img alt="" className={styles.profileMenuLinkIcon} src={profileMenuIcons.assetLibrary} />
              <span className={styles.profileMenuLinkText}>{text.assetLibrary}</span>
            </Link>
            <Link className={styles.profileMenuLink} href="/account" onClick={() => setOpen(false)}>
              <img alt="" className={styles.profileMenuLinkIcon} src={profileMenuIcons.account} />
              <span className={styles.profileMenuLinkText}>{text.personalCenter}</span>
            </Link>
            <button
              className={styles.profileMenuLink}
              onClick={() => {
                setOpen(false);
                if (onPointRedemption) {
                  onPointRedemption();
                  return;
                }
                router.push("/pricing");
              }}
              type="button"
            >
              <span className={styles.profileMenuPointIcon} aria-hidden="true">
                <Zap size={16} strokeWidth={2.3} />
              </span>
              <span className={styles.profileMenuLinkText}>{text.pointRedemption}</span>
            </button>
            <div className={styles.profileMenuLanguageRow}>
              <span className={styles.profileMenuLanguageLabel}>
                <img alt="" className={styles.profileMenuLinkIcon} src={profileMenuIcons.language} />
                <span className={styles.profileMenuLinkText}>{text.language}</span>
              </span>
              <button
                aria-controls="top-navigation-profile-language-list"
                aria-expanded={isLanguageOpen}
                aria-haspopup="listbox"
                className={styles.profileMenuLanguageButton}
                onClick={() => setIsLanguageOpen((current) => !current)}
                type="button"
              >
                <span>{selectedLanguage}</span>
                <img alt="" className={styles.profileMenuArrowIcon} src={profileMenuIcons.chevronDown} />
              </button>
            </div>
            <button className={styles.profileMenuLink} disabled={isLoggingOut} onClick={handleLogout} type="button">
              <img alt="" className={styles.profileMenuLinkIcon} src={profileMenuIcons.logout} />
              <span className={styles.profileMenuLinkText}>{isLoggingOut ? text.signingOut : text.signOut}</span>
            </button>
          </nav>

          {isLanguageOpen ? (
            <div
              aria-label={text.language}
              className={styles.profileMenuLanguageMenu}
              id="top-navigation-profile-language-list"
              role="listbox"
            >
              {languageOptions.map((option) => {
                const isSelected = selectedLanguage === option.label;

                return (
                  <button
                    aria-selected={isSelected}
                    className={isSelected ? styles.profileMenuLanguageOptionActive : styles.profileMenuLanguageOption}
                    key={option.locale}
                    onClick={() => handleLanguageSelect(option.locale, option.label)}
                    role="option"
                    type="button"
                  >
                    <span>{option.label}</span>
                    {isSelected ? <img alt="" className={styles.profileMenuTickIcon} src={profileMenuIcons.check} /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </ButtonBoxFrame>
    </div>
  );
}
