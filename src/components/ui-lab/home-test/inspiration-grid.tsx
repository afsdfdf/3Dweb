/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";
import { SmallButtonTriple } from "@/components/ui-lab/small-button-pair/small-button-pair";
import type { HomeInspirationFilter } from "@/app/(frontend)/_home/homeData";
import { getSupabasePreviewImageURL } from "@/lib/supabase/imageTransform";

import styles from "./inspiration-grid.module.css";

export type InspirationGridFilter = HomeInspirationFilter | "all";

type TripleFilterId = "button" | "dark" | "purple";

const filterByButtonId: Record<TripleFilterId, InspirationGridFilter> = {
  purple: "text3d",
  dark: "image3d",
  button: "image-tools",
};

const buttonIdByFilter: Record<Exclude<InspirationGridFilter, "all">, TripleFilterId> = {
  text3d: "purple",
  image3d: "dark",
  "image-tools": "button",
};

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
  favoritesLabel?: string;
  filter?: HomeInspirationFilter;
  href?: null | string;
  id: string;
  imageSrc?: null | string;
  likesLabel?: string;
  title?: string;
  viewsLabel?: string;
};

type InspirationGridProps = {
  filterMountClassName?: string;
  items?: InspirationGridItem[];
};

export function InspirationGrid({ filterMountClassName, items: backendItems = [] }: InspirationGridProps) {
  const [filter, setFilter] = useState<InspirationGridFilter>("all");
  const selectedButton = filter === "all" ? null : buttonIdByFilter[filter];
  const filteredItems = filter === "all" ? backendItems : backendItems.filter((item) => item.filter === filter);
  const handleFilterChange = (button: TripleFilterId) => {
    const nextFilter = filterByButtonId[button];
    setFilter((current) => (current === nextFilter ? "all" : nextFilter));
  };
  const handleItemClick = (item: (typeof backendItems)[number]) => {
    if (item.href) window.location.assign(item.href);
  };

  return (
    <>
      <div className={filterMountClassName}>
        <SmallButtonTriple
          labels={{
            purple: "Text To 3D",
            dark: "Image To 3D",
            button: "Image Tools",
          }}
          onChange={handleFilterChange}
          selected={selectedButton}
        />
      </div>
      <div className={styles.grid} aria-label="Inspiration grid">
        {filteredItems.length > 0 ? filteredItems.map((item) => (
        <button
          aria-label={item.title}
          aria-pressed={false}
          className={styles.item}
          key={item.id}
          onClick={() => handleItemClick(item)}
          type="button"
        >
          <ButtonBoxFrame
            className={styles.cardFrame}
            contentClassName={styles.cardFrameContent}
            style={{ width: 288, height: 460 }}
          >
            <article className={styles.cardContent}>
              <header className={styles.cardHeader}>
                <div className={styles.avatarWrap}>
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
                ) : null}
              </div>
            </article>
          </ButtonBoxFrame>
        </button>
      )) : (
        <div className={styles.emptyState}>No Models Found</div>
      )}
    </div>
    </>
  );
}
