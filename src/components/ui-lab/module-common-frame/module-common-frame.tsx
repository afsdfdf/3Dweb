import type { CSSProperties, ReactNode } from "react";

import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";

import styles from "./module-common-frame.module.css";

type ModuleCommonFrameProps = {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
};

export function ModuleCommonFrame({
  children,
  className,
  contentClassName,
  style,
}: ModuleCommonFrameProps) {
  return (
    <ButtonBoxFrame
      className={className}
      contentClassName={[styles.content, contentClassName].filter(Boolean).join(" ")}
      style={{ width: 460, height: 972, ...style }}
    >
      {children}
    </ButtonBoxFrame>
  );
}
