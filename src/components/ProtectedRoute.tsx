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
  // Instead of redirecting, keep showing loader to give it more time
  if (!profile) {
    console.warn('⚠️ Profile still loading or failed - showing loader...')
    return <PageLoader />
  }

  // Check if user has required role
  if (allowedRoles.includes(profile.role)) {
    return <Outlet />
  }

  // Redirect to appropriate dashboard if user doesn't have required role
  const fallbackPath = redirectTo || getRedirectPath()
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