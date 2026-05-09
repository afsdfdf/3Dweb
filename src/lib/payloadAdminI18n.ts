import type { CollectionConfig, GlobalConfig } from 'payload'

import { adminPhrase } from '@/lib/adminPhrase'

type MutableRecord = Record<string, any>

const collectionLabelDefaults: Record<string, { plural: string; singular: string }> = {
  'addresses': { plural: 'Address Book', singular: 'Address' },
  'announcements': { plural: 'Announcements', singular: 'Announcement' },
  'avatar-frame-styles': { plural: 'Avatar Frame Styles', singular: 'Avatar Frame Style' },
  'billing-subscriptions': { plural: 'Subscriptions', singular: 'Subscription' },
  'credit-products': { plural: 'Credit Products', singular: 'Credit Product' },
  'credit-transactions': { plural: 'Credit Transactions', singular: 'Credit Transaction' },
  'credits': { plural: 'Credit Accounts', singular: 'Credit Account' },
  'email-verification-codes': { plural: 'Email Verification Codes', singular: 'Email Verification Code' },
  'engagement-views': { plural: 'Engagement Views', singular: 'Engagement View' },
  'generation-tasks': { plural: 'Generation Tasks', singular: 'Generation Task' },
  'homepage-items': { plural: 'Homepage Items', singular: 'Homepage Item' },
  'media': { plural: 'Media Assets', singular: 'Media Asset' },
  'model-bundles': { plural: 'Model Bundles', singular: 'Model Bundle' },
  'model-comments': { plural: 'Model Comments', singular: 'Model Comment' },
  'model-favorites': { plural: 'Model Favorites', singular: 'Model Favorite' },
  'model-likes': { plural: 'Model Likes', singular: 'Model Like' },
  'models': { plural: 'Models', singular: 'Model' },
  'posts': { plural: 'Posts & Events', singular: 'Post / Event' },
  'print-orders': { plural: 'Print Orders', singular: 'Print Order' },
  'shopify-payments': { plural: 'Payments', singular: 'Payment' },
  'task-events': { plural: 'Task Events', singular: 'Task Event' },
  'user-follows': { plural: 'User Follows', singular: 'User Follow' },
  'user-notifications': { plural: 'User Notifications', singular: 'User Notification' },
  'users': { plural: 'Users', singular: 'User' },
}

const acronymPattern = /\b(Api|Cta|Fbx|Glb|Id|Obj|Stl|Ui|Url|Usd|Usdz|Json|Smtp|Ssl|Pbr)\b/g
const acronymReplacements: Record<string, string> = {
  Api: 'API',
  Cta: 'CTA',
  Fbx: 'FBX',
  Glb: 'GLB',
  Id: 'ID',
  Json: 'JSON',
  Obj: 'OBJ',
  Pbr: 'PBR',
  Smtp: 'SMTP',
  Ssl: 'SSL',
  Stl: 'STL',
  Ui: 'UI',
  Url: 'URL',
  Usd: 'USD',
  Usdz: 'USDZ',
}

const humanizeName = (value: string): string => {
  const spaced = value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()

  if (!spaced) {
    return value
  }

  const sentence = `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}`
  return sentence.replace(acronymPattern, (match) => acronymReplacements[match] || match)
}

const localizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return adminPhrase(value)
  }

  return value
}

const localizeLabels = (target: MutableRecord) => {
  if (!target.labels || typeof target.labels !== 'object') {
    return
  }

  const labels = target.labels as MutableRecord
  labels.plural = localizeValue(labels.plural)
  labels.singular = localizeValue(labels.singular)
}

const localizeOptions = (options: unknown) => {
  if (!Array.isArray(options)) {
    return
  }

  for (const option of options) {
    if (option && typeof option === 'object' && 'label' in option) {
      ;(option as MutableRecord).label = localizeValue((option as MutableRecord).label)
    }
  }
}

const localizeField = (field: unknown) => {
  if (!field || typeof field !== 'object') {
    return
  }

  const target = field as MutableRecord

  if (typeof target.name === 'string' && target.type !== 'ui' && target.label === undefined) {
    target.label = adminPhrase(humanizeName(target.name))
  } else {
    target.label = localizeValue(target.label)
  }

  localizeLabels(target)
  localizeOptions(target.options)

  if (target.admin && typeof target.admin === 'object') {
    target.admin.description = localizeValue(target.admin.description)
  }

  if (Array.isArray(target.fields)) {
    target.fields.forEach(localizeField)
  }

  if (Array.isArray(target.tabs)) {
    localizeTabs(target.tabs)
  }
}

const localizeTabs = (tabs: unknown[]) => {
  for (const tab of tabs) {
    if (!tab || typeof tab !== 'object') {
      continue
    }

    const target = tab as MutableRecord
    target.label = localizeValue(target.label)

    if (Array.isArray(target.fields)) {
      target.fields.forEach(localizeField)
    }
  }
}

const localizeAdminConfig = <TConfig extends CollectionConfig | GlobalConfig>(config: TConfig): TConfig => {
  const target = config as MutableRecord
  target.label = localizeValue(target.label)
  localizeLabels(target)

  if (target.admin && typeof target.admin === 'object') {
    target.admin.description = localizeValue(target.admin.description)
    target.admin.group = localizeValue(target.admin.group)
  }

  if (Array.isArray(target.fields)) {
    target.fields.forEach(localizeField)
  }

  return config
}

export const localizeCollectionAdminConfig = <TConfig extends CollectionConfig>(config: TConfig): TConfig => {
  const target = config as MutableRecord

  if (!target.labels && collectionLabelDefaults[config.slug]) {
    target.labels = collectionLabelDefaults[config.slug]
  }

  return localizeAdminConfig(config)
}

export const localizeGlobalAdminConfig = <TConfig extends GlobalConfig>(config: TConfig): TConfig =>
  localizeAdminConfig(config)
