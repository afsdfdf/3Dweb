/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

import { HeroProductRibbon } from "@/components/ui-lab/hero-product-ribbon";

import styles from "./hero-image-frame-strip.module.css";

export type HeroImageFrameStripItem = {
  alt?: string;
  href?: null | string;
  id: string;
  imageSrc?: null | string;
  ribbonLabel?: string;
};

const frames = [
  {
    id: "hero-large",
    label: "Hero image 1",
    ribbonLabel: "New Product",
    className: styles.largeFrame,
  },
  {
    id: "hero-small-1",
    label: "Hero image 2",
    ribbonLabel: "New Product",
    className: styles.smallFrame,
  },
  {
    id: "hero-small-2",
    label: "Hero image 3",
    ribbonLabel: "New Product",
    className: styles.smallFrame,
  },
  {
    id: "hero-small-3",
    label: "Hero image 4",
    ribbonLabel: "New Product",
    className: styles.lastFrame,
  },
];

type HeroImageFrameStripProps = {
  items?: HeroImageFrameStripItem[];
};

export function HeroImageFrameStrip({ items = [] }: HeroImageFrameStripProps) {
  const visibleItems = items.filter((item) => Boolean(item.imageSrc));
  const resolvedFrames = frames.slice(0, visibleItems.length).map((frame, index) => ({
    ...frame,
    ...visibleItems[index],
    className: frame.className,
    id: visibleItems[index]?.id ?? frame.id,
    label: visibleItems[index]?.alt ?? frame.label,
    ribbonLabel: visibleItems[index]?.ribbonLabel ?? frame.ribbonLabel,
  }));
  const [selectedId, setSelectedId] = useState(resolvedFrames[0]?.id ?? frames[0].id);
  const handleFrameClick = (frame: (typeof resolvedFrames)[number]) => {
    setSelectedId(frame.id);
    if (frame.href) window.location.assign(frame.href);
  };

  return (
    <div className={styles.strip} aria-label="Hero image frame strip">
      {resolvedFrames.map((frame, index) => (
        <button
          aria-label={frame.label}
          aria-pressed={selectedId === frame.id}
          className={[styles.frame, frame.className].join(" ")}
          key={frame.id}
          onClick={() => handleFrameClick(frame)}
          type="button"
        >
          {frame.imageSrc ? (
            <img
              alt=""
              className={styles.frameImage}
              decoding="async"
              fetchPriority={index === 0 ? "high" : "auto"}
              loading={index === 0 ? "eager" : "lazy"}
              src={frame.imageSrc}
            />
          ) : null}
          <HeroProductRibbon className={styles.frameRibbon} label={frame.ribbonLabel} />
        </button>
      ))}
    </div>
  );
}
