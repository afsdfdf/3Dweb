"use client";

import dynamic from "next/dynamic";

export const WorkbenchModelViewer = dynamic(
  () => import("../../_components/ModelViewer").then((module) => module.ModelViewer),
  { ssr: false, loading: () => null },
);
