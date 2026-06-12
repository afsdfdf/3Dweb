import {
  AccountCenter,
  type AccountCenterData,
  type AccountSection,
} from "@/components/account/account-center";
import type { GenerationTask, Model, PrintOrder } from "@/payload-types";
import { getCreditTopupProducts } from "@/lib/getCreditTopupProducts";

import {
  getCurrentAccountProfileSummary,
  getCurrentNavUser,
  getCurrentUserCreditAccount,
  getCurrentUserCreditTransactions,
  getCurrentUserModels,
  getCurrentUserOrders,
  getCurrentUserTasks,
  requireUser,
} from "../_lib/session";
import { getMarketingSiteSettings } from "../_lib/marketing";
import { formatTaskGenerationType } from "../_lib/ui-text";

const transactionTypeLabels: Record<string, string> = {
  download_spend: "Model Download",
  manual_adjustment: "Adjustment",
  purchase: "Recharge",
  refund: "Refund",
  subscription_grant: "Subscription",
  task_hold: "Task Hold",
  task_spend: "Model Generate",
};

const formatNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

const formatSignedNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "0";

  const formatted = formatNumber(Math.abs(number));
  return number > 0 ? `+${formatted}` : number < 0 ? `-${formatted}` : "0";
};

const formatDate = (value: unknown) => {
  if (typeof value !== "string") return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
};

const getRelationTitle = (value: unknown, fallback: string) => {
  if (value && typeof value === "object" && "title" in value) {
    const title = (value as { title?: unknown }).title;
    return typeof title === "string" && title.trim() ? title : fallback;
  }

  return fallback;
};

const normalizeModelVisibility = (value: unknown) => {
  return value === "public" ? "public" : "private";
};

const formatModelVisibility = (value: unknown) => {
  return normalizeModelVisibility(value) === "public" ? "Public" : "Hidden";
};

const accountSections = [
  "profile",
  "points-history",
  "orders",
  "models",
  "tasks",
] as const;
const accountRecordLimit = 200;
const accountSummaryLimit = 1;
const accountBillingSelect: Record<string, true> = {
  amount: true,
  balanceAfter: true,
  createdAt: true,
  id: true,
  referenceCode: true,
  type: true,
};

function getInitialSection(value?: null | string): AccountSection {
  if (value === "billing") return "points-history";
  if (value === "settings" || value === "overview") return "profile";
  return accountSections.includes(value as AccountSection)
    ? (value as AccountSection)
    : "profile";
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  await requireUser("/account");
  const query = await searchParams;
  const activeSection = getInitialSection(query.section);
  const billingLimit =
    activeSection === "points-history"
      ? accountRecordLimit
      : accountSummaryLimit;

  const [
    navUser,
    accountProfile,
    creditAccount,
    creditTransactions,
    tasks,
    models,
    orders,
    siteSettings,
    creditTopupProducts,
  ] = await Promise.all([
    getCurrentNavUser(),
    getCurrentAccountProfileSummary(),
    getCurrentUserCreditAccount(),
    getCurrentUserCreditTransactions({
      depth: 0,
      limit: billingLimit,
      select: accountBillingSelect,
    }),
    getCurrentUserTasks({ limit: accountRecordLimit }),
    getCurrentUserModels({ limit: accountRecordLimit }),
    getCurrentUserOrders({ limit: accountRecordLimit }),
    getMarketingSiteSettings(),
    getCreditTopupProducts(),
  ]);

  const activeTasks = tasks.docs.filter((task: GenerationTask) =>
    ["queued", "processing"].includes(String(task.status)),
  ).length;
  const activeOrders = orders.docs.filter((order: PrintOrder) =>
    ["paid", "in-production", "shipped"].includes(String(order.status)),
  ).length;

  const accountData: AccountCenterData = {
    avatarUrl: navUser?.avatarUrl ?? null,
    avatarFrame: accountProfile?.avatarFrame ?? "none",
    avatarFrameStyles: accountProfile?.avatarFrameStyles ?? [],
    backgroundUrl: accountProfile?.backgroundUrl ?? null,
    bio: accountProfile?.bio ?? null,
    creditsBalance: Number(
      creditAccount?.balance ?? navUser?.creditsBalance ?? 0,
    ),
    displayName: navUser?.displayName ?? null,
    email: navUser?.email ?? null,
    fullName: accountProfile?.fullName ?? null,
    metrics: {
      activeOrders,
      activeTasks,
      billingCount:
        "totalDocs" in creditTransactions
          ? creditTransactions.totalDocs
          : creditTransactions.docs.length,
      modelCount: "totalDocs" in models ? models.totalDocs : models.docs.length,
      orderCount: "totalDocs" in orders ? orders.totalDocs : orders.docs.length,
      taskCount: "totalDocs" in tasks ? tasks.totalDocs : tasks.docs.length,
    },
    phone: accountProfile?.phone ?? null,
    profileVisibility:
      accountProfile?.profileVisibility === "public" ? "public" : "private",
    rows: {
      billing: creditTransactions.docs.map((transaction, index) => ({
        amount: formatSignedNumber(transaction.amount),
        id: String(transaction.referenceCode || transaction.id || index + 1),
        item: String(
          transaction.referenceCode || transaction.type || "Credit transaction",
        ),
        status:
          transaction.balanceAfter === null ||
          transaction.balanceAfter === undefined
            ? "Posted"
            : `Balance ${formatNumber(transaction.balanceAfter)}`,
        time: formatDate(transaction.createdAt),
        type:
          transactionTypeLabels[String(transaction.type)] ??
          String(transaction.type || "Transaction"),
      })),
      models: models.docs.map((model: Model) => ({
        actionLabel: "OPEN",
        amount: "-",
        href: `/model-detail?id=${encodeURIComponent(String(model.id))}`,
        id: String(model.id),
        item: String(model.title || `Model ${model.id}`),
        status: String(model.status || model.visibility || "Ready"),
        time: formatDate(model.updatedAt || model.createdAt),
        type: formatModelVisibility(model.visibility),
        visibility: normalizeModelVisibility(model.visibility),
      })),
      orders: orders.docs.map((order: PrintOrder) => ({
        actionLabel: order.shopifyCheckoutUrl ? "PAY" : undefined,
        amount:
          order.amount === null || order.amount === undefined
            ? "-"
            : `$${formatNumber(order.amount)}`,
        href: order.shopifyCheckoutUrl || undefined,
        id: String(order.orderNumber || order.id),
        item: getRelationTitle(order.model, `Order ${order.id}`),
        status: String(order.status || "Pending"),
        time: formatDate(order.updatedAt || order.createdAt),
        type: "Print order",
      })),
      tasks: tasks.docs.map((task: GenerationTask) => ({
        actionLabel: task.taskCode ? "RESULT" : undefined,
        amount:
          task.creditsSpent === null || task.creditsSpent === undefined
            ? "0"
            : `-${formatNumber(task.creditsSpent)}`,
        href: task.taskCode
          ? `/results/${encodeURIComponent(String(task.taskCode))}`
          : undefined,
        id: String(task.taskCode || task.id),
        item: String(task.prompt || task.taskCode || `Task ${task.id}`),
        status: String(task.status || "Queued"),
        time: formatDate(task.updatedAt || task.createdAt),
        type: formatTaskGenerationType({
          inputMode: task.inputMode,
          taskType: task.taskType,
        }),
      })),
    },
  };

  return (
    <AccountCenter
      accountData={accountData}
      creditTopupProducts={creditTopupProducts}
      initialSection={activeSection}
      navigationItems={siteSettings.headerNav}
      navigationPromotion={siteSettings.navigationPromotion}
      navUser={navUser}
    />
  );
}
