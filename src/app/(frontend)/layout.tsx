import React from 'react'

import './globals.css'

import { AuthModalProvider } from '@/components/auth/AuthModalProvider'

import { FrontendAssetCache } from './_components/FrontendAssetCache'
import { LocaleProvider } from './_components/LocaleProvider'
import { getCurrentLocale } from './_lib/locale-server'

export const metadata = {
  description: 'AI 3D character generation, model management, and print fulfillment platform built with Payload CMS and Next.js.',
  icons: {
    apple: '/apple-touch-icon.png',
    icon: [
      { sizes: '16x16', type: 'image/png', url: '/favicon-16x16.png' },
      { sizes: '32x32', type: 'image/png', url: '/favicon-32x32.png' },
    ],
    shortcut: '/favicon.ico',
  },
  other: {
    google: 'notranslate',
  },
  title: 'Thorns Tavern',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const locale = await getCurrentLocale()

  return (
    <html className="notranslate" lang={locale === 'zh' ? 'zh-CN' : 'en'} translate="no">
      <body className="notranslate" translate="no">
        <FrontendAssetCache />
        <LocaleProvider locale={locale}>
          <AuthModalProvider>{children}</AuthModalProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
