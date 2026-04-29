import { notFound } from "next/navigation";

import { WorkbenchLeftPanelTestPage } from "./WorkbenchLeftPanelTestPage";

export default function Page() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <WorkbenchLeftPanelTestPage />;
}
