"use client";

import { useMemo, useState } from "react";

import type { HomeInspirationFilter, HomeInspirationItem, HomeShelfItem } from "@/app/(frontend)/_home/homeData";
import { LinkedSourcePurpleMediumButton } from "@/components/ui-lab/action-buttons";
import { InspirationGridCard } from "@/components/ui-lab/home-test/inspiration-grid";
import { InspirationPager, InspirationSearchBox } from "@/components/ui-lab/home-test/inspiration-search-box";
import { SelectableFrameRow } from "@/components/ui-lab/home-test/selectable-frame-row";
import { SmallButtonPair, SmallButtonTriple } from "@/components/ui-lab/small-button-pair/small-button-pair";

import styles from "./testHomePage.module.css";

type BundleFilter = "hot" | "new";
type InspirationFilter = HomeInspirationFilter | "all";
type TripleButtonId = "button" | "dark" | "purple";

const moreItemId = "all-bundles";

const filterByButtonId: Record<TripleButtonId, HomeInspirationFilter> = {
  purple: "text3d",
  dark: "image3d",
  button: "image-tools",
};

const buttonIdByFilter: Record<HomeInspirationFilter, TripleButtonId> = {
  text3d: "purple",
  image3d: "dark",
  "image-tools": "button",
};

type TestHomeBundlePanelProps = {
  items: HomeShelfItem[];
};

type TestHomeInspirationPanelProps = {
  items: HomeInspirationItem[];
  page: number;
  pageSize: number;
  query: string;
  totalPages: number;
};

export function TestHomeBundlePanel({ items }: TestHomeBundlePanelProps) {
  const [filter, setFilter] = useState<BundleFilter>("hot");
  const visibleItems = useMemo(() => {
    const moreItem = items.find((item) => item.id === moreItemId);
    const contentItems = items.filter((item) => item.id !== moreItemId);
    const offset = filter === "hot" ? 0 : 1;
    const nextItems = contentItems.slice(offset, offset + 3);

    return moreItem ? [...nextItems, moreItem] : nextItems;
  }, [filter, items]);

  return (
    <>
      <header className={styles.frameHeader}>
        <span className={styles.frameLogo} aria-hidden="true" />
        <span className={styles.frameTitlePlate}>Bundles</span>
        <span className={styles.frameDivider} aria-hidden="true" />
        <div className={styles.frameActions}>
          <SmallButtonPair
            darkLabel="New"
            onChange={(button) => setFilter(button === "purple" ? "hot" : "new")}
            purpleLabel="Hot"
            selected={filter === "hot" ? "purple" : "dark"}
            tone="purple"
          />
          <div className={styles.frameMoreAction}>
            <LinkedSourcePurpleMediumButton href="/bundles" label="More" />
          </div>
        </div>
      </header>
      <div className={styles.bundleFrameBody}>
        <SelectableFrameRow fillEmptyFrames={false} items={visibleItems} />
      </div>
    </>
  );
}

export function TestHomeInspirationPanel({ items, page, pageSize, query, totalPages }: TestHomeInspirationPanelProps) {
  const [filter, setFilter] = useState<InspirationFilter>("all");
  const selectedButton = filter === "all" ? null : buttonIdByFilter[filter];
  const filteredItems = filter === "all" ? items : items.filter((item) => item.filter === filter);

  return (
    <>
      <header className={styles.frameHeader}>
        <span className={styles.frameLogo} aria-hidden="true" />
        <span className={styles.frameTitlePlate}>Inspiration</span>
        <span className={styles.frameDivider} aria-hidden="true" />
        <div className={styles.frameActions}>
          <SmallButtonTriple
            labels={{
              purple: "Text To 3D",
              dark: "Image To 3D",
              button: "Image Tools",
            }}
            onChange={(button) => {
              const nextFilter = filterByButtonId[button];
              setFilter((current) => (current === nextFilter ? "all" : nextFilter));
            }}
            selected={selectedButton}
          />
        </div>
      </header>
      <div className={styles.inspirationFrameBody}>
        <div className={styles.inspirationSearchMount}>
          <InspirationSearchBox basePath="/test-home" page={page} pageSize={pageSize} query={query} totalPages={totalPages} />
        </div>
        <span className={styles.inspirationGridDivider} aria-hidden="true" />
        <div className={styles.inspirationGrid} aria-label="Inspiration grid">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => <InspirationGridCard item={item} key={item.id} />)
          ) : (
            <div className={styles.inspirationEmptyState}>No Models Found</div>
          )}
        </div>
        <div className={styles.bottomPagerMount}>
          <InspirationPager basePath="/test-home" page={page} query={query} totalPages={totalPages} />
        </div>
      </div>
    </>
  );
}
