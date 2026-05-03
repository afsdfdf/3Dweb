"use client";

/* eslint-disable @next/next/no-img-element */
import {
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { TopNavigation } from "@/components/ui-lab/top-navigation";
import { BorderComboFrame2 } from "@/components/ui-lab/border-combo-frame-2";
import { OrangeMediumActionButton } from "@/components/ui-lab/action-buttons";
import { FrameButton } from "@/components/ui/frame-button";
import { publicNavigationItems } from "@/lib/publicNavigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

import styles from "./personal-center-test.module.css";

type SectionId =
  | "overview"
  | "orders"
  | "models"
  | "tasks"
  | "billing"
  | "settings";

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

export type PersonalCenterData = {
  avatarFrame?: null | string;
  avatarFrameStyles?: {
    key: string;
    thumbnailUrl?: null | string;
    title: string;
  }[];
  avatarUrl?: null | string;
  backgroundUrl?: null | string;
  bio?: null | string;
  creditsBalance?: number;
  displayName?: null | string;
  email?: null | string;
  fullName?: null | string;
  metrics?: {
    activeOrders: number;
    activeTasks: number;
    modelCount: number;
    orderCount: number;
    taskCount: number;
  };
  phone?: null | string;
  profileVisibility?: "private" | "public";
  rows?: Partial<
    Record<Exclude<SectionId, "overview" | "settings">, RecordRow[]>
  >;
};

type PersonalCenterTestProps = {
  accountData?: PersonalCenterData;
  navUser?: null | {
    avatarUrl?: null | string;
    credits?: null | number;
    creditsBalance?: null | number;
    displayName?: null | string;
    email?: null | string;
    name?: null | string;
  };
};

const fallbackRowsBySection: Record<
  Exclude<SectionId, "overview" | "settings">,
  RecordRow[]
> = {
  billing: [
    {
      amount: "-120",
      id: "BIL-1008",
      item: "Dragon rider generation",
      status: "Debited",
      time: "2026.04.29 18:42",
      type: "Credits",
    },
    {
      amount: "$48.00",
      id: "BIL-1007",
      item: "Northern Watcher print",
      status: "Captured",
      time: "2026.04.30 10:13",
      type: "Payment",
    },
    {
      amount: "+500",
      id: "BIL-1006",
      item: "Credit refill pack",
      status: "Posted",
      time: "2026.04.27 12:18",
      type: "Recharge",
    },
  ],
  models: [
    {
      amount: "-",
      id: "MD-204",
      item: "Northern Watcher",
      status: "Public",
      time: "2026.04.29 20:12",
      type: "Generated",
    },
    {
      amount: "-",
      id: "MD-203",
      item: "Lava Colossus",
      status: "Private",
      time: "2026.04.28 16:05",
      type: "Review",
    },
    {
      amount: "-",
      id: "MD-202",
      item: "Mithril Archer",
      status: "Public",
      time: "2026.04.26 11:44",
      type: "Printable",
    },
  ],
  orders: [
    {
      amount: "$48.00",
      id: "OR-311",
      item: "Northern Watcher print",
      status: "In production",
      time: "2026.04.30 10:12",
      type: "Print order",
    },
    {
      amount: "$16.00",
      id: "OR-309",
      item: "Model file download",
      status: "Complete",
      time: "2026.04.28 17:45",
      type: "Digital order",
    },
    {
      amount: "$72.00",
      id: "OR-305",
      item: "Lava Colossus print",
      status: "Awaiting payment",
      time: "2026.04.26 13:28",
      type: "Print order",
    },
  ],
  tasks: [
    {
      amount: "-120",
      id: "TSK-442",
      item: "Dragon rider generation",
      status: "Succeeded",
      time: "2026.04.29 18:42",
      type: "Text to model",
    },
    {
      amount: "-80",
      id: "TSK-438",
      item: "Mithril Archer cleanup",
      status: "Processing",
      time: "2026.04.28 16:05",
      type: "Refine",
    },
    {
      amount: "0",
      id: "TSK-431",
      item: "Lava Colossus preview",
      status: "Queued",
      time: "2026.04.26 11:44",
      type: "Preview",
    },
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

const formatNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    Number.isFinite(number) ? number : 0,
  );
};

const profileImageAccept = "image/jpeg,image/png,image/webp";
const profileImageTypes = new Set(profileImageAccept.split(","));

const parseRowTime = (value: string) => {
  const date = new Date(value.replace(/\./g, "-"));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const escapeCsvValue = (value: string) => {
  const normalized = value.replace(/\r?\n/g, " ");
  return /[",]/.test(normalized)
    ? `"${normalized.replace(/"/g, '""')}"`
    : normalized;
};

export function PersonalCenterTest({
  accountData,
  navUser = null,
}: PersonalCenterTestProps) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [profileData, setProfileData] = useState<PersonalCenterData>(
    accountData ?? {},
  );
  const [recordPage, setRecordPage] = useState(1);
  const [recordRange, setRecordRange] = useState("30d");
  const [recordSearch, setRecordSearch] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [viewport, setViewport] = useState({ height: 1080, width: 1920 });
  const displayName =
    profileData.displayName ||
    navUser?.displayName ||
    navUser?.name ||
    navUser?.email ||
    "Adventurer";
  const email =
    profileData.email || navUser?.email || "Sign in to sync account";
  const avatarUrl =
    profileData.avatarUrl ||
    navUser?.avatarUrl ||
    "/ui-lab/model-detail-uicut/images/face.png";
  const backgroundUrl =
    profileData.backgroundUrl ||
    "/ui-lab/model-detail-uicut/images/detail-side-banner.png";
  const creditsBalance =
    profileData.creditsBalance ??
    navUser?.creditsBalance ??
    navUser?.credits ??
    1280;
  const formattedCredits = formatNumber(creditsBalance);
  const accountMetrics = accountData?.metrics ?? {
    activeOrders: 3,
    activeTasks: 4,
    modelCount: 12,
    orderCount: 8,
    taskCount: 4,
  };
  const rowsBySection = useMemo(
    () => ({
      billing: accountData?.rows
        ? (accountData.rows.billing ?? [])
        : fallbackRowsBySection.billing,
      models: accountData?.rows
        ? (accountData.rows.models ?? [])
        : fallbackRowsBySection.models,
      orders: accountData?.rows
        ? (accountData.rows.orders ?? [])
        : fallbackRowsBySection.orders,
      tasks: accountData?.rows
        ? (accountData.rows.tasks ?? [])
        : fallbackRowsBySection.tasks,
    }),
    [accountData?.rows],
  );
  const sections = useMemo<SectionConfig[]>(
    () => [
      {
        id: "overview",
        label: "Overview",
        meta: "Account summary",
        value: "Live",
      },
      {
        id: "orders",
        label: "Orders",
        meta: "Print and digital",
        value: String(
          accountMetrics.activeOrders || accountMetrics.orderCount || 0,
        ),
      },
      {
        id: "models",
        label: "Model Library",
        meta: "Assets and files",
        value: String(accountMetrics.modelCount || 0),
      },
      {
        id: "tasks",
        label: "Generation Tasks",
        meta: "AI workflow",
        value: String(
          accountMetrics.activeTasks || accountMetrics.taskCount || 0,
        ),
      },
      {
        id: "billing",
        label: "Billing",
        meta: "Credits and payments",
        value: formattedCredits,
      },
      {
        id: "settings",
        label: "Account Settings",
        meta: "Profile",
        value: "Edit",
      },
    ],
    [
      accountMetrics.activeOrders,
      accountMetrics.activeTasks,
      accountMetrics.modelCount,
      accountMetrics.orderCount,
      accountMetrics.taskCount,
      formattedCredits,
    ],
  );
  const activeConfig =
    sections.find((section) => section.id === activeSection) ?? sections[0];
  const activeRecordSection =
    activeSection === "overview" || activeSection === "settings"
      ? null
      : activeSection;
  const activeRows = activeRecordSection
    ? rowsBySection[activeRecordSection]
    : [];
  const filteredRows = useMemo(() => {
    const query = recordSearch.trim().toLowerCase();
    const now = Date.now();
    const maxAge =
      recordRange === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : recordRange === "30d"
          ? 30 * 24 * 60 * 60 * 1000
          : null;

    return activeRows.filter((row) => {
      if (query) {
        const haystack =
          `${row.id} ${row.type} ${row.item} ${row.status} ${row.amount} ${row.time}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (maxAge) {
        const rowTime = parseRowTime(row.time);
        if (rowTime && now - rowTime > maxAge) return false;
      }

      return true;
    });
  }, [activeRows, recordRange, recordSearch]);
  const pageSize = 10;
  const totalRecordPages = Math.max(
    1,
    Math.ceil(filteredRows.length / pageSize),
  );
  const currentRecordPage = Math.min(recordPage, totalRecordPages);
  const pagedRows = filteredRows.slice(
    (currentRecordPage - 1) * pageSize,
    currentRecordPage * pageSize,
  );
  const metrics = [
    {
      detail: "ready for preview",
      label: "Model Library",
      value: String(accountMetrics.modelCount || 0),
    },
    {
      detail: "need review",
      label: "Active Tasks",
      value: String(accountMetrics.activeTasks || 0),
    },
    {
      detail: "in progress",
      label: "Orders",
      value: String(accountMetrics.activeOrders || 0),
    },
    { detail: "available balance", label: "Credits", value: formattedCredits },
  ];
  const sectionInsights: Record<SectionId, { label: string; value: string }[]> =
    {
      overview: [
        { label: "Credits", value: formattedCredits },
        { label: "Open tasks", value: String(accountMetrics.activeTasks || 0) },
        {
          label: "Active orders",
          value: String(accountMetrics.activeOrders || 0),
        },
      ],
      billing: [
        { label: "Transactions", value: String(rowsBySection.billing.length) },
        { label: "Available", value: formattedCredits },
        { label: "Status", value: "Active" },
      ],
      models: [
        {
          label: "Total",
          value: String(
            accountMetrics.modelCount || rowsBySection.models.length,
          ),
        },
        { label: "Recent", value: String(rowsBySection.models.length) },
        {
          label: "Ready",
          value: String(
            rowsBySection.models.filter((row) =>
              /ready|public|printable/i.test(row.status),
            ).length,
          ),
        },
      ],
      orders: [
        { label: "Active", value: String(accountMetrics.activeOrders || 0) },
        { label: "Recent", value: String(rowsBySection.orders.length) },
        {
          label: "Total",
          value: String(
            accountMetrics.orderCount || rowsBySection.orders.length,
          ),
        },
      ],
      settings: [],
      tasks: [
        { label: "Active", value: String(accountMetrics.activeTasks || 0) },
        { label: "Recent", value: String(rowsBySection.tasks.length) },
        {
          label: "Total",
          value: String(accountMetrics.taskCount || rowsBySection.tasks.length),
        },
      ],
    };
  const overviewHighlights = [
    {
      detail: "Ready assets",
      label: "Model Library",
      value: String(accountMetrics.modelCount || 0),
    },
    {
      detail: "In production",
      label: "Orders",
      value: String(accountMetrics.activeOrders || 0),
    },
    {
      detail: "Generation queue",
      label: "Tasks",
      value: String(accountMetrics.activeTasks || 0),
    },
    { detail: "Available credits", label: "Balance", value: formattedCredits },
  ];
  const overviewActivity = [
    ...rowsBySection.orders
      .slice(0, 1)
      .map((row) => ({ label: row.item, meta: "Orders", status: row.status })),
    ...rowsBySection.tasks
      .slice(0, 1)
      .map((row) => ({
        label: row.item,
        meta: "Generation Tasks",
        status: row.status,
      })),
    ...rowsBySection.billing
      .slice(0, 1)
      .map((row) => ({ label: row.item, meta: "Billing", status: row.status })),
  ];
  const stageStyle = useMemo(
    () => getStageStyle(viewport.width, viewport.height),
    [viewport.height, viewport.width],
  );

  useEffect(() => {
    setProfileData(accountData ?? {});
  }, [accountData]);

  useEffect(() => {
    setRecordPage(1);
  }, [activeSection, recordRange, recordSearch]);

  function updateProfileField<Key extends keyof PersonalCenterData>(
    key: Key,
    value: PersonalCenterData[Key],
  ) {
    setProfileData((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaveMessage("Saving profile...");

    try {
      const response = await fetch("/api/account/profile", {
        body: JSON.stringify({
          avatarFrame: String(formData.get("avatarFrame") || "none"),
          bio: String(formData.get("bio") || ""),
          displayName: String(formData.get("displayName") || ""),
          fullName: String(formData.get("fullName") || ""),
          phone: String(formData.get("phone") || ""),
          profileVisibility:
            formData.get("profileVisibility") === "public"
              ? "public"
              : "private",
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Profile save failed.");
      }

      setProfileData((current) => ({ ...current, ...(payload.profile ?? {}) }));
      setSaveMessage("Profile saved.");
      router.refresh();
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Profile save failed.",
      );
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaveMessage("Saving password...");

    try {
      const response = await fetch("/api/account/password", {
        body: JSON.stringify({
          confirmNewPassword: String(formData.get("confirmNewPassword") || ""),
          currentPassword: String(formData.get("currentPassword") || ""),
          newPassword: String(formData.get("newPassword") || ""),
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Password update failed.");
      }

      setSaveMessage("Password updated.");
      router.refresh();
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Password update failed.",
      );
    }
  }

  async function uploadProfileMedia(
    file: File,
    purpose: "avatar" | "profile-banner",
  ) {
    if (!profileImageTypes.has(file.type)) {
      throw new Error("Only JPEG, PNG, and WebP profile images are supported.");
    }

    setSaveMessage(
      purpose === "avatar"
        ? "Uploading avatar..."
        : "Uploading profile banner...",
    );

    const configResponse = await fetch(
      "/api/account/profile-media/upload-url",
      {
        body: JSON.stringify({
          contentType: file.type || "application/octet-stream",
          filename: file.name || "profile-media",
          purpose,
          publicAccess: profileData.profileVisibility === "public",
          size: file.size,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
    const config = await configResponse.json().catch(() => ({}));

    if (!configResponse.ok) {
      throw new Error(config.message || "Profile media upload failed.");
    }

    const supabase = getSupabaseBrowserClient();
    const uploadResponse = await supabase.storage
      .from(config.bucket)
      .uploadToSignedUrl(config.path, config.token, file, {
        contentType:
          file.type || config.contentType || "application/octet-stream",
      });

    if (uploadResponse.error) {
      throw new Error(
        uploadResponse.error.message || "Profile media upload failed.",
      );
    }

    const completeResponse = await fetch(
      "/api/account/profile-media/complete",
      {
        body: JSON.stringify({
          contentType: file.type || config.contentType || "application/octet-stream",
          filename: file.name || "profile-media",
          mediaId: Number(config.mediaId),
          path: config.path,
          publicAccess: profileData.profileVisibility === "public",
          purpose,
          size: file.size,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
    const completedMedia = await completeResponse.json().catch(() => ({}));

    if (!completeResponse.ok) {
      throw new Error(
        completedMedia.message ||
          "Profile media was uploaded, but media registration failed.",
      );
    }

    const profileResponse = await fetch("/api/account/profile", {
      body: JSON.stringify(
        purpose === "avatar"
          ? { avatar: Number(completedMedia.mediaId) }
          : { profileBanner: Number(completedMedia.mediaId) },
      ),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = await profileResponse.json().catch(() => ({}));

    if (!profileResponse.ok) {
      throw new Error(
        payload.message ||
          "Profile media was uploaded, but profile update failed.",
      );
    }

    setProfileData((current) => ({
      ...current,
      ...(payload.profile ?? {}),
      ...(purpose === "avatar"
        ? { avatarUrl: config.publicUrl }
        : { backgroundUrl: config.publicUrl }),
    }));
    setSaveMessage(
      purpose === "avatar" ? "Avatar updated." : "Profile banner updated.",
    );
    router.refresh();
  }

  async function handleMediaFileChange(
    event: ChangeEvent<HTMLInputElement>,
    purpose: "avatar" | "profile-banner",
  ) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      await uploadProfileMedia(file, purpose);
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Profile media upload failed.",
      );
    }
  }

  function downloadCsv() {
    if (!activeRecordSection) return;

    const headers = ["ID", "Type", "Item", "Status", "Amount", "Time"];
    const csv = [
      headers.join(","),
      ...filteredRows.map((row) =>
        [row.id, row.type, row.item, row.status, row.amount, row.time]
          .map(escapeCsvValue)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `account-${activeRecordSection}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

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
        <TopNavigation
          active="ACCOUNT"
          className={styles.boundTopNavigation}
          items={publicNavigationItems}
          user={navUser}
        />

        <input
          ref={avatarInputRef}
          accept={profileImageAccept}
          className={styles.hiddenFileInput}
          onChange={(event) => void handleMediaFileChange(event, "avatar")}
          type="file"
        />
        <input
          ref={bannerInputRef}
          accept={profileImageAccept}
          className={styles.hiddenFileInput}
          onChange={(event) =>
            void handleMediaFileChange(event, "profile-banner")
          }
          type="file"
        />

        <AuthModalStage fitViewport topOffset={60}>
          <section
            aria-label="Account center test page"
            className={styles.stage}
            style={stageStyle}
          >
            <div className={styles.accountSurface}>
              <BorderComboFrame2 className={styles.accountFrameContainer}>
                <div className={styles.accountFrameGrid}>
                  <aside className={styles.profilePanel}>
                    <div className={styles.panelFrameContent}>
                      <section className={styles.identityBlock}>
                        <div className={styles.avatarRing}>
                          <img
                            alt={`${displayName} avatar`}
                            decoding="async"
                            src={avatarUrl}
                          />
                          <button
                            aria-label="Change avatar"
                            className={styles.avatarEditButton}
                            onClick={() => avatarInputRef.current?.click()}
                            type="button"
                          >
                            <span aria-hidden="true">/</span>
                            EDIT
                          </button>
                        </div>
                        <div>
                          <p>Personal Center</p>
                          <h1>{displayName}</h1>
                          <span>{email}</span>
                        </div>
                      </section>

                      <section className={styles.creditPlate}>
                        <img
                          alt=""
                          aria-hidden="true"
                          decoding="async"
                          src="/ui-lab/model-detail-uicut/images/detail-bottom-icon-1.png"
                        />
                        <div>
                          <strong>{formattedCredits}</strong>
                          <span>Available credits</span>
                        </div>
                      </section>

                      <section
                        className={styles.profileBackgroundCard}
                        aria-label="Profile background"
                      >
                        <div>
                          <span>Profile Background</span>
                          <strong>Creator Banner</strong>
                        </div>
                        <img
                          alt=""
                          aria-hidden="true"
                          decoding="async"
                          src={backgroundUrl}
                        />
                        <button
                          className={styles.backgroundEditButton}
                          onClick={() => bannerInputRef.current?.click()}
                          type="button"
                        >
                          <span aria-hidden="true">/</span>
                          EDIT
                        </button>
                      </section>

                      <nav
                        aria-label="Account center sections"
                        className={styles.sideMenu}
                      >
                        {sections.map((section) => (
                          <button
                            className={[
                              section.id === activeSection
                                ? styles.sideMenuActive
                                : "",
                              section.id === "settings"
                                ? styles.sideMenuSettings
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
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
                            onClick={() => router.push("/workbench")}
                            type="button"
                          />
                        </div>
                        <div className={styles.mediumActionSlot}>
                          <OrangeMediumActionButton
                            className={styles.sidebarMediumButton}
                            label="Recharge Credits"
                            onClick={() => router.push("/pricing")}
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
                        <section
                          className={styles.assetStrip}
                          aria-label="Account asset summary"
                        >
                          {metrics.map((metric) => (
                            <div key={metric.label}>
                              <span>{metric.label}</span>
                              <strong>{metric.value}</strong>
                              <em>{metric.detail}</em>
                            </div>
                          ))}
                        </section>
                      ) : null}

                      <section
                        className={`${styles.contentPanel} ${activeSection === "overview" ? styles.contentPanelWithSummary : styles.contentPanelFull}`}
                      >
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
                          <FrameButton
                            className={styles.frameButtonText}
                            height={40}
                            onClick={() => {
                              if (activeSection === "overview") {
                                router.refresh();
                              } else if (activeSection === "settings") {
                                setSaveMessage(
                                  "Edit profile fields, then save changes.",
                                );
                              } else {
                                setRecordSearch((value) => value.trim());
                              }
                            }}
                            size="compact"
                            type="button"
                            variant="slate"
                            width={146}
                          >
                            {activeSection === "settings"
                              ? "Edit Profile"
                              : activeSection === "overview"
                                ? "Refresh"
                                : "Filter"}
                          </FrameButton>
                        </header>

                        {activeSection === "overview" ||
                        activeSection === "settings" ? null : (
                          <section
                            className={styles.insightStrip}
                            aria-label={`${activeConfig.label} summary`}
                          >
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
                                <strong>
                                  Everything important is ready at a glance.
                                </strong>
                                <p>
                                  Track credits, generated models, print orders,
                                  and recent activity before jumping into a
                                  detailed account section.
                                </p>
                              </div>
                              <FrameButton
                                className={styles.frameButtonText}
                                height={42}
                                onClick={() => router.push("/workbench")}
                                size="compact"
                                type="button"
                                variant="gold"
                                width={150}
                              >
                                Create Model
                              </FrameButton>
                            </section>

                            <section
                              className={styles.overviewGrid}
                              aria-label="Overview highlights"
                            >
                              {overviewHighlights.map((item) => (
                                <div key={item.label}>
                                  <span>{item.label}</span>
                                  <strong>{item.value}</strong>
                                  <em>{item.detail}</em>
                                </div>
                              ))}
                            </section>

                            <section
                              className={styles.overviewActivity}
                              aria-label="Recent activity"
                            >
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
                            <form
                              className={styles.profileFormGrid}
                              onSubmit={saveProfile}
                            >
                              <label>
                                <span>Display Name</span>
                                <input
                                  name="displayName"
                                  onChange={(event) =>
                                    updateProfileField(
                                      "displayName",
                                      event.target.value,
                                    )
                                  }
                                  value={
                                    profileData.displayName ??
                                    navUser?.displayName ??
                                    navUser?.name ??
                                    ""
                                  }
                                />
                              </label>
                              <label>
                                <span>Legal Name</span>
                                <input
                                  name="fullName"
                                  onChange={(event) =>
                                    updateProfileField(
                                      "fullName",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Enter legal name"
                                  value={profileData.fullName ?? ""}
                                />
                              </label>
                              <label>
                                <span>Phone Number</span>
                                <input
                                  name="phone"
                                  onChange={(event) =>
                                    updateProfileField(
                                      "phone",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Enter phone number"
                                  value={profileData.phone ?? ""}
                                />
                              </label>
                              <label>
                                <span>Profile Visibility</span>
                                <select
                                  name="profileVisibility"
                                  onChange={(event) =>
                                    updateProfileField(
                                      "profileVisibility",
                                      event.target.value === "public"
                                        ? "public"
                                        : "private",
                                    )
                                  }
                                  value={
                                    profileData.profileVisibility ?? "private"
                                  }
                                >
                                  <option value="private">Private</option>
                                  <option value="public">Public</option>
                                </select>
                              </label>
                              <label className={styles.bioField}>
                                <span>Creator Bio</span>
                                <textarea
                                  name="bio"
                                  onChange={(event) =>
                                    updateProfileField(
                                      "bio",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Write a public creator bio"
                                  value={profileData.bio ?? ""}
                                />
                              </label>
                              <label>
                                <span>Avatar Frame</span>
                                <select
                                  name="avatarFrame"
                                  onChange={(event) =>
                                    updateProfileField(
                                      "avatarFrame",
                                      event.target.value,
                                    )
                                  }
                                  value={profileData.avatarFrame ?? "none"}
                                >
                                  <option value="none">None</option>
                                  {(accountData?.avatarFrameStyles ?? []).map(
                                    (style) => (
                                      <option key={style.key} value={style.key}>
                                        {style.title}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>
                              <FrameButton
                                className={styles.frameButtonText}
                                height={42}
                                size="compact"
                                type="submit"
                                variant="gold"
                                width={174}
                              >
                                Save Profile
                              </FrameButton>
                            </form>

                            <form
                              className={styles.passwordPanel}
                              onSubmit={savePassword}
                            >
                              <div>
                                <span>Password</span>
                                <strong>Change Password</strong>
                                <p>
                                  Submit current password, new password, and
                                  confirmation to account security.
                                </p>
                              </div>
                              <div className={styles.passwordFields}>
                                <input
                                  name="currentPassword"
                                  placeholder="Current password"
                                  type="password"
                                />
                                <input
                                  name="newPassword"
                                  placeholder="New password"
                                  type="password"
                                />
                                <input
                                  name="confirmNewPassword"
                                  placeholder="Confirm password"
                                  type="password"
                                />
                              </div>
                              <FrameButton
                                className={styles.frameButtonText}
                                height={42}
                                size="compact"
                                type="submit"
                                variant="gold"
                                width={174}
                              >
                                Save Password
                              </FrameButton>
                              {saveMessage ? (
                                <p className={styles.saveMessage}>
                                  {saveMessage}
                                </p>
                              ) : null}
                            </form>
                          </div>
                        ) : (
                          <>
                            <div className={styles.recordsToolbar}>
                              <label>
                                <span>Search</span>
                                <input
                                  onChange={(event) =>
                                    setRecordSearch(event.target.value)
                                  }
                                  placeholder={`Search ${activeConfig.label.toLowerCase()}`}
                                  value={recordSearch}
                                />
                              </label>
                              <label>
                                <span>Range</span>
                                <select
                                  onChange={(event) =>
                                    setRecordRange(event.target.value)
                                  }
                                  value={recordRange}
                                >
                                  <option value="7d">Last 7 days</option>
                                  <option value="30d">Last 30 days</option>
                                  <option value="all">All records</option>
                                </select>
                              </label>
                              <FrameButton
                                className={styles.frameButtonText}
                                height={40}
                                onClick={downloadCsv}
                                size="compact"
                                type="button"
                                variant="gold"
                                width={146}
                              >
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
                                {pagedRows.map((row) => (
                                  <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{row.type}</td>
                                    <td>{row.item}</td>
                                    <td>{row.status}</td>
                                    <td className={styles.amountCell}>
                                      {row.amount}
                                    </td>
                                    <td>{row.time}</td>
                                  </tr>
                                ))}
                                {pagedRows.length === 0 ? (
                                  <tr>
                                    <td colSpan={6}>No matching records.</td>
                                  </tr>
                                ) : null}
                              </tbody>
                            </table>

                            <nav
                              aria-label="Record pagination"
                              className={styles.pagination}
                            >
                              <button
                                aria-label="Previous page"
                                disabled={currentRecordPage <= 1}
                                onClick={() =>
                                  setRecordPage((page) => Math.max(1, page - 1))
                                }
                                type="button"
                              >
                                {"<"}
                              </button>
                              {Array.from(
                                { length: totalRecordPages },
                                (_, index) => String(index + 1),
                              ).map((item) => (
                                <button
                                  aria-current={
                                    Number(item) === currentRecordPage
                                      ? "page"
                                      : undefined
                                  }
                                  className={
                                    Number(item) === currentRecordPage
                                      ? styles.currentPage
                                      : undefined
                                  }
                                  key={item}
                                  onClick={() => setRecordPage(Number(item))}
                                  type="button"
                                >
                                  {item}
                                </button>
                              ))}
                              <button
                                aria-label="Next page"
                                disabled={currentRecordPage >= totalRecordPages}
                                onClick={() =>
                                  setRecordPage((page) =>
                                    Math.min(totalRecordPages, page + 1),
                                  )
                                }
                                type="button"
                              >
                                {">"}
                              </button>
                              <button
                                className={styles.pageSizeButton}
                                type="button"
                              >
                                <span>10 / Page</span>
                                <span
                                  className={styles.pageSizeChevron}
                                  aria-hidden="true"
                                />
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
        </AuthModalStage>
      </div>
    </main>
  );
}
