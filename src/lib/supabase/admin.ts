import { createClient } from '@supabase/supabase-js'

import { supabaseEnv } from './env'

// Bound Supabase API calls so a hung request cannot stall a serverless
// function until the platform timeout. Storage uploads can be large, so the
// limit is generous but finite.
const SUPABASE_REQUEST_TIMEOUT_MS = Math.max(
  5_000,
  Number(process.env.SUPABASE_REQUEST_TIMEOUT_MS || 60_000),
)

const fetchWithTimeout: typeof fetch = (input, init) => {
  return fetch(input, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(SUPABASE_REQUEST_TIMEOUT_MS),
  })
}

export function getSupabaseAdminClient() {
  return createClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  })
}
