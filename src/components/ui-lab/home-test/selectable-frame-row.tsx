/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { getSupabasePreviewImageURL } from "@/lib/supabase/imageTransform";

import styles from "./selectable-frame-row.module.css";

export type SelectableFrameRowItem = {
  alt?: string;
  count?: string;
  href?: null | string;
  id: string;
  imageSrc?: null | string;
  title?: string;
};

const frames = ["Frame 1", "Frame 2", "Frame 3", "Frame 4"];

const arrowImages = {
  left: {
    normal: "/ui-lab/formal-components/assets/arrows/side-arrow-left-dark-normal.png",
    hover: "/ui-lab/formal-components/assets/arrows/side-arrow-left-dark-hover.png",
  },
  right: {
    normal: "/ui-lab/formal-components/assets/arrows/side-arrow-right-dark-normal.png",
    hover: "/ui-lab/formal-components/assets/arrows/side-arrow-right-dark-hover.png",
  },
};

function getProductCountLabel(count?: string) {
  if (!count) return null;
  if (/^products\s*x\d+/i.test(count.trim())) return count.trim();

  const numericValue = count.match(/\d+/)?.[0];
  if (!numericValue) return count.trim();

  return `Products x${numericValue}`;
}

type SelectableFrameRowProps = {
  fillEmptyFrames?: boolean;
  items?: SelectableFrameRowItem[];
};

export function SelectableFrameRow({ fillEmptyFrames = true, items = [] }: SelectableFrameRowProps) {
  const resolvedFrames = fillEmptyFrames
    ? frames.map((label, index) => ({
        ...items[index],
        id: items[index]?.id ?? label,
        label: items[index]?.alt ?? items[index]?.title ?? label,
      }))
    : items.map((item) => ({
        ...item,
        label: item.alt ?? item.title ?? item.id,
      }));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const handleFrameClick = (frame: (typeof resolvedFrames)[number], index: number) => {
    setSelectedIndex(index);
    if (frame.href) window.location.assign(frame.href);
  };

  return (
    <div className={styles.row} aria-label="Selectable frame row" data-fill-empty={fillEmptyFrames ? "true" : "false"}>
      <button
        aria-label="Previous image"
        className={[styles.arrowButton, styles.leftArrow].join(" ")}
        style={{
          "--arrow-normal": `url("${arrowImages.left.normal}")`,
          "--arrow-hover": `url("${arrowImages.left.hover}")`,
        } as CSSProperties}
        type="button"
      />
      <div className={styles.cardsTrack} data-selectable-frame-track="">
        {resolvedFrames.map((frame, index) => {
          const productCountLabel = getProductCountLabel(frame.count);

          return (
            <button
              aria-label={frame.label}
              aria-pressed={selectedIndex === index}
              className={styles.frame}
              key={frame.id}
              onClick={() => handleFrameClick(frame, index)}
              type="button"
            >
              {frame.imageSrc ? (
                <img
                  alt=""
                  className={styles.frameImage}
                  decoding="async"
                  loading="lazy"
                  src={getSupabasePreviewImageURL(frame.imageSrc, "home-feature")}
                />
              ) : null}
              {frame.title || productCountLabel ? (
                <span className={styles.frameMeta}>
                  {frame.title ? <span className={styles.frameTitle}>{frame.title}</span> : null}
                  {productCountLabel ? <span className={styles.frameCount}>{productCountLabel}</span> : null}
                </span>
              ) : null}
              <span className={styles.centerGuide} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <button
        aria-label="Next image"
        className={[styles.arrowButton, styles.rightArrow].join(" ")}
        style={{
          "--arrow-normal": `url("${arrowImages.right.normal}")`,
          "--arrow-hover": `url("${arrowImages.right.hover}")`,
        } as CSSProperties}
        type="button"
      />
    </div>
  );
}
