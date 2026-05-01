import { PersonalCenterTest } from "@/components/ui-lab/personal-center-test";

import { getCurrentNavUser } from "../_lib/session";

export default async function PersonalCenterTestPage() {
  const navUser = await getCurrentNavUser();

  return <PersonalCenterTest navUser={navUser} />;
}
