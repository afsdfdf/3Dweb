/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight, Boxes, Code2, Compass, FileText, Layers, Sparkles } from 'lucide-react'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { TopNavigation } from '@/components/ui-lab/top-navigation'
import { getPublicNavigationActiveID, resolvePublicNavigationItems } from '@/lib/publicNavigation'

import type { MarketingPageContent, MarketingSection } from '../_lib/marketing-content'
import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentNavUser } from '../_lib/session'
import { FooterBar } from './shell/FooterBar'
import styles from './MarketingPage.module.css'

type MarketingPageProps = {
  page: MarketingPageContent
}

const sectionIcons = [Sparkles, Layers, Boxes, Compass, Code2, FileText]

function countSectionItems(sections: MarketingSection[]) {
  return sections.reduce((total, section) => total + (section.cards?.length ?? 0) + (section.bullets?.length ?? 0), 0)
}

function getPageMode(path: string) {
  if (path.includes('developers')) return 'API Surface'
  if (path.includes('resources')) return 'Guides'
  if (path.includes('solutions')) return 'Use Cases'
  return 'Product Features'
}

export async function MarketingPage({ page }: MarketingPageProps) {
  const [navUser, marketing] = await Promise.all([getCurrentNavUser(), getMarketingSiteData()])
  const supportEmail = marketing.siteSettings.supportEmail || 'support@example.com'
  const siteDescription = marketing.siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.'
  const navigationItems = resolvePublicNavigationItems(marketing.siteSettings.headerNav)
  const mobileNavigationItems = navigationItems.filter((item) => item.href !== '/').slice(0, 3)
  const sectionItemCount = countSectionItems(page.sections)

  return (
    <main className={styles.page}>
      <AuthModalStage>
        <TopNavigation
          active={getPublicNavigationActiveID(page.currentPath, navigationItems)}
          className={styles.topNavigation}
          fitViewport
          items={navigationItems}
          subscriptionPromotion={marketing.siteSettings.navigationPromotion}
          user={navUser}
        />
        <header className={styles.mobileHeader}>
          <Link href="/" aria-label="Thorns Tavern home">
            <img alt="Thorns Tavern" src="/ui-lab/top-navigation/logo-wordmark.png" />
          </Link>
          <nav aria-label="Mobile navigation">
            {mobileNavigationItems.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className={styles.shell}>
          <section aria-label={page.heroEyebrow} className={styles.heroSection}>
            <div className={styles.heroImageShell}>
              <img
                alt="Thorns Tavern product creation scene"
                className={styles.heroImage}
                decoding="async"
                fetchPriority="high"
                src="/ui/workbench/model-detail/sketch-assets/rail-banner-bg.webp"
              />
            </div>

            <div className={styles.heroContent}>
              <div className={styles.heroCopy}>
                <span className={styles.eyebrow}>{page.heroEyebrow}</span>
                <h1>{page.heroTitle}</h1>
                <p className={styles.summary}>{page.heroText}</p>
                <div className={styles.metaPills}>
                  <span>{getPageMode(page.currentPath)}</span>
                  <span>{page.sections.length} Sections</span>
                  <span>{sectionItemCount} Notes</span>
                  <span>AI 3D Workflow</span>
                </div>
              </div>

              <div className={styles.heroActions}>
                <Link className={[styles.actionButton, styles.primaryAction].join(' ')} href={page.heroPrimaryCTA.href}>
                  {page.heroPrimaryCTA.label}
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                {page.heroSecondaryCTA ? (
                  <Link className={styles.actionButton} href={page.heroSecondaryCTA.href}>
                    {page.heroSecondaryCTA.label}
                    <ArrowRight aria-hidden="true" size={18} />
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section aria-label={`${page.heroEyebrow} summary`} className={styles.summaryGrid}>
            {page.sections.slice(0, 3).map((section, index) => {
              const Icon = sectionIcons[index] ?? Sparkles
              const count = (section.cards?.length ?? 0) + (section.bullets?.length ?? 0)

              return (
                <article className={styles.summaryCard} key={section.id}>
                  <span className={styles.cardIcon}>
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <h2>{section.title}</h2>
                  <p>{section.text}</p>
                  <span className={styles.cardMeta}>{count > 0 ? `${count} focus points` : section.eyebrow}</span>
                </article>
              )
            })}
          </section>

          <section className={styles.detailsSection}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>{page.heroEyebrow}</span>
                <h2>Explore the product workflow</h2>
                <p>Each block keeps the page tied to the same generation, asset, delivery, and operations language used across Thorns Tavern.</p>
              </div>
              <span className={styles.countChip}>{page.sections.length} Sections</span>
            </div>

            <div className={styles.detailGrid}>
              {page.sections.map((section, index) => {
                const Icon = sectionIcons[index % sectionIcons.length] ?? Sparkles

                return (
                  <article className={styles.detailCard} id={section.id} key={section.id}>
                    <div className={styles.detailHeading}>
                      <span className={styles.cardIcon}>
                        <Icon aria-hidden="true" size={20} />
                      </span>
                      <div>
                        <span className={styles.detailEyebrow}>{section.eyebrow}</span>
                        <h3>{section.title}</h3>
                      </div>
                    </div>
                    <p>{section.text}</p>

                    {section.cards?.length ? (
                      <div className={styles.itemList}>
                        {section.cards.map((card) => (
                          <div className={styles.itemRow} key={card.title}>
                            <strong>{card.title}</strong>
                            {card.note ? <span className={styles.notePill}>{card.note}</span> : null}
                            <p>{card.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {section.bullets?.length ? (
                      <ul className={styles.bulletList}>
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>

          <FooterBar footerContent={marketing.siteSettings.footer} siteDescription={siteDescription} supportEmail={supportEmail} />
        </div>
      </AuthModalStage>
    </main>
  )
}
