import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type BaseProfile = Database['public']['Tables']['users']['Row']
type StudentProfileData = Database['public']['Tables']['students']['Row']
type TeacherProfileData = Database['public']['Tables']['teachers']['Row']

export type UserProfile = BaseProfile & {
  student?: StudentProfileData
  teacher?: TeacherProfileData
}

export const getUserProfile = async (
  userId: string,
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        *,
        students(*),
        teachers(*)
      `,
      )
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user profile:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }

    if (!data) {
      console.warn('User profile not found for userId:', userId)
      return null
    }

    const profileData = {
      ...data,
      student: Array.isArray(data.students) ? data.students[0] : data.students,
      teacher: Array.isArray(data.teachers) ? data.teachers[0] : data.teachers,
    }
    delete (profileData as any).students
    delete (profileData as any).teachers

    return profileData
  } catch (error) {
    console.error('Network error fetching user profile:', error)
    throw error
  }
}
