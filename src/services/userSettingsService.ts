import { supabase } from '@/lib/supabase/client'
import type { Database, Json } from '@/lib/supabase/types'

export type UserSettings = Database['public']['Tables']['user_settings']['Row']

export const getUserSettings = async (
  userId: string,
): Promise<UserSettings | null> => {
  try {
    // First try without .single() to avoid 406 errors
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .limit(1)

    if (error) {
      // Handle specific error codes
      if (error.code === 'PGRST116') {
        // No rows found - this is normal for new users
        console.log('No user settings found for user:', userId)
        return null
      }

      if (error.code === 'PGRST301' || error.message.includes('relation "user_settings" does not exist')) {
        // Table doesn't exist
        console.warn('user_settings table does not exist, using defaults')
        return null
      }

      if (error.code === '42501' || error.message.includes('permission denied')) {
        // Permission denied - RLS policy issue
        console.warn('Permission denied accessing user_settings, using defaults')
        return null
      }

      // For 406 or other unexpected errors, log but don't break the app
      console.warn('Unable to fetch user settings:', {
        code: error.code,
        message: error.message,
        details: error.details
      })
      return null
    }

    // Return first item or null if array is empty
    return data && data.length > 0 ? data[0] : null
  } catch (networkError) {
    console.warn('Network error fetching user settings:', networkError)
    return null
  }
}

export const saveDashboardLayout = async (
  userId: string,
  layout: Json,
): Promise<UserSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: userId, dashboard_layout: layout },
        { onConflict: 'user_id' },
      )
      .select()
      .single()

    if (error) {
      // Handle specific error cases
      if (error.code === 'PGRST301' || error.message.includes('relation "user_settings" does not exist')) {
        console.warn('user_settings table does not exist, cannot save layout')
        return null
      }

      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.warn('Permission denied saving dashboard layout')
        return null
      }

      console.warn('Unable to save dashboard layout:', {
        code: error.code,
        message: error.message,
        details: error.details
      })
      return null
    }

    return data
  } catch (networkError) {
    console.warn('Network error saving dashboard layout:', networkError)
    return null
  }
}
