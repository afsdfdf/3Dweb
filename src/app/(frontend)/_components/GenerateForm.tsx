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
import type { GenerationPricing } from '@/lib/taskBilling'

type GenerateFormProps = {
  generationPricing: GenerationPricing
  initialMode?: 'hybrid' | 'image' | 'text'
}

const qualityPresets = [
  { label: '标准', value: 'standard', note: '适合快速出稿' },
  { label: '高质量', value: 'high', note: '默认推荐档位' },
  { label: '超高质量', value: 'ultra', note: '适合打印前确认' },
] as const

const inputModes = [
  { label: '图生 3D', value: 'image', note: '从概念图、草图或照片开始' },
  { label: '文生 3D', value: 'text', note: '从提示词与角色设定开始' },
  { label: '图文混合', value: 'hybrid', note: '同时结合参考图与文字控制' },
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

  const handleSubmit = async (formData: FormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      let sourceImage: number | undefined
      const file = formData.get('sourceImage')

      if (file instanceof File && file.size > 0) {
        setUploading(true)
        const mediaForm = new FormData()
        mediaForm.append('file', file)
        mediaForm.append('alt', file.name || '参考图')
        mediaForm.append('purpose', 'input')

        const mediaResp = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: mediaForm,
        })

        if (!mediaResp.ok) {
          throw new Error('图片上传失败，请先登录后再试。')
        }

        const mediaJson = await mediaResp.json()
        sourceImage = mediaJson.doc?.id
      }

      const resp = await fetch('/api/studio/ai/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMode: formData.get('inputMode'),
          parameterSnapshot: {
            format: formData.get('targetFormat'),
            quality: formData.get('quality'),
            style: formData.get('style'),
          },
          prompt: formData.get('prompt'),
          sourceImage,
        }),
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
              <FieldDescription>首页负责入口，Studio 页面负责真正开始任务。</FieldDescription>
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
                <FieldDescription>结果页与模型库都会沿用当前输出格式选择。</FieldDescription>
                <input name="targetFormat" type="hidden" value={selectedFormat} />
              </Field>
            </div>

            <FieldSet>
              <FieldLegend>质量档位</FieldLegend>
              <FieldDescription>当前版本的生成积分由后台统一配置，质量档位不额外加价。</FieldDescription>
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
                accept="image/*"
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

                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl)
                  }

                  const url = URL.createObjectURL(file)
                  setPreviewUrl(url)
                }}
                type="file"
              />
              <FieldDescription>支持角色立绘、氛围图、草图或任意概念参考图。</FieldDescription>
            </Field>

            {previewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                  <div className="aspect-square overflow-hidden rounded-xl border border-border/60 bg-background">
                    <img alt="上传预览" className="h-full w-full object-cover" src={previewUrl} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <strong className="block text-base font-medium">参考图已就绪</strong>
                    <p className="text-sm leading-6 text-muted-foreground">系统会把这张图片与提示词一起作为模型生成的输入参考。</p>
                  </div>
                </div>
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="prompt">文字描述</FieldLabel>
              <Textarea
                defaultValue="一个持盾的矮人战士，厚重盔甲、符文细节、宽大战锤，整体比例适合 32mm 桌游打印。"
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
