import {
  PersonalCenterTest,
  type PersonalCenterData,
} from "@/components/ui-lab/personal-center-test";
import type { GenerationTask, Model, PrintOrder } from "@/payload-types";

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

const transactionTypeLabels: Record<string, string> = {
  download_spend: "Download",
  manual_adjustment: "Adjustment",
  purchase: "Purchase",
  refund: "Refund",
  subscription_grant: "Subscription",
  task_hold: "Task Hold",
  task_spend: "Generation",
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

  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

const getRelationTitle = (value: unknown, fallback: string) => {
  if (value && typeof value === "object" && "title" in value) {
    const title = (value as { title?: unknown }).title;
    return typeof title === "string" && title.trim() ? title : fallback;
  }

  return fallback;
};

export default async function AccountPage() {
  await requireUser();

  const [
    navUser,
    accountProfile,
    creditAccount,
    creditTransactions,
    tasks,
    models,
    orders,
  ] = await Promise.all([
    getCurrentNavUser(),
    getCurrentAccountProfileSummary(),
    getCurrentUserCreditAccount(),
    getCurrentUserCreditTransactions(),
    getCurrentUserTasks(),
    getCurrentUserModels(),
    getCurrentUserOrders(),
  ]);

  const activeTasks = tasks.docs.filter((task: GenerationTask) =>
    ["queued", "processing"].includes(String(task.status)),
  ).length;
  const activeOrders = orders.docs.filter((order: PrintOrder) =>
    ["paid", "in-production", "shipped"].includes(String(order.status)),
  ).length;

  const accountData: PersonalCenterData = {
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
      modelCount: "totalDocs" in models ? models.totalDocs : models.docs.length,
      orderCount: "totalDocs" in orders ? orders.totalDocs : orders.docs.length,
      taskCount: "totalDocs" in tasks ? tasks.totalDocs : tasks.docs.length,
    },
    phone: accountProfile?.phone ?? null,
    profileVisibility:
      accountProfile?.profileVisibility === "public" ? "public" : "private",
    rows: {
      billing: creditTransactions.docs
        .slice(0, 10)
        .map((transaction, index) => ({
          amount: formatSignedNumber(transaction.amount),
          id: String(transaction.referenceCode || transaction.id || index + 1),
          item: String(
            transaction.referenceCode ||
              transaction.type ||
              "Credit transaction",
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
      models: models.docs.slice(0, 10).map((model: Model) => ({
        amount: "-",
        id: String(model.id),
        item: String(model.title || `Model ${model.id}`),
        status: String(model.status || model.visibility || "Ready"),
        time: formatDate(model.updatedAt || model.createdAt),
        type: String(model.visibility || "Model"),
      })),
      orders: orders.docs.slice(0, 10).map((order: PrintOrder) => ({
        amount:
          order.amount === null || order.amount === undefined
            ? "-"
            : `$${formatNumber(order.amount)}`,
        id: String(order.orderNumber || order.id),
        item: getRelationTitle(order.model, `Order ${order.id}`),
        status: String(order.status || "Pending"),
        time: formatDate(order.updatedAt || order.createdAt),
        type: "Print order",
      })),
      tasks: tasks.docs.slice(0, 10).map((task: GenerationTask) => ({
        amount:
          task.creditsSpent === null || task.creditsSpent === undefined
            ? "0"
            : `-${formatNumber(task.creditsSpent)}`,
        id: String(task.taskCode || task.id),
        item: String(task.prompt || task.taskCode || `Task ${task.id}`),
        status: String(task.status || "Queued"),
        time: formatDate(task.updatedAt || task.createdAt),
        type: String(task.inputMode || "Generation"),
      })),
    },
  };

  return <PersonalCenterTest accountData={accountData} navUser={navUser} />;
}
