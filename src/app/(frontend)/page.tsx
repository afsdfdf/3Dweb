/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { BorderComboFrame2, BorderComboFrame2Variant } from "@/components/ui-lab/border-combo-frame-2";
import { LinkedSourcePurpleMediumButton } from "@/components/ui-lab/action-buttons";
import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import Frame12877 from "@/components/ui-lab/home-test/frame12877";
import { HeroImageFrameStrip } from "@/components/ui-lab/home-test/hero-image-frame-strip";
import { InspirationSearchBox, InspirationPager } from "@/components/ui-lab/home-test/inspiration-search-box";
import { InspirationGrid } from "@/components/ui-lab/home-test/inspiration-grid";
import { BundleShelfControls } from "@/components/ui-lab/home-test/bundle-shelf-controls";
import { FooterBar } from "./_components/shell/FooterBar";
import { getFirstBundleShelfItems, getHomeData } from "./_home/homeData";
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
  const mobileFeatureItems = data.featuredItems.slice(0, 4);
  const mobileShelfItems = getFirstBundleShelfItems(data.shelfItems);
  const mobileInspirationItems = data.inspirationItems.slice(0, 6);

  return (
    <main className={styles.page}>
      <div className={styles.mobileHome}>
        <header className={styles.mobileHeader}>
          <Link href="/" aria-label="Thorns Tavern home">
            <img alt="Thorns Tavern" src="/ui-lab/top-navigation/logo-wordmark.png" />
          </Link>
          <nav aria-label="Mobile navigation">
            <Link href="/workbench">Workbench</Link>
            <Link href="/pricing">Plans</Link>
          </nav>
        </header>

        <section className={styles.mobileHero}>
          <span className={styles.mobileHeroPieceLeft} aria-hidden="true" />
          <span className={styles.mobileHeroPieceRight} aria-hidden="true" />
          <div className={styles.mobileHeroCopy}>
            <span className={styles.mobileEyebrow}>Thorns Tavern</span>
            <h1>Ideas to Miniatures</h1>
            <p>Generate tabletop characters, collect model packs, and deliver print-ready 3D assets from one tavern workspace.</p>
          </div>

          <div className={styles.mobileGeneratorPanel}>
            <div className={styles.mobileModeSwitch} aria-label="Generation modes">
              <span>Image to 3D</span>
              <span>Text to 3D</span>
            </div>
            <Link className={styles.mobileUploadPanel} href="/workbench">
              <span className={styles.mobileUploadIcon} aria-hidden="true" />
              <strong>Start in Workbench</strong>
              <em>Upload a reference or write a prompt</em>
            </Link>
            <div className={styles.mobileActions}>
              <Link className={styles.mobilePrimaryAction} href="/workbench">Generate</Link>
              <Link href="/showcase">Browse Models</Link>
            </div>
            <div className={styles.mobileHeroStats}>
              <span>
                <strong>{data.inspirationPagination.totalDocs}</strong>
                Public models
              </span>
              <span>
                <strong>{mobileShelfItems.length}</strong>
                Curated sets
              </span>
              <span>
                <strong>3D</strong>
                Delivery
              </span>
            </div>
          </div>
        </section>

        {mobileFeatureItems.length > 0 ? (
          <section className={styles.mobileSection} aria-label="Featured models">
            <div className={styles.mobileSectionHeader}>
              <span>Featured</span>
              <Link href="/showcase">All Models</Link>
            </div>
            <div className={styles.mobileFeatureGrid}>
              {mobileFeatureItems.map((item) => (
                <Link href={item.href || "/showcase"} key={item.id}>
                  <img alt={item.alt} src={item.imageSrc} />
                  <span>{item.ribbonLabel || "Featured"}</span>
                  <strong>{item.alt}</strong>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {mobileShelfItems.length > 0 ? (
          <section className={styles.mobileSection} aria-label="Model bundles">
            <div className={styles.mobileSectionHeader}>
              <span>Bundles</span>
              <Link href="/bundles">More</Link>
            </div>
            <div className={styles.mobileShelfList}>
              {mobileShelfItems.map((item) => (
                <Link href={item.href || "/bundles"} key={item.id}>
                  <img alt={item.alt || item.title || "Bundle"} src={item.imageSrc} />
                  <span>
                    {item.title ? <strong>{item.title}</strong> : null}
                    {item.count ? <em>{item.count}</em> : null}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {mobileInspirationItems.length > 0 ? (
          <section className={styles.mobileSection} aria-label="Inspiration models">
            <div className={styles.mobileSectionHeader}>
              <span>Inspiration</span>
              <Link href="/showcase">Explore</Link>
            </div>
            <div className={styles.mobileInspirationGrid}>
              {mobileInspirationItems.map((item) => (
                <Link href={item.href || "/showcase"} key={item.id}>
                  {item.imageSrc ? <img alt={item.alt} src={item.imageSrc} /> : <span className={styles.mobileImagePlaceholder} />}
                  <strong>{item.title}</strong>
                  <em>{item.filter}</em>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <FooterBar
          footerContent={data.footer.content}
          siteDescription={data.footer.siteDescription}
          supportEmail={data.footer.supportEmail}
        />
      </div>
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
                <BundleShelfControls
                  controlsClassName={styles.smallButtonPairMount}
                  items={data.shelfItems}
                />
                <div className={styles.sourceMediumButtonMount}>
                  <LinkedSourcePurpleMediumButton href="/bundles" label="More" />
                </div>
              </div>
            </BorderComboFrame2>
            <BorderComboFrame2
              className={styles.heroThirdBanner}
              id="inspiration"
              style={{ width: 1856, height: 2226 }}
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
            <div className={styles.footerMount}>
              <FooterBar
                footerContent={data.footer.content}
                siteDescription={data.footer.siteDescription}
                supportEmail={data.footer.supportEmail}
              />
            </div>
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
