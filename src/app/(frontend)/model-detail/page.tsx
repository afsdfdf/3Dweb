import ModelDetailNative from "./ModelDetailNative";
import { notFound } from "next/navigation";
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
    currentUser: user,
    id,
  });

  if (!data) {
    notFound();
  }

  return <ModelDetailNative data={data} navUser={navUser} />;
}
