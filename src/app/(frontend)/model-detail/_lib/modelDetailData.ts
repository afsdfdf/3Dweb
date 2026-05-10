import { getCachedPayload } from "@/lib/getCachedPayload";
import { buildModelViewerURL, getModelPreviewURL } from "@/lib/modelAssetURL";
import { getMediaAccessURL } from "@/lib/mediaAccessURL";
import { isGuestReadableMedia } from "@/lib/mediaVisibility";
import type { Where } from "payload";
import type { getCurrentUser } from "../../_lib/session";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

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
  followersCount?: null | number;
  followingCount?: null | number;
  fullName?: null | string;
  id?: number | string;
  profileBackground?:
    | null
    | number
    | (ImageLike & { publicAccess?: null | boolean; purpose?: null | string });
  profileBannerFocalX?: null | number;
  profileBannerFocalY?: null | number;
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

type DownloadPolicy = {
  chargeDownloadCredits: boolean;
  downloadCredits: number;
};

export type ModelDetailSideModel = {
  commentsCount: number;
  commentsEnabled: boolean;
  downloadCredits: number;
  downloadCreditsLabel: string;
  href: string;
  id: string;
  imageSrc: string;
  printReady: boolean;
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
  authorProfileBannerFocalX: number;
  authorProfileBannerFocalY: number;
  authorProfileBannerSrc: null | string;
  chargeDownloadCredits: boolean;
  commentsCount: number;
  commentsEnabled: boolean;
  commentsLabel: string;
  downloadCredits: number;
  downloadCreditsLabel: string;
  favoritesLabel: string;
  formatsLabel: string;
  id: number;
  inputPreviewSrc: null | string;
  isOwnedByCurrentUser: boolean;
  likesLabel: string;
  previewImages: string[];
  printReady: boolean;
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

const readPositiveNumber = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return numeric;
};

const formatCredits = (value: number) => value.toFixed(2);

async function getDownloadPolicy(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
): Promise<DownloadPolicy> {
  try {
    const settings = await payload.findGlobal({
      depth: 0,
      overrideAccess: true,
      slug: "site-settings",
    });
    const policy = isRecord(settings?.modelAccessPolicy)
      ? settings.modelAccessPolicy
      : null;

    return {
      chargeDownloadCredits: policy?.chargeDownloadCredits === true,
      downloadCredits: readPositiveNumber(policy?.downloadCredits),
    };
  } catch {
    return {
      chargeDownloadCredits: false,
      downloadCredits: 0,
    };
  }
}

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
  const ownerId = getRelationId(owner.id);

  return displayName || fullName || (ownerId ? `Creator ${ownerId}` : "Creator");
};

const isStaffUser = (user: CurrentUser | null | undefined) => {
  return ["admin", "operator"].includes(String(user?.role || "customer"));
};

const getOwnerAvatarURL = (
  owner: null | OwnerLike | undefined,
  allowPrivateProfileMedia: boolean,
) => {
  const avatar = owner?.avatar;
  if (!isRecord(avatar)) return null;
  if (!allowPrivateProfileMedia && !isGuestReadableMedia(avatar)) return null;

  return getImageURL(avatar);
};

const getOwnerProfileBannerURL = (
  owner: null | OwnerLike | undefined,
  allowPrivateProfileMedia: boolean,
) => {
  const banner = owner?.profileBackground;
  if (!isRecord(banner)) return null;
  if (!allowPrivateProfileMedia && !isGuestReadableMedia(banner)) return null;

  return getImageURL(banner);
};

const normalizeFocalPoint = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 50;
  return Math.max(0, Math.min(100, numeric));
};

async function getPublicOwner(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  owner: unknown,
) {
  const ownerId = getRelationId(owner);
  if (!ownerId) return null;

  try {
    const ownerDoc = isRecord(owner) ? (owner as OwnerLike) : null;
    const ownerDocHasProfileMedia =
      ownerDoc?.profileVisibility !== undefined &&
      ownerDoc?.profileBackground !== undefined &&
      ownerDoc?.profileBannerFocalX !== undefined &&
      ownerDoc?.profileBannerFocalY !== undefined;
    const resolvedOwner =
      ownerDocHasProfileMedia
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
              followersCount: true,
              followingCount: true,
              fullName: true,
              profileBackground: true,
              profileBannerFocalX: true,
              profileBannerFocalY: true,
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

const getFormatDownloadCredits = (model: ModelLike, format = "glb") => {
  if (!Array.isArray(model.formats)) return 0;

  const selectedFormat = model.formats.find(
    (item) => normalizeText(item?.format)?.toLowerCase() === format,
  );
  const selectedCredits = readPositiveNumber(selectedFormat?.downloadCredits);
  if (selectedCredits > 0) return selectedCredits;

  const formatCredits = model.formats
    .map((item) => readPositiveNumber(item?.downloadCredits))
    .filter((value) => value > 0);
  return formatCredits.length > 0 ? Math.min(...formatCredits) : 0;
};

const getDownloadCredits = (model: ModelLike, policy: DownloadPolicy) => {
  if (!policy.chargeDownloadCredits) return 0;

  return getFormatDownloadCredits(model) || policy.downloadCredits;
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
  policy: DownloadPolicy,
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
      commentsCount: true,
      createdAt: true,
      formats: true,
      id: true,
      previewImage: true,
      printReady: true,
      tags: true,
      title: true,
      updatedAt: true,
    },
    sort: "-updatedAt",
    where,
  });

  const docs = result.docs as ModelLike[];
  const mappedModels = await Promise.all(
    docs.map(async (item) => {
      const downloadCredits = getDownloadCredits(item, policy);
      const imageSrc = await resolveMediaAccessURL(
        payload,
        getModelPreviewURL(item),
      );

      if (!imageSrc) return null;

      return {
        commentsCount: Number(item.commentsCount || 0),
        commentsEnabled: true,
        downloadCredits,
        downloadCreditsLabel: formatCredits(downloadCredits),
        href: `/model-detail?id=${encodeURIComponent(String(item.id))}`,
        id: String(item.id),
        imageSrc,
        printReady: item.printReady === true,
        tags: getTags(item),
        title: normalizeText(item.title) || `Model ${item.id}`,
        updatedLabel: formatDateLabel(item.updatedAt || item.createdAt),
        viewerURL: buildModelViewerURL({ modelId: Number(item.id) }),
      };
    }),
  );

  return mappedModels.filter(
    (item): item is ModelDetailSideModel => Boolean(item),
  );
}

export async function getModelDetailData(args: {
  currentUser?: CurrentUser | null;
  currentUserId?: null | number | string;
  id?: null | number | string;
}): Promise<ModelDetailData | null> {
  const modelId = Number(args.id);
  if (!Number.isFinite(modelId) || modelId <= 0) return null;

  const payload = await getCachedPayload();
  const currentUser = args.currentUser ?? null;
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
      id: {
        equals: modelId,
      },
    },
    ...(currentUser ? { user: currentUser } : {}),
  });

  const model = result.docs[0] as ModelLike | undefined;
  if (!model) return null;

  const ownerId = getRelationId(model.owner);
  const currentUserId = currentUser?.id ?? args.currentUserId;
  const isOwnedByCurrentUser =
    ownerId !== null && String(ownerId) === String(currentUserId ?? "");
  const allowPrivateProfileMedia =
    isOwnedByCurrentUser || isStaffUser(currentUser);
  const commentsEnabled = model.visibility === "public";
  const policy = await getDownloadPolicy(payload);
  const [owner, previewURL, sideModels] = await Promise.all([
    getPublicOwner(payload, model.owner),
    resolveMediaAccessURL(payload, getModelPreviewURL(model)),
    getSideModels(payload, model, ownerId, policy),
  ]);
  const title = normalizeText(model.title) || `Model ${model.id}`;
  const downloadCredits = getDownloadCredits(model, policy);
  if (!previewURL) return null;

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
      getOwnerAvatarURL(owner, allowPrivateProfileMedia),
    ),
    authorDescription:
      normalizeText(owner?.bio) ||
      normalizeText(model.description) ||
      (commentsEnabled
        ? "Public creator model available for preview and reference."
        : "Private model available to its owner and staff."),
    authorName: getOwnerName(owner),
    authorProfileBannerFocalX: normalizeFocalPoint(owner?.profileBannerFocalX),
    authorProfileBannerFocalY: normalizeFocalPoint(owner?.profileBannerFocalY),
    authorProfileBannerSrc: await resolveMediaAccessURL(
      payload,
      getOwnerProfileBannerURL(owner, allowPrivateProfileMedia),
    ),
    chargeDownloadCredits: policy.chargeDownloadCredits,
    commentsCount: commentsEnabled ? Number(model.commentsCount || 0) : 0,
    commentsEnabled,
    commentsLabel: commentsEnabled ? compactCount(model.commentsCount) : "0",
    downloadCredits,
    downloadCreditsLabel: formatCredits(downloadCredits),
    favoritesLabel: compactCount(model.favoritesCount),
    formatsLabel: getFormatLabel(model),
    id: Number(model.id),
    inputPreviewSrc: previewURL,
    isOwnedByCurrentUser,
    likesLabel: compactCount(model.likesCount),
    previewImages: [previewURL],
    printReady: model.printReady === true,
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
