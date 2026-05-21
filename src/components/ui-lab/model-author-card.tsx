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

const getInitials = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "C";

  const [first, second] = trimmed.split(/\s+/);
  return `${first?.[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
};

export function ModelAuthorAvatar({
  alt = "",
  className,
  imageSrc,
  style,
}: ModelAuthorAvatarProps) {
  return (
    <div className={[styles.avatarFrame, className].filter(Boolean).join(" ")} style={style}>
      <div className={styles.avatarInner}>
        {imageSrc ? (
          <img className={styles.avatarImage} src={imageSrc} alt={alt} />
        ) : (
          <span className={styles.avatarFallback}>{getInitials(alt)}</span>
        )}
      </div>
    </div>
  );
}

export function ModelAuthorCard({
  avatarAlt = "",
  avatarSrc,
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
