/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

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

type SelectableFrameRowProps = {
  items?: SelectableFrameRowItem[];
};

export function SelectableFrameRow({ items = [] }: SelectableFrameRowProps) {
  const visibleItems = items.filter((item) => Boolean(item.imageSrc));
  const resolvedFrames = frames.slice(0, visibleItems.length).map((label, index) => ({
    ...visibleItems[index],
    id: visibleItems[index]?.id ?? label,
    label: visibleItems[index]?.alt ?? visibleItems[index]?.title ?? label,
  }));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const handleFrameClick = (frame: (typeof resolvedFrames)[number], index: number) => {
    setSelectedIndex(index);
    if (frame.href) window.location.assign(frame.href);
  };

  return (
    <div className={styles.row} aria-label="Selectable frame row">
      <button
        aria-label="Previous image"
        className={[styles.arrowButton, styles.leftArrow].join(" ")}
        style={{
          "--arrow-normal": `url("${arrowImages.left.normal}")`,
          "--arrow-hover": `url("${arrowImages.left.hover}")`,
        } as CSSProperties}
        type="button"
      />
      {resolvedFrames.map((frame, index) => (
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
              src={frame.imageSrc}
            />
          ) : null}
          {frame.title || frame.count ? (
            <span className={styles.frameMeta}>
              {frame.title ? <span className={styles.frameTitle}>{frame.title}</span> : null}
              {frame.count ? <span className={styles.frameCount}>{frame.count}</span> : null}
            </span>
          ) : null}
          <span className={styles.centerGuide} aria-hidden="true" />
        </button>
      ))}
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
