"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const DynamicModelViewer = dynamic(
  () => import("../../_components/ModelViewer").then((module) => module.ModelViewer),
  { ssr: false, loading: () => null },
);

type WorkbenchModelViewerProps = ComponentProps<typeof DynamicModelViewer>;

export function WorkbenchModelViewer(props: WorkbenchModelViewerProps) {
  return <DynamicModelViewer loadingOverlayVariant="workbench" {...props} />;
}
