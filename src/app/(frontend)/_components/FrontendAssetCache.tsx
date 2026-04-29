'use client'

import { useEffect } from 'react'

export function FrontendAssetCache() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') return
    if (!('serviceWorker' in navigator)) return

    void navigator.serviceWorker.register('/asset-cache-sw.js', {
      scope: '/',
    })
  }, [])

  return null
}
