import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

import styles from "./border-combo-frame-2.module.css";

type BorderComboFrame2Props = ComponentPropsWithoutRef<"div"> & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

type BorderComboFrame2ContainerProps = BorderComboFrame2Props & {
  bodyClassName?: string;
  contentClassName?: string;
  header?: ReactNode;
  headerClassName?: string;
  headerHeight?: number | string;
};

type BorderComboFrame2ContainerStyle = CSSProperties & {
  "--frame-header-height": string | number;
  "--lower-height": string;
  "--upper-height": string;
};

const pieces = Array.from({ length: 15 }, (_, index) => `piece${String(index + 1).padStart(2, "0")}`);

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function renderBorderPieces() {
  return pieces.map((piece) => (
    <span key={piece} aria-hidden="true" className={styles[piece]} />
  ));
}

function toCssLength(value: number | string) {
  return typeof value === "number" ? `${value}px` : value;
}

export function BorderComboFrame2({
  children,
  className,
  style,
  ...props
}: BorderComboFrame2Props) {
  return (
    <div {...props} className={joinClassNames(styles.frame, className)} style={style}>
      {renderBorderPieces()}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export function BorderComboFrame2Container({
  bodyClassName,
  children,
  className,
  contentClassName,
  header,
  headerClassName,
  headerHeight = 112,
  style,
  ...props
}: BorderComboFrame2ContainerProps) {
  const frameStyle = {
    ...style,
    "--frame-header-height": toCssLength(headerHeight),
    "--upper-height": "calc(var(--frame-header-height) - var(--top-height) - (var(--middle-height) / 2))",
    "--lower-height": "calc(100% - var(--top-height) - var(--upper-height) - var(--middle-height) - var(--bottom-height))",
  } satisfies BorderComboFrame2ContainerStyle;

  return (
    <div {...props} className={joinClassNames(styles.frame, className)} style={frameStyle}>
      {renderBorderPieces()}
      <div className={joinClassNames(styles.content, styles.containerContent, contentClassName)}>
        {header ? <div className={joinClassNames(styles.headerSlot, headerClassName)}>{header}</div> : null}
        <div className={joinClassNames(styles.bodySlot, bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}
