/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { FrameButton } from "@/components/ui/frame-button";
import { BorderComboFrame1 } from "@/components/ui-lab/border-combo-frame-1";
import { getSupabasePreviewImageURL } from "@/lib/supabase/imageTransform";

import styles from "./follow-creator-card.module.css";

export type FollowCreatorCardCarouselItem = {
  alt: string;
  id: string;
  imageSrc: string;
};

export type FollowCreatorCardData = {
  avatarAlt?: string;
  avatarSrc?: string;
  followerCount?: string;
  items?: FollowCreatorCardCarouselItem[];
  modelCount?: string;
  name?: string;
};

type FollowCreatorCardProps = FollowCreatorCardData & {
  className?: string;
  defaultMenuOpen?: boolean;
  style?: CSSProperties;
};

const assetBase = "/ui-lab/top-navigation";

const defaultItems: FollowCreatorCardCarouselItem[] = [
  {
    alt: "Mage model thumbnail",
    id: "mage",
    imageSrc: "/ui-lab/model-detail-uicut/images/detail-side-img.png",
  },
  {
    alt: "Warrior model thumbnail",
    id: "warrior",
    imageSrc: "/ui-lab/model-detail-uicut/images/detail-side-img-1.png",
  },
  {
    alt: "Monk model thumbnail",
    id: "monk",
    imageSrc: "/ui-lab/workbench-assets/monk-thumb.png",
  },
];

export function FollowCreatorCard({
  avatarAlt = "Xing Mu avatar",
  avatarSrc = "/ui/workbench/model-detail/sketch-assets/creator-avatar.jpg",
  className,
  defaultMenuOpen = true,
  followerCount = "560",
  items = defaultItems,
  modelCount = "23",
  name = "Xing Mu",
  style,
}: FollowCreatorCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(defaultMenuOpen);

  return (
    <BorderComboFrame1
      className={[styles.card, className].filter(Boolean).join(" ")}
      contentClassName={styles.frameContent}
      style={style}
    >
      <article className={styles.panel} aria-label={`${name} creator card`}>
        <button
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-label="Creator actions"
          className={styles.menuButton}
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" size={22} strokeWidth={2.4} />
        </button>

        {isMenuOpen ? (
          <div className={styles.menuPopover} role="menu">
            <button className={styles.menuItemPrimary} role="menuitem" type="button">
              Not interested
            </button>
            <button className={styles.menuItem} role="menuitem" type="button">
              Complaint
            </button>
          </div>
        ) : null}

        <div className={styles.profile}>
          <div className={styles.avatarWrap}>
            <span className={styles.avatarRing}>
              <img alt={avatarAlt} className={styles.avatarImage} decoding="async" src={avatarSrc} />
            </span>
            <span className={styles.avatarBadge}>KICK</span>
          </div>
          <strong className={styles.name}>{name}</strong>
        </div>

        <div className={styles.stats} aria-label="Creator stats">
          <span className={styles.stat}>
            <img alt="" className={styles.statIcon} src={`${assetBase}/profile-menu-icon-users@2x.png`} />
            <span>{followerCount}</span>
          </span>
          <span className={styles.stat}>
            <img alt="" className={styles.statIcon} src={`${assetBase}/profile-menu-icon-models@2x.png`} />
            <span>{modelCount}</span>
          </span>
        </div>

        <FrameButton className={styles.followButton} height={48} selected type="button" variant="slate" width={198}>
          Followed
        </FrameButton>

        <div className={styles.carousel} aria-label="Creator model carousel">
          <button aria-label="Previous model" className={[styles.arrowButton, styles.arrowLeft].join(" ")} type="button" />
          <div className={styles.thumbStrip}>
            {items.slice(0, 3).map((item) => (
              <button aria-label={item.alt} className={styles.thumb} key={item.id} type="button">
                <img alt="" className={styles.thumbImage} decoding="async" src={getSupabasePreviewImageURL(item.imageSrc, "model-card")} />
              </button>
            ))}
          </div>
          <button aria-label="Next model" className={[styles.arrowButton, styles.arrowRight].join(" ")} type="button" />
        </div>
      </article>
    </BorderComboFrame1>
  );
}
