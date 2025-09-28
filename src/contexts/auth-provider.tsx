import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { getUserProfile, type UserProfile } from '@/services/userService'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const waitForProfile = async (userId: string, maxAttempts = 5, baseDelay = 2000): Promise<UserProfile | null> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const profile = await Promise.race([
          getUserProfile(userId),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
          )
        ])

        if (profile) {
          return profile
        }
      } catch (error) {
        console.warn(`Profile fetch attempt ${attempt} failed:`, error)
      }

      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return null
  }

  useEffect(() => {
    const fetchSessionAndProfile = async (currentSession: Session | null) => {
      if (currentSession?.user) {
        try {
          // Wait for profile with retry logic - the database trigger should create it automatically
          const userProfile = await waitForProfile(currentSession.user.id)

          if (userProfile) {
            setProfile(userProfile)
          } else {
            console.warn('Profile not found for user:', currentSession.user.id)
            // Don't force logout, allow user to use the app without profile
            setProfile(null)
          }
        } catch (error) {
          console.error('Error loading profile:', error)
          // Don't force logout on profile errors, allow user to continue
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    }

    const initializeAuth = async () => {
      try {
        // Add timeout to auth initialization
        const {
          data: { session: initialSession },
        } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Auth initialization timeout')), 15000)
          )
        ])

        setSession(initialSession)
        await fetchSessionAndProfile(initialSession)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setSession(null)
        setProfile(null)

        // Show user-friendly error message
        toast({
          title: 'Erro de Conexão',
          description: 'Não foi possível conectar com o servidor. Continuando sem autenticação.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      await fetchSessionAndProfile(newSession)
      // Loading is already false from initializeAuth
    })

    return () => subscription.unsubscribe()
  }, [toast])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setProfile(null)
    return { error }
  }

  const value = {
    user: session?.user ?? null,
    session,
    profile,
    signIn,
    signUp,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { useAuth }
