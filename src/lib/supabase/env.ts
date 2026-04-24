const required = (name: string) => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export const supabaseEnv = {
  get anonKey() {
    return required('SUPABASE_ANON_KEY')
  },
  get serviceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY')
  },
  get url() {
    return required('SUPABASE_URL')
  },
}
