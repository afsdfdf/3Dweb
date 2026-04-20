'use client'

import Link from 'next/link'
import { useId, useMemo, useState } from 'react'

import { ImagePlus, Type } from 'lucide-react'

import { Button } from '@/components/ui/button'

type HomeHeroWorkbenchProps = {
  fallbackPreviewUrls?: string[]
}

type Mode = 'image' | 'text'

export function HomeHeroWorkbench({ fallbackPreviewUrls = [] }: HomeHeroWorkbenchProps) {
  const [mode, setMode] = useState<Mode>('image')
  const [prompt, setPrompt] = useState('')
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const inputId = useId()

  const previews = imagePreviews.length > 0 ? imagePreviews : fallbackPreviewUrls.slice(0, 2)
  const hasPrompt = prompt.trim().length > 0

  const textPreview = useMemo(() => {
    if (!hasPrompt) return 'Please enter prompt ...'
    return prompt.trim().slice(0, 110)
  }, [hasPrompt, prompt])

  return (
    <div className="mx-auto flex min-h-[720px] max-w-[860px] flex-col items-center text-center">
      <h1 className="font-serif text-[58px] font-black uppercase leading-[0.88] tracking-[0.04em] text-[#f4d89c] [text-shadow:0_3px_0_#70431d,0_0_16px_rgba(255,214,141,0.18)] sm:text-[84px] lg:text-[108px]">
        Ideas
        <br />
        to
        <br />
        Miniatures
      </h1>

      <div className="mt-4 flex w-full max-w-[520px] items-center gap-4 text-sm text-[#d5cfbf]">
        <div className="h-px flex-1 bg-[linear-gradient(90deg,transparent,#7f7458)]" />
        <span>Ideas to Full-color Custom Miniatures</span>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,#7f7458,transparent)]" />
      </div>

      <div className="mt-6 flex rounded-[8px] border border-[#8b6a2e] bg-[#161822] p-1 shadow-[0_0_0_1px_rgba(255,213,121,0.08)]">
        <button
          className={`min-w-[108px] rounded-[5px] px-4 py-2 text-[14px] font-semibold ${
            mode === 'image'
              ? 'border border-[#d7a64f] bg-[linear-gradient(180deg,#f4d17a_0%,#d19d41_100%)] text-[#2a2114]'
              : 'text-[#b59049]'
          }`}
          onClick={() => setMode('image')}
          type="button"
        >
          Image To 3D
        </button>
        <button
          className={`min-w-[108px] rounded-[5px] px-4 py-2 text-[14px] font-semibold ${
            mode === 'text'
              ? 'border border-[#d7a64f] bg-[linear-gradient(180deg,#f4d17a_0%,#d19d41_100%)] text-[#2a2114]'
              : 'text-[#b59049]'
          }`}
          onClick={() => setMode('text')}
          type="button"
        >
          Text To 3D
        </button>
      </div>

      <div className="mt-8 grid w-full max-w-[860px] items-center gap-6 lg:grid-cols-[1fr_260px_1fr]">
        <div className="flex justify-end">
          <div className="max-w-[180px] text-left text-[17px] leading-8 text-[#e5e0d2]">
            {mode === 'image' ? (
              <>
                Click Here To
                <br />
                Upload Image
              </>
            ) : (
              <>
                Click Here To
                <br />
                Upload Text
              </>
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[260px]">
          <div className="absolute inset-x-[18px] top-[24px] h-[132px] rotate-[10deg] rounded-[16px] border border-[#5c5d73] bg-[linear-gradient(180deg,#242536_0%,#161823_100%)] opacity-70" />
          <div className="relative rounded-[20px] border border-[#5f6078] bg-[linear-gradient(180deg,#242536_0%,#1b1d29_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
            <div className="px-4 py-4">
              {mode === 'image' ? (
                <div className="grid grid-cols-3 gap-2">
                  {previews.length > 0 ? (
                    <>
                      {previews.slice(0, 2).map((preview, index) => (
                        <div
                          className="relative aspect-square overflow-hidden rounded-[10px] border border-[#72748a] bg-[#2d3040]"
                          key={`${preview}-${index}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={`Preview ${index + 1}`} className="h-full w-full object-contain" src={preview} />
                          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#111318] text-[10px] text-white">
                            ×
                          </span>
                        </div>
                      ))}
                      <div className="aspect-square rounded-[10px] border border-[#72748a] bg-[#3a3d52] p-3 text-center text-[12px] font-semibold text-[#d6d9e5]">
                        25%
                      </div>
                    </>
                  ) : (
                    <div className="col-span-3 flex aspect-[3/1.6] items-center justify-center rounded-[12px] border border-[#6d6f84] bg-[#2c2e3c] text-[#dadde8]">
                      <ImagePlus className="size-9" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[12px] border border-[#6d6f84] bg-[#232634] p-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-[#72748a] bg-[#2d3040] text-[#dadde8]">
                      <Type className="size-6" />
                    </div>
                    <div className="min-h-[76px] flex-1 overflow-hidden text-sm leading-5 text-[#dde1ec]">
                      {textPreview}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#5b5d6d] bg-[linear-gradient(180deg,#45485c_0%,#343744_100%)] px-6 py-4 text-center text-[13px] text-[#f0f2f8]">
              {mode === 'image' ? (
                <label className="flex cursor-pointer items-center justify-center gap-2" htmlFor={inputId}>
                  <span>+</span>
                  <span>Add Image</span>
                  <input
                    accept="image/*"
                    className="hidden"
                    id={inputId}
                    multiple
                    onChange={(event) => {
                      const nextFiles = Array.from(event.target.files || [])
                      const nextUrls = nextFiles.map((file) => URL.createObjectURL(file))
                      setImagePreviews(nextUrls.slice(0, 2))
                    }}
                    type="file"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>+</span>
                  <span>Add Text</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[180px] text-left text-[17px] leading-8 text-[#e5e0d2]">
            Go get your 3D
            <br />
            model
          </div>
        </div>
      </div>

      <div className="mt-6 w-full max-w-[420px] min-h-[120px]">
        {mode === 'text' ? (
          <textarea
            className="min-h-[120px] w-full rounded-[18px] border border-[#5d5f69] bg-[#181a22] px-4 py-4 text-sm leading-6 text-[#e8ebf3] outline-none placeholder:text-[#7d8192]"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the character, gear, pose, material, and intended output."
            value={prompt}
          />
        ) : (
          <div aria-hidden="true" className="h-[120px] w-full opacity-0" />
        )}
      </div>

      <Button
        asChild
        className="mt-8 h-[62px] min-w-[300px] rounded-[8px] border border-[#b65e25] bg-[linear-gradient(180deg,#ff8a32_0%,#e85a1d_52%,#a52d10_100%)] px-12 text-[18px] font-black uppercase tracking-[0.24em] text-white shadow-[0_18px_44px_rgba(190,74,18,0.45)] hover:bg-[linear-gradient(180deg,#ff9946_0%,#ef6628_52%,#b93a17_100%)]"
        size="lg"
      >
        <Link href="/generate">Generate</Link>
      </Button>
    </div>
  )
}
