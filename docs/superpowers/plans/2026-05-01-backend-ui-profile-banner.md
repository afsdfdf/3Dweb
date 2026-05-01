# Backend UI Profile Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the backend-owned profile media, avatar frame catalog, homepage badge fields, and model access policy settings without reintroducing AWS/S3 runtime storage.

**Architecture:** Keep Payload as the business-data owner and Supabase Storage as the object-storage boundary. Preserve the existing `users.profileBackground` field for compatibility while exposing it as a creator/profile banner in service DTOs.

**Tech Stack:** Payload CMS, Next.js route handlers, Supabase Storage SDK, Postgres migrations.

---

### Task 1: Schema Surface

**Files:**
- Modify: `src/collections/Media.ts`
- Modify: `src/collections/Users.ts`
- Create: `src/collections/AvatarFrameStyles.ts`
- Modify: `src/collections/HomepageItems.ts`
- Modify: `src/globals/SiteSettings.ts`
- Modify: `src/payload.config.ts`

- [x] Add `avatar` and `profile-banner` media purposes.
- [x] Add user profile banner focal point fields while keeping `profileBackground`.
- [x] Register `avatar-frame-styles` for admin-managed frame metadata.
- [x] Add homepage badge/ribbon/CTA/alt fields to `homepage-items`.
- [x] Add disabled-by-default preview/download credit policy settings.

### Task 2: Safe Public DTOs And Upload Helper

**Files:**
- Modify: `src/lib/accountService.ts`
- Modify: `src/lib/modelDetailService.ts`
- Create: `src/app/api/account/profile-media/upload-url/route.ts`

- [x] Return `profileBanner`, `profileBannerUrl`, and focal values while keeping `backgroundUrl`.
- [x] Stop leaking private profile media in public creator/model-detail DTOs.
- [x] Add a non-shadowing Supabase signed upload route for avatar/profile-banner media.

### Task 3: Migration, Types, Docs

**Files:**
- Create: `src/migrations/20260501_010000_backend_ui_profile_banner.ts`
- Modify: `src/migrations/index.ts`
- Modify: `docs/AI_PROJECT_MEMORY.md`
- Modify: `docs/BACKEND_UI_DEVELOPMENT_MEMO.md`

- [x] Add formal migration for new columns/table/enum values.
- [x] Generate Payload types and database schema snapshot.
- [x] Update backend memory and memo to state Supabase Storage only and creator banner semantics.

### Task 4: Verification

- [x] Run `pnpm generate:types`.
- [x] Run `pnpm payload generate:db-schema`.
- [x] Run `pnpm exec tsc --noEmit`.
