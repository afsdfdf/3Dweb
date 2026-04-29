import type { CSSProperties, ReactNode } from "react";

import styles from "./button-box-frame-11.module.css";

type ButtonBoxFrame11Props = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function ButtonBoxFrame11({ children, className, style }: ButtonBoxFrame11Props) {
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
      <div className={styles.content}>{children}</div>
    </div>
  );
}