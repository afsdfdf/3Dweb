import type { CSSProperties } from "react";

import styles from "./hero-product-ribbon.module.css";

type HeroProductRibbonProps = {
  className?: string;
  label?: string;
  style?: CSSProperties;
};

export function HeroProductRibbon({
  className,
  label = "New Product",
  style,
}: HeroProductRibbonProps) {
  return (
    <span className={[styles.ribbon, className ?? ""].join(" ")} style={style}>
      <span className={styles.left} aria-hidden="true" />
      <span className={styles.middle}>
        <span className={styles.label}>{label}</span>
      </span>
      <span className={styles.right} aria-hidden="true" />
    </span>
  );
}
