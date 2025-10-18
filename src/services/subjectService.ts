import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type SubjectWithTopicCount =
  Database['public']['Tables']['subjects']['Row'] & {
    topics: Array<{
      id: string
      name: string
      description: string
      flashcard_count?: number
    }>
  }

export const getSubjects = async (): Promise<SubjectWithTopicCount[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select(
      `
      *,
      topics (
        id,
        name,
        description,
        flashcards (count)
      )
    `,
    )
    // Removido filtro .in('name', ['Português', 'Regulamentos']) para mostrar TODAS as matérias
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching subjects:', error)
    throw error
  }

  // Transformar os dados para incluir contagem de flashcards
  return data?.map(subject => ({
    ...subject,
    topics: subject.topics?.map(topic => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      flashcard_count: topic.flashcards?.[0]?.count || 0
    })) || []
  })) as SubjectWithTopicCount[] || []
}
