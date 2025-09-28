import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type Flashcard = Database['public']['Tables']['flashcards']['Row']
export type Subject = Database['public']['Tables']['subjects']['Row']
export type TopicWithCardCount =
  Database['public']['Tables']['topics']['Row'] & {
    flashcards: { count: number }[]
  }
export type TopicWithSubjectAndCards =
  Database['public']['Tables']['topics']['Row'] & {
    subjects: Pick<
      Database['public']['Tables']['subjects']['Row'],
      'name'
    > | null
    flashcards: Flashcard[]
  }

export interface SessionCardDetail extends Flashcard {
  userAnswer: 'correct' | 'incorrect'
}

export interface FlashcardSession {
  id: string
  date: string
  subjectName: string
  topicTitle: string
  mode: string
  totalCards: number
  correct: number
  incorrect: number
  details?: SessionCardDetail[]
}

export interface SaveSessionPayload {
  topicId: string
  mode: string
  totalCards: number
  correct: number
  incorrect: number
}

export const getSubjectById = async (
  subjectId: string,
): Promise<Subject | null> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single()

  if (error) {
    console.error('Error fetching subject:', error)
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export const getTopicsBySubjectId = async (
  subjectId: string,
): Promise<TopicWithCardCount[]> => {
  const { data, error } = await supabase
    .from('topics')
    .select(
      `
      *,
      flashcards ( count )
    `,
    )
    .eq('subject_id', subjectId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching topics:', error)
    throw error
  }

  return data as TopicWithCardCount[]
}

export const getTopicWithCards = async (
  topicId: string,
): Promise<TopicWithSubjectAndCards | null> => {
  const { data, error } = await supabase
    .from('topics')
    .select(
      `
      *,
      subjects ( name ),
      flashcards ( * )
    `,
    )
    .eq('id', topicId)
    .single()

  if (error) {
    console.error('Error fetching topic with cards:', error)
    return null
  }
  return data as TopicWithSubjectAndCards
}

export const getFlashcardSessionHistory = async (): Promise<
  FlashcardSession[]
> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('flashcard_session_history')
    .select(
      `
      id,
      started_at,
      session_mode,
      cards_reviewed,
      correct_answers,
      incorrect_answers,
      topics (
        name,
        subjects ( name )
      )
    `,
    )
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching session history:', error)
    throw error
  }

  return data.map((session: any) => ({
    id: session.id,
    date: session.started_at,
    subjectName: session.topics?.subjects?.name || 'Desconhecido',
    topicTitle: session.topics?.name || 'Desconhecido',
    mode: session.session_mode,
    totalCards: session.cards_reviewed || 0,
    correct: session.correct_answers || 0,
    incorrect: session.incorrect_answers || 0,
  }))
}

export const getFlashcardSessionDetails = async (
  sessionId: string,
): Promise<FlashcardSession | null> => {
  const { data: session, error } = await supabase
    .from('flashcard_session_history')
    .select(
      `
      *,
      topics (
        name,
        subjects ( name ),
        flashcards ( * )
      )
    `,
    )
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    console.error('Error fetching session details:', error)
    return null
  }

  const sessionSummary: FlashcardSession = {
    id: session.id,
    date: session.started_at,
    subjectName: session.topics?.subjects?.name || 'Desconhecido',
    topicTitle: session.topics?.name || 'Desconhecido',
    mode: session.session_mode,
    totalCards: session.cards_reviewed || 0,
    correct: session.correct_answers || 0,
    incorrect: session.incorrect_answers || 0,
  }

  const cards = (session.topics?.flashcards as Flashcard[]) || []
  const details: SessionCardDetail[] = cards.map((card, index) => ({
    ...card,
    userAnswer:
      index < (session.correct_answers || 0) ? 'correct' : 'incorrect',
  }))

  return { ...sessionSummary, details }
}

export const saveFlashcardSession = async (
  sessionData: SaveSessionPayload,
): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('flashcard_session_history')
    .insert({
      user_id: user.id,
      topic_id: sessionData.topicId,
      session_mode: sessionData.mode,
      cards_reviewed: sessionData.totalCards,
      correct_answers: sessionData.correct,
      incorrect_answers: sessionData.incorrect,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Error saving flashcard session:', error)
    throw error
  }

  return data.id
}

export const updateFlashcardProgress = async (
  flashcardId: string,
  quality: number,
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('flashcard_progress').upsert(
    {
      user_id: user.id,
      flashcard_id: flashcardId,
      quality,
      last_reviewed_at: new Date().toISOString(),
      next_review_at: new Date(Date.now() + 86400000 * quality).toISOString(),
    },
    { onConflict: 'user_id,flashcard_id' },
  )

  if (error) {
    console.error('Error updating flashcard progress:', error)
    throw error
  }
}

export const getDifficultFlashcardsForTopic = async (
  topicId: string,
): Promise<Flashcard[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('flashcard_progress')
    .select('flashcards!inner(*)')
    .eq('user_id', user.id)
    .eq('flashcards.topic_id', topicId)
    .lte('quality', 2)

  if (error) {
    console.error('Error fetching difficult flashcards:', error)
    throw error
  }

  return data.map((item) => item.flashcards).filter(Boolean) as Flashcard[]
}
