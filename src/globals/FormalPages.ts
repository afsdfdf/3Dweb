import type { Field, GlobalConfig } from 'payload'

import { formalPages } from '@/app/(frontend)/_lib/formal-pages'
import { marketingPages } from '@/app/(frontend)/_lib/marketing-content'
import { defaultBlogPageContent } from '@/app/(frontend)/blog/_lib/blogPageDefaults'
import { isStaff } from '@/access'

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
  categoryLabels: defaultBlogPageContent.categoryLabels,
  dispatchesLabel: defaultBlogPageContent.dispatchesLabel,
  heroEyebrow: defaultBlogPageContent.heroEyebrow,
  heroImage: null,
  heroImageAlt: defaultBlogPageContent.heroImageAlt,
  heroPrimaryCTA: defaultBlogPageContent.heroPrimaryCTA,
  heroSecondaryCTA: blogPageSecondaryCTA,
  heroText: defaultBlogPageContent.heroText,
  heroTitle: defaultBlogPageContent.heroTitle,
  seoDescription: defaultBlogPageContent.seoDescription,
  seoTitle: defaultBlogPageContent.seoTitle,
}

const ctaFields: Field[] = [
  { name: 'label', type: 'text', required: true, label: 'Label' },
  { name: 'href', type: 'text', required: true, label: 'Link' },
]

const createBlogCTAFields = (defaultCTA?: { href?: string; label?: string }): Field[] => [
  { name: 'label', type: 'text', required: true, defaultValue: defaultCTA?.label ?? '', label: 'Label' },
  { name: 'href', type: 'text', required: true, defaultValue: defaultCTA?.href ?? '', label: 'Link' },
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
  { name: 'heroEyebrow', type: 'text', required: true, defaultValue: defaultBlogPageContent.heroEyebrow, label: 'Hero eyebrow' },
  { name: 'heroTitle', type: 'textarea', required: true, defaultValue: defaultBlogPageContent.heroTitle, label: 'Hero title' },
  { name: 'heroText', type: 'textarea', required: true, defaultValue: defaultBlogPageContent.heroText, label: 'Hero text' },
  {
    name: 'heroImage',
    type: 'upload',
    relationTo: 'media',
    label: 'Hero image',
    admin: {
      description: 'Public rendering requires media with publicAccess enabled or purpose set to preview.',
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
    label: 'Hero category labels',
    fields: [
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
  { name: 'seoTitle', type: 'text', required: true, defaultValue: defaultBlogPageContent.seoTitle, label: 'SEO title' },
  {
    name: 'seoDescription',
    type: 'textarea',
    required: true,
    defaultValue: defaultBlogPageContent.seoDescription,
    label: 'SEO description',
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
              label: 'Blog page header',
              fields: blogPageFields,
            },
          ],
        },
      ],
    },
  ],
}
