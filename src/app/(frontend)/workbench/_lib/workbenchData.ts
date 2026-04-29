import { getCachedPayload } from "@/lib/getCachedPayload";
import {
  buildModelViewerURL,
  getModelGLBSourceURL,
  getModelPreviewURL,
} from "@/lib/modelAssetURL";
import { getMediaAccessURL } from "@/lib/s3SignedURL";

import { getCurrentUser } from "../../_lib/session";

type WorkbenchModelFormat = {
  downloadCredits: null | number;
  fileSizeMb: null | number;
  format: string;
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
  visibility: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const normalizeText = (value: unknown) => {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

export async function getWorkbenchModels(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
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
    result.docs.map(async (model: any) => {
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
      const ownerName =
        normalizeText(owner?.displayName) ||
        normalizeText(owner?.fullName) ||
        normalizeText(owner?.email) ||
        "Unknown creator";
      const formats = Array.isArray(model.formats)
        ? model.formats
            .map((item: any) => {
              const format = normalizeText(item?.format);
              if (!format) return null;

              return {
                downloadCredits:
                  typeof item?.downloadCredits === "number"
                    ? item.downloadCredits
                    : null,
                fileSizeMb:
                  typeof item?.fileSizeMb === "number" ? item.fileSizeMb : null,
                format,
              };
            })
            .filter(Boolean)
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
        isOwnedByCurrentUser: ownerId === Number(user?.id),
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
              .map((tag: any) => String(tag?.label || "").trim())
              .filter(Boolean)
          : [],
        title:
          typeof model.title === "string" && model.title.trim()
            ? model.title
            : `Model ${model.id}`,
        updatedAt: typeof model.updatedAt === "string" ? model.updatedAt : null,
        viewCount: Number(model.viewCount || 0),
        viewerURL,
        visibility:
          typeof model.visibility === "string" ? model.visibility : "private",
      };
    }),
  );
}
