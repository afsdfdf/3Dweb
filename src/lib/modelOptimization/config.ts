export type ModelOptimizationMode = 'conservative' | 'small'

export type ModelOptimizationConfig = {
  callbackSecret: string
  dispatchBatchSize: number
  enabled: boolean
  jobTimeoutSeconds: number
  maxActive: number
  mode: ModelOptimizationMode
  sourceURLTTLSeconds: number
  workerURL: string
}

const positiveInt = (value: unknown, fallback: number) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : fallback
}

export function normalizeModelOptimizationConfig(env: NodeJS.ProcessEnv): ModelOptimizationConfig {
  return {
    callbackSecret: String(env.MODEL_OPTIMIZATION_CALLBACK_SECRET || ''),
    dispatchBatchSize: Math.min(24, positiveInt(env.MODEL_OPTIMIZATION_DISPATCH_BATCH_SIZE, 6)),
    enabled: env.MODEL_OPTIMIZATION_ENABLED === 'true',
    jobTimeoutSeconds: positiveInt(env.MODEL_OPTIMIZATION_JOB_TIMEOUT_SECONDS, 420),
    maxActive: Math.min(32, positiveInt(env.MODEL_OPTIMIZATION_MAX_ACTIVE, 24)),
    mode: env.MODEL_OPTIMIZATION_MODE === 'small' ? 'small' : 'conservative',
    sourceURLTTLSeconds: positiveInt(env.MODEL_OPTIMIZATION_SOURCE_URL_TTL_SECONDS, 900),
    workerURL: String(env.MODEL_OPTIMIZATION_WORKER_URL || ''),
  }
}

export function getModelOptimizationConfig() {
  return normalizeModelOptimizationConfig(process.env)
}
