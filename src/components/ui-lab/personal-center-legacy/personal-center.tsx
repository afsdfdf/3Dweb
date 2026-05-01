"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";

import { BorderComboFrame2 } from "@/components/ui-lab/border-combo-frame-2";
import { TopNavigation, type TopNavigationUser } from "@/components/ui-lab/top-navigation";
import { publicNavigationItems } from "@/lib/publicNavigation";

import styles from "./personal-center.module.css";

export type PersonalCenterActivity = {
  href: string;
  id: string;
  meta: string;
  status: string;
  title: string;
  type: string;
};

export type PersonalCenterTransaction = {
  amount: string;
  balance: string;
  date: string;
  id: string;
  label: string;
};

export type PersonalCenterPayment = {
  amount: string;
  date: string;
  href: string;
  id: string;
  status: string;
  title: string;
};

export type PersonalCenterModelAsset = {
  href: string;
  id: string;
  imageSrc?: null | string;
  meta: string;
  status: string;
  title: string;
  visibility: string;
};

export type PersonalCenterData = {
  avatarUrl?: null | string;
  backgroundUrl?: null | string;
  creditsBalance: string;
  displayName: string;
  email?: null | string;
  metrics: {
    label: string;
    tone?: "gold" | "green" | "purple";
    value: string;
  }[];
  modelAssets: PersonalCenterModelAsset[];
  paymentItems: PersonalCenterPayment[];
  recentActivity: PersonalCenterActivity[];
  transactions: PersonalCenterTransaction[];
};

type PersonalCenterProps = {
  data: PersonalCenterData;
  navUser?: null | TopNavigationUser;
};

type SectionId = "overview" | "models" | "tasks" | "points" | "payments" | "settings";

export function PersonalCenter({ data, navUser = null }: PersonalCenterProps) {
  const avatarUrl = data.avatarUrl || navUser?.avatarUrl || "/ui-lab/model-detail-uicut/images/face.png";
  const displayName = data.displayName || navUser?.displayName || navUser?.email || "冒险者";
  const email = data.email || navUser?.email || "账号邮箱暂不可用";
  const navDisplayUser: TopNavigationUser = navUser ?? {
    avatarUrl,
    credits: Number(data.creditsBalance.replace(/,/g, "")) || 0,
    displayName,
    email,
  };
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const navItems: { id: SectionId; label: string; value: number | string }[] = [
    { id: "overview", label: "总览", value: "资产" },
    { id: "models", label: "模型资产", value: data.modelAssets.length },
    { id: "tasks", label: "任务列表", value: data.recentActivity.length },
    { id: "points", label: "积分流水", value: data.transactions.length },
    { id: "payments", label: "支付数据", value: data.paymentItems.length },
    { id: "settings", label: "账号设置", value: "资料" },
  ];
  const activeNavItem = navItems.find((item) => item.id === activeSection) ?? navItems[0];
  const hasAvatar = Boolean(data.avatarUrl || navUser?.avatarUrl);
  const profileReadiness = hasAvatar ? "头像已设置" : "头像待设置";
  const assetSummary = [
    {
      action: "查看模型资产",
      count: data.modelAssets.length,
      description: "已生成或保存的模型，包含预览、可见性和就绪状态。",
      id: "models" as const,
      label: "模型资产",
    },
    {
      action: "查看任务列表",
      count: data.recentActivity.length,
      description: "最近生成任务和订单动态，用来判断是否还有进行中的工作。",
      id: "tasks" as const,
      label: "任务与动态",
    },
    {
      action: "核对积分流水",
      count: data.transactions.length,
      description: "积分余额、消耗、发放和退款记录，后续接入真实分页。",
      id: "points" as const,
      label: "积分资产",
    },
    {
      action: "查看支付数据",
      count: data.paymentItems.length,
      description: "订单、支付状态和金额摘要，账务明细后续由接口补全。",
      id: "payments" as const,
      label: "支付与订单",
    },
  ];

  return (
    <main className={styles.pageShell}>
      <div className={styles.stageViewport}>
        <TopNavigation active="ACCOUNT" className={styles.boundTopNavigation} items={publicNavigationItems} user={navDisplayUser} />

        <section aria-label="个人中心" className={styles.stage}>
          <div className={styles.heroBackdrop} aria-hidden="true" />

          <aside className={styles.sideNav}>
            <BorderComboFrame2 aria-hidden="true" className={styles.sideFrame} style={{ width: 430, height: 908 }} />
            <div className={styles.sideContent}>
              <section className={styles.identityCard} aria-label="账号身份">
                <div className={styles.avatarHalo}>
                  <img alt={`${displayName} 的头像`} decoding="async" src={avatarUrl} />
                </div>
                <div>
                  <p className={styles.kicker}>个人中心</p>
                  <h1>{displayName}</h1>
                  <p className={styles.email}>{email}</p>
                </div>
              </section>

              <div className={styles.creditPlate}>
                <img alt="" aria-hidden="true" decoding="async" src="/ui-lab/model-detail-uicut/images/detail-bottom-icon-1.png" />
                <div>
                  <strong>{data.creditsBalance}</strong>
                  <span>可用积分</span>
                </div>
              </div>

              <nav aria-label="个人中心分区" className={styles.sectionNav}>
                {navItems.map((item, index) => (
                  <button
                    className={activeSection === item.id ? styles.activeNavItem : ""}
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.label}</strong>
                    <em>{item.value}</em>
                  </button>
                ))}
              </nav>

              <div className={styles.sideActions}>
                <Link href="/workbench">创建模型</Link>
                <Link href="/dashboard/library">我的模型库</Link>
              </div>
            </div>
          </aside>

          <section className={styles.mainPanel}>
            <header className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>控制面板</p>
                <h2>{activeNavItem.label}</h2>
              </div>
              <Link className={styles.headerLink} href="/account">
                经典账号页
              </Link>
            </header>

            <div className={styles.metricGrid}>
              {data.metrics.map((metric) => (
                <div className={`${styles.metricCard} ${metric.tone ? styles[metric.tone] : ""}`} key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>

            <section className={styles.contentFrame} aria-live="polite">
              {activeSection === "overview" ? (
                <>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.kicker}>总览</p>
                      <h3>个人账号资产总览</h3>
                    </div>
                    <Link href="/dashboard">进入控制台</Link>
                  </div>

                  <div className={styles.overviewGrid}>
                    <section className={styles.overviewHero}>
                      <div>
                        <p className={styles.kicker}>账号资产</p>
                        <strong>这里集中查看账号拥有什么、哪些事情正在进行、哪些资料需要补齐。</strong>
                        <span>总览只做信息归纳和快速判断，不做复杂装饰。后续接入登录接口后，这里可直接展示真实账号资产。</span>
                      </div>
                    </section>

                    <section className={styles.assetSummaryList}>
                      {assetSummary.map((item) => (
                        <button key={item.id} onClick={() => setActiveSection(item.id)} type="button">
                          <span>{item.label}</span>
                          <strong>{item.count}</strong>
                          <em>{item.description}</em>
                          <small>{item.action}</small>
                        </button>
                      ))}
                    </section>

                    <section className={styles.accountHealth}>
                      <div>
                        <span>账号资料</span>
                        <strong>{displayName}</strong>
                        <em>{email}</em>
                      </div>
                      <div>
                        <span>积分余额</span>
                        <strong>{data.creditsBalance}</strong>
                        <em>用于生成、下载或后续工作流。</em>
                      </div>
                      <div>
                        <span>资料完整度</span>
                        <strong>{profileReadiness}</strong>
                        <em>头像、背景、简介和可见性集中在账号设置。</em>
                      </div>
                      <button onClick={() => setActiveSection("settings")} type="button">
                        完善账号设置
                      </button>
                    </section>
                  </div>
                </>
              ) : null}

              {activeSection === "models" ? (
                <>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.kicker}>模型资产</p>
                      <h3>生成模型库与预览状态</h3>
                    </div>
                    <Link href="/dashboard/library">打开模型库</Link>
                  </div>

                  <div className={styles.modelGrid}>
                    {data.modelAssets.length > 0 ? (
                      data.modelAssets.map((model) => (
                        <Link className={styles.modelCard} href={model.href} key={model.id}>
                          <div className={styles.modelThumb}>
                            {model.imageSrc ? <img alt={`${model.title} 预览图`} decoding="async" src={model.imageSrc} /> : <span>暂无预览</span>}
                          </div>
                          <div>
                            <strong>{model.title}</strong>
                            <span>{model.meta}</span>
                          </div>
                          <footer>
                            <em>{model.visibility}</em>
                            <small>{model.status}</small>
                          </footer>
                        </Link>
                      ))
                    ) : (
                      <div className={styles.emptyState}>
                        <strong>暂无模型资产</strong>
                        <p>生成完成的模型会在这里显示预览图、可见性和就绪状态。</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {activeSection === "tasks" ? (
                <>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.kicker}>任务列表</p>
                      <h3>生成任务与订单动态</h3>
                    </div>
                    <Link href="/dashboard">控制台</Link>
                  </div>

                  <div className={styles.activityList}>
                    {data.recentActivity.length > 0 ? (
                      data.recentActivity.map((item) => (
                        <Link className={styles.activityItem} href={item.href} key={item.id}>
                          <span>{item.type}</span>
                          <div>
                            <strong>{item.title}</strong>
                            <em>{item.meta}</em>
                          </div>
                          <small>{item.status}</small>
                        </Link>
                      ))
                    ) : (
                      <div className={styles.emptyState}>
                        <strong>暂无最近动态</strong>
                        <p>创建模型或提交订单后，最新状态会显示在这里。</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {activeSection === "points" ? (
                <>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.kicker}>积分流水</p>
                      <h3>最近积分变动</h3>
                    </div>
                    <Link href="/dashboard/credits">查看积分</Link>
                  </div>

                  <div className={styles.dataTable}>
                    <div className={styles.tableHead}>
                      <span>操作</span>
                      <span>数量</span>
                      <span>余额</span>
                      <span>时间</span>
                    </div>
                    {data.transactions.length > 0 ? (
                      data.transactions.map((transaction) => (
                        <div className={styles.tableRow} key={transaction.id}>
                          <span>{transaction.label}</span>
                          <strong>{transaction.amount}</strong>
                          <span>{transaction.balance}</span>
                          <time>{transaction.date}</time>
                        </div>
                      ))
                    ) : (
                      <div className={styles.tableEmpty}>暂无积分变动记录。</div>
                    )}
                  </div>
                </>
              ) : null}

              {activeSection === "payments" ? (
                <>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.kicker}>支付数据</p>
                      <h3>订单与支付状态</h3>
                    </div>
                    <Link href="/dashboard/orders">查看订单</Link>
                  </div>

                  <div className={styles.paymentList}>
                    {data.paymentItems.length > 0 ? (
                      data.paymentItems.map((item) => (
                        <Link className={styles.paymentItem} href={item.href} key={item.id}>
                          <div>
                            <strong>{item.title}</strong>
                            <span>{item.date}</span>
                          </div>
                          <em>{item.amount}</em>
                          <small>{item.status}</small>
                        </Link>
                      ))
                    ) : (
                      <div className={styles.emptyState}>
                        <strong>暂无支付记录</strong>
                        <p>订单和订阅相关支付会汇总显示在这里。</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {activeSection === "settings" ? (
                <>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.kicker}>账号设置</p>
                      <h3>资料、头像、可见性与密码</h3>
                    </div>
                    <Link href="/account">经典设置</Link>
                  </div>

                  <div className={styles.accountSettingsFrame}>
                    <section className={styles.mediaSettings}>
                      <div className={styles.avatarEditor}>
                        <div className={styles.largeAvatar}>
                          <img alt={`${displayName} 的头像预览`} decoding="async" src={avatarUrl} />
                        </div>
                        <div>
                          <span>头像</span>
                          <strong>个人头像</strong>
                          <p>后续接入账号资料接口后，这里用于上传和更新头像。</p>
                          <button type="button">更换头像</button>
                        </div>
                      </div>

                      <div className={styles.bannerEditor}>
                        <img
                          alt=""
                          aria-hidden="true"
                          decoding="async"
                          src={data.backgroundUrl || "/ui-lab/model-detail-uicut/images/detail-side-banner.png"}
                        />
                        <div>
                          <span>个人背景</span>
                          <strong>创作者横幅</strong>
                          <p>用于个人主页和账号资料展示，接口接入后可直接保存。</p>
                          <button type="button">更换背景</button>
                        </div>
                      </div>
                    </section>

                    <section className={styles.profileFormGrid}>
                      <label>
                        <span>显示名称</span>
                        <input defaultValue={displayName} />
                      </label>
                      <label>
                        <span>真实姓名</span>
                        <input placeholder="填写真实姓名" />
                      </label>
                      <label>
                        <span>手机号</span>
                        <input placeholder="填写手机号" />
                      </label>
                      <label>
                        <span>资料可见性</span>
                        <select defaultValue="private">
                          <option value="private">私密</option>
                          <option value="public">公开</option>
                        </select>
                      </label>
                      <label className={styles.bioField}>
                        <span>个人简介</span>
                        <textarea placeholder="填写公开创作者简介" />
                      </label>
                      <label>
                        <span>头像框</span>
                        <select defaultValue="none">
                          <option value="none">无</option>
                          <option value="ember">余烬</option>
                          <option value="kick">冲击</option>
                          <option value="emerald">翡翠</option>
                        </select>
                      </label>
                    </section>

                    <section className={styles.passwordPanel}>
                      <div>
                        <span>密码</span>
                        <strong>修改密码</strong>
                        <p>后续提交当前密码、新密码和确认密码到账号安全接口。</p>
                      </div>
                      <div className={styles.passwordFields}>
                        <input placeholder="当前密码" type="password" />
                        <input placeholder="新密码" type="password" />
                        <input placeholder="确认新密码" type="password" />
                      </div>
                      <button type="button">保存账号设置</button>
                    </section>

                  </div>
                </>
              ) : null}
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
