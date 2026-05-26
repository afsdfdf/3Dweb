import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { PublicModelThumbnailCardVM } from '../../_lib/mappers/modelCardMappers'
import { ModelThumbnailCard } from '../cards/ModelThumbnailCard'

export function HomeInspirationSection({ items }: { items: PublicModelThumbnailCardVM[] }) {
  return (
    <section className="mx-auto max-w-[var(--public-page-max-width)] px-4 py-6 sm:px-[var(--public-page-gutter)] sm:pb-12">
      <div className="relative overflow-hidden rounded-[10px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full select-none"
          src="/ui/frames/kuang.webp"
        />

        <div className="relative z-[2] px-[3.35%] pb-[4.3%] pt-[8.1%]">
          <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="flex items-center gap-2">
              <div className="flex h-[36px] min-w-0 flex-1 items-center gap-2 rounded-[4px] border border-[#403f46] bg-[#111215] px-3 text-sm text-[#8f939f] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <Search className="size-4 text-[#b9bdc8]" />
                <input
                  className="w-full bg-transparent text-sm text-[#d8dbe3] outline-none placeholder:text-[#6f7380]"
                  placeholder="Please enter keywords"
                  type="text"
                />
              </div>
              <Button className="h-[36px] rounded-[4px] border-[#403f46] bg-[#2b2a32] px-5 text-[#e7e9ef] hover:bg-[#424149]" size="sm" variant="outline">
                Search
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button className="h-[36px] min-w-[36px] rounded-[4px] border-[#403f46] bg-[#111215] px-0 text-[#bfc3cc] hover:bg-[#2b2a32]" size="sm" variant="outline">
                <ChevronLeft className="size-4" />
              </Button>
              {['1', '2', '3', '4', '5', '…', '99'].map((item, index) => (
                <Button
                  className={`h-[36px] min-w-[36px] rounded-[4px] px-0 ${
                    index === 0 ? 'border-[#5a5d67] bg-[#2b2a32] text-[#f1f3f7]' : 'border-[#403f46] bg-[#111215] text-[#bfc3cc] hover:bg-[#2b2a32]'
                  }`}
                  key={item}
                  size="sm"
                  variant="outline"
                >
                  {item}
                </Button>
              ))}
              <Button className="h-[36px] min-w-[36px] rounded-[4px] border-[#403f46] bg-[#111215] px-0 text-[#bfc3cc] hover:bg-[#2b2a32]" size="sm" variant="outline">
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <Button className="h-[36px] min-w-[154px] rounded-[4px] border-[#403f46] bg-[#111215] text-[#d3d7df] hover:bg-[#2b2a32]" size="sm" variant="outline">
              20 Items / Page
            </Button>
          </div>

          <div className="mt-3 h-px bg-[linear-gradient(90deg,#403f46_0%,#2b2a32_45%,#424149_100%)]" />

          <div className="mt-5 grid justify-between gap-y-12 [grid-template-columns:repeat(2,228px)] md:[grid-template-columns:repeat(3,228px)] xl:[grid-template-columns:repeat(4,228px)] 2xl:[grid-template-columns:repeat(6,228px)]">
            {items.map((item) => (
              <ModelThumbnailCard
                authorAvatarUrl={item.authorAvatarUrl}
                authorName={item.authorName}
                commentsCount={item.commentsCount}
                createdLabel={item.createdLabel}
                formats={item.formats}
                href={item.href}
                key={item.id}
                likesCount={item.likesCount}
                summary={item.summary}
                thumbnailUrl={item.thumbnailUrl}
                title={item.title}
                variant="homepage"
                viewsCount={item.viewsCount}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button className="h-[36px] min-w-[36px] rounded-[4px] border-[#403f46] bg-[#111215] px-0 text-[#bfc3cc] hover:bg-[#2b2a32]" size="sm" variant="outline">
                <ChevronLeft className="size-4" />
              </Button>
              {['1', '2', '3', '4', '5', '…', '99'].map((item, index) => (
                <Button
                  className={`h-[36px] min-w-[36px] rounded-[4px] px-0 ${
                    index === 0 ? 'border-[#5a5d67] bg-[#2b2a32] text-[#f1f3f7]' : 'border-[#403f46] bg-[#111215] text-[#bfc3cc] hover:bg-[#2b2a32]'
                  }`}
                  key={item}
                  size="sm"
                  variant="outline"
                >
                  {item}
                </Button>
              ))}
              <Button className="h-[36px] min-w-[36px] rounded-[4px] border-[#403f46] bg-[#111215] px-0 text-[#bfc3cc] hover:bg-[#2b2a32]" size="sm" variant="outline">
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button className="h-[36px] min-w-[154px] rounded-[4px] border-[#403f46] bg-[#111215] text-[#d3d7df] hover:bg-[#2b2a32]" size="sm" variant="outline">
              20 Items / Page
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
