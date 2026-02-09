import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type SubjectWithTopicCount =
  Database['public']['Tables']['subjects']['Row'] & {
    topics: Array<{
      id: string
      name: string
      description: string
      flashcard_count?: number
    }>
    progress?: number // Added progress field
  }

export const getSubjects = async (): Promise<SubjectWithTopicCount[]> => {
  return getSubjectsWithProgress(null)
}

export const getSubjectsWithProgress = async (userId: string | null): Promise<SubjectWithTopicCount[]> => {
  try {
    // 1. Fetch Subjects structure
    const { data, error } = await supabase
      .from('subjects')
      .select(`
            *,
            topics (
                id,
                name,
                description,
                flashcards (count)
            )
        `)
      .order('name', { ascending: true })

    if (error) throw error

    let subjects = data?.map(subject => ({
      ...subject,
      topics: subject.topics?.map(topic => ({
        id: topic.id,
        name: topic.name,
        description: topic.description,
        flashcard_count: topic.flashcards?.[0]?.count || 0
      })) || []
    })) as SubjectWithTopicCount[] || []

    // 2. If no user, return with 0 progress
    if (!userId) {
      return subjects.map(s => ({ ...s, progress: 0 }))
    }

    // 3. Fetch Flashcard Progress
    // We need to map flashcard_id to topic_id to subject_id
    // First, fetch all flashcards mapping
    const { data: allCards, error: cardsError } = await supabase
      .from('flashcards')
      .select('id, topic_id')

    if (cardsError) throw cardsError

    // Build map: flashcardId -> topicId
    const cardTopicMap = new Map<string, string>()
    allCards?.forEach(card => cardTopicMap.set(card.id, card.topic_id))

    // Build map: topicId -> subjectId
    const topicSubjectMap = new Map<string, string>()
    subjects.forEach(s => s.topics.forEach(t => topicSubjectMap.set(t.id, s.id)))

    // Fetch user progress
    const { data: userProgress, error: progressError } = await supabase
      .from('flashcard_progress')
      .select('flashcard_id, repetitions')
      .eq('user_id', userId)

    if (progressError) throw progressError

    // 4. Calculate Progress per Subject
    const subjectStats = new Map<string, { total: number, learned: number }>()

    // Initialize stats
    subjects.forEach(s => {
      const totalCards = s.topics.reduce((sum, t) => sum + (t.flashcard_count || 0), 0)
      subjectStats.set(s.id, { total: totalCards, learned: 0 })
    })

    // Count learned cards
    userProgress?.forEach(p => {
      if (p.repetitions > 0) { // Considered learned if reviewed at least once
        const topicId = cardTopicMap.get(p.flashcard_id)
        if (topicId) {
          const subjectId = topicSubjectMap.get(topicId)
          if (subjectId) {
            const stats = subjectStats.get(subjectId)
            if (stats) {
              stats.learned += 1
            }
          }
        }
      }
    })

    // 5. Attach progress to subjects
    return subjects.map(s => {
      const stats = subjectStats.get(s.id)
      const progress = stats && stats.total > 0
        ? Math.round((stats.learned / stats.total) * 100)
        : 0
      return { ...s, progress }
    })

  } catch (error) {
    console.error('Error in getSubjectsWithProgress:', error)
    return []
  }
}
