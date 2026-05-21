import Link from 'next/link'

import { Box, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LineFrame } from '@/components/ui/line-frame'
import { cn } from '@/lib/utils'

import { ModelViewer } from '../../_components/ModelViewer'
import {
  formatStatusBadge,
  formatVisibilityBadge,
  formatWorkbenchDate,
  type WorkbenchModel,
} from '../_lib/workbenchData'

export function PanelFrame({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <LineFrame
      className={cn(
        'h-full overflow-hidden bg-[linear-gradient(180deg,rgba(16,16,19,0.98)_0%,rgba(7,7,9,0.98)_100%)] shadow-[0_24px_54px_rgba(0,0,0,0.48)]',
        className,
      )}
      contentClassName="h-full"
    >
      {children}
    </LineFrame>
  )
}

export function EmptyWorkbenchStage() {
  return (
    <div className="relative flex h-full min-h-[680px] items-center justify-center overflow-hidden rounded-[4px] bg-[radial-gradient(circle_at_50%_36%,rgba(121,86,41,0.22),transparent_18%),linear-gradient(180deg,#131315_0%,#222225_65%,#303033_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,205,138,0.08),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[32vw] font-black uppercase tracking-[-0.04em] text-white/[0.03]">
        MF
      </div>
      <div className="relative text-center">
        <div className="bg-[linear-gradient(180deg,#fff7dd_0%,#f0d08d_35%,#b95c28_70%,#7f2e10_100%)] bg-clip-text text-[72px] font-black uppercase leading-none tracking-[0.03em] text-transparent [filter:drop-shadow(0_4px_12px_rgba(255,190,93,0.22))]">
          Hello World
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-[#d3cbbf]">
          <div className="h-px w-28 bg-[linear-gradient(90deg,transparent,#6f695f)]" />
          <span>ideas to Full-color Custom Miniatures</span>
          <div className="h-px w-28 bg-[linear-gradient(90deg,#6f695f,transparent)]" />
        </div>
      </div>
    </div>
  )
}

function LibraryGridCard({
  href,
  isSelected,
  showMenu = false,
  model,
}: {
  href: string
  isSelected: boolean
  showMenu?: boolean
  model: WorkbenchModel
}) {
  const cardBorderClass = isSelected ? 'border-[#d9b67b]' : 'border-[#5a5661]'
  const cornerClass = isSelected ? 'bg-[#d9b67b]' : 'bg-[#7e7a87]'

  return (
    <Link className="group block" href={href}>
      <LineFrame
        className={cn(
          'h-full bg-[linear-gradient(180deg,#0f1013_0%,#17181c_100%)] shadow-[0_14px_26px_rgba(0,0,0,0.34)] transition-transform duration-200 group-hover:-translate-y-0.5',
          isSelected && 'shadow-[0_16px_34px_rgba(217,182,123,0.16)]',
        )}
        contentClassName="h-full"
      >
        <article className={cn('relative h-full min-h-[222px]', cardBorderClass)}>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_22%,transparent_78%,rgba(255,255,255,0.04)_100%)]" />

          <span className={cn('absolute left-0 top-0 h-[12px] w-[12px]', cornerClass)} />
          <span className={cn('absolute right-0 top-0 h-[12px] w-[12px]', cornerClass)} />
          <span className={cn('absolute bottom-0 left-0 h-[12px] w-[12px]', cornerClass)} />
          <span className={cn('absolute bottom-0 right-0 h-[12px] w-[12px]', cornerClass)} />

          <div className="relative z-10 flex h-full flex-col gap-3 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[#f3ecdf]">{model.title}</div>
                <div className="mt-1 text-[9px] leading-4 text-[#87818b]">
                  {formatWorkbenchDate(model.updatedAt || model.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="rounded-[2px] border border-[#4a454d] bg-[#17171a] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-[#ddd5c7]">
                  {formatVisibilityBadge(model.visibility)}
                </span>
                <span className="relative flex size-4 items-center justify-center rounded-[2px] border border-[#4a454d] bg-[#151519] text-[#d9d1c3]">
                  <MoreHorizontal className="size-2.5" />
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2px] border border-[#2b2c31] bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.18),transparent_22%),linear-gradient(180deg,#202127_0%,#111216_100%)]">
              {model.previewURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={model.title} className="aspect-[0.82] w-full object-cover" src={model.previewURL} />
              ) : (
                <div className="flex aspect-[0.82] items-center justify-center text-[#69646f]">
                  <Box className="size-8" />
                </div>
              )}
            </div>

            {showMenu ? (
              <div className="absolute right-[8px] top-[42px] z-20 min-w-[140px] overflow-hidden rounded-[4px] border border-[#34323a] bg-[linear-gradient(180deg,#111114_0%,#050506_100%)] shadow-[0_18px_30px_rgba(0,0,0,0.55)]">
                <button
                  className="block w-full border-b border-[#2a2930] px-3 py-2 text-left text-[10px] text-[#efe7da] transition hover:bg-[#18181c]"
                  type="button"
                >
                  Hide Current Model
                </button>
                <button
                  className="block w-full px-3 py-2 text-left text-[10px] text-[#8f8994] transition hover:bg-[#18181c] hover:text-[#efe7da]"
                  type="button"
                >
                  Delete Current Model
                </button>
              </div>
            ) : null}
          </div>
        </article>
      </LineFrame>
    </Link>
  )
}

export function WorkbenchStage({
  selectedModel,
}: {
  selectedModel: WorkbenchModel | null
}) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-[4px] border border-[#2b2a30] bg-[linear-gradient(180deg,#131417_0%,#222428_100%)]">
      <button
        className="absolute left-5 top-1/2 z-10 flex size-16 -translate-y-1/2 items-center justify-center opacity-90"
        type="button"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Previous model" className="h-16 w-16" src="/ui/frames/dark-3d-arrow-left.png" />
      </button>

      <button
        className="absolute right-5 top-1/2 z-10 flex size-16 -translate-y-1/2 items-center justify-center opacity-90"
        type="button"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Next model" className="h-16 w-16" src="/ui/frames/dark-3d-arrow-right.png" />
      </button>

      {selectedModel ? (
        <div className="relative h-full min-h-[680px]">
          <ModelViewer className="h-full min-h-[680px] w-full" label={selectedModel.title} src={selectedModel.viewerURL} />
        </div>
      ) : (
        <EmptyWorkbenchStage />
      )}
    </div>
  )
}

export function WorkbenchActions({
  initialMode,
  selectedModel,
}: {
  initialMode: 'image' | 'text'
  selectedModel: WorkbenchModel | null
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
      <div className="rounded-[4px] border border-[#2f2d34] bg-[#0a0a0d] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[3px] border border-[#4d474f] bg-[#17171a] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#efe7da]">
            {selectedModel ? formatStatusBadge(selectedModel.status) : 'Empty'}
          </span>
          {selectedModel?.tags.slice(0, 4).map((tag) => (
            <span
              className="rounded-[3px] border border-[#3d3941] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#bdb4a8]"
              key={tag}
            >
              #{tag}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm leading-7 text-[#b7b0a4]">
          {selectedModel?.description ||
            'This workbench entry uses the current model as the active stage target. You can inspect the asset, reopen its source task, or reuse it as the reference for the next generation.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {selectedModel ? (
            <>
              <Button
                asChild
                className="border-[#c45e1f] bg-[linear-gradient(180deg,#ff8d37_0%,#e75e1d_55%,#b93412_100%)] text-white hover:bg-[linear-gradient(180deg,#ff9a49_0%,#ef6828_55%,#c64017_100%)]"
              >
                <a href={`/api/platform/models/${selectedModel.id}/download?format=glb`}>Download GLB</a>
              </Button>

              {selectedModel.isOwnedByCurrentUser ? (
                <Button asChild className="border-[#57492d] bg-[#141416] text-[#efe7da] hover:bg-[#1d1d21]" variant="outline">
                  <Link href={`/workbench?mode=${initialMode}`}>Create Variant</Link>
                </Button>
              ) : (
                <Button asChild className="border-[#57492d] bg-[#141416] text-[#efe7da] hover:bg-[#1d1d21]" variant="outline">
                  <Link href={`/model-detail?id=${encodeURIComponent(String(selectedModel.id))}`}>View Detail</Link>
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-[4px] border border-[#2f2d34] bg-[#0a0a0d] p-4">
        <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f7983]">Current Model</div>
        {selectedModel ? (
          <>
            <div className="mt-3 text-lg font-semibold text-[#f0eadc]">{selectedModel.title}</div>
            <div className="mt-2 text-sm text-[#b9b2a7]">
              {selectedModel.isOwnedByCurrentUser ? 'Owned by you' : `Creator: ${selectedModel.ownerName}`}
            </div>
            <div className="mt-4 grid gap-3 text-sm text-[#c7c0b4]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#7f7983]">Visibility</span>
                <span>{formatVisibilityBadge(selectedModel.visibility)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#7f7983]">Print Ready</span>
                <span>{selectedModel.printReady ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#7f7983]">Updated</span>
                <span>{formatWorkbenchDate(selectedModel.updatedAt)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[#7f7983]">
            Select a model from the library to inspect ownership, visibility, and action state.
          </p>
        )}
      </div>
    </div>
  )
}

export function WorkbenchLibrary({
  basePath,
  initialMode,
  models,
  query,
  scope,
  selectedModel,
}: {
  basePath: string
  initialMode: 'image' | 'text'
  models: WorkbenchModel[]
  query: string
  scope: 'all' | 'mine' | 'public'
  selectedModel: WorkbenchModel | null
}) {
  return (
    <LineFrame
      className="h-[720px] bg-[linear-gradient(180deg,#09090b_0%,#050506_100%)] shadow-[0_24px_54px_rgba(0,0,0,0.48)]"
      contentClassName="h-full p-[16px]"
    >
      <div className="flex h-full flex-col text-[#f2ece0]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[21px] font-semibold leading-none text-[#f3ecdf]">Model Library</h2>

          <form className="flex items-center gap-1.5" method="get">
            <input name="mode" suppressHydrationWarning type="hidden" value={initialMode} />
            <input name="scope" suppressHydrationWarning type="hidden" value={scope} />
            <input
              className="h-8 w-[132px] border border-[#34323a] bg-[#0a0a0d] px-3 text-[10px] text-[#efe7da] outline-none placeholder:text-[#6f6973]"
              defaultValue={query}
              name="q"
              placeholder="Search Keywords"
              suppressHydrationWarning
            />
            <button
              className="h-8 border border-[#4a454d] bg-[#17171a] px-3 text-[10px] font-semibold text-[#efe7da] transition hover:border-[#82693d]"
              type="submit"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-3 h-px bg-[#27262b]" />

        <div className="mt-3 flex items-center justify-end gap-1.5">
          <button className="flex size-7 items-center justify-center border border-[#2f2d34] bg-[#09090b] text-[#7f7983]" type="button">
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="flex h-7 min-w-7 items-center justify-center border border-[#5d585f] bg-[#17171a] px-2 text-[10px] text-[#f0eadc]">
            1
          </span>
          <button className="flex size-7 items-center justify-center border border-[#2f2d34] bg-[#09090b] text-[#7f7983]" type="button">
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          {models.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {models.slice(0, 6).map((model, index) => (
                <LibraryGridCard
                  href={`${basePath}?model=${model.id}`}
                  isSelected={selectedModel?.id === model.id}
                  key={model.id}
                  model={model}
                  showMenu={index === 3}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[560px] flex-col items-center justify-center text-center">
              <Box className="size-16 text-[#6d6871]" />
              <p className="mt-4 text-[15px] text-[#8b848d]">No Models Available</p>
            </div>
          )}
        </div>
      </div>
    </LineFrame>
  )
}
