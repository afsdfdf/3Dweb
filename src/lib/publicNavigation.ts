export const publicNavigationItems = [
  { href: '/', id: 'HOME', label: 'HOME' },
  { href: '/workbench', id: 'WORKBENCH', label: 'WORKBENCH' },
  { href: '/pricing', id: 'PLANS', label: 'PLANS' },
  { href: '/about', id: 'ABOUT', label: 'ABOUT' },
] as const

export type PublicNavigationItem = (typeof publicNavigationItems)[number]

export const publicShellNavigationItems = publicNavigationItems.map(({ href, label }) => ({
  href,
  label,
}))

export function getPublicNavigationActiveID(currentPath?: null | string) {
  const path = currentPath || '/'
  const activeItem = publicNavigationItems
    .filter((item) => (item.href === '/' ? path === '/' : path.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]

  return activeItem?.id ?? 'HOME'
}
