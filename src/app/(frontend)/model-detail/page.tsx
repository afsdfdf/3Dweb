import ModelDetailNative from "./ModelDetailNative";
import { getCurrentNavUser, getCurrentUser } from "../_lib/session";
import { getModelDetailData } from "./_lib/modelDetailData";

type ModelDetailPageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function ModelDetailPage({ searchParams }: ModelDetailPageProps) {
  const [{ id }, navUser, user] = await Promise.all([searchParams, getCurrentNavUser(), getCurrentUser()]);
  const data = await getModelDetailData({
    currentUserId: user?.id,
    id,
  });

  return <ModelDetailNative data={data} navUser={navUser} />;
}
