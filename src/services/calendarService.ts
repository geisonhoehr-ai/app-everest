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

  const { data: studentClass, error: classError } = await supabase
    .from('student_classes')
    .select('class_id')
    .eq('user_id', user.id)
    .single()

  if (classError && classError.code !== 'PGRST116') {
    console.error('Error fetching user class:', classError)
  }

  const classId = studentClass?.class_id

  const year = getYear(date)
  const month = getMonth(date)

  const firstDayOfMonth = new Date(year, month, 1).toISOString()
  const lastDayOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const query = supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', firstDayOfMonth)
    .lte('start_time', lastDayOfMonth)
    .or(
      classId ? `class_id.eq.${classId},class_id.is.null` : 'class_id.is.null',
    )

  const { data, error } = await query

  if (error) {
    console.error('Error fetching calendar events:', error)
    throw new Error('Não foi possível carregar os eventos do calendário.')
  }

  return data
}
