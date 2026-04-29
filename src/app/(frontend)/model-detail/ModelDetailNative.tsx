/* eslint-disable @next/next/no-img-element */
"use client";

import {
  OrangeMediumActionButton,
  SourcePurpleMediumButton,
} from "@/components/ui-lab/action-buttons";
import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";
import { ModelAuthorCard } from "@/components/ui-lab/model-author-card";
import { ModelDetailAdBanner } from "@/components/ui-lab/model-detail-ad-banner";
import { ModelDownloadConfirmation } from "@/components/ui-lab/model-download-confirmation";
import type { TopNavigationUser } from "@/components/ui-lab/top-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ModelViewer } from "../_components/ModelViewer";
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

const sideModels = Array.from({ length: 5 }, (_, index) => index);
const transparentImageSrc =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const relatedModelColumns = 3;
const relatedModelCardHeight = 222;
const relatedModelInitialVisibleCount = 6;

const fallbackData: ModelDetailData = {
  ageLabel: "6 Days ago",
  authorAvatarSrc: "/ui-lab/model-detail-uicut/images/face.png",
  authorDescription:
    "Public creator model available for preview and reference.",
  authorName: "Xing Mu",
  commentsLabel: "0",
  downloadCreditsLabel: "15.00",
  favoritesLabel: "267",
  formatsLabel: "GLB",
  id: 0,
  inputPreviewSrc: "/ui-lab/model-detail-uicut/images/detail-side-img.png",
  isOwnedByCurrentUser: false,
  likesLabel: "56",
  previewImages: ["/ui-lab/model-detail-uicut/images/detail.png"],
  printReadyLabel: "Preview Only",
  sideModels: [],
  tags: ["game", "Monk"],
  title: "Monk",
  topologyLabel: "Triangle",
  updatedLabel: "2026.02.25 10:25",
  vertexLabel: "--",
  viewLabel: "2.3k",
  viewerURL: null,
  visibilityLabel: "public",
};

type ModelDetailNativeProps = {
  data?: ModelDetailData | null;
  navUser?: null | TopNavigationUser;
};

type ActiveModel = {
  id: number;
  imageSrc: null | string;
  tags: string[];
  title: string;
  updatedLabel: string;
  viewerURL: null | string;
};

const getInitialActiveModel = (detail: ModelDetailData): ActiveModel => ({
  id: detail.id,
  imageSrc: detail.inputPreviewSrc,
  tags: detail.tags,
  title: detail.title,
  updatedLabel: detail.updatedLabel,
  viewerURL: detail.viewerURL,
});

const getActiveModelFromSideModel = (
  item: ModelDetailSideModel,
): ActiveModel => ({
  id: Number(item.id),
  imageSrc: item.imageSrc,
  tags: item.tags,
  title: item.title,
  updatedLabel: item.updatedLabel,
  viewerURL: item.viewerURL,
});

export default function ModelDetailNative({
  data = null,
  navUser = null,
}: ModelDetailNativeProps) {
  const detail = data ?? fallbackData;
  const [activeModel, setActiveModel] = useState<ActiveModel>(() =>
    getInitialActiveModel(detail),
  );
  const modelImages = activeModel.imageSrc
    ? [activeModel.imageSrc]
    : detail.previewImages.length > 0
      ? detail.previewImages
      : fallbackData.previewImages;
  const relatedModels = detail.sideModels.length > 0 ? detail.sideModels : null;
  const relatedScrollRef = useRef<HTMLDivElement | null>(null);
  const [slide, setSlide] = useState(0);
  const [visibleRelatedImageCount, setVisibleRelatedImageCount] = useState(
    relatedModelInitialVisibleCount,
  );
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const activeModelId = String(activeModel.id);

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

  const selectSideModel = (item: ModelDetailSideModel) => {
    const nextModel = getActiveModelFromSideModel(item);
    setActiveModel(nextModel);
    setSlide(0);

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
      <div className={styles.scaleViewport}>
        <div className={styles.scaleStage}>
          <ModelDetailHeader navUser={navUser} />

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
                        {index === 0 && activeModel.viewerURL ? (
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
                  onConfirm={() => {
                    if (detail.id) {
                      window.location.href = `/api/platform/models/${activeModel.id}/download?format=glb`;
                    }
                  }}
                  style={{ left: "50%", marginLeft: 170, top: "45%" }}
                />
              ) : null}
            </section>

            <section className="detail-right">
              <ButtonBoxFrame
                className="detail-right-frame"
                contentClassName="detail-right-frame-content"
              >
                <div className="scroll-box">
                  <div className="banner">
                    <ModelDetailAdBanner />
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
                  <div className="form-box">
                    <textarea
                      className="uc-textarea"
                      placeholder="Please enter your comment."
                      rows={10}
                    />
                    <div className="right">
                      <a href="#" className="uc-btn">
                        COMMENT
                      </a>
                      <div className="number">0/500</div>
                    </div>
                  </div>
                  <div className="total">{detail.commentsLabel} Comments</div>
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
                      {relatedModels
                        ? relatedModels.map((item, index) => (
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
                        : sideModels.map((item) => (
                            <li key={item}>
                              <ButtonBoxFrame
                                className="side-model-card-frame"
                                contentClassName="side-model-card-content"
                              >
                                <a href="#" className="item">
                                  <img
                                    src={asset("detail-side-img-1.png")}
                                    alt=""
                                    decoding="async"
                                    loading="lazy"
                                  />
                                </a>
                              </ButtonBoxFrame>
                            </li>
                          ))}
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
                    <div className="money">{detail.downloadCreditsLabel}</div>
                    <div className="uc-del">27.00</div>
                  </div>
                  <div className="txt">POINTS</div>
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
                    label="ADD TO CART"
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
                  <SourcePurpleMediumButton
                    label="PRINT NOW"
                    onClick={() => {
                      window.location.href = activeModel.id
                        ? `/workbench?reference=${activeModel.id}`
                        : "/workbench";
                    }}
                    style={detailBottomActionButtonStyle}
                  />
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
                    href={activeModel.id ? `/showcase/${activeModel.id}` : "#"}
                    className="item"
                  >
                    Open Showcase
                  </a>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
