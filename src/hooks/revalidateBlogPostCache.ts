import { createRequire } from 'node:module'

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

const require = createRequire(import.meta.url)

type RevalidatePath = (originalPath: string, type?: 'layout' | 'page') => void

type BlogPostLike = {
  slug?: unknown
}

function getPostSlug(doc: unknown) {
  const slug = (doc as BlogPostLike | null)?.slug
  return typeof slug === 'string' && slug.trim() ? slug.trim() : null
}

function getRevalidatePath() {
  try {
    return (require('next/cache') as { revalidatePath?: RevalidatePath }).revalidatePath || null
  } catch {
    return null
  }
}

function revalidateBlogPostPaths(...slugs: Array<null | string>) {
  const revalidatePath = getRevalidatePath()
  if (!revalidatePath) return

  const paths = new Set<string>(['/blog'])

  for (const slug of slugs) {
    if (slug) {
      paths.add(`/blog/${encodeURIComponent(slug)}`)
    }
  }

  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch {
      // Next cache revalidation is available during route-handler requests, not during every script/test context.
    }
  }
}

export const revalidateBlogPostCacheAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  revalidateBlogPostPaths(getPostSlug(doc), getPostSlug(previousDoc))
  return doc
}

export const revalidateBlogPostCacheAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  revalidateBlogPostPaths(getPostSlug(doc))
  return doc
}
