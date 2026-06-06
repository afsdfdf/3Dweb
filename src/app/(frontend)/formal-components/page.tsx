import { notFound } from "next/navigation";

import {
  FormalComponentsRegistry,
  getFormalComponentId,
} from "@/components/ui-lab/formal-components-registry";
import { getFollowCreatorCardData } from "@/components/ui-lab/follow-creator-card/follow-creator-card-data";

export default async function FormalComponentsPage({
  searchParams,
}: {
  searchParams: Promise<{ component?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const selectedId = getFormalComponentId(params.component);
  const followCreatorCardData = selectedId === "follow-creator-card" ? await getFollowCreatorCardData() : null;

  return <FormalComponentsRegistry followCreatorCardData={followCreatorCardData} selectedId={selectedId} />;
}
