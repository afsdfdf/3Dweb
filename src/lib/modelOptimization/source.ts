import { queryPostgres } from '@/lib/postgres'

export type OriginalGLBAsset = {
  mediaId: number
  mimeType: string
  modelId: number
  ownerId: number
  sourceURL: string
}

type ModelOptimizationSourceTestHooks = {
  queryPostgres?: typeof queryPostgres
}

let modelOptimizationSourceTestHooks: ModelOptimizationSourceTestHooks | null = null

export function __setModelOptimizationSourceTestHooks(hooks: ModelOptimizationSourceTestHooks | null) {
  modelOptimizationSourceTestHooks = hooks
}

export async function resolveOriginalGLBAsset(modelId: number): Promise<OriginalGLBAsset | null> {
  const query = modelOptimizationSourceTestHooks?.queryPostgres || queryPostgres
  const result = await query<OriginalGLBAsset>(
    `
      select
        models.id as "modelId",
        models.owner_id as "ownerId",
        media.id as "mediaId",
        coalesce(media.mime_type, 'model/gltf-binary') as "mimeType",
        media.url as "sourceURL"
      from models
      inner join models_formats mf on mf._parent_id = models.id
      inner join media on media.id = mf.file_id
      where models.id = $1
        and lower(mf.format::text) = 'glb'
        and media.url is not null
      order by mf._order asc
      limit 1
    `,
    [modelId],
  )

  return result.rows[0] ?? null
}
