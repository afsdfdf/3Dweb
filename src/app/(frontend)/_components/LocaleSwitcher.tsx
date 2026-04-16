import Link from 'next/link'

import { Badge } from '@/components/ui/badge'

import { localeLabels, locales, type Locale } from '../_lib/locale'

export function LocaleSwitcher({
  currentLocale,
  currentPath,
}: {
  currentLocale: Locale
  currentPath?: string
}) {
  const redirect = currentPath || '/'

  return (
    <div className="flex items-center gap-2">
      {locales.map((locale) => {
        const isActive = locale === currentLocale

        return (
          <Link
            href={`/api/locale?locale=${locale}&redirect=${encodeURIComponent(redirect)}`}
            key={locale}
          >
            <Badge variant={isActive ? 'secondary' : 'outline'}>{localeLabels[locale]}</Badge>
          </Link>
        )
      })}
    </div>
  )
}
