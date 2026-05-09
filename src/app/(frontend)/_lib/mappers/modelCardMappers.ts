export type PublicModelThumbnailCardVM = {
  authorAvatarUrl: null | string
  authorName: string
  commentsCount: number
  createdLabel: string
  formats: string[]
  href: string
  id: number
  likesCount: number
  summary: string
  thumbnailUrl: null | string
  title: string
  viewsCount: number | string
}

const demoAuthors = ['Greenwood', 'Xingmu', 'Ashen Vale', 'Moonforge', 'Rook'] as const
const demoViews = ['320', '1,2k', '2,3k', '980', '560'] as const
const demoLikes = [32, 56, 88, 120, 267] as const
const demoComments = [12, 24, 56, 88, 267] as const
const demoDates = ['6 Days ago', '2 Days ago', 'Yesterday', '1 Week ago', 'Recently'] as const

function getIndex(seed: string, modulo: number) {
  let hash = 0

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647
  }

  return Math.abs(hash) % modulo
}

export function mapModelToPublicModelThumbnailCardVM(model: {
  authorAvatarUrl?: null | string
  authorName?: null | string
  formats: string[]
  id: number
  owner?: null | {
    avatarUrl?: null | string
    displayName?: null | string
    email?: null | string
    fullName?: null | string
    name?: null | string
  }
  previewURL: null | string
  summary: string
  title: string
}): PublicModelThumbnailCardVM {
  const seed = `${model.id}-${model.title}`
  const index = getIndex(seed, demoAuthors.length)
  const ownerName =
    model.authorName ||
    model.owner?.displayName ||
    model.owner?.fullName ||
    model.owner?.name ||
    model.owner?.email?.split('@')[0] ||
    demoAuthors[index]
  const ownerAvatarUrl = model.authorAvatarUrl ?? model.owner?.avatarUrl ?? null

  return {
    authorAvatarUrl: ownerAvatarUrl,
    authorName: ownerName,
    commentsCount: demoComments[index],
    createdLabel: demoDates[index],
    formats: model.formats,
    href: `/model-detail?id=${encodeURIComponent(String(model.id))}`,
    id: model.id,
    likesCount: demoLikes[index],
    summary: model.summary,
    thumbnailUrl: model.previewURL,
    title: model.title,
    viewsCount: demoViews[index],
  }
}
