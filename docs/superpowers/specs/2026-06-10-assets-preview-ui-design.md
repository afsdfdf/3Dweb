# Assets Preview UI Design

## Purpose

Build the asset center UI. The reviewed prototype is now promoted to the formal `/assets` entry with read-only real Payload data, while `/assets-preview` remains available for visual review.

## Scope

The first implementation created `/assets-preview`; the reviewed UI is promoted to `/assets` as the formal entry while `/assets-preview` remains available as a preview alias.

It does:

- Render the top navigation with `ASSETS` active.
- Render a profile banner using the same visual language as the homepage third frame.
- Render asset tabs for `My Assets`, `My Collections`, `My Follows`, and a simulated creator profile state.
- Render a dense grid of model cards with the existing dark frame/card visual language.
- Read real Payload data on `/assets` for current-user models, favorited models, followed creator models, and creator summaries.
- Support UI-only interactions for permission menu state, favorite removal, follow/unfollow filtering, and creator profile switching.

It does not:

- Mutate Payload records.
- Delete real models.
- Change real model visibility.
- Create new collections or globals.

## Recommended Route

Use `/assets` for the formal user-facing entry and keep `/assets-preview` for review.

Reasons:

- `/assets` is the top-navigation entry users should click.
- `/assets-preview` remains clearly marked as a preview surface, not production data functionality.
- It avoids resurrecting the old removed `/test-*` route style.
- It lets mutation safety be introduced later without changing the visible navigation target.

## Visual Structure

The page uses the current public page chrome:

- `TopNavigation` with `ASSETS` as the active id.
- Current user data from the normal nav-user helper where available, with mock fallback data.
- Existing footer component.

The preview uses one large `LineFrame` region so the layout uses the same 9-slice model-card frame family as `ModelThumbnailCard` without requiring a new irregular frame component:

- A lowered profile strip with avatar, display name, short bio, follower/model stats, a right-side tiled banner strip, and optional follow button.
- A tab row, search, pagination, and grid content inside the same large frame.
- The single `LineFrame` uses the original 96px model-card frame size. Do not add a separate frame around the profile strip.
- The space between the profile strip and the asset toolbar should be tight; avoid a large empty black band. The banner strip should tile horizontally without distorting the source image ratio.
- A tab row below the profile strip.
- Search, pager, and page-size controls in the same row style shown in the references.
- A two-row desktop grid of six columns at wide widths, then responsive fallbacks at narrower widths.

## Asset Card Design

Create a focused preview-only wrapper for the assets page that calls the homepage `InspirationGridCard` directly. The wrapper should not copy the homepage card frame or card internals; it only layers asset-center controls on top.

Card content:

- Creator avatar and name.
- Relative time.
- View, like, and favorite counters.
- Preview image.
- Optional visibility pill: `Public` or `Private`.
- Optional star toggle for collection cards.
- Optional more menu for owned assets.

Owned asset menu:

- Public model: `Hide Current Model`, `Delete Current Model`.
- Private model: `Show Current Model`, `Delete Current Model`.

The menu only changes local UI state in this preview. Delete removes the card from local state so the interaction can be reviewed without touching backend data.

## View Modes

### My Assets

Shows models owned by the current user. Each card shows the current visibility state and a more button. Menu actions update local state only.

### My Collections

Shows favorited models. Each card shows an active star. Clicking the star removes the item from this tab's local list only.

### My Follows

Shows assets from followed creators, sorted newest first in the mock data. If the user unfollows a creator in the preview, this tab filters that creator's models out immediately.

### Creator Assets

Simulates a public creator profile reached from an avatar click. The header changes to that creator, shows a `Follow` or `Followed` button, and the grid shows only that creator's public assets.

Avatar click behavior:

- From any asset card, clicking the creator avatar switches to `Creator Assets`.
- The selected creator is tracked in local state.
- Clicking `Followed` toggles to `Follow`; clicking `Follow` toggles back.
- When a creator is unfollowed, their models disappear from `My Follows`.

## Data Model

The formal `/assets` route receives server-built DTOs from Payload. The preview route can still use static mock data. The shared client shape is:

```ts
type AssetPreviewCreator = {
  avatarUrl: string
  bio: string
  followerCount: number
  id: string
  isFollowing: boolean
  modelCount: number
  name: string
  profileBadge?: string
}

type AssetPreviewModel = {
  authorId: string
  commentsCount: number
  createdAt: string
  favoriteCount: number
  id: string
  imageUrl: string
  isFavorited: boolean
  likeCount: number
  title: string
  viewCount: number
  visibility: 'private' | 'public'
}
```

Formal data sources:

- `models` for current-user assets and public followed-creator models.
- `model-favorites` for current-user collections.
- `user-follows` for current-user followed creators.
- `users` for profile summaries and tiled banner images, with non-current profile media shown only when the profile is public.

## Future Backend Plan

Phase 1, UI preview and formal shell:

- `/assets-preview` route and formal `/assets` entry.
- Mock data.
- Local-only interaction state.
- Browser visual verification.

Phase 2, read-only real data:

- Done for `/assets`: server data helper maps current-user models, current-user favorites, followed creators, and public followed-creator models into the shared card DTOs.
- `/assets-preview` keeps mock data for review.

Phase 3, safe mutations:

- Visibility uses existing `/api/account/models/:modelId/visibility`.
- Favorite removal uses existing `/api/social/models/:modelId/favorite` with `DELETE`.
- Follow/unfollow uses existing `/api/creators/:userId/follow`.
- Delete requires a new account-owned model delete endpoint or archive endpoint with owner checks, origin checks, rate limits, and relation cleanup policy.

Phase 4, production route:

- Keep `/assets` as the formal route.
- Keep `ASSETS` in the managed header navigation immediately after `WORKBENCH`.
- Preserve `/assets-preview` only while it remains useful for visual review, otherwise remove it.

## Security And Access

The formal page uses read-only Local API calls. When the current user is passed to Local API, calls use `overrideAccess: false`.

Current rules:

- Current-user model reads must pass the user and `overrideAccess: false`.
- Current-user favorites and follows must pass the user and `overrideAccess: false`.
- Creator pages must show public creator profiles only.
- Followed-feed assets must include only public models from creators the current user still follows.

For later production mutation work:

- Visibility changes must remain owner-or-staff scoped.
- Delete or archive must be implemented as a dedicated account endpoint, not direct browser writes to Payload REST.

## Testing Strategy

Current checks:

- Assert the route uses the single `LineFrame` shell and direct `InspirationGridCard` calls, includes the four view modes, uses real DTO helper on `/assets`, and keeps preview mutations local.
- Run TypeScript.
- Run targeted unit tests.
- Start the dev server and verify `/assets` and `/assets-preview` in browser at desktop and mobile widths.
- Capture screenshots for review.

Later production phases:

- Add service tests for current-user assets, favorites, followed feed, and creator assets.
- Add endpoint tests for visibility, favorite removal, follow/unfollow, and model deletion or archive.
- Add browser checks for avatar-to-creator navigation, follow filtering, and menu actions.
