import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

import styles from "./border-combo-frame-2.module.css";

type BorderComboFrame2Props = ComponentPropsWithoutRef<"div"> & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const pieces = Array.from({ length: 15 }, (_, index) => `piece${String(index + 1).padStart(2, "0")}`);

export function BorderComboFrame2({
  children,
  className,
  style,
  ...props
}: BorderComboFrame2Props) {
  return (
    <div {...props} className={[styles.frame, className].filter(Boolean).join(" ")} style={style}>
      {pieces.map((piece) => (
        <span key={piece} aria-hidden="true" className={styles[piece]} />
      ))}
      <div className={styles.content}>{children}</div>
    </div>
  );
}