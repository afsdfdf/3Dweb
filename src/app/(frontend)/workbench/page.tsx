import type { ModelLibraryPanelCard } from "@/components/ui-lab/model-library-panel";

import { getCurrentNavUser, requireUser } from "../_lib/session";
import {
  formatVisibilityBadge,
  formatWorkbenchDate,
  getWorkbenchModels,
} from "./_lib/workbenchData";
import { WorkbenchClient } from "./WorkbenchClient";

export default async function WorkbenchPage() {
  const user = await requireUser();
  const navUser = await getCurrentNavUser();
  const allVisibleModels = await getWorkbenchModels(user);
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

  return <WorkbenchClient libraryCards={libraryCards} navUser={navUser} />;
}
