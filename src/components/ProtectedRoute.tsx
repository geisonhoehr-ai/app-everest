import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-provider'
import { type UserProfile } from '@/services/userService'
import { PageLoader } from '@/components/PageLoader'

interface ProtectedRouteProps {
  allowedRoles: Array<UserProfile['role']>
}

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

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoader />
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.includes(profile.role)) {
    return <Outlet />
  }

  const redirectTo = getDashboardRouteByRole(profile.role)
  return <Navigate to={redirectTo} state={{ from: location }} replace />
}
