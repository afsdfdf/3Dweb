/* eslint-disable @next/next/no-img-element */
"use client";

import type { ButtonHTMLAttributes } from "react";
import { useState } from "react";

import styles from "./generate-cta-button.module.css";

const images = {
  normal: "/ui-lab/formal-components/assets/buttons/button-generate-cta-normal.png",
  hover: "/ui-lab/formal-components/assets/buttons/button-generate-cta-hover.png",
  pressed: "/ui-lab/formal-components/assets/buttons/button-generate-cta-pressed.png",
};

type GenerateCtaButtonState = keyof typeof images;

export type GenerateCtaButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label?: string;
};

export function GenerateCtaButton({
  className,
  disabled,
  label = "GENERATE",
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onPointerUp,
  type = "button",
  "aria-label": ariaLabel,
  ...buttonProps
}: GenerateCtaButtonProps) {
  const [state, setState] = useState<GenerateCtaButtonState>("normal");
  const accessibleLabel = ariaLabel ?? label;

  return (
    <button
      {...buttonProps}
      aria-label={accessibleLabel}
      className={[styles.button, className].filter(Boolean).join(" ")}
      disabled={disabled}
      type={type}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented && !disabled && event.pointerType === "mouse") {
          setState("hover");
        }
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
        setState(event.pointerType === "mouse" ? "hover" : "normal");
      }}
    >
      <img alt={`${accessibleLabel} CTA ${state}`} className={styles.image} src={images[state]} />
    </button>
  );
}
