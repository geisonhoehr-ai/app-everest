import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type User = Database['public']['Tables']['users']['Row']

export const getUsers = async (): Promise<User[]> => {
  console.log('🔍 Fetching users from Supabase...')
  
  // Verificar se o usuário está autenticado
  const { data: session } = await supabase.auth.getSession()
  console.log('👤 Current session:', session?.session?.user?.email || 'Not authenticated')
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching users:', error)
    throw error
  }
  
  console.log('✅ Users fetched successfully:', data?.length || 0, 'users')
  return data || []
}

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    console.error(error)
    return null
  }
  return data
}

export const updateUser = async (
  id: string,
  updates: Partial<User>,
): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.error(error)
    return null
  }
  return data
}

export const getUserClasses = async (userId: string) => {
  const { data, error } = await supabase
    .from('student_classes')
    .select(`
      id,
      user_id,
      class_id,
      enrolled_at,
      class:classes!class_id (
        id,
        name,
        description,
        status,
        start_date,
        end_date
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching user classes:', error)
    throw error
  }

  return data || []
}

export const addUserToClass = async (userId: string, classId: string) => {
  const { error } = await supabase
    .from('student_classes')
    .insert({
      user_id: userId,
      class_id: classId
    })

  if (error) {
    console.error('Error adding user to class:', error)
    throw error
  }
}

export const removeUserFromClass = async (studentClassId: string) => {
  const { error } = await supabase
    .from('student_classes')
    .delete()
    .eq('id', studentClassId)

  if (error) {
    console.error('Error removing user from class:', error)
    throw error
  }
}
