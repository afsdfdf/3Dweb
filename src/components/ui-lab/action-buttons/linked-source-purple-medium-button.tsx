"use client";

import { SourcePurpleMediumButton } from "./source-purple-medium-button";

type LinkedSourcePurpleMediumButtonProps = {
  href: string;
  label: string;
};

export function LinkedSourcePurpleMediumButton({ href, label }: LinkedSourcePurpleMediumButtonProps) {
  return (
    <SourcePurpleMediumButton
      label={label}
      onClick={() => {
        window.location.assign(href);
      }}
      type="button"
    />
  );
}
