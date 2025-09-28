import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-provider'
import { PageLoader } from '@/components/PageLoader'
import type { UserProfile } from '@/services/userService'

const getDashboardRouteByRole = (role: UserProfile['role']) => {
  switch (role) {
    case 'administrator':
      return '/admin'
    case 'teacher':
    case 'student':
    default:
      return '/dashboard'
  }
}

export const PublicRoute = () => {
  const { profile, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (profile) {
    const redirectTo = getDashboardRouteByRole(profile.role)
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
