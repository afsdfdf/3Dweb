export const revalidate = 60

import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { BorderComboFrame2, BorderComboFrame2Variant } from "@/components/ui-lab/border-combo-frame-2";
import { HeroProductRibbon } from "@/components/ui-lab/hero-product-ribbon";
import Frame12877 from "@/components/ui-lab/home-test/frame12877";
import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import { getSupabasePreviewImageURL } from "@/lib/supabase/imageTransform";

import { FooterBar } from "./_components/shell/FooterBar";
import { getHomeData } from "./_home/homeData";
import { TestHomeBundlePanel, TestHomeInspirationPanel } from "./test-home/TestHomeInteractivePanels";
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
        <TopNavigation active="HOME" className={styles.boundTopNavigation} items={migrationTestNavItems} user={data.navUser} />
        <section className={styles.heroStage} aria-label="Responsive home hero">
          <Frame12877 />
        </section>

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
                  </a>
                ))}
              </div>
            </div>
          </BorderComboFrame2Variant>
        </section>

        <section className={styles.framedSection} aria-label="Model bundles">
          <BorderComboFrame2 className={styles.heroSecondBanner}>
            <div className={styles.frameShell}>
              <TestHomeBundlePanel items={data.shelfItems} />
            </div>
          </BorderComboFrame2>
        </section>

        <section className={styles.framedSection} aria-label="Inspiration models">
          <BorderComboFrame2 className={styles.heroThirdBanner} id="inspiration">
            <div className={styles.frameShell}>
              <TestHomeInspirationPanel
                basePath="/"
                items={data.inspirationItems}
                page={data.inspirationPagination.page}
                pageSize={data.inspirationPagination.limit}
                query={data.inspirationSearchQuery}
                totalPages={data.inspirationPagination.totalPages}
              />
            </div>
          </BorderComboFrame2>
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
