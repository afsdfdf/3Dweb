import type { ModelLibraryPanelCard } from "@/components/ui-lab/model-library-panel";
import { getCachedPayload } from "@/lib/getCachedPayload";
import { getTaskBillingSettingsForPayload } from "@/lib/taskBilling";

import { getMarketingSiteSettings } from "../_lib/marketing";
import { getCurrentNavUser, getCurrentUser } from "../_lib/session";
import {
  formatVisibilityBadge,
  formatWorkbenchDate,
  getWorkbenchGenerationTaskState,
  getWorkbenchModels,
} from "./_lib/workbenchData";
import { WorkbenchClient } from "./WorkbenchClient";

export default async function WorkbenchPage() {
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
  const models = allVisibleModels.filter((model) => model.isOwnedByCurrentUser);
  const libraryCards: ModelLibraryPanelCard[] = models.map((model) => ({
    date: formatWorkbenchDate(model.updatedAt).replace(" ", "\n"),
    id: model.id,
    license: formatVisibilityBadge(model.visibility),
    modelSrc: model.viewerURL,
    name: model.title,
    previewAlt: `${model.title} preview`,
    previewSrc: model.previewURL,
  }));
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
      initialPendingTasks={pendingGenerationTasks}
      libraryCards={libraryCards}
      navUser={navUser}
      navigationPromotion={siteSettings.navigationPromotion}
    />
  );
}
