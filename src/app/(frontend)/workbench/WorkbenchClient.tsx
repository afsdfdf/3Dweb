/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ModelLibraryPanel, type ModelLibraryPanelCard } from "@/components/ui-lab/model-library-panel";
import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import type { TopNavigationUser } from "@/components/ui-lab/top-navigation";

import { ModelViewer } from "../_components/ModelViewer";
import {
  clearWorkbenchDraft,
  readWorkbenchDraft,
  uploadWorkbenchSourceImage,
  workbenchAllowedImageTypes,
  workbenchDefaultPrompt,
  workbenchMaxUploadBytes,
  type WorkbenchSourceImageAsset,
} from "../_lib/workbenchDraft";
import {
  WorkbenchLeftGenerationPanel,
  type WorkbenchImageInput,
  type WorkbenchMode,
} from "./WorkbenchLeftGenerationPanel";
import styles from "./page.module.css";

type WorkbenchClientProps = {
  imageAssetCards?: ModelLibraryPanelCard[];
  libraryCards: ModelLibraryPanelCard[];
  navUser: null | TopNavigationUser;
};

export function WorkbenchClient({
  imageAssetCards: initialImageAssetCards = [],
  libraryCards,
  navUser,
}: WorkbenchClientProps) {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const firstModelSrc = libraryCards[0]?.modelSrc ?? null;
  const imagesRef = useRef<WorkbenchImageInput[]>([]);
  const [activeMode, setActiveMode] = useState<WorkbenchMode>("image3d");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [multiView, setMultiView] = useState(false);
  const [tags, setTags] = useState(["game", "Unnamed"]);
  const [images, setImages] = useState<WorkbenchImageInput[]>([]);
  const [imageAssetCards, setImageAssetCards] = useState<ModelLibraryPanelCard[]>(initialImageAssetCards);
  const [license, setLicense] = useState<"Private" | "Public">("Public");
  const [modelTitle, setModelTitle] = useState("Monk");
  const [prompt, setPrompt] = useState(workbenchDefaultPrompt);
  const [selectedModelSrc, setSelectedModelSrc] = useState<null | string>(firstModelSrc);
  const activeModelSrc = selectedModelSrc ?? firstModelSrc;
  const showImageInputs = activeMode === "image3d" || activeMode === "imageTools";
  const rightPanelCards = activeMode === "imageTools" ? imageAssetCards : libraryCards;
  const rightPanelTitle = activeMode === "imageTools" ? "Image Assets" : "Model Library";

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
      setMultiView(false);
    }

    const draftFlag = searchParams.get("draft");
    if (draftFlag !== "home") return;

    const draft = readWorkbenchDraft();
    if (!draft) return;

    setActiveMode(draft.sourceImageAssets.length > 0 ? "image3d" : draft.mode);
    setMultiView(false);
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
      const availableSlots = Math.max(0, 4 - current.length);
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

    if (!navUser) {
      openAuthModal("login");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
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
      const rawPrompt = prompt.trim();
      const trimmedPrompt =
        sourceImageAssets.length > 0 && rawPrompt === workbenchDefaultPrompt
          ? ""
          : rawPrompt || (sourceImageAssets.length > 0 ? "" : workbenchDefaultPrompt);
      const commonSnapshot = {
        format: "glb",
        targetFormats: ["glb"],
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
                sourceImageAssets,
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
                sourceImageAssets,
              }),
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              method: "POST",
            });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.message || "Generation request failed.");
      }

      if (activeMode === "imageTools") {
        const media = json.media;
        const mediaUrl = typeof media?.url === "string" ? media.url : typeof media?.thumbnailURL === "string" ? media.thumbnailURL : "";
        if (!mediaUrl) {
          throw new Error("Image generated, but no image URL was returned.");
        }

        const sourceAsset: WorkbenchSourceImageAsset = {
          contentType: typeof media?.mimeType === "string" ? media.mimeType : "image/png",
          fileName: typeof media?.filename === "string" ? media.filename : `image-${media?.id ?? Date.now()}.png`,
          mediaId: typeof media?.id === "number" ? media.id : Number(media?.id) || undefined,
          publicUrl: mediaUrl,
        };

        setImageAssetCards((current) => [
          {
            date: new Date().toISOString().slice(0, 10),
            id: sourceAsset.mediaId ?? Date.now(),
            kind: "image",
            license: "Private",
            name: sourceAsset.fileName,
            previewAlt: sourceAsset.fileName,
            previewSrc: sourceAsset.publicUrl,
            sourceAsset,
          },
          ...current,
        ]);
        return;
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

          <AuthModalStage fitViewport topOffset={60}>
          <WorkbenchLeftGenerationPanel
            activeMode={activeMode}
            error={error}
            images={images}
            isSubmitting={isSubmitting}
            license={license}
            modeTabs="dual"
            modelTitle={modelTitle}
            multiView={multiView}
            onAddImages={handleImageFiles}
            onGenerate={handleGenerate}
            onLicenseChange={setLicense}
            onModeChange={setActiveMode}
            onModelTitleChange={setModelTitle}
            onMultiViewChange={setMultiView}
            onPromptChange={setPrompt}
            onRemoveImage={removeImage}
            onTagsChange={setTags}
            prompt={prompt}
            streamlinedImageFlow
            tags={tags}
          />

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

          <div className={styles.rightPanel}>
            <ModelLibraryPanel
              cards={rightPanelCards}
              onSelectCard={(card) => {
                const sourceAsset = card.sourceAsset;
                if (card.kind === "image" && sourceAsset) {
                  setImages((current) => {
                    if (current.some((image) => image.sourceAsset?.publicUrl === sourceAsset.publicUrl)) {
                      return current;
                    }

                    return [
                      ...current,
                      {
                        id: `generated-${sourceAsset.mediaId ?? card.id}`,
                        previewUrl: sourceAsset.publicUrl,
                        sourceAsset,
                      },
                    ].slice(0, 4);
                  });
                  setActiveMode("image3d");
                  setMultiView(true);
                  return;
                }

                setSelectedModelSrc(card.modelSrc ?? null);
              }}
              title={rightPanelTitle}
            />
          </div>
          </AuthModalStage>
        </section>
      </div>
    </main>
  );
}
