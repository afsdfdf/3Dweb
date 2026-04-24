import { createClient } from '@supabase/supabase-js'

import { supabaseEnv } from './env'

export function getSupabaseAdminClient() {
  return createClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
