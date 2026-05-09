import { notFound, redirect } from "next/navigation";

type WorkbenchModelDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkbenchModelDetailPage({
  params,
}: WorkbenchModelDetailPageProps) {
  const { id } = await params;
  const modelId = Number(id);

  if (!Number.isFinite(modelId) || modelId <= 0) {
    notFound();
  }

  redirect(`/model-detail?id=${encodeURIComponent(String(modelId))}`);
}
