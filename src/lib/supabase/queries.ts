import type { User as SupabaseAuthUser } from '@supabase/supabase-js'

import { queryPostgres } from '@/lib/postgres'

// Read-only legacy/reporting query facade for historical Supabase tables.
// Do not add billing, credit ledger, or other business mutations here.

type Nullable<T> = null | T

export type AppUser = {
  creditsBalance: number
  email: string | null
  fullName: string | null
  id: string
  lastActiveAt: string | null
  phone: string | null
  role: string
}

export type TaskDoc = {
  callbackPayload: Record<string, unknown>
  completedAt: string | null
  createdAt: string | null
  creditsReserved: number
  creditsSpent: number
  failureReason: string | null
  id: string
  inputMode: string
  parameterSnapshot: Record<string, unknown>
  printRequested: boolean
  progress: number
  prompt: string | null
  provider: string
  providerTaskId: string | null
  resultModel: null | { id: string; title: string | null }
  sourceImage: null | { id: string; url: string | null }
  startedAt: string | null
  status: string
  taskCode: string
  updatedAt: string | null
}

export type ModelDoc = {
  createdAt: string | null
  description: string | null
  dimensions: {
    depthMm: number | null
    heightMm: number | null
    widthMm: number | null
  }
  formats: Array<{
    downloadCredits: number
    file: null | { id: string; mimeType: string | null; url: string | null }
    fileSizeMb: number | null
    format: string
  }>
  id: string
  previewImage: null | { id: string; url: string | null }
  printReady: boolean
  sourceTask: null | { id: string; taskCode: string | null }
  status: string
  tags: Array<{ label: string }>
  title: string
  updatedAt: string | null
  viewerUrl: string | null
  visibility: string
}

export type OrderDoc = {
  amount: number
  createdAt: string | null
  creditsUsed: number
  currency: string
  id: string
  internalNotes: string | null
  materialOption: string | null
  model: null | { id: string; title: string | null }
  orderNumber: string
  paymentStatus: string
  providerCheckoutUrl: string | null
  providerOrderId: string | null
  shippingAddress: string | null
  shippingName: string | null
  shippingPhone: string | null
  sizeOption: string | null
  sourceTask: null | { id: string; taskCode: string | null }
  status: string
  statusUpdatedAt: string | null
  trackingNumber: string | null
  updatedAt: string | null
}

export type CreditAccountDoc = {
  accountLabel: string
  balance: number
  exceptionFlag: boolean
  exceptionReason: string | null
  lifetimePurchased: number
  lifetimeSpent: number
  reservedBalance: number
  status: string
  updatedAt: string | null
}

export type CreditTransactionDoc = {
  amount: number
  balanceAfter: number | null
  createdAt: string | null
  id: string
  notes: string | null
  referenceCode: string
  type: string
}

export type SubscriptionDoc = {
  currentPeriodEnd: string | null
  id: string
  monthlyCredits: number
  planKey: string
  status: string
  updatedAt: string | null
}

export type PublicSiteSettings = {
  announcement: string
  creditPackages: Array<{ credits: number; currency: string; price: number; title: string }>
  emailSettings: {
    branding?: {
      footerText?: string
      productName?: string
    }
    businessTemplates?: Record<string, { ctaLabel: string; intro: string; subject: string }>
    sender?: {
      fromAddress?: string
      fromName?: string
      replyTo?: string
    }
    templates?: Record<string, { ctaLabel: string; intro: string; subject: string }>
  }
  footer: {
    aboutEyebrow: string
    aboutText: string
    aboutTitle: string
    directionEyebrow: string
    directionText: string
    directionTitle: string
  }
  generationPricing: {
    downloadCredits: number
    hybridCredits: number
    imageCredits: number
    textCredits: number
  }
  headerNav: Array<{ href: string; label: string }>
  paymentProviders: {
    orderProvider: string
    providerNotice: string
    subscriptionProvider: string
  }
  siteDescription: string
  siteName: string
  subscriptionPlans: Record<string, { creditsPerMonth: number; description: string; features: Array<{ label: string }>; monthlyPrice: number; name: string; shortLabel: string }>
  supportEmail: string
}

export type PublicHomepageContent = {
  entrySection?: { eyebrow?: string; text?: string; title?: string }
  faq: Array<{ answer: string; question: string }>
  faqSection?: { eyebrow?: string; title?: string }
  featuredWorks: Array<{ category: string; summary: string; title: string; tone: 'blue' | 'pink' | 'violet' }>
  hero?: {
    eyebrow?: string
    primaryCTA?: { href: string; label: string }
    secondaryCTA?: { href: string; label: string }
    subtitle?: string
    title?: string
  }
  introBand?: { eyebrow?: string; text?: string; title?: string }
  processSection?: { eyebrow?: string; title?: string }
  processSteps: Array<{ step: string; text: string; title: string }>
  serviceBlocks: Array<{ text: string; title: string }>
  serviceIntro?: { eyebrow?: string; text?: string; title?: string }
  useCases: Array<{ label: string }>
}

export type TaskDetail = TaskDoc & {
  resultModel: Nullable<ModelDoc>
}

export type PublicShowcaseModel = {
  formats: string[]
  id: string
  previewURL: string | null
  printReady: boolean
  summary: string
  title: string
  viewerURL: string | null
  visibility: string
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  return 0
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function getMediaUrl(row: Record<string, unknown>, prefix: string) {
  const publicUrl = row[`${prefix}_public_url`]
  const storagePath = row[`${prefix}_storage_path`]

  if (typeof publicUrl === 'string' && publicUrl) return publicUrl
  if (typeof storagePath === 'string' && storagePath) return storagePath
  return null
}

export async function getAppUserByAuthUser(authUser: Nullable<SupabaseAuthUser>): Promise<AppUser | null> {
  if (!authUser) return null

  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select
        p.id,
        p.email,
        p.full_name,
        p.role,
        p.phone,
        p.last_active_at,
        coalesce(ca.available_balance, p.credits_balance_cached, 0) as credits_balance
      from public.profiles p
      left join public.credit_accounts ca on ca.user_id = p.id
      where p.id = $1
      limit 1
    `,
    [authUser.id],
  )

  const row = rows[0]
  if (!row) return null

  return {
    creditsBalance: toNumber(row.credits_balance),
    email: typeof row.email === 'string' ? row.email : authUser.email || null,
    fullName: typeof row.full_name === 'string' ? row.full_name : null,
    id: String(row.id),
    lastActiveAt: typeof row.last_active_at === 'string' ? row.last_active_at : null,
    phone: typeof row.phone === 'string' ? row.phone : null,
    role: typeof row.role === 'string' ? row.role : 'customer',
  }
}

export async function listUserTasks(userId: string): Promise<{ docs: TaskDoc[] }> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select
        t.*,
        rm.id as result_model_id,
        rm.title as result_model_title,
        sm.id as source_image_id,
        sm.public_url as source_image_public_url,
        sm.storage_path as source_image_storage_path
      from public.ai_tasks t
      left join public.models rm on rm.id = t.result_model_id
      left join public.media sm on sm.id = t.source_media_id
      where t.user_id = $1
      order by t.updated_at desc nulls last
      limit 20
    `,
    [userId],
  )

  return {
    docs: rows.map<TaskDoc>((row) => ({
      callbackPayload: toRecord(row.callback_payload),
      completedAt: typeof row.completed_at === 'string' ? row.completed_at : null,
      createdAt: typeof row.created_at === 'string' ? row.created_at : null,
      creditsReserved: toNumber(row.credits_reserved),
      creditsSpent: toNumber(row.credits_spent),
      failureReason: typeof row.failure_reason === 'string' ? row.failure_reason : null,
      id: String(row.id),
      inputMode: String(row.input_mode || 'text'),
      parameterSnapshot: toRecord(row.parameter_snapshot),
      printRequested: Boolean(row.print_requested),
      progress: toNumber(row.progress),
      prompt: typeof row.prompt === 'string' ? row.prompt : null,
      provider: String(row.provider || 'custom'),
      providerTaskId: typeof row.provider_task_id === 'string' ? row.provider_task_id : null,
      resultModel: row.result_model_id ? { id: String(row.result_model_id), title: typeof row.result_model_title === 'string' ? row.result_model_title : null } : null,
      sourceImage: row.source_image_id ? { id: String(row.source_image_id), url: getMediaUrl(row, 'source_image') } : null,
      startedAt: typeof row.started_at === 'string' ? row.started_at : null,
      status: String(row.status || 'queued'),
      taskCode: String(row.task_code || ''),
      updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
    })),
  }
}

export async function listUserModels(userId: string): Promise<{ docs: ModelDoc[] }> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select
        m.*,
        pm.id as preview_media_id,
        pm.public_url as preview_media_public_url,
        pm.storage_path as preview_media_storage_path,
        t.id as source_task_id,
        t.task_code as source_task_code
      from public.models m
      left join public.media pm on pm.id = m.preview_media_id
      left join public.ai_tasks t on t.id = m.source_task_id
      where m.owner_id = $1
      order by m.updated_at desc nulls last
      limit 20
    `,
    [userId],
  )

  const modelIds = rows.map((row: Record<string, unknown>) => String(row.id))

  const [assetResult, tagResult] = await Promise.all([
    modelIds.length
      ? queryPostgres<Record<string, unknown>>(
          `
            select
              ma.*,
              mf.id as file_id,
              mf.public_url as file_public_url,
              mf.storage_path as file_storage_path,
              mf.mime_type as file_mime_type
            from public.model_assets ma
            left join public.media mf on mf.id = ma.media_id
            where ma.model_id = any($1::uuid[])
            order by ma.sort_order asc, ma.created_at asc
          `,
          [modelIds],
        )
      : Promise.resolve({ rows: [] as Record<string, unknown>[] }),
    modelIds.length
      ? queryPostgres<Record<string, unknown>>(
          `
            select
              mta.model_id,
              coalesce(mtt_zh.label, mtt_en.label, mt.slug) as label
            from public.model_tag_assignments mta
            join public.model_tags mt on mt.id = mta.tag_id
            left join public.model_tag_translations mtt_en on mtt_en.tag_id = mt.id and mtt_en.locale = 'en'
            left join public.model_tag_translations mtt_zh on mtt_zh.tag_id = mt.id and mtt_zh.locale = 'zh'
            where mta.model_id = any($1::uuid[])
          `,
          [modelIds],
        )
      : Promise.resolve({ rows: [] as Record<string, unknown>[] }),
  ])

  const assetsByModel = new Map<string, ModelDoc['formats']>()
  for (const row of assetResult.rows) {
    const key = String(row.model_id)
    const items = assetsByModel.get(key) || []
    items.push({
      downloadCredits: toNumber(row.download_credits),
      file: row.file_id
        ? {
            id: String(row.file_id),
            mimeType: typeof row.file_mime_type === 'string' ? row.file_mime_type : null,
            url: getMediaUrl(row, 'file'),
          }
        : null,
      fileSizeMb: row.file_size_mb === null || row.file_size_mb === undefined ? null : toNumber(row.file_size_mb),
      format: String(row.asset_format || ''),
    })
    assetsByModel.set(key, items)
  }

  const tagsByModel = new Map<string, Array<{ label: string }>>()
  for (const row of tagResult.rows) {
    const key = String(row.model_id)
    const items = tagsByModel.get(key) || []
    items.push({ label: String(row.label || '') })
    tagsByModel.set(key, items)
  }

  return {
    docs: rows.map<ModelDoc>((row) => ({
      createdAt: typeof row.created_at === 'string' ? row.created_at : null,
      description: typeof row.description === 'string' ? row.description : null,
      dimensions: {
        depthMm: row.depth_mm === null || row.depth_mm === undefined ? null : toNumber(row.depth_mm),
        heightMm: row.height_mm === null || row.height_mm === undefined ? null : toNumber(row.height_mm),
        widthMm: row.width_mm === null || row.width_mm === undefined ? null : toNumber(row.width_mm),
      },
      formats: assetsByModel.get(String(row.id)) || [],
      id: String(row.id),
      previewImage: row.preview_media_id ? { id: String(row.preview_media_id), url: getMediaUrl(row, 'preview_media') } : null,
      printReady: Boolean(row.print_ready),
      sourceTask: row.source_task_id ? { id: String(row.source_task_id), taskCode: typeof row.source_task_code === 'string' ? row.source_task_code : null } : null,
      status: String(row.status || 'draft'),
      tags: tagsByModel.get(String(row.id)) || [],
      title: String(row.title || ''),
      updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
      viewerUrl: typeof row.viewer_url === 'string' ? row.viewer_url : null,
      visibility: String(row.visibility || 'private'),
    })),
  }
}

export async function listUserOrders(userId: string): Promise<{ docs: OrderDoc[] }> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select
        o.*,
        m.id as model_id_joined,
        m.title as model_title,
        t.id as source_task_id_joined,
        t.task_code as source_task_code
      from public.print_orders o
      left join public.models m on m.id = o.model_id
      left join public.ai_tasks t on t.id = o.source_task_id
      where o.user_id = $1
      order by o.updated_at desc nulls last
      limit 20
    `,
    [userId],
  )

  return {
    docs: rows.map<OrderDoc>((row) => ({
      amount: toNumber(row.amount),
      createdAt: typeof row.created_at === 'string' ? row.created_at : null,
      creditsUsed: toNumber(row.credits_used),
      currency: String(row.currency || 'USD'),
      id: String(row.id),
      internalNotes: typeof row.internal_notes === 'string' ? row.internal_notes : null,
      materialOption: typeof row.material_option === 'string' ? row.material_option : null,
      model: row.model_id_joined ? { id: String(row.model_id_joined), title: typeof row.model_title === 'string' ? row.model_title : null } : null,
      orderNumber: String(row.order_number || ''),
      paymentStatus: String(row.payment_status || 'pending'),
      providerCheckoutUrl: typeof row.provider_checkout_url === 'string' ? row.provider_checkout_url : null,
      providerOrderId: typeof row.provider_order_id === 'string' ? row.provider_order_id : null,
      shippingAddress: typeof row.shipping_address === 'string' ? row.shipping_address : null,
      shippingName: typeof row.shipping_name === 'string' ? row.shipping_name : null,
      shippingPhone: typeof row.shipping_phone === 'string' ? row.shipping_phone : null,
      sizeOption: typeof row.size_option === 'string' ? row.size_option : null,
      sourceTask: row.source_task_id_joined ? { id: String(row.source_task_id_joined), taskCode: typeof row.source_task_code === 'string' ? row.source_task_code : null } : null,
      status: String(row.status || 'pending-payment'),
      statusUpdatedAt: typeof row.status_updated_at === 'string' ? row.status_updated_at : null,
      trackingNumber: typeof row.tracking_number === 'string' ? row.tracking_number : null,
      updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
    })),
  }
}

export async function getUserOrderById(userId: string, orderId: string): Promise<OrderDoc | null> {
  const result = await listUserOrders(userId)
  return result.docs.find((doc: OrderDoc) => doc.id === orderId) || null
}

export async function getUserCreditAccount(userId: string): Promise<CreditAccountDoc | null> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select *
      from public.credit_accounts
      where user_id = $1
      limit 1
    `,
    [userId],
  )

  const row = rows[0]
  if (!row) return null

  return {
    accountLabel: String(row.account_label || 'Primary Credit Account'),
    balance: toNumber(row.available_balance),
    exceptionFlag: Boolean(row.exception_flag),
    exceptionReason: typeof row.exception_reason === 'string' ? row.exception_reason : null,
    lifetimePurchased: toNumber(row.lifetime_purchased),
    lifetimeSpent: toNumber(row.lifetime_spent),
    reservedBalance: toNumber(row.reserved_balance),
    status: String(row.status || 'active'),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  }
}

export async function listUserCreditTransactions(userId: string): Promise<{ docs: CreditTransactionDoc[] }> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select *
      from public.credit_ledger_entries
      where user_id = $1
      order by created_at desc nulls last
      limit 20
    `,
    [userId],
  )

  return {
    docs: rows.map<CreditTransactionDoc>((row) => ({
      amount: toNumber(row.balance_delta),
      balanceAfter: row.available_balance_after === null || row.available_balance_after === undefined ? null : toNumber(row.available_balance_after),
      createdAt: typeof row.created_at === 'string' ? row.created_at : null,
      id: String(row.id),
      notes: typeof row.notes === 'string' ? row.notes : null,
      referenceCode: String(row.reference_code || ''),
      type: String(row.entry_type || 'manual_adjustment'),
    })),
  }
}

export async function listUserSubscriptions(userId: string): Promise<{ docs: SubscriptionDoc[] }> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select *
      from public.subscriptions
      where user_id = $1
      order by updated_at desc nulls last
      limit 10
    `,
    [userId],
  )

  return {
    docs: rows.map<SubscriptionDoc>((row) => ({
      currentPeriodEnd: typeof row.current_period_end === 'string' ? row.current_period_end : null,
      id: String(row.id),
      monthlyCredits: toNumber(row.monthly_credits),
      planKey: String(row.plan_key || ''),
      status: String(row.status || 'incomplete'),
      updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
    })),
  }
}

export async function getSiteSettings(): Promise<PublicSiteSettings | null> {
  const [siteResult, navResult, footerResult, planResult, featureResult, creditPackageResult] = await Promise.all([
    queryPostgres<Record<string, unknown>>(`select * from public.site_settings where key = 'default' limit 1`),
    queryPostgres<Record<string, unknown>>(`select * from public.site_navigation_items where site_settings_key = 'default' order by sort_order asc, created_at asc`),
    queryPostgres<Record<string, unknown>>(`select * from public.site_footer_sections where site_settings_key = 'default'`),
    queryPostgres<Record<string, unknown>>(`select * from public.subscription_plans where site_settings_key = 'default' order by sort_order asc, created_at asc`),
    queryPostgres<Record<string, unknown>>(
      `
        select sp.plan_key, spf.label
        from public.subscription_plan_features spf
        join public.subscription_plans sp on sp.id = spf.plan_id
        where sp.site_settings_key = 'default'
        order by sp.sort_order asc, spf.sort_order asc, spf.created_at asc
      `,
    ),
    queryPostgres<Record<string, unknown>>(`select * from public.credit_packages where site_settings_key = 'default' order by sort_order asc, created_at asc`),
  ])

  const siteRow = siteResult.rows[0]
  if (!siteRow) return null

  const footerSections = new Map<string, Record<string, unknown>>()
  for (const row of footerResult.rows) {
    footerSections.set(String(row.section_key), row)
  }

  const featureMap = new Map<string, Array<{ label: string }>>()
  for (const row of featureResult.rows) {
    const key = String(row.plan_key || '')
    const items = featureMap.get(key) || []
    items.push({ label: String(row.label || '') })
    featureMap.set(key, items)
  }

  const subscriptionPlans: PublicSiteSettings['subscriptionPlans'] = {}
  for (const row of planResult.rows) {
    const key = String(row.plan_key || '')
    subscriptionPlans[key] = {
      creditsPerMonth: toNumber(row.credits_per_month),
      description: typeof row.description === 'string' ? row.description : '',
      features: featureMap.get(key) || [],
      monthlyPrice: toNumber(row.monthly_price),
      name: String(row.name || key),
      shortLabel: String(row.short_label || key),
    }
  }

  return {
    announcement: typeof siteRow.announcement === 'string' ? siteRow.announcement : '',
    creditPackages: creditPackageResult.rows.map((row: Record<string, unknown>) => ({
      credits: toNumber(row.credits),
      currency: String(row.currency || 'USD'),
      price: toNumber(row.price),
      title: String(row.title || ''),
    })),
    emailSettings: {
      branding: {
        footerText: typeof siteRow.email_brand_footer_text === 'string' ? siteRow.email_brand_footer_text : undefined,
        productName: typeof siteRow.email_brand_product_name === 'string' ? siteRow.email_brand_product_name : undefined,
      },
      sender: {
        fromAddress: typeof siteRow.email_sender_from_address === 'string' ? siteRow.email_sender_from_address : undefined,
        fromName: typeof siteRow.email_sender_from_name === 'string' ? siteRow.email_sender_from_name : undefined,
        replyTo: typeof siteRow.email_sender_reply_to === 'string' ? siteRow.email_sender_reply_to : undefined,
      },
    },
    footer: {
      aboutEyebrow: String(footerSections.get('about')?.eyebrow || ''),
      aboutText: String(footerSections.get('about')?.body || ''),
      aboutTitle: String(footerSections.get('about')?.title || ''),
      directionEyebrow: String(footerSections.get('direction')?.eyebrow || ''),
      directionText: String(footerSections.get('direction')?.body || ''),
      directionTitle: String(footerSections.get('direction')?.title || ''),
    },
    generationPricing: {
      downloadCredits: toNumber(siteRow.generation_pricing_download_credits),
      hybridCredits: toNumber(siteRow.generation_pricing_hybrid_credits),
      imageCredits: toNumber(siteRow.generation_pricing_image_credits),
      textCredits: toNumber(siteRow.generation_pricing_text_credits),
    },
    headerNav: navResult.rows.map((row: Record<string, unknown>) => ({ href: String(row.href || '/'), label: String(row.label || '') })),
    paymentProviders: {
      orderProvider: String(siteRow.order_provider || 'stripe'),
      providerNotice: typeof siteRow.provider_notice === 'string' ? siteRow.provider_notice : '',
      subscriptionProvider: String(siteRow.subscription_provider || 'stripe'),
    },
    siteDescription: String(siteRow.site_description || ''),
    siteName: String(siteRow.site_name || 'Thorns Tavern'),
    subscriptionPlans,
    supportEmail: String(siteRow.support_email || ''),
  }
}

export async function getHomepageContent(): Promise<PublicHomepageContent | null> {
  const [contentResult, featuredResult, serviceBlockResult, useCaseResult, processResult, faqResult] = await Promise.all([
    queryPostgres<Record<string, unknown>>(`select * from public.homepage_content where key = 'default' limit 1`),
    queryPostgres<Record<string, unknown>>(`select * from public.homepage_featured_works where homepage_content_key = 'default' order by sort_order asc, created_at asc`),
    queryPostgres<Record<string, unknown>>(`select * from public.homepage_service_blocks where homepage_content_key = 'default' order by sort_order asc, created_at asc`),
    queryPostgres<Record<string, unknown>>(`select * from public.homepage_use_cases where homepage_content_key = 'default' order by sort_order asc, created_at asc`),
    queryPostgres<Record<string, unknown>>(`select * from public.homepage_process_steps where homepage_content_key = 'default' order by sort_order asc, created_at asc`),
    queryPostgres<Record<string, unknown>>(`select * from public.homepage_faq_items where homepage_content_key = 'default' order by sort_order asc, created_at asc`),
  ])

  const row = contentResult.rows[0]
  if (!row) return null

  return {
    entrySection: {
      eyebrow: typeof row.entry_section_eyebrow === 'string' ? row.entry_section_eyebrow : undefined,
      text: typeof row.entry_section_text === 'string' ? row.entry_section_text : undefined,
      title: typeof row.entry_section_title === 'string' ? row.entry_section_title : undefined,
    },
    faq: faqResult.rows.map((item: Record<string, unknown>) => ({ answer: String(item.answer || ''), question: String(item.question || '') })),
    faqSection: {
      eyebrow: typeof row.faq_section_eyebrow === 'string' ? row.faq_section_eyebrow : undefined,
      title: typeof row.faq_section_title === 'string' ? row.faq_section_title : undefined,
    },
    featuredWorks: featuredResult.rows.map((item: Record<string, unknown>) => ({
      category: String(item.category || ''),
      summary: String(item.summary || ''),
      title: String(item.title || ''),
      tone: (String(item.tone || 'violet') as 'blue' | 'pink' | 'violet'),
    })),
    hero: {
      eyebrow: typeof row.hero_eyebrow === 'string' ? row.hero_eyebrow : undefined,
      primaryCTA:
        row.hero_primary_cta_label || row.hero_primary_cta_href
          ? { href: String(row.hero_primary_cta_href || '/generate'), label: String(row.hero_primary_cta_label || '') }
          : undefined,
      secondaryCTA:
        row.hero_secondary_cta_label || row.hero_secondary_cta_href
          ? { href: String(row.hero_secondary_cta_href || '/showcase'), label: String(row.hero_secondary_cta_label || '') }
          : undefined,
      subtitle: typeof row.hero_subtitle === 'string' ? row.hero_subtitle : undefined,
      title: typeof row.hero_title === 'string' ? row.hero_title : undefined,
    },
    introBand: {
      eyebrow: typeof row.intro_band_eyebrow === 'string' ? row.intro_band_eyebrow : undefined,
      text: typeof row.intro_band_text === 'string' ? row.intro_band_text : undefined,
      title: typeof row.intro_band_title === 'string' ? row.intro_band_title : undefined,
    },
    processSection: {
      eyebrow: typeof row.process_section_eyebrow === 'string' ? row.process_section_eyebrow : undefined,
      title: typeof row.process_section_title === 'string' ? row.process_section_title : undefined,
    },
    processSteps: processResult.rows.map((item: Record<string, unknown>) => ({
      step: String(item.step_label || ''),
      text: String(item.body || ''),
      title: String(item.title || ''),
    })),
    serviceBlocks: serviceBlockResult.rows.map((item: Record<string, unknown>) => ({ text: String(item.body || ''), title: String(item.title || '') })),
    serviceIntro: {
      eyebrow: typeof row.service_intro_eyebrow === 'string' ? row.service_intro_eyebrow : undefined,
      text: typeof row.service_intro_text === 'string' ? row.service_intro_text : undefined,
      title: typeof row.service_intro_title === 'string' ? row.service_intro_title : undefined,
    },
    useCases: useCaseResult.rows.map((item: Record<string, unknown>) => ({ label: String(item.label || '') })),
  }
}

export async function getTaskByCode(taskCode: string): Promise<TaskDetail | null> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select
        t.*,
        rm.id as result_model_id,
        rm.title as result_model_title,
        rm.status as result_model_status,
        rm.visibility as result_model_visibility,
        rm.viewer_url as result_model_viewer_url,
        rm.print_ready as result_model_print_ready,
        rm.width_mm as result_model_width_mm,
        rm.height_mm as result_model_height_mm,
        rm.depth_mm as result_model_depth_mm,
        rm.description as result_model_description,
        pm.id as preview_media_id,
        pm.public_url as preview_media_public_url,
        pm.storage_path as preview_media_storage_path
      from public.ai_tasks t
      left join public.models rm on rm.id = t.result_model_id
      left join public.media pm on pm.id = rm.preview_media_id
      where t.task_code = $1
      limit 1
    `,
    [taskCode],
  )

  const row = rows[0]
  if (!row) return null

  const baseTask = (await listUserTasks(String(row.user_id))).docs.find((item: TaskDoc) => item.id === String(row.id))
  if (!baseTask) return null

  let resultModel: ModelDoc | null = null
  if (row.result_model_id) {
    const models = await listUserModels(String(row.user_id))
    resultModel = models.docs.find((item: ModelDoc) => item.id === String(row.result_model_id)) || null
  }

  return {
    ...baseTask,
    resultModel,
  }
}

export async function listPublicShowcaseModels(limit = 60): Promise<PublicShowcaseModel[]> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select
        m.id,
        m.title,
        m.description,
        m.visibility,
        m.print_ready,
        pm.public_url as preview_public_url,
        pm.storage_path as preview_storage_path
      from public.models m
      left join public.media pm on pm.id = m.preview_media_id
      where m.visibility = 'public'
      order by m.created_at desc nulls last
      limit $1
    `,
    [limit],
  )

  const ids = rows.map((row: Record<string, unknown>) => String(row.id))
  const assetResult =
    ids.length > 0
      ? await queryPostgres<Record<string, unknown>>(
          `
            select
              ma.model_id,
              ma.asset_format,
              mf.public_url as file_public_url,
              mf.storage_path as file_storage_path
            from public.model_assets ma
            left join public.media mf on mf.id = ma.media_id
            where ma.model_id = any($1::uuid[])
            order by ma.sort_order asc, ma.created_at asc
          `,
          [ids],
        )
      : { rows: [] as Record<string, unknown>[] }

  const assetsByModel = new Map<string, Array<{ format: string; url: string | null }>>()
  for (const row of assetResult.rows) {
    const key = String(row.model_id)
    const items = assetsByModel.get(key) || []
    items.push({
      format: String(row.asset_format || ''),
      url: getMediaUrl(row, 'file'),
    })
    assetsByModel.set(key, items)
  }

  return rows.map((row: Record<string, unknown>) => {
    const assets = assetsByModel.get(String(row.id)) || []
    const preferred = assets.find((item) => item.format.toLowerCase() === 'glb') || assets[0]

    return {
      formats: assets.map((item) => item.format.toUpperCase()),
      id: String(row.id),
      previewURL: getMediaUrl(row, 'preview'),
      printReady: Boolean(row.print_ready),
      summary:
        typeof row.description === 'string' && row.description.trim()
          ? row.description
          : 'This public 3D model can continue into downloads, print orders, and fulfillment workflows.',
      title: String(row.title || ''),
      viewerURL: preferred?.url || null,
      visibility: String(row.visibility || 'public'),
    } satisfies PublicShowcaseModel
  })
}

export async function getPublicShowcaseModelById(id: string): Promise<PublicShowcaseModel | null> {
  const models = await listPublicShowcaseModels(120)
  return models.find((item: PublicShowcaseModel) => item.id === id) || null
}
