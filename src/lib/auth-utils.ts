import { supabase } from '@/lib/supabase/client'

/**
 * Validates if the given userId matches the current authenticated user.
 * This prevents horizontal privilege escalation where a user can pass another user's ID
 * to fetch or modify data.
 * 
 * @param userId The ID to validate
 * @returns An object with success status and user data
 */
export async function validateUser(userId: string): Promise<{ success: boolean; error?: string; user?: any }> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: 'User not authenticated' }
    }

    // If userId is provided, it must match the authenticated user's ID
    // OR the current user must have a role that allows managing other users (handled in RLS usually)
    // But purely for client-side service protection:
    if (userId && user.id !== userId) {
        return { success: false, error: 'Unauthorized: User ID mismatch' }
    }

    return { success: true, user }
}

/**
 * Gets the current user ID or throws an error if not authenticated.
 */
export async function getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        throw new Error('User not authenticated')
    }
    return user.id
}
