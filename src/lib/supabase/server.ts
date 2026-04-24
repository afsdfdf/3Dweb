import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

import { supabaseEnv } from './env'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; options: Parameters<typeof cookieStore.set>[2]; value: string }>) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server components may not always allow cookie writes.
        }
      },
    },
  })
}
