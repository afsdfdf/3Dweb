import { PersonalCenter, type PersonalCenterData } from "@/components/ui-lab/personal-center-legacy";

import { getCurrentNavUser } from "../_lib/session";

const legacyPersonalCenterData: PersonalCenterData = {
  avatarUrl: null,
  backgroundUrl: null,
  creditsBalance: "1,280",
  displayName: "冒险者",
  email: "account@example.com",
  metrics: [
    { label: "模型资产", value: "12", tone: "gold" },
    { label: "进行中任务", value: "4", tone: "green" },
    { label: "积分余额", value: "1,280", tone: "purple" },
    { label: "支付记录", value: "8", tone: "gold" },
  ],
  modelAssets: [
    {
      href: "/dashboard/library",
      id: "model-1",
      imageSrc: "/ui-lab/model-detail-uicut/images/detail-side-banner.png",
      meta: "GLB / 可打印",
      status: "已完成",
      title: "北境守望者",
      visibility: "公开",
    },
    {
      href: "/dashboard/library",
      id: "model-2",
      imageSrc: "/ui-lab/model-detail-uicut/images/face.png",
      meta: "预览待检查",
      status: "处理中",
      title: "熔岩巨像",
      visibility: "私密",
    },
  ],
  paymentItems: [
    {
      amount: "$48.00",
      date: "2026.04.30",
      href: "/dashboard/orders",
      id: "pay-1",
      status: "生产中",
      title: "北境守望者打印件",
    },
    {
      amount: "$16.00",
      date: "2026.04.28",
      href: "/dashboard/orders",
      id: "pay-2",
      status: "已完成",
      title: "模型文件下载",
    },
  ],
  recentActivity: [
    {
      href: "/dashboard",
      id: "activity-1",
      meta: "2026.04.30 10:12",
      status: "生产中",
      title: "北境守望者打印订单",
      type: "订单",
    },
    {
      href: "/dashboard/library",
      id: "activity-2",
      meta: "2026.04.29 18:42",
      status: "已完成",
      title: "龙骑士模型生成",
      type: "任务",
    },
  ],
  transactions: [
    { amount: "-120", balance: "1,280", date: "2026.04.29", id: "tx-1", label: "生成消耗" },
    { amount: "+500", balance: "1,400", date: "2026.04.27", id: "tx-2", label: "积分补充包" },
    { amount: "-36", balance: "900", date: "2026.04.25", id: "tx-3", label: "模型下载" },
  ],
};

export default async function PersonalCenterLegacyPage() {
  const navUser = await getCurrentNavUser();

  return <PersonalCenter data={legacyPersonalCenterData} navUser={navUser} />;
}
