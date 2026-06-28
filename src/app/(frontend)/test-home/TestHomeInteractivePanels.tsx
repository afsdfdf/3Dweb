"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";

import type { HomeInspirationDisplayFilter, HomeInspirationItem, HomeShelfItem } from "@/app/(frontend)/_home/homeData";
import { LinkedSourcePurpleMediumButton } from "@/components/ui-lab/action-buttons";
import { BorderComboFrame2Container } from "@/components/ui-lab/border-combo-frame-2";
import { InspirationGridCard } from "@/components/ui-lab/home-test/inspiration-grid";
import { InspirationPager, InspirationSearchBox } from "@/components/ui-lab/home-test/inspiration-search-box";
import { SelectableFrameRow } from "@/components/ui-lab/home-test/selectable-frame-row";
import { SmallButtonPair, SmallButtonTriple } from "@/components/ui-lab/small-button-pair/small-button-pair";

import styles from "./testHomePage.module.css";

type BundleFilter = "hot" | "new";
type InspirationFilter = HomeInspirationDisplayFilter;
type TripleButtonId = "button" | "dark" | "purple";

const moreItemId = "all-bundles";

const filterByButtonId: Record<TripleButtonId, InspirationFilter> = {
  purple: "all",
  dark: "follow",
  button: "followed",
};

const buttonIdByFilter: Record<InspirationFilter, TripleButtonId> = {
  all: "purple",
  follow: "dark",
  followed: "button",
};

const defaultInspirationFilter: InspirationFilter = "all";

type TestHomeFrameProps = {
  className?: string;
  id?: string;
};

type TestHomeBundlePanelProps = {
  items: HomeShelfItem[];
};

type TestHomeBundleFrameProps = TestHomeBundlePanelProps & TestHomeFrameProps;

type TestHomeInspirationPanelProps = {
  basePath?: string;
  items: HomeInspirationItem[];
  page: number;
  pageSize: number;
  query: string;
  totalPages: number;
};

type TestHomeInspirationFrameProps = TestHomeInspirationPanelProps & TestHomeFrameProps;

type BundleFrameHeaderProps = {
  filter: BundleFilter;
  setFilter: Dispatch<SetStateAction<BundleFilter>>;
};

type InspirationFrameHeaderProps = {
  selectedButton: TripleButtonId | null;
  setFilter: Dispatch<SetStateAction<InspirationFilter>>;
};

type BundleFrameBodyProps = {
  visibleItems: HomeShelfItem[];
};

type InspirationFrameBodyProps = {
  basePath: string;
  filteredItems: HomeInspirationItem[];
  page: number;
  pageSize: number;
  query: string;
  totalPages: number;
};

function getVisibleBundleItems(items: HomeShelfItem[], filter: BundleFilter) {
  const moreItem = items.find((item) => item.id === moreItemId);
  const contentItems = items.filter((item) => item.id !== moreItemId);
  const offset = filter === "hot" ? 0 : 1;
  const nextItems = contentItems.slice(offset, offset + 3);

  return moreItem ? [...nextItems, moreItem] : nextItems;
}

function getVisibleInspirationItems(items: HomeInspirationItem[], filter: InspirationFilter) {
  if (filter === "followed") return items.filter((item) => item.isAuthorFollowed);
  if (filter === "follow") return items.filter((item) => !item.isAuthorFollowed);
  return items;
}

function BundleFrameHeader({ filter, setFilter }: BundleFrameHeaderProps) {
  return (
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
  );
}

function BundleFrameBody({ visibleItems }: BundleFrameBodyProps) {
  return (
    <div className={styles.bundleFrameBody}>
      <SelectableFrameRow fillEmptyFrames={false} items={visibleItems} />
    </div>
  );
}

function InspirationFrameHeader({ selectedButton, setFilter }: InspirationFrameHeaderProps) {
  return (
    <header className={styles.frameHeader}>
      <span className={styles.frameLogo} aria-hidden="true" />
      <span className={styles.frameTitlePlate}>Inspiration</span>
      <span className={styles.frameDivider} aria-hidden="true" />
      <div className={styles.frameActions}>
        <SmallButtonTriple
          labels={{
            purple: "All",
            dark: "Follow",
            button: "Followed",
          }}
          onChange={(button) => {
            setFilter((current) => {
              const nextFilter = filterByButtonId[button];
              return current === nextFilter ? "all" : nextFilter;
            });
          }}
          selected={selectedButton}
        />
      </div>
    </header>
  );
}

function InspirationFrameBody({ basePath, filteredItems, page, pageSize, query, totalPages }: InspirationFrameBodyProps) {
  const [selectedItemId, setSelectedItemId] = useState<null | string>(null);
  const activeSelectedItemId = filteredItems.some((item) => item.id === selectedItemId)
    ? selectedItemId
    : null;

  return (
    <div className={styles.inspirationFrameBody}>
      <div className={styles.inspirationSearchMount}>
        <InspirationSearchBox basePath={basePath} page={page} pageSize={pageSize} query={query} totalPages={totalPages} />
      </div>
      <span className={styles.inspirationGridDivider} aria-hidden="true" />
      <div className={styles.inspirationGrid} aria-label="Inspiration grid">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <InspirationGridCard
              item={item}
              key={item.id}
              onSelect={() => setSelectedItemId(item.id)}
              selected={item.id === activeSelectedItemId}
            />
          ))
        ) : (
          <div className={styles.inspirationEmptyState}>No Models Found</div>
        )}
      </div>
      <div className={styles.bottomPagerMount}>
        <InspirationPager basePath={basePath} page={page} query={query} totalPages={totalPages} />
      </div>
    </div>
  );
}

export function TestHomeBundlePanel({ items }: TestHomeBundlePanelProps) {
  const [filter, setFilter] = useState<BundleFilter>("hot");
  const visibleItems = useMemo(() => getVisibleBundleItems(items, filter), [filter, items]);

  return (
    <>
      <BundleFrameHeader filter={filter} setFilter={setFilter} />
      <BundleFrameBody visibleItems={visibleItems} />
    </>
  );
}

export function TestHomeBundleFrame({ className, id, items }: TestHomeBundleFrameProps) {
  const [filter, setFilter] = useState<BundleFilter>("hot");
  const visibleItems = useMemo(() => getVisibleBundleItems(items, filter), [filter, items]);

  return (
    <BorderComboFrame2Container
      className={className}
      header={<BundleFrameHeader filter={filter} setFilter={setFilter} />}
      id={id}
    >
      <BundleFrameBody visibleItems={visibleItems} />
    </BorderComboFrame2Container>
  );
}

export function TestHomeInspirationPanel({ basePath = "/test-home", items, page, pageSize, query, totalPages }: TestHomeInspirationPanelProps) {
  const [filter, setFilter] = useState<InspirationFilter>(defaultInspirationFilter);
  const selectedButton = buttonIdByFilter[filter];
  const filteredItems = getVisibleInspirationItems(items, filter);

  return (
    <>
      <InspirationFrameHeader selectedButton={selectedButton} setFilter={setFilter} />
      <InspirationFrameBody
        basePath={basePath}
        filteredItems={filteredItems}
        page={page}
        pageSize={pageSize}
        query={query}
        totalPages={totalPages}
      />
    </>
  );
}

export function TestHomeInspirationFrame({
  basePath = "/test-home",
  className,
  id,
  items,
  page,
  pageSize,
  query,
  totalPages,
}: TestHomeInspirationFrameProps) {
  const [filter, setFilter] = useState<InspirationFilter>(defaultInspirationFilter);
  const selectedButton = buttonIdByFilter[filter];
  const filteredItems = getVisibleInspirationItems(items, filter);

  return (
    <BorderComboFrame2Container
      className={className}
      header={<InspirationFrameHeader selectedButton={selectedButton} setFilter={setFilter} />}
      id={id}
    >
      <InspirationFrameBody
        basePath={basePath}
        filteredItems={filteredItems}
        page={page}
        pageSize={pageSize}
        query={query}
        totalPages={totalPages}
      />
    </BorderComboFrame2Container>
  );
}
