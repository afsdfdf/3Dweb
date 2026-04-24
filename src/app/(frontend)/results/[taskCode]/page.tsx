import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { buildModelViewerURL, getModelGLBSourceURL } from '@/lib/modelAssetURL'

import { CreatePrintOrderButton } from '../../_components/CreatePrintOrderButton'
import { ModelViewer } from '../../_components/ModelViewer'
import { ResultStatus } from '../../_components/ResultStatus'
import { SiteShell } from '../../_components/SiteShell'
import { getTaskByCode } from '../../_lib/payload-data'
import { getCurrentUser } from '../../_lib/session'
import { formatDateTime, formatInputMode, formatModelStatus, formatTaskStatus } from '../../_lib/ui-text'

const viewerModes = ['Perspective', 'Lighting', 'Wireframe', 'Print preview']
const deliveryNotes = [
  'Completed models are added to the asset library automatically.',
  'You can continue from here into downloads and delivery files.',
  'If you need a physical sample, move directly into the print-order flow.',
]

function getTaskBadgeVariant(status?: string | null) {
  if (status === 'succeeded') return 'secondary' as const
  if (status === 'failed' || status === 'timeout') return 'destructive' as const
  return 'outline' as const
}

function getPrimaryModelURL(
  task: Awaited<ReturnType<typeof getTaskByCode>>,
  model: NonNullable<ReturnType<typeof getModelFromTask>>,
) {
  if (!getModelGLBSourceURL({ model, task })) {
    return null
  }

  return buildModelViewerURL({ modelId: model.id })
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
              <CardTitle>Result not found</CardTitle>
              <CardDescription>
                Confirm the task code or sign in with the account that owns this task.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </SiteShell>
    )
  }

  const model = getModelFromTask(task)
  const modelFormats = Array.isArray(model?.formats) ? model.formats : []
  const primaryModelURL = model ? getPrimaryModelURL(task, model) : null
  const progressWidth = Math.max(12, Number(task.progress ?? 0))

  return (
    <SiteShell user={user}>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary">Result</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{task.taskCode}</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              {task.prompt || 'No prompt was recorded for this task.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ResultStatus taskId={task.id} taskStatus={task.status} />
            <Badge variant={getTaskBadgeVariant(task.status)}>Progress {task.progress ?? 0}%</Badge>
          </div>
        </div>

        <Separator className="my-8" />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="grid gap-6">
            <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Result preview</p>
                    <CardTitle className="mt-2 text-2xl tracking-tight">{model?.title || 'Result model'}</CardTitle>
                  </div>
                  <Badge variant="outline">
                    {modelFormats.length > 0 ? modelFormats.map((item: any) => String(item.format).toUpperCase()).join(' / ') : 'GLB / STL'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="relative min-h-[460px] overflow-hidden rounded-2xl border border-border/60 bg-black">
                  <ModelViewer accent="violet" className="h-full w-full" label={model?.title || 'Result model'} src={primaryModelURL} />
                  <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-background/85 px-3 py-1 text-xs text-foreground shadow-sm">
                    Result preview
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
                    <span className="text-muted-foreground">Task progress</span>
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
                <Badge variant="outline">Task details</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">
                  {task.status === 'succeeded' ? model?.title || 'Result model' : 'Generation in progress'}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Input mode</p>
                  <p className="mt-2 text-sm font-medium">{formatInputMode(task.inputMode)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Provider</p>
                  <p className="mt-2 text-sm font-medium">{task.provider}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Credits reserved</p>
                  <p className="mt-2 text-sm font-medium">{task.creditsReserved ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Task status</p>
                  <p className="mt-2 text-sm font-medium">{formatTaskStatus(task.status)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Created</p>
                  <p className="mt-2 text-sm font-medium">{formatDateTime(task.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Updated</p>
                  <p className="mt-2 text-sm font-medium">{formatDateTime(task.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <Badge variant="secondary">Next step</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">Continue with this result</CardTitle>
                <CardDescription>
                  Use this page to review status now, then continue the asset into the library and print-order workflow.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {model ? (
                  <>
                    <Button asChild>
                      <a href={`/api/platform/mock/models/${model.id}/download?format=glb`}>Download GLB file</a>
                    </Button>
                    <Button asChild variant="outline">
                      <a href={`/api/platform/mock/models/${model.id}/download?format=stl`}>Download STL file</a>
                    </Button>
                    <CreatePrintOrderButton modelId={Number(model.id)} sourceTaskId={Number(task.id)} variant="secondary" />
                    <Button asChild variant="ghost">
                      <Link href="/dashboard/library">Open model library</Link>
                    </Button>
                  </>
                ) : (
                  <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
                    <li>The task is still running, so keep this page open while processing continues.</li>
                    <li>The system will poll and refresh status automatically.</li>
                    <li>Once generation completes, download and ordering actions will appear here.</li>
                  </ul>
                )}
                {task.failureReason ? <p className="text-sm text-destructive">Failure reason: {task.failureReason}</p> : null}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <Badge variant="outline">Delivery summary</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">Result snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Available formats</p>
                  <p className="mt-2 text-sm font-medium">
                    {modelFormats.length > 0 ? modelFormats.map((item: any) => String(item.format).toUpperCase()).join(' / ') : 'GLB / STL'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Print readiness</p>
                  <p className="mt-2 text-sm font-medium">{model?.printReady ? 'Ready for print' : 'Needs review'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Task code</p>
                  <p className="mt-2 text-sm font-medium">{task.taskCode}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Model name</p>
                  <p className="mt-2 text-sm font-medium">{model?.title || 'Waiting for generation'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Model status</p>
                  <p className="mt-2 text-sm font-medium">{model ? formatModelStatus(model.status) : 'Waiting for generation'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Flow</p>
                  <p className="mt-2 text-sm font-medium">{'Result -> Model library -> Order'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <Badge variant="secondary">Delivery notes</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">Suggested next actions</CardTitle>
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
