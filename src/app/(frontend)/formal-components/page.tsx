import { notFound } from "next/navigation";

import {
  FormalComponentsRegistry,
  getFormalComponentId,
} from "@/components/ui-lab/formal-components-registry";

export default async function FormalComponentsPage({
  searchParams,
}: {
  searchParams: Promise<{ component?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  return <FormalComponentsRegistry selectedId={getFormalComponentId(params.component)} />;
}
