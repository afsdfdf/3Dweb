export type FeaturedItem = {
  alt: string
  fallbackSrc: string
  id: string
  imageSrc?: null | string
  variant: 'standard' | 'wide'
}

const FRAME_SRC = '/ui/frames/newproduct.png'

const SLOT_CLASS_BY_VARIANT: Record<FeaturedItem['variant'], string> = {
  standard: 'relative h-full min-w-0 overflow-hidden rounded-[16px]',
  wide: 'relative h-full min-w-0 overflow-hidden rounded-[16px]',
}

export function HomeFeaturedRail({ items }: { items: FeaturedItem[] }) {
  return (
    <section className="relative z-[2] mx-auto -mt-8 max-w-[1600px] bg-[linear-gradient(180deg,rgba(24,24,24,0)_0%,rgba(24,24,24,0.82)_42%,#181818_100%)] px-4 pt-2 sm:px-6">
      <div className="relative overflow-hidden rounded-[18px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" aria-hidden="true" className="pointer-events-none block h-auto w-full select-none" src={FRAME_SRC} />

        <div className="absolute inset-x-[1.4%] bottom-[8.8%] top-[7.7%] grid grid-cols-[1.75fr_1fr_1fr_1fr] gap-[1.1%]">
          {items.map((item) => {
            const resolvedSrc = item.imageSrc || item.fallbackSrc

            return (
              <article className={SLOT_CLASS_BY_VARIANT[item.variant]} key={item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={item.alt} className="block h-full w-full object-contain" src={resolvedSrc} />
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}