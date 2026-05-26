type SupabaseImageResizeMode = 'contain' | 'cover' | 'fill'

export type SupabaseImageTransformPreset =
  | 'home-card'
  | 'home-feature'
  | 'library-card'
  | 'model-card'
  | 'model-card-large'
  | 'square-preview'

type SupabaseImageTransformOptions = {
  height: number
  quality: number
  resize: SupabaseImageResizeMode
  width: number
}

export const supabaseImageTransformPresets: Record<SupabaseImageTransformPreset, SupabaseImageTransformOptions> = {
  'home-card': {
    height: 744,
    quality: 82,
    resize: 'cover',
    width: 456,
  },
  'home-feature': {
    height: 720,
    quality: 76,
    resize: 'contain',
    width: 960,
  },
  'library-card': {
    height: 744,
    quality: 78,
    resize: 'contain',
    width: 456,
  },
  'model-card': {
    height: 873,
    quality: 75,
    resize: 'cover',
    width: 640,
  },
  'model-card-large': {
    height: 1340,
    quality: 76,
    resize: 'cover',
    width: 840,
  },
  'square-preview': {
    height: 768,
    quality: 75,
    resize: 'contain',
    width: 768,
  },
}

const SUPABASE_PUBLIC_OBJECT_PREFIX = '/storage/v1/object/public/'
const SUPABASE_PUBLIC_RENDER_PREFIX = '/storage/v1/render/image/public/'

function isSupabaseStorageHost(hostname: string) {
  return hostname === 'supabase.co' || hostname.endsWith('.supabase.co')
}

export function getSupabasePreviewImageURL(value: string, preset?: SupabaseImageTransformPreset): string
export function getSupabasePreviewImageURL(value: null | undefined, preset?: SupabaseImageTransformPreset): null
export function getSupabasePreviewImageURL(
  value: null | string | undefined,
  preset?: SupabaseImageTransformPreset,
): null | string
export function getSupabasePreviewImageURL(value: null | string | undefined, preset: SupabaseImageTransformPreset = 'model-card') {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed) return value ?? null

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return trimmed
  }

  if (!isSupabaseStorageHost(parsed.hostname)) {
    return trimmed
  }

  if (parsed.pathname.startsWith(SUPABASE_PUBLIC_OBJECT_PREFIX)) {
    parsed.pathname = parsed.pathname.replace(SUPABASE_PUBLIC_OBJECT_PREFIX, SUPABASE_PUBLIC_RENDER_PREFIX)
  } else if (!parsed.pathname.startsWith(SUPABASE_PUBLIC_RENDER_PREFIX)) {
    return trimmed
  }

  const options = supabaseImageTransformPresets[preset]
  parsed.searchParams.set('width', String(options.width))
  parsed.searchParams.set('height', String(options.height))
  parsed.searchParams.set('resize', options.resize)
  parsed.searchParams.set('quality', String(options.quality))

  return parsed.toString()
}
