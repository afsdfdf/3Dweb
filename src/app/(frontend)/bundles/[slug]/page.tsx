/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { ButtonBoxFrame } from '@/components/ui-lab/button-box-frame'
import { BorderComboFrame2 } from '@/components/ui-lab/border-combo-frame-2'
import { TopNavigation, migrationTestNavItems } from '@/components/ui-lab/top-navigation'
import { getPublicBundleBySlug } from '@/lib/bundleService'
import { getCachedPayload } from '@/lib/getCachedPayload'

import { getCurrentNavUser } from '../../_lib/session'
import { BundleModelPreviewRail } from './BundleModelPreviewRail'
import styles from './page.module.css'

export default async function BundleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, payload, navUser] = await Promise.all([params, getCachedPayload(), getCurrentNavUser()])
  const bundle = await getPublicBundleBySlug(payload, slug).catch(() => null)

  if (!bundle) {
    notFound()
  }

  const heroImage = bundle.heroSrc || bundle.coverSrc || bundle.models.find((model) => model.imageSrc)?.imageSrc || null
  const previewModels = bundle.models
  const ctaBadge = bundle.ctaMode === 'paid' && bundle.priceCredits > 0 ? `${bundle.priceCredits} Credits` : null
  const technicalSummary = [
    bundle.technicalSpecs.assetReadinessLabel,
    bundle.technicalSpecs.scaleLabel,
    bundle.technicalSpecs.printReady ? 'Print ready' : null,
    bundle.technicalSpecs.textured ? 'Textured' : null,
    bundle.technicalSpecs.technicalNotes,
  ]
    .filter(Boolean)
    .join(' / ')
  const detailItems = [
    {
      body: bundle.includedSummary,
      label: 'Included',
      value: bundle.modelCountLabel,
    },
    {
      body: technicalSummary,
      label: 'Technical',
      value: bundle.technicalSpecs.formatsLabel,
    },
    {
      body: bundle.license.summary,
      label: 'License',
      value: bundle.license.label,
    },
  ]

  return (
    <main className={styles.page}>
      <div className={styles.viewport}>
        <section aria-label={bundle.title} className={styles.stage}>
          <AuthModalStage fitViewport topOffset={60}>
            <section className={styles.heroSection}>
              <div className={styles.heroImageShell}>
                {heroImage ? (
                  <img alt={bundle.title} className={styles.heroImage} src={heroImage} />
                ) : (
                  <div className={styles.emptyHero}>No cover image</div>
                )}
                <span className={styles.heroImageShade} aria-hidden="true" />
              </div>

              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Model Bundle</p>
                <h1>{bundle.title}</h1>
                {bundle.subtitle ? <p className={styles.subtitle}>{bundle.subtitle}</p> : null}
                <p className={styles.summary}>{bundle.summary}</p>

                <div className={styles.badgeRow}>
                  <span>{bundle.badgeLabel}</span>
                  <span>{bundle.bundleTypeLabel}</span>
                  <span>{bundle.modelCountLabel}</span>
                  <span>{bundle.technicalSpecs.formatsLabel}</span>
                  {ctaBadge ? <span>{ctaBadge}</span> : null}
                  {bundle.tags.slice(0, 2).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className={styles.ctaRow}>
                  <a className={styles.primaryButton} href="#included-models">
                    {bundle.primaryCtaLabel}
                  </a>
                  <Link className={styles.secondaryButton} href="/workbench">
                    {bundle.secondaryCtaLabel}
                  </Link>
                  <Link className={styles.textLink} href="/bundles">
                    All Bundles
                  </Link>
                </div>
              </div>
            </section>

            <BorderComboFrame2 className={styles.modelsFrame} id="included-models">
              <div className={styles.frameContent}>
                <div className={styles.frameHeader}>
                  <span className={styles.headerLogo} aria-hidden="true" />
                  <span className={styles.headerLabel}>Models</span>
                  <span className={styles.headerRule} aria-hidden="true" />
                  <span className={styles.headerCount}>{bundle.modelCountLabel}</span>
                </div>

                <BundleModelPreviewRail
                  items={previewModels.map((model) => ({
                    ageLabel: model.formats.slice(0, 2).join(' / ') || 'Preview',
                    authorName: model.authorName,
                    avatarSrc: model.avatarSrc,
                    favoritesLabel: 'Ready',
                    filter: 'image3d',
                    href: model.href,
                    id: model.id,
                    imageSrc: model.imageSrc,
                    likesLabel: '3D',
                    title: model.title,
                    viewsLabel: 'View',
                  }))}
                />
              </div>
            </BorderComboFrame2>

            <BorderComboFrame2 className={styles.detailsFrame}>
              <div className={styles.frameContent}>
                <div className={styles.frameHeader}>
                  <span className={styles.headerLogo} aria-hidden="true" />
                  <span className={styles.headerLabel}>Details</span>
                  <span className={styles.headerRule} aria-hidden="true" />
                </div>

                <div className={styles.detailGrid}>
                  {detailItems.map((item) => (
                    <section className={styles.detailCard} key={item.label}>
                      <ButtonBoxFrame className={styles.detailCardFrame} contentClassName={styles.detailCardFrameContent}>
                        <span className={styles.detailLabel}>{item.label}</span>
                        <strong>{item.value}</strong>
                        <p>{item.body}</p>
                      </ButtonBoxFrame>
                    </section>
                  ))}
                </div>

                {bundle.releaseNotes ? (
                  <section className={styles.releaseNotes}>
                    <span>Release Notes</span>
                    <p>{bundle.releaseNotes}</p>
                  </section>
                ) : null}
              </div>
            </BorderComboFrame2>

            <footer className={styles.footerBlock}>
              <div className={styles.footerBrand}>
                <img alt="Thorns Tavern" className={styles.footerLogo} src="/ui-lab/top-navigation/logo-wordmark.png" />
              </div>
              <div className={styles.footerInfo}>
                <h2>Information</h2>
                <Link href="/refund-policy">Refund Policy</Link>
                <Link href="/shipping-policy">Shipping Policy</Link>
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/contact">Contact Us</Link>
              </div>
              <div className={styles.footerHelp}>
                <h2>Help Customers</h2>
                <p>service@thornstavern.com</p>
              </div>
            </footer>
          </AuthModalStage>

          <TopNavigation
            active="HOME"
            className={styles.boundTopNavigation}
            items={migrationTestNavItems}
            user={navUser}
          />
        </section>
      </div>
    </main>
  )
}
