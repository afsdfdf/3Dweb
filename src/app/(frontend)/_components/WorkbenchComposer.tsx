'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Plus, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/app/(frontend)/_lib/apiFetch'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { GenerationPricing } from '@/lib/taskBilling'

type WorkbenchComposerProps = {
  generationPricing: GenerationPricing
  initialMode?: 'hybrid' | 'image' | 'text'
  isAuthenticated: boolean
}

type SourceImageAsset = {
  bucket: string
  contentType: string
  fileName: string
  path: string
  publicUrl: string
}

const maxUploadBytes = Math.max(1, Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || 8 * 1024 * 1024))

const modeTabs = [
  { label: 'Image To 3D', value: 'image' },
  { label: 'Text To 3D', value: 'text' },
] as const

const defaultPrompt =
  'A disciplined fantasy monk miniature, full body visible, balanced pose, tabletop sculpting style, clean silhouette, high readability for 3D printing.'

function parseTagInput(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)
}

export function WorkbenchComposer({
  generationPricing,
  initialMode = 'image',
  isAuthenticated,
}: WorkbenchComposerProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'hybrid' | 'image' | 'text'>(initialMode)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [title, setTitle] = useState('Unnamed')
  const [tagInput, setTagInput] = useState('game, unnamed')
  const [multiViewEnabled, setMultiViewEnabled] = useState(false)
  const [license, setLicense] = useState<'private' | 'public'>('public')
  const [style, setStyle] = useState('tabletop')
  const [format, setFormat] = useState('glb')
  const [quality, setQuality] = useState<'high' | 'standard' | 'ultra'>('high')
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imagePreviews])

  const creditsReserved = useMemo(() => {
    switch (mode) {
      case 'image':
        return generationPricing.imageCredits
      case 'hybrid':
        return generationPricing.hybridCredits
      case 'text':
      default:
        return generationPricing.textCredits
    }
  }, [generationPricing.hybridCredits, generationPricing.imageCredits, generationPricing.textCredits, mode])

  const tags = useMemo(() => parseTagInput(tagInput), [tagInput])

  const uploadSourceImage = async (file: File): Promise<SourceImageAsset> => {
    const configResp = await apiFetch('/api/media/upload-url', {
      body: JSON.stringify({
        contentType: file.type || 'application/octet-stream',
        filename: file.name || 'reference-image',
        purpose: 'input',
        size: file.size,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      timeoutMs: 15_000,
    })

    if (!configResp.ok) {
      const payload = await configResp.json().catch(() => ({}))
      throw new Error(payload.message || 'Image upload failed. Please log in and try again.')
    }

    const config = await configResp.json()
    const supabase = getSupabaseBrowserClient()
    const uploadResp = await supabase.storage.from(config.bucket).uploadToSignedUrl(config.path, config.token, file, {
      contentType: file.type || config.contentType || 'application/octet-stream',
    })

    if (uploadResp.error) {
      throw new Error(uploadResp.error.message || 'Image upload failed.')
    }

    return {
      bucket: config.bucket,
      contentType: file.type || config.contentType || 'application/octet-stream',
      fileName: file.name || 'reference-image',
      path: config.path,
      publicUrl: config.publicUrl,
    }
  }

  const handleFileChange = (files: FileList | null) => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url))

    if (!files || files.length === 0) {
      setImagePreviews([])
      return
    }

    const nextPreviews = Array.from(files)
      .slice(0, 5)
      .map((file) => URL.createObjectURL(file))
    setImagePreviews(nextPreviews)
  }

  const handleSubmit = async (formData: FormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      const imageFiles = formData
        .getAll('sourceImages')
        .filter((item): item is File => item instanceof File && item.size > 0)

      const primaryImage = imageFiles[0]
      let sourceImageAsset: SourceImageAsset | undefined

      if (primaryImage) {
        if (!['image/jpeg', 'image/png'].includes(primaryImage.type)) {
          throw new Error('Only JPEG or PNG reference images are supported right now.')
        }

        if (primaryImage.size > maxUploadBytes) {
          throw new Error(`Reference image must be smaller than ${Math.round(maxUploadBytes / (1024 * 1024))}MB.`)
        }

        setIsUploading(true)
        sourceImageAsset = await uploadSourceImage(primaryImage)
      }

      const response = await apiFetch('/api/studio/ai/tasks', {
        body: JSON.stringify({
          inputMode: mode,
          parameterSnapshot: {
            format,
            quality,
            style,
            workbench: {
              license,
              multiViewEnabled,
              requestedTitle: title.trim() || 'Unnamed',
              tags,
            },
          },
          prompt: formData.get('prompt'),
          sourceImageAsset,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (response.status === 401 && !isAuthenticated) {
        throw new Error('Please log in before generating a model.')
      }

      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(json.message || 'Task submission failed.')
      }

      router.push(`/results/${json.task.taskCode}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task submission failed.')
    } finally {
      setIsUploading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <form
      action={async (formData) => {
        await handleSubmit(formData)
      }}
      className="flex h-full flex-col"
    >
      <div className="flex items-center gap-2 rounded-[6px] border border-[#47434f] bg-[#111115] p-1">
        {modeTabs.map((tab) => {
          const active = mode === tab.value
          return (
            <button
              className={`flex-1 rounded-[4px] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                active
                  ? 'border border-[#78727f] bg-[linear-gradient(180deg,#54505d_0%,#3b3843_100%)] text-[#f2eef6]'
                  : 'text-[#7d7987] hover:text-[#d8d2df]'
              }`}
              key={tab.value}
              onClick={() => setMode(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
        <section className="rounded-[4px] border border-[#26262c] bg-[#070708] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#e7e2d7]">Image</h3>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#706c76]">
              {mode === 'text' ? 'Prompt' : 'Reference'}
            </span>
          </div>

          {mode === 'text' ? (
            <Textarea
              className="min-h-[196px] rounded-[4px] border-[#31313a] bg-[#0e0e11] text-sm text-[#f2ece0] placeholder:text-[#68636e] focus-visible:border-[#9d7233] focus-visible:ring-[#9d7233]/20"
              name="prompt"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the model, pose, mood, silhouette, and printing intent."
              suppressHydrationWarning
              value={prompt}
            />
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div className="relative overflow-hidden rounded-[6px] border border-[#3a3840] bg-[#18171d]" key={`${preview}-${index}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={`Reference ${index + 1}`} className="aspect-square h-full w-full object-cover" src={preview} />
                    <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#0f0f12] text-[#e5dfd3]">
                      <X className="size-2.5" />
                    </span>
                  </div>
                ))}

                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[6px] border border-[#3a3840] bg-[linear-gradient(180deg,#1c1c21_0%,#111115_100%)] text-center text-[11px] text-[#b2acb7] transition hover:border-[#7a6640] hover:text-[#f3ebdc]">
                  <Plus className="mb-2 size-4" />
                  Add Image
                  <input
                    accept="image/jpeg,image/png"
                    className="hidden"
                    multiple
                    name="sourceImages"
                    onChange={(event) => handleFileChange(event.target.files)}
                    suppressHydrationWarning
                    type="file"
                  />
                </label>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-[#69656f]">
                The current backend pipeline uses the first uploaded image as the primary reference. Extra slots are reserved for the next multi-view step.
              </p>
            </>
          )}
        </section>

        <section>
          <label className="mb-2 block text-[13px] font-semibold text-[#e7e2d7]" htmlFor="workbench-title">
            Model Title
          </label>
          <div className="rounded-[4px] border border-[#2f2d34] bg-[#0a0a0d] p-2">
            <Input
              className="h-9 border-[#393742] bg-[#111115] text-[#f2ece0] placeholder:text-[#5f5a64] focus-visible:border-[#9d7233] focus-visible:ring-[#9d7233]/20"
              id="workbench-title"
              maxLength={122}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Please enter the title"
              suppressHydrationWarning
              value={title}
            />
            <div className="mt-2 text-right text-[10px] text-[#706c76]">{`${title.length}/122`}</div>
          </div>
        </section>

        <section>
          <label className="mb-2 block text-[13px] font-semibold text-[#e7e2d7]" htmlFor="workbench-tags">
            Model Tag
          </label>
          <div className="rounded-[4px] border border-[#2f2d34] bg-[#0a0a0d] p-2">
            <Input
              className="h-9 border-[#393742] bg-[#111115] text-[#f2ece0] placeholder:text-[#5f5a64] focus-visible:border-[#9d7233] focus-visible:ring-[#9d7233]/20"
              id="workbench-tags"
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="game, monk, titan tribe"
              suppressHydrationWarning
              value={tagInput}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <span
                    className="inline-flex items-center rounded-[4px] border border-[#4a454c] bg-[#17161a] px-2 py-1 text-[11px] text-[#e4ddd0]"
                    key={tag}
                  >
                    # {tag}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-[#69656f]">No tags yet.</span>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[13px] font-semibold text-[#e7e2d7]" htmlFor="multi-view-toggle">
              Multi-View
            </label>
            <button
              className={`relative inline-flex h-6 w-12 items-center rounded-full border transition ${
                multiViewEnabled
                  ? 'border-[#c79d4c] bg-[linear-gradient(180deg,#c79d4c_0%,#8d6528_100%)]'
                  : 'border-[#35353d] bg-[#111115]'
              }`}
              id="multi-view-toggle"
              onClick={() => setMultiViewEnabled((value) => !value)}
              type="button"
            >
              <span
                className={`inline-block size-4 rounded-full bg-[#f8f1df] transition ${multiViewEnabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-[4px] border border-[#2f2d34] bg-[#0a0a0d] p-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                className="flex aspect-[1.08] flex-col items-center justify-center rounded-[6px] border border-[#38363d] bg-[#111115] text-center text-[11px] text-[#9f99a4]"
                key={`multi-view-slot-${index + 1}`}
              >
                <Plus className="mb-2 size-4" />
                Add Image
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[#e7e2d7]">Model License</label>
            <Select onValueChange={(value: 'private' | 'public') => setLicense(value)} value={license}>
              <SelectTrigger className="h-10 w-full rounded-[4px] border-[#393742] bg-[#111115] text-[#f2ece0] focus-visible:border-[#9d7233] focus-visible:ring-[#9d7233]/20">
                <SelectValue placeholder="Select license" />
              </SelectTrigger>
              <SelectContent className="border-[#393742] bg-[#151519] text-[#f2ece0]">
                <SelectGroup>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-[#8a8590]">Style</label>
              <Select onValueChange={setStyle} value={style}>
                <SelectTrigger className="h-10 w-full rounded-[4px] border-[#393742] bg-[#111115] text-[#f2ece0] focus-visible:border-[#9d7233] focus-visible:ring-[#9d7233]/20">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent className="border-[#393742] bg-[#151519] text-[#f2ece0]">
                  <SelectGroup>
                    <SelectItem value="tabletop">Tabletop</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="anime">Anime</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-[#8a8590]">Format</label>
              <Select onValueChange={setFormat} value={format}>
                <SelectTrigger className="h-10 w-full rounded-[4px] border-[#393742] bg-[#111115] text-[#f2ece0] focus-visible:border-[#9d7233] focus-visible:ring-[#9d7233]/20">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent className="border-[#393742] bg-[#151519] text-[#f2ece0]">
                  <SelectGroup>
                    <SelectItem value="glb">GLB</SelectItem>
                    <SelectItem value="stl">STL</SelectItem>
                    <SelectItem value="obj">OBJ</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-[#8a8590]">Quality</label>
              <Select onValueChange={(value: 'high' | 'standard' | 'ultra') => setQuality(value)} value={quality}>
                <SelectTrigger className="h-10 w-full rounded-[4px] border-[#393742] bg-[#111115] text-[#f2ece0] focus-visible:border-[#9d7233] focus-visible:ring-[#9d7233]/20">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent className="border-[#393742] bg-[#151519] text-[#f2ece0]">
                  <SelectGroup>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="ultra">Ultra</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {mode !== 'text' ? <input name="prompt" suppressHydrationWarning type="hidden" value={prompt} /> : null}

        {error ? <p className="rounded-[4px] border border-[#7c2f2f] bg-[#251214] px-3 py-2 text-sm text-[#ffb5b5]">{error}</p> : null}
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-[#2c2b31] pt-4">
        <div className="flex min-w-[96px] items-center justify-center gap-2 rounded-[4px] border border-[#5c4721] bg-[#120d06] px-3 py-3 text-[#f5d082] shadow-[inset_0_0_0_1px_rgba(255,214,132,0.08)]">
          <span className="text-lg">O</span>
          <div className="text-xl font-bold leading-none">{creditsReserved.toFixed(2)}</div>
        </div>

        <Button
          className="h-12 flex-1 rounded-[4px] border border-[#c45e1f] bg-[linear-gradient(180deg,#ff8d37_0%,#e75e1d_55%,#b93412_100%)] text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_28px_rgba(189,83,24,0.3)] hover:bg-[linear-gradient(180deg,#ff9a49_0%,#ef6828_55%,#c64017_100%)]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (isUploading ? 'Uploading...' : 'Generating...') : 'Generate'}
        </Button>
      </div>

      {!isAuthenticated ? (
        <p className="mt-3 text-[11px] leading-5 text-[#7d7985]">
          Guests can explore the workbench UI now. Generation still requires login before the task is submitted.
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between text-[11px] text-[#7a7681]">
        <div className="flex items-center gap-2">
          <Search className="size-3.5" />
          Current mode: {mode === 'text' ? 'Text to 3D' : 'Image to 3D'}
        </div>
        <span>{license === 'public' ? 'Public license' : 'Private license'}</span>
      </div>
    </form>
  )
}
