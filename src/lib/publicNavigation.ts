export const publicNavigationItems = [
  { href: '/', id: 'HOME', label: 'HOME' },
  { href: '/workbench', id: 'WORKBENCH', label: 'WORKBENCH' },
  { href: '/assets', id: 'ASSETS', label: 'ASSETS' },
  { href: '/showcase', id: 'SHOWCASE', label: 'SHOWCASE' },
  { href: '/pricing', id: 'PLANS', label: 'PLANS' },
  { href: '/blog', id: 'BLOG', label: 'BLOG' },
  { href: '/about', id: 'ABOUT', label: 'ABOUT' },
] as const

export type PublicNavigationItem = (typeof publicNavigationItems)[number]
export type PublicNavigationInputItem = {
  href?: null | string
  id?: null | string
  label?: null | string
}
export type ResolvedPublicNavigationItem = {
  href: string
  id: string
  label: string
}

export const publicShellNavigationItems = publicNavigationItems.map(({ href, label }) => ({
  href,
  label,
}))

const defaultNavigationByHref: Map<string, (typeof publicNavigationItems)[number]> = new Map(
  publicNavigationItems.map((item) => [item.href, item]),
)

const normalizeNavigationID = (item: PublicNavigationInputItem) => {
  const matchedDefault = item.href ? defaultNavigationByHref.get(item.href) : null
  if (matchedDefault) return matchedDefault.id

  const source = item.id || item.label || item.href || 'NAV'
  const normalized = source
    .replace(/^\/+/, '')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  return normalized || 'NAV'
}

export function resolvePublicNavigationItems(
  navigation?: null | readonly PublicNavigationInputItem[],
): ResolvedPublicNavigationItem[] {
  const source = navigation && navigation.length > 0 ? navigation : publicNavigationItems
  const resolved = source
    .map((item) => {
      const href = typeof item.href === 'string' && item.href.trim() ? item.href.trim() : ''
      const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim() : ''

      if (!href || !label) return null

      return {
        href,
        id: normalizeNavigationID(item),
        label,
      }
    })
    .filter((item): item is ResolvedPublicNavigationItem => Boolean(item))

  return resolved.length > 0 ? resolved : [...publicNavigationItems]
}

export function getPublicNavigationActiveID(
  currentPath?: null | string,
  navigation?: null | readonly PublicNavigationInputItem[],
) {
  const path = currentPath || '/'
  const activeItem = resolvePublicNavigationItems(navigation)
    .filter((item) => (item.href === '/' ? path === '/' : path.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]

  return activeItem?.id ?? 'HOME'
}
