import { NextRequest, NextResponse } from 'next/server'

import { localeCookieName, normalizeLocale } from '@/app/(frontend)/_lib/locale'

function getSafeRedirectPath(value: null | string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }

  return value
}

export async function GET(request: NextRequest) {
  const locale = normalizeLocale(request.nextUrl.searchParams.get('locale'))
  const redirect = getSafeRedirectPath(request.nextUrl.searchParams.get('redirect'))
  const response = NextResponse.redirect(new URL(redirect, request.url))

  response.cookies.set(localeCookieName, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })

  return response
}
