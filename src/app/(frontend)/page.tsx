import { Button } from '@/components/ui/button'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { getMediaAccessURL } from '@/lib/s3SignedURL'

import { HomeHeroWorkbench } from './_components/HomeHeroWorkbench'
import { HomeFeaturedRail, type FeaturedItem } from './_components/home/HomeFeaturedRail'
import { HomeCollectionShelf, type HomeCollectionShelfItem } from './_components/home/HomeCollectionShelf'
import { HomeInspirationSection } from './_components/home/HomeInspirationSection'
import { SiteShell } from './_components/SiteShell'
import { getMarketingSiteData } from './_lib/marketing'
import { mapModelToPublicModelThumbnailCardVM } from './_lib/mappers/modelCardMappers'
import { getCurrentUser } from './_lib/session'

type HomepageModelCard = {
  formats: string[]
  id: number
  previewURL: string | null
  summary: string
  title: string
}

type HomepageManagedContent = {
  collectionShelfItems: HomeCollectionShelfItem[]
  featuredRailItems: FeaturedItem[]
}

const getPreviewURL = (model: any) => {
  const preview = model?.previewImage
  if (preview && typeof preview === 'object' && typeof preview.url === 'string') {
    return preview.url
  }

  const sourceTask =
    model?.sourceTask && typeof model.sourceTask === 'object' && !Array.isArray(model.sourceTask) ? model.sourceTask : null
  const callbackPayload =
    sourceTask?.callbackPayload && typeof sourceTask.callbackPayload === 'object' && !Array.isArray(sourceTask.callbackPayload)
      ? sourceTask.callbackPayload
      : null

  return callbackPayload && typeof callbackPayload.thumbnailUrl === 'string' ? callbackPayload.thumbnailUrl : null
}

const getFormats = (model: any) => {
  const formats = Array.isArray(model?.formats) ? model.formats : []
  return formats.map((item: any) => String(item?.format || '').toUpperCase()).filter(Boolean)
}

async function getHomepageItemPreviewURL(payload: Awaited<ReturnType<typeof getCachedPayload>>, item: any) {
  const directCover =
    item?.coverImage && typeof item.coverImage === 'object' && typeof item.coverImage.url === 'string' ? item.coverImage.url : null

  if (directCover) {
    return getMediaAccessURL({
      payload,
      url: directCover,
    })
  }

  if (item?.linkedModel && typeof item.linkedModel === 'object' && !Array.isArray(item.linkedModel)) {
    return getMediaAccessURL({
      payload,
      url: getPreviewURL(item.linkedModel),
    })
  }

  if (item?.linkedBundle && typeof item.linkedBundle === 'object' && !Array.isArray(item.linkedBundle)) {
    const bundleCover =
      item.linkedBundle.coverImage && typeof item.linkedBundle.coverImage === 'object' && typeof item.linkedBundle.coverImage.url === 'string'
        ? item.linkedBundle.coverImage.url
        : null

    return getMediaAccessURL({
      payload,
      url: bundleCover,
    })
  }

  return null
}

async function getHomepageManagedContent(): Promise<HomepageManagedContent> {
  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'homepage-items',
    depth: 2,
    limit: 20,
    overrideAccess: false,
    pagination: false,
    sort: ['placement', '-isPinned', 'sortOrder', '-publishAt'],
    where: {
      placement: {
        in: ['featured-rail', 'collection-shelf'],
      },
    },
  })

  const featuredRailItems: FeaturedItem[] = []
  const collectionShelfItems: HomeCollectionShelfItem[] = []

  for (const item of result.docs) {
    const previewSrc = await getHomepageItemPreviewURL(payload, item)

    if (item.placement === 'featured-rail' && previewSrc) {
      featuredRailItems.push({
        alt: typeof item.title === 'string' ? item.title : 'Homepage featured item',
        fallbackSrc: previewSrc,
        id: String(item.id),
        imageSrc: previewSrc,
        variant: item.railVariant === 'wide' ? 'wide' : 'standard',
      })
    }

    if (item.placement === 'collection-shelf' && previewSrc) {
      const linkedBundle =
        item.linkedBundle && typeof item.linkedBundle === 'object' && !Array.isArray(item.linkedBundle) ? item.linkedBundle : null
      const linkedModel =
        item.linkedModel && typeof item.linkedModel === 'object' && !Array.isArray(item.linkedModel) ? item.linkedModel : null
      const count =
        typeof item.itemCountLabel === 'string' && item.itemCountLabel.trim()
          ? item.itemCountLabel
          : linkedBundle && Array.isArray(linkedBundle.models)
            ? `Products x${linkedBundle.models.length}`
            : linkedModel
              ? `Products x${Math.max(1, Array.isArray(linkedModel.formats) ? linkedModel.formats.length : 1)}`
              : 'Products x1'

      collectionShelfItems.push({
        count,
        previewSrc,
        title: typeof item.title === 'string' ? item.title : 'Homepage collection item',
      })
    }
  }

  return {
    collectionShelfItems,
    featuredRailItems,
  }
}

async function getHomepagePublicModels(): Promise<HomepageModelCard[]> {
  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'models',
    depth: 2,
    limit: 24,
    overrideAccess: false,
    pagination: false,
    sort: '-updatedAt',
    where: {
      visibility: {
        equals: 'public',
      },
    },
  })

  return await Promise.all(
    result.docs.map(async (model: any) => ({
      formats: getFormats(model),
      id: Number(model.id),
      previewURL: await getMediaAccessURL({
        payload,
        url: getPreviewURL(model),
      }),
      summary:
        typeof model.description === 'string' && model.description.trim()
          ? model.description
          : 'Public model asset available for showcase, download, and print workflows.',
      title: typeof model.title === 'string' ? model.title : `Model ${model.id}`,
    })),
  )
}

const BACKEND_MEDIA_PREVIEW_URLS = [
  'http://localhost:3000/api/media/file/miniforge-upload-1776638413157-products5-1.png?prefix=media',
  'http://localhost:3000/api/media/file/miniforge-upload-1776638408197-products3-1.png?prefix=media',
  'http://localhost:3000/api/media/file/miniforge-upload-1776638400155-products2-1.png?prefix=media',
] as const
const BACKEND_MEDIA_PREVIEW_URL_SET = new Set<string>(BACKEND_MEDIA_PREVIEW_URLS)
const FEATURED_NEW_PRODUCT_IMAGE_URLS = [
  'http://localhost:3000/api/media/file/miniforge-upload-1776640760207-new-product1-1.png?prefix=media',
  'http://localhost:3000/api/media/file/miniforge-upload-1776640769000-new-product2-1.png?prefix=media',
  'http://localhost:3000/api/media/file/miniforge-upload-1776640773480-new-product3-1.png?prefix=media',
  'http://localhost:3000/api/media/file/miniforge-upload-1776640777789-new-product4-1.png?prefix=media',
] as const
const FEATURED_NEW_PRODUCT_FALLBACK_SRCS = [
  '/ui/frames/new product1.png',
  '/ui/frames/new product2.png',
  '/ui/frames/new product3.png',
  '/ui/frames/new product4.png',
] as const

export default async function HomePage() {
  const [user, marketing, publicModels, managedContent] = await Promise.all([
    getCurrentUser(),
    getMarketingSiteData(),
    getHomepagePublicModels(),
    getHomepageManagedContent(),
  ])
  const { siteSettings } = marketing
  const inspirationModels = publicModels.slice(0, 24)
  const heroPreviewSeeds = publicModels.map((item) => item.previewURL).filter((value): value is string => Boolean(value)).slice(0, 2)
  const featuredItems: FeaturedItem[] =
    managedContent.featuredRailItems.length > 0
      ? managedContent.featuredRailItems
      : FEATURED_NEW_PRODUCT_IMAGE_URLS.map((imageSrc, index) => ({
          alt: `New product ${index + 1}`,
          fallbackSrc: FEATURED_NEW_PRODUCT_FALLBACK_SRCS[index] ?? FEATURED_NEW_PRODUCT_FALLBACK_SRCS[0],
          id: `featured-new-product-${index + 1}`,
          imageSrc,
          variant: index === 0 ? 'wide' : 'standard',
        }))
  const inspirationItems = inspirationModels.map((model) => mapModelToPublicModelThumbnailCardVM(model))
  const collectionShelfPreviewItems: HomeCollectionShelfItem[] = BACKEND_MEDIA_PREVIEW_URLS.map((previewSrc, index) => ({
    count: '1 products',
    previewSrc,
    title: `Library Preview ${index + 1}`,
  }))
  const collectionShelfItems: HomeCollectionShelfItem[] =
    managedContent.collectionShelfItems.length > 0
      ? [
          ...managedContent.collectionShelfItems.slice(0, 3),
          {
            count: 'All',
            isMore: true,
            title: 'More',
          },
        ]
      : [
          ...collectionShelfPreviewItems,
          ...publicModels
            .filter((model) => Boolean(model.previewURL))
            .map((model) => ({
              count: `${model.formats.length || 1} products`,
              previewSrc: model.previewURL ?? undefined,
              title: model.title,
            }))
            .filter((item) => !BACKEND_MEDIA_PREVIEW_URL_SET.has(item.previewSrc ?? '')),
          {
            count: 'All',
            isMore: true,
            title: 'More',
          },
        ]

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath="/"
      footer={siteSettings.footer}
      navigation={siteSettings.headerNav}
      showUtilityNav={false}
      user={user}
    >
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_43%,rgba(78,88,198,0.34),transparent_24%),radial-gradient(circle_at_50%_58%,rgba(36,44,120,0.88),transparent_40%),linear-gradient(180deg,#17171c_0%,#181923_28%,#151723_52%,#181818_86%,#181818_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_50%_30%,rgba(255,214,132,0.08),transparent_16%),linear-gradient(90deg,rgba(255,255,255,0.018),transparent_18%,transparent_82%,rgba(255,255,255,0.018))]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[280px] bg-[linear-gradient(180deg,rgba(24,24,24,0)_0%,rgba(24,24,24,0.24)_24%,rgba(24,24,24,0.58)_52%,rgba(24,24,24,0.86)_78%,#181818_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[120px] bg-[linear-gradient(180deg,rgba(48,56,142,0.12)_0%,rgba(24,24,24,0.08)_42%,rgba(24,24,24,0)_100%)] blur-[18px]" />
        <div className="pointer-events-none absolute left-[4%] top-[18%] hidden h-[280px] w-[180px] rotate-[-15deg] rounded-[30px] bg-[radial-gradient(circle_at_40%_40%,rgba(118,136,255,0.45),transparent_36%),linear-gradient(180deg,#2a2d39_0%,#12131a_100%)] opacity-70 blur-[2px] lg:block" />
        <div className="pointer-events-none absolute left-[18%] top-[29%] hidden h-[140px] w-[80px] rotate-[-28deg] rounded-[24px] border border-[#433a2d] bg-[radial-gradient(circle_at_50%_30%,rgba(121,144,255,0.5),transparent_28%),linear-gradient(180deg,#312521_0%,#171820_100%)] shadow-[0_18px_50px_rgba(0,0,0,0.32)] lg:block" />
        <div className="pointer-events-none absolute right-[9%] top-[16%] hidden h-[330px] w-[190px] rotate-[19deg] rounded-[40px] border border-[#4d3b24] bg-[radial-gradient(circle_at_50%_28%,rgba(255,157,76,0.66),transparent_18%),radial-gradient(circle_at_52%_34%,rgba(93,99,255,0.52),transparent_24%),linear-gradient(180deg,#47311f_0%,#171820_72%)] shadow-[0_26px_70px_rgba(0,0,0,0.4)] lg:block" />
        <div className="pointer-events-none absolute right-[1%] top-[15%] hidden h-[280px] w-[120px] rotate-[24deg] rounded-[28px] bg-[radial-gradient(circle_at_50%_30%,rgba(102,77,255,0.28),transparent_34%),linear-gradient(180deg,#1e2130_0%,#0f1015_100%)] opacity-60 blur-[1px] xl:block" />

        <div className="relative mx-auto min-h-[780px] max-w-[1600px] px-4 pb-16 pt-10 sm:px-6 sm:pb-20 lg:pt-10">
          <div className="absolute right-6 top-6 hidden w-[210px] rounded-[18px] border border-[#4c3a22] bg-[linear-gradient(180deg,#1d1e24_0%,#0f1014_100%)] p-4 shadow-[0_16px_44px_rgba(0,0,0,0.35)] xl:block">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full border border-[#e2c78f] bg-[radial-gradient(circle_at_48%_35%,#f8eee8_0_26%,#eacfc8_27%_40%,transparent_41%),linear-gradient(135deg,#f6d9d0,#eee)]" />
              <div>
                <p className="text-sm font-semibold text-[#f0e6d0]">{user?.email ? 'Your account' : 'Guest profile'}</p>
                <p className="mt-1 text-xs leading-5 text-[#8f9199]">Profile and workbench access.</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button className="border-[#5c4a35] bg-[#17181b] text-[#d8d0bf] hover:bg-[#23252b]" size="sm" variant="outline">
                Profile
              </Button>
              <Button className="border-[#5c4a35] bg-[#17181b] text-[#d8d0bf] hover:bg-[#23252b]" size="sm" variant="outline">
                Orders
              </Button>
            </div>
          </div>
          <HomeHeroWorkbench fallbackPreviewUrls={heroPreviewSeeds} />
        </div>
      </section>
      <HomeFeaturedRail copy={marketing.homepageContent.featuredRail} items={featuredItems} />
      <HomeCollectionShelf copy={marketing.homepageContent.collectionShelf} items={collectionShelfItems} />
      <HomeInspirationSection items={inspirationItems} />
    </SiteShell>
  )
}
