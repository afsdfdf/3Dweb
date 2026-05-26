import type { ModelOptimizationMode } from './config'

const sanitizePathPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export function buildOptimizedModelPath(args: {
  mode: ModelOptimizationMode
  modelId: number
  prefix: string
  sourceMediaId: number
  userId: number
}) {
  const prefix = args.prefix.replace(/^\/+|\/+$/g, '') || 'media'
  const userPart = sanitizePathPart(`user-${args.userId}`) || 'user'

  return `${prefix}/model-previews/${userPart}/model-${args.modelId}/source-${args.sourceMediaId}/model-${args.modelId}-preview-${args.mode}.glb`
}
