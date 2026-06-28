export const revalidate = 60

import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { BorderComboFrame2Variant } from "@/components/ui-lab/border-combo-frame-2";
import { HeroProductRibbon } from "@/components/ui-lab/hero-product-ribbon";
import { HomeHero } from "@/components/ui-lab/home-hero";
import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import { getSupabasePreviewImageURL } from "@/lib/supabase/imageTransform";

import { FooterBar } from "./_components/shell/FooterBar";
import { getHomeData } from "./_home/homeData";
import { TestHomeBundleFrame, TestHomeInspirationFrame } from "./test-home/TestHomeInteractivePanels";
import styles from "./test-home/testHomePage.module.css";

type HomePageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = (await searchParams) ?? {};
  const data = await getHomeData({
    inspirationPage: query.page ? Number(query.page) : 1,
    inspirationQuery: query.q,
  });
  const featuredItems = data.featuredItems.slice(0, 4);

  return (
    <main className={styles.page}>
      <AuthModalStage clipContent={false} fitViewport>
        <TopNavigation
          active="HOME"
          className={styles.boundTopNavigation}
          fitViewport
          items={migrationTestNavItems}
          subscriptionPromotion={data.navigationPromotion}
          user={data.navUser}
        />
        <HomeHero heroHeaderBackgroundSrc={data.heroHeaderBackgroundSrc} />

        <section className={styles.framedSection} aria-label="Featured models">
          <BorderComboFrame2Variant className={styles.heroBottomBanner}>
            <div className={styles.bannerContent}>
              <div className={styles.featureFrameBody} aria-label="Hero image frame strip">
                {featuredItems.map((item, index) => (
                  <a
                    aria-label={item.alt}
                    className={[
                      styles.featureFrameCard,
                      index === 0 ? styles.featureLargeCard : "",
                      index === 1 || index === 2 ? styles.featureSmallCard : "",
                      index === 3 ? styles.featureLastCard : "",
                    ].filter(Boolean).join(" ")}
                    href={item.href || "/showcase"}
                    key={item.id}
                  >
                    {item.imageSrc ? (
                      <img alt="" className={styles.featureImage} src={getSupabasePreviewImageURL(item.imageSrc, "home-feature")} />
                    ) : null}
                    <HeroProductRibbon className={styles.featureRibbon} label={item.ribbonLabel || "New Product"} />
                    {item.captionLabel ? (
                      <span className={styles.featureCaption}>
                        <span className={styles.featureCaptionText}>{item.captionLabel}</span>
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            </div>
          </BorderComboFrame2Variant>
        </section>

        <section className={styles.framedSection} aria-label="Model bundles">
          <TestHomeBundleFrame className={styles.heroSecondBanner} items={data.shelfItems} />
        </section>

        <section className={styles.framedSection} aria-label="Inspiration models">
          <TestHomeInspirationFrame
            basePath="/"
            className={styles.heroThirdBanner}
            id="inspiration"
            items={data.inspirationItems}
            page={data.inspirationPagination.page}
            pageSize={data.inspirationPagination.limit}
            query={data.inspirationSearchQuery}
            totalPages={data.inspirationPagination.totalPages}
          />
        </section>

        <div className={styles.footerMount}>
          <FooterBar
            footerContent={data.footer.content}
            siteDescription={data.footer.siteDescription}
            supportEmail={data.footer.supportEmail}
          />
        </div>
      </AuthModalStage>
    </main>
  );
}
