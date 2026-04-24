'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { GenerationPricing } from '@/lib/taskBilling'

type GenerateFormProps = {
  generationPricing: GenerationPricing
  initialMode?: 'hybrid' | 'image' | 'text'
}

type SourceImageAsset = {
  bucket: string
  contentType: string
  fileName: string
  path: string
  publicUrl: string
}

const maxUploadBytes = Math.max(1, Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || 8 * 1024 * 1024))

const qualityPresets = [
  { label: '标准', note: '适合快速出样', value: 'standard' },
  { label: '高质量', note: '默认推荐档位', value: 'high' },
  { label: '超高质量', note: '适合打印前确认', value: 'ultra' },
] as const

const inputModes = [
  { label: '图生 3D', note: '从概念图、照片或草图开始', value: 'image' },
  { label: '文生 3D', note: '从提示词与角色设定开始', value: 'text' },
  { label: '图文混合', note: '同时结合参考图与文字控制', value: 'hybrid' },
] as const

export function GenerateForm({ generationPricing, initialMode = 'image' }: GenerateFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'hybrid' | 'image' | 'text'>(initialMode)
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'high' | 'ultra'>('high')
  const [selectedStyle, setSelectedStyle] = useState('tabletop')
  const [selectedFormat, setSelectedFormat] = useState('glb')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const creditsReserved = useMemo(() => {
    switch (selectedMode) {
      case 'image':
        return generationPricing.imageCredits
      case 'hybrid':
        return generationPricing.hybridCredits
      case 'text':
      default:
        return generationPricing.textCredits
    }
  }, [generationPricing.hybridCredits, generationPricing.imageCredits, generationPricing.textCredits, selectedMode])

  const uploadSourceImage = async (file: File): Promise<SourceImageAsset> => {
    const configResp = await fetch('/api/media/upload-url', {
      body: JSON.stringify({
        contentType: file.type || 'application/octet-stream',
        filename: file.name || 'reference-image',
        purpose: 'input',
        size: file.size,
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (!configResp.ok) {
      const payload = await configResp.json().catch(() => ({}))
      throw new Error(payload.message || '图片上传失败，请先登录后再试。')
    }

    const config = await configResp.json()
    const supabase = getSupabaseBrowserClient()
    const uploadResp = await supabase.storage.from(config.bucket).uploadToSignedUrl(config.path, config.token, file, {
      contentType: file.type || config.contentType || 'application/octet-stream',
    })

    if (uploadResp.error) {
      throw new Error(uploadResp.error.message || '图片上传失败。')
    }

    return {
      bucket: config.bucket,
      contentType: file.type || config.contentType || 'application/octet-stream',
      fileName: file.name || 'reference-image',
      path: config.path,
      publicUrl: config.publicUrl,
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      let sourceImage: number | undefined
      let sourceImageAsset: SourceImageAsset | undefined
      const file = formData.get('sourceImage')

      if (file instanceof File && file.size > 0) {
        if (file.size > maxUploadBytes) {
          throw new Error(`上传图片不能超过 ${Math.round(maxUploadBytes / (1024 * 1024))}MB。`)
        }

        setUploading(true)
        sourceImageAsset = await uploadSourceImage(file)
      }

      const resp = await fetch('/api/studio/ai/tasks', {
        body: JSON.stringify({
          inputMode: formData.get('inputMode'),
          parameterSnapshot: {
            format: formData.get('targetFormat'),
            quality: formData.get('quality'),
            style: formData.get('style'),
          },
          prompt: formData.get('prompt'),
          sourceImage,
          sourceImageAsset,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (resp.status === 401) {
        throw new Error('请先注册或登录，再提交生成任务。')
      }

      const json = await resp.json()
      if (!resp.ok) {
        throw new Error(json.message || '任务提交失败')
      }

      router.push(`/results/${json.task.taskCode}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setUploading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <form
      action={async (formData) => {
        await handleSubmit(formData)
      }}
      className="w-full"
    >
      <Card className="border-border/60 bg-card/80 shadow-xl shadow-black/5 backdrop-blur">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">创建任务</p>
              <CardTitle className="mt-2 text-2xl tracking-tight">创建生成任务</CardTitle>
              <CardDescription className="mt-2">在提交前设置输入方式、风格、质量档位与提示词。</CardDescription>
            </div>
            <Badge variant={uploading ? 'default' : 'secondary'}>{uploading ? '上传中' : '可提交'}</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>输入方式</FieldLegend>
              <FieldDescription>参考图会直接上传到 Supabase Storage，不再经过服务器中转。</FieldDescription>
              <ToggleGroup
                className="grid w-full grid-cols-1 gap-3 md:grid-cols-3"
                onValueChange={(value) => {
                  if (value === 'image' || value === 'text' || value === 'hybrid') {
                    setSelectedMode(value)
                  }
                }}
                type="single"
                value={selectedMode}
                variant="outline"
              >
                {inputModes.map((mode) => (
                  <ToggleGroupItem
                    className="h-auto min-h-24 flex-col items-start justify-start gap-2 rounded-2xl border border-border/60 px-4 py-4 text-left whitespace-normal data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                    key={mode.value}
                    value={mode.value}
                  >
                    <span className="text-sm font-medium">{mode.label}</span>
                    <span className="text-xs leading-5 text-muted-foreground">{mode.note}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <input name="inputMode" type="hidden" value={selectedMode} />
            </FieldSet>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>风格</FieldLabel>
                <Select onValueChange={setSelectedStyle} value={selectedStyle}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择风格" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="tabletop">桌游手办</SelectItem>
                      <SelectItem value="realistic">写实</SelectItem>
                      <SelectItem value="anime">动漫</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>用于控制模型整体造型与材质方向。</FieldDescription>
                <input name="style" type="hidden" value={selectedStyle} />
              </Field>

              <Field>
                <FieldLabel>输出格式</FieldLabel>
                <Select onValueChange={setSelectedFormat} value={selectedFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择输出格式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="glb">GLB 预览</SelectItem>
                      <SelectItem value="stl">STL 打印</SelectItem>
                      <SelectItem value="obj">OBJ 通用</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>生成完成后，结果页和模型库会优先使用这个格式。</FieldDescription>
                <input name="targetFormat" type="hidden" value={selectedFormat} />
              </Field>
            </div>

            <FieldSet>
              <FieldLegend>质量档位</FieldLegend>
              <FieldDescription>质量档位用于引导输入，不额外叠加积分。</FieldDescription>
              <ToggleGroup
                className="grid w-full grid-cols-1 gap-3 md:grid-cols-3"
                onValueChange={(value) => {
                  if (value === 'standard' || value === 'high' || value === 'ultra') {
                    setSelectedQuality(value)
                  }
                }}
                type="single"
                value={selectedQuality}
                variant="outline"
              >
                {qualityPresets.map((preset) => (
                  <ToggleGroupItem
                    className="h-auto min-h-24 flex-col items-start justify-start gap-2 rounded-2xl border border-border/60 px-4 py-4 text-left whitespace-normal data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                    key={preset.value}
                    value={preset.value}
                  >
                    <span className="text-sm font-medium">{preset.label}</span>
                    <span className="text-xs leading-5 text-muted-foreground">{preset.note}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <input name="quality" type="hidden" value={selectedQuality} />
            </FieldSet>

            <Field>
              <FieldLabel htmlFor="sourceImage">参考图片</FieldLabel>
              <Input
                accept="image/jpeg,image/png"
                id="sourceImage"
                name="sourceImage"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) {
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl)
                    }
                    setPreviewUrl('')
                    return
                  }

                  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
                    setError('Meshy 图生 3D 目前只支持 JPEG 或 PNG 参考图。')
                    event.target.value = ''
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl)
                    }
                    setPreviewUrl('')
                    return
                  }

                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl)
                  }

                  setPreviewUrl(URL.createObjectURL(file))
                }}
                type="file"
              />
              <FieldDescription>支持立绘、照片、草图等参考图。上传后会直接进入 Supabase Storage。</FieldDescription>
            </Field>

            {previewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                  <div className="aspect-square overflow-hidden rounded-xl border border-border/60 bg-background">
                    <img alt="上传预览" className="h-full w-full object-cover" src={previewUrl} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <strong className="block text-base font-medium">参考图已就绪</strong>
                    <p className="text-sm leading-6 text-muted-foreground">
                      提交任务时，这张图片会从浏览器直传到 Supabase Storage，再由 Meshy 直接拉取。
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="prompt">文字描述</FieldLabel>
              <Textarea
                defaultValue="一个持盾的矮人士兵，厚重盔甲、符文细节、宽大战锤，整体比例适合 32mm 桌游打印。"
                id="prompt"
                name="prompt"
                rows={8}
              />
              <FieldDescription>尽量写清角色身份、装备、姿态、氛围、材质倾向与最终用途。</FieldDescription>
            </Field>

            <FieldError aria-live="polite">{error}</FieldError>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">预计消耗积分</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-semibold tracking-tight">{creditsReserved}</span>
              <span className="pb-1 text-sm text-muted-foreground">积分</span>
            </div>
          </div>

          <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
            {isSubmitting ? (uploading ? '上传并提交中...' : '任务提交中...') : '开始生成'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
