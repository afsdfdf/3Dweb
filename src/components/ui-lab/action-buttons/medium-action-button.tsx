"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { useState } from "react";

import styles from "./medium-action-button.module.css";

export type ButtonState = "normal" | "hover" | "pressed";

export type MediumActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  label: string;
  imageSet: Record<ButtonState, string>;
};

type ButtonStyle = CSSProperties & {
  "--normal-image": string;
  "--hover-image": string;
  "--pressed-image": string;
};

const stateClass: Record<ButtonState, string> = {
  normal: styles.normal,
  hover: styles.hover,
  pressed: styles.pressed,
};

export function MediumActionButton({
  className,
  disabled,
  imageSet,
  label,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onPointerUp,
  style,
  type = "button",
  ...buttonProps
}: MediumActionButtonProps) {
  const [state, setState] = useState<ButtonState>("normal");
  const imageStyle: ButtonStyle = {
    "--normal-image": `url("${imageSet.normal}")`,
    "--hover-image": `url("${imageSet.hover}")`,
    "--pressed-image": `url("${imageSet.pressed}")`,
    ...style,
  };

  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled}
      className={[styles.button, stateClass[state], className].filter(Boolean).join(" ")}
      style={imageStyle}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented && !disabled && event.pointerType === "mouse") setState("hover");
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (!event.defaultPrevented && !disabled) setState("normal");
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented && !disabled) setState("pressed");
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (event.defaultPrevented || disabled) return;

        if (event.pointerType === "mouse") {
          setState("hover");
          return;
        }

        setState("normal");
      }}
    >
      <span className={styles.center}>
        <span className={styles.label}>{label}</span>
      </span>
    </button>
  );
}
