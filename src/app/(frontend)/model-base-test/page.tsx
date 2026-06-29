import type { Metadata } from "next";

import { ModelBaseTestClient } from "./ModelBaseTestClient";
import styles from "./page.module.css";

const DEFAULT_TEST_MODEL_ID = "3";

export const metadata: Metadata = {
  title: "Model Base Test",
  robots: { index: false, follow: false },
};

type ModelBaseTestPageProps = {
  searchParams?: Promise<{
    model?: string | string[];
    modelId?: string | string[];
    modelSrc?: string | string[];
  }>;
};

function firstQueryValue(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const trimmed = rawValue?.trim();
  return trimmed || null;
}

function buildModelViewerSrc(modelId: string | null) {
  if (!modelId) return null;

  return `/api/platform/models/${encodeURIComponent(modelId)}/viewer?format=glb`;
}

export default async function ModelBaseTestPage({
  searchParams,
}: ModelBaseTestPageProps) {
  const query = (await searchParams) ?? {};
  const explicitModelSrc =
    firstQueryValue(query.modelSrc) ?? firstQueryValue(query.model);
  const explicitModelId = firstQueryValue(query.modelId);
  const modelId = explicitModelSrc
    ? explicitModelId
    : explicitModelId ?? DEFAULT_TEST_MODEL_ID;
  const modelSrc = explicitModelSrc ?? buildModelViewerSrc(modelId);

  return (
    <main className={styles.page}>
      <ModelBaseTestClient
        basePlatformSrc="/model-base-test/base-platform.stl"
        initialModelId={modelId}
        initialModelSrc={modelSrc}
      />
    </main>
  );
}
