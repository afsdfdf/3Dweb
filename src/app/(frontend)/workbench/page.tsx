import type { ModelLibraryPanelCard } from "@/components/ui-lab/model-library-panel";

import { getCurrentNavUser, getCurrentUser } from "../_lib/session";
import { formatVisibilityBadge, formatWorkbenchDate, getWorkbenchModels } from "./_lib/workbenchData";
import { WorkbenchClient } from "./WorkbenchClient";

export default async function WorkbenchPage() {
  const [user, navUser] = await Promise.all([getCurrentUser(), getCurrentNavUser()]);
  const models = user ? (await getWorkbenchModels(user)).filter((model) => model.isOwnedByCurrentUser) : [];
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
