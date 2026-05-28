export type BlogPageCTA = {
  href: string
  label: string
}

export type BlogPageCategoryLabels = {
  announcements: string
  all: string
  articles: string
  events: string
}

export type BlogPageListingLabels = {
  dateFallbackLabel: string
  defaultExcerpt: string
  emptyCTAHref: string
  emptyCTALabel: string
  emptyText: string
  emptyTitle: string
  pinnedEmptyText: string
  pinnedTitle: string
  readArticleLabel: string
  readingTimeSuffix: string
  searchAriaLabel: string
  searchButtonLabel: string
  searchPlaceholder: string
}

export type BlogPagePaginationLabels = {
  nextLabel: string
  ofLabel: string
  pageLabel: string
  previousLabel: string
}

export type BlogPageArticleLabels = {
  articleImageFallbackAlt: string
  breadcrumbRootLabel: string
  emptyBodyText: string
  relatedEyebrow: string
  relatedTitle: string
  videoEyebrow: string
  videoFallbackLabel: string
  videoIframeTitle: string
  videoOpenLabel: string
}

export type BlogPageArticleCTA = {
  eyebrow: string
  primaryCTA: BlogPageCTA
  secondaryCTA: BlogPageCTA
  text: string
  title: string
}

export type BlogPageContent = {
  articleCTA: BlogPageArticleCTA
  articleLabels: BlogPageArticleLabels
  categoryLabels: BlogPageCategoryLabels
  dispatchesLabel: string
  heroEyebrow: string
  heroImageAlt: string
  heroImageSrc: string
  heroPrimaryCTA: BlogPageCTA
  heroSecondaryCTA?: BlogPageCTA
  heroText: string
  heroTitle: string
  listingLabels: BlogPageListingLabels
  paginationLabels: BlogPagePaginationLabels
  seoDescription: string
  seoTitle: string
}

export const defaultBlogHeroImageSrc = '/ui/workbench/model-detail/sketch-assets/rail-banner-bg.webp'

export const defaultBlogPageContent: BlogPageContent = {
  articleCTA: {
    eyebrow: 'Create next',
    primaryCTA: {
      href: '/workbench',
      label: 'Open Studio',
    },
    secondaryCTA: {
      href: '/bundles',
      label: 'Browse Bundles',
    },
    text: 'Start in the Workbench, browse public models, or collect a themed bundle for your next scene.',
    title: 'Ready to build your own artifact?',
  },
  articleLabels: {
    articleImageFallbackAlt: 'Article image',
    breadcrumbRootLabel: 'Tavern Journal',
    emptyBodyText: 'This dispatch is being prepared by the tavern team.',
    relatedEyebrow: 'More from the board',
    relatedTitle: 'Related dispatches',
    videoEyebrow: 'Field footage',
    videoFallbackLabel: 'Watch the linked video',
    videoIframeTitle: 'Article video',
    videoOpenLabel: 'Open video',
  },
  categoryLabels: {
    announcements: 'Announcements',
    all: 'All',
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
  listingLabels: {
    dateFallbackLabel: 'Recently',
    defaultExcerpt: 'A production note from the Thorns Tavern team.',
    emptyCTAHref: '/showcase',
    emptyCTALabel: 'Explore models',
    emptyText: 'New creator notes and production dispatches will appear here soon.',
    emptyTitle: 'The tavern board is being prepared.',
    pinnedEmptyText: 'Published journal notes will appear here after the first dispatch goes live.',
    pinnedTitle: 'Pinned notes',
    readArticleLabel: 'Read dispatch',
    readingTimeSuffix: 'min read',
    searchAriaLabel: 'Search Tavern Journal',
    searchButtonLabel: 'Search',
    searchPlaceholder: 'Search notes, guides, and releases',
  },
  paginationLabels: {
    nextLabel: 'Next',
    ofLabel: 'of',
    pageLabel: 'Page',
    previousLabel: 'Previous',
  },
  seoDescription: 'Tutorials, platform updates, creator stories, and 3D production notes from Thorns Tavern.',
  seoTitle: 'Tavern Journal | Thorns Tavern',
}
