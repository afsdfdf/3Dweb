/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { TopNavigation, migrationTestNavItems } from '@/components/ui-lab/top-navigation'
import { getPublicBundleBySlug } from '@/lib/bundleService'
import { getCachedPayload } from '@/lib/getCachedPayload'

import { FooterBar } from '../../_components/shell/FooterBar'
import { getMarketingSiteData } from '../../_lib/marketing'
import { getCurrentNavUser } from '../../_lib/session'
import styles from './page.module.css'

function getBundlePriceLabel(args: { ctaMode: string; priceCredits: number }) {
  if (args.ctaMode === 'coming-soon') return 'Coming Soon'
  if (args.priceCredits > 0) return `${args.priceCredits} Credits`
  return 'Free Preview'
}

function getModelTags(model: { formats: string[]; printReady: boolean; tags: string[] }) {
  const formatTags = model.formats.length > 0 ? model.formats.slice(0, 2) : ['Preview']
  const readinessTag = model.printReady ? 'Print Ready' : 'Ready'
  const contentTags = model.tags.filter(Boolean).slice(0, 1)

  return Array.from(new Set([...formatTags, readinessTag, ...contentTags])).slice(0, 4)
}

export default async function BundleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, payload, navUser, marketing] = await Promise.all([params, getCachedPayload(), getCurrentNavUser(), getMarketingSiteData()])
  const bundle = await getPublicBundleBySlug(payload, slug).catch(() => null)

  if (!bundle) {
    notFound()
  }

  const heroImage = bundle.heroSrc || bundle.coverSrc || bundle.models.find((model) => model.imageSrc)?.imageSrc || null
  const heroEyebrow = bundle.heroMarketing.eyebrow || 'Model Bundle'
  const heroTitle = bundle.heroMarketing.title || bundle.title
  const heroSubtitle = bundle.heroMarketing.subtitle || bundle.subtitle
  const previewModels = bundle.models
  const actualModelCountLabel = `${previewModels.length} ${previewModels.length === 1 ? 'Model' : 'Models'}`
  const ctaBadge = bundle.ctaMode === 'paid' && bundle.priceCredits > 0 ? `${bundle.priceCredits} Credits` : null
  const heroChips = [
    bundle.badgeLabel,
    bundle.bundleTypeLabel,
    actualModelCountLabel,
    bundle.technicalSpecs.formatsLabel,
    bundle.technicalSpecs.printReady ? 'Print Ready' : null,
    bundle.technicalSpecs.textured ? 'Textured' : null,
    ctaBadge,
  ].filter((chip): chip is string => Boolean(chip))
  const supportEmail = marketing.siteSettings.supportEmail || 'support@example.com'
  const siteDescription = marketing.siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.'

  return (
    <main className={styles.page}>
      <AuthModalStage>
        <TopNavigation active="SHOWCASE" className={styles.topNavigation} fitViewport items={migrationTestNavItems} user={navUser} />
        <header className={styles.mobileHeader}>
          <Link href="/" aria-label="Thorns Tavern home">
            <img alt="Thorns Tavern" src="/ui-lab/top-navigation/logo-wordmark.png" />
          </Link>
          <nav aria-label="Mobile navigation">
            <Link href="/workbench">Workbench</Link>
            <Link href="/pricing">Plans</Link>
          </nav>
        </header>

        <div className={styles.shell}>
          <section aria-label={bundle.title} className={styles.heroSection}>
            <div className={styles.heroImageShell}>
              {heroImage ? (
                <img alt={bundle.title} className={styles.heroImage} decoding="async" fetchPriority="high" src={heroImage} />
              ) : (
                <div className={styles.emptyImage}>No cover image</div>
              )}
            </div>

            <div className={styles.heroContent}>
              <div className={styles.heroCopy}>
                <span className={styles.eyebrow}>{heroEyebrow}</span>
                <h1>{heroTitle}</h1>
                {heroSubtitle ? <p className={styles.subtitle}>{heroSubtitle}</p> : null}
                {bundle.heroMarketing.slogan ? <p className={styles.slogan}>{bundle.heroMarketing.slogan}</p> : null}
                <p className={styles.summary}>{bundle.summary}</p>

                {bundle.heroMarketing.sellingPoints.length > 0 ? (
                  <div className={styles.sellingPoints}>
                    {bundle.heroMarketing.sellingPoints.map((point) => (
                      <span key={point}>{point}</span>
                    ))}
                  </div>
                ) : null}

                <div className={styles.metaPills}>
                  {heroChips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
              </div>

              <div className={styles.heroActions}>
                <a className={[styles.actionButton, styles.primaryAction].join(' ')} href="#included-models">
                  {bundle.primaryCtaLabel}
                </a>
                <Link className={styles.actionButton} href="/workbench">
                  {bundle.secondaryCtaLabel}
                </Link>
                <Link className={styles.textLink} href="/bundles">
                  All Bundles
                  <span aria-hidden="true">-&gt;</span>
                </Link>
              </div>
            </div>
          </section>

          <section className={styles.modelsSection} id="included-models">
            <div className={styles.sectionHeader}>
              <div>
                <h2>Included Models</h2>
                <p>{bundle.technicalSpecs.assetReadinessLabel || 'Public preview models included in this bundle.'}</p>
              </div>
              <span className={styles.countChip}>{actualModelCountLabel}</span>
            </div>

            <div className={styles.modelGrid}>
              {previewModels.map((model) => (
                <article className={styles.modelCard} key={model.id}>
                  <Link className={styles.modelImageLink} href={model.href}>
                    {model.imageSrc ? (
                      <img alt={model.title} className={styles.modelImage} decoding="async" loading="lazy" src={model.imageSrc} />
                    ) : (
                      <div className={styles.emptyImage}>No preview image</div>
                    )}
                  </Link>
                  <div className={styles.modelBody}>
                    <h2>
                      <Link href={model.href}>{model.title}</Link>
                    </h2>
                    <div className={styles.modelTags}>
                      {getModelTags(model).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <Link className={styles.inlineLink} href={model.href}>
                      View
                      <span aria-hidden="true">-&gt;</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.notePanel} aria-label="Bundle quick details">
            <span className={styles.noteTitle}>Bundle Details</span>
            <div className={styles.noteMeta}>
              <span>{bundle.license.label}</span>
              <span>{getBundlePriceLabel(bundle)}</span>
              <span>{bundle.technicalSpecs.formatsLabel}</span>
              <span>{bundle.technicalSpecs.scaleLabel}</span>
            </div>
          </section>

          {bundle.relatedBundles.length > 0 ? (
            <section className={styles.relatedSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Related Bundles</h2>
                  <p>Continue browsing curated model packs.</p>
                </div>
              </div>
              <div className={styles.relatedGrid}>
                {bundle.relatedBundles.slice(0, 3).map((related) => (
                  <Link className={styles.relatedCard} href={related.href} key={related.id}>
                    {related.coverSrc ? (
                      <img alt="" decoding="async" loading="lazy" src={related.coverSrc} />
                    ) : null}
                    <span>{related.bundleTypeLabel}</span>
                    <strong>{related.title}</strong>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <FooterBar footerContent={marketing.siteSettings.footer} siteDescription={siteDescription} supportEmail={supportEmail} />
        </div>
      </AuthModalStage>
    </main>
  )
}
