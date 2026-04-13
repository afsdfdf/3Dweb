import Link from 'next/link'

import type { MarketingPageContent } from '../_lib/marketing-content'
import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentUser } from '../_lib/session'
import { SiteShell } from './SiteShell'

type MarketingPageProps = {
  page: MarketingPageContent
}

export async function MarketingPage({ page }: MarketingPageProps) {
  const [user, marketing] = await Promise.all([getCurrentUser(), getMarketingSiteData()])
  const { siteSettings } = marketing

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath={page.currentPath}
      footer={siteSettings.footer}
      navigation={siteSettings.headerNav}
      user={user}
    >
      <section className="section-hero compact">
        <div>
          <p className="eyebrow">{page.heroEyebrow}</p>
          <h1>{page.heroTitle}</h1>
          <p className="section-lead">{page.heroText}</p>
        </div>
        <div className="button-column" style={{ minWidth: 240 }}>
          <Link className="primary-button" href={page.heroPrimaryCTA.href}>
            {page.heroPrimaryCTA.label}
          </Link>
          {page.heroSecondaryCTA ? (
            <Link className="ghost-button" href={page.heroSecondaryCTA.href}>
              {page.heroSecondaryCTA.label}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="records-grid marketing-sections-grid">
        {page.sections.map((section) => (
          <article className="panel" id={section.id} key={section.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{section.eyebrow}</p>
                <h2>{section.title}</h2>
              </div>
            </div>

            <p className="section-lead">{section.text}</p>

            {section.cards?.length ? (
              <div className="card-section compact-cards">
                {section.cards.map((card) => (
                  <article className="mini-card" key={card.title}>
                    <h3>{card.title}</h3>
                    <p className="soft-text">{card.text}</p>
                    {card.note ? <span className="metric-pill">{card.note}</span> : null}
                  </article>
                ))}
              </div>
            ) : null}

            {section.bullets?.length ? (
              <ul className="check-list" style={{ marginTop: 18 }}>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>
    </SiteShell>
  )
}
