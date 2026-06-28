"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

import styles from "./small-button-pair.module.css";

type ButtonId = "purple" | "dark";

type ButtonConfig = {
  id: ButtonId;
};

type SmallButtonPairProps = {
  className?: string;
  darkLabel?: string;
  onChange?: (button: ButtonId) => void;
  purpleLabel?: string;
  selected?: ButtonId;
  tone?: "default" | "purple";
};

const assetBase = "/ui-lab/formal-components/assets/small-button-pair";
const selectedButtonSrc = `${assetBase}/button-dark-small-design.png`;
const hoverButtonSrc = `${assetBase}/button-purple-small-hover-bright@2x.png`;

const buttons: ButtonConfig[] = [
  {
    id: "purple",
  },
  {
    id: "dark",
  },
];

function getButtonPosition(button: ButtonId) {
  return button === "purple" ? styles.left : styles.right;
}

export function SmallButtonPair({
  className,
  darkLabel = "DARK",
  onChange,
  purpleLabel = "PURPLE",
  selected,
  tone = "default",
}: SmallButtonPairProps) {
  const [internalPressedButton, setInternalPressedButton] = useState<ButtonId>("purple");
  const pressedButton = selected ?? internalPressedButton;

  const handleButtonClick = (button: ButtonId) => {
    setInternalPressedButton(button);
    onChange?.(button);
  };

  return (
    <div className={[styles.shell, className].filter(Boolean).join(" ")} data-tone={tone}>
      <img
        alt="Toggle dark alt"
        className={styles.frame}
        src={`${assetBase}/toggle-bar-dark-alt.png`}
      />
      <div className={styles.buttons}>
        {buttons.map((button) => {
          const isPressed = pressedButton === button.id;

          return (
            <button
              aria-pressed={isPressed}
              className={[styles.control, getButtonPosition(button.id)].join(" ")}
              key={button.id}
              onClick={() => handleButtonClick(button.id)}
              type="button"
            >
              {isPressed ? <img alt="" className={styles.buttonImage} src={selectedButtonSrc} /> : null}
              <img alt="" className={[styles.buttonImage, styles.hoverImage].join(" ")} src={hoverButtonSrc} />
            </button>
          );
        })}
        <span className={[styles.label, styles.leftLabel].join(" ")}>{purpleLabel}</span>
        <span className={[styles.label, styles.rightLabel].join(" ")}>{darkLabel}</span>
      </div>
    </div>
  );
}

type TripleButtonId = "purple" | "dark" | "button";

type SmallButtonTripleProps = {
  labels?: {
    button: string;
    dark: string;
    purple: string;
  };
  onChange?: (button: TripleButtonId) => void;
  selected?: null | TripleButtonId;
};

export function SmallButtonTriple({
  labels = {
    purple: "All",
    dark: "Follow",
    button: "Followed",
  },
  onChange,
  selected,
}: SmallButtonTripleProps) {
  const [internalSelectedButton, setInternalSelectedButton] = useState<null | TripleButtonId>("purple");
  const selectedButton = selected === undefined ? internalSelectedButton : selected;

  const tripleButtons = [
    {
      id: "purple" as const,
      label: labels.purple,
      className: styles.tripleButtonOne,
    },
    {
      id: "dark" as const,
      label: labels.dark,
      className: styles.tripleButtonTwo,
    },
    {
      id: "button" as const,
      label: labels.button,
      className: styles.tripleButtonThree,
    },
  ];

  return (
    <div className={styles.tripleShell}>
      <span className={styles.tripleFrame} aria-hidden="true" />
      <div className={styles.tripleButtons}>
        {tripleButtons.map((button) => {
          const isSelected = selectedButton === button.id;

          return (
            <button
              aria-pressed={isSelected}
              className={[styles.tripleControl, button.className].join(" ")}
              key={button.id}
              onClick={() => {
                setInternalSelectedButton(button.id);
                onChange?.(button.id);
              }}
              type="button"
            >
              {isSelected ? <img alt="" className={styles.buttonImage} src={selectedButtonSrc} /> : null}
              <img alt="" className={[styles.buttonImage, styles.hoverImage].join(" ")} src={hoverButtonSrc} />
              <span className={styles.tripleLabel}>{button.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
