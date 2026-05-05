import Link from 'next/link'

import { Box, ChevronLeft, Download, Eye, Heart, MoreHorizontal, Printer, Search, Sparkles, Star, Users } from 'lucide-react'

import { FrameButton } from '@/components/ui/frame-button'
import { LineFrame } from '@/components/ui/line-frame'

import { ModelViewer } from '../../../_components/ModelViewer'
import { formatCompactNumber } from './previewMath'
import type { WorkbenchModel } from '../../_lib/workbenchData'

const ORNAMENT_STRIP_SRC = '/ui/workbench/model-detail/ornament-strip.png'
const TOP_DIVIDER_SRC = '/ui/workbench/model-detail/top-divider.png'
const SKETCH_ASSET_BASE = '/ui/workbench/model-detail/sketch-assets'
const PING = '"PingFang SC", "Source Han Sans SC", sans-serif'
const ROBOTO = '"Roboto", sans-serif'

function MetricChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex h-full items-center gap-3 rounded-[4px] border border-[#2f2c33] bg-[#101114] px-4">
      <div className="flex size-11 items-center justify-center rounded-full border border-[#4d473d] bg-[#17130f] text-[#efc77d]">
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#837d73]">{label}</div>
        <div className="mt-1 text-[18px] font-black leading-none text-white">{value}</div>
      </div>
    </div>
  )
}

function GalleryCard({
  image,
  title,
}: {
  image: string
  title: string
}) {
  return (
    <div className="relative h-[212px] w-[132px] overflow-hidden bg-[linear-gradient(180deg,#43414b_0%,#2b2a32_100%)] shadow-[0_10px_18px_rgba(0,0,0,0.34)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/15" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/8" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/60" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-black/60" />

      <div className="absolute left-0 top-0 h-[12px] w-[12px] border-l border-t border-[#8a8892]" />
      <div className="absolute right-0 top-0 h-[12px] w-[12px] border-r border-t border-[#8a8892]" />
      <div className="absolute bottom-0 left-0 h-[12px] w-[12px] border-b border-l border-[#8a8892]" />
      <div className="absolute bottom-0 right-0 h-[12px] w-[12px] border-b border-r border-[#8a8892]" />

      <div className="absolute left-[7px] top-[7px] h-[198px] w-[118px] overflow-hidden border border-black/50 bg-[#121114] shadow-[inset_0_0_3px_rgba(255,255,255,0.25)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={title} className="h-full w-full object-cover" src={image} />
      </div>
    </div>
  )
}

export function SketchExactPreview({
  creatorBio,
  downloadCredits,
  downloadFormat,
  models,
  selectedModel,
}: {
  creatorBio: string
  downloadCredits: string
  downloadFormat: string
  models: WorkbenchModel[]
  selectedModel: WorkbenchModel
}) {
  const ownerName = selectedModel.ownerProfile?.displayName || selectedModel.ownerName
  const ownerAvatarUrl = selectedModel.ownerProfile?.avatarUrl || `${SKETCH_ASSET_BASE}/creator-avatar.jpg`
  const gallery = [
    `${SKETCH_ASSET_BASE}/gallery-1.png`,
    `${SKETCH_ASSET_BASE}/gallery-2.png`,
    `${SKETCH_ASSET_BASE}/gallery-3.png`,
    `${SKETCH_ASSET_BASE}/gallery-4.png`,
    `${SKETCH_ASSET_BASE}/gallery-5.png`,
  ]

  return (
    <section className="h-[1020px] overflow-hidden bg-[linear-gradient(180deg,#060607_0%,#111215_52%,#1a1b20_100%)] px-6 py-4 text-[#e9e2d6]">
      <div className="mx-auto grid h-full max-w-[1720px] grid-cols-[minmax(0,1fr)_460px] grid-rows-[minmax(0,1fr)_100px] gap-4">
        <div className="relative min-h-0 overflow-hidden rounded-[4px] bg-[radial-gradient(circle_at_18%_72%,rgba(98,116,136,0.28),transparent_28%),radial-gradient(circle_at_74%_20%,rgba(121,78,34,0.2),transparent_24%),linear-gradient(180deg,#060607_0%,#121418_58%,#26282d_100%)] shadow-[0_28px_60px_rgba(0,0,0,0.52)]">
          <div className="absolute inset-0">
            <ModelViewer className="h-full w-full" src={selectedModel.viewerURL} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-[170px] bg-[linear-gradient(180deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.45)_58%,transparent_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[140px] bg-[linear-gradient(180deg,transparent_0%,rgba(7,7,9,0.3)_44%,rgba(7,7,9,0.88)_100%)]" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between px-8 pt-6">
            <div className="max-w-[460px]">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[#8d8790]" style={{ fontFamily: PING }}>
                <Link className="inline-flex items-center gap-2 text-[#d8d0c3] transition hover:text-white" href="/workbench">
                  <span className="inline-flex size-7 items-center justify-center rounded-[4px] border border-[#4a454d] bg-[#17171a]/90 text-[#f0eadc]">
                    <ChevronLeft className="size-4" />
                  </span>
                  Home
                </Link>
                <span className="text-[#5f5962]">/</span>
                <span className="text-white">Model Details</span>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" aria-hidden="true" className="mt-5 h-[2px] w-[300px] object-cover opacity-55" src={TOP_DIVIDER_SRC} />
              <div className="mt-4 text-[12px] uppercase tracking-[0.22em] text-[#8b8590]" style={{ fontFamily: PING }}>
                Model Name
              </div>
              <h1 className="mt-3 text-[58px] font-black leading-[0.95] tracking-tight text-white" style={{ fontFamily: ROBOTO }}>
                {selectedModel.title}
              </h1>
              <div className="mt-4">
                <span className="inline-flex rounded-[4px] border border-[#5b575f] bg-[#1b1c20]/88 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#efe7da]" style={{ fontFamily: PING }}>
                  Public
                </span>
              </div>
            </div>

            <div className="grid h-[102px] w-[196px] gap-3 rounded-[4px] border border-[#35333a] bg-[#09090c]/84 px-4 py-5 shadow-[0_18px_36px_rgba(0,0,0,0.35)]">
              {[
                { label: 'Topology', value: 'Triangle' },
                { label: 'Face Count', value: '16,101' },
                { label: 'Vertex Count', value: '25,981' },
              ].map((item) => (
                <div className="flex items-center justify-between gap-3" key={item.label}>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#7f7983]" style={{ fontFamily: PING }}>{item.label}</span>
                  <span className="text-sm font-medium text-[#f1ebdf]" style={{ fontFamily: PING }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute left-2 top-1/2 h-[58px] w-[46px] -translate-y-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="h-full w-full object-contain" src="/ui/frames/dark-3d-arrow-left.png" />
          </div>
          <div className="absolute right-2 top-1/2 h-[58px] w-[46px] -translate-y-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="h-full w-full object-contain" src="/ui/frames/dark-3d-arrow-right.png" />
          </div>

          <div className="absolute bottom-[112px] right-[76px] h-[224px] w-[380px]">
            <LineFrame
              className="h-full bg-[linear-gradient(180deg,rgba(7,7,9,0.98)_0%,rgba(10,10,13,0.98)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.48)]"
              contentClassName="h-full"
              contentPadding={18}
              frameSize={84}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="text-center text-[13px] font-semibold tracking-[0.02em] text-[#f0d08c]" style={{ fontFamily: PING }}>
                    Model Download Confirmation
                  </div>
                  <p className="mt-3 text-center text-sm leading-6 text-[#beb6aa]" style={{ fontFamily: PING }}>
                    Downloading the current model will cost 1 to 2 points.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FrameButton height={52} variant="slate">
                    Cancel
                  </FrameButton>
                  <FrameButton asChild height={52} variant="gold">
                    <a href={`/api/platform/models/${selectedModel.id}/download?format=${downloadFormat}`}>OK</a>
                  </FrameButton>
                </div>
              </div>
            </LineFrame>
          </div>

          <div className="absolute bottom-[24px] left-[32px] flex items-center gap-[8px]">
            <div className="flex h-[32px] w-[200px] items-center overflow-hidden rounded-[4px] border border-[#5b585f] bg-[#17181c]/92 shadow-[0_16px_34px_rgba(0,0,0,0.38)]">
              <div className="flex flex-1 items-center gap-3 px-4">
                <Search className="size-4 text-[#8e8891]" />
                <span className="text-sm text-[#7f7983]" style={{ fontFamily: PING }}>Please enter keywords</span>
              </div>
            </div>
            <FrameButton height={32} size="compact" variant="slate" width={106}>
              Search
            </FrameButton>
          </div>
        </div>

        <div className="relative row-span-2 min-h-0 overflow-hidden rounded-[4px]">
          <LineFrame className="h-full bg-[linear-gradient(180deg,#0d0d10_0%,#08080a_100%)] shadow-[0_24px_50px_rgba(0,0,0,0.46)]" contentClassName="h-full" contentPadding={0} frameSize={96}>
            <div className="relative h-full overflow-hidden">
              <div className="absolute left-[23px] top-[23px] h-[90px] w-[412px] overflow-hidden rounded-[2px] bg-[#181818]" />

              <div className="absolute left-[23px] top-[129px] h-[104px] w-[412px] rounded-[4px] bg-[#111216]">
                <div className="absolute left-[0] top-[8px] h-[72px] w-[72px] rounded-full border-[4px] border-[#d69d57] bg-[#2b1612] p-[6px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={ownerName} className="h-full w-full rounded-full object-cover" src={ownerAvatarUrl} />
                </div>
                <div className="absolute left-[92px] top-[13px] h-[22px] w-[74px] truncate text-[16px] leading-[22px] text-white" style={{ fontFamily: PING, fontWeight: 500 }}>
                  {ownerName}
                </div>
                <div className="absolute left-[309px] top-[10px] flex h-[30px] w-[83px] items-center justify-center rounded-[2px] border border-white/10 bg-[#17171a] text-[12px] leading-[18px] text-white" style={{ fontFamily: PING, fontWeight: 500 }}>
                  OWNER
                </div>
                <div className="absolute left-[92px] top-[39px] h-[16px] w-[220px] overflow-hidden text-[12px] leading-[16px] text-white/50" style={{ fontFamily: PING }}>
                  {creatorBio}
                </div>
                <div className="absolute left-[92px] top-[74px] flex h-[18px] items-center gap-[18px] text-[12px] leading-[18px] text-white">
                  <span className="inline-flex items-center gap-[4px]">
                    <Users className="size-[14px] text-white/45" />
                    <span style={{ fontFamily: PING }}>{formatCompactNumber(selectedModel.ownerProfile?.followersCount || 0)}</span>
                  </span>
                  <span className="inline-flex items-center gap-[4px]">
                    <Box className="size-[14px] text-white/45" />
                    <span style={{ fontFamily: PING }}>{selectedModel.ownerProfile?.followingCount || 23}</span>
                  </span>
                </div>
                <div className="absolute right-[0] top-[74px] h-[18px] w-[64px] text-right text-[12px] leading-[18px] text-white/50" style={{ fontFamily: PING }}>
                  6 Days ago
                </div>
              </div>

              <div className="absolute left-[23px] top-[245px] h-[2px] w-[412px] bg-white/10" />

              <div className="absolute left-[23px] top-[341px] h-[2px] w-[412px] bg-white/10" />

              <div className="absolute left-[23px] top-[263px] h-[90px] w-[320px] bg-[#0d0d10]">
                <div className="flex h-full items-center gap-[14px] px-[8px]">
                  <div className="h-[74px] w-[74px] overflow-hidden rounded-[2px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={selectedModel.title} className="h-full w-full object-cover" src={`${SKETCH_ASSET_BASE}/input-thumb.jpg`} />
                  </div>
                  <div className="min-w-0 flex-1 pt-[1px]">
                    <div className="h-[18px] text-[12px] uppercase leading-[18px] tracking-[0.16em] text-white" style={{ fontFamily: PING, fontWeight: 500 }}>
                      IMAGE INPUT
                    </div>
                    <div className="mt-[3px] h-[18px] text-[12px] leading-[18px] text-white/50" style={{ fontFamily: PING }}>
                      2026.02.25 10:25:36
                    </div>
                    <div className="mt-[10px] flex items-center gap-[4px] overflow-hidden">
                      <div className="flex h-[20px] shrink-0 items-center justify-center rounded-[2px] border border-[#3a373f] bg-[#151519] px-[9px] text-[11px] leading-[16px] text-[#e7dece]" style={{ fontFamily: PING }}>
                        # game
                      </div>
                      <div className="flex h-[20px] shrink-0 items-center justify-center rounded-[2px] border border-[#3a373f] bg-[#151519] px-[9px] text-[11px] leading-[16px] text-[#e7dece]" style={{ fontFamily: PING }}>
                        # Titan Tribe
                      </div>
                      <div className="flex h-[20px] shrink-0 items-center justify-center rounded-[2px] border border-[#3a373f] bg-[#151519] px-[9px] text-[11px] leading-[16px] text-[#e7dece]" style={{ fontFamily: PING }}>
                        # Monk
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute left-[23px] top-[359px] h-[74px] w-[413px]">
                <textarea
                  style={{ fontFamily: PING }}
                  className="absolute left-0 top-0 h-[74px] w-[320px] rounded-[2px] border border-white/20 bg-transparent px-[16px] py-[10px] text-[12px] leading-[18px] text-[#efe7da] outline-none placeholder:text-white/40"
                  placeholder="Please enter your comment."
                />
                <button
                  className="absolute left-[329px] top-0 flex h-[38px] w-[84px] items-center justify-center rounded-[2px] border border-white/40 bg-white/10 text-[12px] leading-[18px] text-white"
                  style={{ fontFamily: PING, fontWeight: 400 }}
                  type="button"
                >
                  COMMENT
                </button>
                <div style={{ fontFamily: PING }} className="absolute left-[329px] top-[46px] h-[18px] w-[43px] text-[12px] leading-[18px] text-white/50">
                  0 / 500
                </div>
              </div>

              <div className="absolute left-[23px] top-[449px] h-[17px] w-[73px] text-[12px] text-[#f1eadc]" style={{ fontFamily: PING, fontWeight: 500 }}>
                0 Comments
              </div>

              <div className="absolute left-[101px] top-[482px] h-[34px] w-[256px]">
                <div className="relative h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-fill" src={ORNAMENT_STRIP_SRC} />
                  <div
                    className="absolute left-1/2 top-1/2 h-[22px] w-[90px] -translate-x-1/2 -translate-y-1/2 text-center text-[16px] leading-[22px] text-[#f6d49e]"
                    style={{ fontFamily: PING, fontWeight: 500 }}
                  >
                    MY MODEL
                  </div>
                </div>
              </div>

              <div className="absolute left-[23px] top-[530px] h-[440px] w-[412px] bg-transparent">
                <div className="absolute left-0 top-0">
                  <GalleryCard image={gallery[0]} title={models[0].title} />
                </div>
                <div className="absolute left-[140px] top-0">
                  <GalleryCard image={gallery[1]} title={models[1].title} />
                </div>
                <div className="absolute left-[280px] top-0">
                  <GalleryCard image={gallery[2]} title={models[2].title} />
                </div>
                <div className="absolute left-0 top-[228px]">
                  <GalleryCard image={gallery[3]} title={models[3].title} />
                </div>
                <div className="absolute left-[140px] top-[228px]">
                  <GalleryCard image={gallery[4]} title={models[4].title} />
                </div>
              </div>
            </div>
          </LineFrame>
        </div>

        <LineFrame
          className="bg-[linear-gradient(180deg,#171719_0%,#101012_100%)] shadow-[0_20px_40px_rgba(0,0,0,0.42)]"
          contentPadding={14}
          frameSize={92}
        >
          <div className="grid h-full grid-cols-[320px_1fr_auto] items-center gap-5">
            <div className="flex h-full items-center rounded-[4px] bg-[linear-gradient(90deg,rgba(31,31,34,0.96),rgba(18,18,20,0.96))] px-5">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full border border-[#8d6830] bg-[#21160b] text-[#efc77d] shadow-[0_0_0_4px_rgba(239,199,125,0.08)]">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#8c8578]">Points</div>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-[34px] font-black leading-none text-[#f7d38d]">{downloadCredits}</span>
                    <span className="text-xl text-[#6f685e] line-through">27.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <MetricChip icon={<Eye className="size-4" />} label="Views" value={formatCompactNumber(selectedModel.viewCount)} />
              <MetricChip icon={<Heart className="size-4" />} label="Likes" value={formatCompactNumber(selectedModel.likesCount)} />
              <MetricChip icon={<Star className="size-4" />} label="Favorites" value={formatCompactNumber(selectedModel.favoritesCount)} />
            </div>

            <div className="flex items-center gap-3">
              <FrameButton asChild height={58} variant="gold" width={262}>
                <a href={`/api/platform/models/${selectedModel.id}/download?format=${downloadFormat}`}>
                  <span className="inline-flex items-center gap-2">
                    <Download className="size-4" />
                    Add To Cart
                  </span>
                </a>
              </FrameButton>
              <FrameButton asChild height={58} variant="slate" width={232}>
                <Link href={selectedModel.printReady ? `/workbench?model=${selectedModel.id}&intent=print` : `/workbench/models/${selectedModel.id}`}>
                  <span className="inline-flex items-center gap-2">
                    <Printer className="size-4" />
                    Print Now
                  </span>
                </Link>
              </FrameButton>
              <FrameButton height={58} size="compact" variant="slate" width={70}>
                <MoreHorizontal className="size-5" />
              </FrameButton>
            </div>
          </div>
        </LineFrame>
      </div>
    </section>
  )
}
