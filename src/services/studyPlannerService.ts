import { supabase } from '@/lib/supabase/client'

export type StudyTopic = {
  id: string
  title: string
  category: 'portugues' | 'redacao' | 'matematica' | 'raciocinio-logico' | 'direito-constitucional' | 'direito-administrativo' | 'direito-penal' | 'direito-civil' | 'informatica' | 'atualidades' | 'conhecimentos-gerais' | 'ingles' | 'historia' | 'geografia' | 'legislacao' | 'outros'
  type: 'teoria' | 'exercicios' | 'pratica' | 'revisao'
  status: 'pending' | 'in-progress' | 'completed'
  pomodoros: number
  user_id: string
  created_at: string
  updated_at?: string
}

export type PomodoroSession = {
  id: string
  user_id: string
  topic_id?: string
  topic_title: string
  duration_minutes: number
  completed: boolean
  created_at: string
}

export async function getStudyTopics(userId: string): Promise<StudyTopic[]> {
  const { data, error } = await supabase
    .from('study_topics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createStudyTopic(topic: Omit<StudyTopic, 'id' | 'created_at'>): Promise<StudyTopic> {
  const { data, error } = await supabase
    .from('study_topics')
    .insert([topic])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStudyTopic(id: string, updates: Partial<StudyTopic>): Promise<StudyTopic> {
  const { data, error } = await supabase
    .from('study_topics')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteStudyTopic(id: string): Promise<void> {
  const { error } = await supabase
    .from('study_topics')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getPomodoroSessions(userId: string, limit?: number): Promise<PomodoroSession[]> {
  let query = supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function createPomodoroSession(
  session: Omit<PomodoroSession, 'id' | 'created_at'>
): Promise<PomodoroSession> {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert([session])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function incrementTopicPomodoros(topicId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_topic_pomodoros', {
    topic_id: topicId
  })

  if (error) throw error
}

export async function getStudyStats(userId: string) {
  const { data, error } = await supabase.rpc('get_study_stats', {
    user_id: userId
  })

  if (error) throw error
  return data
}

