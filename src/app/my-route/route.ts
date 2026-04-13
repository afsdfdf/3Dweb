import { getCachedPayload } from '@/lib/getCachedPayload'

export const GET = async (request: Request) => {
  const payload = await getCachedPayload()

  return Response.json({
    message: 'This is an example of a custom route.',
  })
}
