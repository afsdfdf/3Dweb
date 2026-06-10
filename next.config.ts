import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllowedDevOrigins } from './src/lib/envGuard'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const allowedDevOrigins = getAllowedDevOrigins()

const getSupabaseImageRemotePatterns = () => {
  const hosts = new Set(['umxjtmlmxwjwnbivuxep.supabase.co'])

  for (const value of [process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL]) {
    if (!value) continue

    try {
      const hostname = new URL(value).hostname
      if (hostname.endsWith('.supabase.co')) {
        hosts.add(hostname)
      }
    } catch {
      // Ignore malformed local env values; production env validation reports them separately.
    }
  }

  return [...hosts].map((hostname) => ({
    protocol: 'https' as const,
    hostname,
    pathname: '/storage/v1/**',
  }))
}

const nextConfig: NextConfig = {
  allowedDevOrigins,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/ui/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/ui-lab/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/ui/**',
      },
      {
        pathname: '/ui-lab/**',
      },
    ],
    remotePatterns: getSupabaseImageRemotePatterns(),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const payloadConfig = withPayload(nextConfig, { devBundleServerPackages: false })

// Sentry wrapping is opt-in: only active when NEXT_PUBLIC_SENTRY_DSN is set.
// When the env var is absent (local dev, CI) the build is unaffected.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(payloadConfig, {
      silent: true,
      telemetry: false,
      // Upload source maps only in CI/production to keep local builds fast
      sourcemaps: { disable: process.env.CI !== 'true' },
    })
  : payloadConfig
