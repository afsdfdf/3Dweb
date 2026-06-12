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
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  ClipboardList,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  ReceiptText,
  Save,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";

import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { BorderComboFrame2 } from "@/components/ui-lab/border-combo-frame-2";
import { CreditTopupRedemptionDialog } from "@/components/ui-lab/credit-topup-redemption-dialog";
import { TopNavigation } from "@/components/ui-lab/top-navigation";
import type { CreditTopupProduct } from "@/lib/creditTopupProducts";
import {
  resolvePublicNavigationItems,
  type PublicNavigationInputItem,
} from "@/lib/publicNavigation";
import type { NavigationPromotionContent } from "@/app/(frontend)/_lib/marketing-content";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

import styles from "./account-center.module.css";

export type AccountSection =
  | "models"
  | "orders"
  | "points-history"
  | "profile"
  | "tasks";

type EditableField = "avatar" | "background" | "displayName" | "password";
type ModelVisibility = "private" | "public";

type RecordRow = {
  actionLabel?: string;
  amount: string;
  href?: string;
  id: string;
  item: string;
  status: string;
  time: string;
  type: string;
  visibility?: ModelVisibility;
};

type RecordSection = Exclude<AccountSection, "points-history" | "profile">;
type RowSection = RecordSection | "billing";

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
  rows?: Partial<Record<RowSection, RecordRow[]>>;
};

type AccountCenterProps = {
  accountData?: AccountCenterData;
  creditTopupProducts?: CreditTopupProduct[];
  initialSection?: AccountSection;
  navigationItems?: null | PublicNavigationInputItem[];
  navigationPromotion?: NavigationPromotionContent | null;
  navUser?: null | {
    avatarUrl?: null | string;
    credits?: null | number;
    creditsBalance?: null | number;
    displayName?: null | string;
    email?: null | string;
    hasActiveSubscription?: boolean | null;
    name?: null | string;
  };
};

const emptyRowsBySection: Record<RowSection, RecordRow[]> = {
  billing: [],
  models: [],
  orders: [],
  tasks: [],
};

const profileImageAccept = "image/jpeg,image/png,image/webp";
const profileImageTypes = new Set(profileImageAccept.split(","));
const displayNameMaxLength = 32;
const pointsPageSize = 10;
const defaultRecordPageSize = 10;
const minRecordPageSize = 6;
const maxRecordPageSize = 14;
const compactDesktopQuery = "(min-width: 981px) and (max-height: 980px)";

const normalizeAccountSection = (
  value?: null | string,
  fallback: AccountSection = "profile",
): AccountSection => {
  if (value === "billing" || value === "points-history") return "points-history";
  if (value === "models" || value === "orders" || value === "tasks") {
    return value;
  }
  if (value === "overview" || value === "profile" || value === "settings") {
    return "profile";
  }
  return fallback;
};

const formatNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    Number.isFinite(number) ? number : 0,
  );
};

const limitTextLength = (value: string, maxLength: number) => {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
};

const getBalanceValue = (row: RecordRow) => {
  const match = /^Balance\s+(.+)$/i.exec(row.status);
  return match?.[1] || row.status || "-";
};

export function AccountCenter({
  accountData,
  creditTopupProducts = [],
  initialSection = "profile",
  navigationItems,
  navigationPromotion,
  navUser = null,
}: AccountCenterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const accountContentViewportRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] =
    useState<AccountSection>(initialSection);
  const [profileData, setProfileData] = useState<AccountCenterData>(
    accountData ?? {},
  );
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [passwordDraft, setPasswordDraft] = useState({
    confirmNewPassword: "",
    currentPassword: "",
    newPassword: "",
  });
  const [recordPage, setRecordPage] = useState(1);
  const [recordPageSize, setRecordPageSize] = useState(defaultRecordPageSize);
  const [statusMessage, setStatusMessage] = useState("");
  const [isCreditTopupOpen, setIsCreditTopupOpen] = useState(false);
  const [rowsData, setRowsData] = useState<
    Partial<Record<RowSection, RecordRow[]>>
  >(accountData?.rows ?? {});
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState<
    null | string
  >(null);

  const topNavigationItems = useMemo(
    () => resolvePublicNavigationItems(navigationItems),
    [navigationItems],
  );

  useEffect(() => {
    setActiveSection(normalizeAccountSection(sectionParam, initialSection));
  }, [initialSection, sectionParam]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlHeight = html.style.height;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyHeight = body.style.height;
    const previousBodyOverflow = body.style.overflow;

    html.style.height = "100%";
    html.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.overflow = "hidden";

    return () => {
      html.style.height = previousHtmlHeight;
      html.style.overflow = previousHtmlOverflow;
      body.style.height = previousBodyHeight;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    setProfileData(accountData ?? {});
    setRowsData(accountData?.rows ?? {});
  }, [accountData]);

  useEffect(() => {
    setRecordPage(1);
  }, [activeSection]);

  useEffect(() => {
    const viewport = accountContentViewportRef.current;
    if (!viewport) return;

    const calculateRecordPageSize = () => {
      const isCompactDesktop = window.matchMedia(compactDesktopQuery).matches;
      const rowHeight = isCompactDesktop ? 37 : 44;
      const sectionHeaderHeight = isCompactDesktop ? 22 : 24;
      const sectionHeaderGap = isCompactDesktop ? 6 : 12;
      const paginationGap = isCompactDesktop ? 6 : 16;
      const paginationHeight = isCompactDesktop ? 28 : 30;
      const fixedHeight =
        sectionHeaderHeight +
        sectionHeaderGap +
        rowHeight +
        paginationGap +
        paginationHeight +
        2;
      const nextPageSize = Math.min(
        maxRecordPageSize,
        Math.max(
          minRecordPageSize,
          Math.floor((viewport.clientHeight - fixedHeight) / rowHeight),
        ),
      );

      setRecordPageSize((current) =>
        current === nextPageSize ? current : nextPageSize,
      );
    };

    calculateRecordPageSize();

    const resizeObserver = new ResizeObserver(calculateRecordPageSize);
    resizeObserver.observe(viewport);
    window.addEventListener("resize", calculateRecordPageSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateRecordPageSize);
    };
  }, [activeSection]);

  const displayName =
    profileData.displayName ||
    navUser?.displayName ||
    navUser?.name ||
    navUser?.email ||
    "Adventurer";
  const email =
    profileData.email || navUser?.email || "Registration email unavailable";
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
    billingCount: accountData?.rows?.billing?.length ?? 0,
    modelCount: accountData?.rows?.models?.length ?? 0,
    orderCount: accountData?.rows?.orders?.length ?? 0,
    taskCount: accountData?.rows?.tasks?.length ?? 0,
  };
  const rowsBySection = useMemo<Record<RowSection, RecordRow[]>>(
    () => ({
      billing: rowsData.billing ?? emptyRowsBySection.billing,
      models: rowsData.models ?? emptyRowsBySection.models,
      orders: rowsData.orders ?? emptyRowsBySection.orders,
      tasks: rowsData.tasks ?? emptyRowsBySection.tasks,
    }),
    [rowsData],
  );
  const pointRows = rowsBySection.billing;
  const recordSection =
    activeSection === "models" ||
    activeSection === "orders" ||
    activeSection === "tasks"
      ? activeSection
      : null;
  const recordRows = recordSection ? rowsBySection[recordSection] : [];
  const totalPointPages = Math.max(
    1,
    Math.ceil(pointRows.length / pointsPageSize),
  );
  const totalRecordPages = Math.max(
    1,
    Math.ceil(recordRows.length / recordPageSize),
  );
  const currentPointPage = Math.min(recordPage, totalPointPages);
  const currentRecordPage = Math.min(recordPage, totalRecordPages);
  const pagedPointRows = pointRows.slice(
    (currentPointPage - 1) * pointsPageSize,
    currentPointPage * pointsPageSize,
  );
  const pagedRecordRows = recordRows.slice(
    (currentRecordPage - 1) * recordPageSize,
    currentRecordPage * recordPageSize,
  );
  const placeholderRows = Array.from(
    {
      length: Math.max(0, pointsPageSize - (pagedPointRows.length || 1)),
    },
    (_, index) => index,
  );
  const recordPlaceholderRows = Array.from(
    {
      length: Math.max(0, recordPageSize - (pagedRecordRows.length || 1)),
    },
    (_, index) => index,
  );
  const accountTabs: {
    count?: number;
    icon: typeof UserRound;
    id: AccountSection;
    label: string;
  }[] = [
    { icon: UserRound, id: "profile", label: "PROFILE" },
    {
      count: accountMetrics.billingCount,
      icon: ReceiptText,
      id: "points-history",
      label: "POINTS HISTORY",
    },
    {
      count: accountMetrics.orderCount,
      icon: ClipboardList,
      id: "orders",
      label: "ORDERS",
    },
    {
      count: accountMetrics.modelCount,
      icon: Box,
      id: "models",
      label: "MODEL LIBRARY",
    },
    {
      count: accountMetrics.taskCount,
      icon: WandSparkles,
      id: "tasks",
      label: "GENERATION TASKS",
    },
  ];
  const isEditing = (field: EditableField) => editingField === field;
  const editLocked = (field: EditableField) =>
    Boolean(editingField && editingField !== field);
  const isSavingDisplayName =
    isEditing("displayName") && statusMessage === "Saving account name...";

  function openRecordHref(href: string) {
    if (/^https?:\/\//i.test(href)) {
      window.location.href = href;
      return;
    }

    router.push(href);
  }

  function getModelVisibilityLabel(visibility?: ModelVisibility) {
    return visibility === "public" ? "Public" : "Hidden";
  }

  async function toggleModelVisibility(row: RecordRow) {
    if (visibilityUpdatingId) return;

    const currentVisibility =
      row.visibility === "public" ? "public" : "private";
    const nextVisibility =
      currentVisibility === "public" ? "private" : "public";

    setVisibilityUpdatingId(row.id);
    setStatusMessage("Updating model visibility...");

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

      const updatedVisibility =
        payload.model?.visibility === "public" ? "public" : "private";

      setRowsData((current) => ({
        ...current,
        models: (current.models ?? []).map((modelRow) =>
          modelRow.id === row.id
            ? {
                ...modelRow,
                type: getModelVisibilityLabel(updatedVisibility),
                visibility: updatedVisibility,
              }
            : modelRow,
        ),
      }));
      setStatusMessage("Model visibility updated.");
      router.refresh();
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Model visibility update failed.",
      );
    } finally {
      setVisibilityUpdatingId(null);
    }
  }

  function changeSection(section: AccountSection) {
    setActiveSection(section);
    setRecordPage(1);
    setStatusMessage("");
    setEditingField(null);
    router.replace(
      section === "profile"
        ? "/account"
        : `/account?section=${encodeURIComponent(section)}`,
      { scroll: false },
    );
  }

  function startDisplayNameEdit() {
    if (editLocked("displayName")) return;
    setDisplayNameDraft(displayName);
    setEditingField("displayName");
    setStatusMessage("");
  }

  function startPasswordEdit() {
    if (editLocked("password")) return;
    setPasswordDraft({
      confirmNewPassword: "",
      currentPassword: "",
      newPassword: "",
    });
    setEditingField("password");
    setStatusMessage("");
  }

  function cancelEdit() {
    setEditingField(null);
    setStatusMessage("");
  }

  async function saveDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextDisplayName = limitTextLength(
      displayNameDraft.trim(),
      displayNameMaxLength,
    );
    setStatusMessage("Saving account name...");

    try {
      const response = await fetch("/api/account/profile", {
        body: JSON.stringify({ displayName: nextDisplayName }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Account name save failed.");
      }

      setProfileData((current) => ({ ...current, ...(payload.profile ?? {}) }));
      setEditingField(null);
      setStatusMessage("Account name saved.");
      router.refresh();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Account name save failed.",
      );
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("Saving password...");

    try {
      const response = await fetch("/api/account/password", {
        body: JSON.stringify(passwordDraft),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Password update failed.");
      }

      setPasswordDraft({
        confirmNewPassword: "",
        currentPassword: "",
        newPassword: "",
      });
      setEditingField(null);
      setStatusMessage("Password updated.");
      router.refresh();
    } catch (error) {
      setStatusMessage(
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

    setStatusMessage(
      purpose === "avatar"
        ? "Uploading avatar..."
        : "Uploading profile background...",
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
          ? { avatar: completedMedia.mediaId }
          : { profileBackground: completedMedia.mediaId },
      ),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const profilePayload = await profileResponse.json().catch(() => ({}));

    if (!profileResponse.ok) {
      throw new Error(
        profilePayload.message || "Profile media link update failed.",
      );
    }

    setProfileData((current) => ({
      ...current,
      ...(profilePayload.profile ?? {}),
    }));
    setEditingField(null);
    setStatusMessage(
      purpose === "avatar" ? "Avatar saved." : "Profile background saved.",
    );
    router.refresh();
  }

  async function handleMediaFileChange(
    event: ChangeEvent<HTMLInputElement>,
    purpose: "avatar" | "profile-banner",
  ) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) {
      setEditingField(null);
      return;
    }

    setEditingField(purpose === "avatar" ? "avatar" : "background");

    try {
      await uploadProfileMedia(file, purpose);
    } catch (error) {
      setEditingField(null);
      setStatusMessage(
        error instanceof Error ? error.message : "Profile media upload failed.",
      );
    }
  }

  function editAvatar() {
    if (editLocked("avatar")) return;
    setStatusMessage("");
    avatarInputRef.current?.click();
  }

  function editBackground() {
    if (editLocked("background")) return;
    setStatusMessage("");
    bannerInputRef.current?.click();
  }

  return (
    <main className={styles.pageShell}>
      <AuthModalStage>
        <TopNavigation
          active="ACCOUNT"
          className={styles.boundTopNavigation}
          creditTopupProducts={creditTopupProducts}
          fitViewport
          items={topNavigationItems}
          subscriptionPromotion={navigationPromotion}
          user={navUser}
        />
        <CreditTopupRedemptionDialog
          onOpenChange={setIsCreditTopupOpen}
          open={isCreditTopupOpen}
          products={creditTopupProducts}
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

        <section aria-label="Account" className={styles.accountShell}>
          <BorderComboFrame2 className={styles.accountFrame}>
            <div className={styles.accountChrome}>
              <header className={styles.accountTitleRow}>
                <span className={styles.accountFrameLogo} aria-hidden="true" />
                <h1>Account</h1>
                <span className={styles.accountFrameDivider} aria-hidden="true" />
              </header>
            </div>

            <div className={styles.accountBody}>
              <nav className={styles.secondaryTabs} aria-label="Account sections">
                {accountTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      aria-pressed={activeSection === tab.id}
                      className={
                        activeSection === tab.id ? styles.tabActive : undefined
                      }
                      key={tab.id}
                      onClick={() => changeSection(tab.id)}
                      type="button"
                    >
                      <Icon aria-hidden="true" size={16} />
                      <span>{tab.label}</span>
                      {typeof tab.count === "number" ? (
                        <em>{formatNumber(tab.count)}</em>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
              <div
                className={styles.accountContentViewport}
                ref={accountContentViewportRef}
              >
                {activeSection === "profile" ? (
                  <section className={styles.profilePane} aria-label="Profile">
                <div className={styles.profileField}>
                  <span className={styles.fieldLabel}>Avatar</span>
                  <div className={styles.avatarEditor}>
                    <span className={styles.avatarRing}>
                      <img alt={displayName} src={avatarUrl} />
                      {selectedAvatarFrameUrl ? (
                        <img
                          alt=""
                          aria-hidden="true"
                          className={styles.avatarFrameImage}
                          src={selectedAvatarFrameUrl}
                        />
                      ) : null}
                    </span>
                    <button
                      className={styles.editButton}
                      disabled={editLocked("avatar")}
                      onClick={editAvatar}
                      type="button"
                    >
                      <Edit3 aria-hidden="true" size={14} />
                      <span>{isEditing("avatar") ? "UPLOADING" : "EDIT"}</span>
                    </button>
                  </div>
                </div>

                <form className={styles.profileField} onSubmit={saveDisplayName}>
                  <span className={styles.fieldLabel}>Account Name</span>
                  <p className={styles.fieldHelp}>
                    Please enter 4-32 valid characters (letters, numbers or hyphens)
                  </p>
                  <div className={styles.inlineEditor}>
                    <input
                      disabled={!isEditing("displayName")}
                      maxLength={displayNameMaxLength}
                      onChange={(event) =>
                        setDisplayNameDraft(
                          limitTextLength(
                            event.target.value,
                            displayNameMaxLength,
                          ),
                        )
                      }
                      value={
                        isEditing("displayName")
                          ? displayNameDraft
                          : displayName
                      }
                    />
                    {isEditing("displayName") ? (
                      <>
                        <button
                          aria-label={
                            isSavingDisplayName
                              ? "Saving account name..."
                              : "Save account name"
                          }
                          className={styles.editButton}
                          disabled={isSavingDisplayName}
                          type="submit"
                        >
                          <Save aria-hidden="true" size={14} />
                          <span>{isSavingDisplayName ? "SAVING" : "SAVE"}</span>
                        </button>
                        <button
                          aria-label="Cancel account name edit"
                          className={styles.iconButton}
                          onClick={cancelEdit}
                          type="button"
                        >
                          <X aria-hidden="true" size={15} />
                        </button>
                      </>
                    ) : (
                      <button
                        className={styles.editButton}
                        disabled={editLocked("displayName")}
                        onClick={startDisplayNameEdit}
                        type="button"
                      >
                        <Edit3 aria-hidden="true" size={14} />
                        <span>EDIT</span>
                      </button>
                    )}
                  </div>
                </form>

                <div className={styles.profileField}>
                  <span className={styles.fieldLabel}>Background</span>
                  <p className={styles.fieldHelp}>
                    Supported image formats: JPEG, JPG, PNG, WEBP. Maximum file size: 5MB
                  </p>
                  <div className={styles.backgroundPreview}>
                    <img alt="" src={backgroundUrl} />
                    <button
                      className={styles.backgroundEditButton}
                      disabled={editLocked("background")}
                      onClick={editBackground}
                      type="button"
                    >
                      <Edit3 aria-hidden="true" size={14} />
                      <span>{isEditing("background") ? "UPLOADING" : "EDIT"}</span>
                    </button>
                  </div>
                </div>

                <div className={styles.profileField}>
                  <span className={styles.fieldLabel}>Email</span>
                  <p className={styles.fieldHelp}>Email used for registration</p>
                  <div className={styles.inlineEditor}>
                    <input disabled value={email} />
                    <button
                      className={styles.editButton}
                      disabled
                      title="Registration email is managed by sign-in settings."
                      type="button"
                    >
                      <Edit3 aria-hidden="true" size={14} />
                      <span>EDIT</span>
                    </button>
                  </div>
                </div>

                <form className={styles.profileField} onSubmit={savePassword}>
                  <span className={styles.fieldLabel}>Password</span>
                  <p className={styles.fieldHelp}>Change your password</p>
                  {isEditing("password") ? (
                    <div className={styles.passwordEditor}>
                      <input
                        autoComplete="current-password"
                        onChange={(event) =>
                          setPasswordDraft((current) => ({
                            ...current,
                            currentPassword: event.target.value,
                          }))
                        }
                        placeholder="Current password"
                        type="password"
                        value={passwordDraft.currentPassword}
                      />
                      <input
                        autoComplete="new-password"
                        onChange={(event) =>
                          setPasswordDraft((current) => ({
                            ...current,
                            newPassword: event.target.value,
                          }))
                        }
                        placeholder="New password"
                        type="password"
                        value={passwordDraft.newPassword}
                      />
                      <input
                        autoComplete="new-password"
                        onChange={(event) =>
                          setPasswordDraft((current) => ({
                            ...current,
                            confirmNewPassword: event.target.value,
                          }))
                        }
                        placeholder="Confirm password"
                        type="password"
                        value={passwordDraft.confirmNewPassword}
                      />
                      <button className={styles.editButton} type="submit">
                        <Save aria-hidden="true" size={14} />
                        <span>SAVE</span>
                      </button>
                      <button
                        aria-label="Cancel password edit"
                        className={styles.iconButton}
                        onClick={cancelEdit}
                        type="button"
                      >
                        <X aria-hidden="true" size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.inlineEditor}>
                      <input disabled type="password" value="******" />
                      <button
                        className={styles.editButton}
                        disabled={editLocked("password")}
                        onClick={startPasswordEdit}
                        type="button"
                      >
                        <Edit3 aria-hidden="true" size={14} />
                        <span>EDIT</span>
                      </button>
                    </div>
                  )}
                </form>

                {statusMessage ? (
                  <p
                    aria-live="polite"
                    className={styles.statusMessage}
                    role="status"
                  >
                    {statusMessage}
                  </p>
                ) : null}
                  </section>
                ) : activeSection === "points-history" ? (
                  <section
                    className={styles.pointsPane}
                    aria-label="Points history"
                  >
                <div className={styles.balancePlate}>
                  <div>
                    <strong>{formattedCredits}</strong>
                    <span>POINTS</span>
                  </div>
                  <em>BALANCE</em>
                  <button onClick={() => setIsCreditTopupOpen(true)} type="button">
                    RECHARGE
                  </button>
                </div>

                <div className={styles.pointsHeader}>
                  <h2>Points History</h2>
                </div>

                <div className={styles.pointsTableWrap}>
                  <table className={styles.pointsTable}>
                    <thead>
                      <tr>
                        <th>NO.</th>
                        <th>OPERATION</th>
                        <th>POINTS</th>
                        <th>POINTS</th>
                        <th>DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPointRows.map((row, index) => (
                        <tr key={`${row.id}-${index}`}>
                          <td>
                            {(currentPointPage - 1) * pointsPageSize + index + 1}
                          </td>
                          <td>{row.type || row.item}</td>
                          <td className={styles.pointDelta}>{row.amount}</td>
                          <td className={styles.pointBalance}>
                            {getBalanceValue(row)}
                          </td>
                          <td>{row.time}</td>
                        </tr>
                      ))}
                      {pagedPointRows.length === 0 ? (
                        <tr>
                          <td colSpan={5}>No points records yet.</td>
                        </tr>
                      ) : null}
                      {placeholderRows.map((index) => (
                        <tr
                          aria-hidden="true"
                          className={styles.placeholderRow}
                          key={`placeholder-${index}`}
                        >
                          <td />
                          <td />
                          <td />
                          <td />
                          <td />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <nav className={styles.pagination} aria-label="Points pages">
                  <button
                    aria-label="Previous page"
                    disabled={currentPointPage <= 1}
                    onClick={() => setRecordPage((page) => Math.max(1, page - 1))}
                    type="button"
                  >
                    {"<"}
                  </button>
                  <span aria-current="page" className={styles.pageIndicator}>
                    {currentPointPage} / {totalPointPages}
                  </span>
                  <button
                    aria-label="Next page"
                    disabled={currentPointPage >= totalPointPages}
                    onClick={() =>
                      setRecordPage((page) =>
                        Math.min(totalPointPages, page + 1),
                      )
                    }
                    type="button"
                  >
                    {">"}
                  </button>
                  <span className={styles.pageSizeLabel}>
                    {pointsPageSize} Items / Page
                  </span>
                </nav>
                  </section>
                ) : (
                  <section
                    className={styles.recordsPane}
                    aria-label={`${activeSection} records`}
                  >
                    <div className={styles.recordsHeader}>
                      <h2>
                        {activeSection === "orders"
                          ? "Orders"
                          : activeSection === "models"
                            ? "Model Library"
                            : "Generation Tasks"}
                      </h2>
                      <span>
                        {formatNumber(recordRows.length)} RECORDS
                      </span>
                    </div>

                    <div className={styles.pointsTableWrap}>
                      <table className={styles.recordsTable}>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>TYPE</th>
                            <th>ITEM</th>
                            <th>STATUS</th>
                            <th>AMOUNT</th>
                            <th>TIME</th>
                            <th>OPEN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRecordRows.map((row) => (
                            <tr key={row.id}>
                              <td title={row.id}>{row.id}</td>
                              <td
                                title={
                                  activeSection === "models"
                                    ? getModelVisibilityLabel(row.visibility)
                                    : row.type
                                }
                              >
                                {activeSection === "models" ? (
                                  <button
                                    aria-label={`Set ${row.item} visibility to ${
                                      row.visibility === "public"
                                        ? "hidden"
                                        : "public"
                                    }`}
                                    className={`${styles.visibilityToggle} ${
                                      row.visibility === "public"
                                        ? styles.visibilityPublic
                                        : styles.visibilityHidden
                                    }`}
                                    disabled={visibilityUpdatingId === row.id}
                                    onClick={() => void toggleModelVisibility(row)}
                                    type="button"
                                  >
                                    {row.visibility === "public" ? (
                                      <Eye aria-hidden="true" size={14} />
                                    ) : (
                                      <EyeOff aria-hidden="true" size={14} />
                                    )}
                                    <span>
                                      {visibilityUpdatingId === row.id
                                        ? "Saving"
                                        : getModelVisibilityLabel(row.visibility)}
                                    </span>
                                  </button>
                                ) : (
                                  row.type
                                )}
                              </td>
                              <td title={row.item}>{row.item}</td>
                              <td title={row.status}>{row.status}</td>
                              <td className={styles.pointDelta}>
                                {row.amount}
                              </td>
                              <td title={row.time}>{row.time}</td>
                              <td className={styles.recordActionCell}>
                                {row.href ? (
                                  <button
                                    className={styles.tableActionButton}
                                    onClick={() => openRecordHref(row.href!)}
                                    type="button"
                                  >
                                    <span>{row.actionLabel ?? "OPEN"}</span>
                                    <ExternalLink aria-hidden="true" size={13} />
                                  </button>
                                ) : (
                                  <span aria-hidden="true">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {pagedRecordRows.length === 0 ? (
                            <tr>
                              <td colSpan={7}>No records yet.</td>
                            </tr>
                          ) : null}
                          {recordPlaceholderRows.map((index) => (
                            <tr
                              aria-hidden="true"
                              className={styles.placeholderRow}
                              key={`record-placeholder-${index}`}
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
                    </div>

                    {statusMessage ? (
                      <p className={styles.statusMessage}>{statusMessage}</p>
                    ) : null}

                    <nav className={styles.pagination} aria-label="Record pages">
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
                      <span aria-current="page" className={styles.pageIndicator}>
                        {currentRecordPage} / {totalRecordPages}
                      </span>
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
                      <span className={styles.pageSizeLabel}>
                        {recordPageSize} Items / Page
                      </span>
                    </nav>
                  </section>
                )}
              </div>
            </div>
          </BorderComboFrame2>
        </section>
      </AuthModalStage>
    </main>
  );
}
