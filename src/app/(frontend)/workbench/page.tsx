import type { ModelLibraryPanelCard } from "@/components/ui-lab/model-library-panel";

import { getCurrentNavUser, getCurrentUser } from "../_lib/session";
import {
  formatVisibilityBadge,
  formatWorkbenchDate,
  getWorkbenchImageAssets,
  getWorkbenchModels,
} from "./_lib/workbenchData";
import { WorkbenchClient } from "./WorkbenchClient";

export default async function WorkbenchPage() {
  const user = await getCurrentUser();
  const [navUser, allVisibleModels, imageAssets] = await Promise.all([
    user ? getCurrentNavUser() : Promise.resolve(null),
    getWorkbenchModels(user),
    getWorkbenchImageAssets(user),
  ]);
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
      imageAssetCards={imageAssetCards}
      libraryCards={libraryCards}
      navUser={navUser}
    />
  );
}
