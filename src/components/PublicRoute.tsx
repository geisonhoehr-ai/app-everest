import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { PageLoader } from '@/components/PageLoader'

/**
 * Simplified Public Route Component
 *
 * Handles public routes that should redirect authenticated users
 * to their appropriate dashboard.
 */
export const PublicRoute = () => {
  const { isAuthenticated, loading, getRedirectPath } = useAuth()

  // Show loading while determining authentication state
  if (loading) {
    return <PageLoader />
  }

  // Redirect authenticated users to their dashboard
  if (isAuthenticated) {
    const redirectPath = getRedirectPath()
    return <Navigate to={redirectPath} replace />
  }

  // Render public content for unauthenticated users
  return <Outlet />
}