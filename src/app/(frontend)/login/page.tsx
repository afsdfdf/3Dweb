import { redirect } from 'next/navigation'

const safeRedirect = (value?: null | string) => {
  if (!value || typeof value !== 'string') return '/dashboard/tasks'
  return value.startsWith('/') ? value : '/dashboard/tasks'
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
