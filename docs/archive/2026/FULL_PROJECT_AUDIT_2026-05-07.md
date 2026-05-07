# Full Project Audit - 2026-05-07

## Purpose

This report records the 2026-05-07 full-project audit and cleanup pass for `payload-local-demo`.

Scope:

- Formal frontend pages and route health.
- Payload collections, globals, hooks, endpoints, and backend services.
- Security rules from `AGENTS.md` and `docs/AI_PROJECT_MEMORY.md`.
- Source-language consistency and mojibake checks.
- Code quality, stale files, unrelated files, and cleanup candidates.
- TEST navigation page coverage.
- Verification results and Git outcome.

## Execution Checklist

| Step | Status | Result |
|---|---|---|
| Break down work into auditable subtasks | Done | Frontend, backend/security, file cleanup, TEST navigation, docs, validation, and Git decision were tracked separately. |
| Inventory formal pages and route status | Done | Route inventory recorded below and mirrored in `/test`. |
| Audit small frontend bugs and language issues | Done | Narrow fixes applied where behavior was clear and verifiable. |
| Audit backend/Payload security patterns | Done | P1 permission-design findings recorded for owner discussion instead of speculative large rewrites. |
| Correlate cleanup candidates before deletion | Done | Only confirmed stale files were removed; sensitive, media, AI memory, generated, and uncertain assets were retained. |
| Rebuild TEST page as a navigation map | Done | `/test` now lists current pages with descriptions and remains production-blocked. |
| Write owner/operator manual | Done | Created `docs/PROJECT_USER_MANUAL.md`; a desktop copy is produced from the same source. |
| Run validation | Done | Source-language audit, TypeScript, unit tests, generated types/schema, smoke tests, and local HTTP checks passed. |
| Commit/push decision | Held | No commit/push because P1 issues require owner discussion under the user's rule for major issues. |

## Guardrails Used

- Do not delete AI memory documents.
- Do not delete files without reference and impact checks.
- Fix narrow P2/P3 bugs when the behavior is clear and verifiable.
- Record P0/P1 or permission-model changes for owner discussion before implementation.
- Run Payload type/schema generation when schema-facing changes are present in the working tree.

## Baseline Git State

- Branch: `codex/model-viewer-display-base`
- The worktree already contained uncommitted bundle, media, auth, generated schema, and test changes before this audit began.
- This pass preserved those existing changes and added only scoped audit, route-map, cleanup, and small bug fixes.

## Route Inventory

### Formal Frontend Pages

| Route | Status | Purpose |
|---|---|---|
| `/` | Formal | Public homepage with managed rails, bundle shelf, and inspiration grid. |
| `/about` | Formal | Product background and direction page. |
| `/contact` | Formal | Contact and support entry. |
| `/developers` | Formal | Developer-facing API and product boundary page. |
| `/features` | Formal | Product feature marketing page. |
| `/pricing` | Formal | Subscription, credits, and checkout entry page. |
| `/resources` | Formal | Resource and delivery education page. |
| `/solutions` | Formal | Scenario marketing page. |
| `/showcase` | Formal | Public model showcase listing. |
| `/showcase/[id]` | Dynamic | Public model showcase detail. |
| `/bundles` | Formal | Public curated model-bundle listing. |
| `/bundles/[slug]` | Dynamic | Public model-bundle detail. |
| `/model-detail?id=<modelId>` | Dynamic, needs policy decision | Public model detail. Bad or missing IDs still need a dedicated behavior decision. |
| `/workbench` | Formal | Studio/Workbench for generation and model review. |
| `/workbench/history` | Protected | Signed-in Workbench history. |
| `/workbench/models/[id]` | Dynamic, needs finalization | Workbench model detail route; still has demo/static detail areas. |
| `/account` | Protected | Formal account center. |
| `/results/[taskCode]` | Dynamic | Generation task result page. |
| `/generate` | Redirect | Legacy generation entry redirected to Workbench. |
| `/login` | Redirect/modal compatibility | Auth compatibility entry. |
| `/register` | Redirect/modal compatibility | Auth compatibility entry. |
| `/forgot-password` | Redirect/modal compatibility | Auth compatibility entry. |
| `/reset-password` | Formal | Password reset page through account auth flow. |
| `/verify-email/[token]` | Dynamic | Email verification landing. |
| `/privacy-policy` | Formal | Legal policy. |
| `/refund-policy` | Formal | Legal policy. |
| `/shipping-policy` | Formal | Legal policy. |

### Local-Only Pages

| Route | Status | Decision |
|---|---|---|
| `/test` | Local only | Rebuilt as a lightweight route navigation page; production `notFound()`. |
| `/formal-components` | Local only | Kept for design/component review; production `notFound()`. |
| `/test-bundles` | Local only | Kept for bundle visual validation; production `notFound()`. |

### Payload And App Routes

| Route | Status | Purpose |
|---|---|---|
| `/admin/[[...segments]]` | Payload | Payload Admin. |
| `/api/[...slug]` | Payload | Payload REST catch-all. |
| `/api/access` | Payload | Payload access helper route. |
| `/api/graphql` | Payload | GraphQL endpoint. |
| `/api/graphql-playground` | Payload | GraphQL playground when enabled. |
| `/api/account/profile-media/upload-url` | App API | Account media upload bootstrap. |
| `/api/account/profile-media/complete` | App API | Account media completion and media row update. |
| `/api/media/upload-url` | App API | Workbench/source media upload bootstrap. |
| `/api/locale` | App API | Locale cookie helper; open redirect fixed in this pass. |

## Fixed In This Pass

| Area | Files | Change |
|---|---|---|
| TEST navigation | `src/app/(frontend)/test/page.tsx` | Replaced heavy component/API preview page with a simple page-link map and one-line descriptions. |
| Open redirect | `src/app/api/locale/route.ts` | Restricted `redirect` to same-origin relative paths and rejected absolute or protocol-relative external URLs. |
| HTML landmarks | `src/app/(frontend)/layout.tsx` | Removed wrapper `<main>` so pages do not render nested main landmarks. |
| Results progress | `src/app/(frontend)/results/[taskCode]/page.tsx` | Clamped task progress to 0-100 and rendered download buttons from actual model formats. |
| Public page resilience | `src/app/(frontend)/pricing/page.tsx`, `src/app/(frontend)/showcase/page.tsx` | Read-only list query failures now render empty states instead of public 500 pages. Database connectivity still needs operational attention when timeouts occur. |
| Reset-password tests | `tests/authModalProviderImport.test.ts` | Updated stale test expectations to match the shared `AuthFlowCard` reset flow. |
| English typo | `src/app/(frontend)/page.tsx`, `src/app/(frontend)/bundles/[slug]/page.tsx` | Fixed `INFOMATION` to `Information`. |
| Source language audit | `scripts/audit-source-language.mjs` | Removed stale exceptions for deleted/retired files. |

## Cleanup Completed

| Removed | Evidence | Risk |
|---|---|---|
| `src/app/(frontend)/_components/GenerateForm.tsx` | Only referenced by the old heavy `/test` page. `/generate` now redirects to `/workbench`. | Low |
| `src/components/ui-lab/personal-center-legacy/*` | Legacy route was removed; only a navigation test referenced it. `/account` uses `personal-center-test` as the formal account component. | Low-medium |
| `tsconfig.tsbuildinfo` | Ignored TypeScript cache; regenerated by TypeScript. | Low |

Not removed:

- `.codex-dev-server.err.log` and `.codex-dev-server.out.log`: ignored local logs, but the running dev server held file handles.
- `.env*` backups and Vercel local env files: likely sensitive and possibly useful for recovery/deployment. Leave for owner confirmation.
- `media/**`: ignored but may back local Payload/media records or source backups. Requires DB/media URL cross-check before deletion.
- `public/home-test-assets/**`, `public/ui-lab/**`, and `public/ui/**` partial assets: many are still used by formal UI-lab-derived pages. Delete only after visual regression checks.
- `shopifyGateway.ts`, `supabase/server.ts`, `nine-slice-frame.tsx`: no immediate runtime references found, but removal needs owner confirmation because they are integration/helper surfaces.
- `docs/archive/**`: historical docs are not runtime code and were retained.

## P0/P1 Findings For Discussion

### P1: Payload REST Direct Create Ownership

Some access helpers return `Where` constraints for non-staff users. That is safe for read/update filtering, but create access should be treated carefully because user-submitted `owner` or `user` fields can still be unsafe if not server-assigned.

Review:

- `src/access/index.ts`
- `src/collections/GenerationTasks.ts`
- `src/collections/Models.ts`
- `src/collections/PrintOrders.ts`

Recommended design:

- Add create-specific boolean access or before-change hooks that force `owner/user = req.user.id` for non-staff.
- Add REST regression tests for attempts to create records for another user.

### P1: Client-Controlled Identity And Visibility Fields

Several user-writable collections allow fields such as `owner`, `user`, `author`, `purpose`, or `publicAccess` to be supplied by clients. Business endpoints may be safe, but direct Payload REST writes should not trust those fields.

Review:

- `src/collections/Media.ts`
- `src/collections/ModelComments.ts`
- `src/collections/ModelLikes.ts`
- `src/collections/ModelFavorites.ts`
- `src/collections/TaskEvents.ts`
- `src/collections/Addresses.ts`

Recommended design:

- Server-assign current-user identity fields.
- Restrict `Media.publicAccess` and public/model purposes to staff or approved service flows.
- Add direct REST security tests.

### P1: Public Model Detail Fake Fallback

`/model-detail` still needs a product decision for missing or invalid IDs. Current code can fall back to static demo detail data, which is risky on a formal public route.

Recommended design:

- Missing/invalid model ID should `notFound()` or redirect to `/showcase`.
- Public creator data should show only when profile visibility and media guest-readability rules pass.

## P2/P3 Findings For Backlog

- Staff users viewing account center aggregate endpoints may receive broader data than normal customer self-scope if service queries rely on access helpers that return `true` for staff. Review `accountService`, `followService`, and `reactionService`.
- Profile media upload routes use direct SQL by design to avoid creating Payload upload records before the object exists. Review whether client-submitted `publicAccess` should be ignored or staff-only.
- `users.role` is used by RBAC checks. Consider `saveToJWT: true` if JWT role reads are required in more auth contexts. This is a schema-facing change and should be handled deliberately.
- `workbench/models/[id]` still has static/demo UI details and needs a focused finalization pass before it is treated as a complete formal customer route.
- A read-only DB timeout caused `/pricing` and `/showcase` to 500 before this pass. The page behavior is now resilient, but the underlying local DB connectivity should still be checked.

## Verification

Commands:

- `node scripts/audit-source-language.mjs` passed.
- `D:\web\payload-local-demo\node_modules\.bin\tsc.CMD --noEmit` passed.
- `node scripts/run-unit-tests.mjs` passed: 185 tests, 185 pass.
- `D:\web\payload-local-demo\node_modules\.bin\payload.CMD generate:types` passed.
- `D:\web\payload-local-demo\node_modules\.bin\payload.CMD generate:db-schema` passed.
- `node scripts/smoke-test.mjs` passed after the public page resilience fix.

Local HTTP checks:

- `/test` returned 200.
- `/bundles` returned 200.
- `/api/locale?locale=en&redirect=/test` redirected to `/test`.
- `/api/locale?locale=en&redirect=https://example.com` redirected to `/`.
- `/api/locale?locale=en&redirect=//example.com` redirected to `/`.

Notes:

- `pnpm` was not available in the shell PATH, so validation used local project binaries and node scripts.
- The running dev server still held local `.codex-dev-server.*.log` files, so they were left in place.

## Git Outcome

No commit or push was made in this pass because P1 security/design findings remain open and the user requested major issues wait for discussion before final remediation.
