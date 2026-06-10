/* eslint-disable @next/next/no-img-element -- UI test page mirroring the homepage inspiration cards, which use plain <img> */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Star, UserRound, Users } from "lucide-react";

import { FrameButton } from "@/components/ui/frame-button";
import { BorderComboFrame1 } from "@/components/ui-lab/border-combo-frame-1";
import cardStyles from "@/components/ui-lab/home-test/inspiration-grid.module.css";

import { PersonalCenterFrame } from "./PersonalCenterFrame";
import styles from "./assetsTestPage.module.css";

const SKETCH = "/ui/workbench/model-detail/sketch-assets";

type MockCreatorId = "greenwood" | "xingmu";

type MockCreator = {
  /** object-position for circular avatar crops of full-body art. */
  avatarFocus?: string;
  avatarSrc: string;
  favoritesLabel: string;
  id: MockCreatorId;
  likesLabel: string;
  name: string;
  viewsLabel: string;
};

type MockAsset = {
  ageLabel: string;
  collected: boolean;
  creator: MockCreatorId;
  /** Gold corner frame, matching the highlighted card in the reference design. */
  highlighted?: boolean;
  id: string;
  imageSrc: string;
  /** Higher = newer; drives "My Follows" time sorting. */
  recency: number;
  title: string;
  visibility: "private" | "public";
};

type AssetsTab = "assets" | "collections" | "creator" | "follows";

const mockCreators: Record<MockCreatorId, MockCreator> = {
  greenwood: {
    avatarFocus: "50% 10%",
    avatarSrc: `${SKETCH}/input-thumb.webp`,
    favoritesLabel: "267",
    id: "greenwood",
    likesLabel: "56",
    name: "Greenwood",
    viewsLabel: "2.3k",
  },
  xingmu: {
    avatarSrc: `${SKETCH}/creator-avatar.webp`,
    favoritesLabel: "267",
    id: "xingmu",
    likesLabel: "1.5k",
    name: "Xingmu",
    viewsLabel: "320",
  },
};

const initialAssets: MockAsset[] = [
  { ageLabel: "6 Days ago", collected: true, creator: "greenwood", id: "asset-01", imageSrc: `${SKETCH}/gallery-1.webp`, recency: 12, title: "Stormlight Paladin", visibility: "private" },
  { ageLabel: "6 Days ago", collected: true, creator: "xingmu", id: "asset-02", imageSrc: `${SKETCH}/gallery-2.webp`, recency: 11, title: "Tavern Keeper", visibility: "private" },
  { ageLabel: "6 Days ago", collected: true, creator: "greenwood", id: "asset-03", imageSrc: `${SKETCH}/gallery-3.webp`, recency: 10, title: "Pale Knight", visibility: "public" },
  { ageLabel: "6 Days ago", collected: true, creator: "xingmu", id: "asset-04", imageSrc: `${SKETCH}/gallery-4.webp`, recency: 9, title: "Frost Giant", visibility: "private" },
  { ageLabel: "6 Days ago", collected: true, creator: "greenwood", id: "asset-05", imageSrc: `${SKETCH}/gallery-5.webp`, recency: 8, title: "Wild Huntress", visibility: "public" },
  { ageLabel: "6 Days ago", collected: true, creator: "xingmu", id: "asset-06", imageSrc: `${SKETCH}/input-thumb.webp`, recency: 7, title: "Spoon Gnome", visibility: "public" },
  { ageLabel: "6 Days ago", collected: true, creator: "greenwood", highlighted: true, id: "asset-07", imageSrc: `${SKETCH}/gallery-5.webp`, recency: 6, title: "Ember Barbarian", visibility: "public" },
  { ageLabel: "6 Days ago", collected: true, creator: "xingmu", id: "asset-08", imageSrc: `${SKETCH}/input-thumb.webp`, recency: 5, title: "Hearth Cook", visibility: "private" },
  { ageLabel: "6 Days ago", collected: true, creator: "xingmu", id: "asset-09", imageSrc: `${SKETCH}/gallery-4.webp`, recency: 4, title: "Tide Shaman", visibility: "public" },
  { ageLabel: "6 Days ago", collected: true, creator: "xingmu", id: "asset-10", imageSrc: `${SKETCH}/gallery-2.webp`, recency: 3, title: "Cheerful Innkeep", visibility: "public" },
  { ageLabel: "6 Days ago", collected: false, creator: "greenwood", id: "asset-11", imageSrc: `${SKETCH}/gallery-3.webp`, recency: 2, title: "Dusk Warden", visibility: "private" },
  { ageLabel: "6 Days ago", collected: false, creator: "greenwood", id: "asset-12", imageSrc: `${SKETCH}/gallery-1.webp`, recency: 1, title: "Dawn Lancer", visibility: "private" },
];

const tabs: Array<{ icon: typeof Package; id: AssetsTab; label: string }> = [
  { icon: Package, id: "assets", label: "MY ASSETS" },
  { icon: Star, id: "collections", label: "MY COLLECTIONS" },
  { icon: UserRound, id: "follows", label: "MY FOLLOWS" },
  { icon: Users, id: "creator", label: "CREATOR ASSETS" },
];

// Visual-only pager pages matching the reference screenshots; the mock data
// set fits on one page, so other pages intentionally show the same list.
const mockPagerPages: Array<number | "ellipsis"> = [1, 2, 3, 4, 5, "ellipsis", 99];

type AssetTestCardProps = {
  asset: MockAsset;
  menuOpen: boolean;
  onDelete?: (assetId: string) => void;
  onToggleMenu?: (assetId: string) => void;
  onToggleVisibility?: (assetId: string) => void;
  onUncollect?: (assetId: string) => void;
  showCollectionStar?: boolean;
  showOwnerControls?: boolean;
};

function AssetTestCard({
  asset,
  menuOpen,
  onDelete,
  onToggleMenu,
  onToggleVisibility,
  onUncollect,
  showCollectionStar = false,
  showOwnerControls = false,
}: AssetTestCardProps) {
  const creator = mockCreators[asset.creator];

  return (
    <div className={[cardStyles.item, styles.cardShell].join(" ")}>
      <BorderComboFrame1
        className={[styles.cardFrame1, asset.highlighted ? styles.cardFrameGold : ""].filter(Boolean).join(" ")}
        contentClassName={styles.cardFrame1Content}
      >
        <article className={cardStyles.cardContent}>
          <header className={cardStyles.cardHeader}>
            <div className={cardStyles.avatarWrap}>
              <img
                alt=""
                className={cardStyles.avatar}
                decoding="async"
                loading="lazy"
                src={creator.avatarSrc}
                style={creator.avatarFocus ? { objectPosition: creator.avatarFocus } : undefined}
              />
              <span className={cardStyles.avatarBadge} aria-hidden="true" />
            </div>
            <div className={cardStyles.titleBlock}>
              <div className={cardStyles.titleRow}>
                <strong className={cardStyles.name}>{creator.name}</strong>
                <span className={cardStyles.time}>{asset.ageLabel}</span>
              </div>
              <div className={cardStyles.stats}>
                <span className={cardStyles.stat}>
                  <img alt="" decoding="async" loading="lazy" src="/ui-lab/formal-components/assets/inspiration-card/icon-eye-gray.png" />
                  {creator.viewsLabel}
                </span>
                <span className={cardStyles.stat}>
                  <img alt="" decoding="async" loading="lazy" src="/ui-lab/formal-components/assets/inspiration-card/icon-heart-gray.png" />
                  {creator.likesLabel}
                </span>
                <span className={cardStyles.stat}>
                  <img alt="" decoding="async" loading="lazy" src="/ui-lab/formal-components/assets/inspiration-card/icon-star-gray.png" />
                  {creator.favoritesLabel}
                </span>
              </div>
            </div>
          </header>
          <div className={cardStyles.previewArea} aria-hidden="true">
            <img alt="" className={cardStyles.previewImage} decoding="async" loading="lazy" src={asset.imageSrc} />
          </div>
        </article>
      </BorderComboFrame1>

      {showOwnerControls ? (
        <>
          <span className={styles.visibilityChip}>{asset.visibility === "public" ? "Public" : "Private"}</span>
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Actions for ${asset.title}`}
            className={styles.moreButton}
            onClick={(event) => {
              event.stopPropagation();
              onToggleMenu?.(asset.id);
            }}
            type="button"
          >
            <span aria-hidden="true">•••</span>
          </button>
          {menuOpen ? (
            <div className={styles.actionMenu} onClick={(event) => event.stopPropagation()} role="menu">
              <button
                className={styles.actionMenuItem}
                onClick={() => onToggleVisibility?.(asset.id)}
                role="menuitem"
                type="button"
              >
                {asset.visibility === "public" ? "Hide Current Model" : "Make Public"}
              </button>
              <button
                className={styles.actionMenuItem}
                onClick={() => onDelete?.(asset.id)}
                role="menuitem"
                type="button"
              >
                Delete Current Model
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {showCollectionStar ? (
        <button
          aria-label={`Remove ${asset.title} from collections`}
          className={styles.collectStar}
          onClick={(event) => {
            event.stopPropagation();
            onUncollect?.(asset.id);
          }}
          type="button"
        >
          <Star aria-hidden="true" fill="currentColor" size={16} strokeWidth={1.6} />
        </button>
      ) : null}
    </div>
  );
}

export function AssetsTestClient() {
  const [activeTab, setActiveTab] = useState<AssetsTab>("assets");
  const [assets, setAssets] = useState<MockAsset[]>(initialAssets);
  const [followedCreators, setFollowedCreators] = useState<Record<MockCreatorId, boolean>>({
    greenwood: true,
    xingmu: true,
  });
  const [openMenuAssetId, setOpenMenuAssetId] = useState<null | string>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagerPage, setPagerPage] = useState(1);

  useEffect(() => {
    if (!openMenuAssetId) return;

    const closeMenu = () => setOpenMenuAssetId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [openMenuAssetId]);

  const visibleAssets = useMemo(() => {
    let list = assets;

    if (activeTab === "collections") {
      list = list.filter((asset) => asset.collected);
    } else if (activeTab === "follows") {
      list = list
        .filter((asset) => followedCreators[asset.creator])
        .slice()
        .sort((left, right) => right.recency - left.recency);
    } else if (activeTab === "creator") {
      list = list.filter((asset) => asset.creator === "greenwood");
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (asset) =>
          asset.title.toLowerCase().includes(query) || mockCreators[asset.creator].name.toLowerCase().includes(query),
      );
    }

    return list;
  }, [activeTab, assets, followedCreators, searchQuery]);

  const isCreatorView = activeTab === "creator";
  const creatorFollowed = followedCreators.greenwood;

  const handleTabChange = (tab: AssetsTab) => {
    setActiveTab(tab);
    setOpenMenuAssetId(null);
    setPagerPage(1);
  };

  const handleToggleVisibility = (assetId: string) => {
    setAssets((current) =>
      current.map((asset) =>
        asset.id === assetId
          ? { ...asset, visibility: asset.visibility === "public" ? "private" : "public" }
          : asset,
      ),
    );
    setOpenMenuAssetId(null);
  };

  const handleDelete = (assetId: string) => {
    setAssets((current) => current.filter((asset) => asset.id !== assetId));
    setOpenMenuAssetId(null);
  };

  const handleUncollect = (assetId: string) => {
    setAssets((current) => current.map((asset) => (asset.id === assetId ? { ...asset, collected: false } : asset)));
  };

  const profile = isCreatorView
    ? {
        avatarFocus: mockCreators.greenwood.avatarFocus,
        avatarSrc: mockCreators.greenwood.avatarSrc,
        kick: true,
        name: "Greenwood",
      }
    : {
        avatarFocus: mockCreators.xingmu.avatarFocus,
        avatarSrc: mockCreators.xingmu.avatarSrc,
        kick: false,
        name: "Xing Mu",
      };

  return (
    <div className={styles.stage}>
      <section className={styles.framedSection} aria-label="Creator profile">
        <PersonalCenterFrame className={styles.profileFrame} compact contentClassName={styles.profileFrameContent}>
          <div className={styles.profileBanner}>
            <div className={styles.profileMain}>
              <span className={[styles.profileAvatarRing, profile.kick ? styles.profileAvatarRingKick : ""].filter(Boolean).join(" ")}>
                <img
                  alt={`${profile.name} avatar`}
                  className={styles.profileAvatar}
                  decoding="async"
                  src={profile.avatarSrc}
                  style={profile.avatarFocus ? { objectPosition: profile.avatarFocus } : undefined}
                />
                {profile.kick ? <span className={styles.profileKickBadge}>KICK</span> : null}
              </span>
              <div className={styles.profileInfo}>
                <strong className={styles.profileName}>{profile.name}</strong>
                <p className={styles.profileBio}>
                  Is an outstanding anime-style model creator Is an outstanding anime-style model creator
                </p>
                <div className={styles.profileStats} aria-label="Creator stats">
                  <span className={styles.profileStat}>
                    <img alt="" src="/ui-lab/top-navigation/profile-menu-icon-users@2x.png" />
                    <span>560</span>
                  </span>
                  <span className={styles.profileStat}>
                    <img alt="" src="/ui-lab/top-navigation/profile-menu-icon-models@2x.png" />
                    <span>23</span>
                  </span>
                </div>
              </div>
              {isCreatorView ? (
                <div className={styles.profileFollowMount}>
                  <FrameButton
                    height={48}
                    onClick={() => setFollowedCreators((current) => ({ ...current, greenwood: !current.greenwood }))}
                    selected={creatorFollowed}
                    type="button"
                    variant="slate"
                    width={198}
                  >
                    {creatorFollowed ? "Followed" : "Follow"}
                  </FrameButton>
                  <span className={styles.profileOrnament} aria-hidden="true" />
                </div>
              ) : null}
            </div>
            <div className={styles.profileArt} aria-hidden="true" />
          </div>
        </PersonalCenterFrame>
      </section>

      <section className={styles.framedSection} aria-label="Assets">
        <PersonalCenterFrame className={styles.assetsFrame} contentClassName={styles.assetsFrameContent}>
          <div className={styles.frameShell}>
            <div className={styles.toolbarRow}>
              <div className={styles.tabs} role="tablist" aria-label="Asset views">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      aria-selected={activeTab === tab.id}
                      className={[styles.tab, activeTab === tab.id ? styles.tabActive : ""].filter(Boolean).join(" ")}
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      role="tab"
                      type="button"
                    >
                      <Icon aria-hidden="true" size={14} strokeWidth={2} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.toolbar}>
                <form
                  className={styles.searchBox}
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSearchQuery(searchDraft);
                  }}
                  role="search"
                >
                  <label className={styles.searchShell}>
                    <span className={styles.searchIcon} aria-hidden="true" />
                    <input
                      aria-label="Search assets"
                      className={styles.searchInput}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      placeholder="Please enter keywords"
                      type="search"
                      value={searchDraft}
                    />
                  </label>
                  <button className={styles.searchButton} type="submit">
                    Search
                  </button>
                </form>

                <nav aria-label="Asset pages" className={styles.pager}>
                  <button aria-label="Previous page" disabled={pagerPage <= 1} onClick={() => setPagerPage((page) => Math.max(1, page - 1))} type="button">
                    {"<"}
                  </button>
                  {mockPagerPages.map((item, index) =>
                    item === "ellipsis" ? (
                      <span className={styles.pagerEllipsis} key={`ellipsis-${index}`}>
                        ...
                      </span>
                    ) : (
                      <button
                        aria-current={item === pagerPage ? "page" : undefined}
                        className={item === pagerPage ? styles.pagerCurrent : undefined}
                        key={item}
                        onClick={() => setPagerPage(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    ),
                  )}
                  <button aria-label="Next page" disabled={pagerPage >= 99} onClick={() => setPagerPage((page) => Math.min(99, page + 1))} type="button">
                    {">"}
                  </button>
                </nav>

                <button className={styles.pageSize} type="button">
                  <span>20 Items / Page</span>
                  <span className={styles.pageSizeChevron} aria-hidden="true" />
                </button>
              </div>
            </div>

            <span className={styles.gridDivider} aria-hidden="true" />

            <div className={styles.assetsGrid} aria-label="Asset grid">
              {visibleAssets.length > 0 ? (
                visibleAssets.map((asset) => (
                  <AssetTestCard
                    asset={asset}
                    key={asset.id}
                    menuOpen={openMenuAssetId === asset.id}
                    onDelete={handleDelete}
                    onToggleMenu={(assetId) => setOpenMenuAssetId((current) => (current === assetId ? null : assetId))}
                    onToggleVisibility={handleToggleVisibility}
                    onUncollect={handleUncollect}
                    showCollectionStar={activeTab === "collections"}
                    showOwnerControls={activeTab === "assets"}
                  />
                ))
              ) : (
                <div className={styles.emptyState}>No Models Found</div>
              )}
            </div>

            <div className={styles.bottomPagerMount}>
              <nav aria-label="Asset pages" className={styles.pager}>
                <button aria-label="Previous page" disabled={pagerPage <= 1} onClick={() => setPagerPage((page) => Math.max(1, page - 1))} type="button">
                  {"<"}
                </button>
                {mockPagerPages.map((item, index) =>
                  item === "ellipsis" ? (
                    <span className={styles.pagerEllipsis} key={`ellipsis-${index}`}>
                      ...
                    </span>
                  ) : (
                    <button
                      aria-current={item === pagerPage ? "page" : undefined}
                      className={item === pagerPage ? styles.pagerCurrent : undefined}
                      key={item}
                      onClick={() => setPagerPage(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ),
                )}
                <button aria-label="Next page" disabled={pagerPage >= 99} onClick={() => setPagerPage((page) => Math.min(99, page + 1))} type="button">
                  {">"}
                </button>
                <button className={styles.pageSize} type="button">
                  <span>20 Items / Page</span>
                  <span className={styles.pageSizeChevron} aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </PersonalCenterFrame>
      </section>
    </div>
  );
}
