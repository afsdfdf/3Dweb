export type ModelLoadPhase =
  | 'build'
  | 'cache'
  | 'decode'
  | 'download'
  | 'error'
  | 'idle'
  | 'parse'
  | 'ready'
  | 'validate'

export type ModelLoadPhaseDisplay = {
  label: string
  progress: number
  stage: string
}

type PhaseRange = {
  label: string
  maximum: number
  minimum: number
  stage: string
}

const phaseDisplay: Record<ModelLoadPhase, PhaseRange> = {
  build: { label: 'Building Scene', maximum: 98, minimum: 94, stage: 'BUILD' },
  cache: { label: 'Checking Cache', maximum: 6, minimum: 0, stage: 'NETWORK' },
  decode: { label: 'Decoding Geometry', maximum: 94, minimum: 85, stage: 'DECODE' },
  download: { label: 'Downloading Model', maximum: 80, minimum: 3, stage: 'NETWORK' },
  error: { label: 'Preview Unavailable', maximum: 0, minimum: 0, stage: 'ERROR' },
  idle: { label: 'Waiting', maximum: 0, minimum: 0, stage: 'IDLE' },
  // `parse` is retained as a compatibility alias that lands in the decode/build section.
  parse: { label: 'Preparing Preview', maximum: 98, minimum: 92, stage: 'DECODE' },
  ready: { label: 'Model Ready', maximum: 100, minimum: 100, stage: 'READY' },
  validate: { label: 'Validating File', maximum: 85, minimum: 80, stage: 'VERIFY' },
}

export function getModelLoadPhaseDisplay(args: {
  phase: ModelLoadPhase
  progress: number
}): ModelLoadPhaseDisplay {
  const phase = phaseDisplay[args.phase] ? args.phase : 'idle'
  const display = phaseDisplay[phase]
  const progress = Math.max(
    display.minimum,
    Math.min(display.maximum, Math.round(args.progress || 0)),
  )

  return {
    label: display.label,
    progress,
    stage: display.stage,
  }
}