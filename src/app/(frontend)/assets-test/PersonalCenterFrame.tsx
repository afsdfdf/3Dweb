import type { CSSProperties, ReactNode } from "react";

import styles from "./personalCenterFrame.module.css";

/**
 * Gold art-deco framed panel assembled from the personal-center 5x5 slice
 * set (public/ui-lab/personal-center-test/frame-5x5). Mirrors the table
 * layout documented in personal-center-frame-5x5.html: fixed corner /
 * divider tracks with stretching fill tracks between them.
 */
const SLICE_BASE = "/ui-lab/personal-center-test/frame-5x5/personal-center-frame";

const columnParts = ["left-outer", "left-fill", "center-divider", "right-fill", "right-outer"] as const;
const fullRows = ["top", "upper", "middle", "lower", "bottom"] as const;
const compactRows = ["top", "upper", "bottom"] as const;

type PersonalCenterFrameProps = {
  children?: ReactNode;
  className?: string;
  /** Three-row variant (no mid-edge ornaments) for short panels like the profile banner. */
  compact?: boolean;
  contentClassName?: string;
  style?: CSSProperties;
};

export function PersonalCenterFrame({ children, className, compact = false, contentClassName, style }: PersonalCenterFrameProps) {
  const rows = compact ? compactRows : fullRows;

  return (
    <div className={[styles.frame, className].filter(Boolean).join(" ")} style={style}>
      <span aria-hidden="true" className={styles.interior} />
      <div aria-hidden="true" className={[styles.grid, compact ? styles.gridCompact : ""].filter(Boolean).join(" ")}>
        {rows.flatMap((row) =>
          columnParts.map((column) => (
            <span
              key={`${row}-${column}`}
              style={{ backgroundImage: `url("${SLICE_BASE}-${row}-${column}.png")` }}
            />
          )),
        )}
      </div>
      <div className={[styles.content, contentClassName].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}
