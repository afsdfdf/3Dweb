import { cookies } from 'next/headers'

import { localeCookieName, normalizeLocale, type Locale } from './locale'

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  return normalizeLocale(cookieStore.get(localeCookieName)?.value)
}
