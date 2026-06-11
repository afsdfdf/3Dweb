'use client'

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from 'react'
import {
  Box,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Shield,
  Star,
  Trash2,
  Users,
} from 'lucide-react'

import { FrameButton } from '@/components/ui/frame-button'
import { LineFrame } from '@/components/ui/line-frame'
import { InspirationGridCard } from '@/components/ui-lab/home-test/inspiration-grid'
import type { InspirationGridItem } from '@/components/ui-lab/home-test/inspiration-grid'
import { TopNavigation } from '@/components/ui-lab/top-navigation'
import type { TopNavigationItem, TopNavigationUser } from '@/components/ui-lab/top-navigation'
import { publicNavigationItems } from '@/lib/publicNavigation'

import {
  assetsPreviewCreators,
  assetsPreviewCurrentCreatorId,
  assetsPreviewModels,
  assetsPreviewPageSizeOptions,
} from './assetsPreviewData'
import type { AssetsPreviewCreator, AssetsPreviewModel } from './assetsPreviewData'
import styles from './page.module.css'

type AssetsPreviewView = 'collections' | 'creator' | 'follows' | 'mine'

type AssetsPreviewClientProps = {
  initialData?: AssetsPreviewInitialData | null
  navUser: null | TopNavigationUser
}

export type AssetsPreviewInitialData = {
  creators: AssetsPreviewCreator[]
  currentCreatorId: string
  models: AssetsPreviewModel[]
}

type TabItem = {
  icon: typeof Box
  id: Exclude<AssetsPreviewView, 'creator'>
  label: string
}

const previewNavigationItems: readonly TopNavigationItem[] = publicNavigationItems

const previewMockNavUser: TopNavigationUser = {
  avatarUrl: '/ui-lab/model-detail-uicut/images/face.png',
  creditsBalance: 3650,
  displayName: 'Xing Mu',
  followersCount: 560,
  id: assetsPreviewCurrentCreatorId,
  modelsCount: 23,
}

const creatorViewLabel = 'Creator Assets'

const tabItems: TabItem[] = [
  { icon: Box, id: 'mine', label: 'My Assets' },
  { icon: Star, id: 'collections', label: 'My Collections' },
  { icon: Users, id: 'follows', label: 'My Follows' },
]

function sortByCreatedAt(models: AssetsPreviewModel[]) {
  return [...models].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

function getVisibleModels({
  creators,
  currentCreatorId,
  models,
  query,
  selectedCreatorId,
  viewMode,
}: {
  creators: AssetsPreviewCreator[]
  currentCreatorId: string
  models: AssetsPreviewModel[]
  query: string
  selectedCreatorId: string
  viewMode: AssetsPreviewView
}) {
  const followedCreatorIds = new Set(
    creators
      .filter((creator) => creator.isFollowing && creator.id !== currentCreatorId)
      .map((creator) => creator.id),
  )
  const normalizedQuery = query.trim().toLowerCase()
  const filteredByMode = models.filter((model) => {
    if (viewMode === 'mine') return model.isOwned
    if (viewMode === 'collections') return model.isFavorited
    if (viewMode === 'follows') return model.visibility === 'public' && followedCreatorIds.has(model.creatorId)

    return model.visibility === 'public' && model.creatorId === selectedCreatorId
  })

  const filteredBySearch = normalizedQuery
    ? filteredByMode.filter((model) => {
        const creator = creators.find((item) => item.id === model.creatorId)
        const searchable = `${model.title} ${creator?.displayName || ''}`.toLowerCase()

        return searchable.includes(normalizedQuery)
      })
    : filteredByMode

  return sortByCreatedAt(filteredBySearch)
}

function ProfileHero({
  creator,
  currentCreatorId,
  isCreatorView,
  onToggleFollow,
}: {
  creator: AssetsPreviewCreator
  currentCreatorId: string
  isCreatorView: boolean
  onToggleFollow: (creatorId: string) => void
}) {
  return (
    <section className={styles.profileHero} aria-label={isCreatorView ? creatorViewLabel : `${creator.displayName} assets profile`}>
      <div className={styles.profileCopy}>
        <div className={styles.profileAvatarWrap}>
          <img alt="" className={styles.profileAvatar} decoding="async" src={creator.avatarSrc} />
          {creator.badgeLabel ? <span className={styles.profileBadge}>{creator.badgeLabel}</span> : null}
        </div>
        <div className={styles.profileText}>
          <h1>{creator.displayName}</h1>
          <p>{creator.bio}</p>
          <div className={styles.profileStats} aria-label="Creator statistics">
            <span>
              <img alt="" decoding="async" src="/ui-lab/top-navigation/profile-menu-icon-users@2x.png" />
              {creator.followersLabel}
            </span>
            <span>
              <img alt="" decoding="async" src="/ui-lab/top-navigation/profile-menu-icon-models@2x.png" />
              {creator.modelsLabel}
            </span>
          </div>
        </div>
      </div>

      {isCreatorView && creator.id !== currentCreatorId ? (
        <div className={styles.creatorActionPlate}>
          <FrameButton
            height={48}
            onClick={() => onToggleFollow(creator.id)}
            selected={creator.isFollowing}
            type="button"
            variant="slate"
            width={188}
          >
            {creator.isFollowing ? 'Followed' : 'Follow'}
          </FrameButton>
          <span className={styles.profileOrnament} aria-hidden="true" />
        </div>
      ) : null}

      <div
        className={styles.profileBanner}
        aria-hidden="true"
        style={{ backgroundImage: `url(${creator.bannerSrc})` }}
      />
    </section>
  )
}

function PaginationStrip({
  currentPage,
  onPageChange,
  pageSize,
  setPageSize,
  totalPages,
}: {
  currentPage: number
  onPageChange: (page: number) => void
  pageSize: number
  setPageSize: (pageSize: number) => void
  totalPages: number
}) {
  const visiblePages = [1, 2, 3, 4, 5].filter((page) => page <= totalPages)

  return (
    <nav className={styles.pagination} aria-label="Asset pages">
      <button
        aria-label="Previous page"
        className={styles.pageArrow}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={16} />
      </button>
      {visiblePages.map((page) => (
        <button
          aria-current={currentPage === page ? 'page' : undefined}
          className={styles.pageButton}
          key={page}
          onClick={() => onPageChange(page)}
          type="button"
        >
          {page}
        </button>
      ))}
      {totalPages > 6 ? <span className={styles.pageEllipsis}>...</span> : null}
      {totalPages > 5 ? (
        <button
          aria-current={currentPage === totalPages ? 'page' : undefined}
          className={styles.pageButton}
          onClick={() => onPageChange(totalPages)}
          type="button"
        >
          {totalPages}
        </button>
      ) : null}
      <button
        aria-label="Next page"
        className={styles.pageArrow}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={16} />
      </button>
      <label className={styles.pageSizeSelect}>
        <span className={styles.srOnly}>Items per page</span>
        <select onChange={(event) => setPageSize(Number(event.target.value))} value={pageSize}>
          {assetsPreviewPageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option} Items / Page
            </option>
          ))}
        </select>
      </label>
    </nav>
  )
}

function AssetToolbar({
  currentPage,
  onPageChange,
  onQueryChange,
  pageSize,
  query,
  setPageSize,
  setViewMode,
  showTabs,
  totalPages,
  viewMode,
}: {
  currentPage: number
  onPageChange: (page: number) => void
  onQueryChange: (query: string) => void
  pageSize: number
  query: string
  setPageSize: (pageSize: number) => void
  setViewMode: (viewMode: AssetsPreviewView) => void
  showTabs: boolean
  totalPages: number
  viewMode: AssetsPreviewView
}) {
  return (
    <div className={styles.toolbar}>
      {showTabs ? (
        <div className={styles.tabs} role="tablist" aria-label="Asset view">
          {tabItems.map((tab) => {
            const Icon = tab.icon

            return (
              <button
                aria-selected={viewMode === tab.id}
                className={styles.tabButton}
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                role="tab"
                type="button"
              >
                <Icon aria-hidden="true" size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className={styles.creatorViewTitle}>{creatorViewLabel}</div>
      )}

      <div className={styles.toolbarRight}>
        <label className={styles.searchBox}>
          <Search aria-hidden="true" size={18} />
          <span className={styles.srOnly}>Search assets</span>
          <input
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Please enter keywords"
            value={query}
          />
        </label>
        <button className={styles.searchButton} type="button">
          Search
        </button>
        <PaginationStrip
          currentPage={currentPage}
          onPageChange={onPageChange}
          pageSize={pageSize}
          setPageSize={setPageSize}
          totalPages={totalPages}
        />
      </div>
    </div>
  )
}

function EmptyState({ viewMode }: { viewMode: AssetsPreviewView }) {
  const label = viewMode === 'follows' ? 'No followed creator assets' : 'No assets'

  return (
    <div className={styles.emptyState}>
      <Box aria-hidden="true" size={28} />
      <span>{label}</span>
    </div>
  )
}

function AssetCard({
  creator,
  isMenuOpen,
  model,
  onAvatarClick,
  onDelete,
  onFavoriteToggle,
  onMenuToggle,
  onVisibilityToggle,
  viewMode,
}: {
  creator: AssetsPreviewCreator
  isMenuOpen: boolean
  model: AssetsPreviewModel
  onAvatarClick: (creatorId: string) => void
  onDelete: (modelId: string) => void
  onFavoriteToggle: (modelId: string) => void
  onMenuToggle: (modelId: string) => void
  onVisibilityToggle: (modelId: string) => void
  viewMode: AssetsPreviewView
}) {
  const showOwnerControls = viewMode === 'mine' && model.isOwned
  const showFavoriteControl = viewMode === 'collections'
  const cardItem: InspirationGridItem = {
    ageLabel: model.ageLabel,
    authorName: creator.displayName,
    avatarSrc: creator.avatarSrc,
    favoritesLabel: model.favoritesLabel,
    href: null,
    id: model.id,
    imageSrc: model.imageSrc,
    likesLabel: model.likesLabel,
    title: model.title,
    viewsLabel: model.viewsLabel,
  }

  return (
    <article className={styles.assetCardShell} aria-label={model.title}>
      <InspirationGridCard item={cardItem} onActivate={() => onAvatarClick(creator.id)} />

      {showOwnerControls ? (
        <>
          <span className={styles.visibilityChip} data-visibility={model.visibility}>
            {model.visibility === 'public' ? 'Public' : 'Private'}
          </span>
          <button
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label={`Actions for ${model.title}`}
            className={styles.moreButton}
            onClick={() => onMenuToggle(model.id)}
            type="button"
          >
            <MoreHorizontal aria-hidden="true" size={16} />
          </button>
          {isMenuOpen ? (
            <div className={styles.cardMenu} role="menu">
              <button onClick={() => onVisibilityToggle(model.id)} role="menuitem" type="button">
                <Shield aria-hidden="true" size={14} />
                {model.visibility === 'public' ? 'Hide Current Model' : 'Show Current Model'}
              </button>
              <button onClick={() => onDelete(model.id)} role="menuitem" type="button">
                <Trash2 aria-hidden="true" size={14} />
                Delete Current Model
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {showFavoriteControl ? (
        <button
          aria-label={`Remove ${model.title} from collections`}
          className={styles.collectStar}
          onClick={() => onFavoriteToggle(model.id)}
          type="button"
        >
          <Star aria-hidden="true" fill="currentColor" size={17} strokeWidth={1.8} />
        </button>
      ) : null}
    </article>
  )
}

function AssetGrid({
  creators,
  models,
  onAvatarClick,
  onDelete,
  onFavoriteToggle,
  onMenuToggle,
  onVisibilityToggle,
  openMenuId,
  viewMode,
}: {
  creators: AssetsPreviewCreator[]
  models: AssetsPreviewModel[]
  onAvatarClick: (creatorId: string) => void
  onDelete: (modelId: string) => void
  onFavoriteToggle: (modelId: string) => void
  onMenuToggle: (modelId: string) => void
  onVisibilityToggle: (modelId: string) => void
  openMenuId: null | string
  viewMode: AssetsPreviewView
}) {
  if (models.length === 0) return <EmptyState viewMode={viewMode} />

  return (
    <div className={styles.assetGrid}>
      {models.map((model) => {
        const creator = creators.find((item) => item.id === model.creatorId) || creators[0]

        return (
          <AssetCard
            creator={creator}
            isMenuOpen={openMenuId === model.id}
            key={model.id}
            model={model}
            onAvatarClick={onAvatarClick}
            onDelete={onDelete}
            onFavoriteToggle={onFavoriteToggle}
            onMenuToggle={onMenuToggle}
            onVisibilityToggle={onVisibilityToggle}
            viewMode={viewMode}
          />
        )
      })}
    </div>
  )
}

export function AssetsPreviewClient({ initialData, navUser }: AssetsPreviewClientProps) {
  const hasInitialData = Boolean(initialData)
  const initialCurrentCreatorId = initialData?.currentCreatorId || assetsPreviewCurrentCreatorId
  const initialCreators = hasInitialData ? initialData?.creators || [] : assetsPreviewCreators
  const initialModels = hasInitialData ? initialData?.models || [] : assetsPreviewModels
  const initialCreatorFallbackId = initialCreators.find((creator) => creator.id !== initialCurrentCreatorId)?.id
    || initialCurrentCreatorId
  const [creators, setCreators] = useState<AssetsPreviewCreator[]>(initialCreators)
  const [models, setModels] = useState<AssetsPreviewModel[]>(initialModels)
  const [openMenuId, setOpenMenuId] = useState<null | string>(null)
  const [pageSize, setPageSize] = useState<number>(20)
  const [query, setQuery] = useState('')
  const [selectedCreatorId, setSelectedCreatorId] = useState(initialCreatorFallbackId)
  const [viewMode, setViewModeState] = useState<AssetsPreviewView>('mine')
  const [currentPage, setCurrentPage] = useState(1)

  const selectedCreator = creators.find((creator) => creator.id === selectedCreatorId)
    || creators.find((creator) => creator.id !== initialCurrentCreatorId)
    || creators[0]
  const profileCreator = viewMode === 'creator'
    ? selectedCreator
    : creators.find((creator) => creator.id === initialCurrentCreatorId) || creators[0]
  const visibleModels = useMemo(
    () => getVisibleModels({
      creators,
      currentCreatorId: initialCurrentCreatorId,
      models,
      query,
      selectedCreatorId,
      viewMode,
    }),
    [creators, initialCurrentCreatorId, models, query, selectedCreatorId, viewMode],
  )
  const totalPages = Math.max(1, Math.ceil(visibleModels.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStartIndex = (safeCurrentPage - 1) * pageSize
  const pagedModels = visibleModels.slice(pageStartIndex, pageStartIndex + pageSize)

  const setViewMode = (nextViewMode: AssetsPreviewView) => {
    setViewModeState(nextViewMode)
    setCurrentPage(1)
    setOpenMenuId(null)

    if (nextViewMode === 'creator' && selectedCreatorId === initialCurrentCreatorId) {
      setSelectedCreatorId(initialCreatorFallbackId)
    }
  }

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery)
    setCurrentPage(1)
  }

  const handleAvatarClick = (creatorId: string) => {
    if (creatorId === initialCurrentCreatorId) {
      setViewMode('mine')
      return
    }

    setSelectedCreatorId(creatorId)
    setViewMode('creator')
  }

  const handleToggleFollow = (creatorId: string) => {
    setCreators((current) =>
      current.map((creator) =>
        creator.id === creatorId ? { ...creator, isFollowing: !creator.isFollowing } : creator,
      ),
    )
    setCurrentPage(1)
  }

  const handleFavoriteToggle = (modelId: string) => {
    setModels((current) =>
      current.map((model) =>
        model.id === modelId ? { ...model, isFavorited: !model.isFavorited } : model,
      ),
    )
  }

  const handleVisibilityToggle = (modelId: string) => {
    setModels((current) =>
      current.map((model) =>
        model.id === modelId
          ? {
              ...model,
              visibility: model.visibility === 'public' ? 'private' : 'public',
            }
          : model,
      ),
    )
    setOpenMenuId(null)
  }

  const handleDelete = (modelId: string) => {
    setModels((current) => current.filter((model) => model.id !== modelId))
    setOpenMenuId(null)
  }

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  return (
    <>
      <TopNavigation
        active="ASSETS"
        className={styles.boundTopNavigation}
        items={previewNavigationItems}
        user={navUser ?? previewMockNavUser}
      />
      <div className={styles.assetStage}>
        <section className={styles.assetsSection} aria-label="Assets preview page">
          <div className={styles.mergedPanel}>
            <LineFrame
              className={styles.assetCenterFrame}
              contentClassName={styles.assetCenterContent}
              contentPadding={64}
              frameSize={96}
            >
              <div className={styles.assetsPanel}>
                <ProfileHero
                  creator={profileCreator}
                  currentCreatorId={initialCurrentCreatorId}
                  isCreatorView={viewMode === 'creator'}
                  onToggleFollow={handleToggleFollow}
                />
                <AssetToolbar
                  currentPage={safeCurrentPage}
                  onPageChange={setCurrentPage}
                  onQueryChange={handleQueryChange}
                  pageSize={pageSize}
                  query={query}
                  setPageSize={handlePageSizeChange}
                  setViewMode={setViewMode}
                  showTabs={viewMode !== 'creator'}
                  totalPages={totalPages}
                  viewMode={viewMode}
                />
                <div className={styles.frameRule} />
                <AssetGrid
                  creators={creators}
                  models={pagedModels}
                  onAvatarClick={handleAvatarClick}
                  onDelete={handleDelete}
                  onFavoriteToggle={handleFavoriteToggle}
                  onMenuToggle={(modelId) => setOpenMenuId((current) => (current === modelId ? null : modelId))}
                  onVisibilityToggle={handleVisibilityToggle}
                  openMenuId={openMenuId}
                  viewMode={viewMode}
                />
                <div className={styles.bottomPager}>
                  <PaginationStrip
                    currentPage={safeCurrentPage}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    setPageSize={handlePageSizeChange}
                    totalPages={totalPages}
                  />
                </div>
              </div>
            </LineFrame>
          </div>
        </section>
      </div>
    </>
  )
}
