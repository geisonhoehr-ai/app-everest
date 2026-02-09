import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Get environment variables with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ||
                     import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
                     'https://hnhzindsfuqnaxosujay.supabase.co'

const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ||
                                import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaHppbmRzZnVxbmF4b3N1amF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzU5NTIsImV4cCI6MjA2ODUxMTk1Mn0.cT7fe1wjee9HfZw_IVD7K_exMqu-LtUxiClCD-sDLyU'

// Debug log
console.log('🔧 Supabase config:', {
  url: SUPABASE_URL?.substring(0, 30) + '...',
  hasKey: !!SUPABASE_PUBLISHABLE_KEY,
  storage: typeof window !== 'undefined' ? 'localStorage' : 'none',
  storageKey: 'everest-auth-token'
})

// Check if there's an existing session in localStorage
if (typeof window !== 'undefined') {
  const existingToken = localStorage.getItem('everest-auth-token')
  console.log('🔑 Existing auth token:', existingToken ? 'Found' : 'Not found')
}

// Create client with error handling and better timeout configuration
let supabase: ReturnType<typeof createClient<Database>>

try {
  supabase = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        storageKey: 'everest-auth-token',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: false
      },
      global: {
        headers: {
          'X-Client-Info': 'everest-app'
        },
        fetch: (url, options = {}) => {
          // Create timeout with better browser compatibility
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          return fetch(url, {
            ...options,
            signal: controller.signal
          }).finally(() => {
            clearTimeout(timeoutId)
          })
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    },
  )
} catch (error) {
  console.error('Failed to create Supabase client:', error)
  // Create a mock client that doesn't break the app
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  } as any
}

export { supabase }
