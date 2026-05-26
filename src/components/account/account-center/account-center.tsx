"use client";

/* eslint-disable @next/next/no-img-element */
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Edit3,
  ExternalLink,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { TopNavigation } from "@/components/ui-lab/top-navigation";
import {
  getPublicNavigationActiveID,
  resolvePublicNavigationItems,
  type PublicNavigationInputItem,
} from "@/lib/publicNavigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

import styles from "./account-center.module.css";

type SectionId =
  | "overview"
  | "orders"
  | "models"
  | "tasks"
  | "billing"
  | "settings";

type RecordRow = {
  actionLabel?: string;
  amount: string;
  href?: string;
  id: string;
  item: string;
  status: string;
  time: string;
  type: string;
  visibility?: "private" | "public";
  visibilitySelectLabel?: string;
};

type SectionConfig = {
  id: SectionId;
  label: string;
  meta: string;
  value: string;
};

type OverviewMetricCard = {
  detail: string;
  label: string;
  section: Exclude<SectionId, "overview" | "settings">;
  value: string;
};

export type AccountCenterData = {
  avatarFrame?: null | string;
  avatarFrameStyles?: {
    frameImageUrl?: null | string;
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
    billingCount: number;
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

type AccountCenterProps = {
  accountData?: AccountCenterData;
  initialSection?: SectionId;
  navigationItems?: null | PublicNavigationInputItem[];
  navUser?: null | {
    avatarUrl?: null | string;
    credits?: null | number;
    creditsBalance?: null | number;
    displayName?: null | string;
    email?: null | string;
    name?: null | string;
  };
};

const emptyRowsBySection: Record<
  Exclude<SectionId, "overview" | "settings">,
  RecordRow[]
> = {
  billing: [],
  models: [],
  orders: [],
  tasks: [],
};

const detailTitleBySection: Record<SectionId, string> = {
  billing: "Credit ledger and payment activity",
  models: "Model library records",
  orders: "Order history and fulfillment status",
  overview: "Credits, tasks, orders, and model activity",
  settings: "Profile, visibility, and security",
  tasks: "Generation task history",
};

const formatNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    Number.isFinite(number) ? number : 0,
  );
};

const profileImageAccept = "image/jpeg,image/png,image/webp";
const profileImageTypes = new Set(profileImageAccept.split(","));
const displayNameMaxLength = 32;
const fullNameMaxLength = 64;

const limitTextLength = (value: string, maxLength: number) => {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
};

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

export function AccountCenter({
  accountData,
  initialSection = "overview",
  navigationItems,
  navUser = null,
}: AccountCenterProps) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);
  const [profileData, setProfileData] = useState<AccountCenterData>(
    accountData ?? {},
  );
  const [recordPage, setRecordPage] = useState(1);
  const [recordRange, setRecordRange] = useState("all");
  const [recordSearch, setRecordSearch] = useState("");
  const [recordMessage, setRecordMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState<
    null | string
  >(null);
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
  const selectedAvatarFrame =
    profileData.avatarFrame && profileData.avatarFrame !== "none"
      ? (profileData.avatarFrameStyles ?? []).find(
          (style) => style.key === profileData.avatarFrame,
        )
      : null;
  const selectedAvatarFrameUrl =
    selectedAvatarFrame?.frameImageUrl || selectedAvatarFrame?.thumbnailUrl || null;
  const topNavigationItems = useMemo(
    () => resolvePublicNavigationItems(navigationItems),
    [navigationItems],
  );
  const backgroundUrl =
    profileData.backgroundUrl ||
    "/ui-lab/model-detail-uicut/images/detail-side-banner.webp";
  const creditsBalance =
    profileData.creditsBalance ??
    navUser?.creditsBalance ??
    navUser?.credits ??
    0;
  const formattedCredits = formatNumber(creditsBalance);
  const accountMetrics = accountData?.metrics ?? {
    activeOrders: 0,
    activeTasks: 0,
    billingCount: 0,
    modelCount: 0,
    orderCount: 0,
    taskCount: 0,
  };
  const accountRowsBySection = useMemo(
    () => ({
      billing: accountData?.rows
        ? (accountData.rows.billing ?? [])
        : emptyRowsBySection.billing,
      models: accountData?.rows
        ? (accountData.rows.models ?? [])
        : emptyRowsBySection.models,
      orders: accountData?.rows
        ? (accountData.rows.orders ?? [])
        : emptyRowsBySection.orders,
      tasks: accountData?.rows
        ? (accountData.rows.tasks ?? [])
        : emptyRowsBySection.tasks,
    }),
    [accountData?.rows],
  );
  const [rowsBySection, setRowsBySection] = useState(accountRowsBySection);
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
        value: String(accountMetrics.orderCount ?? 0),
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
        value: String(accountMetrics.taskCount ?? 0),
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
  const isPanelRefreshAction =
    activeSection === "overview" || activeSection === "settings";
  const activeRecordSection =
    isPanelRefreshAction ? null : activeSection;
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
  const visibleRecordRowCount = pagedRows.length === 0 ? 1 : pagedRows.length;
  const placeholderRecordRows = Array.from(
    { length: Math.max(0, pageSize - visibleRecordRowCount) },
    (_, index) => index,
  );
  const overviewMetricCards: OverviewMetricCard[] = [
    {
      detail: "Saved models",
      label: "Model Library",
      section: "models",
      value: String(accountMetrics.modelCount || 0),
    },
    {
      detail: "Queued or processing",
      label: "Generation Tasks",
      section: "tasks",
      value: String(accountMetrics.activeTasks || 0),
    },
    {
      detail: "Active fulfillment",
      label: "Orders",
      section: "orders",
      value: String(accountMetrics.activeOrders || 0),
    },
    {
      detail: "Available credits",
      label: "Billing",
      section: "billing",
      value: formattedCredits,
    },
  ];
  const sectionInsights: Record<SectionId, { label: string; value: string }[]> =
    {
      overview: [
        { label: "Billing", value: formattedCredits },
        {
          label: "Generation Tasks",
          value: String(accountMetrics.activeTasks || 0),
        },
        {
          label: "Orders",
          value: String(accountMetrics.activeOrders || 0),
        },
      ],
      billing: [
        {
          label: "Transactions",
          value: String(
            accountMetrics.billingCount ?? rowsBySection.billing.length,
          ),
        },
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
  useEffect(() => {
    setProfileData(accountData ?? {});
  }, [accountData]);

  useEffect(() => {
    setRowsBySection(accountRowsBySection);
  }, [accountRowsBySection]);

  useEffect(() => {
    setRecordPage(1);
    setRecordMessage("");
  }, [activeSection, recordRange, recordSearch]);

  function updateProfileField<Key extends keyof AccountCenterData>(
    key: Key,
    value: AccountCenterData[Key],
  ) {
    setProfileData((current) => ({ ...current, [key]: value }));
  }

  function changeSection(section: SectionId) {
    setActiveSection(section);
    const target =
      section === "overview"
        ? "/account"
        : `/account?section=${encodeURIComponent(section)}`;
    router.replace(target, { scroll: false });
  }

  async function updateModelVisibility(
    row: RecordRow,
    nextVisibility: string,
  ) {
    if (!row.visibility) return;
    if (nextVisibility !== "public" && nextVisibility !== "private") return;
    if (nextVisibility === row.visibility) return;

    setRecordMessage("");
    setVisibilityUpdatingId(row.id);

    try {
      const response = await fetch(
        `/api/account/models/${encodeURIComponent(row.id)}/visibility`,
        {
          body: JSON.stringify({ visibility: nextVisibility }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        },
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Model visibility update failed.");
      }

      const visibility =
        payload.model?.visibility === "public" ? "public" : "private";
      setRowsBySection((current) => ({
        ...current,
        models: current.models.map((item) =>
          item.id === row.id
            ? {
                ...item,
                type: visibility,
                visibility,
                visibilitySelectLabel: "Model visibility",
              }
            : item,
        ),
      }));
      router.refresh();
    } catch (error) {
      setRecordMessage(
        error instanceof Error
          ? error.message
          : "Model visibility update failed.",
      );
    } finally {
      setVisibilityUpdatingId(null);
    }
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
          displayName: limitTextLength(
            String(formData.get("displayName") || ""),
            displayNameMaxLength,
          ),
          fullName: limitTextLength(
            String(formData.get("fullName") || ""),
            fullNameMaxLength,
          ),
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

    const finalPublicUrl =
      typeof completedMedia.publicUrl === "string" && completedMedia.publicUrl
        ? completedMedia.publicUrl
        : config.publicUrl;

    setProfileData((current) => ({
      ...current,
      ...(payload.profile ?? {}),
      ...(purpose === "avatar"
        ? { avatarUrl: finalPublicUrl }
        : { backgroundUrl: finalPublicUrl }),
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

  return (
    <main className={styles.pageShell}>
      <AuthModalStage>
        <TopNavigation
          active="ACCOUNT"
          className={styles.boundTopNavigation}
          fitViewport
          items={topNavigationItems}
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

        <section aria-label="Account center" className={styles.accountShell}>
          <header className={styles.accountHero}>
            <img
              alt=""
              aria-hidden="true"
              className={styles.accountHeroImage}
              decoding="async"
              src={backgroundUrl}
            />
            <div className={styles.accountHeroCopy}>
              <span className={styles.accountEyebrow}>Account Center</span>
              <h1>Manage your Tavern workspace</h1>
              <p>
                Review generated models, active tasks, print orders, billing,
                and profile settings from one focused control surface.
              </p>
            </div>
            <div className={styles.accountHeroStats}>
              {overviewMetricCards.slice(0, 3).map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </header>

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
                          {selectedAvatarFrameUrl ? (
                            <img
                              alt=""
                              aria-hidden="true"
                              className={styles.avatarFrameImage}
                              decoding="async"
                              src={selectedAvatarFrameUrl}
                            />
                          ) : null}
                          <button
                            aria-label="Change avatar"
                            className={styles.avatarEditButton}
                            onClick={() => avatarInputRef.current?.click()}
                            type="button"
                          >
                            <Edit3 aria-hidden="true" size={13} />
                            Edit
                          </button>
                        </div>
                        <div>
                          <p>Personal Center</p>
                          <h1 title={displayName}>{displayName}</h1>
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
                          aria-label="Change profile background"
                          className={styles.backgroundEditButton}
                          onClick={() => bannerInputRef.current?.click()}
                          type="button"
                        >
                          <Edit3 aria-hidden="true" size={13} />
                          Edit
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
                            onClick={() => changeSection(section.id)}
                            type="button"
                          >
                            <strong>{section.label}</strong>
                            <em>{section.value}</em>
                          </button>
                        ))}
                      </nav>

                      <div className={styles.primaryActions}>
                        <button
                          className={`${styles.accountButton} ${styles.accountButtonPrimary} ${styles.accountButtonFull}`}
                          onClick={() => router.push("/workbench")}
                          type="button"
                        >
                          <Plus aria-hidden="true" size={16} />
                          Create Model
                        </button>
                        <button
                          className={`${styles.accountButton} ${styles.accountButtonSecondary} ${styles.accountButtonFull}`}
                          onClick={() => router.push("/pricing")}
                          type="button"
                        >
                          <WalletCards aria-hidden="true" size={16} />
                          Recharge Credits
                        </button>
                      </div>
                    </div>
                  </aside>

                  <section className={styles.accountPanel}>
                    <div className={styles.accountFrameContent}>
                      <section
                        className={`${styles.contentPanel} ${activeSection === "overview" ? styles.contentPanelWithSummary : styles.contentPanelFull}`}
                      >
                        <header className={styles.contentHeader}>
                          <div>
                            <p>{activeConfig.label}</p>
                            <h3>{detailTitleBySection[activeSection]}</h3>
                          </div>
                          <button
                            className={`${styles.accountButton} ${styles.accountButtonSecondary} ${styles.accountButtonCompact}`}
                            onClick={() => {
                              if (activeSection === "overview") {
                                router.refresh();
                              } else if (activeSection === "settings") {
                                router.refresh();
                              } else {
                                setRecordSearch((value) => value.trim());
                              }
                            }}
                            type="button"
                          >
                            <span
                              className={`${styles.panelActionIcon} ${
                                isPanelRefreshAction
                                  ? ""
                                  : styles.panelActionIconHidden
                              }`}
                            >
                              <RefreshCw aria-hidden="true" size={15} />
                            </span>
                            <span
                              className={`${styles.panelActionIcon} ${
                                isPanelRefreshAction
                                  ? styles.panelActionIconHidden
                                  : ""
                              }`}
                            >
                              <SlidersHorizontal aria-hidden="true" size={15} />
                            </span>
                            <span>{isPanelRefreshAction ? "Refresh" : "Apply"}</span>
                          </button>
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
                              <button
                                className={`${styles.accountButton} ${styles.accountButtonSecondary} ${styles.accountButtonCompact}`}
                                onClick={() => router.push("/workbench")}
                                type="button"
                              >
                                <Plus aria-hidden="true" size={16} />
                                Create Model
                              </button>
                            </section>

                            <section
                              className={styles.overviewGrid}
                              aria-label="Overview highlights"
                            >
                              {overviewMetricCards.map((item) => (
                                <button
                                  aria-label={`Open ${item.label}`}
                                  className={styles.metricCardButton}
                                  key={item.label}
                                  onClick={() => changeSection(item.section)}
                                  type="button"
                                >
                                  <span>{item.label}</span>
                                  <strong>{item.value}</strong>
                                  <em>{item.detail}</em>
                                </button>
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
                                  maxLength={displayNameMaxLength}
                                  onChange={(event) =>
                                    updateProfileField(
                                      "displayName",
                                      limitTextLength(
                                        event.target.value,
                                        displayNameMaxLength,
                                      ),
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
                                  maxLength={fullNameMaxLength}
                                  onChange={(event) =>
                                    updateProfileField(
                                      "fullName",
                                      limitTextLength(
                                        event.target.value,
                                        fullNameMaxLength,
                                      ),
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
                              <button
                                className={`${styles.accountButton} ${styles.accountButtonPrimary} ${styles.accountButtonWide}`}
                                type="submit"
                              >
                                Save Profile
                              </button>
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
                              <button
                                className={`${styles.accountButton} ${styles.accountButtonPrimary} ${styles.accountButtonWide}`}
                                type="submit"
                              >
                                Save Password
                              </button>
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
                                  <option value="all">All records</option>
                                  <option value="30d">Last 30 days</option>
                                  <option value="7d">Last 7 days</option>
                                </select>
                              </label>
                              <button
                                className={`${styles.accountButton} ${styles.accountButtonPrimary} ${styles.accountButtonCompact}`}
                                onClick={downloadCsv}
                                type="button"
                              >
                                <Download aria-hidden="true" size={15} />
                                Export CSV
                              </button>
                            </div>
                            {recordMessage ? (
                              <p className={styles.recordMessage}>
                                {recordMessage}
                              </p>
                            ) : null}

                            <table className={styles.recordsTable}>
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>Type</th>
                                  <th>Item</th>
                                  <th>Status</th>
                                  <th>Amount</th>
                                  <th>Time</th>
                                  <th>Open</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pagedRows.map((row) => (
                                  <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>
                                      {activeSection === "models" &&
                                      row.visibility ? (
                                        <span className={styles.visibilitySelectWrap}>
                                          <select
                                            aria-label={`${row.visibilitySelectLabel ?? "Model visibility"}: ${row.item}`}
                                            className={[
                                              styles.visibilitySelect,
                                              row.visibility === "public"
                                                ? styles.visibilitySelectPublic
                                                : "",
                                            ]
                                              .filter(Boolean)
                                              .join(" ")}
                                            disabled={
                                              visibilityUpdatingId === row.id
                                            }
                                            onChange={(event) =>
                                              void updateModelVisibility(
                                                row,
                                                event.target.value,
                                              )
                                            }
                                            value={row.visibility}
                                          >
                                            <option value="public">
                                              PUBLIC
                                            </option>
                                            <option value="private">
                                              PRIVATE
                                            </option>
                                          </select>
                                        </span>
                                      ) : (
                                        row.type
                                      )}
                                    </td>
                                    <td>{row.item}</td>
                                    <td>{row.status}</td>
                                    <td className={styles.amountCell}>
                                      {row.amount}
                                    </td>
                                    <td>{row.time}</td>
                                    <td className={styles.recordActionCell}>
                                      {row.href ? (
                                        <Link
                                          prefetch={false}
                                          className={styles.tableActionButton}
                                          href={row.href}
                                        >
                                          {row.actionLabel ?? "Open"}
                                          <ExternalLink
                                            aria-hidden="true"
                                            size={13}
                                          />
                                        </Link>
                                      ) : (
                                        <span aria-hidden="true">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {pagedRows.length === 0 ? (
                                  <tr>
                                    <td colSpan={7}>No matching records.</td>
                                  </tr>
                                ) : null}
                                {placeholderRecordRows.map((index) => (
                                  <tr
                                    aria-hidden="true"
                                    className={styles.recordPlaceholderRow}
                                    key={`placeholder-${index}`}
                                  >
                                    <td />
                                    <td />
                                    <td />
                                    <td />
                                    <td />
                                    <td />
                                    <td />
                                  </tr>
                                ))}
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
        </section>
      </AuthModalStage>
    </main>
  );
}
