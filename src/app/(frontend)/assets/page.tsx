import type { Metadata } from 'next'

import { AuthModalStage } from '@/components/auth/AuthModalStage'

import { FooterBar } from '../_components/shell/FooterBar'
import { getMarketingSiteSettings } from '../_lib/marketing'
import { getCurrentNavUser, requireUser } from '../_lib/session'
import { AssetsPreviewClient } from '../assets-preview/AssetsPreviewClient'
import styles from '../assets-preview/page.module.css'

import { getAssetsPageData } from './_lib/assetsData'

export const metadata: Metadata = {
  title: 'Assets | Thorns Tavern',
}

export default async function AssetsPage() {
  await requireUser('/assets')

  const [navUser, siteSettings, assetsData] = await Promise.all([
    getCurrentNavUser(),
    getMarketingSiteSettings(),
    getAssetsPageData(),
  ])

  return (
    <main className={styles.page}>
      <AuthModalStage clipContent={false}>
        <AssetsPreviewClient initialData={assetsData} navUser={navUser} />
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
