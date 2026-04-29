import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import type { TopNavigationUser } from "@/components/ui-lab/top-navigation";
import styles from "./page.module.css";

type ModelDetailHeaderProps = {
  navUser?: null | TopNavigationUser;
};

export function ModelDetailHeader({ navUser = null }: ModelDetailHeaderProps) {
  return (
    <TopNavigation
      active="DETAIL"
      className={styles.boundTopNavigation}
      items={migrationTestNavItems}
      user={navUser}
    />
  );
}
