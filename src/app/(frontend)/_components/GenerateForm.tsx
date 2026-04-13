'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type GenerateFormProps = {
  initialMode?: 'hybrid' | 'image' | 'text'
}

const qualityPresets = [
  { label: '标准', value: 'standard', note: '适合快速出稿' },
  { label: '高质量', value: 'high', note: '推荐默认档位' },
  { label: '超高质量', value: 'ultra', note: '更适合打印前确认' },
]

export function GenerateForm({ initialMode = 'image' }: GenerateFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'hybrid' | 'image' | 'text'>(initialMode)
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'high' | 'ultra'>('high')
  const [previewUrl, setPreviewUrl] = useState('')

  const creditsReserved = useMemo(() => {
    if (selectedQuality === 'ultra') return 40
    if (selectedQuality === 'high') return 20
    return 10
  }, [selectedQuality])

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
          throw new Error('图片上传失败，请先登录后再重试。')
        }

        const mediaJson = await mediaResp.json()
        sourceImage = mediaJson.doc?.id
      }

      const resp = await fetch('/api/studio/ai/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditsReserved,
          inputMode: formData.get('inputMode'),
          parameterSnapshot: {
            format: formData.get('targetFormat'),
            quality: formData.get('quality'),
            style: formData.get('style'),
          },
          prompt: formData.get('prompt'),
          provider: 'custom',
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
      className="panel gradient-panel generate-form-shell generate-form-shell-minimal"
    >
      <div className="generate-form-topline">
        <div>
          <p className="eyebrow">Create Task</p>
          <h2>创建生成任务</h2>
        </div>
        <span className="status-pill">{uploading ? '上传中' : '可提交'}</span>
      </div>

      <div className="generate-form-section">
        <div className="selection-grid">
          <label className="selection-card">
            <input checked={selectedMode === 'image'} name="inputMode" onChange={() => setSelectedMode('image')} type="radio" value="image" />
            <span>图生 3D</span>
            <small>从立绘或参考图生成</small>
          </label>
          <label className="selection-card">
            <input checked={selectedMode === 'text'} name="inputMode" onChange={() => setSelectedMode('text')} type="radio" value="text" />
            <span>文生 3D</span>
            <small>从角色设定直接生成</small>
          </label>
          <label className="selection-card">
            <input checked={selectedMode === 'hybrid'} name="inputMode" onChange={() => setSelectedMode('hybrid')} type="radio" value="hybrid" />
            <span>图文混合</span>
            <small>适合复杂角色生成</small>
          </label>
        </div>
      </div>

      <div className="form-grid">
        <label>
          风格
          <select defaultValue="tabletop" name="style">
            <option value="tabletop">桌游棋子</option>
            <option value="realistic">写实</option>
            <option value="anime">卡通</option>
          </select>
        </label>

        <label>
          输出格式
          <select defaultValue="glb" name="targetFormat">
            <option value="glb">GLB 预览</option>
            <option value="stl">STL 打印</option>
            <option value="obj">OBJ 通用</option>
          </select>
        </label>
      </div>

      <div className="generate-form-section">
        <div className="selection-grid compact">
          {qualityPresets.map((preset) => (
            <label className="selection-card" key={preset.value}>
              <input
                checked={selectedQuality === preset.value}
                name="quality"
                onChange={() => setSelectedQuality(preset.value as 'standard' | 'high' | 'ultra')}
                type="radio"
                value={preset.value}
              />
              <span>{preset.label}</span>
              <small>{preset.note}</small>
            </label>
          ))}
        </div>
      </div>

      <div className="generate-form-section">
        <div className="form-grid">
          <label className="full-width upload-field">
            上传参考图
            <input
              name="sourceImage"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) {
                  setPreviewUrl('')
                  return
                }

                const url = URL.createObjectURL(file)
                setPreviewUrl(url)
              }}
            />
            <small>支持角色立绘、概念图、棋子参考图等图像输入。</small>
          </label>

          {previewUrl ? (
            <div className="full-width upload-preview-card">
              <div className="upload-preview-image">
                <Image alt="上传预览" fill src={previewUrl} />
              </div>
              <div className="upload-preview-copy">
                <strong>参考图已就绪</strong>
                <p className="soft-text">系统会把这张图片作为输入参考，并结合你的文字描述生成模型。</p>
              </div>
            </div>
          ) : null}

          <label className="full-width">
            文字描述
            <textarea
              defaultValue="一个持盾的矮人战士，厚重盔甲、战锤、符文盾牌，适合 32mm 桌游打印。"
              name="prompt"
              rows={8}
            />
          </label>
        </div>
      </div>

      <div className="generate-bottom-bar">
        <label className="credits-box">
          预计消耗积分
          <input value={creditsReserved} name="creditsReserved" readOnly type="number" />
        </label>

        <div className="button-row wrap-end">
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? (uploading ? '上传并提交中…' : '任务提交中…') : '开始生成'}
          </button>
        </div>
      </div>

      {error ? <p aria-live="polite" className="error-text">{error}</p> : null}
    </form>
  )
}
