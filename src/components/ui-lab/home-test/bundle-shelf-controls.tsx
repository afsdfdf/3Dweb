"use client";

import { useMemo, useState } from "react";

import type { HomeShelfItem } from "@/app/(frontend)/_home/homeData";
import { SmallButtonPair } from "@/components/ui-lab/small-button-pair/small-button-pair";

import { SelectableFrameRow } from "./selectable-frame-row";

type BundleShelfFilter = "hot" | "new";

type BundleShelfControlsProps = {
  controlsClassName?: string;
  items: HomeShelfItem[];
};

const moreItemId = "all-bundles";

export function BundleShelfControls({ controlsClassName, items }: BundleShelfControlsProps) {
  const [filter, setFilter] = useState<BundleShelfFilter>("hot");
  const visibleItems = useMemo(() => {
    const moreItem = items.find((item) => item.id === moreItemId);
    const contentItems = items.filter((item) => item.id !== moreItemId);
    const offset = filter === "hot" ? 0 : 1;
    const nextItems = contentItems.slice(offset, offset + 3);

    return moreItem ? [...nextItems, moreItem] : nextItems;
  }, [filter, items]);

  return (
    <>
      <div className={controlsClassName}>
        <SmallButtonPair
          darkLabel="New"
          onChange={(button) => setFilter(button === "purple" ? "hot" : "new")}
          purpleLabel="Hot"
          selected={filter === "hot" ? "purple" : "dark"}
          tone="purple"
        />
      </div>
      <SelectableFrameRow items={visibleItems} />
    </>
  );
}
