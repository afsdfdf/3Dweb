import type { MetadataRoute } from 'next'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalAppURL()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/account',
        '/workbench',
        '/generate',
        '/results',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
