export type ModelLoadPhase = 'cache' | 'download' | 'error' | 'idle' | 'parse' | 'ready' | 'validate'

export type ModelLoadPhaseDisplay = {
  label: string
  progress: number
  stage: string
}

const phaseDisplay: Record<ModelLoadPhase, { label: string; minimum: number; stage: string }> = {
  cache: { label: 'Checking Cache', minimum: 6, stage: 'NETWORK' },
  download: { label: 'Downloading Model', minimum: 3, stage: 'NETWORK' },
  error: { label: 'Preview Unavailable', minimum: 0, stage: 'ERROR' },
  idle: { label: 'Waiting', minimum: 0, stage: 'IDLE' },
  parse: { label: 'Preparing Preview', minimum: 92, stage: 'PARSE' },
  ready: { label: 'Model Ready', minimum: 100, stage: 'READY' },
  validate: { label: 'Validating File', minimum: 84, stage: 'VERIFY' },
}

export function getModelLoadPhaseDisplay(args: {
  phase: ModelLoadPhase
  progress: number
}): ModelLoadPhaseDisplay {
  const phase = phaseDisplay[args.phase] ? args.phase : 'idle'
  const display = phaseDisplay[phase]
  const maximum = phase === 'ready' ? 100 : phase === 'error' || phase === 'idle' ? display.minimum : 99
  const progress = Math.max(display.minimum, Math.min(maximum, Math.round(args.progress || 0)))

  return {
    label: display.label,
    progress,
    stage: display.stage,
  }
}
