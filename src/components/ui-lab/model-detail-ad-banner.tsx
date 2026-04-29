/* eslint-disable @next/next/no-img-element */
import type { AnchorHTMLAttributes } from "react";

import styles from "./model-detail-ad-banner.module.css";

type ModelDetailAdBannerProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  imageAlt?: string;
  imageSrc?: string;
};

export function ModelDetailAdBanner({
  className,
  href = "#",
  imageAlt = "",
  imageSrc = "/ui-lab/model-detail-uicut/images/detail-side-banner.png",
  ...anchorProps
}: ModelDetailAdBannerProps) {
  return (
    <a {...anchorProps} className={[styles.banner, className].filter(Boolean).join(" ")} href={href}>
      <img className={styles.image} src={imageSrc} alt={imageAlt} />
    </a>
  );
}
