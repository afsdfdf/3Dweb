import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { CreatePrintOrderButton } from '../../_components/CreatePrintOrderButton'
import { ModelViewer } from '../../_components/ModelViewer'
import { ResultStatus } from '../../_components/ResultStatus'
import { SiteShell } from '../../_components/SiteShell'
import { getTaskByCode } from '../../_lib/payload-data'
import { getCurrentUser } from '../../_lib/session'
import { formatDateTime, formatInputMode, formatModelStatus, formatTaskStatus } from '../../_lib/ui-text'

const viewerModes = ['透视', '光照', '网格', '打印预览']
const deliveryNotes = [
  '模型生成成功后会自动进入模型库。',
  '你可以从这里继续下载交付文件。',
  '如果需要实体样件，可以直接推进到打印订单流程。',
]

function getTaskBadgeVariant(status?: string | null) {
  if (status === 'succeeded') return 'secondary' as const
  if (status === 'failed' || status === 'timeout') return 'destructive' as const
  return 'outline' as const
}

function getPrimaryModelURL(model: NonNullable<ReturnType<typeof getModelFromTask>>) {
  const formats = Array.isArray(model.formats) ? model.formats : []
  const preferred = formats.find((item) => String(item.format).toLowerCase() === 'glb') || formats[0]
  const file = preferred?.file

  if (file && typeof file === 'object' && 'url' in file && typeof file.url === 'string') {
    return file.url
  }

  return null
}

function getModelFromTask(task: Awaited<ReturnType<typeof getTaskByCode>>) {
  return task && typeof task.resultModel === 'object' ? task.resultModel : null
}

export default async function ResultDetailPage({ params }: { params: Promise<{ taskCode: string }> }) {
  const { taskCode } = await params
  const user = await getCurrentUser()
  const task = await getTaskByCode(taskCode)

  if (!task) {
    return (
      <SiteShell user={user}>
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle>未找到结果</CardTitle>
              <CardDescription>请确认任务编号是否正确，或先登录拥有该任务权限的账号。</CardDescription>
            </CardHeader>
          </Card>
        </section>
      </SiteShell>
    )
  }

  const model = getModelFromTask(task)
  const modelFormats = Array.isArray(model?.formats) ? model.formats : []
  const primaryModelURL = model && getPrimaryModelURL(model) ? `/api/platform/mock/models/${model.id}/download?format=glb&inline=1&preview=1` : null
  const progressWidth = Math.max(12, Number(task.progress ?? 0))

  return (
    <SiteShell user={user}>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary">结果页</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{task.taskCode}</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{task.prompt || '当前任务未填写提示词。'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ResultStatus taskId={task.id} taskStatus={task.status} />
            <Badge variant={getTaskBadgeVariant(task.status)}>当前进度 {task.progress ?? 0}%</Badge>
          </div>
        </div>

        <Separator className="my-8" />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="grid gap-6">
            <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">结果预览</p>
                    <CardTitle className="mt-2 text-2xl tracking-tight">{model?.title || '结果模型'}</CardTitle>
                  </div>
                  <Badge variant="outline">
                    {modelFormats.length > 0 ? modelFormats.map((item: any) => String(item.format).toUpperCase()).join(' / ') : 'GLB / STL'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="relative min-h-[460px] overflow-hidden rounded-2xl border border-border/60 bg-black">
                  <ModelViewer accent="violet" className="h-full w-full" label={model?.title || '结果模型'} src={primaryModelURL} />
                  <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-background/85 px-3 py-1 text-xs text-foreground shadow-sm">
                    结果预览
                  </div>
                  <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-background/85 px-3 py-1 text-xs text-foreground shadow-sm">
                    {modelFormats.length > 0 ? modelFormats.map((item: any) => String(item.format).toUpperCase()).join(' / ') : 'GLB / STL'}
                  </div>
                  <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
                    {viewerModes.map((mode) => (
                      <Badge key={mode} variant="outline">
                        {mode}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">任务进度</span>
                    <span className="font-medium">{task.progress ?? 0}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressWidth}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <Badge variant="outline">任务信息</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">{task.status === 'succeeded' ? model?.title || '结果模型' : '生成处理中'}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">输入模式</p>
                  <p className="mt-2 text-sm font-medium">{formatInputMode(task.inputMode)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">提供方</p>
                  <p className="mt-2 text-sm font-medium">{task.provider}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">预留积分</p>
                  <p className="mt-2 text-sm font-medium">{task.creditsReserved ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">任务状态</p>
                  <p className="mt-2 text-sm font-medium">{formatTaskStatus(task.status)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">创建时间</p>
                  <p className="mt-2 text-sm font-medium">{formatDateTime(task.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">最近更新</p>
                  <p className="mt-2 text-sm font-medium">{formatDateTime(task.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <Badge variant="secondary">下一步</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">继续使用生成结果</CardTitle>
                <CardDescription>结果页负责展示状态，并把可用资产继续沉淀到模型库与订单流程。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {model ? (
                  <>
                    <Button asChild>
                      <a href={`/api/platform/mock/models/${model.id}/download?format=glb`}>下载 GLB 文件</a>
                    </Button>
                    <Button asChild variant="outline">
                      <a href={`/api/platform/mock/models/${model.id}/download?format=stl`}>下载 STL 文件</a>
                    </Button>
                    <CreatePrintOrderButton modelId={Number(model.id)} sourceTaskId={Number(task.id)} variant="secondary" />
                    <Button asChild variant="ghost">
                      <Link href="/dashboard/library">打开模型库</Link>
                    </Button>
                  </>
                ) : (
                  <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
                    <li>任务仍在处理中，请保持当前页面开启。</li>
                    <li>系统会自动轮询并刷新状态。</li>
                    <li>生成完成后，下载与下单入口会自动出现。</li>
                  </ul>
                )}
                {task.failureReason ? <p className="text-sm text-destructive">失败原因：{task.failureReason}</p> : null}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <Badge variant="outline">交付信息</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">结果摘要</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">可用格式</p>
                  <p className="mt-2 text-sm font-medium">
                    {modelFormats.length > 0 ? modelFormats.map((item: any) => String(item.format).toUpperCase()).join(' / ') : 'GLB / STL'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">打印状态</p>
                  <p className="mt-2 text-sm font-medium">{model?.printReady ? '可打印' : '待确认'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">任务编号</p>
                  <p className="mt-2 text-sm font-medium">{task.taskCode}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">模型名称</p>
                  <p className="mt-2 text-sm font-medium">{model?.title || '等待生成'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">模型状态</p>
                  <p className="mt-2 text-sm font-medium">{model ? formatModelStatus(model.status) : '等待生成'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">结果承接</p>
                  <p className="mt-2 text-sm font-medium">结果页 → 模型库 → 订单</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <Badge variant="secondary">交付建议</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">你可以这样继续</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
                  {deliveryNotes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </section>
    </SiteShell>
  )
}
