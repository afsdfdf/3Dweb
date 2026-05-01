"use client";

/* eslint-disable @next/next/no-img-element */
import { type CSSProperties, useEffect, useMemo, useState } from "react";

import { TopNavigation, type TopNavigationItem } from "@/components/ui-lab/top-navigation";
import { BorderComboFrame2 } from "@/components/ui-lab/border-combo-frame-2";
import { OrangeMediumActionButton } from "@/components/ui-lab/action-buttons";
import { FrameButton } from "@/components/ui/frame-button";

import styles from "./personal-center-test.module.css";

type SectionId = "overview" | "orders" | "models" | "tasks" | "billing" | "settings";

type RecordRow = {
  amount: string;
  id: string;
  item: string;
  status: string;
  time: string;
  type: string;
};

type SectionConfig = {
  id: SectionId;
  label: string;
  meta: string;
  value: string;
};

type PersonalCenterTestProps = {
  navUser?: null | {
    avatarUrl?: null | string;
    credits?: null | number;
    creditsBalance?: null | number;
    displayName?: null | string;
    email?: null | string;
    name?: null | string;
  };
};

const realNavigationItems: TopNavigationItem[] = [
  { href: "/", id: "HOME", label: "HOME" },
  { href: "/generate", id: "WORKBENCH", label: "WORKBENCH" },
  { href: "/dashboard", id: "ACCOUNT", label: "ACCOUNT" },
  { href: "/admin", id: "ADMIN", label: "ADMIN" },
];

const sections: SectionConfig[] = [
  { id: "overview", label: "Overview", meta: "Account summary", value: "Live" },
  { id: "orders", label: "Orders", meta: "Print and digital", value: "3" },
  { id: "models", label: "Model Library", meta: "Assets and files", value: "12" },
  { id: "tasks", label: "Generation Tasks", meta: "AI workflow", value: "4" },
  { id: "billing", label: "Billing", meta: "Credits and payments", value: "1,280" },
  { id: "settings", label: "Account Settings", meta: "Profile", value: "Edit" },
];

const metrics = [
  { detail: "ready for preview", label: "Model Library", value: "12" },
  { detail: "2 need review", label: "Active Tasks", value: "4" },
  { detail: "3 in progress", label: "Orders", value: "8" },
  { detail: "available balance", label: "Credits", value: "1,280" },
];

const sectionInsights: Record<SectionId, { label: string; value: string }[]> = {
  overview: [
    { label: "Credits", value: "1,280" },
    { label: "Open tasks", value: "4" },
    { label: "Active orders", value: "3" },
  ],
  billing: [
    { label: "Reserved", value: "120" },
    { label: "Available", value: "1,280" },
    { label: "Pending", value: "$72" },
  ],
  models: [
    { label: "Public", value: "8" },
    { label: "Private", value: "4" },
    { label: "Printable", value: "9" },
  ],
  orders: [
    { label: "In production", value: "3" },
    { label: "Awaiting payment", value: "1" },
    { label: "Delivered", value: "4" },
  ],
  settings: [],
  tasks: [
    { label: "Succeeded", value: "18" },
    { label: "Processing", value: "2" },
    { label: "Queued", value: "2" },
  ],
};

const rowsBySection: Record<Exclude<SectionId, "overview" | "settings">, RecordRow[]> = {
  billing: [
    { amount: "-120", id: "BIL-1008", item: "Dragon rider generation", status: "Debited", time: "2026.04.29 18:42", type: "Credits" },
    { amount: "$48.00", id: "BIL-1007", item: "Northern Watcher print", status: "Captured", time: "2026.04.30 10:13", type: "Payment" },
    { amount: "+500", id: "BIL-1006", item: "Credit refill pack", status: "Posted", time: "2026.04.27 12:18", type: "Recharge" },
  ],
  models: [
    { amount: "-", id: "MD-204", item: "Northern Watcher", status: "Public", time: "2026.04.29 20:12", type: "Generated" },
    { amount: "-", id: "MD-203", item: "Lava Colossus", status: "Private", time: "2026.04.28 16:05", type: "Review" },
    { amount: "-", id: "MD-202", item: "Mithril Archer", status: "Public", time: "2026.04.26 11:44", type: "Printable" },
  ],
  orders: [
    { amount: "$48.00", id: "OR-311", item: "Northern Watcher print", status: "In production", time: "2026.04.30 10:12", type: "Print order" },
    { amount: "$16.00", id: "OR-309", item: "Model file download", status: "Complete", time: "2026.04.28 17:45", type: "Digital order" },
    { amount: "$72.00", id: "OR-305", item: "Lava Colossus print", status: "Awaiting payment", time: "2026.04.26 13:28", type: "Print order" },
  ],
  tasks: [
    { amount: "-120", id: "TSK-442", item: "Dragon rider generation", status: "Succeeded", time: "2026.04.29 18:42", type: "Text to model" },
    { amount: "-80", id: "TSK-438", item: "Mithril Archer cleanup", status: "Processing", time: "2026.04.28 16:05", type: "Refine" },
    { amount: "0", id: "TSK-431", item: "Lava Colossus preview", status: "Queued", time: "2026.04.26 11:44", type: "Preview" },
  ],
};

const titleBySection: Record<SectionId, string> = {
  billing: "Billing",
  models: "Model Library",
  orders: "Orders",
  overview: "Overview",
  settings: "Account Settings",
  tasks: "Generation Tasks",
};

const overviewHighlights = [
  { detail: "Ready assets", label: "Model Library", value: "12" },
  { detail: "In production", label: "Orders", value: "3" },
  { detail: "Generation queue", label: "Tasks", value: "4" },
  { detail: "Available credits", label: "Balance", value: "1,280" },
];

const overviewActivity = [
  { label: "Northern Watcher print", meta: "Orders", status: "In production" },
  { label: "Dragon rider generation", meta: "Generation Tasks", status: "Succeeded" },
  { label: "Credit refill pack", meta: "Billing", status: "Posted" },
];

type StageStyle = CSSProperties & {
  "--page-scale": number;
  "--stage-height": string;
  "--surface-left": string;
  "--surface-width": string;
  "--stage-width": string;
  "--viewport-surface-bottom": string;
  "--viewport-surface-top": string;
};

function getStageStyle(width: number, height: number): StageStyle {
  const scale = Math.min(1, width / 1920, height / 1080);
  const visibleStageWidth = width / scale;

  return {
    "--page-scale": scale,
    "--stage-height": "1080px",
    "--surface-left": "32px",
    "--surface-width": `${visibleStageWidth - 64}px`,
    "--stage-width": "1920px",
    "--viewport-surface-bottom": "58px",
    "--viewport-surface-top": "98px",
  };
}

export function PersonalCenterTest({ navUser = null }: PersonalCenterTestProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [viewport, setViewport] = useState({ height: 1080, width: 1920 });
  const displayName = navUser?.displayName || navUser?.name || navUser?.email || "Adventurer";
  const email = navUser?.email || "account@example.com";
  const avatarUrl = navUser?.avatarUrl || "/ui-lab/model-detail-uicut/images/face.png";
  const activeConfig = sections.find((section) => section.id === activeSection) ?? sections[0];
  const stageStyle = useMemo(() => getStageStyle(viewport.width, viewport.height), [viewport.height, viewport.width]);

  useEffect(() => {
    function syncViewport() {
      setViewport({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    }

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  return (
    <main className={styles.pageShell}>
      <div className={styles.stageViewport}>
        <TopNavigation active="ACCOUNT" className={styles.boundTopNavigation} items={realNavigationItems} user={navUser} />

        <section aria-label="Account center test page" className={styles.stage} style={stageStyle}>
          <div className={styles.accountSurface}>
            <BorderComboFrame2 className={styles.accountFrameContainer}>
              <div className={styles.accountFrameGrid}>
                <aside className={styles.profilePanel}>
                  <div className={styles.panelFrameContent}>
                <section className={styles.identityBlock}>
                  <div className={styles.avatarRing}>
                    <img alt={`${displayName} avatar`} decoding="async" src={avatarUrl} />
                    <button aria-label="Change avatar" className={styles.avatarEditButton} type="button">
                      <span aria-hidden="true">/</span>
                      EDIT
                    </button>
                  </div>
                  <div>
                    <p>Account Center</p>
                    <h1>{displayName}</h1>
                    <span>{email}</span>
                  </div>
                </section>

                <section className={styles.creditPlate}>
                  <img alt="" aria-hidden="true" decoding="async" src="/ui-lab/model-detail-uicut/images/detail-bottom-icon-1.png" />
                  <div>
                    <strong>1,280</strong>
                    <span>Available credits</span>
                  </div>
                </section>

                <section className={styles.profileBackgroundCard} aria-label="Profile background">
                  <div>
                    <span>Profile Background</span>
                    <strong>Creator Banner</strong>
                  </div>
                  <img alt="" aria-hidden="true" decoding="async" src="/ui-lab/model-detail-uicut/images/detail-side-banner.png" />
                  <button className={styles.backgroundEditButton} type="button">
                    <span aria-hidden="true">/</span>
                    EDIT
                  </button>
                </section>

                <nav aria-label="Account center sections" className={styles.sideMenu}>
                  {sections.map((section) => (
                    <button
                      className={[
                        section.id === activeSection ? styles.sideMenuActive : "",
                        section.id === "settings" ? styles.sideMenuSettings : "",
                      ].filter(Boolean).join(" ")}
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      type="button"
                    >
                      <strong>{section.label}</strong>
                      <em>{section.value}</em>
                    </button>
                  ))}
                </nav>

                <div className={styles.primaryActions}>
                  <div className={styles.mediumActionSlot}>
                    <OrangeMediumActionButton
                      className={styles.sidebarMediumButton}
                      label="Create Model"
                      onClick={() => {
                        window.location.href = "/workbench";
                      }}
                      type="button"
                    />
                  </div>
                  <div className={styles.mediumActionSlot}>
                    <OrangeMediumActionButton
                      className={styles.sidebarMediumButton}
                      label="Recharge Credits"
                      onClick={() => setActiveSection("billing")}
                      type="button"
                    />
                  </div>
                </div>
                  </div>
                </aside>

                <section className={styles.accountPanel}>
                  <div className={styles.accountFrameContent}>
            <header className={styles.panelHeader}>
              <div>
                <p>Control Panel</p>
                <h2>{titleBySection[activeSection]}</h2>
              </div>
            </header>

            {activeSection === "overview" ? (
              <section className={styles.assetStrip} aria-label="Account asset summary">
                {metrics.map((metric) => (
                  <div key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <em>{metric.detail}</em>
                  </div>
                ))}
              </section>
            ) : null}

            <section className={`${styles.contentPanel} ${activeSection === "overview" ? styles.contentPanelWithSummary : styles.contentPanelFull}`}>
              <header className={styles.contentHeader}>
                <div>
                  <p>{activeConfig.label}</p>
                  <h3>
                    {activeSection === "overview"
                      ? "Credits, tasks, orders, and model activity"
                      : activeSection === "settings"
                        ? "Profile, visibility, and security"
                        : `${activeConfig.label} Details`}
                  </h3>
                </div>
                <FrameButton className={styles.frameButtonText} height={40} size="compact" type="button" variant="slate" width={146}>
                  {activeSection === "settings" ? "Edit Profile" : activeSection === "overview" ? "Refresh" : "Filter"}
                </FrameButton>
              </header>

              {activeSection === "overview" || activeSection === "settings" ? null : (
                <section className={styles.insightStrip} aria-label={`${activeConfig.label} summary`}>
                  {sectionInsights[activeSection].map((item) => (
                    <div key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </section>
              )}

              {activeSection === "overview" ? (
                <div className={styles.overviewFrame}>
                  <section className={styles.overviewHero}>
                    <div>
                      <span>Account Status</span>
                      <strong>Everything important is ready at a glance.</strong>
                      <p>Track credits, generated models, print orders, and recent activity before jumping into a detailed account section.</p>
                    </div>
                    <FrameButton className={styles.frameButtonText} height={42} size="compact" type="button" variant="gold" width={150}>
                      Create Model
                    </FrameButton>
                  </section>

                  <section className={styles.overviewGrid} aria-label="Overview highlights">
                    {overviewHighlights.map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <em>{item.detail}</em>
                      </div>
                    ))}
                  </section>

                  <section className={styles.overviewActivity} aria-label="Recent activity">
                    <header>
                      <span>Recent Activity</span>
                      <strong>Latest account movement</strong>
                    </header>
                    {overviewActivity.map((item) => (
                      <div key={item.label}>
                        <span>{item.meta}</span>
                        <strong>{item.label}</strong>
                        <em>{item.status}</em>
                      </div>
                    ))}
                  </section>
                </div>
              ) : activeSection === "settings" ? (
                <div className={styles.accountSettingsFrame}>
                  <section className={styles.profileFormGrid}>
                    <label>
                      <span>Display Name</span>
                      <input defaultValue={displayName} />
                    </label>
                    <label>
                      <span>Legal Name</span>
                      <input placeholder="Enter legal name" />
                    </label>
                    <label>
                      <span>Phone Number</span>
                      <input placeholder="Enter phone number" />
                    </label>
                    <label>
                      <span>Profile Visibility</span>
                      <select defaultValue="private">
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                      </select>
                    </label>
                    <label className={styles.bioField}>
                      <span>Creator Bio</span>
                      <textarea placeholder="Write a public creator bio" />
                    </label>
                    <label>
                      <span>Avatar Frame</span>
                      <select defaultValue="none">
                        <option value="none">None</option>
                        <option value="ember">Ember</option>
                        <option value="impact">Impact</option>
                        <option value="emerald">Emerald</option>
                      </select>
                    </label>
                  </section>

                  <section className={styles.passwordPanel}>
                    <div>
                      <span>Password</span>
                      <strong>Change Password</strong>
                      <p>Later this submits current password, new password, and confirmation to account security.</p>
                    </div>
                    <div className={styles.passwordFields}>
                      <input placeholder="Current password" type="password" />
                      <input placeholder="New password" type="password" />
                      <input placeholder="Confirm password" type="password" />
                    </div>
                    <FrameButton className={styles.frameButtonText} height={42} size="compact" type="button" variant="gold" width={174}>
                      Save Settings
                    </FrameButton>
                  </section>
                </div>
              ) : (
                <>
                  <div className={styles.recordsToolbar}>
                    <label>
                      <span>Search</span>
                      <input placeholder={`Search ${activeConfig.label.toLowerCase()}`} />
                    </label>
                    <label>
                      <span>Range</span>
                      <select defaultValue="30d">
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="all">All records</option>
                      </select>
                    </label>
                    <FrameButton className={styles.frameButtonText} height={40} size="compact" type="button" variant="gold" width={146}>
                      Export CSV
                    </FrameButton>
                  </div>

                  <table className={styles.recordsTable}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Item</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsBySection[activeSection].map((row) => (
                        <tr key={row.id}>
                          <td>{row.id}</td>
                          <td>{row.type}</td>
                          <td>{row.item}</td>
                          <td>{row.status}</td>
                          <td className={styles.amountCell}>{row.amount}</td>
                          <td>{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <nav aria-label="Record pagination" className={styles.pagination}>
                    {["<", "1", "2", "3", "...", ">"].map((item) => (
                      <button
                        aria-current={item === "1" ? "page" : undefined}
                        className={item === "1" ? styles.currentPage : undefined}
                        key={item}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                    <button className={styles.pageSizeButton} type="button">
                      <span>10 / Page</span>
                      <span className={styles.pageSizeChevron} aria-hidden="true" />
                    </button>
                  </nav>
                </>
              )}
            </section>
                  </div>
                </section>
              </div>
            </BorderComboFrame2>
          </div>
        </section>
      </div>
    </main>
  );
}
