"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useState } from "react";

import { saveWorkbenchDraft } from "@/app/(frontend)/_lib/workbenchDraft";
import { GenerateCtaButton } from "@/components/ui-lab/action-buttons";

import styles from "./HomeHero.module.css";

type HomeHeroProps = {
  heroHeaderBackgroundSrc?: null | string;
};

type HomeHeroStyle = CSSProperties & {
  "--home-hero-background"?: string;
};

const toCSSImageURL = (value: string) => {
  return `url("${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
};

export function HomeHero({ heroHeaderBackgroundSrc }: HomeHeroProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const heroStyle: HomeHeroStyle | undefined = heroHeaderBackgroundSrc
    ? { "--home-hero-background": toCSSImageURL(heroHeaderBackgroundSrc) }
    : undefined;

  const handleGenerate = () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      saveWorkbenchDraft({
        mode: "text3d",
        prompt: "",
        sourceImageAssets: [],
      });

      router.push("/workbench");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to start generation.");
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-label="Responsive home hero" className={styles.hero} style={heroStyle}>
      <div className={styles.stage}>
        <h1 className={styles.srOnly}>
          <span>IDEAS</span>
          <span>TO</span>
          <span>MINIATURES</span>
        </h1>
        <div className={styles.heroSubtitleRow}>
          <span className={styles.heroSubtitleLine} aria-hidden="true" />
          <p className={styles.heroSubtitle}>ideas to Full-color Custom Miniatures</p>
          <span className={styles.heroSubtitleLine} aria-hidden="true" />
        </div>
        <div className={styles.generateMount}>
          <GenerateCtaButton disabled={isSubmitting} label="GENERATE" onClick={handleGenerate} />
        </div>
      </div>
    </section>
  );
}
