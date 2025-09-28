import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY


if (!SUPABASE_URL) {
  console.error('VITE_SUPABASE_URL is not set in .env file')
  throw new Error('VITE_SUPABASE_URL is not set in .env file')
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY is not set in .env file')
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is not set in .env file')
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
