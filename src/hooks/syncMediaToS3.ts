import fs from 'node:fs/promises'
import path from 'node:path'

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { describeS3StorageConfigProblem, getS3StorageSettings } from '@/lib/s3Settings'

const encodeS3Key = (value: string) => {
  return value
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

const buildPublicURL = (args: { baseURL?: string; bucket: string; key: string; region: string }) => {
  const { baseURL, bucket, key, region } = args
  if (baseURL) {
    return `${baseURL.replace(/\/+$/, '')}/${encodeS3Key(key)}`
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeS3Key(key)}`
}

const buildStorageKey = (args: { filename: string; prefix: string; purpose?: string | null }) => {
  const safePrefix = args.prefix.replace(/^\/+|\/+$/g, '')
  const safePurpose = String(args.purpose || 'asset').replace(/^\/+|\/+$/g, '')
  return `${safePrefix}/${safePurpose}/${args.filename}`
}

const getMimeType = (value: unknown) => {
  return typeof value === 'string' && value ? value : 'application/octet-stream'
}

export const syncMediaToS3AfterChange: CollectionAfterChangeHook = async ({ context, doc, operation, req }) => {
  if (context?.skipS3Sync) return doc
  if (operation !== 'create' && operation !== 'update') return doc

  const s3 = await getS3StorageSettings(req.payload)
  const configProblem = describeS3StorageConfigProblem(s3)
  if (configProblem) {
    req.payload.logger.error({
      msg: `Media S3 sync skipped: ${configProblem}`,
    })
    return doc
  }

  if (!s3.enabled || !s3.hasRequiredConfig) {
    return doc
  }

  if (!doc.filename || typeof doc.filename !== 'string') {
    return doc
  }

  const localFilePath = path.resolve(process.cwd(), 'media', doc.filename)

  try {
    const fileBuffer = await fs.readFile(localFilePath)
    const key = buildStorageKey({
      filename: doc.filename,
      prefix: s3.prefix,
      purpose: typeof doc.purpose === 'string' ? doc.purpose : 'asset',
    })

    const client = new S3Client({
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
      region: s3.region,
    })

    await client.send(
      new PutObjectCommand({
        Body: fileBuffer,
        Bucket: s3.bucket,
        ContentType: getMimeType(doc.mimeType),
        Key: key,
      }),
    )

    const remoteURL = buildPublicURL({
      baseURL: s3.baseURL,
      bucket: s3.bucket,
      key,
      region: s3.region,
    })

    return await req.payload.update({
      collection: 'media',
      context: {
        ...(context || {}),
        skipS3Sync: true,
      },
      data: {
        thumbnailURL: typeof doc.mimeType === 'string' && doc.mimeType.startsWith('image/') ? remoteURL : doc.thumbnailURL,
        url: remoteURL,
      },
      id: doc.id,
      overrideAccess: true,
      req,
    })
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: `Failed to sync media ${doc.filename} to S3`,
    })
    return doc
  }
}

export const syncMediaToS3AfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const s3 = await getS3StorageSettings(req.payload)
  const configProblem = describeS3StorageConfigProblem(s3)
  if (configProblem) {
    req.payload.logger.error({
      msg: `Media S3 delete skipped: ${configProblem}`,
    })
    return doc
  }

  if (!s3.enabled || !s3.hasRequiredConfig) {
    return doc
  }

  if (!doc.filename || typeof doc.filename !== 'string') {
    return doc
  }

  const key = buildStorageKey({
    filename: doc.filename,
    prefix: s3.prefix,
    purpose: typeof doc.purpose === 'string' ? doc.purpose : 'asset',
  })

  try {
    const client = new S3Client({
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
      region: s3.region,
    })

    await client.send(
      new DeleteObjectCommand({
        Bucket: s3.bucket,
        Key: key,
      }),
    )
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: `Failed to delete media ${doc.filename} from S3`,
    })
  }

  return doc
}
