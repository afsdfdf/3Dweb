/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import Link from "next/link";

import {
  GenerateCtaButton,
  MediumActionButton,
  OrangeMediumActionButton,
  PurpleMediumActionButton,
  SourcePurpleMediumButton,
} from "@/components/ui-lab/action-buttons";
import { BorderComboFrame1 } from "@/components/ui-lab/border-combo-frame-1";
import { BorderComboFrame2, BorderComboFrame2Variant } from "@/components/ui-lab/border-combo-frame-2";
import { ButtonBoxFrame } from "@/components/ui-lab/button-box-frame";
import { ButtonBoxFrame11 } from "@/components/ui-lab/button-box-frame-11";
import { FollowCreatorCard } from "@/components/ui-lab/follow-creator-card";
import { AuthPairCollection, LoginCollection, RegisterCollection } from "@/components/ui-lab/formal-auth-collections";
import { HeroProductRibbon } from "@/components/ui-lab/hero-product-ribbon";
import { ModelAuthorAvatar, ModelAuthorCard } from "@/components/ui-lab/model-author-card";
import { ModelDetailAdBanner } from "@/components/ui-lab/model-detail-ad-banner";
import { ModelDownloadConfirmation } from "@/components/ui-lab/model-download-confirmation";
import { ModelLibraryCard } from "@/components/ui-lab/model-library-card";
import { ModelLibraryPanel } from "@/components/ui-lab/model-library-panel";
import { ModuleCommonFrame } from "@/components/ui-lab/module-common-frame";
import { ProfileMenuReferencePreview } from "@/components/ui-lab/profile-menu-reference-preview";
import { SmallButtonPair, SmallButtonTriple } from "@/components/ui-lab/small-button-pair/small-button-pair";
import { SubscriptionPanel } from "@/components/ui-lab/subscription-panel";
import { TopNavigation } from "@/components/ui-lab/top-navigation";
import { TopNavigationUserMenu } from "@/components/ui-lab/top-navigation/user-menu";

import styles from "./formal-components-registry.module.css";
import type { FollowCreatorCardData } from "./follow-creator-card/follow-creator-card";

const uiAssetBase = "/ui-lab/formal-components/assets";

const purpleMediumImages = {
  normal: `${uiAssetBase}/buttons/button-purple-medium-normal.png`,
  hover: `${uiAssetBase}/buttons/button-purple-medium-hover.png`,
  pressed: `${uiAssetBase}/buttons/button-purple-medium-pressed.png`,
};

const orangeMediumImages = {
  normal: `${uiAssetBase}/buttons/button-orange-medium-normal.png`,
  hover: `${uiAssetBase}/buttons/button-orange-medium-hover.png`,
  pressed: `${uiAssetBase}/buttons/button-orange-medium-pressed.png`,
};

const sideArrowImages = {
  left: {
    normal: `${uiAssetBase}/arrows/side-arrow-left-dark-normal.png`,
    hover: `${uiAssetBase}/arrows/side-arrow-left-dark-hover.png`,
    disabled: `${uiAssetBase}/arrows/side-arrow-left-dark-disabled.png`,
  },
  right: {
    normal: `${uiAssetBase}/arrows/side-arrow-right-dark-normal.png`,
    hover: `${uiAssetBase}/arrows/side-arrow-right-dark-hover.png`,
    disabled: `${uiAssetBase}/arrows/side-arrow-right-dark-disabled.png`,
  },
};

const angleArrowImages = {
  left: {
    normal: `${uiAssetBase}/arrows/angle-left-large-normal.png`,
    hover: `${uiAssetBase}/arrows/angle-left-large-hover.png`,
    pressed: `${uiAssetBase}/arrows/angle-left-large-pressed.png`,
  },
  right: {
    normal: `${uiAssetBase}/arrows/angle-right-large-normal.png`,
    hover: `${uiAssetBase}/arrows/angle-right-large-hover.png`,
    pressed: `${uiAssetBase}/arrows/angle-right-large-pressed.png`,
  },
};

export type ComponentId =
  | "button-rule"
  | "signup-button"
  | "signin-button"
  | "generate-cta-button"
  | "top-navigation"
  | "top-navigation-user-menu"
  | "profile-menu-reference"
  | "subscription-panel"
  | "border-frame"
  | "button-box-frame-11"
  | "module-common-frame"
  | "border-combo-frame-1"
  | "border-combo-frame-2"
  | "side-arrow-actions"
  | "angle-arrow-actions"
  | "small-button-pair"
  | "model-detail-ad-banner"
  | "model-author-card"
  | "follow-creator-card"
  | "model-library-card"
  | "model-card-frame-border-test"
  | "model-library-panel"
  | "model-download-confirmation"
  | "inspiration-card-reference"
  | "hero-product-ribbon"
  | "register-group"
  | "login-group"
  | "auth-pair";

type FormalComponent = {
  id: ComponentId;
  name: string;
  kind: string;
  title: string;
  description: string;
  usage: string;
  assets: string[];
};

const components: FormalComponent[] = [
  {
    id: "button-rule",
    name: "Button Rule",
    kind: "button",
    title: "Button State Rule",
    description: "Reusable normal, hover, and pressed image-state button behavior.",
    usage: '<MediumActionButton label="Sign In" imageSet={{ normal, hover, pressed }} />',
    assets: [`${uiAssetBase}/buttons`],
  },
  {
    id: "signup-button",
    name: "Signup Button",
    kind: "button",
    title: "Signup Action Button",
    description: "Orange medium action button with hover and pressed states.",
    usage: '<OrangeMediumActionButton label="Sign Up" type="submit" />',
    assets: [
      `${uiAssetBase}/buttons/button-orange-medium-normal.png`,
      `${uiAssetBase}/buttons/button-orange-medium-hover.png`,
      `${uiAssetBase}/buttons/button-orange-medium-pressed.png`,
    ],
  },
  {
    id: "signin-button",
    name: "Signin Button",
    kind: "button",
    title: "Signin Action Button",
    description: "Purple medium action button with hover and pressed states.",
    usage: '<PurpleMediumActionButton label="Sign In" type="submit" />',
    assets: [
      `${uiAssetBase}/buttons/button-purple-medium-normal.png`,
      `${uiAssetBase}/buttons/button-purple-medium-hover.png`,
      `${uiAssetBase}/buttons/button-purple-medium-pressed.png`,
    ],
  },
  {
    id: "generate-cta-button",
    name: "Generate CTA",
    kind: "button",
    title: "Generate CTA Treatment",
    description: "Formal CTA preview rebuilt on top of the migrated medium action button primitive.",
    usage: '<OrangeMediumActionButton label="Generate" />',
    assets: [`${uiAssetBase}/buttons`],
  },
  {
    id: "top-navigation",
    name: "Top Navigation",
    kind: "navigation",
    title: "Top Navigation Preview",
    description: "Safe navigation preview for the lab page. It avoids the lab-only encoded asset API.",
    usage: "<FormalTopNavPreview />",
    assets: ["No lab API dependency"],
  },
  {
    id: "top-navigation-user-menu",
    name: "Top Nav User Menu",
    kind: "navigation",
    title: "Top Navigation User Menu",
    description: "Compact signed-in user menu bound to the shared top navigation and real logout endpoint.",
    usage: "<TopNavigationUserMenu defaultOpen user={user} userLabel=\"Lucky\" />",
    assets: ["src/components/ui-lab/border-combo-frame-1/assets"],
  },
  {
    id: "profile-menu-reference",
    name: "Profile Menu Reference",
    kind: "navigation",
    title: "Profile Menu Frame Reference",
    description: "Large account dropdown reference composed from ButtonBoxFrame and top-navigation avatar and coin assets.",
    usage: "<ProfileMenuReferencePreview />",
    assets: [
      "/ui-lab/component-assets/button-box-frame",
      "/ui/workbench/model-detail/sketch-assets/creator-avatar.jpg",
      "/ui-lab/top-navigation/icon-coin-badge.png",
      "/ui-lab/top-navigation/profile-menu-avatar-frame@2x.png",
      "/ui-lab/top-navigation/profile-menu-nameplate@2x.png",
    ],
  },
  {
    id: "subscription-panel",
    name: "Subscription Panel",
    kind: "billing",
    title: "Subscription Modal Panel",
    description: "Lanhu-aligned subscription modal composed from the shared sliced frame, title ribbon, coin, check, and CTA assets.",
    usage: "<SubscriptionPanel onSubscribe={(plan) => ...} />",
    assets: [
      "/ui-lab/component-assets/button-box-frame",
      "/ui-lab/subscription-panel",
      "/ui-lab/formal-components/assets/buttons/button-orange-medium-normal.png",
    ],
  },
  {
    id: "border-frame",
    name: "ButtonBoxFrame",
    kind: "frame",
    title: "ButtonBoxFrame",
    description: "Reusable single-image border frame with fixed-width corners and stretched edges.",
    usage: '<ButtonBoxFrame style={{ width: 380, height: 588 }} />',
    assets: ["/ui-lab/component-assets/button-box-frame"],
  },
  {
    id: "button-box-frame-11",
    name: "ButtonBoxFrame11",
    kind: "frame",
    title: "ButtonBoxFrame11",
    description: "Alternate sliced frame variant with component-local image assets.",
    usage: '<ButtonBoxFrame11 style={{ width: 380, height: 588 }} />',
    assets: ["src/components/ui-lab/button-box-frame-11/assets"],
  },
  {
    id: "module-common-frame",
    name: "ModuleCommonFrame",
    kind: "frame",
    title: "Module Common Frame",
    description: "Reusable tall panel frame for workbench side modules.",
    usage: "<ModuleCommonFrame />",
    assets: ["/ui-lab/component-assets/button-box-frame"],
  },
  {
    id: "border-combo-frame-1",
    name: "BorderComboFrame1",
    kind: "frame",
    title: "Border Combo Frame 1",
    description: "Component-local 3x3 sliced frame variant.",
    usage: '<BorderComboFrame1 style={{ width: 380, height: 588 }} />',
    assets: ["src/components/ui-lab/border-combo-frame-1/assets"],
  },
  {
    id: "border-combo-frame-2",
    name: "BorderComboFrame2",
    kind: "frame",
    title: "Border Combo Frame 2",
    description: "Fifteen-piece frame and compact variant used for heavier fantasy UI modules.",
    usage: '<BorderComboFrame2 /> / <BorderComboFrame2Variant />',
    assets: ["src/components/ui-lab/border-combo-frame-2/assets"],
  },
  {
    id: "side-arrow-actions",
    name: "Side Arrows",
    kind: "arrow",
    title: "Side Arrow Actions",
    description: "Normal, hover, and disabled arrow image states.",
    usage: "<ArrowActionPreview images={sideArrowImages} />",
    assets: [`${uiAssetBase}/arrows`],
  },
  {
    id: "angle-arrow-actions",
    name: "Angle Arrows",
    kind: "arrow",
    title: "Angle Arrow Actions",
    description: "Normal, hover, and pressed arrow image states.",
    usage: "<ArrowActionPreview images={angleArrowImages} />",
    assets: [`${uiAssetBase}/arrows`],
  },
  {
    id: "small-button-pair",
    name: "Small Button Pair",
    kind: "group",
    title: "Small Button Pair And Triple",
    description: "Compact image-state segmented controls for filter and mode selection.",
    usage: "<SmallButtonPair /> / <SmallButtonTriple />",
    assets: [`${uiAssetBase}/small-button-pair`],
  },
  {
    id: "model-detail-ad-banner",
    name: "Model Detail Banner",
    kind: "banner",
    title: "Model Detail Ad Banner",
    description: "Reusable model detail side banner component.",
    usage: '<ModelDetailAdBanner href="#" />',
    assets: ["/ui-lab/model-detail-uicut/images/detail-side-banner.png"],
  },
  {
    id: "model-author-card",
    name: "Model Author Card",
    kind: "profile",
    title: "Model Author Card",
    description: "Author avatar and profile block extracted from model detail UI.",
    usage: "<ModelAuthorCard /> / <ModelAuthorAvatar />",
    assets: ["/ui-lab/model-detail-uicut/images/face.png"],
  },
  {
    id: "follow-creator-card",
    name: "Follow Creator Card",
    kind: "card",
    title: "Follow Creator Card",
    description: "Lanhu-sized followed creator card using the shared sliced frame, stat icons, arrow controls, and framed button assets.",
    usage: "<FollowCreatorCard />",
    assets: [
      "src/components/ui-lab/border-combo-frame-1/assets",
      "/ui/workbench/model-detail/sketch-assets/creator-avatar.jpg",
      "/ui-lab/top-navigation/profile-menu-icon-users@2x.png",
      "/ui-lab/top-navigation/profile-menu-icon-models@2x.png",
      "/ui-lab/formal-components/assets/arrows",
      "/ui/buttons/framed/slate-normal.png",
    ],
  },
  {
    id: "model-library-card",
    name: "Model Library Card",
    kind: "card",
    title: "Model Library Card",
    description: "Workbench model library card with frame overlay, metadata, and preview image.",
    usage: '<ModelLibraryCard selected license="Public" />',
    assets: ["/ui-lab/workbench-assets/monk-large.png"],
  },
  {
    id: "model-card-frame-border-test",
    name: "Model Card Frame Test",
    kind: "card",
    title: "Model Card Frame Border Image Test",
    description: "Isolated model-card frame preview using the shared single-image border frame.",
    usage: '<ButtonBoxFrame className={styles.modelCardFrameOverlay} />',
    assets: ["/ui-lab/component-assets/button-box-frame"],
  },
  {
    id: "model-library-panel",
    name: "Model Library Panel",
    kind: "panel",
    title: "Model Library Panel",
    description: "Full model library side panel with search, pagination, frame, and cards.",
    usage: "<ModelLibraryPanel />",
    assets: ["/ui-lab/workbench-assets/monk-large.png"],
  },
  {
    id: "model-download-confirmation",
    name: "Download Confirmation",
    kind: "dialog",
    title: "Model Download Confirmation",
    description: "Download confirmation dialog composed from frame and action button primitives.",
    usage: "<ModelDownloadConfirmation />",
    assets: ["src/components/ui-lab/border-combo-frame-1/assets", `${uiAssetBase}/buttons`],
  },
  {
    id: "inspiration-card-reference",
    name: "Inspiration Card Reference",
    kind: "card",
    title: "Inspiration Card Reference",
    description: "Reference card dimensions and header treatment extracted from the homepage lab.",
    usage: '<ButtonBoxFrame style={{ width: 278, height: 444 }} />',
    assets: [`${uiAssetBase}/inspiration-card`],
  },
  {
    id: "hero-product-ribbon",
    name: "Hero Product Ribbon",
    kind: "badge",
    title: "Hero Product Ribbon",
    description: "Three-slice ribbon label for hero or product imagery.",
    usage: '<HeroProductRibbon label="New Product" />',
    assets: ["src/components/ui-lab/hero-product-ribbon/assets"],
  },
  {
    id: "register-group",
    name: "Register Group",
    kind: "group",
    title: "Register Collection",
    description: "Standalone visual register panel composed from fields, code action, terms, and action button.",
    usage: "<RegisterCollection />",
    assets: ["/ui-lab/pixso-auth-assets/images", `${uiAssetBase}/buttons`],
  },
  {
    id: "login-group",
    name: "Login Group",
    kind: "group",
    title: "Login Collection",
    description: "Standalone visual login panel composed from fields, terms, sign-in, sign-up, and forgot password actions.",
    usage: "<LoginCollection />",
    assets: ["/ui-lab/pixso-auth-assets/images", `${uiAssetBase}/buttons`],
  },
  {
    id: "auth-pair",
    name: "Auth Flow",
    kind: "group",
    title: "Login And Register Flow",
    description: "Single framed auth component that switches between login and register states.",
    usage: "<AuthPairCollection />",
    assets: ["/ui-lab/pixso-auth-assets/images", `${uiAssetBase}/buttons`],
  },
];

export function getFormalComponentId(value?: string | string[]): ComponentId {
  const id = Array.isArray(value) ? value[0] : value;
  return components.some((component) => component.id === id) ? (id as ComponentId) : "button-rule";
}

type ArrowImages = {
  disabled?: string;
  hover: string;
  normal: string;
  pressed?: string;
};

function ArrowActionButton({ alt, images }: { alt: string; images: ArrowImages }) {
  const arrowStyle = {
    "--arrow-normal": `url("${images.normal}")`,
    "--arrow-hover": `url("${images.hover}")`,
    "--arrow-pressed": `url("${images.pressed ?? images.hover}")`,
  } as CSSProperties;

  return (
    <button className={styles.arrowActionButton} style={arrowStyle} type="button">
      <img alt={alt} className={styles.arrowActionFallback} src={images.normal} />
    </button>
  );
}

function ArrowStateStrip({ direction, images }: { direction: string; images: ArrowImages }) {
  const states = [
    { label: "normal", src: images.normal },
    { label: "hover", src: images.hover },
    { label: images.pressed ? "pressed" : "disabled", src: images.pressed ?? images.disabled },
  ].filter((state): state is { label: string; src: string } => Boolean(state.src));

  return (
    <div className={styles.arrowStateStrip}>
      {states.map((state) => (
        <figure className={styles.arrowStateCard} key={`${direction}-${state.label}`}>
          <div className={styles.arrowStateImageWrap}>
            <img alt={`${direction} ${state.label}`} className={styles.arrowStateImage} src={state.src} />
          </div>
          <figcaption>{state.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function ArrowActionPreview({ images, title }: { images: Record<"left" | "right", ArrowImages>; title: string }) {
  return (
    <div className={styles.arrowActionDemo}>
      <h3 className={styles.arrowActionTitle}>{title}</h3>
      <div className={styles.arrowLiveRow}>
        <ArrowActionButton alt={`${title} left`} images={images.left} />
        <ArrowActionButton alt={`${title} right`} images={images.right} />
      </div>
      <div className={styles.arrowStateRows}>
        <ArrowStateStrip direction="left" images={images.left} />
        <ArrowStateStrip direction="right" images={images.right} />
      </div>
    </div>
  );
}

function GenerateCtaPreview() {
  return (
    <div className={styles.buttonCell}>
      <div className={styles.generateButtonSlot}>
        <GenerateCtaButton label="GENERATE" type="button" />
      </div>
    </div>
  );
}

function ComponentPreview({
  followCreatorCardData,
  id,
}: {
  followCreatorCardData?: FollowCreatorCardData | null;
  id: ComponentId;
}) {
  if (id === "button-rule") {
    return (
      <div className={styles.buttonRuleDemo}>
        <div className={styles.buttonCell}>
          <div className={styles.buttonSlot}>
            <MediumActionButton label="Sign In" imageSet={purpleMediumImages} type="button" />
          </div>
        </div>
        <div className={styles.buttonCell}>
          <div className={styles.buttonSlot}>
            <MediumActionButton label="Sign Up" imageSet={orangeMediumImages} type="button" />
          </div>
        </div>
        <div className={styles.buttonCell}>
          <div className={styles.buttonSlot}>
            <SourcePurpleMediumButton label="Button" type="button" />
          </div>
        </div>
      </div>
    );
  }

  if (id === "signup-button") {
    return (
      <div className={styles.buttonCell}>
        <div className={styles.buttonSlot}>
          <OrangeMediumActionButton label="Sign Up" type="button" />
        </div>
      </div>
    );
  }

  if (id === "signin-button") {
    return (
      <div className={styles.buttonCell}>
        <div className={styles.buttonSlot}>
          <PurpleMediumActionButton label="Sign In" type="button" />
        </div>
      </div>
    );
  }

  if (id === "generate-cta-button") return <GenerateCtaPreview />;
  if (id === "top-navigation") return <TopNavigation active="WORKBENCH" />;
  if (id === "top-navigation-user-menu") {
    return (
      <div style={{ minHeight: 260, position: "relative", width: 260 }}>
        <TopNavigationUserMenu
          defaultOpen
          user={{
            creditsBalance: 9999,
            displayName: "Lucky Player",
            email: "admin@thornstavern.com",
          }}
          userLabel="Lucky Player"
        />
      </div>
    );
  }
  if (id === "profile-menu-reference") return <ProfileMenuReferencePreview />;
  if (id === "subscription-panel") {
    return (
      <div className={styles.subscriptionPanelDemo}>
        <SubscriptionPanel />
      </div>
    );
  }

  if (id === "border-frame") {
    return (
      <div className={styles.singleBorderDemo}>
        <ButtonBoxFrame style={{ width: 380, height: 588 }}>
          <div className={styles.borderContent}>ButtonBoxFrame</div>
        </ButtonBoxFrame>
      </div>
    );
  }

  if (id === "button-box-frame-11") {
    return (
      <div className={styles.singleBorderDemo}>
        <ButtonBoxFrame11 style={{ width: 380, height: 588 }}>
          <div className={styles.borderContent}>ButtonBoxFrame11</div>
        </ButtonBoxFrame11>
      </div>
    );
  }

  if (id === "module-common-frame") {
    return (
      <div className={styles.singleBorderDemo}>
        <ModuleCommonFrame>
          <div className={styles.borderContent}>ModuleCommonFrame 460 x 972</div>
        </ModuleCommonFrame>
      </div>
    );
  }

  if (id === "border-combo-frame-1") {
    return (
      <div className={styles.singleBorderDemo}>
        <BorderComboFrame1 style={{ width: 380, height: 588 }}>
          <div className={styles.borderContent}>BorderComboFrame1</div>
        </BorderComboFrame1>
      </div>
    );
  }

  if (id === "border-combo-frame-2") {
    return (
      <div className={styles.borderPairDemo}>
        <BorderComboFrame2 style={{ width: 380, height: 588 }}>
          <div className={styles.borderContent}>BorderComboFrame2</div>
        </BorderComboFrame2>
        <BorderComboFrame2Variant style={{ width: 380, height: 588 }}>
          <div className={styles.borderContent}>BorderComboFrame2Variant</div>
        </BorderComboFrame2Variant>
      </div>
    );
  }

  if (id === "side-arrow-actions") return <ArrowActionPreview images={sideArrowImages} title="Side Arrow" />;
  if (id === "angle-arrow-actions") return <ArrowActionPreview images={angleArrowImages} title="Angle Arrow" />;

  if (id === "small-button-pair") {
    return (
      <div className={styles.smallButtonDemo}>
        <SmallButtonPair />
        <SmallButtonTriple />
      </div>
    );
  }

  if (id === "model-detail-ad-banner") {
    return (
      <div style={{ width: 420 }}>
        <ModelDetailAdBanner />
      </div>
    );
  }

  if (id === "model-author-card") {
    return (
      <div style={{ display: "grid", gap: 24, justifyItems: "start" }}>
        <ModelAuthorCard />
        <ModelAuthorAvatar />
      </div>
    );
  }

  if (id === "follow-creator-card") return <FollowCreatorCard {...(followCreatorCardData ?? {})} />;

  if (id === "model-library-card") {
    return (
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "200px 200px" }}>
        <ModelLibraryCard selected style={{ width: 200, height: 309 }} />
        <ModelLibraryCard license="Private" menuOpen style={{ width: 200, height: 309 }} />
      </div>
    );
  }

  if (id === "model-card-frame-border-test") {
    return (
      <div className={styles.modelCardFrameTest}>
        <figure className={styles.modelCardFrameFigure}>
          <figcaption>Current</figcaption>
          <ModelLibraryCard selected style={{ width: 200, height: 309 }} />
        </figure>
        <figure className={styles.modelCardFrameFigure}>
          <figcaption>Same Frame 200 x 309</figcaption>
          <article className={styles.modelCardFrameMock}>
            <ButtonBoxFrame className={styles.modelCardFrameOverlay} contentClassName={styles.modelCardFrameOverlayContent} />
            <header className={styles.modelCardFrameMockHeader}>
              <strong>Monk</strong>
              <em>Public</em>
              <span>...</span>
            </header>
            <p className={styles.modelCardFrameMockDate}>
              <span>2025.06.27</span>
              <span>20:35:20</span>
            </p>
            <div className={styles.modelCardFrameMockPreview}>
              <img alt="Monk library preview" src="/ui-lab/workbench-assets/monk-large.webp" />
            </div>
          </article>
        </figure>
        <figure className={styles.modelCardFrameFigure}>
          <figcaption>Same Frame 278 x 444</figcaption>
          <article className={[styles.modelCardFrameMock, styles.modelCardFrameMockLarge].join(" ")}>
            <ButtonBoxFrame className={styles.modelCardFrameOverlay} contentClassName={styles.modelCardFrameOverlayContent} />
            <header className={styles.modelCardFrameMockHeader}>
              <strong>Greenwood</strong>
              <em>Public</em>
              <span>...</span>
            </header>
            <p className={styles.modelCardFrameMockDate}>
              <span>2025.06.27</span>
              <span>20:35:20</span>
            </p>
            <div className={styles.modelCardFrameMockPreview}>
              <img alt="Monk library preview" src="/ui-lab/workbench-assets/monk-large.webp" />
            </div>
          </article>
        </figure>
      </div>
    );
  }

  if (id === "model-library-panel") return <ModelLibraryPanel />;
  if (id === "model-download-confirmation") return <ModelDownloadConfirmation />;

  if (id === "inspiration-card-reference") {
    return (
      <div className={styles.inspirationCardReferenceDemo}>
        <ButtonBoxFrame
          className={styles.inspirationCardReferenceFrame}
          contentClassName={styles.inspirationCardReferenceFrameContent}
          style={{ width: 278, height: 444 }}
        >
          <article className={styles.inspirationCardReferenceContent}>
            <header className={styles.inspirationCardHeader}>
              <div className={styles.inspirationAvatarWrap}>
                <img
                  alt="Greenwood avatar"
                  className={styles.inspirationAvatar}
                  src={`${uiAssetBase}/inspiration-card/avatar-greenwood.png`}
                />
                <span className={styles.inspirationAvatarBadge} aria-hidden="true" />
              </div>
              <div className={styles.inspirationTitleBlock}>
                <div className={styles.inspirationTitleRow}>
                  <strong className={styles.inspirationName}>Greenwood</strong>
                  <span className={styles.inspirationTime}>6 Days ago</span>
                </div>
                <div className={styles.inspirationStats}>
                  <span className={styles.inspirationStat}>
                    <img alt="views" src={`${uiAssetBase}/inspiration-card/icon-eye-gray.png`} />
                    2.3k
                  </span>
                  <span className={styles.inspirationStat}>
                    <img alt="likes" src={`${uiAssetBase}/inspiration-card/icon-heart-gray.png`} />
                    56
                  </span>
                  <span className={styles.inspirationStat}>
                    <img alt="favorites" src={`${uiAssetBase}/inspiration-card/icon-star-gray.png`} />
                    267
                  </span>
                </div>
              </div>
            </header>
            <div className={styles.inspirationPreviewArea} aria-hidden="true" />
          </article>
        </ButtonBoxFrame>
      </div>
    );
  }

  if (id === "hero-product-ribbon") {
    return (
      <div className={styles.heroProductRibbonDemo}>
        <HeroProductRibbon label="New Product" style={{ width: 132 }} />
        <HeroProductRibbon label="Abundant Details" style={{ width: 184 }} />
      </div>
    );
  }

  if (id === "register-group") return <RegisterCollection />;
  if (id === "auth-pair") return <AuthPairCollection />;
  return <LoginCollection />;
}

export function FormalComponentsRegistry({
  followCreatorCardData,
  selectedId,
}: {
  followCreatorCardData?: FollowCreatorCardData | null;
  selectedId: ComponentId;
}) {
  const selected = components.find((component) => component.id === selectedId) ?? components[0];
  const stageClassName = [styles.stage, selected.id === "subscription-panel" ? styles.stageWide : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <p className={styles.eyebrow}>Formal</p>
            <h1 className={styles.title}>Formal Components</h1>
            <p className={styles.note}>
              Migrated UI components from the component lab. This page verifies that each primitive renders inside the main project.
            </p>

            <nav className={styles.nav} aria-label="Formal component navigation">
              {components.map((component) => (
                <Link
                  key={component.id}
                  className={[styles.navItem, selected.id === component.id ? styles.navItemActive : ""].join(" ")}
                  href={`/formal-components?component=${component.id}`}
                >
                  <span className={styles.navName}>{component.name}</span>
                  <span className={styles.navKind}>{component.kind}</span>
                </Link>
              ))}
            </nav>
          </aside>

          <section className={styles.workspace}>
            <header className={styles.header}>
              <div>
                <p className={styles.eyebrow}>Component Preview</p>
                <h2 className={styles.componentTitle}>{selected.title}</h2>
                <p className={styles.note}>{selected.description}</p>
              </div>
              <span className={styles.tag}>{selected.kind}</span>
            </header>

            <div className={stageClassName}>
              <ComponentPreview followCreatorCardData={followCreatorCardData} id={selected.id} />
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}>Usage</h3>
                <p className={styles.infoText}>{selected.usage}</p>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}>Assets</h3>
                <ul className={styles.assetList}>
                  {selected.assets.map((asset) => (
                    <li key={asset}>{asset}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
