import { getCachedPayload } from "@/lib/getCachedPayload";
import { buildModelViewerURL, getModelPreviewURL } from "@/lib/modelAssetURL";
import { getMediaAccessURL } from "@/lib/mediaAccessURL";
import { isGuestReadableMedia } from "@/lib/mediaVisibility";
import type { Where } from "payload";
import type { getCurrentUser } from "../../_lib/session";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

type ImageLike = {
  publicAccess?: null | boolean;
  purpose?: null | string;
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
  profileBackground?:
    | null
    | number
    | (ImageLike & { publicAccess?: null | boolean; purpose?: null | string });
  profileBannerFocalX?: null | number;
  profileBannerFocalY?: null | number;
  profileVisibility?: null | string;
  profileViewCount?: null | number;
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
  viewerOptimization?: null | {
    status?: null | string;
  };
  visibility?: null | string;
};

type ModelDetailOptimizationStatus = "failed" | "none" | "pending" | "running" | "skipped" | "succeeded";

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

export type ModelDetailSideModelsPagination = {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  page: number;
  totalDocs: number;
  totalPages: number;
};

export type ModelDetailSideModelsPage = ModelDetailSideModelsPagination & {
  docs: ModelDetailSideModel[];
};

export type ModelDetailData = {
  ageLabel: string;
  authorAvatarSrc: null | string;
  authorDescription: string;
  authorName: string;
  authorModelCount: number;
  authorModelCountLabel: string;
  authorProfileBannerFocalX: number;
  authorProfileBannerFocalY: number;
  authorProfileBannerSrc: null | string;
  authorProfileViewCount: number;
  authorProfileViewCountLabel: string;
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
  favoritesCount: number;
  likesLabel: string;
  likesCount: number;
  previewImages: string[];
  printReady: boolean;
  printReadyLabel: string;
  sideModels: ModelDetailSideModel[];
  sideModelsPage: ModelDetailSideModelsPagination;
  tags: string[];
  title: string;
  topologyLabel: string;
  updatedLabel: string;
  vertexLabel: string;
  viewCount: number;
  viewLabel: string;
  viewerURL: null | string;
  viewerOptimizationStatus: ModelDetailOptimizationStatus;
  visibilityLabel: string;
};

const sideModelLimit = 12;
const detailCacheTTLMS = 60_000;
const modelDetailDataCacheTTLMS = 120_000;
const sideModelsCacheTTLMS = 60_000;
const detailCacheMaxEntries = 128;

type TimedCacheEntry<T> =
  | {
      expiresAt: number;
      promise: Promise<T>;
      state: "pending";
    }
  | {
      expiresAt: number;
      state: "ready";
      value: T;
    };

type ModelDetailCacheStore = {
  downloadPolicy: Map<string, TimedCacheEntry<DownloadPolicy>>;
  modelDetailData: Map<string, TimedCacheEntry<ModelDetailData | null>>;
  ownerModelCount: Map<string, TimedCacheEntry<number>>;
  ownerProfile: Map<string, TimedCacheEntry<OwnerLike | null>>;
  sideModels: Map<string, TimedCacheEntry<ModelDetailSideModelsPage>>;
};

const modelDetailCacheGlobal = globalThis as typeof globalThis & {
  __thornstavernModelDetailCache?: ModelDetailCacheStore;
};

const modelDetailCacheStore =
  modelDetailCacheGlobal.__thornstavernModelDetailCache ??
  (modelDetailCacheGlobal.__thornstavernModelDetailCache = {
    downloadPolicy: new Map<string, TimedCacheEntry<DownloadPolicy>>(),
    modelDetailData: new Map<string, TimedCacheEntry<ModelDetailData | null>>(),
    ownerModelCount: new Map<string, TimedCacheEntry<number>>(),
    ownerProfile: new Map<string, TimedCacheEntry<OwnerLike | null>>(),
    sideModels: new Map<string, TimedCacheEntry<ModelDetailSideModelsPage>>(),
  });

const downloadPolicyCache = modelDetailCacheStore.downloadPolicy;
const modelDetailDataCache = modelDetailCacheStore.modelDetailData;
const ownerProfileCache = modelDetailCacheStore.ownerProfile;
const ownerModelCountCache = modelDetailCacheStore.ownerModelCount;
const sideModelsCache = modelDetailCacheStore.sideModels;

const normalizePositiveInteger = (
  value: null | number | string | undefined,
  fallback: number,
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const normalizeSideModelLimit = (
  value: null | number | string | undefined,
) => {
  return Math.min(24, Math.max(6, normalizePositiveInteger(value, sideModelLimit)));
};

const pruneTimedCache = <T>(cache: Map<string, TimedCacheEntry<T>>) => {
  if (cache.size <= detailCacheMaxEntries) return;

  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }

  if (cache.size <= detailCacheMaxEntries) return;

  const overflow = cache.size - detailCacheMaxEntries;
  let removed = 0;
  for (const key of cache.keys()) {
    cache.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
};

const getCachedAsync = async <T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
  ttlMS: number,
  loader: () => Promise<T>,
): Promise<T> => {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    if (cached.state === "ready") return cached.value;
    return cached.promise;
  }

  const promise = loader().then(
    (value) => {
      cache.set(key, {
        expiresAt: Date.now() + ttlMS,
        state: "ready",
        value,
      });
      pruneTimedCache(cache);
      return value;
    },
    (error) => {
      cache.delete(key);
      throw error;
    },
  );

  cache.set(key, {
    expiresAt: now + ttlMS,
    promise,
    state: "pending",
  });
  pruneTimedCache(cache);
  return promise;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const normalizeText = (value: unknown) => {
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const normalizeModelDetailOptimizationStatus = (value: unknown): ModelDetailOptimizationStatus => {
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

export async function getModelDetailSideModelsPage(args: {
  currentUser?: CurrentUser | null;
  id?: null | number | string;
  limit?: null | number | string;
  page?: null | number | string;
}): Promise<ModelDetailSideModelsPage | null> {
  const modelId = Number(args.id);
  if (!Number.isFinite(modelId) || modelId <= 0) return null;

  const payload = await getCachedPayload();
  const currentUser = args.currentUser ?? null;
  const result = await payload.find({
    collection: "models",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: {
      id: true,
      owner: true,
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

  const policy = await getDownloadPolicy(payload);
  return getSideModels(
    payload,
    getRelationId(model.owner),
    policy,
    normalizePositiveInteger(args.page, 1),
    normalizeSideModelLimit(args.limit),
  );
}

async function resolveModelPreviewAccessURL(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  model: ModelLike,
) {
  const previewImage = isRecord(model.previewImage) ? model.previewImage : null;
  const directPreviewURL = previewImage ? getImageURL(previewImage) : null;

  if (
    directPreviewURL &&
    isGuestReadableMedia(
      previewImage as Parameters<typeof isGuestReadableMedia>[0],
    )
  ) {
    return normalizeBrowserMediaURL(directPreviewURL);
  }

  return resolveMediaAccessURL(payload, getModelPreviewURL(model));
}

const compactCount = (value: unknown, fallback = "0") => {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count) || count <= 0) return fallback;
  if (count >= 1000)
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
};

const normalizeCount = (value: unknown) => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
};

const readPositiveNumber = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return numeric;
};

const formatCredits = (value: number) => value.toFixed(2);

async function readDownloadPolicy(
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

async function getDownloadPolicy(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
): Promise<DownloadPolicy> {
  return getCachedAsync(
    downloadPolicyCache,
    "site-settings:modelAccessPolicy",
    detailCacheTTLMS,
    () => readDownloadPolicy(payload),
  );
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
  const email = normalizeText(owner.email);
  const ownerId = getRelationId(owner.id);

  return (
    displayName ||
    fullName ||
    email?.split("@")[0] ||
    (ownerId ? `Creator ${ownerId}` : "Creator")
  );
};

const isStaffUser = (user: CurrentUser | null | undefined) => {
  return ["admin", "operator"].includes(String(user?.role || "customer"));
};

const getOwnerAvatarURL = async (
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  owner: null | OwnerLike | undefined,
  allowPrivateProfileMedia: boolean,
) => {
  const avatar = owner?.avatar;
  if (!isRecord(avatar)) return null;

  const imageURL = getImageURL(avatar);
  if (!imageURL) return null;

  if (isGuestReadableMedia(avatar)) {
    return normalizeBrowserMediaURL(imageURL);
  }

  if (!allowPrivateProfileMedia) return null;

  return resolveMediaAccessURL(payload, imageURL);
};

const getOwnerProfileBannerAccessURL = async (
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  owner: null | OwnerLike | undefined,
  allowPrivateProfileMedia: boolean,
) => {
  const banner = owner?.profileBackground;
  if (!isRecord(banner)) return null;
  const imageURL = getImageURL(banner);
  if (!imageURL) return null;
  if (isGuestReadableMedia(banner)) return normalizeBrowserMediaURL(imageURL);
  if (!allowPrivateProfileMedia) return null;

  return resolveMediaAccessURL(payload, imageURL);
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

  return getCachedAsync(
    ownerProfileCache,
    String(ownerId),
    detailCacheTTLMS,
    async () => {
      try {
        const resolvedOwner = (await payload.findByID({
          collection: "users",
          depth: 1,
          id: ownerId,
          overrideAccess: true,
        })) as OwnerLike;

        return resolvedOwner;
      } catch {
        return null;
      }
    },
  );
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

function getModelCounts(
  model: ModelLike,
  commentsEnabled: boolean,
) {
  return {
    commentsCount: commentsEnabled ? normalizeCount(model.commentsCount) : 0,
    favoritesCount: normalizeCount(model.favoritesCount),
    likesCount: normalizeCount(model.likesCount),
    viewCount: normalizeCount(model.viewCount),
  };
}

async function getOwnerModelCount(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  ownerId: null | number,
  includePrivate: boolean,
) {
  if (!ownerId) return 0;

  return getCachedAsync(
    ownerModelCountCache,
    `${ownerId}:${includePrivate ? "all" : "public"}`,
    detailCacheTTLMS,
    async () => {
      const result = await payload.count({
        collection: "models",
        overrideAccess: true,
        where: {
          and: [
            {
              owner: {
                equals: ownerId,
              },
            },
            ...(includePrivate
              ? []
              : [
                  {
                    visibility: {
                      equals: "public",
                    },
                  },
                ]),
          ],
        },
      });

      return result.totalDocs;
    },
  );
}

async function getSideModels(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  ownerId: null | number,
  policy: DownloadPolicy,
  page = 1,
  limit = sideModelLimit,
) {
  const normalizedPage = normalizePositiveInteger(page, 1);
  const normalizedLimit = normalizeSideModelLimit(limit);
  const cacheKey = [
    ownerId ?? "all",
    normalizedPage,
    normalizedLimit,
    policy.chargeDownloadCredits ? "charged" : "free",
    policy.downloadCredits,
  ].join(":");

  return getCachedAsync(
    sideModelsCache,
    cacheKey,
    sideModelsCacheTTLMS,
    () =>
      loadSideModels(
        payload,
        ownerId,
        policy,
        normalizedPage,
        normalizedLimit,
      ),
  );
}

async function loadSideModels(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  ownerId: null | number,
  policy: DownloadPolicy,
  page: number,
  limit: number,
): Promise<ModelDetailSideModelsPage> {
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
    limit,
    overrideAccess: false,
    page,
    pagination: true,
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

  const modelDocs = result.docs as ModelLike[];
  const mappedModels = await Promise.all(
    modelDocs.map(async (item) => {
      const downloadCredits = getDownloadCredits(item, policy);
      const imageSrc = await resolveModelPreviewAccessURL(payload, item);

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

  const docs = mappedModels.filter(
    (item): item is ModelDetailSideModel => Boolean(item),
  );

  return {
    docs,
    hasNextPage: result.hasNextPage ?? page < Number(result.totalPages || 1),
    hasPrevPage: result.hasPrevPage ?? page > 1,
    limit,
    page: Number(result.page || page),
    totalDocs: Number(result.totalDocs || docs.length),
    totalPages: Math.max(1, Number(result.totalPages || 1)),
  };
}

async function loadModelDetailData(args: {
  currentUser?: CurrentUser | null;
  currentUserId?: null | number | string;
  id?: null | number | string;
}): Promise<ModelDetailData | null> {
  const modelId = Number(args.id);
  if (!Number.isFinite(modelId) || modelId <= 0) return null;

  const payload = await getCachedPayload();
  const currentUser = args.currentUser ?? null;
  const policyPromise = getDownloadPolicy(payload);
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
      viewerOptimization: true,
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
  const canViewOptimizationStatus =
    isOwnedByCurrentUser || isStaffUser(currentUser);
  const commentsEnabled = model.visibility === "public";
  const [policy, owner] = await Promise.all([
    policyPromise,
    getPublicOwner(payload, model.owner),
  ]);
  const liveCounts = getModelCounts(model, commentsEnabled);
  const [
    previewURL,
    sideModelsPage,
    authorModelCount,
    authorAvatarSrc,
    authorProfileBannerSrc,
  ] = await Promise.all([
    resolveModelPreviewAccessURL(payload, model),
    getSideModels(payload, ownerId, policy),
    getOwnerModelCount(payload, ownerId, allowPrivateProfileMedia),
    getOwnerAvatarURL(payload, owner, allowPrivateProfileMedia),
    getOwnerProfileBannerAccessURL(
      payload,
      owner,
      allowPrivateProfileMedia,
    ),
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
    authorAvatarSrc,
    authorDescription:
      normalizeText(owner?.bio) ||
      normalizeText(model.description) ||
      (commentsEnabled
        ? "Public creator model available for preview and reference."
        : "Private model available to its owner and staff."),
    authorModelCount,
    authorModelCountLabel: compactCount(authorModelCount),
    authorName: getOwnerName(owner),
    authorProfileBannerFocalX: normalizeFocalPoint(owner?.profileBannerFocalX),
    authorProfileBannerFocalY: normalizeFocalPoint(owner?.profileBannerFocalY),
    authorProfileBannerSrc,
    authorProfileViewCount: normalizeCount(owner?.profileViewCount),
    authorProfileViewCountLabel: compactCount(owner?.profileViewCount),
    chargeDownloadCredits: policy.chargeDownloadCredits,
    commentsCount: commentsEnabled ? liveCounts.commentsCount : 0,
    commentsEnabled,
    commentsLabel: commentsEnabled ? compactCount(liveCounts.commentsCount) : "0",
    downloadCredits,
    downloadCreditsLabel: formatCredits(downloadCredits),
    favoritesCount: liveCounts.favoritesCount,
    favoritesLabel: compactCount(liveCounts.favoritesCount),
    formatsLabel: getFormatLabel(model),
    id: Number(model.id),
    inputPreviewSrc: previewURL,
    isOwnedByCurrentUser,
    likesCount: liveCounts.likesCount,
    likesLabel: compactCount(liveCounts.likesCount),
    previewImages: [previewURL],
    printReady: model.printReady === true,
    printReadyLabel: model.printReady ? "Print Ready" : "Preview Only",
    sideModels: sideModelsPage.docs,
    sideModelsPage: {
      hasNextPage: sideModelsPage.hasNextPage,
      hasPrevPage: sideModelsPage.hasPrevPage,
      limit: sideModelsPage.limit,
      page: sideModelsPage.page,
      totalDocs: sideModelsPage.totalDocs,
      totalPages: sideModelsPage.totalPages,
    },
    tags: getTags(model),
    title,
    topologyLabel: "Triangle",
    updatedLabel: formatDateLabel(model.updatedAt || model.createdAt),
    vertexLabel,
    viewCount: liveCounts.viewCount,
    viewLabel: compactCount(liveCounts.viewCount),
    viewerURL: buildModelViewerURL({ modelId: Number(model.id) }),
    viewerOptimizationStatus: canViewOptimizationStatus ? normalizeModelDetailOptimizationStatus(model.viewerOptimization?.status) : "none",
    visibilityLabel: normalizeText(model.visibility) || "public",
  };
}

export async function getModelDetailData(args: {
  currentUser?: CurrentUser | null;
  currentUserId?: null | number | string;
  id?: null | number | string;
}): Promise<ModelDetailData | null> {
  const modelId = Number(args.id);
  if (!Number.isFinite(modelId) || modelId <= 0) return null;

  const isAnonymousRequest = !args.currentUser && args.currentUserId == null;
  if (!isAnonymousRequest) {
    return loadModelDetailData(args);
  }

  return getCachedAsync(
    modelDetailDataCache,
    String(modelId),
    modelDetailDataCacheTTLMS,
    () =>
      loadModelDetailData({
        currentUser: null,
        currentUserId: null,
        id: modelId,
      }),
  );
}
