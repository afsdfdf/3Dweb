import type { PayloadRequest } from 'payload'

import { InsufficientCreditsError } from '@/lib/creditLedger'
import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { submitImageGeneration } from '@/lib/imageGenerationFlow'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

export const submitImageGenerationEndpoint = {
  path: '/studio/ai/images',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'ai-image-submit',
    })
    if (rateLimited) return rateLimited

    try {
      const body = req.json ? await req.json() : {}
      const inputMode = body.inputMode === 'image' ? 'image' : 'text'
      const result = await submitImageGeneration({
        inputMode,
        prompt: String(body.prompt || ''),
        provider: body.provider === 'gemini-third-party' ? 'gemini-third-party' : 'gemini-official',
        req,
        sourceImage: typeof body.sourceImage === 'number' ? body.sourceImage : undefined,
        sourceImageAsset:
          body.sourceImageAsset && typeof body.sourceImageAsset === 'object'
            ? (body.sourceImageAsset as Record<string, unknown>)
            : undefined,
      })

      return Response.json({
        media: result.media,
        message: 'Image generated successfully.',
        task: result.task,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image generation failed.'
      const status = error instanceof InsufficientCreditsError ? 402 : 400
      return Response.json({ message }, { status })
    }
  },
}
