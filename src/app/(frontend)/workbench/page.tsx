import type { ModelLibraryPanelCard } from "@/components/ui-lab/model-library-panel";
import { getCachedPayload } from "@/lib/getCachedPayload";
import { getTaskBillingSettingsForPayload } from "@/lib/taskBilling";

import { getMarketingSiteSettings } from "../_lib/marketing";
import { getCurrentNavUser, getCurrentUser } from "../_lib/session";
import {
  formatVisibilityBadge,
  formatWorkbenchDate,
  getWorkbenchGenerationTaskState,
  getWorkbenchModelById,
  getWorkbenchModels,
  type WorkbenchModel,
} from "./_lib/workbenchData";
import { WorkbenchClient } from "./WorkbenchClient";

type WorkbenchPageProps = {
  searchParams: Promise<{
    model?: string | string[];
    reference?: string | string[];
  }>;
};

function toSearchParams(
  source: Awaited<WorkbenchPageProps["searchParams"]>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(source)) {
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (typeof firstValue === "string") {
      searchParams.set(key, firstValue);
    }
  }

  return searchParams;
}

function parseRequestedModelId(value: null | string) {
  if (!value) return null;

  const modelId = Number(value);
  return Number.isFinite(modelId) && modelId > 0 ? modelId : null;
}

function toModelLibraryCard(model: WorkbenchModel): ModelLibraryPanelCard {
  return {
    date: formatWorkbenchDate(model.updatedAt).replace(" ", "\n"),
    id: model.id,
    license: formatVisibilityBadge(model.visibility),
    modelSrc: model.viewerURL,
    name: model.title,
    previewAlt: `${model.title} preview`,
    previewSrc: model.previewURL,
  };
}

export default async function WorkbenchPage({
  searchParams: searchParamsPromise,
}: WorkbenchPageProps) {
  const rawSearchParams = await searchParamsPromise;
  const searchParams = toSearchParams(rawSearchParams);
  const requestedModelId = parseRequestedModelId(
    searchParams.get("reference") ?? searchParams.get("model"),
  );
  const user = await getCurrentUser();
  const payload = await getCachedPayload();
  const [navUser, allVisibleModels, generationTaskState, siteSettings] = await Promise.all([
    user ? getCurrentNavUser() : Promise.resolve(null),
    getWorkbenchModels(user),
    getWorkbenchGenerationTaskState(user),
    getMarketingSiteSettings(),
  ]);
  const { imageAssets, pendingGenerationTasks } = generationTaskState;
  const { generationPricing, meshyPricing } =
    await getTaskBillingSettingsForPayload(payload);
  const generationCreditCosts = {
    image: generationPricing.imageCredits,
    imageTo3D: Math.max(
      generationPricing.hybridCredits,
      meshyPricing.imageTo3DCredits,
    ),
    multiImageTo3D: Math.max(
      generationPricing.hybridCredits,
      meshyPricing.multiImageTo3DCredits,
    ),
    text: generationPricing.textCredits,
    textTo3D: Math.max(
      generationPricing.textCredits,
      meshyPricing.textTo3DCredits,
    ),
  };
  const ownedModels = allVisibleModels.filter((model) => model.isOwnedByCurrentUser);
  const requestedModel =
    requestedModelId === null
      ? null
      : allVisibleModels.find((model) => model.id === requestedModelId) ??
        await getWorkbenchModelById(user, requestedModelId);
  const models = requestedModel
    ? [
        requestedModel,
        ...ownedModels.filter((model) => model.id !== requestedModel.id),
      ]
    : ownedModels;
  const requestedModelCard = requestedModel ? toModelLibraryCard(requestedModel) : null;
  const libraryCards: ModelLibraryPanelCard[] = models.map(toModelLibraryCard);
  const imageAssetCards: ModelLibraryPanelCard[] = imageAssets.map((asset) => ({
    date: formatWorkbenchDate(asset.createdAt).replace(" ", "\n"),
    id: asset.id,
    kind: "image",
    license: "Private",
    name: asset.fileName,
    previewAlt: asset.fileName,
    previewSrc: asset.previewURL,
    sourceAsset: {
      contentType: asset.mimeType,
      fileName: asset.fileName,
      mediaId: asset.id,
      publicUrl: asset.previewURL,
    },
  }));

  return (
    <WorkbenchClient
      generationCreditCosts={generationCreditCosts}
      imageAssetCards={imageAssetCards}
      initialSelectedModelId={requestedModelCard?.id ?? null}
      initialPendingTasks={pendingGenerationTasks}
      libraryCards={libraryCards}
      navUser={navUser}
      navigationPromotion={siteSettings.navigationPromotion}
    />
  );
}
