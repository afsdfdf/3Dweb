/* eslint-disable @next/next/no-img-element */
import type { AnchorHTMLAttributes } from "react";

import styles from "./model-detail-ad-banner.module.css";

type ModelDetailAdBannerProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  imageAlt?: string;
  imagePosition?: string;
  imageSrc?: string;
};

export function ModelDetailAdBanner({
  className,
  href,
  imageAlt = "",
  imagePosition,
  imageSrc = "/ui-lab/model-detail-uicut/images/detail-side-banner.webp",
  ...anchorProps
}: ModelDetailAdBannerProps) {
  const bannerClassName = [styles.banner, className].filter(Boolean).join(" ");
  const image = (
    <img
      className={styles.image}
      src={imageSrc}
      alt={imageAlt}
      style={imagePosition ? { objectPosition: imagePosition } : undefined}
    />
  );

  // Without a real destination, render a non-interactive container instead of a
  // dead `href="#"` link that scrolls to the top of the page when clicked.
  if (!href || href === "#") {
    return <div className={bannerClassName}>{image}</div>;
  }

  return (
    <a {...anchorProps} className={bannerClassName} href={href}>
      {image}
    </a>
  );
}
