import type { CSSProperties } from "react";

import { OrangeMediumActionButton, SourcePurpleMediumButton } from "@/components/ui-lab/action-buttons";
import { BorderComboFrame1 } from "@/components/ui-lab/border-combo-frame-1";

import styles from "./model-download-confirmation.module.css";

type ModelDownloadConfirmationProps = {
  cancelLabel?: string;
  className?: string;
  confirmLabel?: string;
  message?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  style?: CSSProperties;
  title?: string;
};

const actionButtonStyle: CSSProperties = {
  boxSizing: "border-box",
  height: 52,
  inset: 0,
  width: 144,
};

export function ModelDownloadConfirmation({
  cancelLabel = "Cancel",
  className,
  confirmLabel = "OK",
  message = "Downloading the current model will cost 1 to 2 points.",
  onCancel,
  onConfirm,
  style,
  title = "Model Download Confirmation",
}: ModelDownloadConfirmationProps) {
  return (
    <BorderComboFrame1 className={[styles.dialog, className].filter(Boolean).join(" ")} style={style}>
      <section className={styles.panel}>
        <div className={styles.title}>{title}</div>
        <div className={styles.message}>{message}</div>
        <div className={styles.actions}>
          <div className={styles.buttonSlot}>
            <SourcePurpleMediumButton label={cancelLabel} onClick={onCancel} style={actionButtonStyle} />
          </div>
          <div className={styles.buttonSlot}>
            <OrangeMediumActionButton label={confirmLabel} onClick={onConfirm} style={actionButtonStyle} />
          </div>
        </div>
      </section>
    </BorderComboFrame1>
  );
}
