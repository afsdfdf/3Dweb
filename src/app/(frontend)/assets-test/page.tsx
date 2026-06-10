export const metadata = { robots: { index: false, follow: false } }

import { AuthModalStage } from "@/components/auth/AuthModalStage";
import { TopNavigation } from "@/components/ui-lab/top-navigation";

import { FooterBar } from "../_components/shell/FooterBar";
import { getMarketingSiteData } from "../_lib/marketing";
import { getCurrentNavUser } from "../_lib/session";

import { AssetsTestClient } from "./AssetsTestClient";
import styles from "./assetsTestPage.module.css";

const assetsTestNavItems = [
  { href: "/", id: "HOME", label: "HOME" },
  { href: "/workbench", id: "WORKBENCH", label: "WORKBENCH" },
  { href: "/account", id: "ACCOUNT", label: "ACCOUNT" },
  { href: "/assets-test", id: "ASSETS", label: "ASSETS" },
] as const;

export default async function AssetsTestPage() {
  const [marketing, navUser] = await Promise.all([getMarketingSiteData(), getCurrentNavUser()]);
  const { siteSettings } = marketing;

  return (
    <main className={styles.page}>
      <AuthModalStage clipContent={false} fitViewport>
        <TopNavigation
          active="ASSETS"
          className={styles.boundTopNavigation}
          items={assetsTestNavItems}
          user={
            navUser
              ? {
                  avatarUrl: navUser.avatarUrl,
                  bio: navUser.bio,
                  credits: navUser.creditsBalance,
                  creditsBalance: navUser.creditsBalance,
                  displayName: navUser.displayName,
                  email: navUser.email,
                  followersCount: navUser.followersCount,
                  followingCount: navUser.followingCount,
                  id: navUser.id,
                  modelsCount: navUser.modelsCount,
                  name: navUser.displayName,
                  role: navUser.role,
                }
              : null
          }
        />

        <AssetsTestClient />

        <div className={styles.footerMount}>
          <FooterBar
            footerContent={siteSettings.footer}
            siteDescription={
              siteSettings.siteDescription ||
              "An AI 3D product platform for character creation, asset management, and print fulfillment."
            }
            supportEmail={siteSettings.supportEmail || "service@thornstavern.com"}
          />
        </div>
      </AuthModalStage>
    </main>
  );
}
