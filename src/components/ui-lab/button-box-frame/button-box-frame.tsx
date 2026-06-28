import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import styles from "./button-box-frame.module.css";

type ButtonBoxFrameProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "style"> & {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  selected?: boolean;
  style?: CSSProperties;
};

export function ButtonBoxFrame({
  children,
  className,
  contentClassName,
  selected = false,
  style,
  ...frameProps
}: ButtonBoxFrameProps) {
  return (
    <div
      {...frameProps}
      className={[styles.frame, className].filter(Boolean).join(" ")}
      data-selected={selected ? "true" : undefined}
      style={style}
    >
      <div className={[styles.content, contentClassName].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}
