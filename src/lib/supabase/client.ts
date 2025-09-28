import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY


if (!SUPABASE_URL) {
  console.error('Supabase URL is not set in environment variables')
  throw new Error('Supabase URL is not set in environment variables')
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error('Supabase ANON KEY is not set in environment variables')
  throw new Error('Supabase ANON KEY is not set in environment variables')
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
