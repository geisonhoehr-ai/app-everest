import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { logger } from '@/lib/logger'

export type User = Database['public']['Tables']['users']['Row']

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    logger.error('❌ Error fetching users:', error)
    throw error
  }
  
  return data || []
}

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    logger.error(error)
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
    logger.error(error)
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
    logger.error('Error fetching user classes:', error)
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
    logger.error('Error adding user to class:', error)
    throw error
  }
}

export const removeUserFromClass = async (studentClassId: string) => {
  const { error } = await supabase
    .from('student_classes')
    .delete()
    .eq('id', studentClassId)

  if (error) {
    logger.error('Error removing user from class:', error)
    throw error
  }
}

/**
 * Busca todos os usuários com informações das turmas
 * Inclui um campo booleano indicando se está na turma Degustação
 */
export interface UserWithClasses extends User {
  classes?: Array<{
    id: string
    name: string
    class_type: string
  }>
  isInTastingClass?: boolean
}

export const getUsersWithClasses = async (): Promise<UserWithClasses[]> => {
  // Buscar todos os usuários
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (usersError) {
    logger.error('❌ Error fetching users:', usersError)
    throw usersError
  }

  if (!users || users.length === 0) {
    return []
  }

  // Buscar turmas de todos os usuários
  const { data: studentClasses, error: classesError } = await supabase
    .from('student_classes')
    .select(`
      user_id,
      classes!inner (
        id,
        name,
        class_type
      )
    `)

  if (classesError) {
    logger.error('❌ Error fetching student classes:', classesError)
    // Continuar mesmo com erro, retornando usuários sem informação de turmas
  }

  // Mapear turmas por user_id
  const classesMap = new Map<string, Array<{ id: string; name: string; class_type: string }>>()

  if (studentClasses) {
    studentClasses.forEach((sc: any) => {
      const userId = sc.user_id
      const classInfo = sc.classes

      if (!classesMap.has(userId)) {
        classesMap.set(userId, [])
      }
      classesMap.get(userId)?.push(classInfo)
    })
  }

  // Combinar dados
  const usersWithClasses: UserWithClasses[] = users.map(user => {
    const userClasses = classesMap.get(user.id) || []
    const isInTastingClass = userClasses.some(c =>
      c.name.toLowerCase().includes('degustação') ||
      c.name.toLowerCase().includes('degustacao')
    )

    return {
      ...user,
      classes: userClasses,
      isInTastingClass
    }
  })

  return usersWithClasses
}
