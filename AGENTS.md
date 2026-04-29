# Payload CMS Development Rules

You are an expert Payload CMS developer. When working with this project, follow the rules in this file first, then use the project docs for deeper context.

## Core Principles

1. TypeScript first: use TypeScript and Payload types.
2. Security critical: treat access control as a primary design concern.
3. Type generation: run `generate:types` after Payload schema changes.
4. Transaction safety: pass `req` to nested Payload operations inside hooks.
5. Local API safety: when passing `user` to Local API, also set `overrideAccess: false`.
6. RBAC safety: confirm roles exist before changing access-controlled collections or globals.
7. Admin components: regenerate the import map after creating or changing Payload admin component paths.

## Validation Commands

- TypeScript check: `pnpm exec tsc --noEmit`
- Generate Payload types: `pnpm generate:types`
- Generate Payload import map: `pnpm generate:importmap`
- Generate database schema snapshot: `pnpm payload generate:db-schema`
- Unit tests: `pnpm test:unit`
- Smoke tests: `pnpm test:smoke`

## Project Structure

```text
src/
  app/
    (frontend)/          # Frontend routes
    (payload)/           # Payload admin and REST routes
  collections/           # Collection configs
  globals/               # Global configs
  components/            # Custom React components
  hooks/                 # Hook functions
  access/                # Access control helpers
  endpoints/             # Payload custom endpoints
  lib/                   # Business services and shared backend helpers
  payload.config.ts      # Main Payload config
```

## Configuration Pattern

```typescript
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
})
```

## Collections

Use `CollectionConfig` and keep collections in separate files.

```typescript
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'createdAt'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true },
    { name: 'content', type: 'richText' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
  timestamps: true,
}
```

For auth collections, roles should be saved to JWT when access checks need them frequently.

```typescript
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      defaultValue: ['user'],
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => user?.roles?.includes('admin'),
      },
    },
  ],
}
```

## Field Patterns

```typescript
// Relationship with filtering
{
  name: 'category',
  type: 'relationship',
  relationTo: 'categories',
  filterOptions: { active: { equals: true } },
}

// Conditional field
{
  name: 'featuredImage',
  type: 'upload',
  relationTo: 'media',
  admin: {
    condition: (data) => data.featured === true,
  },
}

// Virtual field
{
  name: 'fullName',
  type: 'text',
  virtual: true,
  hooks: {
    afterRead: [({ siblingData }) => `${siblingData.firstName} ${siblingData.lastName}`],
  },
}
```

## Critical Security Patterns

### Local API Access Control

Local API bypasses access control by default. Passing `user` alone does not enforce access.

```typescript
// BAD: access control is bypassed
await payload.find({
  collection: 'posts',
  user: someUser,
})

// GOOD: user permissions are enforced
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false,
})

// OK: intentional admin operation
await payload.find({
  collection: 'posts',
})
```

Rule: when passing `user` to Local API, always set `overrideAccess: false`.

### Transaction Safety In Hooks

Nested Payload operations inside hooks must pass `req` so they participate in the same request/transaction context.

```typescript
// BAD: separate transaction/context
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
      })
    },
  ],
}

// GOOD: same request/transaction context
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req,
      })
    },
  ],
}
```

### Prevent Hook Loops

Use context flags when a hook can trigger the same hook again.

```typescript
hooks: {
  afterChange: [
    async ({ doc, req, context }) => {
      if (context.skipHooks) return

      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        context: { skipHooks: true },
        req,
      })
    },
  ],
}
```

## Access Control

Collection-level access can return a boolean or a query constraint.

```typescript
import type { Access } from 'payload'

export const anyone: Access = () => true

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const adminOnly: Access = ({ req: { user } }) => {
  return user?.roles?.includes('admin')
}

export const ownPostsOnly: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.roles?.includes('admin')) return true

  return {
    author: { equals: user.id },
  }
}
```

Field-level access can only return a boolean.

```typescript
{
  name: 'salary',
  type: 'number',
  access: {
    read: ({ req: { user }, doc }) => {
      if (user?.id === doc?.id) return true
      return user?.roles?.includes('admin')
    },
    update: ({ req: { user } }) => user?.roles?.includes('admin'),
  },
}
```

## Hooks

Use hooks for formatting, business rules, side effects, computed fields, and safe cascading operations.

```typescript
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    beforeValidate: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'update' && data.status === 'published') {
          data.publishedAt = new Date()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, context }) => {
        if (context.skipNotification) return doc
        if (operation === 'create') {
          await sendNotification(doc)
        }
        return doc
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        await req.payload.delete({
          collection: 'comments',
          where: { post: { equals: id } },
          req,
        })
      },
    ],
  },
}
```

## Queries

```typescript
const posts = await payload.find({
  collection: 'posts',
  where: {
    and: [
      { status: { equals: 'published' } },
      { 'author.name': { contains: 'john' } },
    ],
  },
  depth: 2,
  limit: 10,
  sort: '-createdAt',
  select: {
    title: true,
    author: true,
  },
})

const post = await payload.findByID({
  collection: 'posts',
  id: '123',
  depth: 2,
})
```

Common operators:

```typescript
{ status: { equals: 'published' } }
{ status: { not_equals: 'draft' } }
{ price: { greater_than: 100 } }
{ age: { less_than_equal: 65 } }
{ title: { contains: 'payload' } }
{ description: { like: 'cms headless' } }
{ category: { in: ['tech', 'news'] } }
{ image: { exists: true } }
```

## Getting A Payload Instance

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  const payload = await getPayload({ config })
  const posts = await payload.find({ collection: 'posts' })
  return Response.json(posts)
}
```

## Admin Components

Payload admin components are configured by file path. Paths are relative to the project root or `config.admin.importMap.baseDir`.

```typescript
export default buildConfig({
  admin: {
    components: {
      graphics: {
        Logo: '/components/Logo',
        Icon: '/components/Icon',
      },
      Nav: '/components/CustomNav',
      beforeNavLinks: ['/components/CustomNavItem'],
      afterNavLinks: ['/components/NavFooter'],
      header: ['/components/AnnouncementBanner'],
      actions: ['/components/ClearCache', '/components/Preview'],
      views: {
        dashboard: { Component: '/components/CustomDashboard' },
      },
    },
  },
})
```

Component categories:

1. Root components: global admin UI such as logo, nav, header.
2. Collection components: collection edit/list customization.
3. Global components: global document views.
4. Field components: custom field UI and cells.

Server components are the default. Client components need `'use client'`.

## Custom Endpoints

Always authenticate protected endpoints and use `req.payload` for database operations.

```typescript
import type { Endpoint } from 'payload'
import { APIError } from 'payload'

export const protectedEndpoint: Endpoint = {
  path: '/protected',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    const data = await req.payload.find({
      collection: 'posts',
      where: { author: { equals: req.user.id } },
      overrideAccess: false,
      user: req.user,
    })

    return Response.json(data)
  },
}
```

## Drafts And Versions

```typescript
export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
      validate: false,
    },
    maxPerDoc: 100,
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return { _status: { equals: 'published' } }
      return true
    },
  },
}
```

## Field Type Guards

Use Payload field guards when processing field arrays.

```typescript
import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsArrayType,
  fieldSupportsMany,
} from 'payload'

function processField(field: Field) {
  if (fieldAffectsData(field)) {
    console.log(field.name)
  }

  if (fieldHasSubFields(field)) {
    field.fields.forEach(processField)
  }

  if (fieldIsArrayType(field)) {
    console.log(field.minRows, field.maxRows)
  }

  if (fieldSupportsMany(field) && field.hasMany) {
    console.log('Multiple values supported')
  }
}
```

## Best Practices

### Security

1. Always set `overrideAccess: false` when passing `user` to Local API.
2. Field-level access returns boolean only.
3. Default to restrictive access and gradually add permissions.
4. Never trust client-provided data.
5. Use `saveToJWT: true` for roles needed in frequent checks.

### Performance

1. Index frequently queried fields.
2. Use `select` to limit returned fields.
3. Set relationship `depth` intentionally.
4. Prefer query constraints over expensive async access checks.
5. Cache expensive request-scoped work in `req.context` when appropriate.

### Data Integrity

1. Pass `req` to nested operations in hooks.
2. Use context flags to prevent recursive hooks.
3. Use `beforeValidate` for data formatting.
4. Use `beforeChange` for business rules.
5. Keep ledger, billing, and webhook mutations idempotent.

### Type Safety

1. Run `generate:types` after schema changes.
2. Import generated types from `src/payload-types.ts`.
3. Use `as const` for field option values when useful.
4. Use Payload field type guards for runtime field processing.

### Organization

1. Keep collections in separate files.
2. Extract reusable access control to `src/access/`.
3. Extract reusable hooks to `src/hooks/`.
4. Use helper factories for repeated field patterns.
5. Document complex access decisions in concise English comments.

## Common Gotchas

1. Local API bypasses access unless `overrideAccess: false` is set.
2. Missing `req` in nested hook operations breaks transaction/request context.
3. Hook operations can trigger the same hook again.
4. Field access cannot return query constraints.
5. Relationship depth can over-fetch unless controlled.
6. Draft-enabled collections get an automatic `_status` field.
7. Generated types are stale until `generate:types` runs.
8. Database schema changes need formal migrations.
9. Custom Next route handlers must not shadow Payload REST collection paths.
10. Do not add tracking or analytics code unless the user explicitly requests it.

## Project Documentation

Start with these files:

- `docs/AI_PROJECT_MEMORY.md`
- `docs/DOCS_INDEX.md`
- `docs/DEVELOPMENT_GUIDE.md`
- `docs/ARCHITECTURE_BLUEPRINT.md`
- `docs/COLLECTIONS_REFERENCE.md`
- `docs/BACKEND_UI_DEVELOPMENT_MEMO.md`
- `docs/PROJECT_AUDIT_MEMO.md`

## Payload Resources

- Docs: https://payloadcms.com/docs
- LLM context: https://payloadcms.com/llms-full.txt
- GitHub: https://github.com/payloadcms/payload
- Examples: https://github.com/payloadcms/payload/tree/main/examples
- Templates: https://github.com/payloadcms/payload/tree/main/templates
