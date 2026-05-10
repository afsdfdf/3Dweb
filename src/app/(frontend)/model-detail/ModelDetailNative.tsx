/* eslint-disable @next/next/no-img-element */
"use client";

import {
  OrangeMediumActionButton,
  SourcePurpleMediumButton,
} from "@/components/ui-lab/action-buttons";
import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";
import { ModelAuthorCard } from "@/components/ui-lab/model-author-card";
import { ModelDetailAdBanner } from "@/components/ui-lab/model-detail-ad-banner";
import { ModelDownloadConfirmation } from "@/components/ui-lab/model-download-confirmation";
import type { TopNavigationUser } from "@/components/ui-lab/top-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ModelViewer } from "../_components/ModelViewer";
import { PrintOrderDialog } from "../_components/PrintOrderDialog";
import { ModelDetailHeader } from "./ModelDetailHeader";
import type {
  ModelDetailData,
  ModelDetailSideModel,
} from "./_lib/modelDetailData";
import styles from "./page.module.css";

const asset = (name: string) => `/ui-lab/model-detail-uicut/images/${name}`;

const detailBottomActionButtonStyle = {
  boxSizing: "border-box",
  height: 64,
  inset: 0,
  width: 198,
} as const;

const transparentImageSrc =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const relatedModelColumns = 3;
const relatedModelCardHeight = 222;
const relatedModelInitialVisibleCount = 6;
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
  const relatedModels = detail.sideModels;
  const relatedScrollRef = useRef<HTMLDivElement | null>(null);
  const [slide, setSlide] = useState(0);
  const [visibleRelatedImageCount, setVisibleRelatedImageCount] = useState(
    relatedModelInitialVisibleCount,
  );
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<null | string>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentFeedback, setCommentFeedback] = useState<null | string>(null);
  const [comments, setComments] = useState<ModelComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentTotal, setCommentTotal] = useState(activeModel.commentsCount);
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
  const canPrintActiveModel =
    detail.isOwnedByCurrentUser && activeModel.printReady;
  const printActionLabel = canPrintActiveModel
    ? "PRINT NOW"
    : detail.isOwnedByCurrentUser
      ? "REVIEW NEEDED"
      : "WORKBENCH";

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
      const response = await fetch(
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

  const updateVisibleRelatedImages = useCallback(() => {
    const node = relatedScrollRef.current;
    if (!node) {
      setVisibleRelatedImageCount(relatedModelInitialVisibleCount);
      return;
    }

    const visibleRows = Math.ceil(
      (node.scrollTop + node.clientHeight) / relatedModelCardHeight,
    );
    const nextCount = Math.max(
      relatedModelInitialVisibleCount,
      (visibleRows + 1) * relatedModelColumns,
    );
    setVisibleRelatedImageCount((current) => Math.max(current, nextCount));
  }, []);

  useEffect(() => {
    setVisibleRelatedImageCount(relatedModelInitialVisibleCount);
    window.requestAnimationFrame(updateVisibleRelatedImages);
  }, [activeModelId, updateVisibleRelatedImages]);

  useEffect(() => {
    setCommentInput("");
    setCommentTotal(activeModel.commentsCount);
    void loadComments();
  }, [activeModel.commentsCount, activeModelId, loadComments]);

  const selectSideModel = (item: ModelDetailSideModel) => {
    const nextModel = getActiveModelFromSideModel(item);
    setActiveModel(nextModel);
    setSlide(0);
    setShowDownloadConfirm(false);
    setDownloadStatus(null);

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
      const response = await fetch(`/api/social/models/${activeModel.id}/comments`, {
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
      const response = await fetch(`${downloadURL}&inline=1`, {
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

  return (
    <main className={styles.pageRoot}>
      {activeModel.viewerURL ? (
        <link
          rel="preload"
          href={activeModel.viewerURL}
          as="fetch"
          crossOrigin="anonymous"
        />
      ) : null}
      <div className={styles.mobileDetail}>
        <header className={styles.mobileHeader}>
          <a href="/" aria-label="Thorns Tavern home">
            <img alt="Thorns Tavern" src="/ui-lab/top-navigation/logo-wordmark.png" />
          </a>
          <a href="/workbench">Workbench</a>
        </header>

        <section className={styles.mobileHero}>
          <span className={styles.mobileEyebrow}>Model Detail</span>
          <h1>{activeModel.title}</h1>
          <div className={styles.mobileTags}>
            {activeModel.tags.slice(0, 4).map((tag) => (
              <span key={tag}># {tag}</span>
            ))}
          </div>
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
          <a href={activeModel.id ? `/workbench?reference=${activeModel.id}` : "/workbench"}>
            Use in Workbench
          </a>
        </section>
        {downloadStatus ? <div className={styles.mobileStatus}>{downloadStatus}</div> : null}

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
              <strong>{relatedModels.length}</strong>
            </div>
            <div className={styles.mobileRelatedGrid}>
              {relatedModels.slice(0, 6).map((item) => (
                <a
                  href={item.href}
                  key={item.id}
                  onClick={(event) => {
                    event.preventDefault();
                    if (item.id !== activeModelId) {
                      selectSideModel(item);
                    }
                  }}
                >
                  {item.imageSrc ? <img alt={item.title} src={item.imageSrc} /> : null}
                  <span>{item.title}</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <div className={styles.scaleViewport}>
        <div className={styles.scaleStage}>
          <ModelDetailHeader navUser={navUser} />

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
                              onError={updateVisibleRelatedImages}
                              onReady={updateVisibleRelatedImages}
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
              {downloadStatus ? <div className="download-status">{downloadStatus}</div> : null}
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
                      {detail.viewLabel}
                    </div>
                    <div className="item">
                      <img
                        src={asset("detail-side-icon-1-2.png")}
                        alt=""
                        className="uc-icon24"
                        decoding="async"
                      />
                      {detail.likesLabel}
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
                    onScroll={updateVisibleRelatedImages}
                    ref={relatedScrollRef}
                  >
                    <div className="side-title">
                      {detail.isOwnedByCurrentUser
                        ? "MY MODEL"
                        : "CREATOR MODELS"}
                    </div>
                    <ul className="list2">
                      {relatedModels.length > 0 ? (
                        relatedModels.map((item, index) => (
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
                                  onClick={(event) => {
                                    event.preventDefault();
                                    if (item.id !== activeModelId) {
                                      selectSideModel(item);
                                    }
                                  }}
                                >
                                  <img
                                    src={
                                      index < visibleRelatedImageCount ||
                                      item.id === activeModelId
                                        ? item.imageSrc
                                        : transparentImageSrc
                                    }
                                    alt={item.title}
                                    decoding="async"
                                    fetchPriority="low"
                                    loading="lazy"
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
                  </div>
                </div>
              </ButtonBoxFrame>
            </section>

            <div className="search-box">
              <input
                type="text"
                className="uc-input"
                placeholder="Please enter keywords"
              />
              <img
                src={asset("icon-search-white.png")}
                className="icon"
                alt=""
                decoding="async"
              />
              <a href="#" className="uc-btn">
                Search
              </a>
            </div>

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
                  {detail.viewLabel}
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
                  <a
                    href={
                      activeModel.id
                        ? `/workbench?reference=${activeModel.id}`
                        : "#"
                    }
                    className="item"
                  >
                    Use As Reference
                  </a>
                  <a href="#" className="item">
                    Favorite Model
                  </a>
                  <a
                    href={activeModel.id ? `/model-detail?id=${activeModel.id}` : "#"}
                    className="item"
                  >
                    Open Detail
                  </a>
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
