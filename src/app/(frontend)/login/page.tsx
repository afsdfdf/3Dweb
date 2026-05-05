import { redirect } from 'next/navigation'

const safeRedirect = (value?: null | string) => {
  if (!value || typeof value !== 'string') return '/account?section=tasks'
  return value.startsWith('/') ? value : '/account?section=tasks'
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const query = await searchParams
  const redirectTo = encodeURIComponent(safeRedirect(query.redirect))

  redirect(`/?auth=login&redirect=${redirectTo}`)
}
