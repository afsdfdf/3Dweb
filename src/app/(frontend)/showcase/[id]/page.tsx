import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { ModelViewer } from '../../_components/ModelViewer'
import { SiteShell } from '../../_components/SiteShell'
import { getMarketingSiteData } from '../../_lib/marketing'
import { getCurrentUser } from '../../_lib/session'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { buildModelViewerURL, getModelGLBSourceURL, getModelPreviewURL } from '@/lib/modelAssetURL'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'

async function getShowcaseModel(id: number) {
  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'models',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [
        {
          id: {
            equals: id,
          },
        },
        {
          visibility: {
            equals: 'public',
          },
        },
      ],
    },
  })

  const model = result.docs[0]
  if (!model) return null

  return {
    formats: Array.isArray(model.formats) ? model.formats : [],
    model,
    payload,
    previewURL: await getMediaAccessURL({ payload, url: getModelPreviewURL(model) }),
    viewerURL: getModelGLBSourceURL({ model }) ? buildModelViewerURL({ modelId: model.id }) : null,
  }
}

export default async function ShowcaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user, marketing] = await Promise.all([params, getCurrentUser(), getMarketingSiteData()])
  const showcase = await getShowcaseModel(Number(id))
  const { siteSettings } = marketing

  if (!showcase) {
    return (
      <SiteShell
        announcement={siteSettings.announcement}
        currentPath="/showcase"
        footer={siteSettings.footer}
        navigation={siteSettings.headerNav}
        user={user}
      >
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle>Showcase item not found</CardTitle>
              <CardDescription>
                This entry may not exist anymore, or it has not been configured for public display yet.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/showcase">Back to showcase</Link>
              </Button>
            </CardFooter>
          </Card>
        </section>
      </SiteShell>
    )
  }

  const { model, formats, previewURL, viewerURL } = showcase

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
            <Badge variant="secondary">Showcase detail</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{model.title}</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              {typeof model.description === 'string' && model.description.trim()
                ? model.description
                : 'This showcase entry comes from the public model library and is used to present real asset quality and delivery outcomes.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/generate">Create from this style</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/showcase">Back to showcase</Link>
            </Button>
          </div>
        </div>

        <Separator className="my-8" />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
            <CardContent className="p-4">
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-black">
                <ModelViewer className="h-[560px] w-full" label={model.title} src={viewerURL} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <Badge variant="outline">Model details</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">Asset summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Formats</p>
                  <p className="mt-2 text-sm font-medium">
                    {formats.length > 0 ? formats.map((item: any) => String(item.format).toUpperCase()).join(' / ') : 'GLB'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visibility</p>
                  <p className="mt-2 text-sm font-medium">{model.visibility || 'public'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Print readiness</p>
                  <p className="mt-2 text-sm font-medium">{model.printReady ? 'Ready for print' : 'Needs review'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Model ID</p>
                  <p className="mt-2 text-sm font-medium">{model.id}</p>
                </div>
              </CardContent>
            </Card>

            {previewURL ? (
              <Card className="border-border/60 bg-card/80 shadow-sm">
                <CardHeader>
                  <Badge variant="outline">Preview image</Badge>
                  <CardTitle className="mt-3 text-2xl tracking-tight">Rendered preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-black">
                    <img alt={model.title} className="h-auto w-full object-cover" src={previewURL} />
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      </section>
    </SiteShell>
  )
}
