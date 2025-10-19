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

  console.log('🔍 Fetching calendar events for user:', user.id)

  const year = getYear(date)
  const month = getMonth(date)

  const firstDayOfMonth = new Date(year, month, 1).toISOString()
  const lastDayOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  // Buscar perfil do usuário para pegar sua turma
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('class_id, role')
    .eq('id', user.id)
    .single()

  console.log('👤 User profile:', { class_id: profile?.class_id, role: profile?.role })

  // Buscar eventos do mês
  let query = supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', firstDayOfMonth)
    .lte('start_time', lastDayOfMonth)

  // Se for aluno, filtrar por turma
  if (profile?.role === 'student' && profile?.class_id) {
    console.log('📚 Filtering events for student class:', profile.class_id)
    query = query.eq('class_id', profile.class_id)
  }

  query = query.order('start_time', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('❌ Error fetching calendar events:', error)
    throw new Error('Não foi possível carregar os eventos do calendário.')
  }

  console.log('✅ Found calendar events:', data?.length || 0)

  return data || []
}
