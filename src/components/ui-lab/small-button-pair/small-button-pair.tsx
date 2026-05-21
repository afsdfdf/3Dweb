"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

import styles from "./small-button-pair.module.css";

type ButtonId = "purple" | "dark";

type ButtonConfig = {
  hoverAlt: string;
  hoverSrc: string;
  id: ButtonId;
  normalAlt: string;
  normalSrc: string;
  pushedAlt: string;
  pushedSrc: string;
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

const buttons: ButtonConfig[] = [
  {
    id: "purple",
    normalAlt: "Purple small normal",
    normalSrc: `${assetBase}/button-purple-small-normal.png`,
    hoverAlt: "Purple small hover",
    hoverSrc: `${assetBase}/button-purple-small-hover.png`,
    pushedAlt: "Purple small pushed",
    pushedSrc: `${assetBase}/button-purple-small-pushed.png`,
  },
  {
    id: "dark",
    normalAlt: "Dark small normal",
    normalSrc: `${assetBase}/button-dark-small-normal.png`,
    hoverAlt: "Dark small hover",
    hoverSrc: `${assetBase}/button-dark-small-hover.png`,
    pushedAlt: "Dark small pushed",
    pushedSrc: `${assetBase}/button-dark-small-pushed.png`,
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
          const imageSet = tone === "purple"
            ? isPressed
              ? buttons[1]
              : buttons[0]
            : button;

          return (
            <button
              aria-pressed={isPressed}
              className={[styles.control, getButtonPosition(button.id)].join(" ")}
              key={button.id}
              onClick={() => handleButtonClick(button.id)}
              type="button"
            >
              <img
                alt={button.normalAlt}
                className={[styles.buttonImage, styles.normal].join(" ")}
                src={imageSet.normalSrc}
              />
              <img
                alt={button.hoverAlt}
                className={[styles.buttonImage, styles.hover].join(" ")}
                src={imageSet.hoverSrc}
              />
              <img
                alt={button.pushedAlt}
                className={[styles.buttonImage, styles.pushed].join(" ")}
                src={imageSet.pushedSrc}
              />
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
          const imageSet = isSelected
            ? {
                normal: `${assetBase}/button-dark-small-normal.png`,
                hover: `${assetBase}/button-dark-small-hover.png`,
                pushed: `${assetBase}/button-dark-small-pushed.png`,
              }
            : {
                normal: `${assetBase}/button-purple-small-normal.png`,
                hover: `${assetBase}/button-purple-small-hover.png`,
                pushed: `${assetBase}/button-purple-small-pushed.png`,
              };

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
              <img
                alt=""
                className={[styles.buttonImage, styles.normal].join(" ")}
                src={imageSet.normal}
              />
              <img
                alt=""
                className={[styles.buttonImage, styles.hover].join(" ")}
                src={imageSet.hover}
              />
              <img
                alt=""
                className={[styles.buttonImage, styles.pushed].join(" ")}
                src={imageSet.pushed}
              />
              <span className={styles.tripleLabel}>{button.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
