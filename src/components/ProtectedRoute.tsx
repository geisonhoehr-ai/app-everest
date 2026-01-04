import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { PageLoader } from '@/components/PageLoader'
import type { UserProfile } from '@/contexts/auth-provider'

interface ProtectedRouteProps {
  allowedRoles: Array<UserProfile['role']>
  redirectTo?: string
}

/**
 * Simplified Protected Route Component
 *
 * Much cleaner and more reliable than the previous version.
 * Handles all edge cases properly and provides clear feedback.
 */
export const ProtectedRoute = ({ allowedRoles, redirectTo }: ProtectedRouteProps) => {
  const { profile, loading, session, profileFetchAttempted, getRedirectPath } = useAuth()
  const location = useLocation()

  // Show loading while authentication is being determined
  if (loading) {
    return <PageLoader />
  }

  // If we have a session but profile hasn't been attempted yet, keep loading
  if (session && !profileFetchAttempted) {
    return <PageLoader />
  }

  // Redirect to login if not authenticated (no session at all)
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // At this point we have session, fetch was attempted, but profile is null
  // This means the profile fetch failed after retries
  if (!profile) {
    console.warn('⚠️ Profile failed to load')
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Erro ao carregar perfil</h2>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar seus dados de perfil. Tente recarregar a página.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Recarregar Página
        </button>
      </div>
    )
  }

  // Check if user has required role
  if (allowedRoles.includes(profile.role)) {
    return <Outlet />
  }

  // Redirect to appropriate dashboard if user doesn't have required role
  const fallbackPath = redirectTo || getRedirectPath()

  // Prevent infinite redirect loops
  if (location.pathname === fallbackPath) {
    console.warn('⚠️ Infinite redirect loop detected in ProtectedRoute')
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground mb-4">
          Você não tem permissão para acessar esta página e não foi possível redirecioná-lo.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 border rounded-md hover:bg-muted"
          >
            Voltar para Login
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Ir para Início
          </button>
        </div>
      </div>
    )
  }

  return <Navigate to={fallbackPath} state={{ from: location }} replace />
}

/**
 * Admin Only Route - Convenience component for admin routes
 */
export const AdminRoute = () => {
  return <ProtectedRoute allowedRoles={['administrator']} />
}

/**
 * Teacher Route - For teacher and admin access
 */
export const TeacherRoute = () => {
  return <ProtectedRoute allowedRoles={['teacher', 'administrator']} />
}

/**
 * Student Route - For all authenticated users
 */
export const StudentRoute = () => {
  return <ProtectedRoute allowedRoles={['student', 'teacher', 'administrator']} />
}