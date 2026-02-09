import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Simplified UserProfile interface
export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'student' | 'teacher' | 'administrator'
  is_active: boolean
  created_at: string
  updated_at: string
  avatar_url?: string
  bio?: string
  // Optional extended data
  student_id_number?: string
  employee_id_number?: string
  department?: string
  enrollment_date?: string
  hire_date?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  loading: boolean
  profileFetchAttempted: boolean
  refreshProfile: () => Promise<void>
  getRedirectPath: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Simple hook with better error handling - used internally by enhanced hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Centralized profile fetching with automatic profile creation
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('🔍 Fetching profile for user:', userId)

    // First try to fetch existing profile (timeout: 10s is enough)
    const { data: existingProfile, error: fetchError } = await Promise.race([
      supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          is_active,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .single(),
      new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      )
    ])

    // If profile exists, return it
    if (!fetchError && existingProfile) {
      console.log('✅ Profile fetched successfully:', existingProfile.email)
      return existingProfile
    }

    // If profile doesn't exist (PGRST116 = no rows returned), try to create one
    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('📝 Profile not found, attempting to create from auth data...')

      // Get user data from Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('❌ Could not get user data for profile creation:', userError)
        return null
      }

      // Create a basic profile
      const newProfile = {
        id: userId,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: 'student' as const, // Default role
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Try to insert the profile
      const { data: createdProfile, error: createError } = await supabase
        .from('users')
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create profile:', createError)
        return null
      }

      // Create student record if role is student
      if (createdProfile.role === 'student') {
        const studentData = {
          user_id: userId,
          student_id_number: `STU-${userId.substring(0, 8)}`,
          enrollment_date: new Date().toISOString().split('T')[0]
        }

        const { error: studentError } = await supabase
          .from('students')
          .insert(studentData)

        if (studentError) {
          console.error('❌ Failed to create student record:', studentError)
        } else {
          console.log('✅ Student record created successfully')
        }
      }

      // Create teacher record if role is teacher
      if (createdProfile.role === 'teacher') {
        const teacherData = {
          user_id: userId,
          employee_id_number: `EMP-${userId.substring(0, 8)}`,
          hire_date: new Date().toISOString().split('T')[0]
        }

        const { error: teacherError } = await supabase
          .from('teachers')
          .insert(teacherData)

        if (teacherError) {
          console.error('❌ Failed to create teacher record:', teacherError)
        } else {
          console.log('✅ Teacher record created successfully')
        }
      }

      console.log('✅ Profile created successfully:', createdProfile.email)
      return createdProfile
    }

    // For other errors, log and return null
    console.error('❌ Profile fetch error:', fetchError)
    return null

  } catch (error) {
    console.error('💥 Network error fetching profile:', error)
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { toast } = useToast()

  // Refresh profile function
  const refreshProfile = async () => {
    if (!session?.user?.id) return

    console.log('🔄 Refreshing profile...')
    const userProfile = await fetchUserProfile(session.user.id)
    setProfile(userProfile)
  }

  // Handle session changes
  const handleSessionChange = useCallback(async (newSession: Session | null) => {
    console.log('🔄 Session changed:', !!newSession)
    setSession(newSession)

    if (newSession?.user) {
      // Evita buscar perfil novamente se já estamos tentando
      if (profileFetchAttempted && profile) {
        console.log('⏭️ Profile already fetched, skipping...')
        return
      }

      setProfileFetchAttempted(false)

      // Fetch profile for authenticated user with robust retry
      let userProfile = null
      const maxRetries = 3

      for (let i = 0; i < maxRetries; i++) {
        userProfile = await fetchUserProfile(newSession.user.id)
        if (userProfile) break

        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000
          console.log(`🔄 Profile fetch attempt ${i + 1} failed, retrying in ${delay / 1000}s...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      setProfile(userProfile)
      setProfileFetchAttempted(true)

      // Only log the result
      if (!userProfile) {
        console.warn('⚠️ Failed to create or fetch user profile after multiple retries')
      } else {
        console.log('✅ User authenticated with profile:', userProfile.email)
      }
    } else {
      // Clear profile for unauthenticated state
      setProfile(null)
      setProfileFetchAttempted(false)
      console.log('🔓 User logged out, profile cleared')
    }
  }, [profile, profileFetchAttempted])

  // Initialize auth
  useEffect(() => {
    let mounted = true
    let refreshInterval: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing authentication...')

        // Get initial session with shorter timeout (5s is enough)
        const { data: { session: initialSession } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Auth timeout')), 5000)
          )
        ])

        if (!mounted) return

        console.log('📋 Initial session:', !!initialSession)
        await handleSessionChange(initialSession)

        // Set up token refresh check every 5 minutes
        if (initialSession) {
          refreshInterval = setInterval(async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            if (currentSession) {
              const expiresAt = currentSession.expires_at
              const now = Math.floor(Date.now() / 1000)

              // Refresh if less than 10 minutes until expiration
              if (expiresAt && (expiresAt - now) < 600) {
                console.log('🔄 Refreshing auth token...')
                await supabase.auth.refreshSession()
              }
            }
          }, 5 * 60 * 1000) // Check every 5 minutes
        }

      } catch (error) {
        if (!mounted) return

        console.error('💥 Auth initialization failed:', error)

        // Don't show toast for timeout on landing page - just continue
        // This is normal when user is not logged in
        const isTimeout = error instanceof Error && error.message.includes('timeout')

        if (!isTimeout) {
          toast({
            title: 'Erro de Conexão',
            description: 'Problemas na conexão. Tente recarregar a página.',
            variant: 'destructive',
          })
        } else {
          console.log('⏭️ Auth timeout (user not logged in) - continuing...')
        }

        // Ensure clean state
        setSession(null)
        setProfile(null)
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('✅ Auth initialization completed')
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        console.log('🔔 Auth event:', event)

        // Ignore duplicate events
        if (event === 'SIGNED_OUT' && !session) {
          console.log('⏭️ Ignoring duplicate SIGNED_OUT event')
          return
        }

        // Handle token refresh
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed successfully')
        }

        // Handle signed out
        if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out')
          if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
          }
        }

        // Handle signed in
        if (event === 'SIGNED_IN' && !refreshInterval) {
          // Set up token refresh check
          refreshInterval = setInterval(async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            if (currentSession) {
              const expiresAt = currentSession.expires_at
              const now = Math.floor(Date.now() / 1000)

              if (expiresAt && (expiresAt - now) < 600) {
                console.log('🔄 Refreshing auth token...')
                await supabase.auth.refreshSession()
              }
            }
          }, 5 * 60 * 1000)
        }

        await handleSessionChange(newSession)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [toast, handleSessionChange])

  // Auth methods
  const signIn = async (email: string, password: string) => {
    console.log('🔐 Signing in user:', email)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Sign in error:', error)
    } else {
      console.log('✅ Sign in successful')
    }

    return { error }
  }

  const signUp = async (email: string, password: string) => {
    console.log('📝 Signing up user:', email)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('❌ Sign up error:', error)
    } else {
      console.log('✅ Sign up successful')
    }

    return { error }
  }

  const signOut = async () => {
    // Prevent multiple simultaneous signOut calls
    if (isSigningOut) {
      console.log('⏸️ SignOut already in progress, skipping...')
      return { error: null }
    }

    // Get stack trace to see who called signOut
    const stack = new Error().stack
    console.log('🚪 Signing out user - Called from:', stack?.split('\n')[2]?.trim())

    setIsSigningOut(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        // Ignore 403 errors - session already ended
        if (error.status !== 403) {
          console.error('❌ Sign out error:', error)
        } else {
          console.log('⚠️ Sign out 403 ignored (session already ended)')
        }
      } else {
        console.log('✅ Sign out successful')
      }

      // Always clear profile on signout attempt
      setProfile(null)
      setProfileFetchAttempted(false)

      return { error }
    } finally {
      // Reset flag after a delay to allow the process to complete
      setTimeout(() => setIsSigningOut(false), 2000)
    }
  }

  const getRedirectPath = () => {
    if (!profile) return '/login'

    switch (profile.role) {
      case 'administrator':
        return '/admin'
      case 'teacher':
        return '/admin' // Teachers also go to admin area for content management
      case 'student':
      default:
        return '/dashboard'
    }
  }

  const value = {
    user: session?.user ?? null,
    session,
    profile,
    signIn,
    signUp,
    signOut,
    loading,
    profileFetchAttempted,
    refreshProfile,
    getRedirectPath,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}