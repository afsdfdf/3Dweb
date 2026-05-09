# Blog Admin Publishing Implementation Plan

## Purpose

This is the durable implementation checklist for adding the public Thorns Tavern blog surface. It exists so work can resume safely after context compaction.

## Product Decision

- Do not create a duplicate `blog-posts` collection.
- Reuse the registered `posts` collection.
- Public routes are `/blog` and `/blog/[slug]`.
- Public product label is `Tavern Journal`.
- Admins and operators publish from Payload Admin `Posts`.

## Non-Negotiable Boundaries

- Do not add `src/app/api/posts`, `src/app/api/blog`, or any route that shadows Payload REST.
- Do not use `overrideAccess: true` in public blog frontend reads.
- Public guests can only see posts where `_status = published`, `isVisible = true`, and `publishedAt` is missing or not in the future.
- Published visible posts with `coverImage` must use guest-readable media: `purpose = preview` or `publicAccess = true`.
- Rich text must be rendered from Lexical data, not with `dangerouslySetInnerHTML`.
- No new schema fields in MVP. If schema fields are added later, run DB schema generation, types generation, and migrations.

## Phase 1 MVP Scope

Status as of 2026-05-09:

- Phase 1 MVP is implemented.
- No schema fields were added, so no database migration or Payload type regeneration was required.
- Browser checks passed for the empty-state route matrix because the local database currently has no public posts.
- Future work should start from Deferred Phase 2 unless a regression is found.

### Task 1: Inspect Current Posts Surface - Done

Files:

- `src/collections/Posts.ts`
- `src/payload.config.ts`
- `src/payload-types.ts`
- existing media/url helpers under `src/app/(frontend)/_lib`

Expected behavior:

- Confirm `posts` is registered.
- Confirm staff-only create/update/delete.
- Confirm existing fields support blog MVP.

Validation:

- Static inspection.

### Task 2: Harden Posts Public Read Access - Done

Files:

- `src/collections/Posts.ts`

Expected behavior:

- Staff can read all posts.
- Guests can only read published, visible, non-future posts.
- Local API public reads use `overrideAccess: false`.

Validation:

- TypeScript.
- Browser list/detail checks for visible content.
- If test fixtures exist, add or update tests for draft/hidden/future filtering.

### Task 3: Validate Public Cover Media - Done

Files:

- `src/hooks/validatePostCoverImage.ts`
- `src/collections/Posts.ts`

Expected behavior:

- When a post is published and visible, a configured `coverImage` must be guest-readable.
- The hook must not silently make private media public.
- Nested Payload operations pass `req`.

Validation:

- TypeScript.
- Unit or integration coverage if existing test harness can exercise hooks.

### Task 4: Add Blog Data Adapter - Done

Files:

- `src/app/(frontend)/blog/_lib/blogTypes.ts`
- `src/app/(frontend)/blog/_lib/blogData.ts`
- `src/app/(frontend)/blog/_lib/blogSeo.ts`

Expected behavior:

- `getBlogListData` supports `category`, `page`, and `q`.
- `getBlogPostBySlug` returns null for missing, hidden, draft, or future posts.
- `getRelatedBlogPosts` returns a small set of public related posts.
- Cover URLs are normalized safely and fall back to a branded placeholder state when missing.
- Reading time is estimated from Lexical text.

Validation:

- `pnpm exec tsc --noEmit`.
- Source language audit.

### Task 5: Add Blog UI Components - Done

Files:

- `src/app/(frontend)/blog/_components/BlogHero.tsx`
- `src/app/(frontend)/blog/_components/BlogCategoryTabs.tsx`
- `src/app/(frontend)/blog/_components/FeaturedPostCard.tsx`
- `src/app/(frontend)/blog/_components/BlogPostCard.tsx`
- `src/app/(frontend)/blog/_components/BlogPagination.tsx`
- `src/app/(frontend)/blog/_components/BlogEmptyState.tsx`
- `src/app/(frontend)/blog/_components/BlogArticleBody.tsx`
- `src/app/(frontend)/blog/_components/BlogRelatedPosts.tsx`
- `src/app/(frontend)/blog/_components/BlogCTA.tsx`
- route-local CSS modules as needed

Expected behavior:

- Dark gold Thorns Tavern visual direction.
- No white generic blog template.
- Desktop: hero, featured post, filters, grid, sidebar/CTA.
- Mobile: single column with no horizontal overflow.

Validation:

- Browser screenshots at 1440x1000, 1920x1080, 390x844, and 375x812.

### Task 6: Add `/blog` List Page - Done

Files:

- `src/app/(frontend)/blog/page.tsx`

Expected behavior:

- Server Component fetches user and blog data.
- Supports `/blog`, `/blog?category=article`, `/blog?category=event`, `/blog?category=announcement`, `/blog?q=...`, and `/blog?page=2`.
- Empty state is branded and links back to Workbench/showcase.
- Metadata exists for the list page.

Validation:

- HTTP 200 for list variants.
- No overflow or text overlap.

### Task 7: Add `/blog/[slug]` Detail Page - Done

Files:

- `src/app/(frontend)/blog/[slug]/page.tsx`

Expected behavior:

- Valid published visible slug renders article page.
- Missing/hidden/draft/future slug returns `notFound()`.
- Breadcrumb, article hero, cover, Lexical body, related posts, CTA, metadata, and Article JSON-LD exist.

Validation:

- HTTP 200 for valid slug when test data exists.
- HTTP 404 for `/blog/missing-post`.
- No overflow or text overlap.

### Task 8: Navigation And Footer - Done

Files:

- Prefer Payload Admin `site-settings` if runtime navigation is already consumed.
- If static helper is still active, update the shared navigation/footer helper only if needed.

Expected behavior:

- Main navigation uses `Blog`/`BLOG` for clarity and points to `/blog`; page-level branding can still use `Tavern Journal`.
- Do not break existing top navigation active states.

Validation:

- Browser check on `/blog`, `/about`, `/showcase`, and `/workbench`.

### Task 9: Documentation - Done

Files:

- `docs/AI_PROJECT_MEMORY.md`
- `docs/COLLECTIONS_REFERENCE.md` if access/hook behavior changes need durable collection documentation
- Desktop audit report if it has an active checklist item related to blog or UI work

Expected behavior:

- Durable route/access/media decisions are recorded.

Validation:

- Source language audit.

## Commands

Run for MVP:

```bash
pnpm exec tsc --noEmit
pnpm run audit:source-language
pnpm test:unit
```

Only if schema fields are added:

```bash
pnpm payload generate:db-schema
pnpm generate:types
pnpm exec tsc --noEmit
```

Only if admin component paths change:

```bash
pnpm generate:importmap
```

## Browser Verification Matrix

- `/blog`
- `/blog?category=article`
- `/blog?category=event`
- `/blog?category=announcement`
- `/blog?q=mesh`
- `/blog/missing-post`
- `/blog/<published-slug>` when real published data exists

Viewports:

- 1440x1000
- 1920x1080
- 390x844
- 375x812

Checks:

- No horizontal overflow.
- No text overlap.
- Empty state is intentional when no public posts exist.
- Cards and article body keep dark gold brand styling.

## Deferred Phase 2

- Add `seoTitle`, `seoDescription`, `tags`, `relatedModels`, `relatedBundles`.
- Add `BlogSettings` global for hero/sidebar/CTA copy.
- Add RSS and sitemap support.
- Add draft preview with staff auth and short-lived token.
