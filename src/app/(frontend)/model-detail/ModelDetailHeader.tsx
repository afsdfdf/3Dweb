import { TopNavigation, migrationTestNavItems } from "@/components/ui-lab/top-navigation";
import type { TopNavigationUser } from "@/components/ui-lab/top-navigation";
import type { NavigationPromotionContent } from "@/app/(frontend)/_lib/marketing-content";
import styles from "./page.module.css";

type ModelDetailHeaderProps = {
  navUser?: null | TopNavigationUser;
  navigationPromotion?: NavigationPromotionContent | null;
};

export function ModelDetailHeader({ navUser = null, navigationPromotion }: ModelDetailHeaderProps) {
  return (
    <TopNavigation
      active="SHOWCASE"
      className={styles.boundTopNavigation}
      fitViewport
      items={migrationTestNavItems}
      subscriptionPromotion={navigationPromotion}
      user={navUser}
    />
  );
}
