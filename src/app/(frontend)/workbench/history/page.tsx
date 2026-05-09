import Link from "next/link";

import { Button } from "@/components/ui/button";

import { SiteShell } from "../../_components/SiteShell";
import { requireUser } from "../../_lib/session";
import { getWorkbenchModels, formatWorkbenchDate } from "../_lib/workbenchData";
import { PanelFrame, WorkbenchLibrary } from "../_components/WorkbenchPanels";

export default async function WorkbenchHistoryPage() {
  const user = await requireUser();
  const models = await getWorkbenchModels(user);

  return (
    <SiteShell
      currentPath="/workbench"
      showFooter={false}
      showUtilityNav={false}
      user={user}
    >
      <section className="min-h-[calc(100vh-76px)] bg-[radial-gradient(circle_at_50%_18%,rgba(118,75,31,0.18),transparent_26%),linear-gradient(180deg,#09090b_0%,#141416_52%,#0c0c0e_100%)] px-5 py-4 text-[#e9e2d6] sm:px-6">
        <div className="mx-auto grid max-w-[1600px] gap-4 xl:grid-cols-[minmax(0,1fr)_312px]">
          <PanelFrame className="min-h-[720px]">
            <div className="flex items-center justify-between gap-4 border-b border-[#2f2d34] pb-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#726d78]">
                  Workbench History
                </div>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
                  History Versions
                </h1>
              </div>
              <Button
                asChild
                className="border-[#57492d] bg-[#141416] text-[#efe7da] hover:bg-[#1d1d21]"
                variant="outline"
              >
                <Link href="/workbench">Back to Workbench</Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-4">
              {models.length > 0 ? (
                models.map((model) => (
                  <div
                    className="rounded-[4px] border border-[#2f2d34] bg-[#0a0a0d] p-4"
                    key={model.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-[#f0eadc]">
                          {model.title}
                        </div>
                        <div className="mt-2 text-sm text-[#8e8893]">
                          Updated{" "}
                          {formatWorkbenchDate(
                            model.updatedAt || model.createdAt,
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          className="border-[#57492d] bg-[#141416] text-[#efe7da] hover:bg-[#1d1d21]"
                          size="sm"
                          variant="outline"
                        >
                          <Link href={`/workbench?model=${model.id}`}>
                            Open
                          </Link>
                        </Button>
                        <Button
                          asChild
                          className="border-[#57492d] bg-[#141416] text-[#efe7da] hover:bg-[#1d1d21]"
                          size="sm"
                          variant="outline"
                        >
                          <Link href={`/model-detail?id=${encodeURIComponent(String(model.id))}`}>
                            Detail
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#b7b0a4]">
                      {model.description ||
                        "This version is available for future comparison, reuse, and detail-page polishing."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[4px] border border-[#2f2d34] bg-[#0a0a0d] p-6 text-sm text-[#8e8893]">
                  No history entries yet. Generate or publish a model first.
                </div>
              )}
            </div>
          </PanelFrame>

          <WorkbenchLibrary
            basePath="/workbench/history"
            initialMode="image"
            models={models}
            query=""
            scope="all"
            selectedModel={null}
          />
        </div>
      </section>
    </SiteShell>
  );
}
