const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeText = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

const getRelationMediaURL = (value: unknown) => {
  if (!isRecord(value)) return null

  const url = normalizeText(value.url)
  return url
}

const getTaskCallbackPayload = (task: unknown) => {
  if (!isRecord(task)) return null
  return isRecord(task.callbackPayload) ? task.callbackPayload : null
}

const getModelSourceTask = (model: unknown) => {
  if (!isRecord(model)) return null
  return isRecord(model.sourceTask) ? model.sourceTask : null
}

const getModelURLs = (payload: Record<string, unknown> | null) => {
  if (!payload || !isRecord(payload.modelUrls)) return null
  return payload.modelUrls
}

const getModelFormatFileURL = (model: unknown, format: string) => {
  if (!isRecord(model) || !Array.isArray(model.formats)) return null

  const preferred = model.formats.find((item) => {
    return isRecord(item) && String(item.format || '').toLowerCase() === format.toLowerCase()
  })

  return preferred ? getRelationMediaURL(isRecord(preferred) ? preferred.file : null) : null
}

const isLikelyDirectModelAssetURL = (value: string) => {
  try {
    const parsed = value.startsWith('/') ? new URL(value, 'http://localhost') : new URL(value)
    return parsed.pathname.toLowerCase().endsWith('.glb')
  } catch {
    return false
  }
}

export function getModelPreviewURL(model: unknown) {
  if (!isRecord(model)) return null

  const preview = isRecord(model.previewImage) ? model.previewImage : null
  const previewURL = getRelationMediaURL(preview)
  if (previewURL) {
    return previewURL
  }

  const callbackPayload = getTaskCallbackPayload(getModelSourceTask(model))
  return normalizeText(callbackPayload?.thumbnailUrl)
}

export function getModelGLBSourceURL(args: {
  model: unknown
  task?: unknown
}) {
  const taskCallbackPayload = getTaskCallbackPayload(args.task)
  const taskModelURLs = getModelURLs(taskCallbackPayload)
  const taskGLB = normalizeText(taskModelURLs?.glb)
  if (taskGLB) {
    return taskGLB
  }

  const modelSourceTask = getModelSourceTask(args.model)
  const callbackPayload = getTaskCallbackPayload(modelSourceTask)
  const callbackModelURLs = getModelURLs(callbackPayload)
  const callbackGLB = normalizeText(callbackModelURLs?.glb)
  if (callbackGLB) {
    return callbackGLB
  }

  const formatGLB = getModelFormatFileURL(args.model, 'glb')
  if (formatGLB) {
    return formatGLB
  }

  if (isRecord(args.model)) {
    const viewerURL = normalizeText(args.model.viewerUrl)
    if (viewerURL && isLikelyDirectModelAssetURL(viewerURL)) {
      return viewerURL
    }
  }

  return null
}

export function buildModelViewerURL(args: {
  format?: string
  modelId: number | string
}) {
  const format = normalizeText(args.format) || 'glb'
  return `/api/platform/models/${encodeURIComponent(String(args.modelId))}/viewer?format=${encodeURIComponent(format)}`
}
