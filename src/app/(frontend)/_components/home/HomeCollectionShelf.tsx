'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'

export type HomeCollectionShelfItem = {
  count: string
  isMore?: boolean
  previewSrc?: string
  title: string
}

const HOT_ACTIVE = '/ui/frames/hot1.png'
const HOT_IDLE = '/ui/frames/hot.png'
const NEW_ACTIVE = '/ui/frames/new1.png'
const NEW_IDLE = '/ui/frames/NEW.png'
const FRAME_SRC = '/ui/frames/Collections.png'
const MORE_PREVIEW_SRC = '/ui/frames/allfollowed.png'
const LEFT_ARROW_SRC = '/ui/frames/dark-3d-arrow-left.png'
const RIGHT_ARROW_SRC = '/ui/frames/dark-3d-arrow-right.png'

const BUTTON_ASPECT = 201 / 77
const ARROW_ASPECT = 91 / 343
const ITEMS_PER_PAGE = 4
const IMAGE_SLOTS_PER_PAGE = ITEMS_PER_PAGE - 1
const TOP_SLOT = {
  left: 2988 / 3715,
  top: 40 / 872,
  width: 360 / 3715,
  height: 80 / 872,
  hot: {
    left: 0 / 360,
    top: 20 / 80,
    width: 192.39 / 360,
  },
  newTab: {
    right: -33 / 360,
    top: 20 / 80,
    width: 205.7 / 360,
  },
} as const
const ARROW_SLOT = {
  left: {
    left: 32 / 3715,
    top: 233 / 872,
    width: 91 / 3715,
  },
  right: {
    right: 32 / 3715,
    top: 233 / 872,
    width: 91 / 3715,
  },
} as const

type ShelfMode = 'hot' | 'new'

function ToolbarImageButton({
  active = false,
  activeSrc,
  alt,
  className,
  idleSrc,
  onClick,
  style,
}: {
  active?: boolean
  activeSrc: string
  alt: string
  className?: string
  idleSrc: string
  onClick?: () => void
  style?: CSSProperties
}) {
  return (
    <button
      aria-label={alt}
      className={`block overflow-hidden ${className ?? ''}`}
      onClick={onClick}
      style={style}
      type="button"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={alt} className="block h-auto w-full select-none" draggable={false} src={active ? activeSrc : idleSrc} />
    </button>
  )
}

function ImageButton({
  alt,
  className,
  onClick,
  src,
  style,
}: {
  alt: string
  className?: string
  onClick?: () => void
  src: string
  style?: CSSProperties
}) {
  return (
    <button
      aria-label={alt}
      className={`block transition-transform duration-100 active:translate-y-[2px] active:scale-95 ${className ?? ''}`}
      onClick={onClick}
      style={style}
      type="button"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={alt} className="block h-auto w-full select-none" draggable={false} src={src} />
    </button>
  )
}

function MoreCard({ title }: HomeCollectionShelfItem) {
  return (
    <article className="h-full min-w-0 shrink-0 aspect-[4/3] transition-transform duration-150 ease-out hover:-translate-y-[3px] active:translate-y-[1px] active:scale-[0.985]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={title} className="block h-full w-full object-contain" src={MORE_PREVIEW_SRC} />
    </article>
  )
}

function CollectionCard(item: HomeCollectionShelfItem) {
  if (item.isMore) {
    return <MoreCard {...item} />
  }

  return item.previewSrc ? (
    <article className="h-full min-w-0 shrink-0 aspect-[4/3] transition-transform duration-150 ease-out hover:-translate-y-[3px] active:translate-y-[1px] active:scale-[0.985]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={item.title} className="block h-full w-full object-contain" src={item.previewSrc} />
    </article>
  ) : (
    <article className="h-full min-w-0 shrink-0 aspect-[4/3] bg-[#14151a] transition-transform duration-150 ease-out hover:-translate-y-[3px] active:translate-y-[1px] active:scale-[0.985]" />
  )
}

export function HomeCollectionShelf({ items }: { items: readonly HomeCollectionShelfItem[] }) {
  const [mode, setMode] = useState<ShelfMode>('hot')
  const [pageIndex, setPageIndex] = useState(0)

  const moreItem = useMemo(() => items.find((item) => item.isMore), [items])
  const orderedImageItems = useMemo(() => {
    const imageItems = items.filter((item) => !item.isMore)
    return mode === 'hot' ? imageItems : [...imageItems].reverse()
  }, [items, mode])
  const totalPages = Math.max(1, Math.ceil(orderedImageItems.length / Math.max(1, IMAGE_SLOTS_PER_PAGE)))

  useEffect(() => {
    setPageIndex(0)
  }, [items, mode])

  const visibleItems = useMemo(() => {
    const start = pageIndex * IMAGE_SLOTS_PER_PAGE
    const nextItems = orderedImageItems.slice(start, start + IMAGE_SLOTS_PER_PAGE)
    return moreItem ? [...nextItems, moreItem] : nextItems.slice(0, ITEMS_PER_PAGE)
  }, [moreItem, orderedImageItems, pageIndex])

  const movePage = (direction: 'left' | 'right') => {
    setPageIndex((current) => {
      if (totalPages <= 1) return current
      if (direction === 'left') return current === 0 ? totalPages - 1 : current - 1
      return current === totalPages - 1 ? 0 : current + 1
    })
  }

  return (
    <section className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6">
      <div className="relative aspect-[3715/872] rounded-[10px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full select-none"
          src={FRAME_SRC}
        />

        <div
          className="absolute z-[2]"
          style={{
            left: `${TOP_SLOT.left * 100}%`,
            top: `${TOP_SLOT.top * 100}%`,
            width: `${TOP_SLOT.width * 100}%`,
            height: `${TOP_SLOT.height * 100}%`,
          }}
        >
          <ToolbarImageButton
            active={mode === 'hot'}
            activeSrc={HOT_ACTIVE}
            alt="Hot"
            className="absolute"
            idleSrc={HOT_IDLE}
            onClick={() => setMode('hot')}
            style={{
              left: `${TOP_SLOT.hot.left * 100}%`,
              top: `${TOP_SLOT.hot.top * 100}%`,
              width: `${TOP_SLOT.hot.width * 100}%`,
              aspectRatio: `${BUTTON_ASPECT}`,
            }}
          />
          <ToolbarImageButton
            active={mode === 'new'}
            activeSrc={NEW_ACTIVE}
            alt="New"
            className="absolute"
            idleSrc={NEW_IDLE}
            onClick={() => setMode('new')}
            style={{
              right: `calc(${TOP_SLOT.newTab.right * 100}% - 5px)`,
              top: `${TOP_SLOT.newTab.top * 100}%`,
              width: `${TOP_SLOT.newTab.width * 100}%`,
              aspectRatio: `${BUTTON_ASPECT}`,
            }}
          />
        </div>

        <ImageButton
          alt="Previous"
          className="absolute z-[2]"
          onClick={() => movePage('left')}
          src={LEFT_ARROW_SRC}
          style={{
            left: `${ARROW_SLOT.left.left * 100}%`,
            top: `${ARROW_SLOT.left.top * 100}%`,
            width: `${ARROW_SLOT.left.width * 100}%`,
            aspectRatio: `${ARROW_ASPECT}`,
          }}
        />
        <ImageButton
          alt="Next"
          className="absolute z-[2]"
          onClick={() => movePage('right')}
          src={RIGHT_ARROW_SRC}
          style={{
            right: `${ARROW_SLOT.right.right * 100}%`,
            top: `${ARROW_SLOT.right.top * 100}%`,
            width: `${ARROW_SLOT.right.width * 100}%`,
            aspectRatio: `${ARROW_ASPECT}`,
          }}
        />

        <div className="absolute inset-x-[2%] bottom-[4%] top-[24%] z-[2] overflow-hidden">
          <div className="flex h-full items-center justify-center gap-[0.9%] pb-2">
            {visibleItems.map((item, index) => (
              <CollectionCard
                count={item.count}
                isMore={item.isMore}
                key={`${mode}-${pageIndex}-${item.title}-${index}`}
                previewSrc={item.previewSrc}
                title={item.title}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}