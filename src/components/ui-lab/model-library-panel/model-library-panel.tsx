"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ModelLibraryCard } from "@/components/ui-lab/model-library-card";
import { ModuleCommonFrame } from "@/components/ui-lab/module-common-frame";

import styles from "./model-library-panel.module.css";

export type ModelLibraryPanelCard = {
  date?: string;
  generationProgress?: number;
  generationState?: "failed" | "generating";
  generationStatusLabel?: string;
  generationTaskCode?: null | string;
  generationTaskId?: null | number;
  id: number;
  kind?: "image" | "model";
  license: string;
  menu?: boolean;
  modelSrc?: null | string;
  name?: string;
  previewAlt?: string;
  previewSrc?: null | string;
  sourceAsset?: {
    bucket?: string;
    contentType: string;
    fileName: string;
    mediaId?: number;
    path?: string;
    publicUrl: string;
  };
};

type ModelLibraryPanelProps = {
  cards?: ModelLibraryPanelCard[];
  className?: string;
  onSelectCard?: (card: ModelLibraryPanelCard) => void;
  style?: CSSProperties;
  title?: string;
};

const defaultCards: ModelLibraryPanelCard[] = [];

const transparentImageSrc =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const libraryGridColumns = 2;
const libraryCardHeight = 323;
const libraryInitialVisibleCount = 6;
const libraryPageSize = 10;

export function ModelLibraryPanel({
  cards = defaultCards,
  className,
  onSelectCard,
  style,
  title = "Model Library",
}: ModelLibraryPanelProps) {
  const [activePage, setActivePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState(cards[0]?.id ?? 1);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [visiblePreviewCount, setVisiblePreviewCount] = useState(
    libraryInitialVisibleCount,
  );
  const isEmpty = cards.length === 0;
  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cards;

    return cards.filter((card) => {
      return [card.name, card.license, card.date, card.generationStatusLabel, card.kind]
        .filter((value): value is string => typeof value === "string")
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [cards, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / libraryPageSize));
  const pageCards = filteredCards.slice(
    (activePage - 1) * libraryPageSize,
    activePage * libraryPageSize,
  );
  const isFilteredEmpty = !isEmpty && filteredCards.length === 0;
  const selectedCardId = filteredCards.some((card) => card.id === selectedCard)
    ? selectedCard
    : filteredCards[0]?.id ?? 1;
  const selectedCardIndex = Math.max(
    0,
    pageCards.findIndex((card) => card.id === selectedCardId),
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
    setActivePage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setActivePage(1);
  }, [searchQuery]);

  useEffect(() => {
    window.requestAnimationFrame(updateVisiblePreviews);
  }, [pageCards, updateVisiblePreviews]);

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
        <button
          aria-label="Previous page"
          disabled={activePage <= 1}
          onClick={() => setActivePage((current) => Math.max(1, current - 1))}
          type="button"
        >
          &lt;
        </button>
        <button className={styles.pageActive} type="button">
          {activePage}
        </button>
        <button
          aria-label="Next page"
          disabled={activePage >= totalPages}
          onClick={() => setActivePage((current) => Math.min(totalPages, current + 1))}
          type="button"
        >
          &gt;
        </button>
      </div>
      {isEmpty || isFilteredEmpty ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true" />
          <p>{isFilteredEmpty ? "No Matches Found" : "No Models Available"}</p>
        </div>
      ) : (
        <>
          <div
            className={styles.cardGrid}
            onScroll={updateVisiblePreviews}
            ref={gridRef}
          >
            {pageCards.map((card, index) => (
              <ModelLibraryCard
                date={card.date}
                key={`${card.kind || "model"}-${card.id}`}
                generationProgress={card.generationProgress}
                generationState={card.generationState}
                generationStatusLabel={card.generationStatusLabel}
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
                    ? card.previewSrc || (card.generationState ? transparentImageSrc : undefined)
                    : transparentImageSrc
                }
                selected={selectedCardId === card.id}
              />
            ))}
          </div>
          <div
            className={styles.bottomPagination}
            aria-label="Library pagination summary"
          >
            <span>{filteredCards.length} Items</span>
          </div>
        </>
      )}
    </aside>
  );
}
