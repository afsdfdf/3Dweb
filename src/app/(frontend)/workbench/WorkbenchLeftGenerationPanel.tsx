/* eslint-disable @next/next/no-img-element */
"use client";

import { GenerateCtaButton } from "@/components/ui-lab/action-buttons";
import { ModuleCommonFrame } from "@/components/ui-lab/module-common-frame";
import {
  SmallButtonPair,
  SmallButtonTriple,
} from "@/components/ui-lab/small-button-pair/small-button-pair";

import {
  getWorkbenchUploadAccept,
  type WorkbenchSourceImageAsset,
} from "../_lib/workbenchDraft";
import styles from "./page.module.css";

export type WorkbenchMode = "text3d" | "image3d" | "imageTools";

export type WorkbenchImageInput = {
  file?: File;
  id: string;
  previewUrl: string;
  sourceAsset?: WorkbenchSourceImageAsset;
};

type WorkbenchLeftGenerationPanelProps = {
  activeMode: WorkbenchMode;
  className?: string;
  error?: string;
  images: WorkbenchImageInput[];
  isSubmitting?: boolean;
  license: "Private" | "Public";
  modeTabs?: "dual" | "triple";
  modelTitle: string;
  multiView: boolean;
  onAddImages: (files: FileList | null) => void;
  onGenerate: () => void;
  onLicenseChange: (license: "Private" | "Public") => void;
  onModeChange: (mode: WorkbenchMode) => void;
  onModelTitleChange: (title: string) => void;
  onMultiViewChange: (enabled: boolean) => void;
  onPromptChange: (prompt: string) => void;
  onRemoveImage: (id: string) => void;
  onTagsChange: (tags: string[]) => void;
  prompt: string;
  tags: string[];
};

export function WorkbenchLeftGenerationPanel({
  activeMode,
  className,
  error = "",
  images,
  isSubmitting = false,
  license,
  modelTitle,
  modeTabs = "triple",
  multiView,
  onAddImages,
  onGenerate,
  onLicenseChange,
  onModeChange,
  onModelTitleChange,
  onMultiViewChange,
  onPromptChange,
  onRemoveImage,
  onTagsChange,
  prompt,
  tags,
}: WorkbenchLeftGenerationPanelProps) {
  const isImageInput = activeMode === "image3d";
  const isImageTools = activeMode === "imageTools";
  const showMultiView = activeMode === "image3d";
  const activeModeButton =
    activeMode === "image3d"
      ? "purple"
      : activeMode === "text3d"
        ? "dark"
        : "button";
  const showImageInputs = isImageInput || isImageTools;

  const handleModeButtonChange = (button: "button" | "dark" | "purple") => {
    if (button === "purple") {
      onModeChange("image3d");
      onMultiViewChange(true);
      return;
    }
    if (button === "dark") {
      onModeChange("text3d");
      onMultiViewChange(false);
      return;
    }
    onModeChange("imageTools");
    onMultiViewChange(false);
  };

  return (
    <aside className={`${styles.leftPanel} ${className ?? ""}`}>
      <ModuleCommonFrame
        className={styles.panelFrameOverlay}
        contentClassName={styles.panelFrameContent}
        style={{ width: "100%", height: "100%" }}
      />
      <div
        className={`${styles.modeTabsMount} ${modeTabs === "dual" ? styles.modeTabsMountDual : ""}`}
      >
        {modeTabs === "dual" ? (
          <SmallButtonPair
            darkLabel="Image Tools"
            purpleLabel="Image To 3D"
            selected={activeMode === "image3d" ? "purple" : "dark"}
            onChange={(button) => {
              if (button === "purple") {
                onModeChange("image3d");
                onMultiViewChange(true);
                return;
              }
              onModeChange("imageTools");
              onMultiViewChange(false);
            }}
          />
        ) : (
          <SmallButtonTriple
            labels={{
              purple: "Image To 3D",
              dark: "Text To 3D",
              button: "Image Tools",
            }}
            selected={activeModeButton}
            onChange={handleModeButtonChange}
          />
        )}
      </div>

      <section className={styles.formSection}>
        <h2>
          {isImageTools
            ? "Image Tools"
            : isImageInput
              ? "Image + Prompt"
              : "Prompt"}
        </h2>
        <div
          className={`${styles.imageBox} ${showImageInputs ? styles.imageToolsBox : ""}`}
        >
          {showImageInputs ? (
            <>
              <textarea
                className={styles.promptBox}
                onChange={(event) => onPromptChange(event.target.value)}
                value={prompt}
              />
              <div className={styles.toolImageDivider} />
              <div className={styles.thumbGrid}>
                {images.map((image) => (
                  <div className={styles.thumbCard} key={image.id}>
                    <img
                      alt={
                        image.file?.name ||
                        image.sourceAsset?.fileName ||
                        "Input preview"
                      }
                      src={image.previewUrl}
                    />
                    <button
                      aria-label="Remove image"
                      onClick={() => onRemoveImage(image.id)}
                      type="button"
                    >
                      x
                    </button>
                  </div>
                ))}
                <label className={styles.addImageCard}>
                  <span>+</span>
                  Add Image
                  <input
                    accept={getWorkbenchUploadAccept()}
                    className={styles.hiddenFileInput}
                    multiple
                    onChange={(event) => {
                      onAddImages(event.target.files);
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
              onChange={(event) => onPromptChange(event.target.value)}
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
              onChange={(event) => onModelTitleChange(event.target.value)}
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
                onClick={() =>
                  onTagsChange(tags.filter((item) => item !== tag))
                }
                type="button"
              >
                x
              </button>
            </span>
          ))}
          <button
            className={styles.addTag}
            onClick={() =>
              onTagsChange([...tags, `Tag ${tags.length + 1}`].slice(0, 5))
            }
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
                onClick={() => onMultiViewChange(!multiView)}
                type="button"
              >
                <span />
              </button>
            </div>
          </div>

          <div
            className={`${styles.multiBox} ${!multiView ? styles.multiHidden : ""}`}
          >
            {[0, 1, 2].map((slot) => (
              <label className={styles.multiCard} key={slot}>
                <span>+</span>
                Add Image
                <input
                  accept={getWorkbenchUploadAccept()}
                  className={styles.hiddenFileInput}
                  disabled={!multiView}
                  onChange={(event) => {
                    onAddImages(event.target.files);
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
          onChange={(event) =>
            onLicenseChange(
              event.target.value === "Private" ? "Private" : "Public",
            )
          }
          value={license}
        >
          <option>Public</option>
          <option>Private</option>
        </select>
      </div>

      <div className={styles.bottomActions}>
        <button className={styles.priceButton} type="button">
          <img
            alt=""
            src="/ui-lab/model-detail-uicut/images/detail-bottom-icon-1.png"
          />
          <span>20.00</span>
        </button>
        <GenerateCtaButton
          className={styles.generateCta}
          disabled={isSubmitting}
          label={isSubmitting ? "SUBMITTING" : "GENERATE"}
          onClick={onGenerate}
        />
      </div>
      {error ? <span className={styles.formError}>{error}</span> : null}
    </aside>
  );
}
