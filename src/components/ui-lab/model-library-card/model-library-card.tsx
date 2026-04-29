/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";

import styles from "./model-library-card.module.css";

type ModelLibraryCardProps = {
  className?: string;
  date?: string;
  license?: string;
  menuOpen?: boolean;
  name?: string;
  onClick?: () => void;
  previewAlt?: string;
  previewSrc?: string;
  selected?: boolean;
  style?: CSSProperties;
};

export function ModelLibraryCard({
  className,
  date = "2025.06.27\n20:35:20",
  license = "Public",
  menuOpen = false,
  name = "Monk",
  onClick,
  previewAlt = "Monk library preview",
  previewSrc = "/ui-lab/workbench-assets/monk-large.png",
  selected = false,
  style,
}: ModelLibraryCardProps) {
  const dateLines = date.split("\n");

  return (
    <button
      className={[styles.card, selected ? styles.selected : "", className].filter(Boolean).join(" ")}
      onClick={onClick}
      style={style}
      type="button"
    >
      <ButtonBoxFrame className={styles.frameOverlay} contentClassName={styles.frameContent} />
      <div className={styles.cardTop}>
        <strong>{name}</strong>
        <em>{license}</em>
        <span>...</span>
      </div>
      <p>
        {dateLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      {menuOpen ? (
        <div className={styles.cardMenu}>
          <span>Hide Current Model</span>
          <span>Delete Current Model</span>
        </div>
      ) : null}
      <span className={styles.previewArea}>
        <img alt={previewAlt} className={styles.previewImage} decoding="async" src={previewSrc} />
      </span>
    </button>
  );
}
