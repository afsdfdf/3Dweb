import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

import styles from "./border-combo-frame-2-variant.module.css";

type BorderComboFrame2VariantProps = ComponentPropsWithoutRef<"div"> & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const pieces = [
  "top13",
  "top14",
  "top15",
  "middle10",
  "middle11",
  "middle12",
  "bottom13",
  "bottom14",
  "bottom15",
];

export function BorderComboFrame2Variant({
  children,
  className,
  style,
  ...props
}: BorderComboFrame2VariantProps) {
  return (
    <div {...props} className={[styles.frame, className].filter(Boolean).join(" ")} style={style}>
      {pieces.map((piece) => (
        <span key={piece} aria-hidden="true" className={styles[piece]} />
      ))}
      <div className={styles.content}>{children}</div>
    </div>
  );
}