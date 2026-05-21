export type WorkbenchProgressTask = {
  createdAt: string;
  kind: "image" | "model";
  progress: number;
  status: string;
};

const defaultImageGenerationAverageMs = 175000;
const defaultModelGenerationAverageMs = 240000;
const minimumAverageDurationMs = 30000;

const clampProgress = (value: unknown) => {
  const progress = Number(value);
  return Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0;
};

const normalizeDurationMs = (value: unknown, fallback: number) => {
  const duration = Number(value);
  return Number.isFinite(duration) && duration >= minimumAverageDurationMs
    ? Math.round(duration)
    : fallback;
};

const imageGenerationAverageMs = normalizeDurationMs(
  process.env.NEXT_PUBLIC_IMAGE_GENERATION_AVERAGE_MS,
  defaultImageGenerationAverageMs,
);
const modelGenerationAverageMs = normalizeDurationMs(
  process.env.NEXT_PUBLIC_MODEL_GENERATION_AVERAGE_MS,
  defaultModelGenerationAverageMs,
);

export const getWorkbenchProgressDurationMs = (kind: WorkbenchProgressTask["kind"]) => {
  return kind === "image" ? imageGenerationAverageMs : modelGenerationAverageMs;
};

export const getEstimatedWorkbenchProgress = (task: WorkbenchProgressTask, nowMs = Date.now()) => {
  const currentProgress = clampProgress(task.progress);

  if (task.status === "failed" || task.status === "timeout" || task.status === "succeeded") {
    return currentProgress;
  }

  const createdAtMs = Date.parse(task.createdAt);
  if (!Number.isFinite(createdAtMs)) {
    return Math.max(1, currentProgress);
  }

  const elapsedMs = Math.max(0, nowMs - createdAtMs);
  const estimatedProgress = Math.floor((elapsedMs / getWorkbenchProgressDurationMs(task.kind)) * 100);

  return Math.max(currentProgress, Math.max(1, Math.min(99, estimatedProgress)));
};
