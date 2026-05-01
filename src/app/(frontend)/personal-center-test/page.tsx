import { notFound } from "next/navigation";

import { PersonalCenterTest } from "@/components/ui-lab/personal-center-test";

import { getCurrentNavUser } from "../_lib/session";

export default async function PersonalCenterTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const navUser = await getCurrentNavUser();

  return <PersonalCenterTest navUser={navUser} />;
}
