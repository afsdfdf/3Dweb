"use client";

import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useState } from "react";

import { WorkbenchSideContainer } from "./WorkbenchSideContainer";
import styles from "./WorkbenchScaffold.module.css";

const libraryCards = [
  {
    id: 1,
    title: "Monk",
    license: "Public",
    image: "/ui/workbench/monk-card.png",
    date: "2025.06.27",
    time: "20:35:20",
  },
  {
    id: 2,
    title: "Monk Alt",
    license: "Private",
    image: "/ui/workbench/monk-card2.png",
    date: "2025.06.27",
    time: "20:34:18",
  },
  {
    id: 3,
    title: "Dragon",
    license: "Public",
    image: "/ui/frames/new product1.png",
    date: "2025.06.26",
    time: "18:11:02",
  },
  {
    id: 4,
    title: "Knight",
    license: "Public",
    image: "/ui/frames/new product2.png",
    date: "2025.06.26",
    time: "16:42:39",
    menu: true,
  },
  {
    id: 5,
    title: "Golem",
    license: "Public",
    image: "/ui/frames/new product3.png",
    date: "2025.06.25",
    time: "22:07:55",
  },
  {
    id: 6,
    title: "Archer",
    license: "Public",
    image: "/ui/frames/new product4.png",
    date: "2025.06.25",
    time: "19:28:44",
  },
];

export function WorkbenchRightPanel() {
  const [activePage, setActivePage] = useState("1");
  const [selectedCard, setSelectedCard] = useState(1);

  return (
    <WorkbenchSideContainer>
      <div className={styles.rightPanel}>
        <div className={styles.rightHeader}>
          <h3 className={styles.rightTitle}>Model Library</h3>
          <div className={styles.searchGroup}>
            <div className={styles.searchInputWrap}>
              <Search className={styles.searchIcon} size={14} />
              <input
                className={styles.searchInput}
                placeholder="Search Keywords"
                type="text"
              />
            </div>
            <button className={styles.searchButton} type="button">
              Search
            </button>
          </div>
        </div>

        <div className={styles.rightDivider} />

        <div className={styles.rightPagination}>
          {["prev", "1", "2", "3", "4", "...", "10", "next"].map((item) => (
            <button
              className={`${styles.pageButton} ${item === activePage ? styles.pageButtonActive : ""}`}
              key={item}
              onClick={() => {
                if (item !== "prev" && item !== "next" && item !== "...") {
                  setActivePage(item);
                }
              }}
              type="button"
            >
              {item === "prev" ? (
                <ChevronLeft size={14} />
              ) : item === "next" ? (
                <ChevronRight size={14} />
              ) : (
                item
              )}
            </button>
          ))}
        </div>

        <div className={styles.libraryGrid}>
          {libraryCards.map((card) => (
            <button
              className={`${styles.libraryCard} ${selectedCard === card.id ? styles.libraryCardSelected : ""}`}
              key={card.id}
              onClick={() => setSelectedCard(card.id)}
              type="button"
            >
              <span className={styles.cardCornerTopLeft} />
              <span className={styles.cardCornerTopRight} />
              <span className={styles.cardCornerBottomLeft} />
              <span className={styles.cardCornerBottomRight} />

              <div className={styles.libraryCardTop}>
                <div className={styles.libraryCardTitle}>
                  <strong>{card.title}</strong>
                  <span>{card.date}</span>
                  <span>{card.time}</span>
                </div>
                <div className={styles.libraryCardTools}>
                  <em>{card.license}</em>
                  <span>
                    <MoreHorizontal size={13} />
                  </span>
                </div>
              </div>

              {card.menu ? (
                <div className={styles.libraryCardMenu}>
                  <span>Hide Current Model</span>
                  <span>Delete Current Model</span>
                </div>
              ) : null}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={`${card.title} preview`} src={card.image} />
            </button>
          ))}
        </div>
      </div>
    </WorkbenchSideContainer>
  );
}
