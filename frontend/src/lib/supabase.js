import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[VCollab] Missing Supabase env vars. Copy .env.example to .env and fill in your project URL + anon key.'
    )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const COLLEGE_DOMAIN = '@vitbhopal.ac.in'

export function isValidCollegeEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@vitbhopal\.ac\.in$/.test(email.trim())
}
