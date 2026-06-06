import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import styles from "./button-box-frame.module.css";

type ButtonBoxFrameProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "style"> & {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
};

export function ButtonBoxFrame({ children, className, contentClassName, style, ...frameProps }: ButtonBoxFrameProps) {
  return (
    <div {...frameProps} className={[styles.frame, className].filter(Boolean).join(" ")} style={style}>
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
