/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import styles from "./model-author-card.module.css";

type ModelAuthorAvatarProps = {
  alt?: string;
  className?: string;
  imageSrc?: string;
  style?: CSSProperties;
};

type ModelAuthorCardProps = {
  avatarAlt?: string;
  avatarSrc?: string;
  className?: string;
  description?: string;
  name?: string;
  style?: CSSProperties;
};

export function ModelAuthorAvatar({
  alt = "",
  className,
  imageSrc = "/ui-lab/model-detail-uicut/images/face.png",
  style,
}: ModelAuthorAvatarProps) {
  return (
    <div className={[styles.avatarFrame, className].filter(Boolean).join(" ")} style={style}>
      <div className={styles.avatarInner}>
        <img className={styles.avatarImage} src={imageSrc} alt={alt} />
      </div>
    </div>
  );
}

export function ModelAuthorCard({
  avatarAlt = "",
  avatarSrc = "/ui-lab/model-detail-uicut/images/face.png",
  className,
  description = "A Thorns Tavern creator profile.",
  name = "Creator",
  style,
}: ModelAuthorCardProps) {
  return (
    <section className={[styles.card, className].filter(Boolean).join(" ")} style={style}>
      <ModelAuthorAvatar className={styles.cardAvatar} imageSrc={avatarSrc} alt={avatarAlt} />
      <div className={styles.name}>{name}</div>
      <div className={styles.description}>{description}</div>
    </section>
  );
}
