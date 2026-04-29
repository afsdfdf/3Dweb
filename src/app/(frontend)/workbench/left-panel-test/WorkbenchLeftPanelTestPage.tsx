"use client";

import { useState } from "react";

import { workbenchDefaultPrompt } from "@/app/(frontend)/_lib/workbenchDraft";
import {
  WorkbenchLeftGenerationPanel,
  type WorkbenchImageInput,
  type WorkbenchMode,
} from "../WorkbenchLeftGenerationPanel";
import styles from "../page.module.css";

export function WorkbenchLeftPanelTestPage() {
  const [activeMode, setActiveMode] = useState<WorkbenchMode>("text3d");
  const [error, setError] = useState("");
  const [images, setImages] = useState<WorkbenchImageInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [license, setLicense] = useState<"Private" | "Public">("Public");
  const [modelTitle, setModelTitle] = useState("Monk");
  const [multiView, setMultiView] = useState(true);
  const [prompt, setPrompt] = useState(workbenchDefaultPrompt);
  const [tags, setTags] = useState(["game", "Unnamed"]);

  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError("");
    setImages((current) => {
      const selectedFiles = Array.from(files).slice(
        0,
        Math.max(0, 5 - current.length),
      );
      return [
        ...current,
        ...selectedFiles.map((file) => ({
          file,
          id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          previewUrl: URL.createObjectURL(file),
        })),
      ];
    });
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed?.file) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((image) => image.id !== id);
    });
  };

  const handleGenerate = () => {
    setError("");
    setIsSubmitting(true);
    window.setTimeout(() => setIsSubmitting(false), 500);
  };

  return (
    <main className={styles.page}>
      <div className={styles.stageViewport}>
        <section
          className={styles.stage}
          aria-label="Workbench left panel test page"
        >
          <WorkbenchLeftGenerationPanel
            activeMode={activeMode}
            error={error}
            images={images}
            isSubmitting={isSubmitting}
            license={license}
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
            tags={tags}
          />

          <WorkbenchLeftGenerationPanel
            activeMode={activeMode}
            className={styles.leftPanelCloneRight}
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
            tags={tags}
          />
        </section>
      </div>
    </main>
  );
}
