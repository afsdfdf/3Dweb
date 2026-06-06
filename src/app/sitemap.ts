import type { MetadataRoute } from 'next'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'

const staticPaths = [
  '',
  '/pricing',
  '/features',
  '/blog',
  '/bundles',
  '/showcase',
  '/about',
  '/contact',
  '/solutions',
  '/developers',
  '/resources',
  '/privacy-policy',
  '/refund-policy',
  '/shipping-policy',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getCanonicalAppURL()

  return staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))
}
