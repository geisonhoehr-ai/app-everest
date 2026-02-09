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

  // Buscar perfil do usuário
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  console.log('👤 User profile:', { role: userProfile?.role })

  // Buscar turmas do aluno (se for aluno)
  let userClassIds: string[] = []
  if (userProfile?.role === 'student') {
    const { data: studentClasses } = await supabase
      .from('student_classes')
      .select('class_id')
      .eq('user_id', user.id)

    userClassIds = studentClasses?.map(sc => sc.class_id) || []
    console.log('📚 Student classes:', userClassIds)
  }

  // Buscar eventos do mês
  let query = supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', firstDayOfMonth)
    .lte('start_time', lastDayOfMonth)

  // Se for aluno, filtrar por:
  // - Eventos das turmas do aluno
  // - OU eventos globais (class_id NULL)
  if (userProfile?.role === 'student') {
    if (userClassIds.length > 0) {
      console.log('📚 Filtering events for student classes or global events')
      query = query.or(`class_id.in.(${userClassIds.join(',')}),class_id.is.null`)
    } else {
      // Se aluno não tem turma, ver apenas eventos globais
      console.log('📚 Student has no class, showing only global events')
      query = query.is('class_id', null)
    }
  }
  // Professores e admins veem TODOS os eventos (sem filtro)

  query = query.order('start_time', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('❌ Error fetching calendar events:', error)
    throw new Error('Não foi possível carregar os eventos do calendário.')
  }

  console.log('✅ Found calendar events:', data?.length || 0)

  return data || []
}

export const createEvent = async (event: {
  title: string
  description?: string
  start_time: string
  end_time?: string
  event_type: 'LIVE_CLASS' | 'ESSAY_DEADLINE' | 'SIMULATION' | 'GENERAL'
  class_id?: string | null
}): Promise<CalendarEvent> => {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .single()

  if (error) {
    console.error('Error creating calendar event:', error)
    throw error
  }
  return data
}

export const deleteEvent = async (eventId: string): Promise<void> => {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting calendar event:', error)
    throw error
  }
}
