import type { Payload, Where } from "payload";

import { getCurrentUser } from "@/app/(frontend)/_lib/session";
import { getCachedPayload } from "@/lib/getCachedPayload";
import { getMediaAccessURL } from "@/lib/mediaAccessURL";
import { getModelPreviewURL } from "@/lib/modelAssetURL";

import type { FollowCreatorCardData } from "./follow-creator-card";

type ImageLike = {
  thumbnailURL?: null | string;
  url?: null | string;
};

type UserLike = {
  avatar?: null | number | ImageLike;
  displayName?: null | string;
  email?: null | string;
  followersCount?: null | number;
  fullName?: null | string;
  id?: number | string;
  profileVisibility?: null | string;
};

type ModelLike = {
  id?: number | string;
  owner?: unknown;
  previewImage?: null | number | ImageLike;
  sourceTask?: unknown;
  title?: null | string;
};

type FollowLike = {
  followee?: null | number | string | UserLike;
};

const fallbackAvatarSrc = "/ui-lab/top-navigation/icon-user-avatar-placeholder.png";

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
  if (isRecord(value)) return getRelationId(value.id);
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

async function resolveMediaAccessURL(payload: Payload, url: null | string | undefined) {
  const normalized = normalizeBrowserMediaURL(url);
  if (!normalized) return null;
  if (normalized.startsWith("/")) return normalized;

  return normalizeBrowserMediaURL(await getMediaAccessURL({ payload, url: normalized }));
}

const compactCount = (value: unknown, fallback = "0") => {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count) || count <= 0) return fallback;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
};

const getOwnerName = (owner: UserLike) => {
  return (
    normalizeText(owner.displayName) ||
    normalizeText(owner.fullName) ||
    normalizeText(owner.email)?.split("@")[0] ||
    (owner.id ? `Creator ${owner.id}` : "Creator")
  );
};

async function resolveUser(payload: Payload, value: unknown) {
  const ownerId = getRelationId(value);
  if (!ownerId) return null;

  const embedded = isRecord(value) ? (value as UserLike) : null;
  if (embedded?.profileVisibility !== undefined) return embedded;

  try {
    return (await payload.findByID({
      collection: "users",
      depth: 1,
      id: ownerId,
      overrideAccess: true,
      select: {
        avatar: true,
        displayName: true,
        email: true,
        followersCount: true,
        fullName: true,
        profileVisibility: true,
      },
    })) as UserLike;
  } catch {
    return null;
  }
}

async function getFollowedCreator(payload: Payload) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const result = await payload.find({
    collection: "user-follows",
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    sort: "-createdAt",
    user: currentUser,
    where: {
      follower: {
        equals: currentUser.id,
      },
    },
  });

  const follow = result.docs[0] as FollowLike | undefined;
  return resolveUser(payload, follow?.followee);
}

async function getPublicCreator(payload: Payload) {
  const result = await payload.find({
    collection: "users",
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    select: {
      avatar: true,
      displayName: true,
      email: true,
      followersCount: true,
      fullName: true,
      profileVisibility: true,
    },
    sort: "-followersCount",
    where: {
      profileVisibility: {
        equals: "public",
      },
    },
  });

  return (result.docs[0] as UserLike | undefined) ?? null;
}

async function getCreatorFromPublicModel(payload: Payload) {
  const result = await payload.find({
    collection: "models",
    depth: 2,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: {
      owner: true,
    },
    sort: "-updatedAt",
    where: {
      visibility: {
        equals: "public",
      },
    },
  });

  const model = result.docs[0] as ModelLike | undefined;
  return resolveUser(payload, model?.owner);
}

async function getCreatorModels(payload: Payload, ownerId: number) {
  const where: Where = {
    and: [
      {
        owner: {
          equals: ownerId,
        },
      },
      {
        visibility: {
          equals: "public",
        },
      },
    ],
  };

  const [models, count] = await Promise.all([
    payload.find({
      collection: "models",
      depth: 2,
      limit: 6,
      overrideAccess: false,
      pagination: false,
      select: {
        id: true,
        previewImage: true,
        sourceTask: true,
        title: true,
      },
      sort: "-updatedAt",
      where,
    }),
    payload.count({
      collection: "models",
      overrideAccess: false,
      where,
    }),
  ]);

  const items = (
    await Promise.all(
      (models.docs as ModelLike[]).map(async (model) => {
        const imageSrc = await resolveMediaAccessURL(payload, getModelPreviewURL(model));
        if (!imageSrc) return null;

        const title = normalizeText(model.title) || `Model ${model.id}`;
        return {
          alt: `${title} thumbnail`,
          id: String(model.id ?? title),
          imageSrc,
        };
      }),
    )
  )
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);

  return {
    items,
    modelCount: count.totalDocs,
  };
}

async function getCreatorCardDataForUser(payload: Payload, owner: UserLike): Promise<FollowCreatorCardData | null> {
  const ownerId = getRelationId(owner);
  if (!ownerId) return null;

  const [avatarSrc, modelData] = await Promise.all([
    resolveMediaAccessURL(payload, getImageURL(owner.avatar)),
    getCreatorModels(payload, ownerId),
  ]);
  const name = getOwnerName(owner);

  return {
    avatarAlt: `${name} avatar`,
    avatarSrc: avatarSrc || fallbackAvatarSrc,
    followerCount: compactCount(owner.followersCount),
    items: modelData.items,
    modelCount: compactCount(modelData.modelCount),
    name,
  };
}

export async function getFollowCreatorCardDataForOwner(
  payload: Payload,
  owner: unknown,
): Promise<FollowCreatorCardData | null> {
  const resolvedOwner = await resolveUser(payload, owner);
  if (!resolvedOwner) return null;

  return getCreatorCardDataForUser(payload, resolvedOwner);
}

export async function getFollowCreatorCardData(): Promise<FollowCreatorCardData | null> {
  try {
    const payload = await getCachedPayload();
    const owner =
      (await getFollowedCreator(payload)) ||
      (await getPublicCreator(payload)) ||
      (await getCreatorFromPublicModel(payload));

    if (!owner) return null;
    return getFollowCreatorCardDataForOwner(payload, owner);
  } catch {
    return null;
  }
}
