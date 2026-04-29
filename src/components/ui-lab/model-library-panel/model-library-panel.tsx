"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

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
  const isEmpty = cards.length === 0;

  return (
    <aside className={[styles.panel, className].filter(Boolean).join(" ")} style={style}>
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
          <div className={styles.cardGrid}>
            {cards.map((card) => (
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
                previewSrc={card.previewSrc || undefined}
                selected={selectedCard === card.id}
              />
            ))}
          </div>
          <div className={styles.bottomPagination} aria-label="Library pagination summary">
            <span>10 Items / Page</span>
          </div>
        </>
      )}
    </aside>
  );
}
