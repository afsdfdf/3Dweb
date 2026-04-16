'use client'

import { createContext, useContext } from 'react'

import type { Locale } from '../_lib/locale'

const LocaleContext = createContext<Locale>('en')

export function LocaleProvider({
  children,
  locale,
}: {
  children: React.ReactNode
  locale: Locale
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}
