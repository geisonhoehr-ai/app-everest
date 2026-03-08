import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { PageLoader } from '@/components/PageLoader'

/**
 * Public Route Component
 *
 * Handles public routes that should redirect authenticated users
 * to their appropriate dashboard. Includes a safety timeout to
 * prevent infinite spinner if auth loading hangs.
 */
export const PublicRoute = () => {
  const { isAuthenticated, loading, getRedirectPath } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  // Safety timeout: if loading takes more than 5 seconds on a public route,
  // stop waiting and show the public content (login/register form).
  // This prevents infinite spinner when auth initialization hangs.
  useEffect(() => {
    if (!loading) return

    const timer = setTimeout(() => {
      setTimedOut(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [loading])

  // Show loading briefly while determining authentication state,
  // but don't hang forever
  if (loading && !timedOut) {
    return <PageLoader />
  }

  // Redirect authenticated users to their dashboard
  if (isAuthenticated) {
    const redirectPath = getRedirectPath()
    return <Navigate to={redirectPath} replace />
  }

  // Render public content for unauthenticated users (or if timed out)
  return <Outlet />
}
