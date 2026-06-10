import Image from 'next/image'

import { getSupabasePreviewImageURL } from '@/lib/supabase/imageTransform'

export type FeaturedItem = {
  alt: string
  fallbackSrc: string
  id: string
  imageSrc?: null | string
  variant: 'standard' | 'wide'
}

type HomeFeaturedRailCopy = {
  moreLabel?: null | string
  title?: null | string
}

const FRAME_SRC = '/ui/frames/newproduct.png'

const SLOT_CLASS_BY_VARIANT: Record<FeaturedItem['variant'], string> = {
  standard: 'relative h-full min-w-0 overflow-hidden rounded-[16px]',
  wide: 'relative h-full min-w-0 overflow-hidden rounded-[16px]',
}

export function HomeFeaturedRail({ copy, items }: { copy?: HomeFeaturedRailCopy; items: FeaturedItem[] }) {
  return (
    <section className="relative z-[2] mx-auto -mt-8 max-w-[var(--public-page-max-width)] bg-[linear-gradient(180deg,rgba(24,24,24,0)_0%,rgba(24,24,24,0.82)_42%,#181818_100%)] px-4 pt-2 sm:px-[var(--public-page-gutter)]">
      <div className="relative overflow-hidden rounded-[18px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" aria-hidden="true" className="pointer-events-none block h-auto w-full select-none" src={FRAME_SRC} />

        <div className="absolute inset-x-[2.2%] top-[5.3%] z-[2] flex items-center justify-between">
          <div className="rounded-[8px] bg-black/45 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#efe7da] shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
            {copy?.title || 'New Product'}
          </div>
          <div className="rounded-[8px] bg-black/45 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#efe7da] shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
            {copy?.moreLabel || 'More'}
          </div>
        </div>

        <div className="absolute inset-x-[1.4%] bottom-[8.8%] top-[7.7%] grid grid-cols-[1.75fr_1fr_1fr_1fr] gap-[1.1%]">
          {items.map((item) => {
            const resolvedSrc = item.imageSrc || item.fallbackSrc
            const previewSrc = getSupabasePreviewImageURL(resolvedSrc, 'home-feature')

            return (
              <article className={SLOT_CLASS_BY_VARIANT[item.variant]} key={item.id}>
                <Image alt={item.alt} fill sizes="(max-width:640px) 50vw, 25vw" src={previewSrc} style={{ objectFit: 'contain' }} />
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
