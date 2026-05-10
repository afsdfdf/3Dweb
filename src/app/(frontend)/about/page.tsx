/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowRight, Boxes, Hammer, Sparkles } from 'lucide-react'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { TopNavigation } from '@/components/ui-lab/top-navigation'
import { getPublicNavigationActiveID, resolvePublicNavigationItems } from '@/lib/publicNavigation'

import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentNavUser } from '../_lib/session'
import { getFormalPageContent } from '../_lib/formal-page-content'
import { FooterBar } from '../_components/shell/FooterBar'
import styles from './page.module.css'

const summaryIcons = [Sparkles, Boxes, Hammer]

export default async function AboutPage() {
  const [about, navUser, marketing] = await Promise.all([getFormalPageContent('about'), getCurrentNavUser(), getMarketingSiteData()])
  const supportEmail = marketing.siteSettings.supportEmail || 'support@example.com'
  const siteDescription = marketing.siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.'
  const navigationItems = resolvePublicNavigationItems(marketing.siteSettings.headerNav)
  const mobileNavigationItems = navigationItems.filter((item) => item.href !== '/').slice(0, 3)

  return (
    <main className={styles.page}>
      <AuthModalStage>
        <TopNavigation active={getPublicNavigationActiveID('/about', navigationItems)} className={styles.topNavigation} items={navigationItems} user={navUser} />
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
          <section aria-label={about.heroEyebrow} className={styles.heroSection}>
            <div className={styles.heroImageShell}>
              <img
                alt="Thorns Tavern magical tabletop creation scene"
                className={styles.heroImage}
                decoding="async"
                fetchPriority="high"
                src="/ui/workbench/model-detail/sketch-assets/rail-banner-bg.png"
              />
              <div className={styles.heroOverlay}>
                <span className={styles.eyebrow}>{about.heroEyebrow}</span>
                <h1>{about.heroTitle}</h1>
                <div className={styles.heroPills}>
                  <span>AI 3D Workflow</span>
                  <span>Model Library</span>
                  <span>Digital Delivery</span>
                  <span>Print Fulfillment</span>
                </div>
              </div>
              <span aria-hidden="true" className={[styles.heroCorner, styles.heroCornerTopLeft].join(' ')} />
              <span aria-hidden="true" className={[styles.heroCorner, styles.heroCornerTopRight].join(' ')} />
              <span aria-hidden="true" className={[styles.heroCorner, styles.heroCornerBottomLeft].join(' ')} />
              <span aria-hidden="true" className={[styles.heroCorner, styles.heroCornerBottomRight].join(' ')} />
            </div>

            <div className={styles.heroContent}>
              <p className={styles.summary}>{about.heroText}</p>
              <div className={styles.heroActions}>
                <Link className={[styles.actionButton, styles.primaryAction].join(' ')} href={about.heroPrimaryCTA.href}>
                  {about.heroPrimaryCTA.label}
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                {about.heroSecondaryCTA ? (
                  <Link className={styles.actionButton} href={about.heroSecondaryCTA.href}>
                    {about.heroSecondaryCTA.label}
                    <ArrowRight aria-hidden="true" size={18} />
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section aria-label="About summary" className={styles.summaryGrid}>
            {about.summaryCards.map((card, index) => {
              const Icon = summaryIcons[index] ?? Sparkles

              return (
                <article className={styles.summaryCard} key={card.title}>
                  <span className={styles.cardIcon}>
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <h2>{card.title}</h2>
                  <p>{card.body}</p>
                </article>
              )
            })}
          </section>

          <section className={styles.detailsSection}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Product Direction</span>
                <h2>Built around the full creation path</h2>
              </div>
              <span className={styles.countChip}>Updated {about.lastUpdated}</span>
            </div>

            <div className={styles.detailGrid}>
              {about.sections.map((section) => (
                <article className={styles.detailCard} key={section.title}>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                  {section.items?.length ? (
                    <div className={styles.itemList}>
                      {section.items.map((item) => (
                        <div className={styles.itemBlock} key={item.title}>
                          <strong>{item.title}</strong>
                          <span>{item.body}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          {about.contactCards?.length ? (
            <section className={styles.nextSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>Next Steps</span>
                  <h2>Move from story to usable assets</h2>
                </div>
              </div>
              <div className={styles.nextGrid}>
                {about.contactCards.map((card) => (
                  <article className={styles.nextCard} key={card.title}>
                    <div>
                      <h3>{card.title}</h3>
                      <p>{card.body}</p>
                    </div>
                    {card.href ? (
                      <Link className={styles.inlineLink} href={card.href}>
                        {card.label}
                        <ArrowRight aria-hidden="true" size={16} />
                      </Link>
                    ) : (
                      <span className={styles.noteChip}>{card.label}</span>
                    )}
                  </article>
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
