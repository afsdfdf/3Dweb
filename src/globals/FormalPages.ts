import type { Field, GlobalConfig } from 'payload'

import { formalPages } from '@/app/(frontend)/_lib/formal-pages'
import { marketingPages } from '@/app/(frontend)/_lib/marketing-content'
import { defaultBlogPageContent } from '@/app/(frontend)/blog/_lib/blogPageDefaults'
import { isSafeBlogHref } from '@/app/(frontend)/blog/_lib/blogSafety'
import { isStaff } from '@/access'
import { buildGuestReadableMediaWhere } from '@/lib/mediaVisibility'

const infoPageOptions = [
  { label: 'About', value: 'about' },
  { label: 'Contact', value: 'contact' },
  { label: 'Privacy Policy', value: 'privacyPolicy' },
  { label: 'Refund Policy', value: 'refundPolicy' },
  { label: 'Shipping Policy', value: 'shippingPolicy' },
]

const marketingPageOptions = [
  { label: 'Features', value: 'features' },
  { label: 'Solutions', value: 'solutions' },
  { label: 'Resources', value: 'resources' },
  { label: 'Developers', value: 'developers' },
  { label: 'Pricing', value: 'pricing' },
  { label: 'Showcase', value: 'showcase' },
]

const infoPageDefaults = Object.entries(formalPages).map(([pageKey, page]) => ({
  pageKey,
  ...page,
}))

const marketingPageDefaults = Object.entries(marketingPages).map(([pageKey, page]) => ({
  pageKey,
  ...page,
  sections: page.sections.map((section) => ({
    ...section,
    anchorId: section.id,
    bullets: section.bullets?.map((label) => ({ label })),
  })),
}))

const blogPageSecondaryCTA = defaultBlogPageContent.heroSecondaryCTA || {
  href: '/showcase',
  label: 'Explore Models',
}

const blogPageDefaultValue = {
  articleCTA: defaultBlogPageContent.articleCTA,
  articleLabels: defaultBlogPageContent.articleLabels,
  categoryLabels: defaultBlogPageContent.categoryLabels,
  dispatchesLabel: defaultBlogPageContent.dispatchesLabel,
  heroEyebrow: defaultBlogPageContent.heroEyebrow,
  heroImage: null,
  heroImageAlt: defaultBlogPageContent.heroImageAlt,
  heroPrimaryCTA: defaultBlogPageContent.heroPrimaryCTA,
  heroSecondaryCTA: blogPageSecondaryCTA,
  heroText: defaultBlogPageContent.heroText,
  heroTitle: defaultBlogPageContent.heroTitle,
  listingLabels: defaultBlogPageContent.listingLabels,
  paginationLabels: defaultBlogPageContent.paginationLabels,
  seoDescription: defaultBlogPageContent.seoDescription,
  seoTitle: defaultBlogPageContent.seoTitle,
}

const blogHrefHelpText = 'Use internal paths like /workbench or full https:// URLs. Protocol-relative, javascript:, and data: URLs are blocked.'

const validateBlogHref = (value: unknown) => {
  return isSafeBlogHref(value) || blogHrefHelpText
}

const ctaFields: Field[] = [
  { name: 'label', type: 'text', required: true, label: 'Label' },
  { name: 'href', type: 'text', required: true, label: 'Link' },
]

const createBlogCTAFields = (defaultCTA?: { href?: string; label?: string }): Field[] => [
  { name: 'label', type: 'text', required: true, defaultValue: defaultCTA?.label ?? '', label: 'Label' },
  {
    name: 'href',
    type: 'text',
    required: true,
    defaultValue: defaultCTA?.href ?? '',
    label: 'Link',
    validate: validateBlogHref,
    admin: {
      description: blogHrefHelpText,
    },
  },
]

const infoPageFields: Field[] = [
  {
    name: 'pageKey',
    type: 'select',
    required: true,
    label: 'Page',
    options: infoPageOptions,
  },
  { name: 'currentPath', type: 'text', required: true, label: 'Route path' },
  { name: 'heroEyebrow', type: 'text', required: true, label: 'Hero eyebrow' },
  { name: 'heroTitle', type: 'textarea', required: true, label: 'Hero title' },
  { name: 'heroText', type: 'textarea', required: true, label: 'Hero text' },
  { name: 'lastUpdated', type: 'text', required: true, label: 'Last updated label' },
  {
    name: 'heroPrimaryCTA',
    type: 'group',
    label: 'Primary CTA',
    fields: ctaFields,
  },
  {
    name: 'heroSecondaryCTA',
    type: 'group',
    label: 'Secondary CTA',
    fields: ctaFields,
  },
  {
    name: 'summaryCards',
    type: 'array',
    required: true,
    label: 'Summary cards',
    fields: [
      { name: 'title', type: 'text', required: true, label: 'Title' },
      { name: 'body', type: 'textarea', required: true, label: 'Body' },
    ],
  },
  {
    name: 'sections',
    type: 'array',
    required: true,
    label: 'Detail sections',
    fields: [
      { name: 'title', type: 'text', required: true, label: 'Title' },
      { name: 'body', type: 'textarea', required: true, label: 'Body' },
      {
        name: 'items',
        type: 'array',
        label: 'Section items',
        fields: [
          { name: 'title', type: 'text', required: true, label: 'Title' },
          { name: 'body', type: 'textarea', required: true, label: 'Body' },
        ],
      },
    ],
  },
  {
    name: 'contactCards',
    type: 'array',
    label: 'Helpful links',
    fields: [
      { name: 'title', type: 'text', required: true, label: 'Title' },
      { name: 'body', type: 'textarea', required: true, label: 'Body' },
      { name: 'label', type: 'text', required: true, label: 'Link label' },
      { name: 'href', type: 'text', label: 'Link' },
    ],
  },
]

const marketingPageFields: Field[] = [
  {
    name: 'pageKey',
    type: 'select',
    required: true,
    label: 'Page',
    options: marketingPageOptions,
  },
  { name: 'currentPath', type: 'text', required: true, label: 'Route path' },
  { name: 'heroEyebrow', type: 'text', required: true, label: 'Hero eyebrow' },
  { name: 'heroTitle', type: 'textarea', required: true, label: 'Hero title' },
  { name: 'heroText', type: 'textarea', required: true, label: 'Hero text' },
  {
    name: 'heroPrimaryCTA',
    type: 'group',
    label: 'Primary CTA',
    fields: ctaFields,
  },
  {
    name: 'heroSecondaryCTA',
    type: 'group',
    label: 'Secondary CTA',
    fields: ctaFields,
  },
  {
    name: 'sections',
    type: 'array',
    required: true,
    label: 'Sections',
    fields: [
      { name: 'anchorId', type: 'text', required: true, label: 'Anchor ID' },
      { name: 'eyebrow', type: 'text', required: true, label: 'Eyebrow' },
      { name: 'title', type: 'textarea', required: true, label: 'Title' },
      { name: 'text', type: 'textarea', required: true, label: 'Text' },
      {
        name: 'cards',
        type: 'array',
        label: 'Cards',
        fields: [
          { name: 'title', type: 'text', required: true, label: 'Title' },
          { name: 'text', type: 'textarea', required: true, label: 'Text' },
          { name: 'note', type: 'text', label: 'Note' },
        ],
      },
      {
        name: 'bullets',
        type: 'array',
        label: 'Bullets',
        fields: [{ name: 'label', type: 'textarea', required: true, label: 'Bullet' }],
      },
    ],
  },
]

const blogPageFields: Field[] = [
  {
    type: 'collapsible',
    label: 'Blog hero banner and CTAs',
    fields: [
      { name: 'heroEyebrow', type: 'text', required: true, defaultValue: defaultBlogPageContent.heroEyebrow, label: 'Hero eyebrow' },
      { name: 'heroTitle', type: 'textarea', required: true, defaultValue: defaultBlogPageContent.heroTitle, label: 'Hero title' },
      { name: 'heroText', type: 'textarea', required: true, defaultValue: defaultBlogPageContent.heroText, label: 'Hero text' },
      {
        name: 'heroImage',
        type: 'upload',
        relationTo: 'media',
        label: 'Hero banner image',
        filterOptions: () => buildGuestReadableMediaWhere(),
        admin: {
          description: 'Controls the wide banner at the top of /blog. Public rendering requires media with publicAccess enabled or purpose set to preview. The recommended banner ratio is about 5:1.',
        },
      },
      { name: 'heroImageAlt', type: 'text', required: true, defaultValue: defaultBlogPageContent.heroImageAlt, label: 'Hero image alt text' },
      {
        name: 'heroPrimaryCTA',
        type: 'group',
        defaultValue: defaultBlogPageContent.heroPrimaryCTA,
        label: 'Primary CTA',
        fields: createBlogCTAFields(defaultBlogPageContent.heroPrimaryCTA),
      },
      {
        name: 'heroSecondaryCTA',
        type: 'group',
        defaultValue: blogPageSecondaryCTA,
        label: 'Secondary CTA',
        fields: createBlogCTAFields(blogPageSecondaryCTA),
      },
      { name: 'dispatchesLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.dispatchesLabel, label: 'Post count label' },
      {
        name: 'categoryLabels',
        type: 'group',
        defaultValue: defaultBlogPageContent.categoryLabels,
        label: 'Category labels',
        fields: [
          { name: 'all', type: 'text', required: true, defaultValue: defaultBlogPageContent.categoryLabels.all, label: 'All label' },
          { name: 'articles', type: 'text', required: true, defaultValue: defaultBlogPageContent.categoryLabels.articles, label: 'Articles label' },
          { name: 'events', type: 'text', required: true, defaultValue: defaultBlogPageContent.categoryLabels.events, label: 'Events label' },
          {
            name: 'announcements',
            type: 'text',
            required: true,
            defaultValue: defaultBlogPageContent.categoryLabels.announcements,
            label: 'Announcements label',
          },
        ],
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Listing, search, and empty states',
    fields: [
      {
        name: 'listingLabels',
        type: 'group',
        defaultValue: defaultBlogPageContent.listingLabels,
        label: 'Listing labels',
        fields: [
          { name: 'readArticleLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.listingLabels.readArticleLabel, label: 'Read article link label' },
          { name: 'searchAriaLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.listingLabels.searchAriaLabel, label: 'Search accessibility label' },
          { name: 'searchPlaceholder', type: 'text', required: true, defaultValue: defaultBlogPageContent.listingLabels.searchPlaceholder, label: 'Search placeholder' },
          { name: 'searchButtonLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.listingLabels.searchButtonLabel, label: 'Search button label' },
          { name: 'emptyTitle', type: 'text', required: true, defaultValue: defaultBlogPageContent.listingLabels.emptyTitle, label: 'Empty state title' },
          { name: 'emptyText', type: 'textarea', required: true, defaultValue: defaultBlogPageContent.listingLabels.emptyText, label: 'Empty state text' },
          { name: 'emptyCTALabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.listingLabels.emptyCTALabel, label: 'Empty state CTA label' },
          {
            name: 'emptyCTAHref',
            type: 'text',
            required: true,
            defaultValue: defaultBlogPageContent.listingLabels.emptyCTAHref,
            label: 'Empty state CTA link',
            validate: validateBlogHref,
            admin: {
              description: blogHrefHelpText,
            },
          },
          { name: 'pinnedTitle', type: 'text', required: true, defaultValue: defaultBlogPageContent.listingLabels.pinnedTitle, label: 'Pinned sidebar title' },
          { name: 'pinnedEmptyText', type: 'textarea', required: true, defaultValue: defaultBlogPageContent.listingLabels.pinnedEmptyText, label: 'Pinned sidebar empty text' },
          { name: 'dateFallbackLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.listingLabels.dateFallbackLabel, label: 'Date fallback label' },
          { name: 'readingTimeSuffix', type: 'text', required: true, defaultValue: defaultBlogPageContent.listingLabels.readingTimeSuffix, label: 'Reading time suffix' },
          { name: 'defaultExcerpt', type: 'textarea', required: true, defaultValue: defaultBlogPageContent.listingLabels.defaultExcerpt, label: 'Default article excerpt' },
        ],
      },
      {
        name: 'paginationLabels',
        type: 'group',
        defaultValue: defaultBlogPageContent.paginationLabels,
        label: 'Pagination labels',
        fields: [
          { name: 'previousLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.paginationLabels.previousLabel, label: 'Previous label' },
          { name: 'nextLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.paginationLabels.nextLabel, label: 'Next label' },
          { name: 'pageLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.paginationLabels.pageLabel, label: 'Page label' },
          { name: 'ofLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.paginationLabels.ofLabel, label: 'Of label' },
        ],
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Article detail page',
    fields: [
      {
        name: 'articleLabels',
        type: 'group',
        defaultValue: defaultBlogPageContent.articleLabels,
        label: 'Article detail labels',
        fields: [
          { name: 'breadcrumbRootLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleLabels.breadcrumbRootLabel, label: 'Breadcrumb root label' },
          { name: 'videoEyebrow', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleLabels.videoEyebrow, label: 'Video eyebrow' },
          { name: 'videoOpenLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleLabels.videoOpenLabel, label: 'Open video label' },
          { name: 'videoIframeTitle', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleLabels.videoIframeTitle, label: 'Video iframe title' },
          { name: 'videoFallbackLabel', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleLabels.videoFallbackLabel, label: 'Video fallback label' },
          { name: 'articleImageFallbackAlt', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleLabels.articleImageFallbackAlt, label: 'Article image fallback alt' },
          { name: 'emptyBodyText', type: 'textarea', required: true, defaultValue: defaultBlogPageContent.articleLabels.emptyBodyText, label: 'Empty article body text' },
          { name: 'relatedEyebrow', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleLabels.relatedEyebrow, label: 'Related posts eyebrow' },
          { name: 'relatedTitle', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleLabels.relatedTitle, label: 'Related posts title' },
        ],
      },
      {
        name: 'articleCTA',
        type: 'group',
        defaultValue: defaultBlogPageContent.articleCTA,
        label: 'Article CTA',
        fields: [
          { name: 'eyebrow', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleCTA.eyebrow, label: 'Eyebrow' },
          { name: 'title', type: 'text', required: true, defaultValue: defaultBlogPageContent.articleCTA.title, label: 'Title' },
          { name: 'text', type: 'textarea', required: true, defaultValue: defaultBlogPageContent.articleCTA.text, label: 'Text' },
          {
            name: 'primaryCTA',
            type: 'group',
            defaultValue: defaultBlogPageContent.articleCTA.primaryCTA,
            label: 'Primary CTA',
            fields: createBlogCTAFields(defaultBlogPageContent.articleCTA.primaryCTA),
          },
          {
            name: 'secondaryCTA',
            type: 'group',
            defaultValue: defaultBlogPageContent.articleCTA.secondaryCTA,
            label: 'Secondary CTA',
            fields: createBlogCTAFields(defaultBlogPageContent.articleCTA.secondaryCTA),
          },
        ],
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'SEO',
    fields: [
      { name: 'seoTitle', type: 'text', required: true, defaultValue: defaultBlogPageContent.seoTitle, label: 'SEO title' },
      {
        name: 'seoDescription',
        type: 'textarea',
        required: true,
        defaultValue: defaultBlogPageContent.seoDescription,
        label: 'SEO description',
      },
    ],
  },
]

export const FormalPages: GlobalConfig = {
  slug: 'formal-pages',
  label: 'Formal Pages',
  admin: {
    description: 'Edit public formal page copy, CTAs, summaries, and detail sections.',
    group: 'Content',
  },
  access: {
    read: () => true,
    update: isStaff,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Info pages',
          fields: [
            {
              name: 'infoPages',
              type: 'array',
              defaultValue: infoPageDefaults,
              label: 'Info pages',
              labels: {
                plural: 'Info pages',
                singular: 'Info page',
              },
              fields: infoPageFields,
            },
          ],
        },
        {
          label: 'Marketing pages',
          fields: [
            {
              name: 'marketingPages',
              type: 'array',
              defaultValue: marketingPageDefaults,
              label: 'Marketing pages',
              labels: {
                plural: 'Marketing pages',
                singular: 'Marketing page',
              },
              fields: marketingPageFields,
            },
          ],
        },
        {
          label: 'Blog',
          fields: [
            {
              name: 'blogPage',
              type: 'group',
              defaultValue: blogPageDefaultValue,
              label: 'Blog page content',
              fields: blogPageFields,
            },
          ],
        },
      ],
    },
  ],
}
