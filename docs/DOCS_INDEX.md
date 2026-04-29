# Documentation Index

## Purpose

This is the curated entry point for current project documentation.

Root `docs/` contains evergreen documents only. Dated reports, rollout checklists, temporary plans, and worklogs belong in `docs/archive/`.

## Start Here

- [AI_PROJECT_MEMORY.md](/D:/web/payload-local-demo/docs/AI_PROJECT_MEMORY.md) - current AI-readable architecture memory and guardrails
- [DEVELOPMENT_GUIDE.md](/D:/web/payload-local-demo/docs/DEVELOPMENT_GUIDE.md) - day-to-day engineering workflow
- [ARCHITECTURE_BLUEPRINT.md](/D:/web/payload-local-demo/docs/ARCHITECTURE_BLUEPRINT.md) - product surface and domain map
- [AI_PRODUCT_FRAMEWORK_GUIDE.md](/D:/web/payload-local-demo/docs/AI_PRODUCT_FRAMEWORK_GUIDE.md) - product framework and integration boundaries
- [COLLECTIONS_REFERENCE.md](/D:/web/payload-local-demo/docs/COLLECTIONS_REFERENCE.md) - active Payload collection map for development
- [UI_MIGRATION_PLAN.md](/D:/web/payload-local-demo/docs/UI_MIGRATION_PLAN.md) - UI lab migration plan and review checklist
- [BACKEND_UI_DEVELOPMENT_MEMO.md](/D:/web/payload-local-demo/docs/BACKEND_UI_DEVELOPMENT_MEMO.md) - backend-owned UI slots and formal frontend wiring memo
- [PROJECT_AUDIT_MEMO.md](/D:/web/payload-local-demo/docs/PROJECT_AUDIT_MEMO.md) - current multi-dimensional project audit findings and backlog

## Database And Infrastructure

- [DATABASE_TABLE_REFERENCE.md](/D:/web/payload-local-demo/docs/DATABASE_TABLE_REFERENCE.md) - active table/domain reference
- [DATABASE_MIGRATION_STANDARD.md](/D:/web/payload-local-demo/docs/DATABASE_MIGRATION_STANDARD.md) - formal migration policy

## Archive

- [archive/2026](/D:/web/payload-local-demo/docs/archive/2026)

Archived documents are historical context only. If an archived document contains guidance that future work must follow, move that guidance into an evergreen document or `AI_PROJECT_MEMORY.md`.

Legacy AWS RDS setup notes were moved to `docs/archive/2026/AWS_RDS_SETUP_LEGACY.md`; current deployment work should follow the Supabase/Postgres notes in the active database documents.

## Maintenance Policy

- Keep root docs current and concise.
- Do not add new dated reports to root `docs/`.
- Prefer updating these evergreen docs over creating duplicate planning documents.
- Keep `AI_PROJECT_MEMORY.md` synchronized after backend, content, admin, routing, media, or database changes.
