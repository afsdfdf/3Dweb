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

function extractKeyFromBaseURL(args: {
  baseURL: string
  url: string
}) {
  const normalizedBaseURL = normalizeBaseURL(args.baseURL)
  const normalizedURL = args.url.trim()

  if (!normalizedBaseURL || !normalizedURL.startsWith(`${normalizedBaseURL}/`)) {
    return null
  }

  return decodeKey(normalizedURL.slice(normalizedBaseURL.length + 1))
}

function extractBucketRegionKeyFromS3URL(url: string) {
  try {
    const parsed = new URL(url)
    const match = parsed.hostname.match(/^(.+)\.s3\.([a-z0-9-]+)\.amazonaws\.com$/i)

    if (!match) {
      return null
    }

    return {
      bucket: match[1],
      key: decodeKey(parsed.pathname.replace(/^\/+/, '')),
      region: match[2],
    }
  } catch {
    return null
  }
}

export async function getMediaAccessURL(args: {
  payload: Payload
  ttlSeconds?: number
  url?: null | string
}) {
  const { payload, ttlSeconds = 3600, url } = args
  if (!url) return null

  const settings = await getS3StorageSettings(payload)
  if (!settings.accessKeyId || !settings.secretAccessKey) {
    return url
  }

  const inferredObject = extractBucketRegionKeyFromS3URL(url)
  const key = extractKeyFromS3URL({
    bucket: settings.bucket,
    region: settings.region,
    url,
  }) || extractKeyFromBaseURL({ baseURL: settings.baseURL, url })

  const resolvedBucket = inferredObject?.bucket || settings.bucket
  const resolvedRegion = inferredObject?.region || settings.region
  const resolvedKey = inferredObject?.key || key

  if (!resolvedKey || !resolvedBucket || !resolvedRegion) {
    return url
  }

  if (!settings.signedDownloads) {
    return url
  }

  const client = new S3Client({
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    region: resolvedRegion,
  })

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: resolvedBucket,
      Key: resolvedKey,
    }),
    {
      expiresIn: ttlSeconds,
    },
  )
}
