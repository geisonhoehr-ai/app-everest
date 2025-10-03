import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { getMonth, getYear } from 'date-fns'

export type CalendarEvent =
  Database['public']['Tables']['calendar_events']['Row']

export const getCalendarEvents = async (
  date: Date,
): Promise<CalendarEvent[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const year = getYear(date)
  const month = getMonth(date)

  const firstDayOfMonth = new Date(year, month, 1).toISOString()
  const lastDayOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  // Buscar todos os eventos do mês (RLS cuida das permissões)
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', firstDayOfMonth)
    .lte('start_time', lastDayOfMonth)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching calendar events:', error)
    throw new Error('Não foi possível carregar os eventos do calendário.')
  }

  return data || []
}
