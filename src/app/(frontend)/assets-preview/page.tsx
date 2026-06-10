import type { Metadata } from 'next'

import { AuthModalStage } from '@/components/auth/AuthModalStage'

import { FooterBar } from '../_components/shell/FooterBar'
import { getMarketingSiteSettings } from '../_lib/marketing'
import { getCurrentNavUser } from '../_lib/session'

import { AssetsPreviewClient } from './AssetsPreviewClient'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Assets Preview | Thorns Tavern',
}

export default async function AssetsPreviewPage() {
  const [navUser, siteSettings] = await Promise.all([
    getCurrentNavUser(),
    getMarketingSiteSettings(),
  ])

  return (
    <main className={styles.page}>
      <AuthModalStage clipContent={false}>
        <AssetsPreviewClient navUser={navUser} />
        <div className={styles.footerMount}>
          <FooterBar
            footerContent={siteSettings.footer}
            siteDescription={siteSettings.siteDescription}
            supportEmail={siteSettings.supportEmail}
          />
        </div>
      </AuthModalStage>
    </main>
  )
}
