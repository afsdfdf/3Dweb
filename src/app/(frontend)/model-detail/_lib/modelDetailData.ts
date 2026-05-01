import { getCachedPayload } from "@/lib/getCachedPayload";
import { buildModelViewerURL, getModelPreviewURL } from "@/lib/modelAssetURL";
import { getMediaAccessURL } from "@/lib/mediaAccessURL";
import type { Where } from "payload";

type ImageLike = {
  thumbnailURL?: null | string;
  url?: null | string;
};

type OwnerLike = {
  avatar?:
    | null
    | number
    | (ImageLike & { publicAccess?: null | boolean; purpose?: null | string });
  bio?: null | string;
  displayName?: null | string;
  email?: null | string;
  followersCount?: null | number;
  followingCount?: null | number;
  fullName?: null | string;
  id?: number | string;
  profileVisibility?: null | string;
};

type ModelLike = {
  commentsCount?: null | number;
  createdAt?: null | string;
  description?: null | string;
  dimensions?: null | {
    depthMm?: null | number;
    heightMm?: null | number;
    widthMm?: null | number;
  };
  favoritesCount?: null | number;
  formats?:
    | null
    | {
        downloadCredits?: null | number;
        fileSizeMb?: null | number;
        format?: null | string;
      }[];
  id?: number | string;
  likesCount?: null | number;
  owner?: unknown;
  previewImage?: null | number | ImageLike;
  printReady?: null | boolean;
  sourceTask?: null | {
    callbackPayload?: unknown;
    taskCode?: null | string;
  };
  status?: null | string;
  tags?: null | { label?: null | string }[];
  title?: null | string;
  updatedAt?: null | string;
  viewCount?: null | number;
  visibility?: null | string;
};

export type ModelDetailSideModel = {
  href: string;
  id: string;
  imageSrc: string;
  tags: string[];
  title: string;
  updatedLabel: string;
  viewerURL: string;
};

export type ModelDetailData = {
  ageLabel: string;
  authorAvatarSrc: null | string;
  authorDescription: string;
  authorName: string;
  commentsLabel: string;
  downloadCreditsLabel: string;
  favoritesLabel: string;
  formatsLabel: string;
  id: number;
  inputPreviewSrc: null | string;
  isOwnedByCurrentUser: boolean;
  likesLabel: string;
  previewImages: string[];
  printReadyLabel: string;
  sideModels: ModelDetailSideModel[];
  tags: string[];
  title: string;
  topologyLabel: string;
  updatedLabel: string;
  vertexLabel: string;
  viewLabel: string;
  viewerURL: null | string;
  visibilityLabel: string;
};

const fallbackPreview = "/ui-lab/model-detail-uicut/images/detail.png";
const fallbackSidePreview =
  "/ui-lab/model-detail-uicut/images/detail-side-img-1.png";
const sideModelLimit = 24;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const normalizeText = (value: unknown) => {
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const getRelationId = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (isRecord(value)) {
    return getRelationId(value.id);
  }
  return null;
};

const getImageURL = (value: unknown) => {
  if (!isRecord(value)) return null;
  return normalizeText(value.thumbnailURL) || normalizeText(value.url);
};

const normalizeBrowserMediaURL = (value: null | string | undefined) => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;

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

const compactCount = (value: unknown, fallback = "0") => {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count) || count <= 0) return fallback;
  if (count >= 1000)
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
};

const getAgeLabel = (value: null | string | undefined) => {
  if (!value) return "Recently";

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";

  const days = Math.max(1, Math.round((Date.now() - timestamp) / 86_400_000));
  if (days < 30) return `${days} Days ago`;

  const months = Math.max(1, Math.round(days / 30));
  return `${months} Months ago`;
};

const formatDateLabel = (value: null | string | undefined) => {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

const getOwnerName = (owner: null | OwnerLike | undefined) => {
  if (!owner) return "Creator";

  const displayName = normalizeText(owner.displayName);
  const fullName = normalizeText(owner.fullName);
  const email = normalizeText(owner.email);

  return displayName || fullName || email?.split("@")[0] || "Creator";
};

const getPublicAvatarURL = (owner: null | OwnerLike | undefined) => {
  const avatar = owner?.avatar;
  if (!isRecord(avatar)) return null;

  if (avatar.publicAccess === true || avatar.purpose === "preview") {
    return getImageURL(avatar);
  }

  return null;
};

async function getPublicOwner(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  owner: unknown,
) {
  const ownerId = getRelationId(owner);
  if (!ownerId) return null;

  try {
    const ownerDoc = isRecord(owner) ? (owner as OwnerLike) : null;
    const resolvedOwner =
      ownerDoc?.profileVisibility !== undefined
        ? ownerDoc
        : ((await payload.findByID({
            collection: "users",
            depth: 1,
            id: ownerId,
            overrideAccess: true,
            select: {
              avatar: true,
              bio: true,
              displayName: true,
              email: true,
              followersCount: true,
              followingCount: true,
              fullName: true,
              profileVisibility: true,
            },
          })) as OwnerLike);

    return resolvedOwner;
  } catch {
    return null;
  }
}

const getFormatLabel = (model: ModelLike) => {
  const formats = Array.isArray(model.formats)
    ? model.formats
        .map((item) => normalizeText(item?.format)?.toUpperCase())
        .filter(Boolean)
    : [];

  return formats.length > 0 ? formats.join(" / ") : "GLB";
};

const getDownloadCreditsLabel = (model: ModelLike) => {
  const values = Array.isArray(model.formats)
    ? model.formats
        .map((item) => Number(item?.downloadCredits ?? 0))
        .filter((value) => Number.isFinite(value) && value > 0)
    : [];

  if (values.length === 0) return "0.00";
  return Math.min(...values).toFixed(2);
};

const getTags = (model: ModelLike) => {
  const tags = Array.isArray(model.tags)
    ? model.tags
        .map((tag) => normalizeText(tag?.label))
        .filter((tag): tag is string => Boolean(tag))
    : [];
  return tags.length > 0 ? tags.slice(0, 4) : [getFormatLabel(model)];
};

async function getSideModels(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  model: ModelLike,
  ownerId: null | number,
) {
  const where: Where = ownerId
    ? {
        and: [
          { visibility: { equals: "public" } },
          { owner: { equals: ownerId } },
        ],
      }
    : {
        visibility: { equals: "public" },
      };

  const result = await payload.find({
    collection: "models",
    depth: 1,
    limit: sideModelLimit,
    overrideAccess: false,
    pagination: false,
    select: {
      createdAt: true,
      formats: true,
      id: true,
      previewImage: true,
      tags: true,
      title: true,
      updatedAt: true,
    },
    sort: "-updatedAt",
    where,
  });

  const docs = result.docs as ModelLike[];
  return Promise.all(
    docs.map(async (item) => ({
      href: `/model-detail?id=${encodeURIComponent(String(item.id))}`,
      id: String(item.id),
      imageSrc:
        (await resolveMediaAccessURL(payload, getModelPreviewURL(item))) ||
        fallbackSidePreview,
      tags: getTags(item),
      title: normalizeText(item.title) || `Model ${item.id}`,
      updatedLabel: formatDateLabel(item.updatedAt || item.createdAt),
      viewerURL: buildModelViewerURL({ modelId: Number(item.id) }),
    })),
  );
}

export async function getModelDetailData(args: {
  currentUserId?: null | number | string;
  id?: null | number | string;
}): Promise<ModelDetailData | null> {
  const modelId = Number(args.id);
  if (!Number.isFinite(modelId) || modelId <= 0) return null;

  const payload = await getCachedPayload();
  const result = await payload.find({
    collection: "models",
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: {
      commentsCount: true,
      createdAt: true,
      description: true,
      dimensions: true,
      favoritesCount: true,
      formats: true,
      id: true,
      likesCount: true,
      owner: true,
      previewImage: true,
      printReady: true,
      sourceTask: true,
      tags: true,
      title: true,
      updatedAt: true,
      viewCount: true,
      visibility: true,
    },
    where: {
      and: [{ id: { equals: modelId } }, { visibility: { equals: "public" } }],
    },
  });

  const model = result.docs[0] as ModelLike | undefined;
  if (!model) return null;

  const ownerId = getRelationId(model.owner);
  const [owner, previewURL, sideModels] = await Promise.all([
    getPublicOwner(payload, model.owner),
    resolveMediaAccessURL(payload, getModelPreviewURL(model)),
    getSideModels(payload, model, ownerId),
  ]);
  const title = normalizeText(model.title) || `Model ${model.id}`;
  const dimensions = isRecord(model.dimensions) ? model.dimensions : null;
  const vertexLabel =
    typeof dimensions?.widthMm === "number" ||
    typeof dimensions?.heightMm === "number" ||
    typeof dimensions?.depthMm === "number"
      ? [dimensions.widthMm, dimensions.heightMm, dimensions.depthMm]
          .map((value) =>
            typeof value === "number" && Number.isFinite(value)
              ? Math.round(value)
              : null,
          )
          .filter((value) => value !== null)
          .join(" x ") || "--"
      : "--";

  return {
    ageLabel: getAgeLabel(model.updatedAt || model.createdAt),
    authorAvatarSrc: await resolveMediaAccessURL(
      payload,
      getPublicAvatarURL(owner),
    ),
    authorDescription:
      normalizeText(owner?.bio) ||
      normalizeText(model.description) ||
      "Public creator model available for preview and reference.",
    authorName: getOwnerName(owner),
    commentsLabel: compactCount(model.commentsCount),
    downloadCreditsLabel: getDownloadCreditsLabel(model),
    favoritesLabel: compactCount(model.favoritesCount),
    formatsLabel: getFormatLabel(model),
    id: Number(model.id),
    inputPreviewSrc: previewURL,
    isOwnedByCurrentUser:
      ownerId !== null && String(ownerId) === String(args.currentUserId ?? ""),
    likesLabel: compactCount(model.likesCount),
    previewImages: [previewURL || fallbackPreview],
    printReadyLabel: model.printReady ? "Print Ready" : "Preview Only",
    sideModels,
    tags: getTags(model),
    title,
    topologyLabel: "Triangle",
    updatedLabel: formatDateLabel(model.updatedAt || model.createdAt),
    vertexLabel,
    viewLabel: compactCount(model.viewCount),
    viewerURL: buildModelViewerURL({ modelId: Number(model.id) }),
    visibilityLabel: normalizeText(model.visibility) || "public",
  };
}
