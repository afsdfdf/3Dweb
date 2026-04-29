"use client";

import { ChevronDown, ImagePlus, Plus, Type, X } from "lucide-react";
import { useMemo, useState } from "react";

import { WorkbenchSideContainer } from "./WorkbenchSideContainer";
import styles from "./WorkbenchScaffold.module.css";

type PrimaryMode = "text3d" | "image3d" | "imagegen";
type ImageGenMode = "image" | "text";

const defaultPrompt =
  "A majestic red dragon in a dynamic pose, with its full wings completely visible and uncropped, the entire dragon is fully visible in the frame, set against a clean white background, fantasy art style.";

export function WorkbenchLeftPanel() {
  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>("text3d");
  const [imageGenMode, setImageGenMode] = useState<ImageGenMode>("text");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("Monk");
  const [multiView, setMultiView] = useState(true);
  const [license, setLicense] = useState<"Private" | "Public">("Public");
  const [tags, setTags] = useState(["game", "Unnamed"]);
  const [showLicenseMenu, setShowLicenseMenu] = useState(false);
  const [showTitleMenu, setShowTitleMenu] = useState(false);

  const isImage3D = primaryMode === "image3d";
  const isText3D = primaryMode === "text3d";
  const isImageGen = primaryMode === "imagegen";

  const showImageGrid = isImage3D || (isImageGen && imageGenMode === "image");
  const titleCount = title.length;

  const sectionTitle = useMemo(
    () => (showImageGrid ? "Image" : "Prompt"),
    [showImageGrid],
  );

  return (
    <WorkbenchSideContainer>
      <div className={styles.leftPanel}>
        <div className={styles.primaryTabs}>
          <button
            className={`${styles.primaryTab} ${isText3D ? styles.primaryTabActive : ""}`}
            onClick={() => {
              setPrimaryMode("text3d");
              setMultiView(false);
            }}
            type="button"
          >
            Text To 3D
          </button>
          <button
            className={`${styles.primaryTab} ${isImage3D ? styles.primaryTabActive : ""}`}
            onClick={() => {
              setPrimaryMode("image3d");
              setMultiView(true);
            }}
            type="button"
          >
            Image To 3D
          </button>
          <button
            className={`${styles.primaryTab} ${isImageGen ? styles.primaryTabActive : ""}`}
            onClick={() => {
              setPrimaryMode("imagegen");
              setMultiView(false);
            }}
            type="button"
          >
            Image Tools
          </button>
        </div>

        <div
          className={`${styles.secondaryTabs} ${!isImageGen ? styles.secondaryTabsHidden : ""}`}
        >
          <button
            className={`${styles.secondaryTab} ${imageGenMode === "text" ? styles.secondaryTabActive : ""}`}
            onClick={() => setImageGenMode("text")}
            type="button"
          >
            <Type size={14} />
            <span>Text To Image</span>
          </button>
          <button
            className={`${styles.secondaryTab} ${imageGenMode === "image" ? styles.secondaryTabActive : ""}`}
            onClick={() => setImageGenMode("image")}
            type="button"
          >
            <ImagePlus size={14} />
            <span>Image To Image</span>
          </button>
        </div>

        <section>
          <div className={styles.panelSectionHeader}>
            <h3 className={styles.panelSectionTitle}>{sectionTitle}</h3>
          </div>

          <div className={styles.imageDropzone}>
            {showImageGrid ? (
              <div className={styles.imageDropzoneInner}>
                <button className={styles.addImageCard} type="button">
                  <span className={styles.addImageIcon}>
                    <Plus size={18} />
                  </span>
                  <span className={styles.addImageLabel}>Add Image</span>
                </button>
              </div>
            ) : (
              <textarea
                className={styles.promptTextarea}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={defaultPrompt}
                value={prompt}
              />
            )}
          </div>
        </section>

        <section className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Model Title</label>
          <div className={styles.inputWrap}>
            <button
              className={styles.selectButton}
              onClick={() => setShowTitleMenu((value) => !value)}
              type="button"
            >
              <span>{title || "Please enter the title"}</span>
              <div className={styles.selectMeta}>
                <span className={styles.fieldCounter}>{titleCount}/122</span>
                <ChevronDown size={16} />
              </div>
            </button>

            {showTitleMenu ? (
              <div className={styles.dropdownMenu}>
                {["Monk", "Unnamed", "Fox Sorcerer"].map((item) => (
                  <button
                    className={styles.dropdownItem}
                    key={item}
                    onClick={() => {
                      setTitle(item);
                      setShowTitleMenu(false);
                    }}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Model Tag</label>
          <div className={styles.tagRow}>
            {tags.map((tag) => (
              <span className={styles.tagChip} key={tag}>
                <span className={styles.tagChipText}># {tag}</span>
                <button
                  className={styles.tagRemoveButton}
                  onClick={() =>
                    setTags((current) => current.filter((item) => item !== tag))
                  }
                  type="button"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <button
              className={styles.tagAddButton}
              onClick={() => {
                setTags((current) => {
                  const next = [...current];
                  next.push(`Tag ${current.length + 1}`);
                  return next.slice(0, 8);
                });
              }}
              type="button"
            >
              <Plus size={12} />
            </button>
          </div>
        </section>

        <section className={styles.fieldGroup}>
          <div className={styles.multiViewHeader}>
            <label className={styles.fieldLabel}>Multi-View</label>
            <div className={styles.multiViewToggleRow}>
              <span className={styles.toggleText}>
                {multiView ? "on" : "off"}
              </span>
              <button
                className={styles.toggleTrack}
                onClick={() => setMultiView((value) => !value)}
                type="button"
              >
                <span
                  className={`${styles.toggleThumb} ${!multiView ? styles.toggleThumbOff : ""}`}
                />
              </button>
            </div>
          </div>

          <div
            className={`${styles.multiViewBox} ${!multiView ? styles.multiViewBoxHidden : ""}`}
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <button
                className={styles.multiViewCard}
                key={`multi-${index + 1}`}
                type="button"
              >
                <span className={styles.addImageIcon}>
                  <Plus size={16} />
                </span>
                <span className={styles.addImageLabel}>Add Image</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Model License</label>
          <div className={styles.inputWrap}>
            <button
              className={styles.selectButton}
              onClick={() => setShowLicenseMenu((value) => !value)}
              type="button"
            >
              <span>{license}</span>
              <ChevronDown size={16} />
            </button>

            {showLicenseMenu ? (
              <div className={styles.dropdownMenu}>
                {(["Public", "Private"] as const).map((item) => (
                  <button
                    className={styles.dropdownItem}
                    key={item}
                    onClick={() => {
                      setLicense(item);
                      setShowLicenseMenu(false);
                    }}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className={styles.leftBottomBar}>
          <button className={styles.priceButton} type="button">
            <span className={styles.priceCoin}>◎</span>
            <span>20.00</span>
          </button>
          <button className={styles.generateButton} type="button">
            Generate
          </button>
        </div>
      </div>
    </WorkbenchSideContainer>
  );
}
