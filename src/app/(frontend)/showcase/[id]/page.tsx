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
import { getMediaAccessURL } from '@/lib/s3SignedURL'

function getPreviewURL(model: any) {
  const preview = model?.previewImage
  return preview && typeof preview === 'object' && typeof preview.url === 'string' ? preview.url : null
}

function getPrimaryModelURL(model: any) {
  const formats = Array.isArray(model?.formats) ? model.formats : []
  const preferred = formats.find((item: any) => String(item?.format).toLowerCase() === 'glb') || formats[0]
  const file = preferred?.file

  if (file && typeof file === 'object' && 'url' in file && typeof file.url === 'string') {
    return file.url
  }

  return null
}

async function getShowcaseModel(id: number) {
  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'models',
    depth: 2,
    limit: 1,
    overrideAccess: true,
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
    previewURL: await getMediaAccessURL({ payload, url: getPreviewURL(model) }),
    viewerURL: getPrimaryModelURL(model) ? `/api/platform/mock/models/${model.id}/download?format=glb&inline=1&preview=1` : null,
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
              <CardTitle>未找到案例</CardTitle>
              <CardDescription>这个案例可能不存在，或者还没有设置为公开展示。</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/showcase">返回案例展示页</Link>
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
            <Badge variant="secondary">案例详情</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{model.title}</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              {typeof model.description === 'string' && model.description.trim()
                ? model.description
                : '这个案例来自公开模型库，可用于展示真实的模型资产效果与产品交付链路。'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/generate">基于此风格生成</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/showcase">返回案例库</Link>
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
                <Badge variant="outline">模型信息</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">资源摘要</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">格式</p>
                  <p className="mt-2 text-sm font-medium">
                    {formats.length > 0 ? formats.map((item: any) => String(item.format).toUpperCase()).join(' / ') : 'GLB'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">可见性</p>
                  <p className="mt-2 text-sm font-medium">{model.visibility || 'public'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">打印状态</p>
                  <p className="mt-2 text-sm font-medium">{model.printReady ? '可打印' : '待确认'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">模型 ID</p>
                  <p className="mt-2 text-sm font-medium">{model.id}</p>
                </div>
              </CardContent>
            </Card>

            {previewURL ? (
              <Card className="border-border/60 bg-card/80 shadow-sm">
                <CardHeader>
                  <Badge variant="outline">缩略图</Badge>
                  <CardTitle className="mt-3 text-2xl tracking-tight">真实预览图</CardTitle>
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
