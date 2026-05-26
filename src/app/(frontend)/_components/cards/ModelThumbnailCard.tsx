import Link from 'next/link'

import { Eye, Heart, Star } from 'lucide-react'

import { FixedSliceFrame } from '@/components/ui/fixed-slice-frame'
import { getSupabasePreviewImageURL } from '@/lib/supabase/imageTransform'

type ModelThumbnailCardProps = {
  authorAvatarUrl?: null | string
  authorName?: null | string
  commentsCount?: number
  createdLabel?: null | string
  formats?: string[]
  href: string
  likesCount?: number
  summary?: null | string
  thumbnailUrl?: null | string
  title: string
  variant?: 'homepage' | 'showcase'
  viewsCount?: number | string
}

function buildInitials(name?: null | string) {
  if (!name) return 'MF'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function MetricChip({
  compact = false,
  icon,
  value,
}: {
  compact?: boolean
  icon: React.ReactNode
  value: number | string
}) {
  return (
    <span className={`inline-flex items-center gap-1 text-[#c8cad1] ${compact ? 'h-5 px-1 text-[10px]' : 'h-6 px-1.5 text-[11px]'}`}>
      {icon}
      <span>{value}</span>
    </span>
  )
}

function Avatar({
  authorAvatarUrl,
  authorName,
  compact = false,
}: {
  authorAvatarUrl?: null | string
  authorName?: null | string
  compact?: boolean
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#21956c] bg-[#131419] font-semibold text-[#ece0c5] shadow-[0_0_0_2px_rgba(33,149,108,0.18)] ${
        compact ? 'size-9 text-[10px]' : 'size-11 text-[11px]'
      }`}
    >
      {authorAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={authorName || 'Author'} className="h-full w-full object-cover" src={authorAvatarUrl} />
      ) : (
        buildInitials(authorName || 'Author')
      )}
      <span
        className={`absolute bottom-[-1px] right-[-1px] flex items-center justify-center rounded-full bg-[#2fd18d] font-bold text-white shadow-[0_0_0_2px_#101114] ${
          compact ? 'size-3.5 text-[8px]' : 'size-4 text-[9px]'
        }`}
      >
        +
      </span>
    </div>
  )
}

export function ModelThumbnailCard({
  authorAvatarUrl,
  authorName = 'Greenwood',
  commentsCount = 267,
  createdLabel = '6 Days ago',
  href,
  likesCount = 56,
  thumbnailUrl,
  title,
  variant = 'homepage',
  viewsCount = '2,3k',
}: ModelThumbnailCardProps) {
  const compact = variant === 'homepage'
  const cardSize = compact
    ? {
        height: 372,
        width: 228,
      }
    : {
        height: 670,
        width: 420,
      }
  const frameSize = compact ? 40 : 96
  const previewSrc = getSupabasePreviewImageURL(thumbnailUrl, compact ? 'home-card' : 'model-card-large')

  return (
    <Link
      className="group block shrink-0"
      href={href}
      style={{
        width: cardSize.width,
      }}
    >
      <FixedSliceFrame
        className="overflow-hidden rounded-[4px] bg-[linear-gradient(180deg,#1a1b20_0%,#101114_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.45)] transition-transform duration-200 group-hover:-translate-y-1"
        fill="#101114"
        frameLayerClassName={compact ? 'opacity-70' : undefined}
        frameSize={frameSize}
        slices={{
          bottom: '/ui/frames/workbench-panel-9slice/images/model-card-frame_08.png',
          bottomLeft: '/ui/frames/workbench-panel-9slice/images/model-card-frame_07.png',
          bottomRight: '/ui/frames/workbench-panel-9slice/images/model-card-frame_09.png',
          left: '/ui/frames/workbench-panel-9slice/images/model-card-frame_04.png',
          right: '/ui/frames/workbench-panel-9slice/images/model-card-frame_06.png',
          top: '/ui/frames/workbench-panel-9slice/images/model-card-frame_02.png',
          topLeft: '/ui/frames/workbench-panel-9slice/images/model-card-frame_01.png',
          topRight: '/ui/frames/workbench-panel-9slice/images/model-card-frame_03.png',
        }}
      >
        <article
          className="relative overflow-hidden rounded-[4px] bg-[linear-gradient(180deg,#1a1b20_0%,#101114_100%)]"
          style={cardSize}
        >
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              src={previewSrc}
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#141519_0%,#0d0e11_100%)]" />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.35)_0%,rgba(5,6,8,0.08)_26%,rgba(5,6,8,0.06)_64%,rgba(5,6,8,0.18)_100%)]" />

          <div
            className="absolute"
            style={{
              left: '7.2%',
              right: '7.2%',
              top: compact ? '5.6%' : '5.8%',
            }}
          >
            <div className="flex items-start gap-3">
              <Avatar authorAvatarUrl={authorAvatarUrl} authorName={authorName} compact={compact} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 leading-none">
                  <span className={`truncate font-medium text-[#eceef4] ${compact ? 'text-[11px]' : 'text-[13px]'}`}>{authorName}</span>
                  <span className={`shrink-0 text-[#7f8591] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{createdLabel}</span>
                </div>

                <div className={`flex flex-wrap ${compact ? 'mt-1.5 gap-1.5' : 'mt-2 gap-2'}`}>
                  <MetricChip compact={compact} icon={<Eye className={compact ? 'size-2.5' : 'size-3'} />} value={viewsCount} />
                  <MetricChip compact={compact} icon={<Heart className={compact ? 'size-2.5' : 'size-3'} />} value={likesCount} />
                  <MetricChip compact={compact} icon={<Star className={compact ? 'size-2.5' : 'size-3'} />} value={commentsCount} />
                </div>
              </div>
            </div>
            <div className={`${compact ? 'mt-1.5' : 'mt-2'} h-px bg-[#3a3c43]`} />
          </div>
        </article>
      </FixedSliceFrame>
    </Link>
  )
}
