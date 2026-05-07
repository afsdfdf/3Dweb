/* eslint-disable @next/next/no-img-element */
import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { BorderComboFrame2, BorderComboFrame2Variant } from "@/components/ui-lab/border-combo-frame-2";
import { LinkedSourcePurpleMediumButton } from "@/components/ui-lab/action-buttons";
import { SmallButtonPair } from "@/components/ui-lab/small-button-pair/small-button-pair";
import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import Frame12877 from "@/components/ui-lab/home-test/frame12877";
import { HeroImageFrameStrip } from "@/components/ui-lab/home-test/hero-image-frame-strip";
import { InspirationSearchBox, InspirationPager } from "@/components/ui-lab/home-test/inspiration-search-box";
import { InspirationGrid } from "@/components/ui-lab/home-test/inspiration-grid";
import { SelectableFrameRow } from "@/components/ui-lab/home-test/selectable-frame-row";
import { getHomeData } from "./_home/homeData";
import styles from "./_home/homePage.module.css";

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

  return (
    <main className={styles.page}>
      <div className={styles.viewport}>
        <section className={styles.stage} aria-label="Home page">
          <AuthModalStage fitViewport topOffset={60}>
            <Frame12877 />
            <BorderComboFrame2Variant
              className={styles.heroBottomBanner}
              style={{ width: 1854, height: 332 }}
            >
              <div className={styles.bannerContent}>
                <HeroImageFrameStrip items={data.featuredItems} />
              </div>
            </BorderComboFrame2Variant>
            <BorderComboFrame2
              className={styles.heroSecondBanner}
              style={{ width: 1856, height: 453 }}
            >
              <div className={styles.bannerContent}>
                <span className={styles.bannerSquareLogo} aria-hidden="true" />
                <span className={styles.bannerDividerLine} aria-hidden="true" />
                <span className={[styles.bannerRightImage, styles.bannerRightImageText].join(" ")}>
                  Bundles
                </span>
                <div className={styles.smallButtonPairMount}>
                  <SmallButtonPair purpleLabel="Hot" darkLabel="New" />
                </div>
                <div className={styles.sourceMediumButtonMount}>
                  <LinkedSourcePurpleMediumButton href="/bundles" label="More" />
                </div>
                <SelectableFrameRow items={data.shelfItems} />
              </div>
            </BorderComboFrame2>
            <BorderComboFrame2
              className={styles.heroThirdBanner}
              style={{ width: 1856, height: 3060 }}
            >
              <div className={styles.bannerContent}>
                <span className={styles.bannerSquareLogo} aria-hidden="true" />
                <span className={styles.bannerDividerLine} aria-hidden="true" />
                <span className={[styles.bannerRightImage, styles.bannerRightImageText].join(" ")}>
                  Inspiration
                </span>
                <div className={styles.inspirationSearchMount}>
                  <InspirationSearchBox
                    page={data.inspirationPagination.page}
                    pageSize={data.inspirationPagination.limit}
                    query={data.inspirationSearchQuery}
                    totalPages={data.inspirationPagination.totalPages}
                  />
                </div>
                <span className={styles.inspirationGridDivider} aria-hidden="true" />
                <InspirationGrid
                  filterMountClassName={styles.lowerButtonGroupMount}
                  items={data.inspirationItems}
                />
                <div className={styles.bottomPagerMount}>
                  <InspirationPager
                    page={data.inspirationPagination.page}
                    query={data.inspirationSearchQuery}
                    totalPages={data.inspirationPagination.totalPages}
                  />
                </div>
              </div>
            </BorderComboFrame2>
            <footer className={styles.footerBlock}>
              <div className={styles.footerBrand}>
                <img
                  alt="Thorns Tavern"
                  className={styles.footerLogo}
                  src="/ui-lab/top-navigation/logo-wordmark.png"
                />
              </div>
              <div className={styles.footerInfo}>
                <h2>Information</h2>
                <p>Refund Policy</p>
                <p>Shipping Policy</p>
                <p>Privacy Policy</p>
                <p>Contact Us</p>
              </div>
              <div className={styles.footerHelp}>
                <h2>Help Customers</h2>
                <p>{data.footer.supportEmail}</p>
              </div>
            </footer>
          </AuthModalStage>
          <TopNavigation
            active="HOME"
            className={styles.boundTopNavigation}
            items={migrationTestNavItems}
            user={data.navUser}
          />
        </section>
      </div>
    </main>
  );
}
