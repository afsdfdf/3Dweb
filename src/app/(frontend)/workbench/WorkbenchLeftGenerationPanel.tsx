/* eslint-disable @next/next/no-img-element */
"use client";

import { GenerateCtaButton } from "@/components/ui-lab/action-buttons";
import { ModuleCommonFrame } from "@/components/ui-lab/module-common-frame";
import {
  SmallButtonPair,
  SmallButtonTriple,
} from "@/components/ui-lab/small-button-pair/small-button-pair";
import { useEffect, useRef, useState } from "react";

import {
  getWorkbenchUploadAccept,
  workbenchDefaultPrompt,
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
  generationCreditCost?: number;
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
  streamlinedImageFlow?: boolean;
  tags: string[];
};

export function WorkbenchLeftGenerationPanel({
  activeMode,
  className,
  error = "",
  generationCreditCost = 20,
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
  streamlinedImageFlow = false,
  tags,
}: WorkbenchLeftGenerationPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [licenseMenuOpen, setLicenseMenuOpen] = useState(false);
  const [modelType, setModelType] = useState("Standard");
  const [tagDraft, setTagDraft] = useState("");
  const [topology, setTopology] = useState("Triangle");
  const [polycount, setPolycount] = useState("30000");
  const [pbrEnabled, setPbrEnabled] = useState(true);
  const [hdTextureEnabled, setHdTextureEnabled] = useState(false);
  const licenseMenuRef = useRef<HTMLDivElement | null>(null);

  const isDualMode = modeTabs === "dual";
  const isImage3D = activeMode === "image3d";
  const isImageToImage = activeMode === "imageTools";
  const isTextTo3D = activeMode === "text3d";
  const isImageOutputMode = isImageToImage;
  const showMultiView = isImage3D;
  const maxReferenceImages = isImage3D && multiView ? 4 : 1;
  const canAddMoreImages = images.length < maxReferenceImages;
  const replaceSingleImage = isImageToImage && maxReferenceImages === 1 && images.length >= maxReferenceImages;
  const showPrimaryAddImageCard = images.length === 0 || replaceSingleImage;
  const addImageLabel = replaceSingleImage ? "Replace Image" : canAddMoreImages ? "Add Image" : "Max Reached";
  const activeModeButton =
    activeMode === "image3d"
      ? "purple"
      : activeMode === "text3d"
        ? "dark"
        : "button";
  const showImageInputs = isImage3D || isImageToImage;
  const useStreamlinedImageFlow =
    streamlinedImageFlow && (showImageInputs || isTextTo3D);

  useEffect(() => {
    if (!licenseMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!licenseMenuRef.current?.contains(event.target as Node)) {
        setLicenseMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLicenseMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [licenseMenuOpen]);

  const commitTagDraft = () => {
    const nextValue = tagDraft.trim().replace(/^#+\s*/, "");
    if (!nextValue) {
      setEditingTagIndex(null);
      setTagDraft("");
      return;
    }

    if (editingTagIndex === -1) {
      if (tags.length >= 5 || tags.includes(nextValue)) {
        setEditingTagIndex(null);
        setTagDraft("");
        return;
      }

      onTagsChange([...tags, nextValue]);
      setEditingTagIndex(null);
      setTagDraft("");
      return;
    }

    if (editingTagIndex !== null) {
      const nextTags = [...tags];
      nextTags[editingTagIndex] = nextValue;
      onTagsChange(Array.from(new Set(nextTags)));
    }

    setEditingTagIndex(null);
    setTagDraft("");
  };

  const handleModeButtonChange = (button: "button" | "dark" | "purple") => {
    if (button === "purple") {
      onModeChange("image3d");
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
    <aside
      className={`${styles.leftPanel} ${isDualMode ? styles.leftPanelDual : ""} ${className ?? ""}`}
    >
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
            darkLabel="Image"
            purpleLabel="Image To 3D"
            selected={activeMode === "image3d" ? "purple" : "dark"}
            onChange={(button) => {
              if (button === "purple") {
                onModeChange("image3d");
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
              button: "Image To Image",
            }}
            selected={activeModeButton}
            onChange={handleModeButtonChange}
          />
        )}
      </div>

      <div className={styles.panelScrollArea}>
        <section className={styles.formSection}>
          <h2>Prompt</h2>
          <div
            className={`${styles.imageBox} ${showImageInputs && !useStreamlinedImageFlow ? styles.imageToolsBox : ""} ${useStreamlinedImageFlow ? styles.promptOnlyBox : ""}`}
          >
            <textarea
              className={styles.promptBox}
              onFocus={() => {
                if (prompt === workbenchDefaultPrompt) {
                  onPromptChange("");
                }
              }}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder={workbenchDefaultPrompt}
              value={prompt}
            />
          </div>
        </section>

        {showImageInputs ? (
          <section className={styles.mediaSection}>
            <div className={styles.mediaSectionHeader}>
              <h2>{maxReferenceImages === 1 ? "Reference Image" : "Reference Images"}</h2>
              <span>{images.length}/{maxReferenceImages}</span>
            </div>
            <p className={styles.mediaSectionHint}>
              {isImageToImage
                ? "Upload the main image you want to transform."
                : multiView
                  ? "Add angle references for the same subject."
                  : "Upload the main image you want to convert."}
            </p>
            <div className={styles.referenceBox}>
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
                {showPrimaryAddImageCard ? (
                  <label
                    className={`${styles.addImageCard} ${
                      !canAddMoreImages && !replaceSingleImage ? styles.addImageCardDisabled : ""
                    }`}
                  >
                    <span>+</span>
                    {addImageLabel}
                    <input
                      accept={getWorkbenchUploadAccept()}
                      className={styles.hiddenFileInput}
                      disabled={!canAddMoreImages && !replaceSingleImage}
                      multiple={isImage3D && multiView}
                      onChange={(event) => {
                        onAddImages(event.target.files);
                        event.target.value = "";
                      }}
                      type="file"
                    />
                  </label>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {useStreamlinedImageFlow ? (
          <section className={styles.metaSection}>
            <div className={styles.metaHeader}>
              <div>
                <h2>{isImageOutputMode ? "Image Title" : "Model Name"}</h2>
                <p className={styles.metaHint}>
                  {isImageOutputMode
                    ? "A default image title is assigned for this result. You can adjust it later if needed."
                    : "A default name is assigned for this result. You can adjust it later if needed."}
                </p>
              </div>
            </div>
            <div className={styles.inputWrap}>
              <input
                id="model-title-streamlined"
                maxLength={122}
                onChange={(event) => onModelTitleChange(event.target.value)}
                placeholder="Enter model name"
                value={modelTitle}
              />
              <span>{modelTitle.length}/122</span>
            </div>
          </section>
        ) : null}

        {useStreamlinedImageFlow && showMultiView ? (
          <section className={styles.optionalSection}>
            <div className={styles.optionalHeaderRow}>
              <div className={styles.optionalTitleBlock}>
                <h2>Multi-View</h2>
              </div>
              <div className={styles.multiHeaderInline}>
                <span>{multiView ? "On" : "Off"}</span>
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

            {!multiView ? (
              <p className={styles.optionalHint}>
                Add extra angle references when one image is not enough to describe the shape.
              </p>
            ) : null}

            {multiView ? (
              <div className={styles.optionalBox}>
                <div className={`${styles.multiBox} ${styles.multiBoxCompact}`}>
                  {[0, 1, 2].map((slot) => (
                    <label className={styles.multiCard} key={slot}>
                      <span>+</span>
                      Add Image
                      <input
                        accept={getWorkbenchUploadAccept()}
                        className={styles.hiddenFileInput}
                        disabled={images.length >= 4}
                        onChange={(event) => {
                          onAddImages(event.target.files);
                          event.target.value = "";
                        }}
                        type="file"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {isDualMode && !streamlinedImageFlow ? (
          <section className={styles.generationWorkflow}>
            <div className={styles.workflowHeader}>
              <span>Generation</span>
              <strong>4.0</strong>
            </div>
            <div className={styles.workflowSteps}>
              <span className={styles.workflowStepActive}>Preview Ready</span>
              <span>Refine Locked</span>
            </div>
          </section>
        ) : null}

        {!isImage3D && !useStreamlinedImageFlow ? (
          <>
            <label className={styles.fieldLabel} htmlFor="model-title">
              {isImageOutputMode ? "Image Title" : "Model Title"}
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
            {tags.map((tag, index) => (
              <span className={styles.tagChip} key={tag}>
                <button
                  className={styles.tagTextButton}
                  onClick={() => {
                    setEditingTagIndex(index);
                    setTagDraft(tag);
                  }}
                  type="button"
                >
                  # {tag}
                </button>
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
              disabled={tags.length >= 5}
              onClick={() => {
                setEditingTagIndex(-1);
                setTagDraft("");
              }}
              type="button"
            >
              +
            </button>
          </div>
          {editingTagIndex !== null ? (
            <div className={styles.tagEditor}>
              <input
                autoFocus
                className={styles.tagEditorInput}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitTagDraft();
                  }

                  if (event.key === "Escape") {
                    setEditingTagIndex(null);
                    setTagDraft("");
                  }
                }}
                placeholder="Enter tag"
                value={tagDraft}
              />
              <button className={styles.tagEditorAction} onClick={commitTagDraft} type="button">
                OK
              </button>
              <button
                className={styles.tagEditorGhost}
                onClick={() => {
                  setEditingTagIndex(null);
                  setTagDraft("");
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>

        {isDualMode && !streamlinedImageFlow ? (
          <section className={styles.advancedSection}>
            <button
              className={styles.advancedToggle}
              onClick={() => setAdvancedOpen((value) => !value)}
              type="button"
            >
              <span>Advanced</span>
              <em>{advancedOpen ? "Hide" : "Show"}</em>
            </button>

            {advancedOpen ? (
              <div className={styles.advancedGrid}>
                <label>
                  <span>Model Type</span>
                  <select
                    onChange={(event) => setModelType(event.target.value)}
                    value={modelType}
                  >
                    <option>Standard</option>
                    <option>Low Poly</option>
                  </select>
                </label>
                <label>
                  <span>Topology</span>
                  <select
                    onChange={(event) => setTopology(event.target.value)}
                    value={topology}
                  >
                    <option>Triangle</option>
                    <option>Quad</option>
                  </select>
                </label>
                <label>
                  <span>Polycount</span>
                  <input
                    inputMode="numeric"
                    onChange={(event) => setPolycount(event.target.value)}
                    value={polycount}
                  />
                </label>
                <div className={styles.advancedSwitches}>
                  <button
                    aria-pressed={pbrEnabled}
                    onClick={() => setPbrEnabled((value) => !value)}
                    type="button"
                  >
                    PBR
                  </button>
                  <button
                    aria-pressed={hdTextureEnabled}
                    onClick={() => setHdTextureEnabled((value) => !value)}
                    type="button"
                  >
                    HD Texture
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {showMultiView && !useStreamlinedImageFlow ? (
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
                    disabled={!multiView || images.length >= 4}
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

        {isImageOutputMode ? (
          <p className={styles.visibilityNote}>Generated images stay private in your assets.</p>
        ) : (
          <>
            <label className={styles.fieldLabel} htmlFor="model-license">
              Model License
            </label>
            <div className={styles.selectWrap} ref={licenseMenuRef}>
              <button
                aria-controls="model-license-menu"
                aria-expanded={licenseMenuOpen}
                className={styles.selectButton}
                id="model-license"
                onClick={() => setLicenseMenuOpen((value) => !value)}
                type="button"
              >
                <span>{license}</span>
              </button>
              {licenseMenuOpen ? (
                <div className={styles.selectMenu} id="model-license-menu" role="listbox">
                  {(["Public", "Private"] as const).map((option) => (
                    <button
                      aria-selected={license === option}
                      className={`${styles.selectOption} ${license === option ? styles.selectOptionActive : ""}`}
                      key={option}
                      onClick={() => {
                        onLicenseChange(option);
                        setLicenseMenuOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      <div className={styles.panelFooterArea}>
        <div className={styles.bottomActions}>
        <div
          aria-label={`${generationCreditCost} credits per generation`}
          className={styles.priceButton}
        >
          <img
            alt=""
            src="/ui-lab/model-detail-uicut/images/detail-bottom-icon-1.png"
          />
          <span className={styles.priceButtonText}>
            <strong>{generationCreditCost}</strong>
            <small>credits</small>
          </span>
        </div>
        <GenerateCtaButton
          className={styles.generateCta}
          label={
            isSubmitting
              ? "GENERATE AGAIN"
              : isDualMode && !streamlinedImageFlow
                ? "GENERATE PREVIEW"
                : "GENERATE"
          }
          onClick={onGenerate}
        />
      </div>
        {error ? <span className={styles.formError}>{error}</span> : null}
      </div>
    </aside>
  );
}
