import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { GenerationTask, Model } from '@/payload-types'

import { CreatePrintOrderButton } from '../../_components/CreatePrintOrderButton'
import { DashboardShell } from '../../_components/DashboardShell'
import { getCurrentUserModels, requireUser } from '../../_lib/session'
import { formatDateTime, formatModelStatus } from '../../_lib/ui-text'

function formatVisibility(visibility: Model['visibility']) {
  switch (visibility) {
    case 'public':
      return 'Public'
    case 'team':
      return 'Team'
    default:
      return 'Private'
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
    return `${dimensions.widthMm} x ${dimensions.heightMm} x ${dimensions.depthMm} mm`
  }

  return 'Available after processing'
}

function getStatusVariant(status?: string | null) {
  if (status === 'ready') return 'secondary' as const
  if (status === 'archived') return 'outline' as const
  return 'outline' as const
}

function hasRenderableModelFile(model: Model) {
  const sourceTask =
    model?.sourceTask && typeof model.sourceTask === 'object' && !Array.isArray(model.sourceTask) ? model.sourceTask : null
  const callbackPayload =
    sourceTask?.callbackPayload && typeof sourceTask.callbackPayload === 'object' && !Array.isArray(sourceTask.callbackPayload)
      ? sourceTask.callbackPayload
      : null
  const callbackModelUrls =
    callbackPayload?.modelUrls && typeof callbackPayload.modelUrls === 'object' && !Array.isArray(callbackPayload.modelUrls)
      ? (callbackPayload.modelUrls as Record<string, unknown>)
      : null

  if (callbackModelUrls && typeof callbackModelUrls.glb === 'string') {
    return true
  }

  const formats = Array.isArray(model.formats) ? model.formats : []
  const preferred = formats.find((item) => String(item.format).toLowerCase() === 'glb') || formats[0]
  const file = preferred?.file

  return Boolean(file && typeof file === 'object' && 'url' in file && typeof file.url === 'string')
}

function getModelThumbnailURL(model: Model) {
  const previewImage = model.previewImage && typeof model.previewImage === 'object' ? model.previewImage : null
  if (previewImage?.thumbnailURL) return previewImage.thumbnailURL
  if (previewImage?.url) return previewImage.url

  const sourceTask =
    model?.sourceTask && typeof model.sourceTask === 'object' && !Array.isArray(model.sourceTask) ? model.sourceTask : null
  const callbackPayload =
    sourceTask?.callbackPayload && typeof sourceTask.callbackPayload === 'object' && !Array.isArray(sourceTask.callbackPayload)
      ? sourceTask.callbackPayload
      : null

  return callbackPayload && typeof callbackPayload.thumbnailUrl === 'string' ? callbackPayload.thumbnailUrl : null
}

export default async function DashboardLibraryPage() {
  await requireUser()
  const models = await getCurrentUserModels()

  return (
    <DashboardShell
      currentPath="/dashboard/library"
      description="Manage generated model assets, continue into downloads, and push print-ready files into the order workflow."
      title="Model Library"
    >
      {models.docs.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {models.docs.map((model) => {
            const formats = Array.isArray(model.formats) ? model.formats : []
            const tags = Array.isArray(model.tags) ? model.tags : []
            const sourceTaskCode = getSourceTaskCode(model.sourceTask)
            const thumbnailURL = getModelThumbnailURL(model)
            const hasModelFile = hasRenderableModelFile(model)

            return (
              <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm" key={model.id}>
                <CardContent className="p-4">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border/60 bg-muted">
                    {thumbnailURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={model.title} className="h-full w-full object-cover" src={thumbnailURL} />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted to-background p-6 text-center">
                        <span className="text-sm font-medium text-foreground">Preview image pending</span>
                        <span className="max-w-xs text-xs leading-5 text-muted-foreground">
                          Once processing finishes, the preview image will appear here and the detail view can load the 3D asset.
                        </span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
                    <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge variant={getStatusVariant(model.status)}>{formatModelStatus(model.status)}</Badge>
                      <Badge variant="outline">{model.printReady ? 'Print ready' : 'Download only'}</Badge>
                    </div>
                    <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-background/90 px-3 py-1 text-xs text-foreground shadow-sm">
                      {hasModelFile ? 'Model file available' : 'Model file pending'}
                    </div>
                  </div>
                </CardContent>

                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-2xl tracking-tight">{model.title}</CardTitle>
                      <CardDescription className="mt-2">
                        Review the model preview, status, visibility, downloadable formats, and print-readiness in one place.
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{formatVisibility(model.visibility)}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Formats</p>
                    <p className="mt-2 text-sm font-medium">
                      {formats.length > 0 ? formats.map((item) => String(item.format).toUpperCase()).join(' / ') : 'GLB / STL'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dimensions</p>
                    <p className="mt-2 text-sm font-medium">{formatDimensions(model)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visibility</p>
                    <p className="mt-2 text-sm font-medium">{formatVisibility(model.visibility)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Updated</p>
                    <p className="mt-2 text-sm font-medium">{formatDateTime(model.updatedAt)}</p>
                  </div>
                </CardContent>

                {tags.length > 0 ? (
                  <CardContent className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={`${model.id}-${index}`} variant="outline">
                        {tag.label || 'Untitled tag'}
                      </Badge>
                    ))}
                  </CardContent>
                ) : null}

                <CardFooter className="flex flex-wrap gap-3">
                  <Button asChild>
                    <a href={`/api/platform/models/${model.id}/download?format=glb`}>Download GLB</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={`/api/platform/models/${model.id}/download?format=stl`}>Download STL</a>
                  </Button>
                  {model.printReady ? <CreatePrintOrderButton modelId={Number(model.id)} variant="ghost" /> : null}
                  <Button asChild variant="ghost">
                    <Link href={sourceTaskCode ? `/results/${sourceTaskCode}` : '/dashboard/library'}>Open source task</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </section>
      ) : (
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="outline">Library empty</Badge>
            <CardTitle className="mt-3 text-2xl tracking-tight">No models to manage yet</CardTitle>
            <CardDescription>
              Successful generation outputs will appear here for download, archiving, and print operations.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/generate">Create your first model</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </DashboardShell>
  )
}
