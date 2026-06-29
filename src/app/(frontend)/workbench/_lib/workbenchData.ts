import { getCachedPayload } from "@/lib/getCachedPayload";
import {
  buildModelViewerURL,
  getModelGLBSourceURL,
  getModelPreviewURL,
} from "@/lib/modelAssetURL";
import { getMediaAccessURL } from "@/lib/mediaAccessURL";
import type { GenerationTask, Model } from "@/payload-types";

import { getCurrentUser } from "../../_lib/session";

type WorkbenchModelDocument = Model;
type WorkbenchModelFormatDocument = NonNullable<WorkbenchModelDocument["formats"]>[number];
type WorkbenchModelTagDocument = NonNullable<WorkbenchModelDocument["tags"]>[number];
type WorkbenchGenerationTaskDocument = GenerationTask;
type CachedPayload = Awaited<ReturnType<typeof getCachedPayload>>;
type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

type WorkbenchModelFormat = {
  downloadCredits: null | number;
  fileSizeMb: null | number;
  format: string;
};

type WorkbenchViewerOptimizationStatus = "failed" | "none" | "pending" | "running" | "skipped" | "succeeded";

const isWorkbenchModelFormat = (value: WorkbenchModelFormat | null): value is WorkbenchModelFormat => {
  return Boolean(value);
};

type WorkbenchOwnerProfile = {
  avatarFrame: string;
  avatarUrl: null | string;
  backgroundUrl: null | string;
  bio: null | string;
  displayName: string;
  followersCount: number;
  followingCount: number;
  profileViewCount: number;
  profileVisibility: string;
};

export type WorkbenchModel = {
  commentsCount: number;
  createdAt: null | string;
  description: null | string;
  dimensions: null | {
    depthMm: null | number;
    heightMm: null | number;
    widthMm: null | number;
  };
  favoritesCount: number;
  formats: WorkbenchModelFormat[];
  id: number;
  isOwnedByCurrentUser: boolean;
  likesCount: number;
  ownerId: number | null;
  ownerName: string;
  ownerProfile: null | WorkbenchOwnerProfile;
  previewURL: null | string;
  printReady: boolean;
  sourceTaskCode: null | string;
  status: string;
  tags: string[];
  title: string;
  updatedAt: null | string;
  viewCount: number;
  viewerURL: null | string;
  viewerOptimizationStatus: WorkbenchViewerOptimizationStatus;
  visibility: string;
};

export type WorkbenchImageAsset = {
  createdAt: null | string;
  fileName: string;
  id: number;
  mimeType: string;
  previewURL: string;
};

export type WorkbenchPendingGenerationTask = {
  cardId: number;
  createdAt: string;
  failureReason?: null | string;
  kind: "image" | "model";
  license: "Private" | "Public";
  previewSrc?: null | string;
  progress: number;
  status: "failed" | "finalizing" | "processing" | "queued" | "timeout" | "uploading";
  taskCode?: null | string;
  taskId?: null | number;
  title: string;
};

export type WorkbenchGenerationTaskState = {
  imageAssets: WorkbenchImageAsset[];
  pendingGenerationTasks: WorkbenchPendingGenerationTask[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const normalizeText = (value: unknown) => {
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const normalizeViewerOptimizationStatus = (value: unknown): WorkbenchViewerOptimizationStatus => {
  if (
    value === "pending" ||
    value === "running" ||
    value === "succeeded" ||
    value === "failed" ||
    value === "skipped"
  ) {
    return value;
  }

  return "none";
};

const hasGLBFormat = (value: unknown) => {
  if (!Array.isArray(value)) return false;

  return value.some((item) => {
    return (
      isRecord(item) && normalizeText(item.format)?.toLowerCase() === "glb"
    );
  });
};

const getMediaUrl = (value: unknown) => {
  if (!isRecord(value)) return null;

  const thumbnailURL = normalizeText(value.thumbnailURL);
  if (thumbnailURL) return thumbnailURL;

  return normalizeText(value.url);
};

const normalizeBrowserMediaURL = (value: null | string | undefined) => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    if (
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      parsed.pathname.startsWith("/api/media/file/")
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};

async function resolveMediaAccessURL(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  url: null | string | undefined,
) {
  const normalized = normalizeBrowserMediaURL(url);
  if (!normalized) return null;
  if (normalized.startsWith("/")) return normalized;

  return normalizeBrowserMediaURL(
    await getMediaAccessURL({ payload, url: normalized }),
  );
}

export function formatVisibilityBadge(visibility: string) {
  if (visibility === "public") return "Public";
  if (visibility === "team") return "Team";
  return "Private";
}

export function formatStatusBadge(status: string) {
  if (status === "ready") return "Ready";
  if (status === "archived") return "Archived";
  return "Draft";
}

export function formatViewerOptimizationBadge(status: WorkbenchViewerOptimizationStatus) {
  if (status === "pending" || status === "running") return "Optimizing preview";
  if (status === "succeeded") return "Preview optimized";
  if (status === "failed") return "Preview optimization failed";
  return null;
}

export function formatWorkbenchDate(value: null | string) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

async function normalizeWorkbenchModel({
  model,
  payload,
  user,
}: {
  model: WorkbenchModelDocument;
  payload: CachedPayload;
  user: CurrentUser;
}): Promise<WorkbenchModel> {
      const owner = isRecord(model.owner) ? model.owner : null;
      const [previewURL, ownerAvatarUrl, ownerBackgroundUrl] =
        await Promise.all([
          resolveMediaAccessURL(payload, getModelPreviewURL(model)),
          resolveMediaAccessURL(payload, getMediaUrl(owner?.avatar)),
          resolveMediaAccessURL(payload, getMediaUrl(owner?.profileBackground)),
        ]);
      const viewerURL =
        getModelGLBSourceURL({ model }) || hasGLBFormat(model.formats)
          ? buildModelViewerURL({ modelId: model.id })
          : null;
      const sourceTask =
        model?.sourceTask &&
        typeof model.sourceTask === "object" &&
        !Array.isArray(model.sourceTask)
          ? model.sourceTask
          : null;
      const ownerId = Number(owner?.id ?? model.owner) || null;
      const isOwnedByCurrentUser = ownerId === Number(user?.id);
      const ownerName =
        normalizeText(owner?.displayName) ||
        normalizeText(owner?.fullName) ||
        normalizeText(owner?.email) ||
        "Unknown creator";
      const formats = Array.isArray(model.formats)
        ? model.formats
            .map((item: WorkbenchModelFormatDocument) => {
              const format = normalizeText(item.format);
              if (!format) return null;

              return {
                downloadCredits:
                  typeof item.downloadCredits === "number"
                    ? item.downloadCredits
                    : null,
                fileSizeMb:
                  typeof item.fileSizeMb === "number" ? item.fileSizeMb : null,
                format,
              };
            })
            .filter(isWorkbenchModelFormat)
        : [];

      return {
        commentsCount: Number(model.commentsCount || 0),
        createdAt: typeof model.createdAt === "string" ? model.createdAt : null,
        description:
          typeof model.description === "string" ? model.description : null,
        dimensions: isRecord(model.dimensions)
          ? {
              depthMm:
                typeof model.dimensions.depthMm === "number"
                  ? model.dimensions.depthMm
                  : null,
              heightMm:
                typeof model.dimensions.heightMm === "number"
                  ? model.dimensions.heightMm
                  : null,
              widthMm:
                typeof model.dimensions.widthMm === "number"
                  ? model.dimensions.widthMm
                  : null,
            }
          : null,
        favoritesCount: Number(model.favoritesCount || 0),
        formats,
        id: Number(model.id),
        isOwnedByCurrentUser,
        likesCount: Number(model.likesCount || 0),
        ownerId,
        ownerName,
        ownerProfile: owner
          ? {
              avatarFrame: normalizeText(owner.avatarFrame) || "none",
              avatarUrl: ownerAvatarUrl,
              backgroundUrl: ownerBackgroundUrl,
              bio: normalizeText(owner.bio),
              displayName: ownerName,
              followersCount: Number(owner.followersCount || 0),
              followingCount: Number(owner.followingCount || 0),
              profileViewCount: Number(owner.profileViewCount || 0),
              profileVisibility:
                normalizeText(owner.profileVisibility) || "private",
            }
          : null,
        previewURL,
        printReady: Boolean(model.printReady),
        sourceTaskCode:
          typeof sourceTask?.taskCode === "string" ? sourceTask.taskCode : null,
        status: typeof model.status === "string" ? model.status : "draft",
        tags: Array.isArray(model.tags)
          ? model.tags
              .map((tag: WorkbenchModelTagDocument) => String(tag.label || "").trim())
              .filter(Boolean)
          : [],
        title:
          typeof model.title === "string" && model.title.trim()
            ? model.title
            : `Model ${model.id}`,
        updatedAt: typeof model.updatedAt === "string" ? model.updatedAt : null,
        viewCount: Number(model.viewCount || 0),
        viewerURL,
        viewerOptimizationStatus: isOwnedByCurrentUser ? normalizeViewerOptimizationStatus(model.viewerOptimization?.status) : "none",
        visibility:
          typeof model.visibility === "string" ? model.visibility : "private",
      };
}

export async function getWorkbenchModelById(
  user: CurrentUser,
  modelId: number,
): Promise<WorkbenchModel | null> {
  if (!Number.isFinite(modelId) || modelId <= 0) return null;

  const payload = await getCachedPayload();

  try {
    const model = await payload.findByID({
      collection: "models",
      depth: 2,
      id: modelId,
      overrideAccess: false,
      ...(user ? { user } : {}),
    });

    return normalizeWorkbenchModel({
      model: model as WorkbenchModelDocument,
      payload,
      user,
    });
  } catch {
    return null;
  }
}

export async function getWorkbenchModels(
  user: CurrentUser,
): Promise<WorkbenchModel[]> {
  if (!user) return [];

  const payload = await getCachedPayload();
  const result = await payload.find({
    collection: "models",
    depth: 2,
    limit: 24,
    overrideAccess: false,
    pagination: false,
    sort: "-updatedAt",
    user,
  });

  return Promise.all(
    result.docs.map((model: WorkbenchModelDocument) =>
      normalizeWorkbenchModel({
        model,
        payload,
        user,
      }),
    ),
  );
}

function getImageGenerationResultMediaId(task: unknown) {
  if (!isRecord(task)) return 0;
  const callbackPayload = isRecord(task.callbackPayload) ? task.callbackPayload : {};
  const imageGeneration = isRecord(callbackPayload.imageGeneration)
    ? callbackPayload.imageGeneration
    : {};
  const mediaId =
    typeof imageGeneration.resultMediaId === "number"
      ? imageGeneration.resultMediaId
      : Number(imageGeneration.resultMediaId);

  return Number.isFinite(mediaId) && mediaId > 0 ? mediaId : 0;
}

function getPendingTaskTitle(task: unknown) {
  if (!isRecord(task)) return "Generating model";
  const snapshot = isRecord(task.parameterSnapshot) ? task.parameterSnapshot : {};
  const workbench = isRecord(snapshot.workbench) ? snapshot.workbench : {};
  const fallbackTitle = isImageGenerationTask(task)
    ? "Generating image"
    : "Generating model";
  return (
    normalizeText(workbench.requestedTitle) ||
    normalizeText(task.taskCode) ||
    fallbackTitle
  );
}

function getPendingTaskLicense(task: unknown): "Private" | "Public" {
  if (!isRecord(task)) return "Private";
  const snapshot = isRecord(task.parameterSnapshot) ? task.parameterSnapshot : {};
  const workbench = isRecord(snapshot.workbench) ? snapshot.workbench : {};
  const license = normalizeText(workbench.license)?.toLowerCase();
  return license === "public" ? "Public" : "Private";
}

function getPendingTaskPreview(task: unknown) {
  if (!isRecord(task)) return null;
  const callbackPayload = isRecord(task.callbackPayload) ? task.callbackPayload : {};
  const thumbnailUrl = normalizeText(callbackPayload.thumbnailUrl);
  if (thumbnailUrl) return thumbnailUrl;

  const snapshot = isRecord(task.parameterSnapshot) ? task.parameterSnapshot : {};
  const sourceImageAsset = isRecord(snapshot.sourceImageAsset)
    ? snapshot.sourceImageAsset
    : null;
  const sourceImageAssets = Array.isArray(snapshot.sourceImageAssets)
    ? snapshot.sourceImageAssets
    : [];
  const firstSourceImageAsset = sourceImageAssets.find(isRecord);

  return (
    normalizeText(sourceImageAsset?.publicUrl) ||
    normalizeText(firstSourceImageAsset?.publicUrl)
  );
}

function getPendingTaskStatus(task: unknown): WorkbenchPendingGenerationTask["status"] {
  if (!isRecord(task)) return "processing";
  if (task.status === "queued") return "queued";
  if (task.status === "failed") return "failed";
  if (task.status === "timeout") return "timeout";
  return "processing";
}

function getPendingTaskProgress(task: unknown) {
  if (!isRecord(task)) return 0;
  const progress = Number(task.progress);
  return Number.isFinite(progress)
    ? Math.max(0, Math.min(100, Math.round(progress)))
    : 0;
}

function isImageGenerationTask(task: unknown) {
  if (!isRecord(task)) return false;

  const snapshot = isRecord(task.parameterSnapshot) ? task.parameterSnapshot : {};
  const imageGeneration = isRecord(snapshot.imageGeneration)
    ? snapshot.imageGeneration
    : {};

  return (
    task.taskType === "image-generation" ||
    imageGeneration.taskType === "image-generation" ||
    task.provider === "gemini-official" ||
    task.provider === "gemini-third-party" ||
    task.provider === "openai-compatible"
  );
}

function isPendingGenerationTask(task: unknown) {
  if (!isRecord(task)) return false;
  return task.status === "queued" || task.status === "processing";
}

function isPendingModelGenerationTask(task: unknown) {
  if (!isPendingGenerationTask(task) || !isRecord(task)) return false;
  return !isImageGenerationTask(task);
}

function isPendingImageGenerationTask(task: unknown) {
  return isPendingGenerationTask(task) && isImageGenerationTask(task);
}

function isImageAssetGenerationTask(task: unknown) {
  if (!isRecord(task)) return false;
  return task.status === "succeeded" && isImageGenerationTask(task);
}

export async function getWorkbenchGenerationTaskState(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<WorkbenchGenerationTaskState> {
  if (!user) {
    return {
      imageAssets: [],
      pendingGenerationTasks: [],
    };
  }

  const payload = await getCachedPayload();
  const tasks = await payload.find({
    collection: "generation-tasks",
    depth: 0,
    limit: 48,
    overrideAccess: false,
    pagination: false,
    sort: "-updatedAt",
    user,
    where: {
      and: [
        {
          user: {
            equals: user.id,
          },
        },
        {
          or: [
            {
              and: [
                {
                  status: {
                    in: ["queued", "processing"],
                  },
                },
              ],
            },
            {
              and: [
                {
                  status: {
                    equals: "succeeded",
                  },
                },
                {
                  provider: {
                    in: ["gemini-official", "gemini-third-party", "openai-compatible"],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const pendingGenerationTasks = tasks.docs
    .filter((task) => isPendingModelGenerationTask(task) || isPendingImageGenerationTask(task))
    .slice(0, 8)
    .map((task: WorkbenchGenerationTaskDocument) => {
      const taskId = Number(task.id);
      const kind: WorkbenchPendingGenerationTask["kind"] = isImageGenerationTask(task)
        ? "image"
        : "model";

      return {
        cardId: -Math.max(1, taskId || Date.now()),
        createdAt:
          typeof task.createdAt === "string"
            ? task.createdAt
            : new Date().toISOString(),
        failureReason:
          typeof task.failureReason === "string" ? task.failureReason : null,
        kind,
        license: getPendingTaskLicense(task),
        previewSrc: getPendingTaskPreview(task),
        progress: getPendingTaskProgress(task),
        status: getPendingTaskStatus(task),
        taskCode: typeof task.taskCode === "string" ? task.taskCode : null,
        taskId: Number.isFinite(taskId) && taskId > 0 ? taskId : null,
        title: getPendingTaskTitle(task),
      };
    });

  const seen = new Set<number>();
  const assets = await Promise.all(
    tasks.docs.filter(isImageAssetGenerationTask).slice(0, 24).map(async (task: WorkbenchGenerationTaskDocument) => {
      const mediaId = getImageGenerationResultMediaId(task);
      if (!mediaId || seen.has(mediaId)) return null;
      seen.add(mediaId);

      const media = await payload
        .findByID({
          collection: "media",
          depth: 0,
          id: mediaId,
          overrideAccess: false,
          user,
        })
        .catch(() => null);

      if (!media) return null;

      const rawURL = getMediaUrl(media);
      const previewURL = await resolveMediaAccessURL(payload, rawURL);
      if (!previewURL) return null;

      return {
        createdAt: typeof task.createdAt === "string" ? task.createdAt : null,
        fileName: normalizeText(media.filename) || `image-${mediaId}.png`,
        id: mediaId,
        mimeType: normalizeText(media.mimeType) || "image/png",
        previewURL,
      };
    }),
  );

  return {
    imageAssets: assets.filter((asset): asset is WorkbenchImageAsset =>
      Boolean(asset),
    ),
    pendingGenerationTasks,
  };
}

export async function getWorkbenchPendingGenerationTasks(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<WorkbenchPendingGenerationTask[]> {
  return (await getWorkbenchGenerationTaskState(user)).pendingGenerationTasks;
}

export async function getWorkbenchImageAssets(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<WorkbenchImageAsset[]> {
  return (await getWorkbenchGenerationTaskState(user)).imageAssets;
}
