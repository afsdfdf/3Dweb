/* eslint-disable @next/next/no-img-element */
"use client";

import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";
import { FollowCreatorCard } from "@/components/ui-lab/follow-creator-card";
import type { FollowCreatorCardData } from "@/components/ui-lab/follow-creator-card";
import { SmallButtonTriple } from "@/components/ui-lab/small-button-pair/small-button-pair";
import type { HomeInspirationDisplayFilter, HomeInspirationFilter } from "@/app/(frontend)/_home/homeData";
import { getSupabasePreviewImageURL } from "@/lib/supabase/imageTransform";

import styles from "./inspiration-grid.module.css";

export type InspirationGridFilter = HomeInspirationDisplayFilter;

type TripleFilterId = "button" | "dark" | "purple";

const filterByButtonId: Record<TripleFilterId, InspirationGridFilter> = {
  purple: "all",
  dark: "follow",
  button: "followed",
};

const buttonIdByFilter: Record<InspirationGridFilter, TripleFilterId> = {
  all: "purple",
  follow: "dark",
  followed: "button",
};

const defaultInspirationGridFilter: InspirationGridFilter = "all";

function getVisibleGridItems(items: InspirationGridItem[], filter: InspirationGridFilter) {
  if (filter === "followed") return items.filter((item) => item.isAuthorFollowed);
  if (filter === "follow") return items.filter((item) => !item.isAuthorFollowed);
  return items;
}

function getInitials(name?: null | string) {
  if (!name) return "TT";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "TT";
}

export type InspirationGridItem = {
  ageLabel?: string;
  alt?: string;
  authorName?: string;
  avatarSrc?: null | string;
  creatorCard?: FollowCreatorCardData | null;
  favoritesLabel?: string;
  filter?: HomeInspirationFilter;
  href?: null | string;
  id: string;
  imageSrc?: null | string;
  isAuthorFollowed?: boolean;
  likesLabel?: string;
  title?: string;
  viewsLabel?: string;
};

type InspirationGridProps = {
  filterMountClassName?: string;
  items?: InspirationGridItem[];
};

type InspirationGridCardProps = {
  item: InspirationGridItem;
  onActivate?: (item: InspirationGridItem) => void;
  onSelect?: (item: InspirationGridItem) => void;
  selected?: boolean;
};

export function InspirationGridCard({ item, onActivate, onSelect, selected = false }: InspirationGridCardProps) {
  const avatarRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ left: number; top: number } | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current === null) return;

    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const schedulePopoverClose = () => {
    if (closeTimerRef.current !== null) return;

    closeTimerRef.current = window.setTimeout(() => {
      setPopoverPosition(null);
      closeTimerRef.current = null;
    }, 160);
  };

  const showCreatorPopover = () => {
    if (!item.creatorCard || !avatarRef.current) return;

    clearCloseTimer();
    const rect = avatarRef.current.getBoundingClientRect();
    setPopoverPosition({
      left: rect.left - 18,
      top: rect.top + 52,
    });
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current === null) return;

      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    };
  }, []);

  const handleClick = () => {
    onSelect?.(item);

    if (onActivate) {
      onActivate(item);
      return;
    }

    if (item.href) window.location.assign(item.href);
  };

  const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    if (!item.creatorCard || !avatarRef.current) return;

    const rect = avatarRef.current.getBoundingClientRect();
    const isOverAvatar =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (isOverAvatar) {
      showCreatorPopover();
      return;
    }

    if (popoverPosition) schedulePopoverClose();
  };

  const creatorPopover =
    item.creatorCard && popoverPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            className={styles.creatorPopover}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={schedulePopoverClose}
            style={{ left: popoverPosition.left, top: popoverPosition.top }}
          >
            <FollowCreatorCard {...item.creatorCard} defaultMenuOpen={false} />
          </div>,
          document.body,
        )
      : null;

  return (
    <button
      aria-label={item.title}
      aria-pressed={selected}
      className={styles.item}
      onClick={handleClick}
      onMouseLeave={schedulePopoverClose}
      onMouseMove={handleMouseMove}
      type="button"
    >
      <ButtonBoxFrame
        className={styles.cardFrame}
        contentClassName={styles.cardFrameContent}
        selected={selected}
        style={{
          height: "var(--inspiration-card-height, 460px)",
          width: "var(--inspiration-card-width, 288px)",
        }}
      >
        <article className={styles.cardContent}>
          <header className={styles.cardHeader}>
            <div className={styles.avatarWrap} ref={avatarRef}>
              {item.avatarSrc ? (
                <img
                  alt=""
                  className={styles.avatar}
                  decoding="async"
                  loading="lazy"
                  src={item.avatarSrc}
                />
              ) : (
                <span className={styles.avatarFallback}>{getInitials(item.authorName)}</span>
              )}
              <span className={styles.avatarBadge} aria-hidden="true" />
            </div>
            <div className={styles.titleBlock}>
              <div className={styles.titleRow}>
                <strong className={styles.name}>{item.authorName}</strong>
                <span className={styles.time}>{item.ageLabel}</span>
              </div>
              <div className={styles.stats}>
                <span className={styles.stat}>
                  <img alt="" decoding="async" loading="lazy" src="/ui-lab/formal-components/assets/inspiration-card/icon-eye-gray.png" />
                  {item.viewsLabel}
                </span>
                <span className={styles.stat}>
                  <img alt="" decoding="async" loading="lazy" src="/ui-lab/formal-components/assets/inspiration-card/icon-heart-gray.png" />
                  {item.likesLabel}
                </span>
                <span className={styles.stat}>
                  <img alt="" decoding="async" loading="lazy" src="/ui-lab/formal-components/assets/inspiration-card/icon-star-gray.png" />
                  {item.favoritesLabel}
                </span>
              </div>
            </div>
          </header>
          <div className={styles.previewArea} aria-hidden="true">
            {item.imageSrc ? (
              <img
                alt=""
                className={styles.previewImage}
                decoding="async"
                loading="lazy"
                src={getSupabasePreviewImageURL(item.imageSrc, "model-card")}
              />
            ) : (
              <div className={styles.previewFallback}>
                <span className={styles.previewFallbackLogo} />
                <strong>Preview Pending</strong>
                <em>Artwork will appear after publishing</em>
              </div>
            )}
          </div>
        </article>
      </ButtonBoxFrame>
      {creatorPopover}
    </button>
  );
}

export function InspirationGrid({ filterMountClassName, items: backendItems = [] }: InspirationGridProps) {
  const [filter, setFilter] = useState<InspirationGridFilter>(defaultInspirationGridFilter);
  const [selectedItemId, setSelectedItemId] = useState<null | string>(null);
  const selectedButton = buttonIdByFilter[filter];
  const filteredItems = getVisibleGridItems(backendItems, filter);
  const activeSelectedItemId = filteredItems.some((item) => item.id === selectedItemId)
    ? selectedItemId
    : null;
  const handleFilterChange = (button: TripleFilterId) => {
    setFilter(filterByButtonId[button]);
  };
  const handleItemClick = (item: (typeof backendItems)[number]) => {
    setSelectedItemId(item.id);
    if (item.href) window.location.assign(item.href);
  };

  return (
    <>
      <div className={filterMountClassName}>
        <SmallButtonTriple
          labels={{
            purple: "All",
            dark: "Follow",
            button: "Followed",
          }}
          onChange={handleFilterChange}
          selected={selectedButton}
        />
      </div>
      <div className={styles.grid} aria-label="Inspiration grid">
        {filteredItems.length > 0 ? filteredItems.map((item) => (
        <InspirationGridCard
          item={item}
          key={item.id}
          onActivate={handleItemClick}
          selected={item.id === activeSelectedItemId}
        />
      )) : (
        <div className={styles.emptyState}>No Models Found</div>
      )}
    </div>
    </>
  );
}
