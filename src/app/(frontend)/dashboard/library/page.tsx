import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { GenerationTask, Model } from '@/payload-types'

import { CreatePrintOrderButton } from '../../_components/CreatePrintOrderButton'
import { DashboardShell } from '../../_components/DashboardShell'
import { ModelViewer } from '../../_components/ModelViewer'
import { getCurrentUserModels, requireUser } from '../../_lib/session'
import { formatDateTime, formatModelStatus } from '../../_lib/ui-text'
function formatVisibility(visibility: Model['visibility']) {
  switch (visibility) {
    case 'public':
      return '公开'
    case 'team':
      return '团队'
    default:
      return '私有'
  }
}

function getSourceTaskCode(sourceTask: Model['sourceTask']) {
  if (sourceTask && typeof sourceTask === 'object' && 'taskCode' in sourceTask) {
    return (sourceTask as GenerationTask).taskCode
  }

  return null
}

function formatDimensions(model: Model) {
  const dimensions = model.dimensions

  if (dimensions?.widthMm && dimensions.heightMm && dimensions.depthMm) {
    return `${dimensions.widthMm} × ${dimensions.heightMm} × ${dimensions.depthMm} mm`
  }

  return '生成后补充'
}

function getStatusVariant(status?: string | null) {
  if (status === 'ready') return 'secondary' as const
  if (status === 'archived') return 'outline' as const
  return 'outline' as const
}

function getPrimaryModelURL(model: Model) {
  const formats = Array.isArray(model.formats) ? model.formats : []
  const preferred = formats.find((item) => String(item.format).toLowerCase() === 'glb') || formats[0]
  const file = preferred?.file

  if (file && typeof file === 'object' && 'url' in file && typeof file.url === 'string') {
    return file.url
  }

  return null
}

export default async function DashboardLibraryPage() {
  await requireUser()
  const models = await getCurrentUserModels()

  return (
    <DashboardShell
      currentPath="/dashboard/library"
      description="集中管理已生成模型，继续下载交付文件，或将可打印资产推进到订单流程。"
      title="模型库"
    >
      {models.docs.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {models.docs.map((model) => {
            const formats = Array.isArray(model.formats) ? model.formats : []
            const tags = Array.isArray(model.tags) ? model.tags : []
            const sourceTaskCode = getSourceTaskCode(model.sourceTask)
            const previewURL = getPrimaryModelURL(model)
              ? `/api/platform/mock/models/${model.id}/download?format=glb&inline=1&preview=1`
              : null

            return (
              <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm" key={model.id}>
                <CardContent className="p-4">
                  <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-black">
                    <ModelViewer className="h-[340px] w-full" label={model.title} src={previewURL} />
                    <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge variant={getStatusVariant(model.status)}>{formatModelStatus(model.status)}</Badge>
                      <Badge variant="outline">{model.printReady ? '可打印' : '可下载'}</Badge>
                    </div>
                  </div>
                </CardContent>

                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-2xl tracking-tight">{model.title}</CardTitle>
                      <CardDescription className="mt-2">
                        这里集中展示真实模型预览、状态、权限、可下载格式与打印就绪信息。
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{formatVisibility(model.visibility)}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">格式</p>
                    <p className="mt-2 text-sm font-medium">
                      {formats.length > 0 ? formats.map((item) => String(item.format).toUpperCase()).join(' / ') : 'GLB / STL'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">尺寸</p>
                    <p className="mt-2 text-sm font-medium">{formatDimensions(model)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">可见范围</p>
                    <p className="mt-2 text-sm font-medium">{formatVisibility(model.visibility)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">更新时间</p>
                    <p className="mt-2 text-sm font-medium">{formatDateTime(model.updatedAt)}</p>
                  </div>
                </CardContent>

                {tags.length > 0 ? (
                  <CardContent className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={`${model.id}-${index}`} variant="outline">
                        {tag.label || '未命名标签'}
                      </Badge>
                    ))}
                  </CardContent>
                ) : null}

                <CardFooter className="flex flex-wrap gap-3">
                  <Button asChild>
                    <a href={`/api/platform/mock/models/${model.id}/download?format=glb`}>下载 GLB</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={`/api/platform/mock/models/${model.id}/download?format=stl`}>下载 STL</a>
                  </Button>
                  {model.printReady ? <CreatePrintOrderButton modelId={Number(model.id)} variant="ghost" /> : null}
                  <Button asChild variant="ghost">
                    <Link href={sourceTaskCode ? `/results/${sourceTaskCode}` : '/dashboard/library'}>查看来源任务</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </section>
      ) : (
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="outline">模型库为空</Badge>
            <CardTitle className="mt-3 text-2xl tracking-tight">还没有可管理的模型</CardTitle>
            <CardDescription>生成成功后的资产会自动进入这里，供后续下载、归档或打印。</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/generate">创建第一个模型</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </DashboardShell>
  )
}
