import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import type { TopNavigationUser } from "@/components/ui-lab/top-navigation";
import styles from "./page.module.css";

type ModelDetailHeaderProps = {
  navUser?: null | TopNavigationUser;
};

export function ModelDetailHeader({ navUser = null }: ModelDetailHeaderProps) {
  return (
    <TopNavigation
      active="SHOWCASE"
      className={styles.boundTopNavigation}
      fitViewport
      items={migrationTestNavItems}
      user={navUser}
    />
  );
}
