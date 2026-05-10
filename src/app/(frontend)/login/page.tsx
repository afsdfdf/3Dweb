import { redirect } from 'next/navigation'

import { getSafeInternalRedirect } from '@/lib/safeRedirect'

const safeRedirect = (value?: null | string) => {
  return getSafeInternalRedirect(value, '/account?section=tasks')
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
