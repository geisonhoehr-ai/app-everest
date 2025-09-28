import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type User = Database['public']['Tables']['users']['Row']

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*')
  if (error) throw error
  return data
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
