/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  generationCreditCosts?: GenerationCreditCosts;
  imageAssetCards?: ModelLibraryPanelCard[];
  initialPendingTasks?: PendingGenerationTask[];
  libraryCards: ModelLibraryPanelCard[];
  navUser: null | TopNavigationUser;
};

type GenerationCreditCosts = {
  image: number;
  imageTo3D: number;
  multiImageTo3D: number;
  text: number;
  textTo3D: number;
};

type PendingGenerationStatus = "failed" | "finalizing" | "processing" | "queued" | "timeout" | "uploading";

type PendingGenerationTask = {
  cardId: number;
  createdAt: string;
  failureReason?: null | string;
  kind: "image" | "model";
  license: "Private" | "Public";
  previewSrc?: null | string;
  progress: number;
  status: PendingGenerationStatus;
  taskCode?: null | string;
  taskId?: null | number;
  title: string;
};

const syncIntervalMs = Math.max(1000, Number(process.env.NEXT_PUBLIC_TASK_SYNC_INTERVAL_MS || 5000));

const defaultGenerationCreditCosts: GenerationCreditCosts = {
  image: 20,
  imageTo3D: 20,
  multiImageTo3D: 20,
  text: 20,
  textTo3D: 20,
};

const isTerminalGenerationStatus = (status: string) => {
  return status === "succeeded" || status === "failed" || status === "timeout";
};

const getPendingTaskIdentity = (task: PendingGenerationTask) => {
  return task.taskId ? `task:${task.taskId}` : `card:${task.cardId}`;
};

const formatLocalCardDate = (value: string | Date = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day}\n${hours}:${minutes}`;
};

const getTaskModelId = (task: unknown) => {
  if (!task || typeof task !== "object" || Array.isArray(task)) return 0;

  const resultModel = (task as { resultModel?: unknown }).resultModel;
  const id =
    resultModel && typeof resultModel === "object" && !Array.isArray(resultModel)
      ? Number((resultModel as { id?: unknown }).id)
      : Number(resultModel);

  return Number.isFinite(id) && id > 0 ? id : 0;
};

const getTaskThumbnailURL = (task: unknown) => {
  if (!task || typeof task !== "object" || Array.isArray(task)) return null;

  const callbackPayload = (task as { callbackPayload?: unknown }).callbackPayload;
  if (!callbackPayload || typeof callbackPayload !== "object" || Array.isArray(callbackPayload)) return null;

  const thumbnailUrl = (callbackPayload as { thumbnailUrl?: unknown }).thumbnailUrl;
  return typeof thumbnailUrl === "string" && thumbnailUrl.trim() ? thumbnailUrl.trim() : null;
};

const getImageTaskMedia = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const media = (payload as { media?: unknown }).media;
  if (media && typeof media === "object" && !Array.isArray(media)) {
    return media as Record<string, unknown>;
  }

  const task = (payload as { task?: unknown }).task;
  if (!task || typeof task !== "object" || Array.isArray(task)) return null;

  const callbackPayload = (task as { callbackPayload?: unknown }).callbackPayload;
  if (!callbackPayload || typeof callbackPayload !== "object" || Array.isArray(callbackPayload)) return null;

  const imageGeneration = (callbackPayload as { imageGeneration?: unknown }).imageGeneration;
  if (!imageGeneration || typeof imageGeneration !== "object" || Array.isArray(imageGeneration)) return null;

  const resultMediaUrl = (imageGeneration as { resultMediaUrl?: unknown }).resultMediaUrl;
  const resultMediaId = (imageGeneration as { resultMediaId?: unknown }).resultMediaId;
  const mediaUrl = typeof resultMediaUrl === "string" ? resultMediaUrl : "";

  if (!mediaUrl) return null;

  return {
    id: resultMediaId,
    mimeType: "image/png",
    thumbnailURL: mediaUrl,
    url: mediaUrl,
  };
};

const getTaskStatus = (value: unknown): PendingGenerationStatus => {
  if (value === "failed" || value === "processing" || value === "queued" || value === "timeout") {
    return value;
  }

  return "processing";
};

const getTaskProgress = (value: unknown) => {
  const progress = Number(value);
  return Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0;
};

const createPendingCardId = () => {
  return -Math.max(1, Math.floor(Date.now() + Math.random() * 1000));
};

const buildViewerURL = (modelId: number) => {
  return `/api/platform/models/${encodeURIComponent(String(modelId))}/viewer?format=glb`;
};

class GenerationRequestError extends Error {
  status: number;

  constructor(args: { message: string; status: number }) {
    super(args.message);
    this.name = "GenerationRequestError";
    this.status = args.status;
  }
}

const insufficientCreditsMessage = "Insufficient credits. Please add credits before generating.";

const buildInsufficientCreditsMessage = (requiredCredits: number) => {
  return `${insufficientCreditsMessage} This generation requires ${requiredCredits} credits.`;
};

const getNavUserCreditBalance = (user: TopNavigationUser) => {
  const value = user.creditsBalance ?? user.credits;
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
};

const normalizeCreditCost = (value: unknown, fallback: number) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.ceil(numberValue) : fallback;
};

const getActiveGenerationCreditCost = (args: {
  activeMode: WorkbenchMode;
  costs: GenerationCreditCosts;
  imageCount: number;
}) => {
  const { activeMode, costs, imageCount } = args;

  if (activeMode === "imageTools") {
    return normalizeCreditCost(imageCount > 0 ? costs.image : costs.text, 20);
  }

  if (activeMode === "image3d") {
    if (imageCount > 1) return normalizeCreditCost(costs.multiImageTo3D, 20);
    if (imageCount === 1) return normalizeCreditCost(costs.imageTo3D, 20);
    return normalizeCreditCost(costs.textTo3D, 20);
  }

  return normalizeCreditCost(costs.textTo3D, 20);
};

const isInsufficientCreditsFailure = (args: { message: string; status: number }) => {
  return args.status === 402 || /insufficient credits/i.test(args.message);
};

const getPendingGenerationStatusLabel = (task: PendingGenerationTask) => {
  if (task.status === "uploading") return "Preparing request";
  if (task.status === "queued") return "Queued";
  if (task.status === "finalizing") return task.kind === "image" ? "Finalizing image" : "Finalizing model";
  if (task.status === "failed") return "Generation failed";
  if (task.status === "timeout") return "Generation timed out";
  return task.kind === "image" ? "Generating image" : "Generating model";
};

const getPendingGenerationDetail = (task: PendingGenerationTask) => {
  if (task.failureReason) return task.failureReason;
  if (task.taskCode) return `Task ${task.taskCode}`;
  return "Waiting for task code";
};

const getOptimisticProgressCeiling = (task: PendingGenerationTask) => {
  if (task.status === "uploading") return 4;
  if (task.status === "queued") return 12;
  if (task.status === "finalizing") return 99;
  if (task.status === "processing") return 96;
  return task.progress;
};

const toPendingCard = (task: PendingGenerationTask): ModelLibraryPanelCard => ({
  date: formatLocalCardDate(task.createdAt),
  generationProgress: task.progress,
  generationState: task.status === "failed" || task.status === "timeout" ? "failed" : "generating",
  generationStatusLabel: task.failureReason || getPendingGenerationStatusLabel(task),
  generationTaskCode: task.taskCode ?? null,
  generationTaskId: task.taskId ?? null,
  id: task.cardId,
  kind: task.kind,
  license: task.status === "failed" || task.status === "timeout" ? "Failed" : "Queued",
  name: task.title,
  previewAlt: `${task.title} generation preview`,
  previewSrc: task.previewSrc,
});

export function WorkbenchClient({
  generationCreditCosts = defaultGenerationCreditCosts,
  imageAssetCards: initialImageAssetCards = [],
  initialPendingTasks = [],
  libraryCards,
  navUser,
}: WorkbenchClientProps) {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const firstModelSrc = libraryCards[0]?.modelSrc ?? null;
  const imagesRef = useRef<WorkbenchImageInput[]>([]);
  const pendingTasksRef = useRef<PendingGenerationTask[]>([]);
  const syncingTaskIdsRef = useRef(new Set<number>());
  const [activePendingCardId, setActivePendingCardId] = useState<null | number>(
    () => initialPendingTasks[0]?.cardId ?? null,
  );
  const [activeMode, setActiveMode] = useState<WorkbenchMode>(
    () => (initialPendingTasks[0]?.kind === "image" ? "imageTools" : "image3d"),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [multiView, setMultiView] = useState(false);
  const [tags, setTags] = useState(["game", "Unnamed"]);
  const [images, setImages] = useState<WorkbenchImageInput[]>([]);
  const [imageAssetCards, setImageAssetCards] = useState<ModelLibraryPanelCard[]>(initialImageAssetCards);
  const [license, setLicense] = useState<"Private" | "Public">("Public");
  const [localModelCards, setLocalModelCards] = useState<ModelLibraryPanelCard[]>([]);
  const [modelTitle, setModelTitle] = useState("Monk");
  const [pendingTasks, setPendingTasks] = useState<PendingGenerationTask[]>(
    () => initialPendingTasks,
  );
  const [prompt, setPrompt] = useState(workbenchDefaultPrompt);
  const [selectedImageCard, setSelectedImageCard] = useState<ModelLibraryPanelCard | null>(null);
  const [selectedModelSrc, setSelectedModelSrc] = useState<null | string>(firstModelSrc);
  const showImageInputs = activeMode === "image3d" || activeMode === "imageTools";
  const maxReferenceImageCount = activeMode === "imageTools" ? 1 : 4;
  const activeGenerationCreditCost = getActiveGenerationCreditCost({
    activeMode,
    costs: generationCreditCosts,
    imageCount: images.length,
  });
  const rightPanelModelCards = useMemo(() => {
    const localModelIds = new Set(localModelCards.map((card) => card.id));
    const pendingModelCards = pendingTasks.filter((task) => task.kind === "model").map(toPendingCard);

    return [
      ...pendingModelCards,
      ...localModelCards,
      ...libraryCards.filter((card) => !localModelIds.has(card.id)),
    ];
  }, [libraryCards, localModelCards, pendingTasks]);
  const rightPanelImageCards = useMemo(
    () => [
      ...pendingTasks.filter((task) => task.kind === "image").map(toPendingCard),
      ...imageAssetCards,
    ],
    [imageAssetCards, pendingTasks],
  );
  const rightPanelCards = useMemo(
    () => (activeMode === "imageTools" ? rightPanelImageCards : rightPanelModelCards),
    [activeMode, rightPanelImageCards, rightPanelModelCards],
  );
  const rightPanelTitle = activeMode === "imageTools" ? "Image Assets" : "Model Library";
  const selectedPendingTask = pendingTasks.find((task) => task.cardId === activePendingCardId) ?? null;
  const activePendingTask =
    selectedPendingTask &&
    ((activeMode === "imageTools" && selectedPendingTask.kind === "image") ||
      (activeMode !== "imageTools" && selectedPendingTask.kind === "model"))
      ? selectedPendingTask
      : null;
  const activeModelPendingTask = activePendingTask?.kind === "model" ? activePendingTask : null;
  const activeImagePendingTask = activePendingTask?.kind === "image" ? activePendingTask : null;
  const activeModelSrc = activeModelPendingTask ? null : selectedModelSrc ?? firstModelSrc;
  const activeModelCard = rightPanelModelCards.find((card) => card.modelSrc === activeModelSrc);
  const activeImagePreview = activeImagePendingTask
    ? {
        license: getPendingGenerationStatusLabel(activeImagePendingTask),
        name: activeImagePendingTask.title,
        previewAlt: `${activeImagePendingTask.title} image preview`,
        previewSrc: activeImagePendingTask.previewSrc ?? null,
      }
    : selectedImageCard;
  const canUseSelectedImageFor3D =
    activeMode === "imageTools" && !activeImagePendingTask && Boolean(selectedImageCard?.sourceAsset);
  const showImagePreview = activeMode === "imageTools" && Boolean(activeImagePreview || activeImagePendingTask);
  const activeDisplayName =
    activeImagePreview?.name ||
    activeModelPendingTask?.title ||
    activeModelCard?.name ||
    libraryCards[0]?.name ||
    "Workbench";
  const activeDisplayLicense =
    activeImagePreview?.license ||
    (activeModelPendingTask
      ? getPendingGenerationStatusLabel(activeModelPendingTask)
      : activeModelCard?.license || libraryCards[0]?.license || "Private");
  const activeStats =
    activeMode === "imageTools"
      ? [
          { label: "TYPE", value: "Image" },
          { label: "STATUS", value: activeImagePendingTask ? getPendingGenerationStatusLabel(activeImagePendingTask) : "Preview" },
          { label: "SOURCE", value: images.length > 0 ? "Reference" : "Prompt" },
        ]
      : [
          { label: "TOPOLOGY", value: "Triangle" },
          { label: "FACE COUNT", value: "16,101" },
          { label: "VERTEX COUNT", value: "25,981" },
        ];
  const hasSyncablePendingTasks = pendingTasks.some((task) => task.taskId && !isTerminalGenerationStatus(task.status));

  useEffect(() => {
    if (initialPendingTasks.length === 0) return;

    setPendingTasks((current) => {
      const incomingTasksByKey = new Map(
        initialPendingTasks.map((task) => [getPendingTaskIdentity(task), task]),
      );
      let changed = false;
      const merged = current.map((task) => {
        const key = getPendingTaskIdentity(task);
        const incoming = incomingTasksByKey.get(key);
        if (!incoming) return task;

        incomingTasksByKey.delete(key);

        const nextProgress = Math.max(task.progress, incoming.progress);
        const shouldUpdate =
          nextProgress !== task.progress ||
          incoming.failureReason !== task.failureReason ||
          incoming.status !== task.status ||
          incoming.taskCode !== task.taskCode;

        if (!shouldUpdate) return task;

        changed = true;
        return {
          ...task,
          ...incoming,
          progress: nextProgress,
        };
      });

      if (incomingTasksByKey.size > 0) {
        changed = true;
      }

      return changed ? [...incomingTasksByKey.values(), ...merged] : current;
    });
    setActivePendingCardId((current) => current ?? initialPendingTasks[0]?.cardId ?? null);
  }, [initialPendingTasks]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    if (activeMode !== "imageTools") return;

    setImages((current) => {
      if (current.length <= 1) return current;

      current.slice(1).forEach((image) => {
        if (image.file) URL.revokeObjectURL(image.previewUrl);
      });

      return current.slice(0, 1);
    });
  }, [activeMode]);

  useEffect(() => {
    pendingTasksRef.current = pendingTasks;
  }, [pendingTasks]);

  useEffect(() => {
    if (!pendingTasks.some((task) => !isTerminalGenerationStatus(task.status))) return;

    const timer = window.setInterval(() => {
      setPendingTasks((current) =>
        current.map((task) => {
          if (isTerminalGenerationStatus(task.status)) return task;

          const ceiling = getOptimisticProgressCeiling(task);
          if (task.progress >= ceiling) return task;

          return {
            ...task,
            progress: Math.min(ceiling, task.progress + 1),
          };
        }),
      );
    }, 1200);

    return () => window.clearInterval(timer);
  }, [pendingTasks]);

  useEffect(() => {
    if (!hasSyncablePendingTasks) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const syncTask = async (task: PendingGenerationTask) => {
      if (!task.taskId || isTerminalGenerationStatus(task.status) || syncingTaskIdsRef.current.has(task.taskId)) {
        return;
      }

      syncingTaskIdsRef.current.add(task.taskId);

      try {
        const syncEndpoint =
          task.kind === "image"
            ? `/api/studio/ai/images/${task.taskId}/sync`
            : `/api/studio/ai/tasks/${task.taskId}/sync`;
        const response = await fetch(syncEndpoint, {
          credentials: "include",
          method: "POST",
        });
        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(json.message || "Task sync failed.");
        }

        const syncedTask = json.task;
        const status = typeof syncedTask?.status === "string" ? syncedTask.status : task.status;
        const progress = getTaskProgress(syncedTask?.progress ?? task.progress);
        const taskCode = typeof syncedTask?.taskCode === "string" ? syncedTask.taskCode : task.taskCode;
        const modelId = getTaskModelId(syncedTask);

        if (task.kind === "image" && status === "succeeded") {
          const media = getImageTaskMedia(json);
          const mediaUrl =
            typeof media?.url === "string"
              ? media.url
              : typeof media?.thumbnailURL === "string"
                ? media.thumbnailURL
                : "";

          if (!mediaUrl) {
            setPendingTasks((current) =>
              current.map((item) =>
                item.cardId === task.cardId
                  ? {
                      ...item,
                      progress: Math.min(99, Math.max(progress, 96)),
                      status: "finalizing",
                      taskCode,
                    }
                  : item,
              ),
            );
            return;
          }

          const sourceAsset: WorkbenchSourceImageAsset = {
            contentType: typeof media?.mimeType === "string" ? media.mimeType : "image/png",
            fileName:
              typeof media?.filename === "string" ? media.filename : `image-${media?.id ?? Date.now()}.png`,
            mediaId: typeof media?.id === "number" ? media.id : Number(media?.id) || undefined,
            publicUrl: mediaUrl,
          };
          const completedCard: ModelLibraryPanelCard = {
            date: formatLocalCardDate(new Date()),
            id: sourceAsset.mediaId ?? Date.now(),
            kind: "image",
            license: "Private",
            name: sourceAsset.fileName,
            previewAlt: sourceAsset.fileName,
            previewSrc: sourceAsset.publicUrl,
            sourceAsset,
          };

          setImageAssetCards((current) => [
            completedCard,
            ...current.filter((card) => card.id !== completedCard.id),
          ]);
          setSelectedImageCard(completedCard);
          setPendingTasks((current) => current.filter((item) => item.cardId !== task.cardId));
          setActivePendingCardId((current) => (current === task.cardId ? null : current));
          setSelectedModelSrc(null);
          router.refresh();
          return;
        }

        if (status === "succeeded" && modelId) {
          const viewerURL = buildViewerURL(modelId);
          const previewSrc = getTaskThumbnailURL(syncedTask) || task.previewSrc || null;
          const completedCard: ModelLibraryPanelCard = {
            date: formatLocalCardDate(new Date()),
            id: modelId,
            kind: "model",
            license: task.license,
            modelSrc: viewerURL,
            name: task.title,
            previewAlt: `${task.title} preview`,
            previewSrc,
          };

          setLocalModelCards((current) => [completedCard, ...current.filter((card) => card.id !== modelId)]);
          setPendingTasks((current) => current.filter((item) => item.cardId !== task.cardId));
          setActivePendingCardId((current) => (current === task.cardId ? null : current));
          setSelectedModelSrc(viewerURL);
          router.refresh();
          return;
        }

        const nextStatus =
          status === "failed" || status === "timeout"
            ? status
            : status === "succeeded"
              ? "finalizing"
              : getTaskStatus(status);
        const nextProgress = status === "succeeded" && !modelId ? Math.min(99, Math.max(progress, 96)) : progress;
        const failureReason =
          syncedTask?.failureReason && typeof syncedTask.failureReason === "string" ? syncedTask.failureReason : null;

        setPendingTasks((current) =>
          current.map((item) =>
            item.cardId === task.cardId
              ? {
                  ...item,
                  failureReason,
                  progress: nextProgress,
                  status: nextStatus,
                  taskCode,
                }
              : item,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Task sync failed.";
        setError(message);
        setPendingTasks((current) =>
          current.map((item) => (item.cardId === task.cardId ? { ...item, failureReason: message } : item)),
        );
      } finally {
        syncingTaskIdsRef.current.delete(task.taskId);
      }
    };

    const syncOnce = async () => {
      if (cancelled) return;

      const syncableTasks = pendingTasksRef.current.filter(
        (task) => task.taskId && !isTerminalGenerationStatus(task.status),
      );

      await Promise.all(syncableTasks.map(syncTask));

      if (!cancelled && pendingTasksRef.current.some((task) => task.taskId && !isTerminalGenerationStatus(task.status))) {
        timer = setTimeout(() => {
          void syncOnce();
        }, syncIntervalMs);
      }
    };

    void syncOnce();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hasSyncablePendingTasks, router]);

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
      const availableSlots = Math.max(0, maxReferenceImageCount - current.length);
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

      return [...current, ...nextImages].slice(0, maxReferenceImageCount);
    });
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed?.file) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((image) => image.id !== id);
    });
  };

  const setGeneratedImageAsReference = (card: ModelLibraryPanelCard) => {
    const sourceAsset = card.sourceAsset;
    if (!sourceAsset) return false;

    setImages((current) => {
      current.forEach((image) => {
        if (image.file) URL.revokeObjectURL(image.previewUrl);
      });

      return [
        {
          id: `generated-${sourceAsset.mediaId ?? card.id}`,
          previewUrl: sourceAsset.publicUrl,
          sourceAsset,
        },
      ];
    });

    return true;
  };

  const handleUseSelectedImageFor3D = () => {
    if (!selectedImageCard || !setGeneratedImageAsReference(selectedImageCard)) return;

    setActiveMode("image3d");
    setMultiView(false);
    setSelectedImageCard(null);
    setSelectedModelSrc(null);
    setActivePendingCardId(null);
  };

  const handleGenerate = async () => {
    if (isSubmitting) return;

    if (!navUser) {
      openAuthModal("login");
      return;
    }

    const requiredCredits = activeGenerationCreditCost;

    if (getNavUserCreditBalance(navUser) < requiredCredits) {
      const message = buildInsufficientCreditsMessage(requiredCredits);
      setError(message);
      window.alert(message);
      return;
    }

    setError("");
    setIsSubmitting(true);
    const pendingKind: PendingGenerationTask["kind"] = activeMode === "imageTools" ? "image" : "model";
    const pendingCardId = createPendingCardId();
    const requestedTitle = modelTitle.trim() || "Unnamed";

    if (pendingCardId) {
      const pendingTask: PendingGenerationTask = {
        cardId: pendingCardId,
        createdAt: new Date().toISOString(),
        kind: pendingKind,
        license,
        previewSrc: showImageInputs ? images[0]?.previewUrl ?? null : null,
        progress: 1,
        status: "uploading",
        taskCode: null,
        taskId: null,
        title: requestedTitle,
      };

      setPendingTasks((current) => [pendingTask, ...current]);
      setActivePendingCardId(pendingCardId);
      setSelectedModelSrc(null);
      if (pendingKind === "image") {
        setSelectedImageCard(null);
      }
    }

    try {
      const imagesForGeneration = activeMode === "imageTools" ? images.slice(0, 1) : images;
      const sourceImageAssets = showImageInputs
        ? await Promise.all(
            imagesForGeneration.map((image) => {
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
          requestedTitle,
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
        throw new GenerationRequestError({
          message: json.message || "Generation request failed.",
          status: response.status,
        });
      }

      if (activeMode === "imageTools") {
        const task = json.task;
        const taskId = Number(task?.id);
        const taskCode = typeof task?.taskCode === "string" ? task.taskCode : "";

        if (!Number.isFinite(taskId) || taskId <= 0 || !taskCode) {
          throw new Error("Image generation task was submitted, but no task code was returned.");
        }

        setPendingTasks((current) =>
          current.map((item) =>
            item.cardId === pendingCardId
              ? {
                  ...item,
                  progress: getTaskProgress(task?.progress ?? 5),
                  status: getTaskStatus(task?.status),
                  taskCode,
                  taskId,
                }
              : item,
          ),
        );
        return;
      }

      const task = json.task;
      const taskId = Number(task?.id);
      const taskCode = typeof task?.taskCode === "string" ? task.taskCode : "";

      if (!Number.isFinite(taskId) || taskId <= 0 || !taskCode) {
        throw new Error("Generation task was submitted, but no task code was returned.");
      }

      if (pendingCardId) {
        setPendingTasks((current) =>
          current.map((item) =>
            item.cardId === pendingCardId
              ? {
                  ...item,
                  progress: getTaskProgress(task?.progress ?? 5),
                  status: getTaskStatus(task?.status),
                  taskCode,
                  taskId,
                }
              : item,
          ),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation request failed.";
      const status = err instanceof GenerationRequestError ? err.status : 0;
      const removePendingCard = isInsufficientCreditsFailure({ message, status });
      setError(message);
      if (pendingCardId) {
        if (removePendingCard) {
          setPendingTasks((current) => current.filter((item) => item.cardId !== pendingCardId));
          setActivePendingCardId((current) => (current === pendingCardId ? null : current));
        } else {
          setPendingTasks((current) =>
            current.map((item) =>
              item.cardId === pendingCardId
                ? {
                    ...item,
                    failureReason: message,
                    progress: 100,
                    status: "failed",
                  }
                : item,
            ),
          );
        }
      }
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
            generationCreditCost={activeGenerationCreditCost}
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
              <h1>{activeDisplayName}</h1>
              <em>{activeDisplayLicense}</em>
            </div>

            <div className={styles.statsBox}>
              {activeStats.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className={styles.viewerStage}>
              <div className={styles.viewerSquare}>
                <div className={styles.viewerSurface}>
                  {showImagePreview ? (
                    <div className={styles.imagePreviewCluster}>
                      <div className={styles.imagePreviewCard}>
                        {activeImagePreview?.previewSrc ? (
                          <img
                            alt={activeImagePreview.previewAlt || "Generated image preview"}
                            src={activeImagePreview.previewSrc}
                          />
                        ) : (
                          <div className={styles.imagePreviewPlaceholder}>
                            <span>IMAGE</span>
                          </div>
                        )}
                      </div>
                      {canUseSelectedImageFor3D ? (
                        <button className={styles.imageTo3DAction} onClick={handleUseSelectedImageFor3D} type="button">
                          Use for 3D
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <ModelViewer
                      className={styles.viewerCanvas}
                      displayBase="workbench"
                      showPlaceholderModel={false}
                      showGround={false}
                      src={activeModelSrc}
                      transparentBackground
                    />
                  )}
                  {activePendingTask ? (
                    <div className={styles.viewerLoadingOverlay} aria-live="polite">
                      <span>{getPendingGenerationStatusLabel(activePendingTask)}</span>
                      <strong>{activePendingTask.progress}%</strong>
                      <em>{getPendingGenerationDetail(activePendingTask)}</em>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </main>

          <div className={styles.rightPanel}>
            <ModelLibraryPanel
              cards={rightPanelCards}
              onSelectCard={(card) => {
                if (card.generationState) {
                  setActivePendingCardId(card.id);
                  setSelectedModelSrc(null);
                  if (card.kind === "image") {
                    setActiveMode("imageTools");
                    setSelectedImageCard(null);
                  }
                  return;
                }

                const sourceAsset = card.sourceAsset;
                if (card.kind === "image" && sourceAsset) {
                  setGeneratedImageAsReference(card);
                  setActiveMode("imageTools");
                  setMultiView(false);
                  setSelectedImageCard(card);
                  setSelectedModelSrc(null);
                  setActivePendingCardId(null);
                  return;
                }

                setActivePendingCardId(null);
                setSelectedImageCard(null);
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
