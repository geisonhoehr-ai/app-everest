import { supabase } from '@/lib/supabase/client'
import type { UserProfile } from '@/contexts/auth-provider'

/**
 * Simplified User Service
 *
 * This service works with a unified view that combines user data
 * with student/teacher specific information in a single query.
 *
 * Benefits:
 * - Single query instead of 3 separate ones
 * - Better performance and reliability
 * - Simplified error handling
 * - Consistent data structure
 */

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser || currentUser.id !== userId) {
      console.warn(`Unauthorized profile access attempt for userId: ${userId}`)
      return null
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at,
        student_id_number,
        employee_id_number,
        department,
        enrollment_date,
        hire_date
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching user profile:', error)
      return null
    }

    if (!data) {
      console.warn('⚠️ User profile not found for:', userId)
      return null
    }

    return data
  } catch (error) {
    console.error('💥 Network error fetching user profile:', error)
    return null
  }
}

export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('❌ Error updating user profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('💥 Network error updating user profile:', error)
    return { success: false, error: 'Network error' }
  }
}

export const getUsersByRole = async (role: UserProfile['role']): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at,
        student_id_number,
        employee_id_number,
        department,
        enrollment_date,
        hire_date
      `)
      .eq('role', role)
      .eq('is_active', true)
      .order('first_name')

    if (error) {
      console.error('❌ Error fetching users by role:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Network error fetching users by role:', error)
    return []
  }
}

export const searchUsers = async (query: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at,
        student_id_number,
        employee_id_number,
        department,
        enrollment_date,
        hire_date
      `)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('is_active', true)
      .order('first_name')
      .limit(50)

    if (error) {
      console.error('❌ Error searching users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('💥 Network error searching users:', error)
    return []
  }
}

// Export the UserProfile type for use in other components
export type { UserProfile }