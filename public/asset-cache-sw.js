const CACHE_VERSION = 'v2'
const MODEL_CACHE = `miniforge-model-assets-${CACHE_VERSION}`
const MEDIA_CACHE = `miniforge-media-assets-${CACHE_VERSION}`
const STATIC_3D_CACHE = `miniforge-static-3d-assets-${CACHE_VERSION}`
const UI_LAB_CACHE = `miniforge-ui-lab-assets-${CACHE_VERSION}`

const MAX_MODEL_ENTRIES = 80
const MAX_MEDIA_ENTRIES = 800
const MAX_STATIC_3D_ENTRIES = 30
const MAX_UI_LAB_ENTRIES = 600

function isModelViewerRequest(url) {
  return url.origin === self.location.origin && /^\/api\/platform\/models\/[^/]+\/viewer$/.test(url.pathname)
}

function isMediaFileRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/api/media/file/')
}

function isStatic3DRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/three-draco/gltf/')
}

function isUiLabAssetRequest(url) {
  return url.origin === self.location.origin && (url.pathname.startsWith('/ui-lab/') || url.pathname.startsWith('/ui/'))
}

function getRuntimeCacheConfig(request) {
  if (request.method !== 'GET') return null

  const url = new URL(request.url)

  if (isModelViewerRequest(url)) {
    return {
      cacheName: MODEL_CACHE,
      maxEntries: MAX_MODEL_ENTRIES,
    }
  }

  if (isMediaFileRequest(url)) {
    return {
      cacheName: MEDIA_CACHE,
      maxEntries: MAX_MEDIA_ENTRIES,
    }
  }

  if (isStatic3DRequest(url)) {
    return {
      cacheName: STATIC_3D_CACHE,
      maxEntries: MAX_STATIC_3D_ENTRIES,
    }
  }

  if (isUiLabAssetRequest(url)) {
    return {
      cacheName: UI_LAB_CACHE,
      maxEntries: MAX_UI_LAB_ENTRIES,
    }
  }

  return null
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length <= maxEntries) return

  const deleteCount = keys.length - maxEntries
  await Promise.all(keys.slice(0, deleteCount).map((request) => cache.delete(request)))
}

async function cacheFirst(request, config) {
  const cache = await caches.open(config.cacheName)
  const cached = await cache.match(request)

  if (cached) {
    void cache.put(request, cached.clone())
    return cached
  }

  const response = await fetch(request)

  if (response && (response.ok || response.type === 'opaque')) {
    await cache.put(request, response.clone())
    void trimCache(config.cacheName, config.maxEntries)
  }

  return response
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith('miniforge-model-assets-') ||
                key.startsWith('miniforge-media-assets-') ||
                key.startsWith('miniforge-static-3d-assets-') ||
                key.startsWith('miniforge-ui-lab-assets-'),
            )
            .filter((key) => ![MODEL_CACHE, MEDIA_CACHE, STATIC_3D_CACHE, UI_LAB_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const config = getRuntimeCacheConfig(event.request)
  if (!config) return

  event.respondWith(cacheFirst(event.request, config))
})
