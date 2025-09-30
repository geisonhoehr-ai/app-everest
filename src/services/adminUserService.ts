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
