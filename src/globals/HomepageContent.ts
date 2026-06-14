import type { GlobalConfig } from 'payload'

import { defaultHomepageContent } from '@/app/(frontend)/_lib/marketing-content'
import { isStaff } from '@/access'
import { adminTextKey } from '@/lib/adminText'
import { buildGuestReadableMediaWhere } from '@/lib/mediaVisibility'

export const HomepageContent: GlobalConfig = {
  slug: 'homepage-content',
  label: adminTextKey('globals.homepageContent.label'),
  admin: {
    group: adminTextKey('groups.content'),
  },
  access: {
    read: () => true,
    update: isStaff,
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Hero',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.hero.eyebrow, label: 'Eyebrow' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.hero.title, label: 'Title' },
        { name: 'subtitle', type: 'textarea', defaultValue: defaultHomepageContent.hero.subtitle, label: 'Subtitle' },
        {
          name: 'headerBackground',
          type: 'upload',
          relationTo: 'media',
          label: 'Header background',
          admin: {
            description: 'Optional override for the homepage hero header background. Choose preview or public media for anonymous visitors.',
          },
          filterOptions: () => buildGuestReadableMediaWhere(),
        },
        {
          name: 'primaryCTA',
          type: 'group',
          label: 'Primary CTA',
          fields: [
            { name: 'label', type: 'text', defaultValue: defaultHomepageContent.hero.primaryCTA.label, label: 'Label' },
            { name: 'href', type: 'text', defaultValue: defaultHomepageContent.hero.primaryCTA.href, label: 'Link' },
          ],
        },
        {
          name: 'secondaryCTA',
          type: 'group',
          label: 'Secondary CTA',
          fields: [
            { name: 'label', type: 'text', defaultValue: defaultHomepageContent.hero.secondaryCTA.label, label: 'Label' },
            { name: 'href', type: 'text', defaultValue: defaultHomepageContent.hero.secondaryCTA.href, label: 'Link' },
          ],
        },
      ],
    },
    {
      name: 'introBand',
      type: 'group',
      label: 'Intro band',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.introBand.eyebrow, label: 'Eyebrow' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.introBand.title, label: 'Title' },
        { name: 'text', type: 'textarea', defaultValue: defaultHomepageContent.introBand.text, label: 'Text' },
      ],
    },
    {
      name: 'featuredRail',
      type: 'group',
      label: 'Featured image rail',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.featuredRail.eyebrow, label: 'Eyebrow' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.featuredRail.title, label: 'Title' },
        { name: 'searchLabel', type: 'text', defaultValue: defaultHomepageContent.featuredRail.searchLabel, label: 'Search button label' },
        { name: 'moreLabel', type: 'text', defaultValue: defaultHomepageContent.featuredRail.moreLabel, label: 'More button label' },
      ],
    },
    {
      name: 'featuredWorks',
      type: 'array',
      label: 'Featured directions',
      fields: [
        { name: 'category', type: 'text', required: true, label: 'Category' },
        { name: 'title', type: 'text', required: true, label: 'Title' },
        { name: 'summary', type: 'textarea', label: 'Summary' },
        { name: 'tone', type: 'select', defaultValue: 'violet', label: 'Tone', options: ['violet', 'blue', 'pink'] },
      ],
      defaultValue: defaultHomepageContent.featuredWorks,
    },
    {
      name: 'serviceIntro',
      type: 'group',
      label: 'Service intro',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.serviceIntro.eyebrow, label: 'Eyebrow' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.serviceIntro.title, label: 'Title' },
        { name: 'text', type: 'textarea', defaultValue: defaultHomepageContent.serviceIntro.text, label: 'Text' },
      ],
    },
    {
      name: 'collectionShelf',
      type: 'group',
      label: 'Collection shelf',
      fields: [
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.collectionShelf.title, label: 'Title' },
        { name: 'hotLabel', type: 'text', defaultValue: defaultHomepageContent.collectionShelf.hotLabel, label: 'Hot label' },
        { name: 'newLabel', type: 'text', defaultValue: defaultHomepageContent.collectionShelf.newLabel, label: 'New label' },
        { name: 'moreLabel', type: 'text', defaultValue: defaultHomepageContent.collectionShelf.moreLabel, label: 'More label' },
        { name: 'allLabel', type: 'text', defaultValue: defaultHomepageContent.collectionShelf.allLabel, label: 'All entry label' },
      ],
    },
    {
      name: 'serviceBlocks',
      type: 'array',
      label: 'Service cards',
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Title' },
        { name: 'text', type: 'textarea', required: true, label: 'Description' },
      ],
      defaultValue: defaultHomepageContent.serviceBlocks,
    },
    {
      name: 'useCases',
      type: 'array',
      label: 'Use cases',
      fields: [{ name: 'label', type: 'text', required: true, label: 'Use case' }],
      defaultValue: defaultHomepageContent.useCases,
    },
    {
      name: 'processSection',
      type: 'group',
      label: 'Process section',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.processSection.eyebrow, label: 'Eyebrow' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.processSection.title, label: 'Title' },
      ],
    },
    {
      name: 'processSteps',
      type: 'array',
      label: 'Process steps',
      fields: [
        { name: 'step', type: 'text', required: true, label: 'Step' },
        { name: 'title', type: 'text', required: true, label: 'Title' },
        { name: 'text', type: 'textarea', required: true, label: 'Description' },
      ],
      defaultValue: defaultHomepageContent.processSteps,
    },
    {
      name: 'entrySection',
      type: 'group',
      label: 'Entry section',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.entrySection.eyebrow, label: 'Eyebrow' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.entrySection.title, label: 'Title' },
        { name: 'text', type: 'textarea', defaultValue: defaultHomepageContent.entrySection.text, label: 'Text' },
      ],
    },
    {
      name: 'faqSection',
      type: 'group',
      label: 'FAQ section',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.faqSection.eyebrow, label: 'Eyebrow' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.faqSection.title, label: 'Title' },
      ],
    },
    {
      name: 'faq',
      type: 'array',
      label: 'FAQ',
      fields: [
        { name: 'question', type: 'text', required: true, label: 'Question' },
        { name: 'answer', type: 'textarea', required: true, label: 'Answer' },
      ],
      defaultValue: defaultHomepageContent.faq,
    },
  ],
}
