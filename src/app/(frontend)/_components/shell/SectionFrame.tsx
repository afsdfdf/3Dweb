import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

type SectionFrameProps = {
  bodyClassName?: string
  children: ReactNode
  eyebrow: string
  title: string
  toolbar?: ReactNode
}

function CornerCut({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const positionClass =
    position === 'tl'
      ? 'left-0 top-0 rounded-br-[28px] border-r-[6px] border-b-[6px]'
      : position === 'tr'
        ? 'right-0 top-0 rounded-bl-[28px] border-l-[6px] border-b-[6px]'
        : position === 'bl'
          ? 'bottom-0 left-0 rounded-tr-[28px] border-r-[6px] border-t-[6px]'
          : 'bottom-0 right-0 rounded-tl-[28px] border-l-[6px] border-t-[6px]'

  const innerPositionClass =
    position === 'tl'
      ? 'left-[6px] top-[6px] rounded-br-[22px] border-r-[6px] border-b-[6px]'
      : position === 'tr'
        ? 'right-[6px] top-[6px] rounded-bl-[22px] border-l-[6px] border-b-[6px]'
        : position === 'bl'
          ? 'bottom-[6px] left-[6px] rounded-tr-[22px] border-r-[6px] border-t-[6px]'
          : 'bottom-[6px] right-[6px] rounded-tl-[22px] border-l-[6px] border-t-[6px]'

  return (
    <>
      <span className={`pointer-events-none absolute z-[1] h-10 w-10 border-[#000000] bg-[#333333] ${positionClass}`} />
      <span
        className={`pointer-events-none absolute z-[1] h-[28px] w-[28px] border-transparent ${innerPositionClass}`}
        style={{
          borderImage: 'linear-gradient(135deg, #403f46 0%, #2b2a32 45%, #424149 100%) 1',
        }}
      />
    </>
  )
}

export function SectionFrame({ bodyClassName, children, eyebrow, title, toolbar }: SectionFrameProps) {
  return (
    <section className="mx-auto max-w-[var(--public-page-max-width)] px-4 py-6 sm:px-[var(--public-page-gutter)]">
      <div className="relative overflow-hidden rounded-[10px] border border-[#403f46] bg-[#000000] p-5 shadow-[0_20px_52px_rgba(0,0,0,0.36)]">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[7px] bg-[#000000]" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[7px] bg-[#000000]" />
        <span className="pointer-events-none absolute inset-y-0 left-0 w-[7px] bg-[#000000]" />
        <span className="pointer-events-none absolute inset-y-0 right-0 w-[7px] bg-[#000000]" />

        <span className="pointer-events-none absolute left-10 right-10 top-0 h-[6px] bg-[linear-gradient(180deg,#403f46_0%,#2b2a32_45%,#424149_100%)]" />
        <span className="pointer-events-none absolute left-10 right-10 bottom-0 h-[6px] bg-[linear-gradient(180deg,#403f46_0%,#2b2a32_45%,#424149_100%)]" />
        <span className="pointer-events-none absolute bottom-10 top-10 left-0 w-[6px] bg-[linear-gradient(90deg,#403f46_0%,#2b2a32_45%,#424149_100%)]" />
        <span className="pointer-events-none absolute bottom-10 top-10 right-0 w-[6px] bg-[linear-gradient(90deg,#403f46_0%,#2b2a32_45%,#424149_100%)]" />

        <CornerCut position="tl" />
        <CornerCut position="tr" />
        <CornerCut position="bl" />
        <CornerCut position="br" />

        <div className="relative z-[2] flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full border border-[#403f46] text-[10px] font-semibold tracking-[0.18em] text-[#f0d188]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" aria-hidden="true" className="h-[10px] w-[16px] object-contain" src="/ui/nav/active-chevron.png" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">{eyebrow}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f1e2bc]">{title}</h2>
            </div>
          </div>

          {toolbar ? <div className="flex flex-wrap gap-2">{toolbar}</div> : null}
        </div>

        <div className="relative z-[2] mt-4 h-px bg-[linear-gradient(90deg,#403f46_0%,#2b2a32_45%,#424149_100%)]" />

        <div className={`relative z-[2] mt-4 ${bodyClassName || ''}`}>{children}</div>
      </div>
    </section>
  )
}

export function SectionFilterPills({ items }: { items: readonly string[] }) {
  return (
    <>
      {items.map((item, index) => (
        <Button
          className={index === 0 ? 'border-[#a6782c] bg-[#24262c] text-[#ffe7a8]' : 'border-[#444750] bg-[#1a1b20] text-[#b8aa8b] hover:bg-[#23252a]'}
          key={item}
          size="sm"
          variant="outline"
        >
          {item}
        </Button>
      ))}
    </>
  )
}
