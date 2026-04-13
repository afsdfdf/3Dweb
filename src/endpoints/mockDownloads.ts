import type { PayloadRequest } from 'payload'

const unauthorized = () => Response.json({ message: '请先登录' }, { status: 401 })

export const mockModelDownloadEndpoint = {
  handler: async (req: PayloadRequest) => {
    if (!req.user) return unauthorized()

    const modelId = String(req.routeParams?.modelId ?? '')
    const format = String(req.query?.format ?? 'glb')

    try {
      await req.payload.findByID({
        collection: 'models',
        depth: 0,
        id: Number(modelId),
        overrideAccess: false,
        req,
        user: req.user,
      })
    } catch {
      return Response.json({ message: '未找到模型或无权下载' }, { status: 404 })
    }

    const content = `# Mock 3D File\nmodel=${modelId}\nformat=${format}\ngenerated_at=${new Date().toISOString()}\n`
    return new Response(content, {
      headers: {
        'Content-Disposition': `attachment; filename="mock-model-${modelId}.${format}"`,
        'Content-Type': 'application/octet-stream',
      },
      status: 200,
    })
  },
  method: 'get' as const,
  path: '/platform/mock/models/:modelId/download',
}
