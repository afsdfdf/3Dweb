'use client'

import { createClient } from '@supabase/supabase-js'

import { supabaseBrowserEnv } from './browser-env'

let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(supabaseBrowserEnv.url, supabaseBrowserEnv.anonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  }

  return browserClient
}
