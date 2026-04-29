"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ModelLibraryCard } from "@/components/ui-lab/model-library-card";
import { ModuleCommonFrame } from "@/components/ui-lab/module-common-frame";

import styles from "./model-library-panel.module.css";

export type ModelLibraryPanelCard = {
  date?: string;
  id: number;
  license: string;
  menu?: boolean;
  modelSrc?: null | string;
  name?: string;
  previewAlt?: string;
  previewSrc?: null | string;
};

type ModelLibraryPanelProps = {
  cards?: ModelLibraryPanelCard[];
  className?: string;
  onSelectCard?: (card: ModelLibraryPanelCard) => void;
  style?: CSSProperties;
  title?: string;
};

const defaultCards: ModelLibraryPanelCard[] = [];

const pages = ["<", "1", ">"];
const transparentImageSrc =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const libraryGridColumns = 2;
const libraryCardHeight = 323;
const libraryInitialVisibleCount = 6;

export function ModelLibraryPanel({
  cards = defaultCards,
  className,
  onSelectCard,
  style,
  title = "Model Library",
}: ModelLibraryPanelProps) {
  const [activePage, setActivePage] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState(cards[0]?.id ?? 1);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [visiblePreviewCount, setVisiblePreviewCount] = useState(
    libraryInitialVisibleCount,
  );
  const isEmpty = cards.length === 0;
  const selectedCardIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === selectedCard),
  );

  const updateVisiblePreviews = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) {
      setVisiblePreviewCount(libraryInitialVisibleCount);
      return;
    }

    const visibleRows = Math.ceil(
      (grid.scrollTop + grid.clientHeight) / libraryCardHeight,
    );
    const nextCount = Math.max(
      libraryInitialVisibleCount,
      (visibleRows + 1) * libraryGridColumns,
    );
    setVisiblePreviewCount((current) => Math.max(current, nextCount));
  }, []);

  useEffect(() => {
    setVisiblePreviewCount(libraryInitialVisibleCount);
    setSelectedCard(cards[0]?.id ?? 1);
    window.requestAnimationFrame(updateVisiblePreviews);
  }, [cards, updateVisiblePreviews]);

  return (
    <aside
      className={[styles.panel, className].filter(Boolean).join(" ")}
      style={style}
    >
      <ModuleCommonFrame
        className={styles.frameOverlay}
        contentClassName={styles.frameContent}
        style={{ width: "100%", height: "100%" }}
      />
      <div className={styles.libraryHeader}>
        <h2>{title}</h2>
        <form onSubmit={(event) => event.preventDefault()}>
          <label>
            <span>Search</span>
            <input
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Keywords"
              type="search"
              value={searchQuery}
            />
          </label>
          <button type="submit">Search</button>
        </form>
      </div>
      <div className={styles.libraryRule} />
      <div className={styles.pagination}>
        {pages.map((item) => (
          <button
            className={item === activePage ? styles.pageActive : ""}
            key={item}
            onClick={() => {
              if (item !== "<" && item !== ">" && item !== "...") {
                setActivePage(item);
              }
            }}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      {isEmpty ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true" />
          <p>No Models Available</p>
        </div>
      ) : (
        <>
          <div
            className={styles.cardGrid}
            onScroll={updateVisiblePreviews}
            ref={gridRef}
          >
            {cards.map((card, index) => (
              <ModelLibraryCard
                date={card.date}
                key={card.id}
                license={card.license}
                menuOpen={card.menu}
                name={card.name}
                onClick={() => {
                  setSelectedCard(card.id);
                  onSelectCard?.(card);
                }}
                previewAlt={card.previewAlt}
                previewSrc={
                  index < visiblePreviewCount || index === selectedCardIndex
                    ? card.previewSrc || undefined
                    : transparentImageSrc
                }
                selected={selectedCard === card.id}
              />
            ))}
          </div>
          <div
            className={styles.bottomPagination}
            aria-label="Library pagination summary"
          >
            <span>10 Items / Page</span>
          </div>
        </>
      )}
    </aside>
  );
}
