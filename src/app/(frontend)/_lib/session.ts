import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getCachedPayload } from "@/lib/getCachedPayload";
import { resolvePayloadUserFromHeaders } from "@/lib/payloadAuthFallback";

async function getPayloadWithUser() {
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
}

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
  const { payload, user } = await getPayloadWithUser();
  if (!user) return null;

  const [userDoc, creditAccount] = await Promise.all([
    payload.findByID({
      collection: "users",
      depth: 1,
      id: user.id,
      overrideAccess: false,
      user,
    }),
    payload.find({
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
    }),
  ]);

  const actualCredits = Number(
    creditAccount.docs?.[0]?.balance ?? userDoc.creditsBalance ?? 0,
  );
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
  const { payload, user } = await getPayloadWithUser();
  if (!user) return null;

  const [userDoc, frameStyles] = await Promise.all([
    payload.findByID({
      collection: "users",
      depth: 1,
      id: user.id,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: "avatar-frame-styles",
      depth: 1,
      limit: 20,
      overrideAccess: false,
      pagination: false,
      sort: ["sortOrder", "key"],
      user,
    }),
  ]);

  return {
    avatarFrame:
      typeof userDoc.avatarFrame === "string" ? userDoc.avatarFrame : "none",
    avatarFrameStyles: frameStyles.docs
      .map((style) => ({
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

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getCurrentUserTasks() {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return { docs: [] };

  return payload.find({
    collection: "generation-tasks",
    depth: 1,
    limit: 20,
    overrideAccess: false,
    sort: "-updatedAt",
    user,
  });
}

export async function getCurrentUserModels() {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return { docs: [] };

  return payload.find({
    collection: "models",
    depth: 1,
    limit: 20,
    overrideAccess: false,
    sort: "-updatedAt",
    user,
  });
}

export async function getCurrentUserOrders() {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return { docs: [] };

  return payload.find({
    collection: "print-orders",
    depth: 1,
    limit: 20,
    overrideAccess: false,
    sort: "-updatedAt",
    user,
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
  const { payload, user } = await getPayloadWithUser();
  if (!user) return null;

  const json = await payload.find({
    collection: "credits",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    sort: "-updatedAt",
    user,
  });

  return json.docs?.[0] ?? null;
}

export async function getCurrentUserCreditTransactions() {
  const { payload, user } = await getPayloadWithUser();
  if (!user) return { docs: [] };

  return payload.find({
    collection: "credit-transactions",
    depth: 1,
    limit: 20,
    overrideAccess: false,
    sort: "-createdAt",
    user,
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
