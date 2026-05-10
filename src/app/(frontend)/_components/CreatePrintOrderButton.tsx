"use client";

import { PrintOrderDialog } from "./PrintOrderDialog";

type CreatePrintOrderButtonProps = {
  buttonLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  modelId: number;
  modelPreviewSrc?: null | string;
  modelTitle?: null | string;
  sourceTaskId?: number;
  variant?: "default" | "secondary" | "outline" | "ghost";
};

export function CreatePrintOrderButton({
  buttonLabel = "Print and checkout",
  disabled = false,
  disabledReason,
  modelId,
  modelPreviewSrc = null,
  modelTitle = null,
  sourceTaskId,
  variant = "secondary",
}: CreatePrintOrderButtonProps) {
  return (
    <PrintOrderDialog
      buttonLabel={buttonLabel}
      disabled={disabled}
      disabledReason={disabledReason}
      modelId={modelId}
      modelPreviewSrc={modelPreviewSrc}
      modelTitle={modelTitle}
      sourceTaskId={sourceTaskId}
      variant={variant}
    />
  );
}
