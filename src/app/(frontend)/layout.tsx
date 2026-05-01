import React from 'react'

import './globals.css'

import { AuthModalProvider } from '@/components/auth/AuthModalProvider'

import { FrontendAssetCache } from './_components/FrontendAssetCache'
import { LocaleProvider } from './_components/LocaleProvider'
import { getCurrentLocale } from './_lib/locale-server'

export const metadata = {
  description: 'AI 3D character generation, model management, and print fulfillment platform built with Payload CMS and Next.js.',
  title: 'Thorns Tavern',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const locale = await getCurrentLocale()

  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'}>
      <body>
        <FrontendAssetCache />
        <LocaleProvider locale={locale}>
          <AuthModalProvider>
            <main>{children}</main>
          </AuthModalProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
