/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { GenerateCtaButton } from "@/components/ui-lab/action-buttons";
import { ModelLibraryPanel, type ModelLibraryPanelCard } from "@/components/ui-lab/model-library-panel";
import { ModuleCommonFrame } from "@/components/ui-lab/module-common-frame";
import { SmallButtonTriple } from "@/components/ui-lab/small-button-pair/small-button-pair";
import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import type { TopNavigationUser } from "@/components/ui-lab/top-navigation";

import { ModelViewer } from "../_components/ModelViewer";
import {
  clearWorkbenchDraft,
  getWorkbenchUploadAccept,
  readWorkbenchDraft,
  uploadWorkbenchSourceImage,
  workbenchAllowedImageTypes,
  workbenchDefaultPrompt,
  workbenchMaxUploadBytes,
  type WorkbenchSourceImageAsset,
} from "../_lib/workbenchDraft";
import styles from "./page.module.css";

type WorkbenchMode = "text3d" | "image3d" | "imageTools";

type WorkbenchImageInput = {
  file?: File;
  id: string;
  previewUrl: string;
  sourceAsset?: WorkbenchSourceImageAsset;
};

type WorkbenchClientProps = {
  libraryCards: ModelLibraryPanelCard[];
  navUser: null | TopNavigationUser;
};

export function WorkbenchClient({ libraryCards, navUser }: WorkbenchClientProps) {
  const router = useRouter();
  const firstModelSrc = libraryCards[0]?.modelSrc ?? null;
  const imagesRef = useRef<WorkbenchImageInput[]>([]);
  const [activeMode, setActiveMode] = useState<WorkbenchMode>("text3d");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [multiView, setMultiView] = useState(true);
  const [tags, setTags] = useState(["game", "Unnamed"]);
  const [images, setImages] = useState<WorkbenchImageInput[]>([]);
  const [license, setLicense] = useState<"Private" | "Public">("Public");
  const [modelTitle, setModelTitle] = useState("Monk");
  const [prompt, setPrompt] = useState(workbenchDefaultPrompt);
  const [selectedModelSrc, setSelectedModelSrc] = useState<null | string>(firstModelSrc);
  const isImageInput = activeMode === "image3d";
  const isImageTools = activeMode === "imageTools";
  const showMultiView = activeMode === "image3d";
  const activeModeButton = activeMode === "image3d" ? "purple" : activeMode === "text3d" ? "dark" : "button";
  const activeModelSrc = selectedModelSrc ?? firstModelSrc;
  const showImageInputs = isImageInput || isImageTools;

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.file) URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get("mode");
    if (mode === "image3d" || mode === "text3d") {
      setActiveMode(mode);
      setMultiView(mode === "image3d");
    }

    const draftFlag = searchParams.get("draft");
    if (draftFlag !== "home") return;

    const draft = readWorkbenchDraft();
    if (!draft) return;

    setActiveMode(draft.sourceImageAssets.length > 0 ? "image3d" : draft.mode);
    setMultiView(draft.sourceImageAssets.length > 0 || draft.mode === "image3d");
    setPrompt(draft.prompt.trim() || workbenchDefaultPrompt);
    setImages(
      draft.sourceImageAssets.map((asset) => ({
        id: `${asset.path}-${asset.fileName}`,
        previewUrl: asset.publicUrl,
        sourceAsset: asset,
      })),
    );
    clearWorkbenchDraft();
  }, []);

  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError("");
    setImages((current) => {
      const availableSlots = Math.max(0, 5 - current.length);
      const selectedFiles = Array.from(files).slice(0, availableSlots);
      const nextImages = selectedFiles
        .filter((file) => workbenchAllowedImageTypes.has(file.type) && file.size <= workbenchMaxUploadBytes)
        .map((file) => ({
          file,
          id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          previewUrl: URL.createObjectURL(file),
        }));

      if (nextImages.length < selectedFiles.length) {
        setError("Some images were skipped. Use JPEG, PNG, or WEBP under the upload size limit.");
      }

      return [...current, ...nextImages];
    });
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed?.file) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((image) => image.id !== id);
    });
  };

  const handleGenerate = async () => {
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const trimmedPrompt = prompt.trim() || workbenchDefaultPrompt;
      const sourceImageAssets = showImageInputs
        ? await Promise.all(
            images.map((image) => {
              if (image.sourceAsset) return Promise.resolve(image.sourceAsset);
              if (image.file) return uploadWorkbenchSourceImage(image.file);
              return Promise.reject(new Error("Image upload failed."));
            }),
          )
        : [];
      const sourceImageAsset = sourceImageAssets[0];
      const commonSnapshot = {
        format: "glb",
        quality: "high",
        style: "tabletop",
        workbench: {
          mode: activeMode,
          license: license.toLowerCase(),
          multiViewEnabled: activeMode === "image3d" ? multiView : false,
          requestedTitle: modelTitle.trim() || "Unnamed",
          sourceImageAssets,
          tags,
        },
      };

      const response =
        activeMode === "imageTools"
          ? await fetch("/api/studio/ai/images", {
              body: JSON.stringify({
                inputMode: sourceImageAsset ? "image" : "text",
                parameterSnapshot: commonSnapshot,
                prompt: trimmedPrompt,
                sourceImageAsset,
              }),
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              method: "POST",
            })
          : await fetch("/api/studio/ai/tasks", {
              body: JSON.stringify({
                inputMode: sourceImageAsset ? "hybrid" : "text",
                parameterSnapshot: commonSnapshot,
                prompt: trimmedPrompt,
                sourceImageAsset,
              }),
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              method: "POST",
            });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.message || "Generation request failed.");
      }

      const taskCode = json.task?.taskCode;
      if (taskCode) {
        router.push(`/results/${taskCode}`);
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation request failed.";
      setError(message);
      window.alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.stageViewport}>
        <section className={styles.stage} aria-label="Workbench model generation page">
          <TopNavigation
            active="WORKBENCH"
            className={styles.boundTopNavigation}
            items={migrationTestNavItems}
            user={navUser}
          />

          <aside className={styles.leftPanel}>
            <ModuleCommonFrame
              className={styles.panelFrameOverlay}
              contentClassName={styles.panelFrameContent}
              style={{ width: "100%", height: "100%" }}
            />
            <div className={styles.modeTabsMount}>
              <SmallButtonTriple
                labels={{
                  purple: "Image To 3D",
                  dark: "Text To 3D",
                  button: "Image Tools",
                }}
                selected={activeModeButton}
                onChange={(button) => {
                  if (button === "purple") {
                    setActiveMode("image3d");
                    setMultiView(true);
                    return;
                  }
                  if (button === "dark") {
                    setActiveMode("text3d");
                    setMultiView(false);
                    return;
                  }
                  setActiveMode("imageTools");
                  setMultiView(false);
                }}
              />
            </div>

          <section className={styles.formSection}>
            <h2>{isImageTools ? "Image Tools" : isImageInput ? "Image + Prompt" : "Prompt"}</h2>
            <div className={`${styles.imageBox} ${showImageInputs ? styles.imageToolsBox : ""}`}>
              {showImageInputs ? (
                <>
                  <textarea
                    className={styles.promptBox}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={workbenchDefaultPrompt}
                    value={prompt}
                  />
                  <div className={styles.toolImageDivider} />
                  <div className={styles.thumbGrid}>
                    {images.map((image) => (
                      <div className={styles.thumbCard} key={image.id}>
                        <img alt={image.file?.name || image.sourceAsset?.fileName || "Input preview"} src={image.previewUrl} />
                        <button
                          aria-label="Remove image"
                          onClick={() => removeImage(image.id)}
                          type="button"
                        >
                          x
                        </button>
                      </div>
                    ))}
                    <label
                      className={styles.addImageCard}
                    >
                      <span>+</span>
                      Add Image
                      <input
                        accept={getWorkbenchUploadAccept()}
                        className={styles.hiddenFileInput}
                        multiple
                        onChange={(event) => {
                          handleImageFiles(event.target.files);
                          event.target.value = "";
                        }}
                        type="file"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <textarea
                  className={styles.promptBox}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={workbenchDefaultPrompt}
                  value={prompt}
                />
              )}
            </div>
          </section>

          {!isImageInput ? (
            <>
              <label className={styles.fieldLabel} htmlFor="model-title">
                Model Title
              </label>
            <div className={styles.inputWrap}>
                <input
                  id="model-title"
                  maxLength={122}
                  onChange={(event) => setModelTitle(event.target.value)}
                  value={modelTitle}
                />
                <span>{modelTitle.length}/122</span>
              </div>
            </>
          ) : null}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Model Tag</label>
            <div className={styles.tagRow}>
              {tags.map((tag) => (
                <span className={styles.tagChip} key={tag}>
                  # {tag}
                  <button
                    aria-label={`Remove ${tag}`}
                    onClick={() => setTags((items) => items.filter((item) => item !== tag))}
                    type="button"
                  >
                    x
                  </button>
                </span>
              ))}
              <button
                className={styles.addTag}
                onClick={() => setTags((items) => [...items, `Tag ${items.length + 1}`].slice(0, 5))}
                type="button"
              >
                +
              </button>
            </div>
          </div>

          {showMultiView ? (
            <>
              <div className={styles.multiHeader}>
                <label className={styles.fieldLabel}>Multi-View</label>
                <div>
                  <span>{multiView ? "on" : "off"}</span>
                  <button
                    aria-label="Toggle multi-view"
                    aria-pressed={multiView}
                    className={styles.toggle}
                    onClick={() => setMultiView((value) => !value)}
                    type="button"
                  >
                    <span />
                  </button>
                </div>
              </div>

              <div className={`${styles.multiBox} ${!multiView ? styles.multiHidden : ""}`}>
                {[0, 1, 2].map((slot) => (
                  <label className={styles.multiCard} key={slot}>
                    <span>+</span>
                    Add Image
                    <input
                      accept={getWorkbenchUploadAccept()}
                      className={styles.hiddenFileInput}
                      disabled={!multiView}
                      onChange={(event) => {
                        handleImageFiles(event.target.files);
                        event.target.value = "";
                      }}
                      type="file"
                    />
                  </label>
                ))}
              </div>
            </>
          ) : null}

          <label className={styles.fieldLabel} htmlFor="model-license">
            Model License
          </label>
          <div className={styles.selectWrap}>
            <select
              id="model-license"
              onChange={(event) => setLicense(event.target.value === "Private" ? "Private" : "Public")}
              value={license}
            >
              <option>Public</option>
              <option>Private</option>
            </select>
          </div>

          <div className={styles.bottomActions}>
            <button className={styles.priceButton} type="button">
              <img alt="" src="/ui-lab/model-detail-uicut/images/detail-bottom-icon-1.png" />
              <span>20.00</span>
            </button>
            <GenerateCtaButton
              className={styles.generateCta}
              disabled={isSubmitting}
              label={isSubmitting ? "SUBMITTING" : "GENERATE"}
              onClick={handleGenerate}
            />
          </div>
          {error ? <span className={styles.formError}>{error}</span> : null}
          </aside>

          <main className={styles.centerPanel}>
            <div className={styles.breadcrumbRow}>
              <button aria-label="Back" type="button">
                {"<"}
              </button>
              <span>HOME</span>
              <em />
              <span>MODEL DETAILS</span>
              <em />
              <strong>WORKBENCH</strong>
            </div>
            <div className={styles.headerLine} />
            <div className={styles.modelMeta}>
              <span>MODEL NAME</span>
              <h1>Monk</h1>
              <em>Public</em>
            </div>

            <div className={styles.statsBox}>
              <div>
                <span>TOPOLOGY</span>
                <strong>Triangle</strong>
              </div>
              <div>
                <span>FACE COUNT</span>
                <strong>16,101</strong>
              </div>
              <div>
                <span>VERTEX COUNT</span>
                <strong>25,981</strong>
              </div>
            </div>

            <div className={styles.viewerStage}>
              <div className={styles.viewerSquare}>
                <div className={styles.viewerSurface}>
                  <ModelViewer
                    className={styles.viewerCanvas}
                    showPlaceholderModel={false}
                    showGround={false}
                    src={activeModelSrc}
                    transparentBackground
                  />
                </div>
              </div>
            </div>
          </main>

          <ModelLibraryPanel
            cards={libraryCards}
            className={styles.rightPanel}
            onSelectCard={(card) => setSelectedModelSrc(card.modelSrc ?? null)}
          />
        </section>
      </div>
    </main>
  );
}
