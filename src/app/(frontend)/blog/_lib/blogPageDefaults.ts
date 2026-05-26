export type BlogPageCTA = {
  href: string
  label: string
}

export type BlogPageCategoryLabels = {
  announcements: string
  articles: string
  events: string
}

export type BlogPageContent = {
  categoryLabels: BlogPageCategoryLabels
  dispatchesLabel: string
  heroEyebrow: string
  heroImageAlt: string
  heroImageSrc: string
  heroPrimaryCTA: BlogPageCTA
  heroSecondaryCTA?: BlogPageCTA
  heroText: string
  heroTitle: string
  seoDescription: string
  seoTitle: string
}

export const defaultBlogHeroImageSrc = '/ui/workbench/model-detail/sketch-assets/rail-banner-bg.webp'

export const defaultBlogPageContent: BlogPageContent = {
  categoryLabels: {
    announcements: 'Announcements',
    articles: 'Articles',
    events: 'Events',
  },
  dispatchesLabel: 'Dispatches',
  heroEyebrow: 'Tavern Journal',
  heroImageAlt: 'A dark fantasy workshop table with printed miniatures and tools',
  heroImageSrc: defaultBlogHeroImageSrc,
  heroPrimaryCTA: {
    href: '/workbench',
    label: 'Open Studio',
  },
  heroSecondaryCTA: {
    href: '/showcase',
    label: 'Explore Models',
  },
  heroText:
    'Tutorials, creator stories, platform updates, and production notes for turning ideas into collectible 3D worlds.',
  heroTitle: 'Notes from the forge, field, and tavern',
  seoDescription: 'Tutorials, platform updates, creator stories, and 3D production notes from Thorns Tavern.',
  seoTitle: 'Tavern Journal | Thorns Tavern',
}
