import { AccountTestPage } from "@/components/ui-lab/account-page/account-page";
import {
  getCurrentNavUser,
  getCurrentUserCreditAccount,
  getCurrentUserCreditTransactions,
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
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
};

export default async function AccountPage() {
  const [navUser, creditAccount, creditTransactions] = await Promise.all([
    getCurrentNavUser(),
    getCurrentUserCreditAccount(),
    getCurrentUserCreditTransactions(),
  ]);

  const accountData = {
    avatarUrl: navUser?.avatarUrl ?? null,
    creditsBalance: Number(creditAccount?.balance ?? navUser?.creditsBalance ?? 0),
    displayName: navUser?.displayName ?? "Account",
    email: navUser?.email ?? "",
    rows: creditTransactions.docs.slice(0, 10).map((transaction, index) => ({
      balanceAfter: transaction.balanceAfter === null || transaction.balanceAfter === undefined
        ? "-"
        : formatNumber(transaction.balanceAfter),
      date: formatDate(transaction.createdAt),
      id: Number(transaction.id ?? index + 1),
      item: transaction.referenceCode || "-",
      operation: transactionTypeLabels[String(transaction.type)] ?? String(transaction.type || "Transaction"),
      points: formatSignedNumber(transaction.amount),
    })),
  };

  return <AccountTestPage accountData={accountData} navUser={navUser} />;
}
