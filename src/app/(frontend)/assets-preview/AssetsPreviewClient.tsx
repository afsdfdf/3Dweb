'use client'

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from 'react'
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MoreHorizontal,
  Search,
  Shield,
  Star,
  Trash2,
  Users,
} from 'lucide-react'

import { ButtonBoxFrame } from '@/components/ui-lab/button-box-frame'
import { BorderComboFrame2 } from '@/components/ui-lab/border-combo-frame-2'
import { TopNavigation } from '@/components/ui-lab/top-navigation'
import type { TopNavigationItem, TopNavigationUser } from '@/components/ui-lab/top-navigation'

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
  navUser: null | TopNavigationUser
}

const previewNavigationItems: TopNavigationItem[] = [
  { href: '/', id: 'HOME', label: 'HOME' },
  { href: '/workbench', id: 'WORKBENCH', label: 'WORKBENCH' },
  { href: '/account', id: 'ACCOUNT', label: 'ACCOUNT' },
  { href: '/assets-preview', id: 'ASSETS', label: 'ASSETS' },
]

const previewMockNavUser: TopNavigationUser = {
  avatarUrl: '/ui-lab/model-detail-uicut/images/face.png',
  creditsBalance: 3650,
  displayName: 'Xing Mu',
  followersCount: 560,
  id: assetsPreviewCurrentCreatorId,
  modelsCount: 23,
}

const creatorViewLabel = 'Creator Assets'

const tabItems: Array<{
  icon: typeof Box
  id: Exclude<AssetsPreviewView, 'creator'>
  label: string
}> = [
  { icon: Box, id: 'mine', label: 'My Assets' },
  { icon: Star, id: 'collections', label: 'My Collections' },
  { icon: Users, id: 'follows', label: 'My Follows' },
]

const creatorFallbackId = assetsPreviewCreators.find((creator) => creator.id !== assetsPreviewCurrentCreatorId)?.id
  || assetsPreviewCurrentCreatorId

function sortByCreatedAt(models: AssetsPreviewModel[]) {
  return [...models].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

function getCreatorInitials(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'TT'
}

function getVisibleModels({
  creators,
  models,
  query,
  selectedCreatorId,
  viewMode,
}: {
  creators: AssetsPreviewCreator[]
  models: AssetsPreviewModel[]
  query: string
  selectedCreatorId: string
  viewMode: AssetsPreviewView
}) {
  const followedCreatorIds = new Set(
    creators
      .filter((creator) => creator.isFollowing && creator.id !== assetsPreviewCurrentCreatorId)
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
  isCreatorView,
  onToggleFollow,
}: {
  creator: AssetsPreviewCreator
  isCreatorView: boolean
  onToggleFollow: (creatorId: string) => void
}) {
  return (
    <section
      className={styles.profileHero}
      aria-label={isCreatorView ? creatorViewLabel : `${creator.displayName} assets profile`}
    >
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
              <Users aria-hidden="true" size={22} />
              {creator.followersLabel}
            </span>
            <span>
              <Box aria-hidden="true" size={22} />
              {creator.modelsLabel}
            </span>
          </div>
        </div>
      </div>

      {isCreatorView && creator.id !== assetsPreviewCurrentCreatorId ? (
        <div className={styles.creatorActionPlate}>
          <button
            className={creator.isFollowing ? styles.followedButton : styles.followButton}
            onClick={() => onToggleFollow(creator.id)}
            type="button"
          >
            {creator.isFollowing ? 'Followed' : 'Follow'}
          </button>
        </div>
      ) : null}

      <div className={styles.profileBanner} aria-hidden="true">
        <img alt="" decoding="async" src={creator.bannerSrc} />
      </div>
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
                <Icon aria-hidden="true" size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className={styles.toolbarSpacer} />
      )}

      <div className={styles.toolbarRight}>
        <label className={styles.searchBox}>
          <Search aria-hidden="true" size={19} />
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
  const showVisibilityBadge = showOwnerControls
  const initials = getCreatorInitials(creator.displayName)

  return (
    <ButtonBoxFrame
      className={styles.assetCardFrame}
      contentClassName={styles.assetCardFrameContent}
      style={{
        height: 'var(--assets-card-height, 460px)',
        width: 'var(--assets-card-width, 288px)',
      }}
    >
      <article className={[styles.assetCard, styles[`tone${model.tone}`]].join(' ')}>
        <header className={styles.cardHeader}>
          <button
            aria-label={`Open ${creator.displayName} assets`}
            className={styles.cardAvatarButton}
            onClick={() => onAvatarClick(creator.id)}
            type="button"
          >
            {creator.avatarSrc ? (
              <img alt="" className={styles.cardAvatar} decoding="async" loading="lazy" src={creator.avatarSrc} />
            ) : (
              <span className={styles.avatarFallback}>{initials}</span>
            )}
            {creator.badgeLabel ? <span className={styles.miniBadge}>{creator.badgeLabel}</span> : null}
          </button>
          <div className={styles.cardMeta}>
            <div className={styles.cardTitleRow}>
              <strong>{creator.displayName}</strong>
              <span>{model.ageLabel}</span>
            </div>
            <div className={styles.cardStats}>
              <span>
                <Eye aria-hidden="true" size={12} />
                {model.viewsLabel}
              </span>
              <span>
                <Heart aria-hidden="true" size={12} />
                {model.likesLabel}
              </span>
              {showFavoriteControl ? (
                <button
                  aria-label={`Remove ${model.title} from collections`}
                  className={styles.favoriteStatButton}
                  onClick={() => onFavoriteToggle(model.id)}
                  type="button"
                >
                  <Star aria-hidden="true" fill="currentColor" size={12} />
                  {model.favoritesLabel}
                </button>
              ) : (
                <span>
                  <Star aria-hidden="true" size={12} />
                  {model.favoritesLabel}
                </span>
              )}
            </div>
          </div>

          {showOwnerControls ? (
            <div className={styles.cardMenuWrap}>
              <button
                aria-expanded={isMenuOpen}
                aria-label="More asset actions"
                className={styles.moreButton}
                onClick={() => onMenuToggle(model.id)}
                type="button"
              >
                <MoreHorizontal aria-hidden="true" size={17} />
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
            </div>
          ) : null}
        </header>

        <div className={styles.cardImagePlate}>
          {showVisibilityBadge ? (
            <span className={styles.visibilityBadge} data-visibility={model.visibility}>
              {model.visibility === 'public' ? 'Public' : 'Private'}
            </span>
          ) : null}
          <img alt={model.title} className={styles.cardImage} decoding="async" src={model.imageSrc} />
        </div>
      </article>
    </ButtonBoxFrame>
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

export function AssetsPreviewClient({ navUser }: AssetsPreviewClientProps) {
  const [creators, setCreators] = useState<AssetsPreviewCreator[]>(assetsPreviewCreators)
  const [models, setModels] = useState<AssetsPreviewModel[]>(assetsPreviewModels)
  const [openMenuId, setOpenMenuId] = useState<null | string>(null)
  const [pageSize, setPageSize] = useState<number>(20)
  const [query, setQuery] = useState('')
  const [selectedCreatorId, setSelectedCreatorId] = useState(creatorFallbackId)
  const [viewMode, setViewModeState] = useState<AssetsPreviewView>('mine')
  const [currentPage, setCurrentPage] = useState(1)

  const selectedCreator = creators.find((creator) => creator.id === selectedCreatorId)
    || creators.find((creator) => creator.id !== assetsPreviewCurrentCreatorId)
    || creators[0]
  const profileCreator = viewMode === 'creator'
    ? selectedCreator
    : creators.find((creator) => creator.id === assetsPreviewCurrentCreatorId) || creators[0]
  const visibleModels = useMemo(
    () => getVisibleModels({ creators, models, query, selectedCreatorId, viewMode }),
    [creators, models, query, selectedCreatorId, viewMode],
  )
  const totalPages = Math.max(1, Math.ceil(visibleModels.length / pageSize))
  const pageStartIndex = (Math.min(currentPage, totalPages) - 1) * pageSize
  const pagedModels = visibleModels.slice(pageStartIndex, pageStartIndex + pageSize)

  const setViewMode = (nextViewMode: AssetsPreviewView) => {
    setViewModeState(nextViewMode)
    setCurrentPage(1)
    setOpenMenuId(null)

    if (nextViewMode === 'creator' && selectedCreatorId === assetsPreviewCurrentCreatorId) {
      setSelectedCreatorId(creatorFallbackId)
    }
  }

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery)
    setCurrentPage(1)
  }

  const handleAvatarClick = (creatorId: string) => {
    if (creatorId === assetsPreviewCurrentCreatorId) {
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
      <section className={styles.previewShell} aria-label="Assets preview page">
        <BorderComboFrame2 className={styles.assetsFrame}>
          <div className={styles.frameShell}>
            <div className={styles.assetsPanel}>
              <ProfileHero
                creator={profileCreator}
                isCreatorView={viewMode === 'creator'}
                onToggleFollow={handleToggleFollow}
              />
              <AssetToolbar
                currentPage={Math.min(currentPage, totalPages)}
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
                  currentPage={Math.min(currentPage, totalPages)}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  setPageSize={handlePageSizeChange}
                  totalPages={totalPages}
                />
              </div>
            </div>
          </div>
        </BorderComboFrame2>
      </section>
    </>
  )
}
