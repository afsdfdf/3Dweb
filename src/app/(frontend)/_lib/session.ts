import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCachedPayload } from "@/lib/getCachedPayload";
import { resolvePayloadUserFromHeaders } from "@/lib/payloadAuthFallback";

const getPayloadWithUser = cache(async () => {
  noStore();
  const payload = await getCachedPayload();
  const requestHeaders = await headers();
  const user =
    (await resolvePayloadUserFromHeaders({
      headers: new Headers(requestHeaders),
      payload,
    })) ?? null;

  return {
    payload,
    user,
  };
});

type CurrentUserListOptions = {
  limit?: number;
};

const defaultCurrentUserListLimit = 20;

const getCurrentUserDocument = cache(async () => {
  const { payload, user } = await getPayloadWithUser();
  if (!user) {
    return {
      payload,
      user: null,
      userDoc: null,
    };
  }

  const userDoc = await payload.findByID({
    collection: "users",
    depth: 1,
    id: user.id,
    overrideAccess: false,
    user,
  });

  return {
    payload,
    user,
    userDoc,
  };
});

const getCurrentCreditAccountDocument = cache(async () => {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return null;

  const json = await payload.find({
    collection: "credits",
    depth: 0,
    limit: 1,
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
          status: {
            equals: "active",
          },
        },
      ],
    },
  });

  return json.docs?.[0] ?? null;
});

function getMediaUrl(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const thumbnailURL =
    typeof record.thumbnailURL === "string" && record.thumbnailURL
      ? record.thumbnailURL
      : null;
  const url = typeof record.url === "string" && record.url ? record.url : null;
  return thumbnailURL || url;
}

export async function getCurrentUser() {
  const { user } = await getPayloadWithUser();
  return user ?? null;
}

export async function getCurrentNavUser() {
  const { userDoc } = await getCurrentUserDocument();
  if (!userDoc) return null;

  const creditAccount = await getCurrentCreditAccountDocument();
  const actualCredits = Number(creditAccount?.balance ?? userDoc.creditsBalance ?? 0);
  const displayName =
    (typeof userDoc.displayName === "string" && userDoc.displayName.trim()) ||
    (typeof userDoc.fullName === "string" && userDoc.fullName.trim()) ||
    (typeof userDoc.email === "string" && userDoc.email.trim()) ||
    "Account";

  return {
    avatarUrl: getMediaUrl(userDoc.avatar),
    creditsBalance: actualCredits,
    displayName,
    email: typeof userDoc.email === "string" ? userDoc.email : null,
    id: Number(userDoc.id),
    role: typeof userDoc.role === "string" ? userDoc.role : "customer",
  };
}

export async function getCurrentAccountProfileSummary() {
  const { payload, user, userDoc } = await getCurrentUserDocument();
  if (!user || !userDoc) return null;

  const frameStyles = await payload.find({
    collection: "avatar-frame-styles",
    depth: 1,
    limit: 20,
    overrideAccess: false,
    pagination: false,
    sort: ["sortOrder", "key"],
    user,
  });

  return {
    avatarFrame:
      typeof userDoc.avatarFrame === "string" ? userDoc.avatarFrame : "none",
    avatarFrameStyles: frameStyles.docs
      .map((style) => ({
        frameImageUrl: getMediaUrl(style.frameImage),
        key: String(style.key || ""),
        thumbnailUrl: getMediaUrl(style.thumbnail),
        title: String(style.title || style.key || ""),
      }))
      .filter((style) => style.key && style.title),
    bio: typeof userDoc.bio === "string" ? userDoc.bio : null,
    backgroundUrl: getMediaUrl(userDoc.profileBackground),
    fullName: typeof userDoc.fullName === "string" ? userDoc.fullName : null,
    phone: typeof userDoc.phone === "string" ? userDoc.phone : null,
    profileVisibility:
      userDoc.profileVisibility === "public" ? "public" : "private",
  };
}

export async function requireUser(redirectTo = "/account") {
  const user = await getCurrentUser();
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/account";
  if (!user) redirect(`/login?redirect=${encodeURIComponent(safeRedirect)}`);
  return user;
}

export async function getCurrentUserTasks(options: CurrentUserListOptions = {}) {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return { docs: [] };

  const limit = options.limit ?? defaultCurrentUserListLimit;

  return payload.find({
    collection: "generation-tasks",
    depth: 1,
    limit,
    overrideAccess: false,
    sort: "-updatedAt",
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  });
}

export async function getCurrentUserModels(options: CurrentUserListOptions = {}) {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return { docs: [] };

  const limit = options.limit ?? defaultCurrentUserListLimit;

  return payload.find({
    collection: "models",
    depth: 1,
    limit,
    overrideAccess: false,
    sort: "-updatedAt",
    user,
    where: {
      owner: {
        equals: user.id,
      },
    },
  });
}

export async function getCurrentUserOrders(options: CurrentUserListOptions = {}) {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return { docs: [] };

  const limit = options.limit ?? defaultCurrentUserListLimit;

  return payload.find({
    collection: "print-orders",
    depth: 1,
    limit,
    overrideAccess: false,
    sort: "-updatedAt",
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  });
}

export async function getCurrentUserOrderById(id: string | number) {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return null;

  try {
    return await payload.findByID({
      collection: "print-orders",
      depth: 2,
      id,
      overrideAccess: false,
      user,
    });
  } catch {
    return null;
  }
}

export async function getCurrentUserCreditAccount() {
  return getCurrentCreditAccountDocument();
}

export async function getCurrentUserCreditTransactions(
  options: CurrentUserListOptions = {},
) {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return { docs: [] };

  const limit = options.limit ?? defaultCurrentUserListLimit;

  return payload.find({
    collection: "credit-transactions",
    depth: 1,
    limit,
    overrideAccess: false,
    sort: "-createdAt",
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  });
}

export async function getCurrentUserSubscriptions() {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return { docs: [] };

  return payload.find({
    collection: "billing-subscriptions",
    depth: 0,
    limit: 10,
    overrideAccess: false,
    sort: "-updatedAt",
    user,
  });
}

export async function getCurrentUserActiveSubscription() {
  const subscriptions = await getCurrentUserSubscriptions();

  return (
    subscriptions.docs.find((item) =>
      ["active", "trialing", "past_due", "incomplete"].includes(
        String(item.status),
      ),
    ) ??
    subscriptions.docs[0] ??
    null
  );
}
