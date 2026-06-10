# Assets Preview UI Design

## Purpose

Build a UI-only preview page for the future asset center. The first page is a static, interactive prototype that matches the provided references closely enough to review layout, card states, and tab behavior before connecting production data and mutations.

## Scope

The first implementation creates `/assets-preview`.

It does:

- Render the top navigation with `ASSETS` active.
- Render a profile banner using the same visual language as the homepage third frame.
- Render asset tabs for `My Assets`, `My Collections`, `My Follows`, and a simulated creator profile state.
- Render a dense grid of model cards with the existing dark frame/card visual language.
- Support UI-only interactions for permission menu state, favorite removal, follow/unfollow filtering, and creator profile switching.

It does not:

- Mutate Payload records.
- Delete real models.
- Change real model visibility.
- Create new collections or globals.
- Add a production `/assets` route.

## Recommended Route

Use `/assets-preview` rather than `/assets` or `/test-assets`.

Reasons:

- It is clearly a preview surface, not production functionality.
- It avoids resurrecting the old removed `/test-*` route style.
- It lets the final `/assets` route be introduced later with real data and access rules.

## Visual Structure

The page uses the current public page chrome:

- `TopNavigation` with `ASSETS` as the active id.
- Current user data from the normal nav-user helper where available, with mock fallback data.
- Existing footer component.

The main panel uses `BorderComboFrame2`, matching the homepage third frame family. The inner body has:

- A profile header strip with avatar, display name, short bio, follower/model stats, a right-side banner image, and optional follow button.
- A tab row below the profile strip.
- Search, pager, and page-size controls in the same row style shown in the references.
- A two-row desktop grid of six columns at wide widths, then responsive fallbacks at narrower widths.

## Asset Card Design

Create a focused preview-only card component for the assets page instead of modifying `InspirationGridCard` directly.

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

## Data Model For Mock UI

The preview page owns static mock data in a local module or in the page component. The shape should mirror future production DTOs:

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

The first implementation can use existing public UI assets and model preview images already present in the repository. It must not depend on files from the user's Downloads folder.

## Future Backend Plan

Phase 1, UI preview:

- `/assets-preview` route.
- Mock data.
- Local-only interaction state.
- Browser visual verification.

Phase 2, read-only real data:

- Add a server data helper for asset-center DTOs.
- My Assets reads access-controlled current-user models.
- My Collections uses existing `/api/account/favorites` service or equivalent server helper.
- My Follows reads current follows and then public models from followed creators.
- Creator Assets uses existing creator profile read path.

Phase 3, safe mutations:

- Visibility uses existing `/api/account/models/:modelId/visibility`.
- Favorite removal uses existing `/api/social/models/:modelId/favorite` with `DELETE`.
- Follow/unfollow uses existing `/api/creators/:userId/follow`.
- Delete requires a new account-owned model delete endpoint or archive endpoint with owner checks, origin checks, rate limits, and relation cleanup policy.

Phase 4, production route:

- Promote to `/assets` after real data and mutation safety are verified.
- Add `ASSETS` to managed header navigation when product owners approve the permanent nav slot.
- Preserve `/assets-preview` only if it remains useful for visual review, otherwise remove it.

## Security And Access

The preview page must not bypass backend access rules because it does not perform backend reads or writes.

For later production work:

- Current-user model reads must pass the user and `overrideAccess: false`.
- Creator pages must show public creator profiles only.
- Followed-feed assets must include only public models from creators the current user still follows.
- Visibility changes must remain owner-or-staff scoped.
- Delete or archive must be implemented as a dedicated account endpoint, not direct browser writes to Payload REST.

## Testing Strategy

First UI-only page:

- Add focused source tests that assert the preview route exists, uses `BorderComboFrame2`, includes the four view modes, and keeps preview mutations local.
- Run TypeScript.
- Run targeted unit tests.
- Start the dev server and verify `/assets-preview` in browser at desktop and mobile widths.
- Capture screenshots for review.

Later production phases:

- Add service tests for current-user assets, favorites, followed feed, and creator assets.
- Add endpoint tests for visibility, favorite removal, follow/unfollow, and model deletion or archive.
- Add browser checks for avatar-to-creator navigation, follow filtering, and menu actions.
