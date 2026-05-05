import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { getCachedPayload } from '@/lib/getCachedPayload'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'
import { SiteShell } from '../_components/SiteShell'
import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentUser } from '../_lib/session'

type ShowcaseModel = {
  formats: string[]
  id: number
  previewURL: string | null
  summary: string
  title: string
}

function getPreviewURL(model: any) {
  const preview = model?.previewImage
  if (preview && typeof preview === 'object' && typeof preview.url === 'string') {
    return preview.url
  }

  const sourceTask =
    model?.sourceTask && typeof model.sourceTask === 'object' && !Array.isArray(model.sourceTask) ? model.sourceTask : null
  const callbackPayload =
    sourceTask?.callbackPayload && typeof sourceTask.callbackPayload === 'object' && !Array.isArray(sourceTask.callbackPayload)
      ? sourceTask.callbackPayload
      : null

  return callbackPayload && typeof callbackPayload.thumbnailUrl === 'string' ? callbackPayload.thumbnailUrl : null
}

function getFormats(model: any) {
  const formats = Array.isArray(model?.formats) ? model.formats : []
  return formats.map((item: any) => String(item?.format || '').toUpperCase()).filter(Boolean)
}

async function getShowcaseModels(): Promise<ShowcaseModel[]> {
  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'models',
    depth: 2,
    limit: 60,
    overrideAccess: false,
    pagination: false,
    sort: '-id',
    where: {
      visibility: {
        equals: 'public',
      },
    },
  })

  return await Promise.all(
    result.docs.map(async (model: any) => ({
      formats: getFormats(model),
      id: Number(model.id),
      previewURL: await getMediaAccessURL({
        payload,
        url: getPreviewURL(model),
      }),
      summary:
        typeof model.description === 'string' && model.description.trim()
          ? model.description
          : 'A real imported 3D model asset that can continue into generation, download, print, and delivery workflows.',
      title: typeof model.title === 'string' ? model.title : `Showcase ${model.id}`,
    })),
  )
}

export default async function ShowcasePage() {
  const [user, marketing, models] = await Promise.all([getCurrentUser(), getMarketingSiteData(), getShowcaseModels()])
  const { siteSettings } = marketing

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath="/showcase"
      footer={siteSettings.footer}
      navigation={siteSettings.headerNav}
      user={user}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary">Showcase</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Real Model Case Library</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              These are real stored 3D model assets, not static marketing placeholders. Use them to understand how Thorns Tavern connects generation, asset management, and print fulfillment.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/generate">Try Your Character</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/solutions">View Solutions</Link>
            </Button>
          </div>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {models.length > 0 ? (
            models.map((model) => (
              <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm" key={model.id}>
                <div className="relative aspect-[4/3] overflow-hidden border-b border-border/60 bg-black">
                  {model.previewURL ? (
                    <img alt={model.title} className="h-full w-full object-cover" src={model.previewURL} />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-500/25 via-sky-500/10 to-background">
                      <span className="text-sm text-muted-foreground">No preview image</span>
                    </div>
                  )}
                </div>

                <CardHeader className="gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Real Case</Badge>
                    {model.formats.slice(0, 3).map((format) => (
                      <Badge key={`${model.id}-${format}`} variant="secondary">
                        {format}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-2xl tracking-tight">{model.title}</CardTitle>
                  <CardDescription className="text-sm leading-6">{model.summary}</CardDescription>
                </CardHeader>

                <CardFooter className="flex gap-3">
                  <Button asChild size="sm">
                    <Link href={`/showcase/${model.id}`}>View Details</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/generate">Generate in This Style</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card className="border-border/60 bg-card/80 shadow-sm sm:col-span-2 xl:col-span-3">
              <CardContent className="p-6">
                <strong className="block text-lg font-semibold">No real cases yet</strong>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">When public model assets are curated as showcase cases, their previews will appear here automatically.</p>
              </CardContent>
            </Card>
          )}
        </section>
      </section>
    </SiteShell>
  )
}
