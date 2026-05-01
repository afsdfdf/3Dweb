# Meshy 3D Unified Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a backend-driven Meshy 3D generation flow where Workbench submits one neutral request and Payload decides text, image, or multi-image generation while preserving tags, visibility, model metadata, credits, and Supabase Storage ingestion.

**Architecture:** The frontend sends prompt, uploaded source image assets, requested title, visibility, tags, and basic output settings to `/api/studio/ai/tasks`. Payload owns Meshy credentials, model selection, texture settings, request routing, provider sync, result ingestion, and final `models` creation. Meshy API keys can be managed from the Payload admin global while environment variables remain the safer default and fallback.

**Tech Stack:** Next.js 16, Payload CMS 3, TypeScript, Meshy OpenAPI, Supabase Storage, Postgres, existing credit/task/model collections.

---

## Official API Notes

- Meshy Text to 3D v2 is a two-step preview/refine workflow on `POST /openapi/v2/text-to-3d`.
- Meshy Image to 3D uses `POST /openapi/v1/image-to-3d`.
- Meshy Multi Image to 3D uses `POST /openapi/v1/multi-image-to-3d` and accepts 1-4 image URLs.
- Current official model values are `latest`, `meshy-6`, and `meshy-5`; use `latest` as the project default.
- Meshy pricing is not fully uniform. Meshy-6/low-poly and textured tasks cost more than other models; image and multi-image with texture are priced similarly, while text-to-3D charges preview plus refine texture.

## File Structure

- Modify `src/globals/AIProviderSettings.ts`: add admin-managed Meshy key mode/key fields and richer Meshy generation defaults.
- Modify `src/lib/meshyGateway.ts`: support admin key resolution, Meshy latest defaults, request parameter mapping, and multi-image task create/retrieve.
- Modify `src/lib/aiTaskFlow.ts`: infer Meshy flow from source image count and prompt, pass official parameters, persist requested metadata, create final model attributes, and sync multi-image tasks.
- Modify `src/app/(frontend)/workbench/WorkbenchClient.tsx`: submit unified 3D payload with all source images, tags, title, visibility, and official-style settings while keeping frontend provider-agnostic.
- Modify `src/app/(frontend)/workbench/WorkbenchLeftGenerationPanel.tsx`: make multi-view source upload reflect the official 1-4 image limit.
- Modify `src/app/(frontend)/_lib/workbenchDraft.ts`: allow up to 4 official Meshy source images and keep JPEG/PNG only.
- Modify `docs/AI_PROJECT_MEMORY.md`: record the durable Meshy backend ownership rule.
- Tests: add/update unit coverage around Meshy routing, metadata persistence, and gateway request bodies.

## Task 1: Meshy Admin Settings

**Files:**
- Modify: `src/globals/AIProviderSettings.ts`
- Test: generated Payload types/schema after schema update

- [ ] Add `apiKeyMode`, `apiKey`, `hdTexture`, `multiImageEnabled`, `modelType`, `topology`, `targetPolycount`, and `targetFormats` to the `meshy` global group.
- [ ] Keep `defaultValue: 'latest'` for text/image model fields.
- [ ] Mark the admin API key field with a clear description that environment variables remain safer.
- [ ] Run `pnpm generate:types`.
- [ ] Run `pnpm payload generate:db-schema`.

## Task 2: Meshy Gateway Official Adapter

**Files:**
- Modify: `src/lib/meshyGateway.ts`

- [ ] Extend `MeshySettings` with admin key source, HD texture, model type, topology, target polycount, multi-image toggle, and default target formats.
- [ ] Resolve API key as Payload key when `apiKeyMode = payload`, otherwise environment first.
- [ ] Add official request parameters to text preview/refine and image create bodies.
- [ ] Add `createMeshyMultiImageTask` and `retrieveMeshyMultiImageTask` for `/openapi/v1/multi-image-to-3d`.
- [ ] Keep all provider calls server-side only.

## Task 3: Unified AI Task Routing

**Files:**
- Modify: `src/lib/aiTaskFlow.ts`
- Modify: `src/endpoints/aiTasks.ts` if endpoint input normalization needs tightening

- [ ] Infer flow from `sourceImageAssets.length`, `sourceImage`, and `prompt`.
- [ ] Use Text to 3D when no image is provided.
- [ ] Use Image to 3D when one image is provided.
- [ ] Use Multi Image to 3D when 2-4 images are provided and admin setting allows it.
- [ ] Store all source image asset metadata in `parameterSnapshot.sourceImageAssets`.
- [ ] Store requested title, tags, visibility, output format, and Meshy settings snapshot.
- [ ] On success, create/update `models` with title, tags, visibility, source task, formats, thumbnail, and owner.

## Task 4: Workbench Frontend Neutral Submission

**Files:**
- Modify: `src/app/(frontend)/workbench/WorkbenchClient.tsx`
- Modify: `src/app/(frontend)/workbench/WorkbenchLeftGenerationPanel.tsx`
- Modify: `src/app/(frontend)/_lib/workbenchDraft.ts`

- [ ] Upload all selected source images before task submission.
- [ ] Send `sourceImageAssets` array instead of relying on only the first image.
- [ ] Keep the request provider-neutral from the user's perspective.
- [ ] Enforce Meshy official multi-image count of 1-4 images.
- [ ] Preserve tags, requested title, and public/private choice in the request snapshot.

## Task 5: Tests And Verification

**Files:**
- Add or modify focused tests under `tests/`

- [ ] Add gateway tests for text, image, and multi-image request bodies.
- [ ] Add task-flow tests for routing decisions and final model metadata.
- [ ] Run `pnpm exec tsc --noEmit`.
- [ ] Run `pnpm test:unit`.
- [ ] Run `pnpm run build` if typecheck and unit tests pass.

## Task 6: Memory And Operations

**Files:**
- Modify: `docs/AI_PROJECT_MEMORY.md`

- [ ] Record that Meshy provider configuration is backend-owned.
- [ ] Record that Workbench frontend must submit neutral task intent and must not expose Meshy keys.
- [ ] Record that generated Meshy assets must be ingested into Supabase Storage before model delivery.

## Execution Checkpoints

- Checkpoint A after Tasks 1-2: schema and gateway compile.
- Checkpoint B after Tasks 3-4: frontend can submit all intended request shapes.
- Checkpoint C after Task 5: tests and build pass.
- Checkpoint D after Task 6: memory updated and final summary prepared.
