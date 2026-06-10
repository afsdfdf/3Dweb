export const metadata = { robots: { index: false, follow: false } }

import Link from "next/link";

import { BorderComboFrame2 } from "@/components/ui-lab/border-combo-frame-2";
import { InspirationGridCard } from "@/components/ui-lab/home-test/inspiration-grid";
import { SmallButtonTriple } from "@/components/ui-lab/small-button-pair/small-button-pair";

import styles from "./test1Page.module.css";

const testItems = Array.from({ length: 18 }, (_, index) => ({
  ageLabel: `${index + 2} Days ago`,
  authorName: ["Greenwood", "Mira", "Tavern Smith", "North Star"][index % 4],
  favoritesLabel: String(18 + index),
  href: "/showcase",
  id: `test-model-${index + 1}`,
  imageSrc: [
    "/ui/frames/new product1.webp",
    "/ui/frames/new product2.webp",
    "/ui/frames/new product3.webp",
    "/ui/frames/new product4.webp",
  ][index % 4],
  likesLabel: String(42 + index),
  title: `Test model ${index + 1}`,
  viewsLabel: `${index + 1}.${index % 9}k`,
}));

export default function Test1Page() {
  return (
    <main className={styles.page}>
      <section className={styles.stage} aria-label="Responsive third frame test">
        <BorderComboFrame2 className={styles.thirdFrame}>
          <div className={styles.thirdFrameShell}>
            <header className={styles.thirdFrameHeader}>
              <Link className={styles.frameLogo} href="/" aria-label="Thorns Tavern home" />
              <span className={styles.frameTitlePlate}>Inspiration</span>
              <span className={styles.frameDivider} aria-hidden="true" />
              <div className={styles.frameActions}>
                <SmallButtonTriple
                  labels={{
                    purple: "Text To 3D",
                    dark: "Image To 3D",
                    button: "Image Tools",
                  }}
                />
              </div>
            </header>

            <div className={styles.thirdFrameBody}>
              <div className={styles.thirdFrameGrid} aria-label="Inspiration models">
                {testItems.map((item) => (
                  <InspirationGridCard item={item} key={item.id} />
                ))}
              </div>
            </div>
          </div>
        </BorderComboFrame2>
      </section>
    </main>
  );
}
