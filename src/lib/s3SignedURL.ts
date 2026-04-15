import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Payload } from 'payload'

import { getS3StorageSettings } from '@/lib/s3Settings'

const normalizeBaseURL = (value: string) => value.replace(/\/+$/, '')

const decodeKey = (value: string) => {
  return value
    .split('/')
    .map((part) => decodeURIComponent(part))
    .join('/')
}

function extractKeyFromS3URL(args: {
  bucket: string
  region: string
  url: string
}) {
  const { bucket, region, url } = args
  const normalized = url.trim()
  const directPrefix = `https://${bucket}.s3.${region}.amazonaws.com/`

  if (normalized.startsWith(directPrefix)) {
    return decodeKey(normalized.slice(directPrefix.length))
  }

  return null
}

export async function getMediaAccessURL(args: {
  payload: Payload
  ttlSeconds?: number
  url?: null | string
}) {
  const { payload, ttlSeconds = 3600, url } = args
  if (!url) return null

  const settings = await getS3StorageSettings(payload)
  if (!settings.enabled || !settings.bucket || !settings.region || !settings.accessKeyId || !settings.secretAccessKey) {
    return url
  }

  const key = extractKeyFromS3URL({
    bucket: settings.bucket,
    region: settings.region,
    url,
  })

  if (!key) {
    if (settings.baseURL && normalizeBaseURL(url).startsWith(normalizeBaseURL(settings.baseURL))) {
      const base = normalizeBaseURL(settings.baseURL)
      return url
        .slice(base.length + 1)
        .split('/')
        .reduce((acc, seg, index) => (index === 0 ? decodeURIComponent(seg) : `${acc}/${decodeURIComponent(seg)}`), '')
    }

    return url
  }

  const client = new S3Client({
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    region: settings.region,
  })

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: settings.bucket,
      Key: key,
    }),
    {
      expiresIn: ttlSeconds,
    },
  )
}
