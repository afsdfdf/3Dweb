import type { CSSProperties, ReactNode } from "react";

import styles from "./border-combo-frame-1.module.css";

type BorderComboFrame1Props = {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
};

export function BorderComboFrame1({ children, className, contentClassName, style }: BorderComboFrame1Props) {
  return (
    <div className={[styles.frame, className].filter(Boolean).join(" ")} style={style}>
      <span aria-hidden="true" className={styles.cornerTopLeft} />
      <span aria-hidden="true" className={styles.edgeTop} />
      <span aria-hidden="true" className={styles.cornerTopRight} />
      <span aria-hidden="true" className={styles.edgeLeft} />
      <span aria-hidden="true" className={styles.edgeRight} />
      <span aria-hidden="true" className={styles.cornerBottomLeft} />
      <span aria-hidden="true" className={styles.edgeBottom} />
      <span aria-hidden="true" className={styles.cornerBottomRight} />
      <div className={[styles.content, contentClassName].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}
