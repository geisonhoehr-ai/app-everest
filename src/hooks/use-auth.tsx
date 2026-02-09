import { useAuth as useAuthContext } from '@/contexts/auth-provider'

/**
 * Enhanced Auth Hook with Additional Utilities
 *
 * This hook provides a clean interface to the auth system
 * with additional helper functions and computed properties.
 */

export const useAuth = () => {
  const auth = useAuthContext()

  // Computed properties for convenience
  const isAuthenticated = !!auth.session && !!auth.profile
  const isLoading = auth.loading
  const isAdmin = auth.profile?.role === 'administrator'
  const isTeacher = auth.profile?.role === 'teacher'
  const isStudent = auth.profile?.role === 'student'

  // Helper functions
  const hasRole = (role: string | string[]) => {
    if (!auth.profile) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(auth.profile.role)
  }

  const hasPermission = (requiredRoles: string[]) => {
    return hasRole(requiredRoles)
  }

  const getDisplayName = () => {
    if (!auth.profile) return 'Usuário'
    return `${auth.profile.first_name} ${auth.profile.last_name}`.trim() || auth.profile.email
  }

  const getInitials = () => {
    if (!auth.profile) return 'U'
    const first = auth.profile.first_name?.[0] || ''
    const last = auth.profile.last_name?.[0] || ''
    return (first + last).toUpperCase() || auth.profile.email[0].toUpperCase()
  }

  const getUserId = () => auth.profile?.id || null

  const getRedirectPath = () => {
    if (!auth.profile) return '/login'

    const role = auth.profile.role.toLowerCase()

    // Handle specific admin paths
    if (role === 'administrator' || role === 'admin') {
      return '/admin'
    }

    // Teachers go to admin area for content management
    if (role === 'teacher') {
      return '/admin' // Or /dashboard if they have a student view too, but usually admin
    }

    // Default student path
    return '/dashboard'
  }

  return {
    // Original auth properties
    ...auth,

    // Computed properties
    isAuthenticated,
    isLoading,
    isAdmin,
    isTeacher,
    isStudent,

    // Helper functions
    hasRole,
    hasPermission,
    getDisplayName,
    getInitials,
    getUserId,
    getRedirectPath,
  }
}

/**
 * Hook for requiring authentication
 * Throws error if used outside authenticated context
 */
export const useRequireAuth = () => {
  const auth = useAuth()

  if (!auth.isAuthenticated && !auth.isLoading) {
    throw new Error('Authentication required')
  }

  return auth
}

/**
 * Hook for requiring specific roles
 */
export const useRequireRole = (requiredRoles: string | string[]) => {
  const auth = useRequireAuth()
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

  if (!auth.hasRole(roles)) {
    throw new Error(`Role required: ${roles.join(' or ')}`)
  }

  return auth
}