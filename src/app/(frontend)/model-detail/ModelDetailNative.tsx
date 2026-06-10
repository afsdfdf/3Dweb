"use client";

import NextImage from "next/image";
import Link from "next/link";
import {
  OrangeMediumActionButton,
  SourcePurpleMediumButton,
} from "@/components/ui-lab/action-buttons";
import { apiFetch } from '@/app/(frontend)/_lib/apiFetch'
import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";
import { ModelAuthorCard } from "@/components/ui-lab/model-author-card";
import { ModelDetailAdBanner } from "@/components/ui-lab/model-detail-ad-banner";
import { ModelDownloadConfirmation } from "@/components/ui-lab/model-download-confirmation";
import type { TopNavigationUser } from "@/components/ui-lab/top-navigation";
import { getSupabasePreviewImageURL } from "@/lib/supabase/imageTransform";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PrintOrderDialog } from "../_components/PrintOrderDialog";
import { addModelToCart } from "../_lib/cartStorage";

const ModelViewer = dynamic(
  () => import("../_components/ModelViewer").then((m) => m.ModelViewer),
  { ssr: false, loading: () => null },
);
import { ModelDetailHeader } from "./ModelDetailHeader";
import type {
  ModelDetailData,
  ModelDetailSideModel,
  ModelDetailSideModelsPagination,
} from "./_lib/modelDetailData";
import styles from "./page.module.css";

const asset = (name: string) => `/ui-lab/model-detail-uicut/images/${name}`;

const detailBottomActionButtonStyle = {
  boxSizing: "border-box",
  height: 64,
  inset: 0,
  width: 198,
} as const;

const commentLimit = 3;
const mobileViewportMediaQuery = "(max-width: 767px)";

type ModelDetailNativeProps = {
  data: ModelDetailData;
  navUser?: null | TopNavigationUser;
};

type ActiveModel = {
  commentsCount: number;
  commentsEnabled: boolean;
  downloadCredits: number;
  downloadCreditsLabel: string;
  id: number;
  imageSrc: null | string;
  printReady: boolean;
  tags: string[];
  title: string;
  updatedLabel: string;
  viewerURL: null | string;
};

type ModelComment = {
  authorName: string;
  content: string;
  createdLabel: string;
  id: string;
};

const getInitialActiveModel = (detail: ModelDetailData): ActiveModel => ({
  commentsCount: detail.commentsCount,
  commentsEnabled: detail.commentsEnabled,
  downloadCredits: detail.downloadCredits,
  downloadCreditsLabel: detail.downloadCreditsLabel,
  id: detail.id,
  imageSrc: detail.inputPreviewSrc,
  printReady: detail.printReady,
  tags: detail.tags,
  title: detail.title,
  updatedLabel: detail.updatedLabel,
  viewerURL: detail.viewerURL,
});

const getActiveModelFromSideModel = (
  item: ModelDetailSideModel,
): ActiveModel => ({
  commentsCount: item.commentsCount,
  commentsEnabled: item.commentsEnabled,
  downloadCredits: item.downloadCredits,
  downloadCreditsLabel: item.downloadCreditsLabel,
  id: Number(item.id),
  imageSrc: item.imageSrc,
  printReady: item.printReady,
  tags: item.tags,
  title: item.title,
  updatedLabel: item.updatedLabel,
  viewerURL: item.viewerURL,
});

const normalizeSideModelPagination = (
  value: ModelDetailSideModelsPagination,
): ModelDetailSideModelsPagination => ({
  hasNextPage: value.hasNextPage === true,
  hasPrevPage: value.hasPrevPage === true,
  limit: Math.max(1, Number(value.limit) || 12),
  page: Math.max(1, Number(value.page) || 1),
  totalDocs: Math.max(0, Number(value.totalDocs) || 0),
  totalPages: Math.max(1, Number(value.totalPages) || 1),
});

const compactCountLabel = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
};

const formatCommentDate = (value: unknown) => {
  if (typeof value !== "string" || !value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

const normalizeComment = (value: unknown): null | ModelComment => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const content = typeof record.content === "string" ? record.content.trim() : "";
  if (!content) return null;

  return {
    authorName:
      typeof record.authorName === "string" && record.authorName.trim()
        ? record.authorName.trim()
        : "Member",
    content,
    createdLabel: formatCommentDate(record.createdAt),
    id: String(record.id ?? `${content}-${record.createdAt || ""}`),
  };
};

const getResponseMessage = async (response: Response, fallback: string) => {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : fallback;
  } catch {
    return fallback;
  }
};

const getDownloadFilename = (header: null | string, modelId: number) => {
  if (!header) return `model-${modelId}.glb`;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded?.[1]) return decodeURIComponent(encoded[1].replace(/"/g, ""));
  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const plain = header.match(/filename=([^;]+)/i);
  return plain?.[1]?.trim() || `model-${modelId}.glb`;
};

function useMobileDetailViewport() {
  const [isMobileViewport, setIsMobileViewport] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileViewportMediaQuery);
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  return isMobileViewport;
}

export default function ModelDetailNative({
  data,
  navUser = null,
}: ModelDetailNativeProps) {
  const detail = data;
  const { openAuthModal } = useAuthModal();
  const [activeModel, setActiveModel] = useState<ActiveModel>(() =>
    getInitialActiveModel(detail),
  );
  const modelImages = activeModel.imageSrc
    ? [activeModel.imageSrc]
    : detail.previewImages;
  const relatedScrollRef = useRef<HTMLDivElement | null>(null);
  const [slide, setSlide] = useState(0);
  const [relatedModels, setRelatedModels] = useState<ModelDetailSideModel[]>(
    detail.sideModels,
  );
  const [relatedPagination, setRelatedPagination] =
    useState<ModelDetailSideModelsPagination>(() =>
      normalizeSideModelPagination(detail.sideModelsPage),
    );
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<null | string>(null);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<null | string>(null);
  const [cartStatus, setCartStatus] = useState<null | string>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentFeedback, setCommentFeedback] = useState<null | string>(null);
  const [comments, setComments] = useState<ModelComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentTotal, setCommentTotal] = useState(activeModel.commentsCount);
  const [viewCount, setViewCount] = useState(detail.viewCount);
  const isMobileViewport = useMobileDetailViewport();
  const shouldRenderMobileViewer = isMobileViewport === true;
  const shouldRenderDesktopViewer = isMobileViewport === false;
  const activeModelId = String(activeModel.id);
  const downloadIsCharged =
    detail.chargeDownloadCredits && activeModel.downloadCredits > 0;
  const downloadURL = `/api/platform/models/${activeModel.id}/download?format=glb`;
  const downloadMessage = downloadIsCharged
    ? `Downloading this GLB file will cost ${activeModel.downloadCreditsLabel} points.`
    : "Download this GLB file for free.";
  const commentCountLabel = compactCountLabel(commentTotal);
  const viewCountLabel = compactCountLabel(viewCount);
  const canPrintActiveModel =
    detail.isOwnedByCurrentUser && activeModel.printReady;
  const printActionLabel = canPrintActiveModel
    ? "PRINT NOW"
    : detail.isOwnedByCurrentUser
      ? "REVIEW NEEDED"
      : "WORKBENCH";
  const visibleStatus = cartStatus || downloadStatus;

  const getCurrentRedirect = useCallback(() => {
    if (typeof window === "undefined") return `/model-detail?id=${activeModel.id}`;
    return `${window.location.pathname}${window.location.search}`;
  }, [activeModel.id]);

  const loadComments = useCallback(async () => {
    if (!activeModel.commentsEnabled) {
      setComments([]);
      setCommentTotal(0);
      setCommentFeedback(null);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);
    setCommentFeedback(null);

    try {
      const response = await apiFetch(
        `/api/social/models/${activeModel.id}/comments?limit=${commentLimit}`,
        { credentials: "same-origin" },
      );
      if (!response.ok) {
        throw new Error(
          await getResponseMessage(response, "Failed to load comments."),
        );
      }

      const payload = (await response.json()) as {
        docs?: unknown[];
        totalDocs?: unknown;
      };
      const nextComments = Array.isArray(payload.docs)
        ? payload.docs.map(normalizeComment).filter((item): item is ModelComment => Boolean(item))
        : [];
      const nextTotal = Number(payload.totalDocs ?? nextComments.length);

      setComments(nextComments);
      setCommentTotal(Number.isFinite(nextTotal) ? nextTotal : nextComments.length);
    } catch (error) {
      setComments([]);
      setCommentTotal(activeModel.commentsCount);
      setCommentFeedback(error instanceof Error ? error.message : "Failed to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  }, [activeModel.commentsCount, activeModel.commentsEnabled, activeModel.id]);

  const loadRelatedPage = useCallback(
    async (page: number) => {
      const nextPage = Math.max(1, Math.min(page, relatedPagination.totalPages));
      if (nextPage === relatedPagination.page || relatedLoading) return;

      setRelatedLoading(true);
      setRelatedError(null);

      try {
        const response = await apiFetch(
          `/api/platform/models/${activeModel.id}/related?page=${nextPage}&limit=${relatedPagination.limit}`,
          { credentials: "same-origin" },
        );
        if (!response.ok) {
          throw new Error(
            await getResponseMessage(response, "Failed to load models."),
          );
        }

        const payload = (await response.json()) as
          ModelDetailSideModelsPagination & {
            docs?: ModelDetailSideModel[];
          };
        const nextModels = Array.isArray(payload.docs) ? payload.docs : [];

        setRelatedModels(nextModels);
        setRelatedPagination(
          normalizeSideModelPagination({
            hasNextPage: payload.hasNextPage,
            hasPrevPage: payload.hasPrevPage,
            limit: payload.limit,
            page: payload.page,
            totalDocs: payload.totalDocs,
            totalPages: payload.totalPages,
          }),
        );
        relatedScrollRef.current?.scrollTo({ top: 0 });
      } catch (error) {
        setRelatedError(
          error instanceof Error ? error.message : "Failed to load models.",
        );
      } finally {
        setRelatedLoading(false);
      }
    },
    [
      activeModel.id,
      relatedLoading,
      relatedPagination.limit,
      relatedPagination.page,
      relatedPagination.totalPages,
    ],
  );

  useEffect(() => {
    setRelatedModels(detail.sideModels);
    setRelatedPagination(normalizeSideModelPagination(detail.sideModelsPage));
    setRelatedError(null);
  }, [detail.id, detail.sideModels, detail.sideModelsPage]);

  useEffect(() => {
    setCommentInput("");
    setCommentTotal(activeModel.commentsCount);
    void loadComments();
  }, [activeModel.commentsCount, activeModelId, loadComments]);

  useEffect(() => {
    setViewCount(detail.viewCount);
  }, [detail.id, detail.viewCount]);

  useEffect(() => {
    if (!detail.commentsEnabled) return;

    const controller = new AbortController();

    void apiFetch("/api/engagement/view", {
      body: JSON.stringify({
        targetId: detail.id,
        targetType: "model",
      }),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { counted?: unknown };
      })
      .then((payload) => {
        if (payload?.counted === true) {
          setViewCount((current) => current + 1);
        }
      })
      .catch(() => {
        // Engagement tracking is best-effort; the detail page should stay readable.
      });

    return () => controller.abort();
  }, [detail.commentsEnabled, detail.id]);

  const primeSideModelImage = (item: ModelDetailSideModel) => {
    if (typeof window === "undefined" || !item.imageSrc) return;

    const image = new Image();
    image.decoding = "async";
    image.src = item.imageSrc;
  };

  const selectSideModel = (item: ModelDetailSideModel) => {
    primeSideModelImage(item);
    const nextModel = getActiveModelFromSideModel(item);
    setActiveModel(nextModel);
    setSlide(0);
    setShowDownloadConfirm(false);
    setDownloadStatus(null);
    setCartStatus(null);

    if (typeof window !== "undefined") {
      window.history.pushState(null, "", item.href);
    }
  };

  const goPrev = () => {
    setSlide(
      (current) => (current - 1 + modelImages.length) % modelImages.length,
    );
  };

  const goNext = () => {
    setSlide((current) => (current + 1) % modelImages.length);
  };

  const handleCommentSubmit = async () => {
    const content = commentInput.trim();
    setCommentFeedback(null);

    if (!activeModel.commentsEnabled) {
      setCommentFeedback("Comments are available after this model is public.");
      return;
    }

    if (!navUser) {
      openAuthModal("login", { redirectTo: getCurrentRedirect() });
      return;
    }

    if (!content) {
      setCommentFeedback("Enter a comment before posting.");
      return;
    }

    if (content.length > 500) {
      setCommentFeedback("Comment content must be 500 characters or fewer.");
      return;
    }

    setCommentSubmitting(true);
    try {
      const response = await apiFetch(`/api/social/models/${activeModel.id}/comments`, {
        body: JSON.stringify({ content }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (response.status === 401) {
        openAuthModal("login", { redirectTo: getCurrentRedirect() });
        return;
      }

      if (!response.ok) {
        throw new Error(
          await getResponseMessage(response, "Failed to post comment."),
        );
      }

      setCommentInput("");
      await loadComments();
      setCommentFeedback("Comment posted.");
    } catch (error) {
      setCommentFeedback(error instanceof Error ? error.message : "Failed to post comment.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDownloadConfirm = async () => {
    setDownloadStatus(null);

    if (!downloadIsCharged) {
      window.location.href = downloadURL;
      return;
    }

    if (!navUser) {
      setShowDownloadConfirm(false);
      openAuthModal("login", { redirectTo: getCurrentRedirect() });
      return;
    }

    setIsDownloading(true);
    try {
      const response = await apiFetch(`${downloadURL}&inline=1`, {
        credentials: "same-origin",
      });

      if (response.status === 401) {
        setShowDownloadConfirm(false);
        openAuthModal("login", { redirectTo: getCurrentRedirect() });
        return;
      }

      if (!response.ok) {
        throw new Error(
          await getResponseMessage(response, "Model download failed."),
        );
      }

      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectURL;
      link.download = getDownloadFilename(
        response.headers.get("Content-Disposition"),
        activeModel.id,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
      setShowDownloadConfirm(false);
      setDownloadStatus("Download started.");
    } catch (error) {
      setDownloadStatus(error instanceof Error ? error.message : "Model download failed.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAddToCart = () => {
    addModelToCart({
      discountedPrice: 22.5,
      imageSrc: activeModel.imageSrc,
      modelId: activeModel.id,
      originalPrice: 25,
      quantity: 1,
      serviceType: "3D Printing Service",
      tags: activeModel.tags,
      title: activeModel.title,
    });
    setCartStatus("Added to cart.");

    window.setTimeout(() => {
      setCartStatus(null);
    }, 1800);
  };

  return (
    <main className={styles.pageRoot}>
      {activeModel.viewerURL ? (
        <>
          <link
            rel="preload"
            href="/three-draco/gltf/draco_wasm_wrapper.js"
            as="script"
          />
          <link
            rel="preload"
            href="/three-draco/gltf/draco_decoder.wasm"
            as="fetch"
            type="application/wasm"
          />
          <link rel="preload" href={activeModel.viewerURL} as="fetch" />
        </>
      ) : null}
      <div className={styles.mobileDetail}>
        <header className={styles.mobileHeader}>
          <Link href="/" aria-label="Thorns Tavern home">
            <img alt="Thorns Tavern" src="/ui-lab/top-navigation/logo-wordmark.png" />
          </Link>
          <Link href="/workbench">Workbench</Link>
        </header>

        <section className={styles.mobileHero}>
          <span className={styles.mobileEyebrow}>Model Detail</span>
          <h1>{activeModel.title}</h1>
          <div className={styles.mobileTags}>
            {activeModel.tags.slice(0, 4).map((tag) => (
              <span key={tag}># {tag}</span>
            ))}
          </div>
          <form action="/showcase" className={styles.mobileSearchForm} method="get" role="search">
            <input
              aria-label="Search public models"
              maxLength={80}
              name="q"
              placeholder="Search public models"
              type="search"
            />
            <button type="submit">Search</button>
          </form>
        </section>

        <section className={styles.mobilePreview} aria-label="Model preview">
          {activeModel.viewerURL && shouldRenderMobileViewer ? (
            <ModelViewer
              className={styles.mobileViewer}
              showGround={false}
              showPlaceholderModel={false}
              src={activeModel.viewerURL}
              transparentBackground
            />
          ) : modelImages[slide] ? (
            <img alt={activeModel.title} src={modelImages[slide]} />
          ) : (
            <div className={styles.mobilePreviewEmpty}>Preview unavailable</div>
          )}
        </section>

        {modelImages.length > 1 ? (
          <div className={styles.mobileImageControls}>
            <button onClick={goPrev} type="button">Previous</button>
            <span>{slide + 1} / {modelImages.length}</span>
            <button onClick={goNext} type="button">Next</button>
          </div>
        ) : null}

        <section className={styles.mobileStats} aria-label="Model facts">
          <div>
            <span>Topology</span>
            <strong>{detail.topologyLabel}</strong>
          </div>
          <div>
            <span>Formats</span>
            <strong>{detail.formatsLabel}</strong>
          </div>
          <div>
            <span>Print</span>
            <strong>{detail.printReadyLabel}</strong>
          </div>
        </section>

        <section className={styles.mobileActions} aria-label="Model actions">
          <button className={styles.mobilePrimaryAction} onClick={handleDownloadConfirm} type="button">
            Download GLB
          </button>
          {canPrintActiveModel ? (
            <PrintOrderDialog
              buttonLabel="Print this model"
              modelId={activeModel.id}
              modelPreviewSrc={activeModel.imageSrc}
              modelTitle={activeModel.title}
            />
          ) : null}
          <Link href={activeModel.id ? `/workbench?reference=${activeModel.id}` : "/workbench"}>
            Use in Workbench
          </Link>
          <button onClick={handleAddToCart} type="button">
            Add To Cart
          </button>
        </section>
        {visibleStatus ? <div className={styles.mobileStatus}>{visibleStatus}</div> : null}

        <section className={styles.mobileCard}>
          <div className={styles.mobileAuthor}>
            {detail.authorAvatarSrc ? <img alt={detail.authorName} src={detail.authorAvatarSrc} /> : null}
            <div>
              <span>Creator</span>
              <strong>{detail.authorName}</strong>
            </div>
          </div>
          <p>{detail.authorDescription}</p>
        </section>

        <section className={styles.mobileCard}>
          <div className={styles.mobileSectionHeader}>
            <span>Comments</span>
            <strong>{commentCountLabel}</strong>
          </div>
          {activeModel.commentsEnabled ? (
            <form
              className={styles.mobileCommentForm}
              onSubmit={(event) => {
                event.preventDefault();
                void handleCommentSubmit();
              }}
            >
              <textarea
                maxLength={500}
                onChange={(event) => setCommentInput(event.target.value.slice(0, 500))}
                placeholder="Please enter your comment."
                value={commentInput}
              />
              <div>
                <span>{commentInput.length}/500</span>
                <button
                  disabled={commentSubmitting}
                  onClick={() => {
                    void handleCommentSubmit();
                  }}
                  type="button"
                >
                  {commentSubmitting ? "Posting" : "Comment"}
                </button>
              </div>
            </form>
          ) : (
            <p className={styles.mobileStatus}>Comments are available after this model is public.</p>
          )}
          {commentFeedback ? <p className={styles.mobileStatus}>{commentFeedback}</p> : null}
          {activeModel.commentsEnabled && comments.length > 0 ? (
            <ul className={styles.mobileCommentList}>
              {comments.map((comment) => (
                <li key={comment.id}>
                  <strong>{comment.authorName}</strong>
                  <span>{comment.createdLabel}</span>
                  <p>{comment.content}</p>
                </li>
              ))}
            </ul>
          ) : activeModel.commentsEnabled ? (
            <p className={styles.mobileStatus}>{commentsLoading ? "Loading comments..." : "No comments yet."}</p>
          ) : null}
        </section>

        {relatedModels.length > 0 ? (
          <section className={styles.mobileRelated} aria-label="Related models">
            <div className={styles.mobileSectionHeader}>
              <span>{detail.isOwnedByCurrentUser ? "My models" : "Creator models"}</span>
              <strong>{relatedPagination.totalDocs}</strong>
            </div>
            <div className={styles.mobileRelatedGrid}>
              {relatedModels.map((item) => (
                <a
                  href={item.href}
                  key={item.id}
                  onMouseEnter={() => primeSideModelImage(item)}
                  onFocus={() => primeSideModelImage(item)}
                  onClick={(event) => {
                    event.preventDefault();
                    if (item.id !== activeModelId) {
                      selectSideModel(item);
                    }
                  }}
                >
                  {item.imageSrc ? (
                    <NextImage alt={item.title} fill sizes="80px" src={getSupabasePreviewImageURL(item.imageSrc, "model-card")} style={{ objectFit: "cover" }} />
                  ) : null}
                  <span>{item.title}</span>
                </a>
              ))}
            </div>
            {relatedPagination.totalPages > 1 ? (
              <div className={styles.mobileRelatedPager}>
                <button
                  disabled={!relatedPagination.hasPrevPage || relatedLoading}
                  onClick={() => void loadRelatedPage(relatedPagination.page - 1)}
                  type="button"
                >
                  Prev
                </button>
                <span>
                  {relatedPagination.page} / {relatedPagination.totalPages}
                </span>
                <button
                  disabled={!relatedPagination.hasNextPage || relatedLoading}
                  onClick={() => void loadRelatedPage(relatedPagination.page + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            ) : null}
            {relatedError ? <p className={styles.mobileStatus}>{relatedError}</p> : null}
          </section>
        ) : null}
      </div>
      <div className={styles.scaleViewport}>
        <ModelDetailHeader navUser={navUser} />

        <div className={styles.scaleStage}>
          <AuthModalStage fitViewport topOffset={60}>
          <section className="uc-detail">
            <section className="detail-main">
              <div className="detail-left-top">
                <div className="name">MODEL NAME</div>
                <h1 className="title">{activeModel.title}</h1>
                <div className="tags">
                  {activeModel.tags.map((tag) => (
                    <span key={tag}># {tag}</span>
                  ))}
                </div>
                <form action="/showcase" className="search-box" method="get" role="search">
                  <input
                    aria-label="Search public models"
                    className="uc-input"
                    maxLength={80}
                    name="q"
                    placeholder="Search public models"
                    type="search"
                  />
                  <img
                    src={asset("icon-search-white.png")}
                    className="icon"
                    alt=""
                    decoding="async"
                  />
                  <button className="uc-btn" type="submit">
                    Search
                  </button>
                </form>
              </div>
              <ul className="detail-right-top">
                <li>
                  <div className="txt">TOPOLOGY</div>
                  <div className="con">{detail.topologyLabel}</div>
                </li>
                <li>
                  <div className="txt">FORMATS</div>
                  <div className="con">{detail.formatsLabel}</div>
                </li>
                <li>
                  <div className="txt">DIMENSIONS</div>
                  <div className="con">{detail.vertexLabel}</div>
                </li>
              </ul>

              <section className="swiper-box" aria-label="Model preview">
                <div className="swiper-container swiper-container1">
                  <ul
                    className="swiper-wrapper"
                    style={{ transform: `translateX(-${slide * 100}%)` }}
                  >
                    {modelImages.map((image, index) => (
                      <li
                        className="swiper-slide"
                        key={`model-preview-slide-${index}`}
                      >
                        {index === 0 &&
                        activeModel.viewerURL &&
                        shouldRenderDesktopViewer ? (
                          <div className="detail-model-stage">
                            <ModelViewer
                              className="detail-model-viewer"
                              showGround={false}
                              showPlaceholderModel={false}
                              src={activeModel.viewerURL}
                              transparentBackground
                            />
                          </div>
                        ) : (
                          <img
                            alt={activeModel.title}
                            className="detail-preview-image"
                            decoding="async"
                            fetchPriority={index === 0 ? "high" : "auto"}
                            loading={index === 0 ? "eager" : "lazy"}
                            src={image}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  className="btn btn-prev"
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous model image"
                />
                <button
                  className="btn btn-next"
                  type="button"
                  onClick={goNext}
                  aria-label="Next model image"
                />
              </section>

              <div
                className="tips-box"
                style={{ left: "50%", marginLeft: 200, top: "80%" }}
              >
                <div className="dot">
                  <i />
                </div>
                <div className="name">{detail.printReadyLabel}</div>
              </div>

              {showDownloadConfirm ? (
                <ModelDownloadConfirmation
                  className="alert-box"
                  onCancel={() => setShowDownloadConfirm(false)}
                  confirmLabel={isDownloading ? "WAIT" : "OK"}
                  message={downloadMessage}
                  onConfirm={() => {
                    if (!isDownloading) void handleDownloadConfirm();
                  }}
                  style={{ left: "50%", marginLeft: 170, top: "45%" }}
                />
              ) : null}
              {visibleStatus ? <div className="download-status">{visibleStatus}</div> : null}
            </section>

            <section className="detail-right">
              <ButtonBoxFrame
                className="detail-right-frame"
                contentClassName="detail-right-frame-content"
              >
                <div className="scroll-box">
                  <div className="banner">
                    <ModelDetailAdBanner
                      imageSrc={detail.authorProfileBannerSrc || undefined}
                      imagePosition={`${detail.authorProfileBannerFocalX}% ${detail.authorProfileBannerFocalY}%`}
                    />
                  </div>
                  <ModelAuthorCard
                    avatarAlt={detail.authorName}
                    avatarSrc={detail.authorAvatarSrc || undefined}
                    className="user"
                    description={detail.authorDescription}
                    name={detail.authorName}
                  />
                  <div className="info">
                    <div className="item">
                      <img
                        src={asset("detail-side-icon-1-1.png")}
                        alt=""
                        className="uc-icon24"
                        decoding="async"
                      />
                      {detail.authorProfileViewCountLabel}
                    </div>
                    <div className="item">
                      <img
                        src={asset("detail-side-icon-1-2.png")}
                        alt=""
                        className="uc-icon24"
                        decoding="async"
                      />
                      {detail.authorModelCountLabel}
                    </div>
                    <time>{detail.ageLabel}</time>
                  </div>
                  <ul className="list">
                    <li>
                      <div className="img">
                        <a
                          href={`/model-detail?id=${activeModel.id}`}
                          onClick={(event) => event.preventDefault()}
                        >
                          <img
                            src={
                              activeModel.imageSrc ||
                              asset("detail-side-img.png")
                            }
                            alt={activeModel.title}
                            decoding="async"
                            loading="eager"
                          />
                        </a>
                      </div>
                      <div className="right">
                        <h3>{activeModel.title}</h3>
                        <div className="time">{activeModel.updatedLabel}</div>
                        <div className="tags">
                          {activeModel.tags.map((tag) => (
                            <a
                              href="#"
                              className="uc-tag"
                              key={tag}
                              title={`# ${tag}`}
                            >
                              # {tag}
                            </a>
                          ))}
                        </div>
                      </div>
                    </li>
                  </ul>
                  {activeModel.commentsEnabled ? (
                    <form
                      className="form-box"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleCommentSubmit();
                      }}
                    >
                      <textarea
                        className="uc-textarea"
                        disabled={commentSubmitting}
                        maxLength={500}
                        onChange={(event) => setCommentInput(event.target.value.slice(0, 500))}
                        placeholder="Please enter your comment."
                        rows={10}
                        value={commentInput}
                      />
                      <div className="right">
                        <button
                          className="uc-btn"
                          disabled={commentSubmitting}
                          onClick={() => {
                            void handleCommentSubmit();
                          }}
                          type="button"
                        >
                          {commentSubmitting ? "POSTING" : "COMMENT"}
                        </button>
                        <div className="number">{commentInput.length}/500</div>
                      </div>
                    </form>
                  ) : (
                    <div className="comment-state">
                      Comments are available after this model is public.
                    </div>
                  )}
                  {commentFeedback ? <div className="comment-feedback">{commentFeedback}</div> : null}
                  <div className="total">{commentCountLabel} Comments</div>
                  {activeModel.commentsEnabled && commentsLoading ? (
                    <div className="comment-state">Loading comments...</div>
                  ) : activeModel.commentsEnabled && comments.length > 0 ? (
                    <ul className="comment-list">
                      {comments.map((comment) => (
                        <li key={comment.id}>
                          <div className="comment-meta">
                            <strong>{comment.authorName}</strong>
                            <time>{comment.createdLabel}</time>
                          </div>
                          <p>{comment.content}</p>
                        </li>
                      ))}
                    </ul>
                  ) : activeModel.commentsEnabled ? (
                    <div className="comment-state">No comments yet.</div>
                  ) : null}
                  <div
                    className="model-scroll"
                    ref={relatedScrollRef}
                  >
                    <div className="side-title">
                      {detail.isOwnedByCurrentUser
                        ? "MY MODEL"
                        : "CREATOR MODELS"}
                    </div>
                    <ul className="list2">
                      {relatedModels.length > 0 ? (
                        relatedModels.map((item) => (
                            <li key={item.id}>
                              <ButtonBoxFrame
                                className="side-model-card-frame"
                                contentClassName="side-model-card-content"
                              >
                                <a
                                  aria-current={
                                    item.id === activeModelId
                                      ? "page"
                                      : undefined
                                  }
                                  className="item"
                                  href={item.href}
                                  onFocus={() => primeSideModelImage(item)}
                                  onMouseEnter={() => primeSideModelImage(item)}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    if (item.id !== activeModelId) {
                                      selectSideModel(item);
                                    }
                                  }}
                                >
                                  <NextImage
                                    alt={item.title}
                                    fill
                                    sizes="80px"
                                    src={getSupabasePreviewImageURL(item.imageSrc, "model-card")}
                                    style={{ objectFit: "cover" }}
                                  />
                                </a>
                              </ButtonBoxFrame>
                            </li>
                          ))
                      ) : (
                        <li className="side-empty-state">
                          No additional public models yet.
                        </li>
                      )}
                    </ul>
                    {relatedPagination.totalPages > 1 ? (
                      <div className="side-model-pagination">
                        <button
                          aria-label="Previous model page"
                          disabled={!relatedPagination.hasPrevPage || relatedLoading}
                          onClick={() => void loadRelatedPage(relatedPagination.page - 1)}
                          type="button"
                        >
                          PREV
                        </button>
                        <span>
                          {relatedPagination.page} / {relatedPagination.totalPages}
                        </span>
                        <button
                          aria-label="Next model page"
                          disabled={!relatedPagination.hasNextPage || relatedLoading}
                          onClick={() => void loadRelatedPage(relatedPagination.page + 1)}
                          type="button"
                        >
                          NEXT
                        </button>
                      </div>
                    ) : null}
                    {relatedError ? (
                      <div className="side-model-error">{relatedError}</div>
                    ) : null}
                  </div>
                </div>
              </ButtonBoxFrame>
            </section>

            <section className="detail-bottom">
              <div className="left">
                <div className="points">
                  <img
                    src={asset("detail-bottom-icon-1.png")}
                    className="icon"
                    alt=""
                    decoding="async"
                  />
                  <div className="hd">
                    <div className="money">{activeModel.downloadCreditsLabel}</div>
                    <div className="uc-del">{detail.chargeDownloadCredits ? "POINTS" : "FREE"}</div>
                  </div>
                  <div className="txt">{detail.chargeDownloadCredits ? "POINTS" : "NO CHARGE"}</div>
                </div>
                <a href="#" className="btn">
                  <img
                    src={asset("detail-bottom-icon-2.png")}
                    alt=""
                    decoding="async"
                  />
                  {viewCountLabel}
                </a>
                <a href="#" className="btn">
                  <img
                    src={asset("detail-bottom-icon-3.png")}
                    alt=""
                    decoding="async"
                  />
                  {detail.likesLabel}
                </a>
                <a href="#" className="btn">
                  <img
                    src={asset("detail-bottom-icon-4.png")}
                    alt=""
                    decoding="async"
                  />
                  {detail.favoritesLabel}
                </a>
              </div>
              <div className="center">
                <div className="btn2-slot">
                  <OrangeMediumActionButton
                    label="DOWNLOAD"
                    onClick={() => setShowDownloadConfirm(true)}
                    style={detailBottomActionButtonStyle}
                  />
                  <img
                    src="/ui-lab/model-detail-assets/images/Boolean_operation_1_8765.png"
                    alt=""
                    className="btn2-icon btn2-icon-cart"
                    decoding="async"
                  />
                </div>
                <div className="btn2-slot">
                  {canPrintActiveModel ? (
                    <PrintOrderDialog
                      modelId={activeModel.id}
                      modelPreviewSrc={activeModel.imageSrc}
                      modelTitle={activeModel.title}
                      renderTrigger={({ loading, open }) => (
                        <SourcePurpleMediumButton
                          disabled={loading}
                          label="PRINT NOW"
                          onClick={open}
                          style={detailBottomActionButtonStyle}
                        />
                      )}
                    />
                  ) : (
                    <SourcePurpleMediumButton
                      disabled={detail.isOwnedByCurrentUser && !activeModel.printReady}
                      label={printActionLabel}
                      onClick={() => {
                        if (detail.isOwnedByCurrentUser && !activeModel.printReady) return;

                        window.location.href = activeModel.id
                          ? `/workbench?reference=${activeModel.id}`
                          : "/workbench";
                      }}
                      style={detailBottomActionButtonStyle}
                    />
                  )}
                  <img
                    src="/ui-lab/model-detail-assets/images/Boolean_operation_1_8833.png"
                    alt=""
                    className="btn2-icon btn2-icon-print"
                    decoding="async"
                  />
                </div>
                <div className="btn2-slot">
                  <SourcePurpleMediumButton
                    label="ADD TO CART"
                    onClick={handleAddToCart}
                    style={detailBottomActionButtonStyle}
                  />
                  <img
                    src="/ui-lab/top-navigation/icon-cart-gold.png"
                    alt=""
                    className="btn2-icon btn2-icon-add-cart"
                    decoding="async"
                  />
                </div>
              </div>
              <div className="right">
                <div className="hd">
                  <img
                    src={asset("detail-bottom-icon-5.png")}
                    alt=""
                    decoding="async"
                  />
                </div>
                <div className="bd">
                  <Link
                    href={
                      activeModel.id
                        ? `/workbench?reference=${activeModel.id}`
                        : "#"
                    }
                    className="item"
                  >
                    Use As Reference
                  </Link>
                  <a href="#" className="item">
                    Favorite Model
                  </a>
                  <Link
                    href={activeModel.id ? `/model-detail?id=${activeModel.id}` : "#"}
                    className="item"
                  >
                    Open Detail
                  </Link>
                </div>
              </div>
            </section>
          </section>
          </AuthModalStage>
        </div>
      </div>
    </main>
  );
}
