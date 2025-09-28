import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type NotificationInsert =
  Database['public']['Tables']['notifications']['Insert']

export const createNotification = async (notification: NotificationInsert) => {
  const { error } = await supabase.from('notifications').insert(notification)
  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}
