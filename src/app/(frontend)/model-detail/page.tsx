import type { Metadata } from 'next'
import ModelDetailNative from "./ModelDetailNative";
import { notFound } from "next/navigation";
import { getMarketingSiteSettings } from "../_lib/marketing";
import { getCurrentNavUser, getCurrentUser } from "../_lib/session";
import { getModelDetailData } from "./_lib/modelDetailData";

type ModelDetailPageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export async function generateMetadata({ searchParams }: ModelDetailPageProps): Promise<Metadata> {
  const { id } = await searchParams
  const data = await getModelDetailData({ currentUser: null, id })
  if (!data) return {}
  const title = `${data.title} — Thorns Tavern`
  const description = data.authorDescription || 'View this 3D model on Thorns Tavern.'
  const previewUrl = data.inputPreviewSrc ?? undefined
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(previewUrl ? { images: [{ url: previewUrl }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function ModelDetailPage({ searchParams }: ModelDetailPageProps) {
  const [{ id }, navUser, user, siteSettings] = await Promise.all([
    searchParams,
    getCurrentNavUser(),
    getCurrentUser(),
    getMarketingSiteSettings(),
  ]);
  const data = await getModelDetailData({
    currentUser: user,
    id,
  });

  if (!data) {
    notFound();
  }

  return <ModelDetailNative data={data} navUser={navUser} navigationPromotion={siteSettings.navigationPromotion} />;
}
